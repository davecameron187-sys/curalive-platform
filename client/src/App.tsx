import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BackToLinks from "./components/BackToLinks";
import Home from "./pages/Home";
import LiveQaSession from "./pages/LiveQaSession";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import AgiToolGallery from "./pages/AgiToolGallery";

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <BackToLinks />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/live-qa/:sessionId" component={LiveQaSession} />
            <Route path="/moderator/:sessionId" component={ModeratorDashboard} />
            <Route path="/agi-tools" component={AgiToolGallery} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
