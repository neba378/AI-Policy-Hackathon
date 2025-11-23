import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockModels } from "@/data/mockModels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Compare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelIds = searchParams.get("models")?.split(",") || [];

  const selectedModels = useMemo(
    () => mockModels.filter((model) => modelIds.includes(model.id)),
    [modelIds]
  );

  if (selectedModels.length < 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Select at least 2 models to compare
          </h2>
          <Button onClick={() => navigate("/")} className="bg-primary">
            Go to Model Index
          </Button>
        </div>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = [
    {
      category: "Safety",
      ...selectedModels.reduce(
        (acc, model) => ({
          ...acc,
          [model.modelName]: model.metrics.safety[0]
            ? typeof model.metrics.safety[0].value === "number"
              ? model.metrics.safety[0].value
              : 0
            : 0,
        }),
        {}
      ),
    },
    {
      category: "Performance",
      ...selectedModels.reduce(
        (acc, model) => ({
          ...acc,
          [model.modelName]:
            model.metrics.performance.find((m) => m.metricKey === "MMLUScore")
              ?.value || 0,
        }),
        {}
      ),
    },
    {
      category: "Governance",
      ...selectedModels.reduce(
        (acc, model) => ({
          ...acc,
          [model.modelName]: model.isThirdPartyAudited ? 100 : 50,
        }),
        {}
      ),
    },
  ];

  // Prepare bar chart data for MMLU
  const mmluData = selectedModels.map((model) => ({
    name: model.modelName,
    score:
      model.metrics.performance.find((m) => m.metricKey === "MMLUScore")
        ?.value || 0,
  }));

  // Prepare context window comparison
  const contextData = selectedModels.map((model) => ({
    name: model.modelName,
    tokens:
      (model.metrics.performance.find(
        (m) => m.metricKey === "ContextWindowLength"
      )?.value as number) / 1000 || 0,
  }));

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="border-border"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Index
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              Comparison Workbench
            </h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            {selectedModels.map((model, idx) => (
              <Badge
                key={model.id}
                className="px-4 py-2 text-sm"
                style={{
                  backgroundColor: colors[idx],
                  color: "hsl(var(--background))",
                }}
              >
                {model.modelName}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card className="p-6 bg-card/80 border-border">
            <h3 className="text-xl font-bold text-primary mb-4">
              Overall Profile Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                {selectedModels.map((model, idx) => (
                  <Radar
                    key={model.id}
                    name={model.modelName}
                    dataKey={model.modelName}
                    stroke={colors[idx]}
                    fill={colors[idx]}
                    fillOpacity={0.2}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* MMLU Bar Chart */}
          <Card className="p-6 bg-card/80 border-border">
            <h3 className="text-xl font-bold text-primary mb-4">
              MMLU Benchmark Score
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mmluData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  width={120}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="score" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Context Window Comparison */}
        <Card className="p-6 bg-card/80 border-border">
          <h3 className="text-xl font-bold text-primary mb-4">
            Context Window Capacity
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contextData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                label={{
                  value: "Tokens (thousands)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="tokens" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Detailed Comparison Table */}
        <Card className="p-6 bg-card/80 border-border overflow-x-auto">
          <h3 className="text-xl font-bold text-primary mb-4">
            Detailed Metric Comparison
          </h3>
          <TooltipProvider>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-bold text-primary">
                    Metric
                  </th>
                  {selectedModels.map((model) => (
                    <th
                      key={model.id}
                      className="text-center py-3 text-sm font-bold text-foreground"
                    >
                      {model.modelName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["MMLUScore", "HumanEvalScore", "ContextWindowLength"].map(
                  (metricKey) => {
                    const metrics = selectedModels.map((model) =>
                      model.metrics.performance.find(
                        (m) => m.metricKey === metricKey
                      )
                    );
                    const maxValue = Math.max(
                      ...metrics
                        .filter((m) => m && typeof m.value === "number")
                        .map((m) => m!.value as number)
                    );

                    return (
                      <tr key={metricKey} className="border-b border-border/50">
                        <td className="py-4 text-sm text-muted-foreground">
                          {metrics[0]?.metricLabel || metricKey}
                        </td>
                        {metrics.map((metric, idx) => {
                          const isMax =
                            metric &&
                            typeof metric.value === "number" &&
                            metric.value === maxValue;
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <td
                                  className={`text-center py-4 text-lg font-bold cursor-help ${
                                    isMax ? "text-primary" : "text-foreground"
                                  }`}
                                >
                                  {metric
                                    ? `${metric.value}${metric.unit}`
                                    : "N/A"}
                                </td>
                              </TooltipTrigger>
                              {metric && (
                                <TooltipContent className="max-w-sm">
                                  <div className="space-y-2">
                                    <p className="font-bold">
                                      {metric.metricLabel}
                                    </p>
                                    <p className="text-sm">
                                      {metric.tooltipDescription}
                                    </p>
                                    <p className="text-xs text-muted-foreground italic">
                                      Source: {metric.sourceContext}
                                    </p>
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          );
                        })}
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </TooltipProvider>
        </Card>

        {/* Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {selectedModels.map((model) => (
            <Card key={model.id} className="p-6 bg-card/80 border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {model.modelName}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {model.company}
              </p>
              <p className="text-sm text-foreground mb-4 line-clamp-3">
                {model.summary}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(model.originalSourceURL, "_blank")}
              >
                View Source
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Compare;
