import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockModels } from "@/data/mockModels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, ExternalLink, ChevronDown } from "lucide-react";

const ModelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const model = useMemo(() => mockModels.find((m) => m.id === id), [id]);

  if (!model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Model not found
          </h2>
          <Button onClick={() => navigate("/")} className="bg-primary">
            Go to Model Index
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border/50 bg-gradient-to-b from-card/50 to-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-6 border-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Index
          </Button>

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  {model.company}
                </div>
                <h1 className="text-5xl font-bold text-foreground mb-4">
                  {model.modelName}
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                  {model.summary}
                </p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() =>
                  window.open(model.originalSourceURL, "_blank")
                }
              >
                View Original Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-3 flex-wrap pt-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                {model.modelType}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {model.documentationType}
              </Badge>
              {model.isThirdPartyAudited && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 border-primary/50 text-primary"
                >
                  Third-Party Audited
                </Badge>
              )}
              <Badge variant="outline" className="text-sm px-3 py-1">
                Cutoff: {model.trainingDataCutoffDate}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                Updates: {model.updatePolicy}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Performance
            </TabsTrigger>
            <TabsTrigger value="safety" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Safety
            </TabsTrigger>
            <TabsTrigger value="governance" className="data-[state=active]:bg-governance data-[state=active]:text-governance-foreground">
              Governance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <MetricsGrid metrics={model.metrics.performance} accentColor="primary" />
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <MetricsGrid metrics={model.metrics.safety} accentColor="accent" />
          </TabsContent>

          <TabsContent value="governance" className="space-y-6">
            <MetricsGrid metrics={model.metrics.governance} accentColor="governance" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const MetricsGrid = ({
  metrics,
  accentColor,
}: {
  metrics: any[];
  accentColor: string;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <MetricCard key={metric.metricKey} metric={metric} accentColor={accentColor} />
      ))}
    </div>
  );
};

const MetricCard = ({
  metric,
  accentColor,
}: {
  metric: any;
  accentColor: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-6 bg-card/80 border-border hover:border-primary/50 transition-smooth">
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {metric.metricLabel}
        </div>
        <div className={`text-4xl font-bold text-${accentColor}`}>
          {metric.value}
          <span className="text-lg text-muted-foreground ml-2">
            {metric.unit}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {metric.tooltipDescription}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-smooth">
            <span>Source Trace</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="p-3 bg-secondary/50 rounded-md border border-border/50">
              <p className="text-xs text-muted-foreground italic">
                {metric.sourceContext}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
};

export default ModelDetail;
