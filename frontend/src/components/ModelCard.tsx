import { NormalizedModel } from "@/types/model";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lock, Code, Puzzle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ModelCardProps {
  model: NormalizedModel;
  isSelected: boolean;
  onToggleSelect: (modelId: string) => void;
}

const ModelCard = ({ model, isSelected, onToggleSelect }: ModelCardProps) => {
  const navigate = useNavigate();
  
  const getModelTypeIcon = () => {
    switch (model.modelType) {
      case "Closed API":
        return <Lock className="h-3 w-3" />;
      case "Open-weight":
        return <Code className="h-3 w-3" />;
      case "Mixed":
        return <Puzzle className="h-3 w-3" />;
    }
  };

  const getModelTypeColor = () => {
    switch (model.modelType) {
      case "Closed API":
        return "text-governance";
      case "Open-weight":
        return "text-primary";
      case "Mixed":
        return "text-accent";
    }
  };

  const mmluMetric = model.metrics.performance.find(m => m.metricKey === "MMLUScore");
  const contextMetric = model.metrics.performance.find(m => m.metricKey === "ContextWindowLength");

  return (
    <Card
      className="relative bg-card/50 border-border hover:bg-card/80 transition-smooth cursor-pointer group"
      onClick={() => navigate(`/model/${model.id}`)}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className={`${getModelTypeColor()}`}>
                {getModelTypeIcon()}
              </span>
              <span className="text-xs text-muted-foreground font-medium">{model.company}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-smooth">
              {model.modelName}
            </h3>
          </div>
          
          <div 
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-muted-foreground">Compare</span>
            <Switch
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(model.id)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div>
            <div className="text-xs text-muted-foreground mb-1">MMLU Score</div>
            <div className="text-xl font-bold text-primary">
              {mmluMetric?.value}
              <span className="text-sm text-muted-foreground ml-1">{mmluMetric?.unit}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Context Window</div>
            <div className="text-xl font-bold text-foreground">
              {contextMetric && typeof contextMetric.value === 'number' 
                ? `${(contextMetric.value / 1000).toFixed(0)}k`
                : contextMetric?.value}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            {model.modelType}
          </Badge>
          {model.isThirdPartyAudited && (
            <Badge variant="outline" className="text-xs border-primary/50 text-primary">
              Audited
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ModelCard;
