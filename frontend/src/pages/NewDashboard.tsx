import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  FileText,
  Calendar,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  status: "PASS" | "FAIL" | "N/A";
  quote: string;
  reason: string;
}

interface AuditItem {
  model_name: string;
  rule_id: string;
  rule_question: string;
  rule_category: string;
  evidence: Evidence;
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

interface DashboardData {
  audit_id: string;
  policy_name: string;
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
}

interface AuditDetails {
  audit_results: AuditItem[];
  rules: any[];
}

const COLORS = ["#10b981", "#ef4444", "#6b7280"];

const Dashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [auditDetails, setAuditDetails] = useState<AuditDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("http://localhost:8000/dashboard");

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "No Audit Data",
            description: "Please run an analysis first to view the dashboard",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch dashboard");
      }

      const data = await response.json();
      setDashboardData(data);

      // Fetch full audit details
      const detailsResponse = await fetch(
        `http://localhost:8000/audits/${data.audit_id}`
      );
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        setAuditDetails(details);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExcelReport = async () => {
    try {
      const auditResponse = await fetch(
        `http://localhost:8000/audits/${dashboardData?.audit_id}`
      );
      if (!auditResponse.ok) throw new Error("Failed to fetch audit data");

      const auditData = await auditResponse.json();

      const exportResponse = await fetch("http://localhost:8000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditData),
      });

      if (!exportResponse.ok) throw new Error("Failed to generate report");

      const blob = await exportResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_report_${
        dashboardData?.policy_name || "report"
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Downloaded",
        description: "Excel report has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download Excel report",
        variant: "destructive",
      });
    }
  };

  const viewModelDetails = (modelName: string) => {
    setSelectedModel(modelName);
    setShowDetailsDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-card/80 border-border p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              No Audit Data
            </h2>
            <p className="text-muted-foreground mb-6">
              Run a policy analysis to view compliance dashboard
            </p>
            <Button onClick={() => (window.location.href = "/policy")}>
              Go to Policy Console
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Passed", value: dashboardData.total_pass, color: "#10b981" },
    { name: "Failed", value: dashboardData.total_fail, color: "#ef4444" },
    { name: "N/A", value: dashboardData.total_na, color: "#6b7280" },
  ];

  const modelResults =
    auditDetails?.audit_results.filter((item) =>
      selectedModel ? item.model_name === selectedModel : false
    ) || [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Compliance Dashboard
              </h1>
              <p className="text-muted-foreground">
                {dashboardData.policy_name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => (window.location.href = "/compare")}
                variant="outline"
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Compare Models
              </Button>
              <Button onClick={downloadExcelReport} className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(dashboardData.timestamp).toLocaleString()}
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
            <div className="text-3xl font-bold text-foreground mb-2">
              {dashboardData.overall_compliance}%
            </div>
            <Progress
              value={dashboardData.overall_compliance}
              className="h-2"
            />
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Total Checks
              </span>
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {dashboardData.total_checks}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardData.total_models} models ×{" "}
              {dashboardData.total_checks / dashboardData.total_models} rules
            </p>
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Passed</span>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">
              {dashboardData.total_pass}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(
                (dashboardData.total_pass /
                  (dashboardData.total_pass + dashboardData.total_fail)) *
                100
              ).toFixed(1)}
              % pass rate
            </p>
          </Card>

          <Card className="bg-card/80 border-border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Failed</span>
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">
              {dashboardData.total_fail}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dashboardData.total_na} checks N/A
            </p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="bg-card/80 border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary"></span>
              Compliance Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart */}
          <Card className="bg-card/80 border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary"></span>
              Model Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.model_rankings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="model_name" tick={{ fill: "#9ca3af" }} />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                  }}
                  labelStyle={{ color: "#f3f4f6" }}
                />
                <Legend />
                <Bar
                  dataKey="compliance_score"
                  fill="#6366f1"
                  name="Compliance %"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Model Rankings with Detail View */}
        <Card className="bg-card/80 border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary"></span>
            Model Rankings
          </h2>

          <div className="space-y-3">
            {dashboardData.model_rankings.map((model, index) => (
              <div
                key={model.model_name}
                className="border border-border rounded-lg p-4 hover:bg-card/50 transition-smooth"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={index === 0 ? "default" : "outline"}
                      className="text-xs"
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-bold text-foreground">
                      {model.model_name}
                    </span>
                    {model.model_name === dashboardData.best_model && (
                      <Award className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      {model.compliance_score}%
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewModelDetails(model.model_name)}
                      className="gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </Button>
                  </div>
                </div>

                <Progress value={model.compliance_score} className="h-2 mb-2" />

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="text-green-400">
                    ✓ {model.pass_count} passed
                  </span>
                  <span className="text-red-400">
                    ✗ {model.fail_count} failed
                  </span>
                  <span>○ {model.na_count} N/A</span>
                  <span className="ml-auto">
                    {model.total_rules} total rules
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="bg-card/80 border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-primary"></span>
            Category Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.category_breakdown.map((category) => (
              <div
                key={category.category}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-foreground">
                    {category.category}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {category.pass_rate}%
                  </span>
                </div>

                <Progress value={category.pass_rate} className="h-2 mb-2" />

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-green-400">
                    {category.pass_count} pass
                  </span>
                  <span className="text-red-400">
                    {category.fail_count} fail
                  </span>
                  <span>{category.na_count} N/A</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedModel} - Detailed Results
            </DialogTitle>
            <DialogDescription>
              Rule-by-rule compliance breakdown with evidence
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {modelResults.map((item, index) => (
              <Card
                key={index}
                className={`p-4 border-l-4 ${
                  item.evidence.status === "PASS"
                    ? "border-l-green-500"
                    : item.evidence.status === "FAIL"
                    ? "border-l-red-500"
                    : "border-l-gray-500"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.rule_category}
                      </Badge>
                      <Badge
                        variant={
                          item.evidence.status === "PASS"
                            ? "default"
                            : item.evidence.status === "FAIL"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {item.evidence.status === "PASS" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {item.evidence.status === "FAIL" && (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {item.evidence.status === "N/A" && (
                          <MinusCircle className="h-3 w-3 mr-1" />
                        )}
                        {item.evidence.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {item.rule_question}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-semibold">Reason:</span>{" "}
                      {item.evidence.reason}
                    </p>
                    <div className="bg-muted/30 rounded p-3 text-sm">
                      <p className="font-semibold text-foreground mb-1">
                        Evidence Quote:
                      </p>
                      <p className="text-muted-foreground italic">
                        "{item.evidence.quote}"
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
