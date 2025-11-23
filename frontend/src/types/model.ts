export type ModelType = "Closed API" | "Open-weight" | "Mixed";
export type MetricCategory = "safety" | "performance" | "governance";

export interface NormalizedMetric {
  metricKey: string;
  metricLabel: string;
  value: number | string;
  unit: string;
  category: MetricCategory;
  sourceContext: string;
  tooltipDescription: string;
}

export interface NormalizedModel {
  id: string;
  company: string;
  modelName: string;
  modelType: ModelType;
  summary: string;
  originalSourceURL: string;
  documentationType: string;
  trainingDataCutoffDate: string;
  isThirdPartyAudited: boolean;
  updatePolicy: string;
  metrics: {
    safety: NormalizedMetric[];
    performance: NormalizedMetric[];
    governance: NormalizedMetric[];
  };
}
