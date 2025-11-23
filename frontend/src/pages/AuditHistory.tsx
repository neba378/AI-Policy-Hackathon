import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Calendar,
  Eye,
  Search,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuditSummary {
  id: string;
  policy_name: string;
  total_rules: number;
  total_models: number;
  models_analyzed: string[];
  timestamp: string;
  created_at: string;
}

interface AuditListResponse {
  total: number;
  limit: number;
  skip: number;
  audits: AuditSummary[];
}

const AuditHistory = () => {
  const { toast } = useToast();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchAudits();
  }, [page]);

  const fetchAudits = async () => {
    setIsLoading(true);
    try {
      const skip = page * limit;
      const response = await fetch(
        `http://localhost:8000/audits?limit=${limit}&skip=${skip}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audits");
      }

      const data: AuditListResponse = await response.json();
      setAudits(data.audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      toast({
        title: "Error",
        description: "Failed to load audit history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewAuditDetails = (auditId: string) => {
    // Navigate to audit detail page or open modal
    window.location.href = `/audit/${auditId}`;
  };

  const filteredAudits = audits.filter(
    (audit) =>
      audit.policy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.models_analyzed.some((model) =>
        model.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Audit History
          </h1>
          <p className="text-muted-foreground">
            View all previous policy compliance audits
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by policy name or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Audit List */}
        {filteredAudits.length === 0 ? (
          <Card className="bg-card/80 border-border p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {searchQuery ? "No matching audits" : "No audits found"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Run your first policy analysis to see results here"}
            </p>
            {!searchQuery && (
              <Button onClick={() => (window.location.href = "/policy")}>
                Go to Policy Console
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAudits.map((audit) => (
              <Card
                key={audit.id}
                className="bg-card/80 border-border p-6 hover:bg-card transition-smooth cursor-pointer"
                onClick={() => viewAuditDetails(audit.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-bold text-foreground">
                        {audit.policy_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(
                          audit.timestamp || audit.created_at
                        ).toLocaleString()}
                      </span>
                      <span>{audit.total_models} models analyzed</span>
                      <span>{audit.total_rules} rules checked</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {audit.models_analyzed.map((model) => (
                        <Badge
                          key={model}
                          variant="outline"
                          className="text-xs"
                        >
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredAudits.length > 0 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>

            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={filteredAudits.length < limit}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditHistory;
