import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { ComplianceMetricDetail } from "@/types/policy";

interface GroundedEvaluationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metricDetail: ComplianceMetricDetail | null;
  metricLabel: string;
}

const GroundedEvaluationDrawer = ({
  isOpen,
  onClose,
  metricDetail,
  metricLabel
}: GroundedEvaluationDrawerProps) => {
  if (!metricDetail) return null;

  const confidenceColor = 
    metricDetail.confidenceScore >= 0.9 ? "text-green-400" :
    metricDetail.confidenceScore >= 0.75 ? "text-yellow-400" :
    "text-red-400";

  const confidenceLabel = 
    metricDetail.confidenceScore >= 0.9 ? "High Confidence" :
    metricDetail.confidenceScore >= 0.75 ? "Medium Confidence" :
    "Low Confidence";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] bg-background border-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-primary">
            Grounded Evaluation Detail
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{metricLabel}</p>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Badge */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Compliance Status
            </label>
            <div className="mt-2">
              <Badge
                variant={metricDetail.status === 'PASS' ? 'default' : 'destructive'}
                className="text-sm"
              >
                {metricDetail.status}
              </Badge>
            </div>
          </div>

          {/* Actual vs Required Value */}
          {metricDetail.actualValue !== undefined && metricDetail.requiredValue !== undefined && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Actual Value
                </label>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metricDetail.actualValue}
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Required Value
                </label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {metricDetail.operator} {metricDetail.requiredValue}
                </p>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Confidence Score
            </label>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${confidenceColor.replace('text-', 'bg-')}`}
                  style={{ width: `${metricDetail.confidenceScore * 100}%` }}
                />
              </div>
              <span className={`text-sm font-bold ${confidenceColor}`}>
                {Math.round(metricDetail.confidenceScore * 100)}%
              </span>
            </div>
            <p className={`text-xs ${confidenceColor} mt-1`}>{confidenceLabel}</p>
          </div>

          {/* Documentary Evidence */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Documentary Evidence
            </label>
            <div className="mt-2 p-4 bg-secondary/30 border border-border rounded-lg">
              <p className="text-sm text-foreground leading-relaxed">
                "{metricDetail.supportingPassage}"
              </p>
            </div>
          </div>

          {/* Ambiguity Factors */}
          {metricDetail.ambiguityFactors && metricDetail.ambiguityFactors.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-yellow-400 mb-2 text-sm">
                    Confusing Factors
                  </p>
                  <ul className="space-y-1">
                    {metricDetail.ambiguityFactors.map((factor, index) => (
                      <li key={index} className="text-sm text-foreground">
                        • {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Source Link */}
          <div>
            <Button
              variant="outline"
              className="w-full border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => window.open(metricDetail.sourceDocumentLink, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Full Source Document
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GroundedEvaluationDrawer;
