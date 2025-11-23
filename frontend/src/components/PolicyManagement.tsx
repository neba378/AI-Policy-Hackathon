import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { UserPolicy } from "@/types/policy";
import { CheckCircle, Circle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PolicyManagement = () => {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies((data || []) as unknown as UserPolicy[]);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (policyId: string) => {
    try {
      // Deactivate all policies
      await supabase
        .from('user_policies')
        .update({ is_active: false });

      // Activate selected policy
      const { error } = await supabase
        .from('user_policies')
        .update({ is_active: true })
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: "Policy Activated",
        description: "This policy is now active for compliance checks",
      });

      fetchPolicies();
    } catch (error) {
      console.error('Error activating policy:', error);
      toast({
        title: "Error",
        description: "Failed to activate policy",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (policyId: string) => {
    try {
      const { error } = await supabase
        .from('user_policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;

      toast({
        title: "Policy Deleted",
        description: "Policy has been removed",
      });

      fetchPolicies();
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete policy",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <span className="w-1 h-8 bg-primary"></span>
          Policy Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your saved policies and select which one to apply for compliance checks
        </p>
      </div>

      <div className="space-y-4">
        {policies.length === 0 ? (
          <Card className="bg-card/80 border-border p-8 text-center">
            <p className="text-muted-foreground">No policies saved yet. Upload a policy document to get started.</p>
          </Card>
        ) : (
          policies.map((policy) => (
            <Card key={policy.id} className="bg-card/80 border-border p-6 hover:bg-card transition-smooth">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{policy.policy_name}</h3>
                    {policy.is_active && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    Created: {new Date(policy.creation_date).toLocaleDateString()}
                  </p>

                  <div className="text-sm text-foreground/70">
                    <span className="font-semibold">{Object.keys(policy.criteria).length}</span> criteria defined
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!policy.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(policy.id)}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <Circle className="mr-2 h-3 w-3" />
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(policy.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PolicyManagement;
