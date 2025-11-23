import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { policyId, modelData } = await req.json();
    
    if (!policyId || !modelData) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Fetch the policy
    const { data: policy, error: policyError } = await supabase
      .from('user_policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (policyError || !policy) {
      console.error('Policy fetch error:', policyError);
      return new Response(
        JSON.stringify({ error: 'Policy not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const criteria = policy.criteria as Record<string, any>;
    const evaluationDetails: Record<string, any> = {};
    let overallStatus = 'PASS';
    let hasFailures = false;
    let hasCriticalFailures = false;

    // Evaluate each criterion
    for (const [metricKey, criterion] of Object.entries(criteria)) {
      const { requiredValue, comparisonOperator, metricLabel, severity } = criterion;
      
      // Find the metric in model data
      const allMetrics = [
        ...(modelData.metrics.safety || []),
        ...(modelData.metrics.performance || []),
        ...(modelData.metrics.governance || [])
      ];
      
      const metric = allMetrics.find((m: any) => m.metricKey === metricKey);
      
      if (!metric) {
        evaluationDetails[metricKey] = {
          status: 'N/A',
          confidenceScore: 0,
          supportingPassage: 'Metric not found in model documentation',
          sourceDocumentLink: modelData.originalSourceURL,
          ambiguityFactors: ['Metric not documented for this model']
        };
        continue;
      }

      const actualValue = typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
      
      // Perform comparison
      let passes = false;
      if (comparisonOperator === 'GTE') {
        passes = actualValue >= requiredValue;
      } else if (comparisonOperator === 'LTE') {
        passes = actualValue <= requiredValue;
      } else {
        passes = actualValue === requiredValue;
      }

      // Determine confidence based on source context quality
      const confidenceScore = metric.sourceContext && metric.sourceContext.length > 50 ? 0.95 : 0.70;
      const ambiguityFactors = confidenceScore < 0.75 
        ? ['Limited documentation context', 'May require manual verification']
        : null;

      evaluationDetails[metricKey] = {
        status: passes ? 'PASS' : 'FAIL',
        confidenceScore,
        supportingPassage: metric.sourceContext || metric.tooltipDescription,
        sourceDocumentLink: modelData.originalSourceURL,
        ambiguityFactors,
        actualValue,
        requiredValue,
        operator: comparisonOperator,
        metricLabel
      };

      if (!passes) {
        hasFailures = true;
        if (severity === 1) {
          hasCriticalFailures = true;
        }
      }
    }

    // Determine overall status
    if (hasCriticalFailures) {
      overallStatus = 'FAIL_CRITICAL';
    } else if (hasFailures) {
      overallStatus = 'WARN_MAJOR';
    }

    const complianceResult = {
      modelId: modelData.id,
      policyId,
      overallStatus,
      evaluationDetails
    };

    // Cache the evaluation result
    const { error: cacheError } = await supabase
      .from('policy_evaluation_cache')
      .upsert({
        policy_id: policyId,
        model_id: modelData.id,
        overall_status: overallStatus,
        evaluation_details: evaluationDetails,
        evaluated_at: new Date().toISOString()
      }, {
        onConflict: 'policy_id,model_id'
      });

    if (cacheError) {
      console.error('Cache error:', cacheError);
    }

    return new Response(
      JSON.stringify(complianceResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in evaluate-compliance function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
