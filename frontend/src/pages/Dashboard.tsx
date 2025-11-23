import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  FileText,
  Calendar,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const Dashboard = () => {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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
      // Fetch the latest audit data first
      const auditResponse = await fetch(
        `http://localhost:8000/audits/${dashboardData?.audit_id}`
      );
      if (!auditResponse.ok) throw new Error("Failed to fetch audit data");

      const auditData = await auditResponse.json();

      // Request Excel export
      const exportResponse = await fetch("http://localhost:8000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditData),
      });

      if (!exportResponse.ok) throw new Error("Failed to generate report");

      // Download the file
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
            <Button onClick={downloadExcelReport} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
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

        {/* Model Rankings */}
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
                  <span className="text-2xl font-bold text-primary">
                    {model.compliance_score}%
                  </span>
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
    </div>
  );
};

export default Dashboard;
