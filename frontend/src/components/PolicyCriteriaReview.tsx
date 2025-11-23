import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Plus } from "lucide-react";
import { ExtractedCriterion, PolicyCriterion, ComparisonOperator } from "@/types/policy";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PolicyCriteriaReviewProps {
  criteria: ExtractedCriterion[];
  policyName: string;
  documentSnippet: string;
  onSaved: () => void;
  onBack: () => void;
}

const PolicyCriteriaReview = ({
  criteria: initialCriteria,
  policyName,
  documentSnippet,
  onSaved,
  onBack
}: PolicyCriteriaReviewProps) => {
  const { toast } = useToast();
  const [editableCriteria, setEditableCriteria] = useState(
    initialCriteria.map((c, index) => ({ ...c, id: index }))
  );
  const [policyTitle, setPolicyTitle] = useState(policyName.replace(/\.[^/.]+$/, ""));
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateCriterion = (id: number, field: string, value: any) => {
    setEditableCriteria(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCriterion = (id: number) => {
    setEditableCriteria(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCriterion = () => {
    const newId = Math.max(...editableCriteria.map(c => c.id), 0) + 1;
    setEditableCriteria(prev => [
      ...prev,
      {
        id: newId,
        extractedStatement: "New criterion",
        suggestedMetricKey: "MMLUScore",
        suggestedValue: 85,
        suggestedOperator: "GTE" as ComparisonOperator,
        suggestedSeverity: "major" as const,
        metricLabel: "New Criterion"
      }
    ]);
  };

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to save policies",
          variant: "destructive"
        });
        return;
      }

      // Convert to policy format
      const criteriaObj: Record<string, PolicyCriterion> = {};
      editableCriteria.forEach(c => {
        const severityMap = { critical: 1, major: 2, minor: 3 } as const;
        criteriaObj[c.suggestedMetricKey] = {
          requiredValue: c.suggestedValue,
          comparisonOperator: c.suggestedOperator,
          metricLabel: c.metricLabel,
          severity: severityMap[c.suggestedSeverity]
        };
      });

      const { error } = await supabase.from('user_policies').insert({
        user_id: user.id,
        policy_name: policyTitle,
        original_source_snippet: documentSnippet,
        criteria: criteriaObj as any,
        is_active: true
      });

      if (error) throw error;

      onSaved();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Save Error",
        description: "Failed to save policy",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <span className="w-1 h-8 bg-primary"></span>
            Review & Map Criteria
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and adjust the extracted policy criteria before saving
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="bg-card/80 border-border p-6">
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="policy-title" className="text-sm font-bold text-primary">
              Policy Name
            </Label>
            <Input
              id="policy-title"
              value={policyTitle}
              onChange={(e) => setPolicyTitle(e.target.value)}
              className="mt-2 bg-background/50 border-border"
            />
          </div>
        </div>

        <div className="space-y-4">
          {editableCriteria.map((criterion) => (
            <Card key={criterion.id} className="bg-background/30 border-border/50 p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Original Statement (Read-only) */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">
                    Original Statement
                  </Label>
                  <p className="text-sm italic text-foreground/80">
                    {criterion.extractedStatement}
                  </p>
                </div>

                {/* Mapping Controls */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Metric Type</Label>
                      <Select
                        value={criterion.suggestedMetricKey}
                        onValueChange={(value) =>
                          handleUpdateCriterion(criterion.id, 'suggestedMetricKey', value)
                        }
                      >
                        <SelectTrigger className="mt-1 bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MMLUScore">MMLU Score</SelectItem>
                          <SelectItem value="HumanEvalScore">HumanEval Score</SelectItem>
                          <SelectItem value="GovRefusalRate">Gov Refusal Rate</SelectItem>
                          <SelectItem value="SafetyRefusalRate">Safety Refusal Rate</SelectItem>
                          <SelectItem value="ContextWindowLength">Context Window</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Required Value</Label>
                      <Input
                        type="number"
                        value={criterion.suggestedValue}
                        onChange={(e) =>
                          handleUpdateCriterion(criterion.id, 'suggestedValue', parseFloat(e.target.value))
                        }
                        className="mt-1 bg-background/50 border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Operator</Label>
                      <Select
                        value={criterion.suggestedOperator}
                        onValueChange={(value) =>
                          handleUpdateCriterion(criterion.id, 'suggestedOperator', value)
                        }
                      >
                        <SelectTrigger className="mt-1 bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GTE">Greater Than or Equal (≥)</SelectItem>
                          <SelectItem value="LTE">Less Than or Equal (≤)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Severity</Label>
                      <Select
                        value={criterion.suggestedSeverity}
                        onValueChange={(value) =>
                          handleUpdateCriterion(criterion.id, 'suggestedSeverity', value)
                        }
                      >
                        <SelectTrigger className="mt-1 bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="major">Major</SelectItem>
                          <SelectItem value="minor">Minor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCriterion(criterion.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/50">
          <Button variant="outline" onClick={handleAddCriterion}>
            <Plus className="mr-2 h-4 w-4" />
            Add Criterion
          </Button>

          <Button
            onClick={handleSavePolicy}
            disabled={isSaving || editableCriteria.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save & Activate Policy"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PolicyCriteriaReview;
