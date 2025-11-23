import { useState, useMemo } from "react";
import { mockModels } from "@/data/mockModels";
import { ModelType } from "@/types/model";
import ModelCard from "@/components/ModelCard";
import FilterSidebar from "@/components/FilterSidebar";
import ComparisonTray from "@/components/ComparisonTray";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const ModelIndex = () => {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ModelType[]>([]);
  const [contextWindowMin, setContextWindowMin] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  const filteredModels = useMemo(() => {
    return mockModels.filter((model) => {
      // Company filter
      if (selectedCompanies.length > 0 && !selectedCompanies.includes(model.company)) {
        return false;
      }

      // Model type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(model.modelType)) {
        return false;
      }

      // Context window filter
      const contextMetric = model.metrics.performance.find(
        (m) => m.metricKey === "ContextWindowLength"
      );
      if (contextMetric && typeof contextMetric.value === "number") {
        if (contextMetric.value < contextWindowMin * 1000) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          model.modelName.toLowerCase().includes(query) ||
          model.company.toLowerCase().includes(query) ||
          model.summary.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [selectedCompanies, selectedTypes, contextWindowMin, searchQuery]);

  const handleCompanyToggle = (company: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((c) => c !== company)
        : [...prev, company]
    );
  };

  const handleTypeToggle = (type: ModelType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleToggleSelect = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : prev.length < 4
        ? [...prev, modelId]
        : prev
    );
  };

  const selectedModels = mockModels.filter((model) =>
    selectedModelIds.includes(model.id)
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                The Normalized Lab Console
              </h1>
              <p className="text-muted-foreground">
                AI Model Transparency and Comparison Dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Models</div>
              <div className="text-2xl font-bold text-primary">{mockModels.length}</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models by name, company, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <FilterSidebar
            selectedCompanies={selectedCompanies}
            selectedTypes={selectedTypes}
            contextWindowMin={contextWindowMin}
            onCompanyToggle={handleCompanyToggle}
            onTypeToggle={handleTypeToggle}
            onContextWindowChange={setContextWindowMin}
          />

          {/* Model Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredModels.length} of {mockModels.length} models
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModelIds.includes(model.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>

            {filteredModels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No models match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Tray */}
      <ComparisonTray
        selectedModels={selectedModels}
        onRemoveModel={handleToggleSelect}
        onClearAll={() => setSelectedModelIds([])}
      />
    </div>
  );
};

export default ModelIndex;
