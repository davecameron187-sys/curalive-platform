import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EventRoom from "./pages/EventRoom";
import OperatorConsole from "./pages/OperatorConsole";
import Registration from "./pages/Registration";
import PostEvent from "./pages/PostEvent";
import IntegrationHub from "./pages/IntegrationHub";
import PartnerAPI from "./pages/PartnerAPI";
import EmbedWidget from "./pages/EmbedWidget";
import Moderator from "./pages/Moderator";
import Presenter from "./pages/Presenter";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/event/:id" component={EventRoom} />
      <Route path="/moderator/:id" component={Moderator} />
      <Route path="/presenter/:id" component={Presenter} />
      <Route path="/operator/:id" component={OperatorConsole} />
      <Route path="/register/:id" component={Registration} />
      <Route path="/post-event/:id" component={PostEvent} />
      <Route path="/integrations" component={IntegrationHub} />
      <Route path="/partner-api" component={PartnerAPI} />
      <Route path="/embed/:id" component={EmbedWidget} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
