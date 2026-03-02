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
import SyncTest from "./pages/SyncTest";
import Demo from "./pages/Demo";
import TestGuide from "./pages/TestGuide";
import TechHandover from "./pages/TechHandover";
import SummitConsole from "./pages/SummitConsole";
import OCC from "./pages/OCC";
import AdminUsers from "./pages/AdminUsers";
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
      <Route path="/sync-test" component={SyncTest} />
      <Route path="/demo" component={Demo} />
      <Route path="/test-guide" component={TestGuide} />
      <Route path="/tech-handover" component={TechHandover} />
      <Route path="/summit-console" component={SummitConsole} />
      <Route path="/occ" component={OCC} />
      <Route path="/admin/users" component={AdminUsers} />
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
