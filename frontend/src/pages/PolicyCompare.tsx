import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  models_analyzed: string[];
  model_rankings: Array<{
    model_name: string;
    compliance_score: number;
    avg_confidence: number;
    pass_count: number;
    fail_count: number;
  }>;
  policy_name: string;
  timestamp: string;
  audit_results: Array<{
    model_name: string;
    rule_category: string;
    evidence: {
      status: "PASS" | "FAIL";
      confidence: number;
    };
  }>;
}

interface AuditItem {
  model_name: string;
  rule_id: string;
  rule_category: string;
  rule_question: string;
  evidence: {
    quote: string;
    reason: string;
    status: "PASS" | "FAIL";
    confidence: number;
  };
}

interface FullAudit {
  policy_name: string;
  total_rules: number;
  audit_results: AuditItem[];
}

const PolicyCompare = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [fullAudit, setFullAudit] = useState<FullAudit | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard data...");

      // Fetch dashboard data
      const dashResponse = await fetch("http://localhost:8000/dashboard");
      if (!dashResponse.ok) {
        console.error("Dashboard fetch failed:", dashResponse.status);
        throw new Error("No audit data available");
      }
      const dashData = await dashResponse.json();
      console.log("Dashboard data:", dashData);
      setDashboard(dashData);

      // Fetch full audit details to get rule-by-rule comparison
      if (dashData.audit_id) {
        const auditResponse = await fetch(
          `http://localhost:8000/audits/${dashData.audit_id}`
        );
        if (auditResponse.ok) {
          const auditData = await auditResponse.json();
          console.log("Audit data:", auditData);
          setFullAudit(auditData);
        }
      }

      // Auto-select all models
      setSelectedModels(dashData.models_analyzed || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelName: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelName)
        ? prev.filter((m) => m !== modelName)
        : [...prev, modelName]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!dashboard || !dashboard.models_analyzed.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/80 border-border p-8 max-w-md text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              No Analysis Available
            </h2>
            <p className="text-muted-foreground mb-6">
              Please run a policy analysis first to compare models.
            </p>
            <Button onClick={() => navigate("/policy")} className="bg-primary">
              Go to Policy Console
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredRankings = dashboard.model_rankings.filter((model) =>
    selectedModels.includes(model.model_name)
  );

  // Prepare bar chart data
  const barChartData = filteredRankings.map((model) => ({
    name: model.model_name,
    Pass: model.pass_count,
    Fail: model.fail_count,
  }));

  // Prepare compliance score comparison
  const complianceData = filteredRankings.map((model) => ({
    name: model.model_name,
    score: model.compliance_score,
  }));

  // Get rule categories from full audit
  const categories = fullAudit
    ? Array.from(new Set(fullAudit.audit_results.map((r) => r.rule_category)))
    : [];

  // Prepare radar chart data by category
  const radarData = categories.map((category) => {
    const dataPoint: { category: string; [key: string]: string | number } = {
      category,
    };

    selectedModels.forEach((modelName) => {
      if (!fullAudit) return;

      const modelResults = fullAudit.audit_results.filter(
        (r) => r.model_name === modelName && r.rule_category === category
      );

      const passCount = modelResults.filter(
        (r) => r.evidence.status === "PASS"
      ).length;
      const total = modelResults.length;

      dataPoint[modelName] = total > 0 ? (passCount / total) * 100 : 0;
    });

    return dataPoint;
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Policy-Based Model Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare how well models comply with:{" "}
            <span className="text-primary font-medium">
              {dashboard.policy_name}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Analyzed: {new Date(dashboard.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Model Selection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Select Models to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {dashboard.models_analyzed.map((modelName) => {
                const ranking = dashboard.model_rankings.find(
                  (r) => r.model_name === modelName
                );

                return (
                  <div
                    key={modelName}
                    className="flex items-center gap-3 bg-background/50 rounded-lg p-3 border border-border/50 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => toggleModel(modelName)}
                  >
                    <Checkbox
                      checked={selectedModels.includes(modelName)}
                      onCheckedChange={() => toggleModel(modelName)}
                    />
                    <div>
                      <p className="font-medium text-foreground">{modelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ranking?.compliance_score}% compliant
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedModels.length < 1 && (
          <Card className="bg-yellow-900/20 border-yellow-500">
            <CardContent className="p-6">
              <p className="text-yellow-400">
                Please select at least one model to view comparison data.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedModels.length >= 1 && (
          <>
            {/* Compliance Score Comparison */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Overall Compliance Scores</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Percentage of rules passed by each model
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Bar dataKey="score" fill="#06b6d4" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pass/Fail/N/A Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Rule Status Breakdown</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Number of rules passed, failed, or not applicable
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Pass" fill="#10b981" />
                    <Bar dataKey="Fail" fill="#ef4444" />
                    <Bar dataKey="N/A" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category-Based Radar Chart */}
            {radarData.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Compliance by Rule Category</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Performance across different policy categories
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="category" stroke="#888" />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        stroke="#888"
                      />
                      {selectedModels.map((model, idx) => (
                        <Radar
                          key={model}
                          name={model}
                          dataKey={model}
                          stroke={
                            ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"][
                              idx % 4
                            ]
                          }
                          fill={
                            ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"][
                              idx % 4
                            ]
                          }
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Side-by-Side Model Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRankings.map((model) => {
                const trend =
                  model.pass_count > model.fail_count
                    ? "high"
                    : model.pass_count < model.fail_count
                    ? "low"
                    : "medium";

                return (
                  <Card
                    key={model.model_name}
                    className="bg-card border-border"
                  >
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {model.model_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {trend === "high" && (
                          <TrendingUp className="h-5 w-5 text-green-400" />
                        )}
                        {trend === "low" && (
                          <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                        {trend === "medium" && (
                          <Minus className="h-5 w-5 text-yellow-400" />
                        )}
                        <span className="text-2xl font-bold text-primary">
                          {model.compliance_score}%
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Passed:
                          </span>
                          <Badge className="bg-green-900/30 text-green-400 border-green-500">
                            {model.pass_count} rules
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Failed:
                          </span>
                          <Badge className="bg-red-900/30 text-red-400 border-red-500">
                            {model.fail_count} rules
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Avg Confidence:
                          </span>
                          <Badge className="bg-purple-900/30 text-purple-400 border-purple-500">
                            {model.avg_confidence.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">
                            Compliance Score
                          </p>
                          <div className="w-full bg-background rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${model.compliance_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PolicyCompare;
