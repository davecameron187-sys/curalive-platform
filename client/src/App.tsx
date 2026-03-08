import { Toaster } from "sonner";
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
import OCC from "./pages/OCC_CORRECTED";
import AdminUsers from "./pages/AdminUsers";
import EventPass from "./pages/EventPass";
import LiveVideoMeetings from "./pages/LiveVideoMeetings";
import RoadshowDetail from "./pages/RoadshowDetail";
import HybridConference from "./pages/HybridConference";
import InvestorWaitingRoom from "./pages/InvestorWaitingRoom";
import SlidePresenter from "./pages/SlidePresenter";
import RoadshowOrderBook from "./pages/RoadshowOrderBook";
import BookDemo from "./pages/BookDemo";
import WebcastingHub from "./pages/WebcastingHub";
import WebcastStudio from "./pages/WebcastStudio";
import WebcastRegister from "./pages/WebcastRegister";
import OnDemandLibrary from "./pages/OnDemandLibrary";
import WebcastAnalytics from "./pages/WebcastAnalytics";
import CreateEventWizard from "./pages/CreateEventWizard";
import AttendeeEventRoom from "./pages/AttendeeEventRoom";
import OnDemandWatch from "./pages/OnDemandWatch";
import WebcastReport from "./pages/WebcastReport";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import PlatformLinks from "./pages/PlatformLinks";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import Training from "./pages/Training";
import OperatorGuide from "./pages/OperatorGuide";
import DemoRegistration from "./pages/DemoRegistration";
import TwilioDirectGuide from "./pages/TwilioDirectGuide";
import BillingPreview from "./pages/BillingPreview";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AIFeaturesStatus from "./pages/AIFeaturesStatus";
import AIDashboard from "./pages/AIDashboard";
import MyEvents from "./pages/MyEvents";
import QuoteBuilder from "./pages/QuoteBuilder";
import InvoiceViewer from "./pages/InvoiceViewer";
import QuoteView from "./pages/QuoteView";
import InvoiceView from "./pages/InvoiceView";
import AdminBilling from "./pages/AdminBilling";
import AgeingReport from "./pages/AgeingReport";
import RecurringTemplates from "./pages/RecurringTemplates";
import EventBriefGenerator from "./pages/EventBriefGenerator";

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
      <Route path="/demo-registration" component={DemoRegistration} />
      <Route path="/event-pass/:id" component={EventPass} />
      <Route path="/post-event/:id" component={PostEvent} />
      <Route path="/integrations" component={IntegrationHub} />
      <Route path="/partner-api" component={PartnerAPI} />
      <Route path="/embed/:id" component={EmbedWidget} />
      <Route path="/sync-test" component={SyncTest} />
      <Route path="/demo" component={Demo} />
      <Route path="/test-guide" component={TestGuide} />
      <Route path="/tech-handover" component={TechHandover} />
      <Route path="/summit-console" component={SummitConsole} />
      <Route path="/occ" component={OCC} /> {/* Corrected layout with conference table, participant details, and quick actions */}
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/live-video" component={LiveVideoMeetings} />
      <Route path="/live-video/roadshow/:roadshowId" component={RoadshowDetail} />
      <Route path="/live-video/conference" component={HybridConference} />
      <Route path="/live-video/join/:token" component={InvestorWaitingRoom} />
      <Route path="/live-video/roadshow/:roadshowId/present/:meetingId" component={SlidePresenter} />
      <Route path="/live-video/roadshow/:id/order-book" component={RoadshowOrderBook} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/live-video/webcasting" component={WebcastingHub} />
      <Route path="/live-video/webcast/create" component={CreateEventWizard} />
      <Route path="/live-video/webcast/:slug" component={WebcastStudio} />
      <Route path="/live-video/webcast/:slug/attend" component={AttendeeEventRoom} />
      <Route path="/live-video/webcast/:slug/watch" component={OnDemandWatch} />
      <Route path="/live-video/webcast/:slug/report" component={WebcastReport} />
      <Route path="/live-video/webcast/:slug/register" component={WebcastRegister} />
      <Route path="/legal/terms" component={TermsOfService} />
      <Route path="/legal/privacy" component={PrivacyPolicy} />
      <Route path="/platform-links" component={PlatformLinks} />
      <Route path="/profile" component={Profile} />
      <Route path="/billing" component={Billing} />
      <Route path="/training" component={Training} />
      <Route path="/operator-guide" component={OperatorGuide} />
      <Route path="/integrations/twilio-direct" component={TwilioDirectGuide} />
      <Route path="/billing/preview" component={BillingPreview} />
      <Route path="/my-events" component={MyEvents} />
      <Route path="/admin/billing" component={AdminBilling} />
      <Route path="/admin/billing/quote/:id" component={QuoteBuilder} />
      <Route path="/admin/billing/invoice/:id" component={InvoiceViewer} />
      <Route path="/billing/ageing" component={AgeingReport} />
      <Route path="/billing/recurring" component={RecurringTemplates} />
      <Route path="/quote/:token" component={QuoteView} />
      <Route path="/invoice/:token" component={InvoiceView} />
      <Route path="/live-video/on-demand" component={OnDemandLibrary} />
      <Route path="/live-video/analytics" component={WebcastAnalytics} />
      <Route path="/ai-dashboard" component={AIDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/ai-features-status" component={AIFeaturesStatus} />
      <Route path="/operator/brief-generator" component={EventBriefGenerator} />
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
