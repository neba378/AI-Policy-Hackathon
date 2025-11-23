import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileUp,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PolicyConsole = () => {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [totalModels, setTotalModels] = useState(0);
  const [totalRules, setTotalRules] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);

    toast({
      title: "File Uploaded",
      description: `${file.name} ready for analysis`,
    });
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast({
        title: "No File",
        description: "Please upload a policy document first",
        variant: "destructive",
      });
      return;
    }

    // Reset state and show loading
    setIsAnalyzing(true);
    setProgressMessage("Analyzing your policy document...");
    setCurrentStage("analyzing");

    try {
      // Create FormData to send PDF file
      const formData = new FormData();
      formData.append("policy_file", uploadedFile);

      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Analysis failed");
      }

      const result = await response.json();

      setCurrentStage("complete");
      setProgressMessage("Analysis complete! Redirecting...");
      setTotalModels(result.total_models);
      setTotalRules(result.total_rules);

      toast({
        title: "Analysis Complete",
        description: `Analyzed ${result.total_models} models against ${result.total_rules} rules`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Analysis Error",
        description:
          error instanceof Error ? error.message : "Failed to analyze policy",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <span className="w-1 h-8 bg-primary"></span>
          Policy Console
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload your policy document (PDF) to analyze AI model compliance
        </p>
      </div>

      <Card className="bg-card/80 border-border p-8">
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-cyan-500/50 rounded-lg p-12 text-center hover:border-cyan-500 transition-smooth">
            <input
              type="file"
              id="policy-upload"
              className="hidden"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isAnalyzing}
            />
            <label
              htmlFor="policy-upload"
              className={`cursor-pointer flex flex-col items-center gap-4 ${
                isAnalyzing ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <FileUp className="h-12 w-12 text-cyan-400" />
              <div>
                <p className="text-lg font-bold text-foreground mb-2">
                  {uploadedFile ? uploadedFile.name : "Upload Policy Document"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Click to select a PDF policy file
                </p>
              </div>
            </label>
          </div>

          {/* Loading Progress */}
          {isAnalyzing && (
            <Card className="border-2 border-cyan-500/30 bg-gradient-to-br from-slate-900/40 to-cyan-950/20 backdrop-blur-sm">
              <div className="p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Animated Spinner with Glow */}
                  <div className="relative">
                    <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl"></div>
                  </div>

                  {/* Status Message */}
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-bold text-cyan-400">
                      {currentStage === "analyzing" && "Analyzing Policy..."}
                      {currentStage === "complete" && "Analysis Complete!"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {progressMessage}
                    </p>

                    {/* Info Pills */}
                    {totalModels > 0 && totalRules > 0 && (
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-full px-4 py-1.5">
                          <span className="text-xs text-cyan-300 font-medium">
                            {totalModels} Models
                          </span>
                        </div>
                        <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-full px-4 py-1.5">
                          <span className="text-xs text-cyan-300 font-medium">
                            {totalRules} Rules
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pulsing Dots Animation */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    <div
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Analyze Button */}
          {uploadedFile && !isAnalyzing && (
            <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-green-400 mb-1">
                  Ready to Analyze
                </p>
                <p className="text-sm text-foreground mb-4">
                  Analyze this policy against all AI models in the vector store
                </p>

                <Button
                  onClick={handleAnalyze}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  Analyze Policy
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PolicyConsole;
