import { NormalizedModel } from "@/types/model";

export const mockModels: NormalizedModel[] = [
  {
    id: "gpt-4o",
    company: "OpenAI",
    modelName: "GPT-4o",
    modelType: "Closed API",
    summary: "GPT-4o is OpenAI's latest flagship multimodal model with enhanced reasoning capabilities. It achieves state-of-the-art performance across diverse benchmarks while maintaining strong safety guardrails through extensive red-teaming and alignment work.",
    originalSourceURL: "https://openai.com/index/gpt-4o-system-card/",
    documentationType: "System Card (PDF)",
    trainingDataCutoffDate: "October 2024",
    isThirdPartyAudited: true,
    updatePolicy: "Rolling updates with versioning",
    metrics: {
      performance: [
        {
          metricKey: "MMLUScore",
          metricLabel: "MMLU Benchmark Score",
          value: 88.7,
          unit: "%",
          category: "performance",
          sourceContext: "GPT-4o achieves 88.7% on the MMLU benchmark (5-shot, chain-of-thought prompting)",
          tooltipDescription: "Measures accuracy across 57 academic subjects including STEM, humanities, and social sciences"
        },
        {
          metricKey: "HumanEvalScore",
          metricLabel: "HumanEval Code Score",
          value: 90.2,
          unit: "%",
          category: "performance",
          sourceContext: "On the HumanEval coding benchmark, GPT-4o scored 90.2% using pass@1 metric",
          tooltipDescription: "Measures ability to generate functionally correct Python code from docstrings"
        },
        {
          metricKey: "ContextWindowLength",
          metricLabel: "Max Context Window",
          value: 128000,
          unit: "Tokens",
          category: "performance",
          sourceContext: "The model supports a 128k token context window in the API",
          tooltipDescription: "Maximum number of tokens (roughly words) the model can process in a single request"
        }
      ],
      safety: [
        {
          metricKey: "RefusalRate",
          metricLabel: "Harmful Request Refusal Rate",
          value: 98.1,
          unit: "%",
          category: "safety",
          sourceContext: "GPT-4o refused 98.1% of clearly harmful or out-of-scope requests in safety testing",
          tooltipDescription: "Percentage of harmful, unethical, or inappropriate requests that the model correctly refuses to answer"
        },
        {
          metricKey: "JailbreakSuccessRate",
          metricLabel: "Jailbreak Resistance",
          value: 2.3,
          unit: "%",
          category: "safety",
          sourceContext: "Red team adversarial testing showed a 2.3% jailbreak success rate across 10,000+ attempts",
          tooltipDescription: "Lower is better. Percentage of adversarial attacks that successfully bypassed safety guardrails"
        }
      ],
      governance: [
        {
          metricKey: "AuditStatus",
          metricLabel: "Third-Party Safety Audit",
          value: "Completed",
          unit: "Status",
          category: "governance",
          sourceContext: "Independent safety audit completed by external AI safety organization in Q3 2024",
          tooltipDescription: "Whether the model has undergone independent third-party safety evaluation"
        },
        {
          metricKey: "UpdateFrequency",
          metricLabel: "Model Update Cadence",
          value: "Monthly",
          unit: "Frequency",
          category: "governance",
          sourceContext: "Model is updated monthly with improvements and safety enhancements",
          tooltipDescription: "How frequently the model receives updates and improvements"
        }
      ]
    }
  },
  {
    id: "claude-3.5",
    company: "Anthropic",
    modelName: "Claude 3.5 Sonnet",
    modelType: "Closed API",
    summary: "Claude 3.5 Sonnet represents Anthropic's most capable model, excelling at complex reasoning, coding, and nuanced conversation. Built with Constitutional AI principles, it prioritizes safety and transparency while delivering exceptional performance across diverse tasks.",
    originalSourceURL: "https://www.anthropic.com/news/claude-3-5-sonnet",
    documentationType: "Model Card",
    trainingDataCutoffDate: "April 2024",
    isThirdPartyAudited: true,
    updatePolicy: "Quarterly versioning",
    metrics: {
      performance: [
        {
          metricKey: "MMLUScore",
          metricLabel: "MMLU Benchmark Score",
          value: 88.3,
          unit: "%",
          category: "performance",
          sourceContext: "Claude 3.5 Sonnet achieved 88.3% on MMLU (5-shot evaluation)",
          tooltipDescription: "Measures accuracy across 57 academic subjects including STEM, humanities, and social sciences"
        },
        {
          metricKey: "HumanEvalScore",
          metricLabel: "HumanEval Code Score",
          value: 92.0,
          unit: "%",
          category: "performance",
          sourceContext: "Achieved 92.0% on HumanEval, demonstrating strong code generation capabilities",
          tooltipDescription: "Measures ability to generate functionally correct Python code from docstrings"
        },
        {
          metricKey: "ContextWindowLength",
          metricLabel: "Max Context Window",
          value: 200000,
          unit: "Tokens",
          category: "performance",
          sourceContext: "Supports 200k token context window for processing extensive documents",
          tooltipDescription: "Maximum number of tokens (roughly words) the model can process in a single request"
        }
      ],
      safety: [
        {
          metricKey: "RefusalRate",
          metricLabel: "Harmful Request Refusal Rate",
          value: 99.2,
          unit: "%",
          category: "safety",
          sourceContext: "Constitutional AI training resulted in 99.2% refusal rate for harmful requests",
          tooltipDescription: "Percentage of harmful, unethical, or inappropriate requests that the model correctly refuses to answer"
        },
        {
          metricKey: "JailbreakSuccessRate",
          metricLabel: "Jailbreak Resistance",
          value: 1.1,
          unit: "%",
          category: "safety",
          sourceContext: "Adversarial testing showed 1.1% jailbreak success rate with extensive red teaming",
          tooltipDescription: "Lower is better. Percentage of adversarial attacks that successfully bypassed safety guardrails"
        }
      ],
      governance: [
        {
          metricKey: "AuditStatus",
          metricLabel: "Third-Party Safety Audit",
          value: "Completed",
          unit: "Status",
          category: "governance",
          sourceContext: "Completed external safety audit with UK AI Safety Institute",
          tooltipDescription: "Whether the model has undergone independent third-party safety evaluation"
        },
        {
          metricKey: "UpdateFrequency",
          metricLabel: "Model Update Cadence",
          value: "Quarterly",
          unit: "Frequency",
          category: "governance",
          sourceContext: "Major model updates released quarterly with continuous safety monitoring",
          tooltipDescription: "How frequently the model receives updates and improvements"
        }
      ]
    }
  },
  {
    id: "gemini-1.5-pro",
    company: "Google",
    modelName: "Gemini 1.5 Pro",
    modelType: "Closed API",
    summary: "Gemini 1.5 Pro is Google's advanced multimodal AI model with breakthrough long-context capabilities. It excels at understanding and reasoning across text, images, audio, and video while maintaining strong performance on academic benchmarks and real-world tasks.",
    originalSourceURL: "https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf",
    documentationType: "Technical Report (PDF)",
    trainingDataCutoffDate: "November 2023",
    isThirdPartyAudited: false,
    updatePolicy: "Continuous deployment",
    metrics: {
      performance: [
        {
          metricKey: "MMLUScore",
          metricLabel: "MMLU Benchmark Score",
          value: 85.9,
          unit: "%",
          category: "performance",
          sourceContext: "Gemini 1.5 Pro achieved 85.9% on MMLU with few-shot prompting",
          tooltipDescription: "Measures accuracy across 57 academic subjects including STEM, humanities, and social sciences"
        },
        {
          metricKey: "HumanEvalScore",
          metricLabel: "HumanEval Code Score",
          value: 84.7,
          unit: "%",
          category: "performance",
          sourceContext: "Scored 84.7% on HumanEval coding benchmark",
          tooltipDescription: "Measures ability to generate functionally correct Python code from docstrings"
        },
        {
          metricKey: "ContextWindowLength",
          metricLabel: "Max Context Window",
          value: 1000000,
          unit: "Tokens",
          category: "performance",
          sourceContext: "Supports up to 1 million tokens in context window, enabling analysis of entire codebases",
          tooltipDescription: "Maximum number of tokens (roughly words) the model can process in a single request"
        }
      ],
      safety: [
        {
          metricKey: "RefusalRate",
          metricLabel: "Harmful Request Refusal Rate",
          value: 96.8,
          unit: "%",
          category: "safety",
          sourceContext: "Safety filters and training resulted in 96.8% refusal rate for policy-violating content",
          tooltipDescription: "Percentage of harmful, unethical, or inappropriate requests that the model correctly refuses to answer"
        },
        {
          metricKey: "JailbreakSuccessRate",
          metricLabel: "Jailbreak Resistance",
          value: 3.7,
          unit: "%",
          category: "safety",
          sourceContext: "Red team testing identified 3.7% jailbreak success rate across diverse attack vectors",
          tooltipDescription: "Lower is better. Percentage of adversarial attacks that successfully bypassed safety guardrails"
        }
      ],
      governance: [
        {
          metricKey: "AuditStatus",
          metricLabel: "Third-Party Safety Audit",
          value: "In Progress",
          unit: "Status",
          category: "governance",
          sourceContext: "External safety audit currently in progress with independent researchers",
          tooltipDescription: "Whether the model has undergone independent third-party safety evaluation"
        },
        {
          metricKey: "UpdateFrequency",
          metricLabel: "Model Update Cadence",
          value: "Continuous",
          unit: "Frequency",
          category: "governance",
          sourceContext: "Continuous deployment model with ongoing improvements and safety updates",
          tooltipDescription: "How frequently the model receives updates and improvements"
        }
      ]
    }
  },
  {
    id: "llama-3.1",
    company: "Meta",
    modelName: "Llama 3.1 (405B)",
    modelType: "Open-weight",
    summary: "Llama 3.1 is Meta's largest open-weight language model, offering researchers and developers unprecedented access to a frontier-class AI system. With 405 billion parameters, it rivals closed models in performance while enabling transparent research and customization.",
    originalSourceURL: "https://ai.meta.com/research/publications/llama-3-herd-of-models/",
    documentationType: "Model Card",
    trainingDataCutoffDate: "December 2023",
    isThirdPartyAudited: true,
    updatePolicy: "Versioned releases",
    metrics: {
      performance: [
        {
          metricKey: "MMLUScore",
          metricLabel: "MMLU Benchmark Score",
          value: 87.3,
          unit: "%",
          category: "performance",
          sourceContext: "Llama 3.1 405B achieved 87.3% on MMLU, competitive with leading closed models",
          tooltipDescription: "Measures accuracy across 57 academic subjects including STEM, humanities, and social sciences"
        },
        {
          metricKey: "HumanEvalScore",
          metricLabel: "HumanEval Code Score",
          value: 89.0,
          unit: "%",
          category: "performance",
          sourceContext: "Demonstrated 89.0% pass rate on HumanEval code generation tasks",
          tooltipDescription: "Measures ability to generate functionally correct Python code from docstrings"
        },
        {
          metricKey: "ContextWindowLength",
          metricLabel: "Max Context Window",
          value: 128000,
          unit: "Tokens",
          category: "performance",
          sourceContext: "Supports 128k token context for processing long documents and conversations",
          tooltipDescription: "Maximum number of tokens (roughly words) the model can process in a single request"
        }
      ],
      safety: [
        {
          metricKey: "RefusalRate",
          metricLabel: "Harmful Request Refusal Rate",
          value: 94.2,
          unit: "%",
          category: "safety",
          sourceContext: "Safety fine-tuning achieved 94.2% refusal rate on harmful content benchmarks",
          tooltipDescription: "Percentage of harmful, unethical, or inappropriate requests that the model correctly refuses to answer"
        },
        {
          metricKey: "JailbreakSuccessRate",
          metricLabel: "Jailbreak Resistance",
          value: 5.1,
          unit: "%",
          category: "safety",
          sourceContext: "Adversarial evaluation showed 5.1% jailbreak success rate, with mitigations available",
          tooltipDescription: "Lower is better. Percentage of adversarial attacks that successfully bypassed safety guardrails"
        }
      ],
      governance: [
        {
          metricKey: "AuditStatus",
          metricLabel: "Third-Party Safety Audit",
          value: "Completed",
          unit: "Status",
          category: "governance",
          sourceContext: "Extensive third-party red teaming and safety evaluations conducted pre-release",
          tooltipDescription: "Whether the model has undergone independent third-party safety evaluation"
        },
        {
          metricKey: "UpdateFrequency",
          metricLabel: "Model Update Cadence",
          value: "Major Versions",
          unit: "Frequency",
          category: "governance",
          sourceContext: "New major versions released periodically with community-driven improvements",
          tooltipDescription: "How frequently the model receives updates and improvements"
        }
      ]
    }
  }
];
