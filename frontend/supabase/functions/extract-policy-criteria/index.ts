import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedCriterion {
  extractedStatement: string;
  suggestedMetricKey: string;
  suggestedValue: number;
  suggestedOperator: 'GTE' | 'LTE';
  suggestedSeverity: 'critical' | 'major' | 'minor';
  metricLabel: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentText } = await req.json();
    
    if (!documentText || documentText.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Document text is too short or empty" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a policy analysis expert. Extract quantifiable AI model requirements from policy documents. Respond ONLY with valid JSON.`;
    
    const userPrompt = `From the following policy document, extract exactly 12-15 distinct, quantifiable criteria that could be mapped to AI model metrics.

Available metric types:
- MMLUScore (0-100 scale)
- HumanEvalScore (0-100 scale)
- GovRefusalRate (0-100 scale, percentage)
- SafetyRefusalRate (0-100 scale, percentage)
- ContextWindowLength (tokens, e.g., 128000)
- CoTEnabled (boolean, but express as 0 or 1)
- UpdateFrequency (days, e.g., 90)

For each criterion:
1. Extract the literal statement from the document
2. Suggest the best matching metric key
3. Determine the required value (if explicit in the document)
4. Determine comparison operator (GTE for minimum requirements, LTE for maximum limits)
5. Assign severity (critical/major/minor based on document emphasis)

Document Text:
${documentText.slice(0, 8000)}

Respond with a JSON object containing an array of criteria:
{
  "criteria": [
    {
      "extractedStatement": "string - the literal text from document",
      "suggestedMetricKey": "string - one of the available metric types",
      "suggestedValue": number,
      "suggestedOperator": "GTE" | "LTE",
      "suggestedSeverity": "critical" | "major" | "minor",
      "metricLabel": "string - human readable label"
    }
  ]
}`;

    console.log('Calling AI for criteria extraction...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    
    const result = JSON.parse(jsonContent.trim());
    console.log('Extracted criteria count:', result.criteria?.length);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-policy-criteria function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        criteria: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
