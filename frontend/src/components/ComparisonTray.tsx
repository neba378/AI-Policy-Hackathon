import { NormalizedModel } from "@/types/model";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComparisonTrayProps {
  selectedModels: NormalizedModel[];
  onRemoveModel: (modelId: string) => void;
  onClearAll: () => void;
}

const ComparisonTray = ({ selectedModels, onRemoveModel, onClearAll }: ComparisonTrayProps) => {
  const navigate = useNavigate();

  if (selectedModels.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm font-bold text-primary">
              Selected for Comparison ({selectedModels.length})
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md border border-primary/20"
                >
                  <span className="text-sm font-medium text-foreground">
                    {model.modelName}
                  </span>
                  <button
                    onClick={() => onRemoveModel(model.id)}
                    className="text-muted-foreground hover:text-destructive transition-smooth"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="border-border hover:bg-destructive/10 hover:border-destructive"
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/compare?models=${selectedModels.map(m => m.id).join(',')}`)}
              disabled={selectedModels.length < 2}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Compare Models
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTray;
