/**
 * AI Applications Configuration
 * Defines all 28 AI applications with metadata, benefits, stats, and sector/event type mappings
 */

export type Sector = 'financial-services' | 'healthcare' | 'technology' | 'government' | 'corporate' | 'media-entertainment' | 'education' | 'non-profit';
export type EventType = 'earnings-call' | 'investor-day' | 'roadshow' | 'audio-webcast' | 'video-webcast';

export interface AIApplicationMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  stats: {
    metric: string;
    value: string;
  }[];
  sectors: Sector[];
  eventTypes: EventType[];
  priority: 'high' | 'medium' | 'low';
  estimatedROI: string;
  timeToValue: string;
}

export const aiApplications: Record<string, AIApplicationMetadata> = {
  // Real-Time Sentiment Analysis
  'sentiment-dashboard': {
    id: 'sentiment-dashboard',
    name: 'Real-Time Sentiment Dashboard',
    category: 'Real-Time Intelligence',
    description: 'Track investor mood and audience sentiment in real-time with live gauge, timeline, and per-speaker breakdown.',
    benefits: [
      'Monitor investor sentiment throughout the event',
      'Identify sentiment spikes and turning points',
      'Track sentiment by speaker for accountability',
      'Make data-driven decisions during the event'
    ],
    stats: [
      { metric: 'Latency', value: '<500ms' },
      { metric: 'Accuracy', value: '95%' },
      { metric: 'Update Frequency', value: 'Every 30 seconds' },
      { metric: 'Sentiment Categories', value: 'Bullish, Neutral, Bearish' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: '+35% investor engagement',
    timeToValue: 'Immediate (during event)'
  },

  'sentiment-timeline': {
    id: 'sentiment-timeline',
    name: 'Sentiment Timeline Chart',
    category: 'Real-Time Intelligence',
    description: 'Visual timeline showing sentiment evolution throughout the event with key turning points highlighted.',
    benefits: [
      'See sentiment trends over time',
      'Identify which topics drive sentiment changes',
      'Correlate sentiment with Q&A and announcements',
      'Prepare for follow-up conversations'
    ],
    stats: [
      { metric: 'Data Points', value: '1000+ per event' },
      { metric: 'Resolution', value: '1-second intervals' },
      { metric: 'Turning Points Detected', value: 'Automatic' },
      { metric: 'Export Formats', value: 'PDF, CSV, JSON' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Better decision making',
    timeToValue: 'Post-event analysis'
  },

  'sentiment-drivers': {
    id: 'sentiment-drivers',
    name: 'Sentiment Drivers Analysis',
    category: 'Real-Time Intelligence',
    description: 'AI identifies what topics and statements are driving sentiment changes in real-time.',
    benefits: [
      'Understand what resonates with investors',
      'Identify messaging that falls flat',
      'Adjust talking points mid-event',
      'Prepare messaging for follow-ups'
    ],
    stats: [
      { metric: 'Topics Analyzed', value: '50+' },
      { metric: 'Correlation Accuracy', value: '92%' },
      { metric: 'Detection Latency', value: '<2 minutes' },
      { metric: 'Recommendations', value: 'Real-time' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow'],
    priority: 'high',
    estimatedROI: '+40% messaging effectiveness',
    timeToValue: 'Immediate (during event)'
  },

  'speaker-sentiment': {
    id: 'speaker-sentiment',
    name: 'Per-Speaker Sentiment Breakdown',
    category: 'Real-Time Intelligence',
    description: 'Track sentiment impact by individual speaker to understand who resonates most with the audience.',
    benefits: [
      'Measure speaker effectiveness',
      'Identify star performers',
      'Prepare speaker coaching insights',
      'Optimize speaker lineup for future events'
    ],
    stats: [
      { metric: 'Speakers Tracked', value: 'Unlimited' },
      { metric: 'Sentiment Accuracy', value: '94%' },
      { metric: 'Comparison Metrics', value: 'vs. average, vs. peers' },
      { metric: 'Coaching Insights', value: 'Automated' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: '+25% speaker effectiveness',
    timeToValue: 'Post-event analysis'
  },

  'sentiment-spike-detection': {
    id: 'sentiment-spike-detection',
    name: 'Sentiment Spike Detection',
    category: 'Real-Time Intelligence',
    description: 'Automatically detects and alerts on sudden sentiment changes, both positive and negative.',
    benefits: [
      'Get alerted to problems in real-time',
      'Respond to negative sentiment immediately',
      'Capitalize on positive momentum',
      'Prevent sentiment from deteriorating'
    ],
    stats: [
      { metric: 'Detection Latency', value: '<30 seconds' },
      { metric: 'False Positive Rate', value: '<5%' },
      { metric: 'Alert Channels', value: 'Email, SMS, In-app' },
      { metric: 'Spike Threshold', value: 'Customizable' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Crisis prevention',
    timeToValue: 'Immediate (during event)'
  },

  // Transcription & Speech-to-Text
  'live-transcription': {
    id: 'live-transcription',
    name: 'Live Transcription',
    category: 'Transcription & Speech-to-Text',
    description: 'Real-time speech-to-text transcription with speaker identification and timestamp accuracy.',
    benefits: [
      'Capture every word spoken',
      'Enable live Q&A moderation',
      'Create searchable event record',
      'Support accessibility for hearing-impaired attendees'
    ],
    stats: [
      { metric: 'Latency', value: '<1 second' },
      { metric: 'Accuracy', value: '95%+' },
      { metric: 'Languages', value: '15+' },
      { metric: 'Speaker Identification', value: 'Automatic' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '80% manual transcription cost savings',
    timeToValue: 'Immediate (during event)'
  },

  'transcript-search': {
    id: 'transcript-search',
    name: 'Searchable Transcript',
    category: 'Transcription & Speech-to-Text',
    description: 'Full-text search of event transcripts with timestamp navigation and speaker filtering.',
    benefits: [
      'Find specific statements quickly',
      'Locate compliance-relevant statements',
      'Extract quotes for reports',
      'Analyze specific topics'
    ],
    stats: [
      { metric: 'Search Speed', value: '<100ms' },
      { metric: 'Index Coverage', value: '100% of transcript' },
      { metric: 'Filter Options', value: 'Speaker, time, topic' },
      { metric: 'Export Formats', value: 'PDF, Word, CSV' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '5 hours saved per event',
    timeToValue: 'Post-event analysis'
  },

  'transcript-editing': {
    id: 'transcript-editing',
    name: 'Transcript Editing & Correction',
    category: 'Transcription & Speech-to-Text',
    description: 'Easy-to-use interface for correcting transcription errors and adding speaker notes.',
    benefits: [
      'Improve transcript accuracy',
      'Add context and annotations',
      'Maintain version history',
      'Prepare publication-ready transcripts'
    ],
    stats: [
      { metric: 'Correction Time', value: '50% faster than manual' },
      { metric: 'Version History', value: 'Unlimited' },
      { metric: 'Collaboration', value: 'Multi-user editing' },
      { metric: 'Accuracy Improvement', value: '99%+' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '3 hours saved per event',
    timeToValue: 'Post-event'
  },

  'voicemail-transcription': {
    id: 'voicemail-transcription',
    name: 'Voicemail Transcription',
    category: 'Transcription & Speech-to-Text',
    description: 'Automatic transcription of voicemail messages and recorded audio files.',
    benefits: [
      'Convert voicemails to searchable text',
      'Never miss important messages',
      'Create audit trail of communications',
      'Improve response time'
    ],
    stats: [
      { metric: 'Processing Time', value: '<5 minutes' },
      { metric: 'Accuracy', value: '94%+' },
      { metric: 'File Size Limit', value: '500MB' },
      { metric: 'Formats Supported', value: 'MP3, WAV, M4A, OGG' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate'],
    eventTypes: ['audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '90% voicemail processing automation',
    timeToValue: 'Immediate'
  },

  'language-detection': {
    id: 'language-detection',
    name: 'Language Detection & Auto-Transcription',
    category: 'Transcription & Speech-to-Text',
    description: 'Automatically detects spoken language and transcribes in that language.',
    benefits: [
      'Support multi-language events',
      'No manual language selection needed',
      'Enable global event participation',
      'Reduce operational complexity'
    ],
    stats: [
      { metric: 'Languages Detected', value: '50+' },
      { metric: 'Detection Accuracy', value: '99%' },
      { metric: 'Detection Latency', value: '<2 seconds' },
      { metric: 'Transcription Accuracy', value: '94%+' }
    ],
    sectors: ['financial-services', 'technology', 'government', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: 'Enable global events',
    timeToValue: 'Immediate'
  },

  'redaction-workflow': {
    id: 'redaction-workflow',
    name: 'Transcript Redaction & Sensitive Data Handling',
    category: 'Transcription & Speech-to-Text',
    description: 'Automatically identify and redact sensitive information (PII, confidential data) from transcripts.',
    benefits: [
      'Protect sensitive information',
      'Comply with data privacy regulations',
      'Enable safe transcript sharing',
      'Maintain compliance audit trail'
    ],
    stats: [
      { metric: 'Sensitive Data Types', value: '20+' },
      { metric: 'Detection Accuracy', value: '98%' },
      { metric: 'Redaction Speed', value: '<1 minute per event' },
      { metric: 'Compliance Standards', value: 'GDPR, CCPA, HIPAA' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '100% compliance coverage',
    timeToValue: 'Immediate post-event'
  },

  // Content Generation
  'event-brief-generator': {
    id: 'event-brief-generator',
    name: 'Event Brief Generator',
    category: 'Content Generation',
    description: 'AI-generated executive summary of the event with key takeaways, announcements, and action items.',
    benefits: [
      'Save 2-3 hours on manual summary writing',
      'Ensure consistent messaging',
      'Enable quick executive briefing',
      'Create audit trail of event highlights'
    ],
    stats: [
      { metric: 'Generation Time', value: '5-15 seconds' },
      { metric: 'Accuracy', value: '96%' },
      { metric: 'Length', value: '500-1000 words' },
      { metric: 'Customization', value: 'Adjustable tone and detail' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: '90% faster content creation',
    timeToValue: 'Immediate post-event'
  },

  'press-release-generator': {
    id: 'press-release-generator',
    name: 'Press Release Generator',
    category: 'Content Generation',
    description: 'Automatically generate media-ready press releases from event transcripts and highlights.',
    benefits: [
      'Create press releases in minutes, not hours',
      'Maintain consistent brand voice',
      'Enable rapid media distribution',
      'Increase media coverage'
    ],
    stats: [
      { metric: 'Generation Time', value: '10-20 seconds' },
      { metric: 'Format', value: 'AP Style compliant' },
      { metric: 'Revision Cycles', value: '70% fewer' },
      { metric: 'Distribution Ready', value: 'Yes' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: '5 hours saved per event',
    timeToValue: 'Immediate post-event'
  },

  'rolling-summary': {
    id: 'rolling-summary',
    name: 'Rolling Event Summary',
    category: 'Content Generation',
    description: 'Live-updated summary that evolves as the event progresses, ready for immediate distribution.',
    benefits: [
      'Share updates during the event',
      'Build social media content in real-time',
      'Enable live audience engagement',
      'Create content while event is fresh'
    ],
    stats: [
      { metric: 'Update Frequency', value: 'Every 5 minutes' },
      { metric: 'Content Freshness', value: 'Real-time' },
      { metric: 'Distribution Channels', value: 'Email, social, web' },
      { metric: 'Engagement Lift', value: '+45%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+45% social engagement',
    timeToValue: 'During event'
  },

  'talking-points-generator': {
    id: 'talking-points-generator',
    name: 'Talking Points Generator',
    category: 'Content Generation',
    description: 'AI-generated talking points for follow-up conversations with investors, customers, or media.',
    benefits: [
      'Prepare for follow-up conversations',
      'Ensure consistent messaging',
      'Reduce preparation time',
      'Improve conversation outcomes'
    ],
    stats: [
      { metric: 'Generation Time', value: '<1 minute' },
      { metric: 'Points Generated', value: '10-15 per event' },
      { metric: 'Customization', value: 'By audience type' },
      { metric: 'Conversation Lift', value: '+30%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow'],
    priority: 'medium',
    estimatedROI: '+30% conversation effectiveness',
    timeToValue: 'Post-event'
  },

  'qa-analysis': {
    id: 'qa-analysis',
    name: 'Q&A Deep-Dive Analysis',
    category: 'Content Generation',
    description: 'Comprehensive analysis of all Q&A with categorization, sentiment, and investor intent scoring.',
    benefits: [
      'Understand investor concerns',
      'Identify messaging gaps',
      'Prepare for future events',
      'Track investor sentiment trends'
    ],
    stats: [
      { metric: 'Questions Analyzed', value: 'Unlimited' },
      { metric: 'Categories', value: '20+' },
      { metric: 'Sentiment Accuracy', value: '94%' },
      { metric: 'Intent Detection', value: '92%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Better investor understanding',
    timeToValue: 'Post-event'
  },

  'sentiment-report': {
    id: 'sentiment-report',
    name: 'Sentiment Analysis Report',
    category: 'Content Generation',
    description: 'Detailed report on overall event sentiment with trends, drivers, and recommendations.',
    benefits: [
      'Quantify event success',
      'Identify improvement areas',
      'Track sentiment over time',
      'Support decision-making'
    ],
    stats: [
      { metric: 'Report Generation', value: '2-5 minutes' },
      { metric: 'Data Points', value: '1000+' },
      { metric: 'Visualizations', value: '10+ charts' },
      { metric: 'Actionable Insights', value: '5-10 per report' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Data-driven decisions',
    timeToValue: 'Post-event'
  },

  'event-report-generation': {
    id: 'event-report-generation',
    name: 'Comprehensive Event Report',
    category: 'Content Generation',
    description: 'Full event report with transcripts, sentiment analysis, Q&A summary, and recommendations.',
    benefits: [
      'Create professional event documentation',
      'Enable knowledge sharing',
      'Support compliance audits',
      'Track event performance over time'
    ],
    stats: [
      { metric: 'Report Pages', value: '20-50' },
      { metric: 'Generation Time', value: '5-10 minutes' },
      { metric: 'Export Formats', value: 'PDF, Word, HTML' },
      { metric: 'Customization', value: 'Full' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '3 hours saved per event',
    timeToValue: 'Post-event'
  },

  // Investor Intelligence
  'commitment-signals': {
    id: 'commitment-signals',
    name: 'Investor Commitment Signals',
    category: 'Investor Intelligence',
    description: 'AI detects buying intent and commitment signals from investor questions and comments.',
    benefits: [
      'Identify high-probability deals',
      'Prioritize follow-up efforts',
      'Improve deal closure rates',
      'Reduce sales cycle length'
    ],
    stats: [
      { metric: 'Signal Accuracy', value: '88%' },
      { metric: 'Deal Probability Correlation', value: '0.82' },
      { metric: 'Signal Types', value: '15+' },
      { metric: 'Deal Lift', value: '+25%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow'],
    priority: 'high',
    estimatedROI: '+25% deal closure rate',
    timeToValue: 'Post-event'
  },

  'investor-briefing-pack': {
    id: 'investor-briefing-pack',
    name: 'Investor Briefing Pack',
    category: 'Investor Intelligence',
    description: 'Pre-event briefing document with investor profiles, key talking points, and deal scenarios.',
    benefits: [
      'Prepare executives for investor meetings',
      'Ensure consistent messaging',
      'Improve meeting outcomes',
      'Increase deal probability'
    ],
    stats: [
      { metric: 'Preparation Time', value: '70% faster' },
      { metric: 'Investor Profiles', value: 'Unlimited' },
      { metric: 'Talking Points', value: 'Customized' },
      { metric: 'Meeting Success Rate', value: '+40%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['investor-day', 'roadshow'],
    priority: 'high',
    estimatedROI: '+40% meeting success',
    timeToValue: 'Pre-event'
  },

  'investor-debrief-report': {
    id: 'investor-debrief-report',
    name: 'Investor Debrief Report',
    category: 'Investor Intelligence',
    description: 'Post-event analysis of investor feedback, sentiment, and next steps.',
    benefits: [
      'Capture investor feedback systematically',
      'Identify action items',
      'Track investor relationships',
      'Improve future events'
    ],
    stats: [
      { metric: 'Report Generation', value: '<5 minutes' },
      { metric: 'Investor Profiles Updated', value: 'Automatic' },
      { metric: 'Action Items', value: '5-10 per event' },
      { metric: 'Follow-Up Accuracy', value: '95%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow'],
    priority: 'high',
    estimatedROI: '2 hours saved per event',
    timeToValue: 'Post-event'
  },

  'order-book-summary': {
    id: 'order-book-summary',
    name: 'Order Book Summary',
    category: 'Investor Intelligence',
    description: 'AI-generated summary of investor order book activity and trading patterns during event.',
    benefits: [
      'Monitor real-time trading activity',
      'Identify market sentiment shifts',
      'Prepare for market response',
      'Support trading desk decisions'
    ],
    stats: [
      { metric: 'Update Frequency', value: 'Real-time' },
      { metric: 'Data Sources', value: '5+' },
      { metric: 'Accuracy', value: '99%' },
      { metric: 'Latency', value: '<1 second' }
    ],
    sectors: ['financial-services'],
    eventTypes: ['earnings-call', 'investor-day'],
    priority: 'high',
    estimatedROI: 'Better trading decisions',
    timeToValue: 'During event'
  },

  'investor-sentiment-timeline': {
    id: 'investor-sentiment-timeline',
    name: 'Investor Sentiment Timeline',
    category: 'Investor Intelligence',
    description: 'Track how investor sentiment evolves throughout the event with key turning points.',
    benefits: [
      'Understand investor journey',
      'Identify messaging impact',
      'Prepare for follow-ups',
      'Improve future messaging'
    ],
    stats: [
      { metric: 'Data Points', value: '1000+' },
      { metric: 'Resolution', value: '1-second intervals' },
      { metric: 'Turning Points', value: 'Automatic detection' },
      { metric: 'Accuracy', value: '95%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Better investor understanding',
    timeToValue: 'Post-event'
  },

  // Compliance & Risk Management
  'material-statement-flagging': {
    id: 'material-statement-flagging',
    name: 'Material Statement Flagging',
    category: 'Compliance & Risk Management',
    description: 'Automatically identifies and flags statements that may be material for regulatory purposes.',
    benefits: [
      'Ensure regulatory compliance',
      'Reduce compliance risk',
      'Enable compliance review',
      'Create audit trail'
    ],
    stats: [
      { metric: 'Detection Accuracy', value: '97%' },
      { metric: 'False Positive Rate', value: '<3%' },
      { metric: 'Regulatory Standards', value: 'SEC, FINRA, etc.' },
      { metric: 'Alert Latency', value: '<1 minute' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: '100% compliance coverage',
    timeToValue: 'Post-event'
  },

  'compliance-risk-assessment': {
    id: 'compliance-risk-assessment',
    name: 'Compliance Risk Assessment',
    category: 'Compliance & Risk Management',
    description: 'AI-powered risk scoring for compliance violations and regulatory exposure.',
    benefits: [
      'Quantify compliance risk',
      'Prioritize remediation efforts',
      'Support compliance decisions',
      'Reduce regulatory penalties'
    ],
    stats: [
      { metric: 'Risk Categories', value: '20+' },
      { metric: 'Scoring Accuracy', value: '94%' },
      { metric: 'Risk Levels', value: 'Critical, High, Medium, Low' },
      { metric: 'Remediation Time', value: '50% faster' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Risk reduction',
    timeToValue: 'Post-event'
  },

  'compliance-certificate': {
    id: 'compliance-certificate',
    name: 'Compliance Certificate Generation',
    category: 'Compliance & Risk Management',
    description: 'Generate compliance certificates confirming event compliance with regulatory standards.',
    benefits: [
      'Prove compliance to regulators',
      'Support audit requirements',
      'Enable event archival',
      'Reduce audit burden'
    ],
    stats: [
      { metric: 'Generation Time', value: '<5 minutes' },
      { metric: 'Standards Covered', value: 'SEC, FINRA, GDPR, HIPAA' },
      { metric: 'Certificate Validity', value: '7 years' },
      { metric: 'Audit Ready', value: 'Yes' }
    ],
    sectors: ['financial-services', 'healthcare', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Audit compliance',
    timeToValue: 'Post-event'
  },

  'compliance-audit-trail': {
    id: 'compliance-audit-trail',
    name: 'Compliance Audit Trail',
    category: 'Compliance & Risk Management',
    description: 'Complete audit trail of all event activities, decisions, and compliance actions.',
    benefits: [
      'Create compliance documentation',
      'Support regulatory audits',
      'Enable event reconstruction',
      'Reduce compliance risk'
    ],
    stats: [
      { metric: 'Events Logged', value: '1000+' },
      { metric: 'Data Retention', value: '7+ years' },
      { metric: 'Tamper Proof', value: 'Yes' },
      { metric: 'Compliance Ready', value: '100%' }
    ],
    sectors: ['financial-services', 'healthcare', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '100% audit coverage',
    timeToValue: 'Continuous'
  },

  // Speech & Delivery Analysis
  'speaking-pace-analysis': {
    id: 'speaking-pace-analysis',
    name: 'Speaking Pace Analysis',
    category: 'Speech & Delivery Analysis',
    description: 'AI analyzes speaking pace and provides coaching insights for improved delivery.',
    benefits: [
      'Improve speaker effectiveness',
      'Increase audience engagement',
      'Provide speaker coaching',
      'Optimize delivery timing'
    ],
    stats: [
      { metric: 'Pace Measurement', value: 'Words per minute' },
      { metric: 'Coaching Insights', value: '5-10 per speaker' },
      { metric: 'Improvement Potential', value: '+30%' },
      { metric: 'Audience Engagement Lift', value: '+25%' }
    ],
    sectors: ['corporate', 'media-entertainment', 'education', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+25% audience engagement',
    timeToValue: 'Post-event'
  },

  'filler-word-detection': {
    id: 'filler-word-detection',
    name: 'Filler Word Detection',
    category: 'Speech & Delivery Analysis',
    description: 'Detects and counts filler words (um, uh, like, you know) for delivery improvement.',
    benefits: [
      'Improve speaker professionalism',
      'Increase audience perception',
      'Provide targeted coaching',
      'Track improvement over time'
    ],
    stats: [
      { metric: 'Filler Words Detected', value: '50+' },
      { metric: 'Detection Accuracy', value: '96%' },
      { metric: 'Speaker Comparison', value: 'vs. peers' },
      { metric: 'Improvement Potential', value: '+40%' }
    ],
    sectors: ['corporate', 'media-entertainment', 'education', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+20% speaker professionalism',
    timeToValue: 'Post-event'
  },

  'delivery-coaching': {
    id: 'delivery-coaching',
    name: 'Delivery Coaching Insights',
    category: 'Speech & Delivery Analysis',
    description: 'AI-powered coaching recommendations for improving speaker delivery and impact.',
    benefits: [
      'Improve speaker performance',
      'Increase audience engagement',
      'Reduce speaker anxiety',
      'Optimize message delivery'
    ],
    stats: [
      { metric: 'Coaching Areas', value: '15+' },
      { metric: 'Recommendations', value: '5-15 per speaker' },
      { metric: 'Implementation Time', value: '2-4 weeks' },
      { metric: 'Performance Improvement', value: '+35%' }
    ],
    sectors: ['corporate', 'media-entertainment', 'education', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+35% speaker impact',
    timeToValue: 'Post-event'
  },

  // Translation & Localization
  'chat-translation': {
    id: 'chat-translation',
    name: 'Live Chat Translation',
    category: 'Translation & Localization',
    description: 'Real-time translation of chat messages into 15+ languages for global participation.',
    benefits: [
      'Enable global audience participation',
      'Reduce language barriers',
      'Increase international engagement',
      'Expand addressable market'
    ],
    stats: [
      { metric: 'Languages Supported', value: '15+' },
      { metric: 'Translation Latency', value: '<2 seconds' },
      { metric: 'Accuracy', value: '94%' },
      { metric: 'Participants Reached', value: '+200%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+200% international reach',
    timeToValue: 'During event'
  },

  'event-message-translation': {
    id: 'event-message-translation',
    name: 'Event Message Translation',
    category: 'Translation & Localization',
    description: 'Automatic translation of event announcements, summaries, and messages into multiple languages.',
    benefits: [
      'Reach global audiences',
      'Ensure consistent messaging',
      'Reduce translation costs',
      'Enable rapid distribution'
    ],
    stats: [
      { metric: 'Languages Supported', value: '50+' },
      { metric: 'Translation Time', value: '<1 minute' },
      { metric: 'Accuracy', value: '95%' },
      { metric: 'Cost Savings', value: '80%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '80% translation cost savings',
    timeToValue: 'Post-event'
  },

  // Meeting Intelligence
  'live-video-summary': {
    id: 'live-video-summary',
    name: 'Live Video Summary',
    category: 'Meeting Intelligence',
    description: 'Real-time video summary generation for live streaming and recording.',
    benefits: [
      'Create highlight reels automatically',
      'Enable social media content',
      'Improve video engagement',
      'Reduce video editing time'
    ],
    stats: [
      { metric: 'Summary Generation', value: 'Real-time' },
      { metric: 'Highlight Detection', value: 'Automatic' },
      { metric: 'Video Editing Time', value: '90% reduction' },
      { metric: 'Social Engagement Lift', value: '+60%' }
    ],
    sectors: ['technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+60% social engagement',
    timeToValue: 'During event'
  },

  'roadshow-analysis': {
    id: 'roadshow-analysis',
    name: 'Roadshow Meeting Analysis',
    category: 'Meeting Intelligence',
    description: 'AI analysis of roadshow meetings with investor sentiment, commitment signals, and follow-up recommendations.',
    benefits: [
      'Analyze multiple meetings systematically',
      'Identify patterns across meetings',
      'Track investor sentiment trends',
      'Optimize roadshow strategy'
    ],
    stats: [
      { metric: 'Meetings Analyzed', value: 'Unlimited' },
      { metric: 'Analysis Time', value: '<5 minutes per meeting' },
      { metric: 'Insights Generated', value: '10+ per meeting' },
      { metric: 'Deal Lift', value: '+30%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['roadshow'],
    priority: 'high',
    estimatedROI: '+30% deal closure',
    timeToValue: 'Post-meeting'
  },

  // Content Performance Analytics
  'content-performance-analytics': {
    id: 'content-performance-analytics',
    name: 'Content Performance Analytics',
    category: 'Content Performance Analytics',
    description: 'Detailed analytics on how event content performs across channels and audiences.',
    benefits: [
      'Understand content effectiveness',
      'Optimize content strategy',
      'Measure ROI of content',
      'Improve future content'
    ],
    stats: [
      { metric: 'Metrics Tracked', value: '50+' },
      { metric: 'Channels Covered', value: 'Email, social, web, etc.' },
      { metric: 'Audience Segments', value: 'Unlimited' },
      { metric: 'Actionable Insights', value: '5-10 per event' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: 'Better content strategy',
    timeToValue: 'Post-event'
  },

  // Operations & Efficiency
  'qa-triage': {
    id: 'qa-triage',
    name: 'Smart Q&A Triage',
    category: 'Operations & Efficiency',
    description: 'AI automatically categorizes and prioritizes Q&A for moderation and response.',
    benefits: [
      'Reduce moderation time',
      'Ensure important questions are answered',
      'Improve Q&A quality',
      'Enable faster response'
    ],
    stats: [
      { metric: 'Triage Accuracy', value: '96%' },
      { metric: 'Categories', value: '20+' },
      { metric: 'Moderation Time', value: '70% reduction' },
      { metric: 'Response Time', value: '5x faster' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '70% moderation time reduction',
    timeToValue: 'During event'
  },

  'toxicity-filter': {
    id: 'toxicity-filter',
    name: 'Toxicity Filter',
    category: 'Operations & Efficiency',
    description: 'AI detects and filters toxic, abusive, or inappropriate comments in real-time.',
    benefits: [
      'Maintain professional event environment',
      'Protect speakers and participants',
      'Reduce moderation burden',
      'Improve attendee experience'
    ],
    stats: [
      { metric: 'Detection Accuracy', value: '98%' },
      { metric: 'False Positive Rate', value: '<1%' },
      { metric: 'Response Time', value: '<100ms' },
      { metric: 'Toxicity Categories', value: '15+' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment', 'education', 'government'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: 'Safe event environment',
    timeToValue: 'During event'
  },

  'live-polling': {
    id: 'live-polling',
    name: 'Live Polling & Audience Interaction',
    category: 'Operations & Efficiency',
    description: 'Interactive polling and audience engagement tools with real-time results visualization.',
    benefits: [
      'Increase audience engagement',
      'Gather real-time feedback',
      'Create interactive experience',
      'Improve attendee satisfaction'
    ],
    stats: [
      { metric: 'Poll Types', value: '5+' },
      { metric: 'Participants', value: 'Unlimited' },
      { metric: 'Results Latency', value: '<1 second' },
      { metric: 'Engagement Lift', value: '+50%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'high',
    estimatedROI: '+50% engagement',
    timeToValue: 'During event'
  },

  'event-scheduling': {
    id: 'event-scheduling',
    name: 'Event Scheduling & Calendar',
    category: 'Operations & Efficiency',
    description: 'AI-powered event scheduling with conflict detection, timezone management, and optimization.',
    benefits: [
      'Reduce scheduling conflicts',
      'Optimize attendee availability',
      'Simplify calendar management',
      'Improve attendance rates'
    ],
    stats: [
      { metric: 'Scheduling Time', value: '80% faster' },
      { metric: 'Conflict Detection', value: '100%' },
      { metric: 'Timezone Support', value: '24/7' },
      { metric: 'Attendance Improvement', value: '+25%' }
    ],
    sectors: ['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'],
    priority: 'medium',
    estimatedROI: '+25% attendance',
    timeToValue: 'Pre-event'
  },

  // Automated Follow-Up
  'automated-investor-followup': {
    id: 'automated-investor-followup',
    name: 'Automated Investor Follow-Up',
    category: 'Investor Intelligence',
    description: 'Automatically generate and send personalized follow-up emails to investors based on event interactions.',
    benefits: [
      'Send follow-ups 80% faster',
      'Personalize at scale',
      'Improve response rates',
      'Track engagement'
    ],
    stats: [
      { metric: 'Follow-Up Time', value: '80% faster' },
      { metric: 'Personalization Level', value: '95%' },
      { metric: 'Response Rate Lift', value: '+40%' },
      { metric: 'Deal Probability Lift', value: '+25%' }
    ],
    sectors: ['financial-services', 'technology', 'corporate'],
    eventTypes: ['earnings-call', 'investor-day', 'roadshow'],
    priority: 'high',
    estimatedROI: '+40% response rate',
    timeToValue: 'Immediate post-event'
  },
};

/**
 * Get AI applications recommended for a specific sector and event type
 */
export function getRecommendedApplications(sector: Sector, eventType: EventType): AIApplicationMetadata[] {
  return Object.values(aiApplications)
    .filter(app => app.sectors.includes(sector) && app.eventTypes.includes(eventType))
    .sort((a, b) => {
      // Sort by priority first, then by name
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || a.name.localeCompare(b.name);
    });
}

/**
 * Get top N recommended applications
 */
export function getTopRecommendedApplications(sector: Sector, eventType: EventType, limit: number = 5): AIApplicationMetadata[] {
  return getRecommendedApplications(sector, eventType).slice(0, limit);
}

/**
 * Get all applications in a specific category
 */
export function getApplicationsByCategory(category: string): AIApplicationMetadata[] {
  return Object.values(aiApplications)
    .filter(app => app.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(Object.values(aiApplications).map(app => app.category));
  return Array.from(categories).sort();
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): Sector[] {
  return ['financial-services', 'healthcare', 'technology', 'government', 'corporate', 'media-entertainment', 'education', 'non-profit'];
}

/**
 * Get all unique event types
 */
export function getAllEventTypes(): EventType[] {
  return ['earnings-call', 'investor-day', 'roadshow', 'audio-webcast', 'video-webcast'];
}
