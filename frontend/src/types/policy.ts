export type ComparisonOperator = 'GTE' | 'LTE' | 'EQ';
export type CriterionSeverity = 'critical' | 'major' | 'minor';

export interface ExtractedCriterion {
  extractedStatement: string;
  suggestedMetricKey: string;
  suggestedValue: number;
  suggestedOperator: ComparisonOperator;
  suggestedSeverity: CriterionSeverity;
  metricLabel: string;
}

export interface PolicyCriterion {
  requiredValue: number;
  comparisonOperator: ComparisonOperator;
  metricLabel: string;
  severity: 1 | 2 | 3; // 1=Critical, 2=Major, 3=Minor
}

export interface UserPolicy {
  id: string;
  user_id: string;
  policy_name: string;
  creation_date: string;
  original_source_snippet?: string;
  is_active: boolean;
  criteria: Record<string, PolicyCriterion>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceMetricDetail {
  status: 'PASS' | 'FAIL' | 'N/A';
  confidenceScore: number; // 0.0 to 1.0
  supportingPassage: string;
  sourceDocumentLink: string;
  ambiguityFactors: string[] | null;
  actualValue?: number | string;
  requiredValue?: number;
  operator?: ComparisonOperator;
  metricLabel?: string;
}

export interface ComplianceResult {
  modelId: string;
  policyId: string;
  overallStatus: 'PASS' | 'FAIL_CRITICAL' | 'WARN_MAJOR';
  evaluationDetails: Record<string, ComplianceMetricDetail>;
}

export interface PolicyEvaluationCache {
  id: string;
  policy_id: string;
  model_id: string;
  overall_status: string;
  evaluation_details: Record<string, ComplianceMetricDetail>;
  evaluated_at: string;
  created_at: string;
}
