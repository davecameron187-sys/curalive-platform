import { TooltipProvider } from "./components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BackToLinks from "./components/BackToLinks";
import Home from "./pages/Home";
import LiveQaSession from "./pages/LiveQaSession";

import AgiToolGallery from "./pages/AgiToolGallery";
import OperatorConsole from "./pages/OperatorConsole";
import PresenterTeleprompter from "./pages/PresenterTeleprompter";
import OperatorDashboard from "./pages/OperatorDashboard";
import PostEventAnalytics from "./pages/PostEventAnalytics";
import ShadowMode from "./pages/ShadowMode";
import AIDashboard from "./pages/AIDashboard";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <BackToLinks />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/live-qa/:sessionId" component={LiveQaSession} />

            <Route path="/agi-tools" component={AgiToolGallery} />
            <Route path="/operator/:sessionId" component={OperatorConsole} />
            
            {/* Sprint 1 Tasks 1.8-1.10 Routes */}
            <Route path="/presenter/:sessionId" component={PresenterTeleprompter} />
            <Route path="/operator-dashboard/:sessionId" component={OperatorDashboard} />
            <Route path="/analytics/:sessionId" component={PostEventAnalytics} />
            
            {/* Shadow Mode Routes */}
            <Route path="/shadow-mode" component={ShadowMode} />
            <Route path="/ai-dashboard/:sessionId" component={AIDashboard} />
            
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
