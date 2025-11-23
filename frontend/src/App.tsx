import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import ModelIndex from "./pages/ModelIndex";
import PolicyCompare from "./pages/PolicyCompare";
import ModelDetail from "./pages/ModelDetail";
import NotFound from "./pages/NotFound";
import PolicyConsolePage from "./pages/PolicyConsole";
import Dashboard from "./pages/NewDashboard";
import AuditHistory from "./pages/AuditHistory";
import AuditDetail from "./pages/AuditDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<ModelIndex />} />
          <Route path="/compare" element={<PolicyCompare />} />
          <Route path="/model/:id" element={<ModelDetail />} />
          <Route path="/policy" element={<PolicyConsolePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audits" element={<AuditHistory />} />
          <Route path="/audit/:id" element={<AuditDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

