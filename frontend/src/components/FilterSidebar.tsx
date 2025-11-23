import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ModelType } from "@/types/model";
import { Lock, Code, Puzzle } from "lucide-react";

interface FilterSidebarProps {
  selectedCompanies: string[];
  selectedTypes: ModelType[];
  contextWindowMin: number;
  onCompanyToggle: (company: string) => void;
  onTypeToggle: (type: ModelType) => void;
  onContextWindowChange: (value: number) => void;
}

const companies = ["OpenAI", "Anthropic", "Google", "Meta"];
const modelTypes: { type: ModelType; icon: typeof Lock; color: string }[] = [
  { type: "Closed API", icon: Lock, color: "text-governance" },
  { type: "Open-weight", icon: Code, color: "text-primary" },
  { type: "Mixed", icon: Puzzle, color: "text-accent" },
];

const FilterSidebar = ({
  selectedCompanies,
  selectedTypes,
  contextWindowMin,
  onCompanyToggle,
  onTypeToggle,
  onContextWindowChange,
}: FilterSidebarProps) => {
  return (
    <div className="w-full lg:w-64 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-primary"></span>
          Filters
        </h2>
      </div>

      <Card className="bg-card/80 border-border p-4 space-y-6">
        {/* Company Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-primary">Company</Label>
          <div className="space-y-2">
            {companies.map((company) => (
              <div key={company} className="flex items-center space-x-2">
                <Checkbox
                  id={company}
                  checked={selectedCompanies.includes(company)}
                  onCheckedChange={() => onCompanyToggle(company)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={company}
                  className="text-sm text-foreground cursor-pointer hover:text-primary transition-smooth"
                >
                  {company}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Model Type Filter */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <Label className="text-sm font-bold text-primary">Model Type</Label>
          <div className="space-y-2">
            {modelTypes.map(({ type, icon: Icon, color }) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => onTypeToggle(type)}
                  className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor={type}
                  className="text-sm text-foreground cursor-pointer hover:text-primary transition-smooth flex items-center gap-2"
                >
                  <Icon className={`h-3 w-3 ${color}`} />
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Context Window Slider */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <Label className="text-sm font-bold text-primary">
            Min Context Window: {contextWindowMin}k Tokens
          </Label>
          <Slider
            value={[contextWindowMin]}
            onValueChange={(value) => onContextWindowChange(value[0])}
            min={0}
            max={1000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0k</span>
            <span>500k</span>
            <span>1M</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FilterSidebar;
