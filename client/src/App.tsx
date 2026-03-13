import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import BackToLinks from "./components/BackToLinks";
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
import MyEvents from "./pages/MyEvents";
import QuoteBuilder from "./pages/QuoteBuilder";
import InvoiceViewer from "./pages/InvoiceViewer";
import QuoteView from "./pages/QuoteView";
import InvoiceView from "./pages/InvoiceView";
import AdminBilling from "./pages/AdminBilling";
import AgeingReport from "./pages/AgeingReport";
import RecurringTemplates from "./pages/RecurringTemplates";
import TrainingModeConsole from "./pages/TrainingModeConsole";
import OperatorAnalytics from "./pages/OperatorAnalytics";
import DevelopmentDashboard from "./pages/DevelopmentDashboard";
import AIFeaturesStatus from "./pages/AIFeaturesStatus";
import PostEventReport from "./pages/PostEventReport";
import EventScheduler from "./pages/EventScheduler";
import EventCalendar from "./pages/EventCalendar";
import AttendeeRoom from "./pages/AttendeeRoom";
import ClientPortal from "./pages/ClientPortal";
import AdminClients from "./pages/AdminClients";
import ComplianceReport from "./pages/ComplianceReport";
import ComplianceAuditLog from "./pages/ComplianceAuditLog";
import InvestorFollowUps from "./pages/InvestorFollowUps";
import SentimentDashboard from "./pages/SentimentDashboard";
import AIDashboard from "./pages/AIDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import AdminPanel from "./pages/AdminPanel";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import EventBriefGenerator from "./pages/EventBriefGenerator";
import FeatureFlagsDashboard from "./pages/FeatureFlagsDashboard";
import ModeratorQAConsole from "./pages/ModeratorQAConsole";
import RedactionWorkflow from "./pages/RedactionWorkflow";
import ToxicityFilterDashboard from "./pages/ToxicityFilterDashboard";
import TranscriptEditor from "./pages/TranscriptEditor";
import TranscriptPage from "./pages/TranscriptPage";
import OperatorHub from "./pages/OperatorHub";
import AIShop from "./pages/AIShop";
import AIOnboarding from "./pages/AIOnboarding";
import AgenticBrain from "./pages/AgenticBrain";
import AutonomousIntervention from "./pages/AutonomousIntervention";
import TaggedMetricsDashboard from "./pages/TaggedMetricsDashboard";
import ShadowMode from "./pages/ShadowMode";
import HealthGuardian from "./pages/HealthGuardian";
import Bastion from "./pages/Bastion";
import LumiPartner from "./pages/LumiPartner";
import ArchiveUpload from "./pages/ArchiveUpload";
import Benchmarks from "./pages/Benchmarks";
import SocialMediaPage from "./pages/SocialMediaPage";
import PodcastConverter from "./pages/PodcastConverter";
import SustainabilityDashboard from "./pages/SustainabilityDashboard";
import FeatureMap from "./pages/FeatureMap";
import InterconnectionAnalytics from "./pages/InterconnectionAnalytics";
import VirtualStudio from "./pages/VirtualStudio";
import FeatureDetail from "./pages/FeatureDetail";
import BundleDetail from "./pages/BundleDetail";
import WorkflowsPage from "./pages/WorkflowsPage";
import IntelligentBroadcasterPage from "./pages/IntelligentBroadcasterPage";
import WebcastRecapPage from "./pages/WebcastRecapPage";
import TrainingSubPage from "./pages/TrainingSubPage";
import OperatorQuickRef from "./pages/OperatorQuickRef";
import OperatorLinks from "./pages/OperatorLinks";
import MarketReaction from "./pages/MarketReaction";
import CommunicationIndex from "./pages/CommunicationIndex";
import InvestorQuestionIntelligence from "./pages/InvestorQuestionIntelligence";
import IntelligenceReportPage from "./pages/IntelligenceReport";
import CallPreparation from "./pages/CallPreparation";
import IntelligenceTerminal from "./pages/IntelligenceTerminal";
import MailingListManager from "./pages/MailingListManager";
import MailingListConfirm from "./pages/MailingListConfirm";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/event/:id" component={EventRoom} />
      <Route path="/moderator/:id" component={Moderator} />
      <Route path="/presenter/:id" component={Presenter} />
      <Route path="/operator/analytics" component={OperatorAnalytics} />
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
      <Route path="/occ" component={OCC} />
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
      <Route path="/training-mode" component={TrainingModeConsole} />
      <Route path="/dev-dashboard" component={DevelopmentDashboard} />
      <Route path="/ai-features" component={AIFeaturesStatus} />
      <Route path="/post-event/:id" component={PostEventReport} />
      <Route path="/events/schedule" component={EventScheduler} />
      <Route path="/events/calendar" component={EventCalendar} />
      <Route path="/m/:eventId" component={AttendeeRoom} />
      <Route path="/portal/:clientSlug" component={ClientPortal} />
      <Route path="/portal/:clientSlug/event/:id" component={EventRoom} />
      <Route path="/admin/clients" component={AdminClients} />
      <Route path="/post-event/:id/compliance" component={ComplianceReport} />
      <Route path="/post-event/:id/followups" component={InvestorFollowUps} />
      <Route path="/compliance/audit-log" component={ComplianceAuditLog} />
      <Route path="/operator/:eventId/sentiment" component={SentimentDashboard} />
      <Route path="/ai-dashboard" component={AIDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/admin/panel" component={AdminPanel} />
      <Route path="/compliance/dashboard" component={ComplianceDashboard} />
      <Route path="/event-brief/:id" component={EventBriefGenerator} />
      <Route path="/event-brief" component={EventBriefGenerator} />
      <Route path="/admin/feature-flags" component={FeatureFlagsDashboard} />
      <Route path="/operator/:eventId/qa" component={ModeratorQAConsole} />
      <Route path="/post-event/:id/redaction" component={RedactionWorkflow} />
      <Route path="/admin/toxicity" component={ToxicityFilterDashboard} />
      <Route path="/transcript/:id/edit" component={TranscriptEditor} />
      <Route path="/post-event/:id/transcript" component={TranscriptPage} />
      <Route path="/operator-hub" component={OperatorHub} />
      <Route path="/ai-shop" component={AIShop} />
      <Route path="/ai-onboarding" component={AIOnboarding} />
      <Route path="/agentic-brain" component={AgenticBrain} />
      <Route path="/autonomous-intervention" component={AutonomousIntervention} />
      <Route path="/tagged-metrics" component={TaggedMetricsDashboard} />
      <Route path="/market-reaction" component={MarketReaction} />
      <Route path="/communication-index" component={CommunicationIndex} />
      <Route path="/investor-questions" component={InvestorQuestionIntelligence} />
      <Route path="/intelligence-report" component={IntelligenceReportPage} />
      <Route path="/call-preparation" component={CallPreparation} />
      <Route path="/intelligence-terminal" component={IntelligenceTerminal} />
      <Route path="/shadow-mode" component={ShadowMode} />
      <Route path="/health-guardian" component={HealthGuardian} />
      <Route path="/mailing-lists" component={MailingListManager} />
      <Route path="/register/confirm/:token">{(params: any) => <MailingListConfirm params={params} />}</Route>
      <Route path="/bastion" component={Bastion} />
      <Route path="/lumi" component={LumiPartner} />
      <Route path="/archive-upload" component={ArchiveUpload} />
      <Route path="/benchmarks" component={Benchmarks} />
      <Route path="/social" component={SocialMediaPage} />
      <Route path="/podcast-converter" component={PodcastConverter} />
      <Route path="/sustainability" component={SustainabilityDashboard} />
      <Route path="/feature-map" component={FeatureMap} />
      <Route path="/admin/interconnection-analytics" component={InterconnectionAnalytics} />
      <Route path="/virtual-studio" component={VirtualStudio} />
      <Route path="/operator-links" component={OperatorLinks} />
      <Route path="/features/:id" component={FeatureDetail} />
      <Route path="/bundles/:id" component={BundleDetail} />
      <Route path="/workflows" component={WorkflowsPage} />
      <Route path="/intelligent-broadcaster" component={IntelligentBroadcasterPage} />
      <Route path="/webcast-recap" component={WebcastRecapPage} />
      <Route path="/training/:module" component={TrainingSubPage} />
      <Route path="/support" component={OperatorQuickRef} />
      <Route path="/docs" component={OperatorQuickRef} />
      <Route path="/certification" component={OperatorQuickRef} />
      <Route path="/feedback" component={OperatorQuickRef} />
      <Route path="/whats-new" component={OperatorQuickRef} />
      <Route path="/my-dashboard" component={OperatorQuickRef} />
      <Route path="/live-sentiment">{() => { window.location.replace("/operator/q4-earnings-2026/sentiment"); return null; }}</Route>
      <Route path="/post-event">{() => { window.location.replace("/post-event/q4-earnings-2026"); return null; }}</Route>
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
          <BackToLinks />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
