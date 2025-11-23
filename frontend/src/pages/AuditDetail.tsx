import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Award,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  MinusCircle,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Evidence {
  quote: string;
  reason: string;
  status: "PASS" | "FAIL" | "N/A";
}

interface AuditItem {
  model_name: string;
  rule_id: string;
  rule_question: string;
  rule_category: string;
  evidence: Evidence;
}

interface Rule {
  id: string;
  category: string;
  question: string;
}

interface ModelRanking {
  model_name: string;
  compliance_score: number;
  pass_count: number;
  fail_count: number;
  na_count: number;
  total_rules: number;
}

interface CategoryBreakdown {
  category: string;
  pass_rate: number;
  pass_count: number;
  fail_count: number;
  na_count: number;
}

interface AuditDetail {
  _id: string;
  audit_id: string;
  policy_name: string;
  total_rules: number;
  total_models: number;
  models_analyzed: string[];
  timestamp: string;
  overall_compliance: number;
  total_checks: number;
  total_pass: number;
  total_fail: number;
  total_na: number;
  model_rankings: ModelRanking[];
  category_breakdown: CategoryBreakdown[];
  best_model: string;
  worst_model: string;
  audit_results: AuditItem[];
  rules: Rule[];
}

const COLORS = ["#10b981", "#ef4444", "#6b7280"];

const AuditDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auditData, setAuditData] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    const fetchAuditDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/audits/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch audit details");
        }

        const data = await response.json();
        setAuditData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAuditDetail();
    }
  }, [id]);

  const viewModelDetails = (modelName: string) => {
    setSelectedModel(modelName);
    setShowDetailsDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <MinusCircle className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PASS: "bg-green-900/30 text-green-400 border-green-500",
      FAIL: "bg-red-900/30 text-red-400 border-red-500",
      "N/A": "bg-yellow-900/30 text-yellow-400 border-yellow-500",
    };

    return (
      <Badge
        className={`${
          colors[status as keyof typeof colors] || colors["N/A"]
        } border`}
      >
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-red-900/20 border-red-500">
            <CardContent className="p-6">
              <p className="text-red-400">
                Error: {error || "Audit not found"}
              </p>
              <Button onClick={() => navigate("/audits")} className="mt-4">
                Back to Audit History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Passed", value: auditData.total_pass, color: "#10b981" },
    { name: "Failed", value: auditData.total_fail, color: "#ef4444" },
    { name: "N/A", value: auditData.total_na, color: "#6b7280" },
  ];

  const modelResults = auditData.audit_results.filter((item) =>
    selectedModel ? item.model_name === selectedModel : false
  );

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/audits")}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Audit Details
              </h1>
              <p className="text-muted-foreground">{auditData.policy_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            {new Date(auditData.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Overall Compliance
              </span>
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {auditData.overall_compliance}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {auditData.total_pass} of{" "}
              {auditData.total_pass + auditData.total_fail} checks passed
            </p>
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Models Analyzed
              </span>
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {auditData.total_models}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {auditData.models_analyzed.join(", ")}
            </p>
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Checks
              </span>
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {auditData.total_checks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {auditData.total_rules} rules × {auditData.total_models} models
            </p>
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Best Model</span>
              <Award className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              {auditData.best_model || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest compliance score
            </p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle>Compliance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="bg-card/80 border-border">
            <CardHeader>
              <CardTitle>Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={auditData.model_rankings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="model_name" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                    }}
                  />
                  <Bar dataKey="compliance_score" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Model Rankings */}
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Model Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditData.model_rankings.map((model, index) => (
                <div
                  key={model.model_name}
                  className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">
                      {model.model_name}
                    </h3>
                    <div className="flex gap-3 text-sm">
                      <span className="text-green-400">
                        ✓ {model.pass_count}
                      </span>
                      <span className="text-red-400">✗ {model.fail_count}</span>
                      <span className="text-yellow-400">
                        ⚠ {model.na_count}
                      </span>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <div className="text-2xl font-bold text-primary">
                      {model.compliance_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Compliance
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewModelDetails(model.model_name)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-card/80 border-border">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditData.category_breakdown.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {category.category}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {category.pass_count} /{" "}
                      {category.pass_count + category.fail_count} passed (
                      {category.pass_rate}%)
                    </span>
                  </div>
                  <Progress value={category.pass_rate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Model Details: {selectedModel}</DialogTitle>
            <DialogDescription>
              Rule-by-rule compliance check results with evidence
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {modelResults.map((item, idx) => (
              <div
                key={`${item.rule_id}-${idx}`}
                className="bg-background/50 rounded-lg p-4 border border-border/50"
              >
                <div className="flex items-start gap-3 mb-3">
                  {getStatusIcon(item.evidence.status)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        {item.rule_question}
                      </h4>
                      {getStatusBadge(item.evidence.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Category: {item.rule_category}
                    </p>
                  </div>
                </div>

                {item.evidence.quote && (
                  <div className="mb-3 pl-8">
                    <p className="text-xs text-muted-foreground mb-1">
                      Evidence Quote:
                    </p>
                    <div className="bg-cyan-500/10 border-l-2 border-cyan-500 p-3 rounded">
                      <p className="text-sm text-foreground italic">
                        "{item.evidence.quote}"
                      </p>
                    </div>
                  </div>
                )}

                {item.evidence.reason && (
                  <div className="pl-8">
                    <p className="text-xs text-muted-foreground mb-1">
                      Analysis Reasoning:
                    </p>
                    <p className="text-sm text-foreground">
                      {item.evidence.reason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditDetail;
