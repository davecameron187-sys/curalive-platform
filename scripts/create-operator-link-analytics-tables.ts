import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

const tables = [
  `CREATE TABLE IF NOT EXISTS operator_link_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operator_id INT,
    link_path VARCHAR(255) NOT NULL,
    link_title VARCHAR(255),
    category VARCHAR(64),
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    time_spent_seconds INT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    session_id VARCHAR(128),
    INDEX idx_operator_id (operator_id),
    INDEX idx_link_path (link_path),
    INDEX idx_accessed_at (accessed_at)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS operator_links_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    link_path VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    badge_type VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    click_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_sort_order (sort_order)
  ) ENGINE=InnoDB`,
];

const seed = `INSERT IGNORE INTO operator_links_metadata (link_path, title, description, category, badge_type, sort_order) VALUES
  ('/operator-hub', 'Operator Hub', 'Start here — full learning path, call-type guides, quick reference', 'training', 'TRAINING', 1),
  ('/training', 'OCC Training Guide', '4-phase interactive guide covering OCC layout, Q&A, compliance', 'training', 'TRAINING', 2),
  ('/training-mode', 'Training Mode Console', 'Isolated sandbox for practice', 'training', 'TRAINING', 3),
  ('/operator-guide', 'Operator Reference Guide', 'Quick-reference for dial-in numbers and escalation', 'training', 'TRAINING', 4),
  ('/training/virtual-studio', 'Virtual Studio Training', 'Configure bundle-specific broadcast environments', 'training', 'NEW', 5),
  ('/training/ai-features', 'AI Features Training', 'Master all 16 AI features', 'training', 'NEW', 6),
  ('/occ', 'Operator Console (OCC)', 'Main operator workspace', 'console', 'CONSOLE', 10),
  ('/operator/analytics', 'Operator Analytics', 'Personal performance dashboard', 'console', 'ANALYTICS', 11),
  ('/virtual-studio', 'Virtual Studio Console', 'Configure broadcast environments and ESG flags', 'console', 'NEW', 12),
  ('/live-sentiment', 'Live Sentiment Dashboard', 'Real-time sentiment analysis during broadcast', 'console', 'NEW', 13),
  ('/intelligent-broadcaster', 'Intelligent Broadcaster Panel', 'AI-powered alerts and recommendations', 'console', 'NEW', 14),
  ('/events/schedule', 'Schedule an Event', 'Create Audio Bridge / Earnings Call conferences', 'setup', 'SETUP', 20),
  ('/events/calendar', 'Event Calendar', 'View all scheduled, live, and completed events', 'setup', 'SETUP', 21),
  ('/live-video/webcasting', 'Webcasting Hub', 'Create and manage Audio and Video Webcasts', 'setup', 'SETUP', 22),
  ('/live-video/webcast/create', 'Create New Webcast', 'Step-by-step webcast creation wizard', 'setup', 'SETUP', 23),
  ('/virtual-studio', 'Studio Configuration', 'Pre-event Virtual Studio setup', 'setup', 'NEW', 24),
  ('/feature-map', 'Feature Interconnection Map', 'Interactive visualization of all 16 AI features', 'interconnection', 'NEW', 30),
  ('/admin/interconnection-analytics', 'Interconnection Analytics Dashboard', 'ROI tracking and adoption metrics', 'interconnection', 'NEW', 31),
  ('/workflows', 'Recommended Workflows', 'Pre-configured feature activation sequences', 'interconnection', 'NEW', 32),
  ('/ai-shop', 'AI Shop', 'Browse all 16 AI features and bundles', 'interconnection', 'NEW', 33),
  ('/post-event/q4-earnings-2026', 'Post-Event Report', 'AI-generated summaries and ROI tracking', 'interconnection', 'NEW', 34),
  ('/webcast-recap', 'Webcast Recap Generator', 'Generate video recaps and social content', 'interconnection', 'NEW', 35),
  ('/features/live-transcription', 'Live Transcription', 'Real-time speech-to-text', 'features', 'FEATURE', 40),
  ('/features/sentiment-analysis', 'Sentiment Analysis', 'Monitor live investor mood', 'features', 'FEATURE', 41),
  ('/features/qa-triage', 'Q&A Auto-Triage', 'Smart question categorisation', 'features', 'FEATURE', 42),
  ('/features/compliance', 'Compliance Check', 'Regulatory risk scoring', 'features', 'FEATURE', 43),
  ('/features/lead-scoring', 'Lead Scoring', 'Hot/Warm/Cold investor signals', 'features', 'FEATURE', 44),
  ('/features/follow-ups', 'Investor Follow-Ups', 'Personalised post-event outreach', 'features', 'FEATURE', 45),
  ('/features/event-brief', 'Event Brief', 'Pre-event AI briefing pack', 'features', 'FEATURE', 46),
  ('/features/rolling-summary', 'Rolling Summary', 'Live 60-second summaries', 'features', 'FEATURE', 47),
  ('/features/press-release', 'Press Release', 'SENS/RNS-compliant press release', 'features', 'FEATURE', 48),
  ('/features/event-echo', 'Event Echo', 'AI-generated social media posts', 'features', 'FEATURE', 49),
  ('/features/podcast', 'Podcast Converter', 'Convert webcast to investor podcast', 'features', 'FEATURE', 50),
  ('/features/sustainability', 'Sustainability Tracker', 'Carbon footprint and ESG certification', 'features', 'FEATURE', 51),
  ('/features/video-recap', 'AI Video Recap', 'Post-event video brief', 'features', 'FEATURE', 52),
  ('/features/toxicity', 'Toxicity Filter', 'Content safety and moderation', 'features', 'FEATURE', 53),
  ('/features/pace-coach', 'Pace Coach', 'Real-time speaking pace feedback', 'features', 'FEATURE', 54),
  ('/features/broadcaster', 'Intelligent Broadcaster', 'Unified AI alert panel', 'features', 'FEATURE', 55),
  ('/bundles/investor-relations', 'Bundle A: Investor Relations', '6 features for IR teams', 'bundles', 'BUNDLE', 60),
  ('/bundles/compliance', 'Bundle B: Compliance & Risk', 'Regulatory monitoring suite', 'bundles', 'BUNDLE', 61),
  ('/bundles/operations', 'Bundle C: Operations', 'Efficiency tools for operators', 'bundles', 'BUNDLE', 62),
  ('/bundles/content', 'Bundle D: Content Marketing', 'Multi-channel content generation', 'bundles', 'BUNDLE', 63),
  ('/bundles/premium', 'Bundle E: Premium', 'All features combined', 'bundles', 'BUNDLE', 64),
  ('/bundles/social', 'Bundle F: Social Amplification', 'Social media amplification add-on', 'bundles', 'BUNDLE', 65),
  ('/support', 'Support & Escalation', 'Get help and contact support', 'quickref', 'CONSOLE', 70),
  ('/docs', 'Documentation', 'Complete platform documentation', 'quickref', 'CONSOLE', 71),
  ('/certification', 'Certification', 'Operator certification program', 'quickref', 'TRAINING', 72),
  ('/my-dashboard', 'My Dashboard', 'Personal performance and training overview', 'quickref', 'ANALYTICS', 73),
  ('/feedback', 'Feedback & Suggestions', 'Share feedback on AI feature performance', 'quickref', 'CONSOLE', 74),
  ('/whats-new', 'What''s New', 'Latest platform updates', 'quickref', 'NEW', 75)`;

async function main() {
  const db = await getDb();
  console.log("[create-tables] Creating operator link analytics tables...");
  for (const table of tables) {
    await db.execute(sql.raw(table));
    const name = table.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    console.log(`  ✓ ${name}`);
  }
  console.log("[create-tables] Seeding operator_links_metadata...");
  await db.execute(sql.raw(seed));
  console.log("  ✓ Seeded 50 link records");
  console.log("[create-tables] ✅ Done");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
