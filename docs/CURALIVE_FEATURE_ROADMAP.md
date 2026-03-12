# CuraLive Platform — Detailed Feature Roadmap

**Planning Horizon:** 8 weeks (Weeks 1–8)  
**Current Status:** 29 rounds delivered, 10 rounds pending  
**Baseline:** 548 API endpoints, 760 tests, 111 database tables

---

## 📋 EXECUTIVE SUMMARY

| Phase | Duration | Features | Impact | Status |
|-------|----------|----------|--------|--------|
| **Phase 1: Dial-Out & Contacts** | Weeks 1–2 | Multi-Party Dial-Out, IR Contact Loading | High | 🔴 Not Started |
| **Phase 2: OCC Settings & Domain** | Weeks 2–3 | Settings Panel, Custom Domain Setup | Medium | 🔴 Not Started |
| **Phase 3: Accessibility & Captions** | Weeks 3–4 | Closed Captions, Enhanced Sentiment | Medium | 🔴 Not Started |
| **Phase 4: Localization & Content** | Weeks 4–5 | Multi-Language Transcripts, Press Release | High | 🔴 Not Started |
| **Phase 5: Follow-ups & Polish** | Weeks 5–8 | Automated Emails, Advanced Moderation | Medium | 🔴 Not Started |

---

## 🚀 PHASE 1: DIAL-OUT & CONTACTS (Weeks 1–2)

### Feature 1.1: Multi-Party Dial-Out with CSV Import

**Objective:** Allow operators to bulk dial out to multiple participants via CSV upload.

**User Story:**
> As an operator, I want to upload a CSV file with phone numbers and names, then dial out to all participants at once, so that I can quickly populate a conference with attendees.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for dial-out batches
CREATE TABLE dialOutBatches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  occConferenceId INT NOT NULL,
  batchName VARCHAR(255),
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'in_progress', 'completed', 'failed'),
  totalCount INT,
  successCount INT,
  failureCount INT,
  FOREIGN KEY (occConferenceId) REFERENCES occConferences(id)
);

-- New table for individual dial-out records
CREATE TABLE dialOutRecords (
  id INT PRIMARY KEY AUTO_INCREMENT,
  batchId INT NOT NULL,
  phoneNumber VARCHAR(20),
  participantName VARCHAR(255),
  dialStatus ENUM('pending', 'dialing', 'connected', 'failed'),
  dialAttempts INT DEFAULT 0,
  lastAttemptAt TIMESTAMP,
  connectedAt TIMESTAMP,
  FOREIGN KEY (batchId) REFERENCES dialOutBatches(id)
);
```

**Backend Implementation:**

1. **CSV Parser Service** (`server/services/CsvParserService.ts`)
   - Parse CSV file (phone, name columns)
   - Validate phone numbers (E.164 format)
   - Handle encoding (UTF-8, ISO-8859-1)
   - Return structured data

2. **Dial-Out Queue Service** (`server/services/DialOutQueueService.ts`)
   - Queue dial-out jobs
   - Rate limiting (max 5 concurrent dials)
   - Retry logic (3 attempts per number)
   - Track status in real-time

3. **Twilio Integration** (extend `server/webhooks/twilioWebhook.ts`)
   - Bulk dial API calls
   - Handle connection callbacks
   - Update participant state on connection
   - Log failures for retry

4. **tRPC Procedures** (add to `server/routers/occ.ts`)
   ```typescript
   // Upload CSV and create batch
   uploadDialOutBatch: protectedProcedure
     .input(z.object({
       occConferenceId: z.number(),
       csvFile: z.instanceof(File),
     }))
     .mutation(async ({ input, ctx }) => {
       // Parse CSV, validate, create batch
       // Return batchId and preview
     }),

   // Get batch status
   getDialOutBatchStatus: protectedProcedure
     .input(z.object({ batchId: z.number() }))
     .query(async ({ input }) => {
       // Return status, counts, individual record statuses
     }),

   // Cancel batch
   cancelDialOutBatch: protectedProcedure
     .input(z.object({ batchId: z.number() }))
     .mutation(async ({ input }) => {
       // Cancel pending dials
     }),
   ```

**Frontend Implementation:**

1. **Dial-Out Upload Component** (`client/src/components/DialOutUpload.tsx`)
   - File input with drag-and-drop
   - CSV preview table
   - Validation feedback
   - Upload button with progress

2. **Batch Status Panel** (add to `client/src/pages/OCC.tsx`)
   - Real-time status updates via Ably
   - Progress bar (X of Y dialed)
   - Individual record status (pending, dialing, connected, failed)
   - Retry failed button
   - Cancel batch button

3. **CSV Template Download**
   - Provide downloadable template
   - Show example data
   - Document required columns

**Testing:**
- Unit tests for CSV parsing (valid/invalid formats)
- Integration tests for dial-out queue
- Mock Twilio API responses
- Test rate limiting and retry logic
- Test real-time status updates via Ably

**Estimated LOC:** 800–1000  
**Estimated Time:** 5–6 days  
**Dependencies:** Twilio API, Ably real-time  
**Risk:** CSV parsing edge cases, Twilio rate limits

---

### Feature 1.2: Load IR Contacts into Dial Queue

**Objective:** Allow operators to load pre-configured IR contacts directly into the dial queue without manual CSV upload.

**User Story:**
> As an IR operator, I want to load a pre-configured list of investor contacts from the system, so that I can quickly dial out to all investors for an earnings call without manual entry.

#### Technical Requirements

**Database Changes:**
```sql
-- Already exists: irContacts table
-- Add new column to track dial queue assignment
ALTER TABLE irContacts ADD COLUMN dialQueueBatchId INT;
ALTER TABLE irContacts ADD FOREIGN KEY (dialQueueBatchId) REFERENCES dialOutBatches(id);
```

**Backend Implementation:**

1. **IR Contact Service** (extend `server/services/`)
   - Query IR contacts by filter (company, region, analyst type)
   - Validate phone numbers
   - Check for duplicates in current conference
   - Return filtered list

2. **tRPC Procedures** (add to `server/routers/occ.ts`)
   ```typescript
   // Get available IR contacts
   getIrContacts: protectedProcedure
     .input(z.object({
       companyId: z.number().optional(),
       region: z.string().optional(),
       analystType: z.enum(['equity', 'credit', 'sell-side', 'buy-side']).optional(),
     }))
     .query(async ({ input, ctx }) => {
       // Filter and return IR contacts
     }),

   // Load IR contacts into dial queue
   loadIrContactsToDialQueue: protectedProcedure
     .input(z.object({
       occConferenceId: z.number(),
       irContactIds: z.array(z.number()),
     }))
     .mutation(async ({ input, ctx }) => {
       // Create dial-out batch from IR contacts
       // Return batch ID and status
     }),

   // Get IR contact groups (pre-saved filters)
   getIrContactGroups: protectedProcedure
     .query(async ({ ctx }) => {
       // Return saved contact groups (e.g., "Top 50 Equity Analysts")
     }),
   ```

3. **Ably Notification** (extend `server/_core/index.ts`)
   - Notify operator when contacts loaded
   - Real-time update of dial queue

**Frontend Implementation:**

1. **IR Contact Selector** (add to `client/src/pages/OCC.tsx`)
   - Filter UI (company, region, analyst type)
   - Contact list with checkboxes
   - Bulk select/deselect
   - Load to queue button

2. **Quick Load Buttons**
   - "Load Top 50 Analysts"
   - "Load All Equity Analysts"
   - "Load By Region" dropdown

**Testing:**
- Unit tests for IR contact filtering
- Integration tests for batch creation
- Test duplicate detection
- Test real-time notifications

**Estimated LOC:** 400–500  
**Estimated Time:** 3–4 days  
**Dependencies:** IR Contact database, Ably  
**Risk:** Data quality of IR contacts, duplicate handling

---

## 🎛️ PHASE 2: OCC SETTINGS & DOMAIN (Weeks 2–3)

### Feature 2.1: OCC Settings Panel

**Objective:** Allow operators to configure OCC behavior without code changes.

**User Story:**
> As an operator, I want to adjust audio volume, timer thresholds, and dial-in country settings from the OCC UI, so that I can customize the platform for each event without IT support.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for OCC settings per conference
CREATE TABLE occSettings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  occConferenceId INT NOT NULL UNIQUE,
  audioVolume INT DEFAULT 80,
  timerWarningThreshold INT DEFAULT 300, -- seconds (5 min)
  timerCriticalThreshold INT DEFAULT 60, -- seconds (1 min)
  defaultDialInCountry VARCHAR(2) DEFAULT 'US',
  enableAudioAlerts BOOLEAN DEFAULT TRUE,
  enableChatTranslation BOOLEAN DEFAULT FALSE,
  enableSentimentPanel BOOLEAN DEFAULT TRUE,
  maxParticipants INT DEFAULT 1000,
  autoMuteOnJoin BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (occConferenceId) REFERENCES occConferences(id)
);
```

**Backend Implementation:**

1. **Settings Service** (`server/services/OccSettingsService.ts`)
   - Get settings for conference
   - Update settings with validation
   - Apply settings to active conference
   - Broadcast changes via Ably

2. **tRPC Procedures** (add to `server/routers/occ.ts`)
   ```typescript
   // Get OCC settings
   getOccSettings: protectedProcedure
     .input(z.object({ occConferenceId: z.number() }))
     .query(async ({ input, ctx }) => {
       // Return current settings
     }),

   // Update OCC settings
   updateOccSettings: operatorProcedure
     .input(z.object({
       occConferenceId: z.number(),
       audioVolume: z.number().min(0).max(100).optional(),
       timerWarningThreshold: z.number().positive().optional(),
       timerCriticalThreshold: z.number().positive().optional(),
       defaultDialInCountry: z.string().length(2).optional(),
       enableAudioAlerts: z.boolean().optional(),
       enableChatTranslation: z.boolean().optional(),
       enableSentimentPanel: z.boolean().optional(),
       maxParticipants: z.number().positive().optional(),
       autoMuteOnJoin: z.boolean().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Validate and update settings
       // Broadcast to all operators via Ably
     }),

   // Reset settings to defaults
   resetOccSettings: operatorProcedure
     .input(z.object({ occConferenceId: z.number() }))
     .mutation(async ({ input, ctx }) => {
       // Reset to defaults
     }),
   ```

3. **Ably Integration**
   - Broadcast setting changes to all operators
   - Real-time UI updates

**Frontend Implementation:**

1. **Settings Modal** (add to `client/src/pages/OCC.tsx`)
   - Tabbed interface (Audio, Timer, Dial-In, Features)
   - Sliders for volume
   - Number inputs for thresholds
   - Dropdown for country
   - Toggle switches for features
   - Save/Cancel buttons

2. **Settings Tabs:**
   - **Audio:** Volume slider, audio alert toggle
   - **Timer:** Warning threshold, critical threshold
   - **Dial-In:** Default country selector
   - **Features:** Chat translation, sentiment panel, auto-mute
   - **Limits:** Max participants

3. **Real-time Updates**
   - Subscribe to settings changes via Ably
   - Update UI when other operators change settings
   - Show "Settings updated by [Operator Name]" toast

**Testing:**
- Unit tests for settings validation
- Integration tests for Ably broadcast
- Test real-time updates
- Test permission checks (operator only)

**Estimated LOC:** 600–800  
**Estimated Time:** 4–5 days  
**Dependencies:** Ably, database schema  
**Risk:** Real-time sync across operators

---

### Feature 2.2: Custom Domain Setup

**Objective:** Allow customers to use their own domain (e.g., demo.choruscall.ai) instead of the default Manus domain.

**User Story:**
> As a customer, I want to use my own domain for the event URL, so that attendees see my company branding in the URL and it builds trust.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for custom domains
CREATE TABLE customDomains (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  certificateStatus ENUM('pending', 'verified', 'active', 'expired') DEFAULT 'pending',
  dnsVerificationToken VARCHAR(255),
  dnsVerificationStatus BOOLEAN DEFAULT FALSE,
  sslCertificatePath VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verifiedAt TIMESTAMP,
  expiresAt TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id)
);

-- Add domain reference to webcast events
ALTER TABLE webcastEvents ADD COLUMN customDomainId INT;
ALTER TABLE webcastEvents ADD FOREIGN KEY (customDomainId) REFERENCES customDomains(id);
```

**Backend Implementation:**

1. **Domain Verification Service** (`server/services/DomainVerificationService.ts`)
   - Generate DNS verification token
   - Check DNS records
   - Verify domain ownership
   - Request SSL certificate (Let's Encrypt)

2. **tRPC Procedures** (add to `server/routers/customisationRouter.ts`)
   ```typescript
   // Request custom domain
   requestCustomDomain: adminProcedure
     .input(z.object({
       clientId: z.number(),
       domain: z.string().url(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Generate verification token
       // Return DNS record to add
     }),

   // Check domain verification status
   checkDomainVerification: adminProcedure
     .input(z.object({ domainId: z.number() }))
     .query(async ({ input }) => {
       // Check DNS records
       // Return verification status
     }),

   // List custom domains for client
   getClientCustomDomains: protectedProcedure
     .input(z.object({ clientId: z.number() }))
     .query(async ({ input, ctx }) => {
       // Return all custom domains
     }),

   // Assign domain to event
   assignDomainToEvent: protectedProcedure
     .input(z.object({
       eventId: z.number(),
       domainId: z.number(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Update event with domain
     }),
   ```

3. **DNS Verification** (integrate with DNS provider API)
   - Support CNAME record verification
   - Support TXT record verification
   - Automated verification polling

4. **SSL Certificate Management**
   - Request certificate from Let's Encrypt
   - Auto-renewal 30 days before expiry
   - Store certificate in secure location

**Frontend Implementation:**

1. **Domain Setup Wizard** (add to `client/src/pages/AdminBilling.tsx`)
   - Step 1: Enter domain name
   - Step 2: Show DNS record to add
   - Step 3: Verify domain ownership
   - Step 4: Wait for SSL certificate
   - Step 5: Confirm setup complete

2. **Domain Management Dashboard**
   - List all custom domains
   - Show verification status
   - Show SSL certificate expiry
   - Assign domain to events
   - Delete domain option

3. **Event Domain Assignment**
   - Dropdown to select custom domain when creating event
   - Show selected domain in event details
   - Update event URL in real-time

**Testing:**
- Unit tests for DNS verification logic
- Integration tests for domain assignment
- Mock Let's Encrypt API
- Test SSL certificate renewal

**Estimated LOC:** 1000–1200  
**Estimated Time:** 6–7 days  
**Dependencies:** DNS provider API, Let's Encrypt API  
**Risk:** DNS propagation delays, SSL certificate issues

---

## ♿ PHASE 3: ACCESSIBILITY & CAPTIONS (Weeks 3–4)

### Feature 3.1: Closed Captions Overlay

**Objective:** Display real-time closed captions on the event room video feed.

**User Story:**
> As an attendee, I want to see live closed captions on the video feed, so that I can follow the discussion even if I can't hear the audio or speak the language.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for caption segments
CREATE TABLE captionSegments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webcastEventId INT NOT NULL,
  startTime INT, -- milliseconds
  endTime INT,
  text TEXT,
  speaker VARCHAR(255),
  language VARCHAR(5) DEFAULT 'en',
  confidence FLOAT, -- 0-1 (transcription confidence)
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webcastEventId) REFERENCES webcastEvents(id),
  INDEX (webcastEventId, startTime)
);

-- Add caption settings to events
ALTER TABLE webcastEvents ADD COLUMN enableCaptions BOOLEAN DEFAULT TRUE;
ALTER TABLE webcastEvents ADD COLUMN captionLanguage VARCHAR(5) DEFAULT 'en';
ALTER TABLE webcastEvents ADD COLUMN captionPosition ENUM('bottom', 'top', 'left', 'right') DEFAULT 'bottom';
ALTER TABLE webcastEvents ADD COLUMN captionFontSize INT DEFAULT 16;
ALTER TABLE webcastEvents ADD COLUMN captionBackground ENUM('none', 'semi-transparent', 'opaque') DEFAULT 'semi-transparent';
```

**Backend Implementation:**

1. **Caption Service** (`server/services/CaptionService.ts`)
   - Convert transcription to caption format
   - Handle timing (sync with audio)
   - Store caption segments
   - Retrieve captions for playback

2. **Real-time Caption Streaming** (extend `server/_core/index.ts`)
   - Stream captions via Ably as they're generated
   - Include speaker information
   - Include timing data

3. **tRPC Procedures** (add to `server/routers/transcription.ts`)
   ```typescript
   // Get captions for event
   getCaptions: publicProcedure
     .input(z.object({
       webcastEventId: z.number(),
       language: z.string().optional(),
     }))
     .query(async ({ input }) => {
       // Return caption segments with timing
     }),

   // Get caption settings
   getCaptionSettings: publicProcedure
     .input(z.object({ webcastEventId: z.number() }))
     .query(async ({ input }) => {
       // Return caption display settings
     }),

   // Update caption settings (operator only)
   updateCaptionSettings: operatorProcedure
     .input(z.object({
       webcastEventId: z.number(),
       enableCaptions: z.boolean().optional(),
       captionLanguage: z.string().optional(),
       captionPosition: z.enum(['bottom', 'top', 'left', 'right']).optional(),
       captionFontSize: z.number().optional(),
       captionBackground: z.enum(['none', 'semi-transparent', 'opaque']).optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Update settings
       // Broadcast to all attendees via Ably
     }),
   ```

**Frontend Implementation:**

1. **Caption Overlay Component** (`client/src/components/CaptionOverlay.tsx`)
   - Subscribe to caption stream via Ably
   - Display current caption with speaker name
   - Smooth fade-in/fade-out transitions
   - Responsive positioning (bottom, top, left, right)
   - Customizable font size and background

2. **Caption Settings Panel** (add to `client/src/pages/OCC.tsx`)
   - Toggle captions on/off
   - Language selector
   - Position selector
   - Font size slider
   - Background style selector
   - Preview of caption display

3. **Caption Styling**
   - Semi-transparent background for readability
   - High contrast text (white on dark)
   - Accessibility: WCAG AA compliant
   - Responsive: works on mobile and desktop

**Testing:**
- Unit tests for caption formatting
- Integration tests for Ably streaming
- Test caption timing accuracy
- Test language switching
- Test accessibility (WCAG AA)

**Estimated LOC:** 800–1000  
**Estimated Time:** 5–6 days  
**Dependencies:** Transcription service, Ably  
**Risk:** Caption timing sync, real-time performance

---

### Feature 3.2: Enhanced Sentiment Panel with Sparklines

**Objective:** Display sentiment trends with sparkline charts and keyword highlighting.

**User Story:**
> As a moderator, I want to see sentiment trends over time with key emotional keywords highlighted, so that I can understand how the audience mood is changing and respond appropriately.

#### Technical Requirements

**Database Changes:**
```sql
-- Already exists: sentimentSnapshots table
-- Add keyword extraction
ALTER TABLE sentimentSnapshots ADD COLUMN keywords JSON;
ALTER TABLE sentimentSnapshots ADD COLUMN emotionalKeywords JSON;

-- New table for sentiment trends
CREATE TABLE sentimentTrends (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webcastEventId INT NOT NULL,
  timeWindow INT, -- seconds (e.g., 60 for 1-minute window)
  averageSentiment FLOAT,
  positiveCount INT,
  negativeCount INT,
  neutralCount INT,
  topKeywords JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (webcastEventId) REFERENCES webcastEvents(id),
  INDEX (webcastEventId, createdAt)
);
```

**Backend Implementation:**

1. **Sentiment Trend Service** (`server/services/SentimentTrendService.ts`)
   - Calculate sentiment over time windows
   - Extract emotional keywords
   - Identify sentiment shifts
   - Generate sparkline data

2. **Keyword Extraction** (extend `server/services/SentimentAnalysisService.ts`)
   - Extract keywords from transcript
   - Score emotional intensity
   - Filter by relevance
   - Return top keywords per time window

3. **tRPC Procedures** (add to `server/routers/sentiment.ts`)
   ```typescript
   // Get sentiment trends
   getSentimentTrends: publicProcedure
     .input(z.object({
       webcastEventId: z.number(),
       timeWindow: z.number().optional(), // seconds
     }))
     .query(async ({ input }) => {
       // Return sentiment data for sparkline
     }),

   // Get emotional keywords
   getEmotionalKeywords: publicProcedure
     .input(z.object({
       webcastEventId: z.number(),
       limit: z.number().optional(),
     }))
     .query(async ({ input }) => {
       // Return top emotional keywords
     }),

   // Get sentiment shift alerts
   getSentimentShiftAlerts: publicProcedure
     .input(z.object({ webcastEventId: z.number() }))
     .query(async ({ input }) => {
       // Return moments where sentiment shifted significantly
     }),
   ```

**Frontend Implementation:**

1. **Sentiment Sparkline Component** (`client/src/components/SentimentSparkline.tsx`)
   - Chart.js or D3.js sparkline
   - Real-time data updates via Ably
   - Color-coded (green=positive, red=negative, gray=neutral)
   - Tooltip on hover showing exact sentiment value
   - Responsive sizing

2. **Emotional Keywords Panel** (add to `client/src/pages/OCC.tsx`)
   - Display top keywords with sentiment score
   - Color-coded by sentiment
   - Font size proportional to frequency
   - Update in real-time as new keywords emerge

3. **Sentiment Shift Alerts**
   - Highlight moments where sentiment changed significantly
   - Show "Sentiment dropped 30%" alert
   - Link to transcript segment where shift occurred
   - Allow operator to take action (e.g., mute, redirect)

**Testing:**
- Unit tests for sentiment trend calculation
- Integration tests for keyword extraction
- Test sparkline data generation
- Test real-time updates
- Test alert triggering

**Estimated LOC:** 600–800  
**Estimated Time:** 4–5 days  
**Dependencies:** Sentiment analysis service, Chart.js/D3.js  
**Risk:** Real-time performance with large datasets

---

## 🌍 PHASE 4: LOCALIZATION & CONTENT (Weeks 4–5)

### Feature 4.1: Multi-Language Transcript Selector

**Objective:** Allow attendees to select which language to view transcripts in.

**User Story:**
> As an international attendee, I want to view the transcript in my preferred language (French, Portuguese, Swahili, etc.), so that I can fully understand the discussion.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for translated transcripts
CREATE TABLE transcriptTranslations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transcriptVersionId INT NOT NULL,
  targetLanguage VARCHAR(5), -- e.g., 'fr', 'pt', 'sw'
  translatedText LONGTEXT,
  translationProvider ENUM('google', 'deepl', 'openai') DEFAULT 'google',
  translationConfidence FLOAT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcriptVersionId) REFERENCES transcriptVersions(id),
  INDEX (transcriptVersionId, targetLanguage)
);

-- Add language preferences to users
ALTER TABLE users ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'en';
```

**Backend Implementation:**

1. **Translation Service** (`server/services/TranslationService.ts`)
   - Call translation API (Google Translate, DeepL, or OpenAI)
   - Cache translations to avoid duplicate API calls
   - Handle language detection
   - Support 8 languages (EN, FR, PT, SW, ES, DE, IT, JA)

2. **Batch Translation** (background job)
   - Translate transcripts asynchronously
   - Notify user when translation complete
   - Store in database for quick retrieval

3. **tRPC Procedures** (add to `server/routers/transcriptEditorRouter.ts`)
   ```typescript
   // Get available languages for transcript
   getAvailableLanguages: publicProcedure
     .input(z.object({ transcriptVersionId: z.number() }))
     .query(async ({ input }) => {
       // Return list of available languages
     }),

   // Get transcript in specific language
   getTranscriptInLanguage: publicProcedure
     .input(z.object({
       transcriptVersionId: z.number(),
       language: z.string(),
     }))
     .query(async ({ input }) => {
       // Return translated transcript
       // Trigger translation if not available
     }),

   // Request translation
   requestTranscriptTranslation: protectedProcedure
     .input(z.object({
       transcriptVersionId: z.number(),
       targetLanguage: z.string(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Queue translation job
       // Return job ID
     }),

   // Get translation status
   getTranslationStatus: protectedProcedure
     .input(z.object({ jobId: z.string() }))
     .query(async ({ input }) => {
       // Return translation progress
     }),
   ```

4. **Background Job** (extend `server/_core/index.ts`)
   - Use Bull queue for job management
   - Process translations asynchronously
   - Retry on failure
   - Notify user on completion

**Frontend Implementation:**

1. **Language Selector** (add to `client/src/pages/PostEvent.tsx`)
   - Dropdown with supported languages
   - Show translation status (available, pending, failed)
   - Auto-select user's preferred language
   - Remember selection in localStorage

2. **Transcript Display**
   - Show selected language transcript
   - Highlight differences if comparing languages
   - Show translation confidence score
   - Link to original language

3. **Translation Progress**
   - Show "Translating to French..." message
   - Progress bar
   - Notify when complete

**Testing:**
- Unit tests for translation API calls
- Integration tests for background jobs
- Test language detection
- Test caching
- Test user language preference persistence

**Estimated LOC:** 700–900  
**Estimated Time:** 5–6 days  
**Dependencies:** Translation API (Google/DeepL/OpenAI), Bull queue  
**Risk:** Translation quality, API costs, job queue reliability

---

### Feature 4.2: AI Press Release Draft (SENS/RNS-style)

**Objective:** Generate a press release in regulatory format (SENS for South Africa, RNS for UK) based on event content.

**User Story:**
> As an IR manager, I want to generate a press release in SENS/RNS format from the earnings call transcript, so that I can quickly publish regulatory announcements without manual formatting.

#### Technical Requirements

**Database Changes:**
```sql
-- New table for press release drafts
CREATE TABLE pressReleaseDrafts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webcastEventId INT NOT NULL,
  format ENUM('sens', 'rns', 'generic') DEFAULT 'generic',
  title VARCHAR(255),
  headline VARCHAR(500),
  body LONGTEXT,
  keyPoints JSON,
  generatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  editedAt TIMESTAMP,
  publishedAt TIMESTAMP,
  FOREIGN KEY (webcastEventId) REFERENCES webcastEvents(id)
);
```

**Backend Implementation:**

1. **Press Release Generator Service** (`server/services/PressReleaseGeneratorService.ts`)
   - Extract key information from transcript
   - Generate headline and summary
   - Format according to SENS/RNS standards
   - Include regulatory disclaimers
   - Add boilerplate sections

2. **Format Templates**
   - SENS format (South African Disclosure Service)
   - RNS format (UK Regulatory News Service)
   - Generic format (standard press release)

3. **tRPC Procedures** (add to `server/routers/postEventReport.ts`)
   ```typescript
   // Generate press release draft
   generatePressReleaseDraft: protectedProcedure
     .input(z.object({
       webcastEventId: z.number(),
       format: z.enum(['sens', 'rns', 'generic']),
     }))
     .mutation(async ({ input, ctx }) => {
       // Generate draft using LLM
       // Return draft with key points
     }),

   // Get press release draft
   getPressReleaseDraft: protectedProcedure
     .input(z.object({ draftId: z.number() }))
     .query(async ({ input }) => {
       // Return draft content
     }),

   // Update press release draft
   updatePressReleaseDraft: protectedProcedure
     .input(z.object({
       draftId: z.number(),
       title: z.string().optional(),
       headline: z.string().optional(),
       body: z.string().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Update draft
     }),

   // Publish press release
   publishPressRelease: protectedProcedure
     .input(z.object({
       draftId: z.number(),
       publishToRns: z.boolean().optional(),
       publishToSens: z.boolean().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Publish to regulatory services
     }),
   ```

4. **LLM Integration**
   - Use OpenAI GPT-4 to generate press release
   - Provide format-specific prompts
   - Extract key financial data
   - Generate executive summary

**Frontend Implementation:**

1. **Press Release Generator UI** (add to `client/src/pages/PostEvent.tsx`)
   - Format selector (SENS, RNS, Generic)
   - Generate button
   - Show generation progress
   - Display draft in editor

2. **Press Release Editor** (`client/src/components/PressReleaseEditor.tsx`)
   - Rich text editor for body
   - Title and headline inputs
   - Key points section (editable)
   - Preview pane
   - Format-specific preview

3. **Publication Options**
   - Publish to RNS (UK)
   - Publish to SENS (South Africa)
   - Download as PDF
   - Copy to clipboard
   - Email to distribution list

**Testing:**
- Unit tests for LLM prompts
- Integration tests for press release generation
- Test format compliance (SENS, RNS)
- Test regulatory disclaimer inclusion
- Test PDF generation

**Estimated LOC:** 900–1100  
**Estimated Time:** 6–7 days  
**Dependencies:** OpenAI API, regulatory format specifications  
**Risk:** Regulatory compliance, LLM output quality

---

## 📧 PHASE 5: FOLLOW-UPS & POLISH (Weeks 5–8)

### Feature 5.1: Automated Follow-Up Email Drafts

**Objective:** Generate follow-up email drafts for each attendee based on their engagement during the event.

**User Story:**
> As an IR manager, I want to generate personalized follow-up emails for each investor based on their questions and engagement level, so that I can quickly send targeted follow-ups without manual writing.

#### Technical Requirements

**Database Changes:**
```sql
-- Already exists: followupEmails table
-- Add personalization fields
ALTER TABLE followupEmails ADD COLUMN attendeeEngagementScore FLOAT;
ALTER TABLE followupEmails ADD COLUMN questionsAsked JSON;
ALTER TABLE followupEmails ADD COLUMN sentimentDuringEvent FLOAT;
ALTER TABLE followupEmails ADD COLUMN generatedAt TIMESTAMP;
ALTER TABLE followupEmails ADD COLUMN customizationLevel ENUM('generic', 'personalized', 'highly-personalized') DEFAULT 'generic';
```

**Backend Implementation:**

1. **Follow-up Email Generator Service** (`server/services/FollowUpEmailGeneratorService.ts`)
   - Analyze attendee engagement
   - Extract questions asked
   - Determine sentiment during event
   - Generate personalized email content
   - Include relevant talking points

2. **Engagement Scoring**
   - Questions asked: +20 points each
   - Questions upvoted: +10 points each
   - Poll participation: +5 points each
   - Positive sentiment: +10 points
   - Duration watched: +1 point per minute

3. **tRPC Procedures** (add to `server/routers/followups.ts`)
   ```typescript
   // Generate follow-up emails for all attendees
   generateFollowUpEmails: protectedProcedure
     .input(z.object({
       webcastEventId: z.number(),
       customizationLevel: z.enum(['generic', 'personalized', 'highly-personalized']),
     }))
     .mutation(async ({ input, ctx }) => {
       // Generate drafts for all attendees
       // Return count and preview
     }),

   // Get follow-up email draft
   getFollowUpEmailDraft: protectedProcedure
     .input(z.object({ emailId: z.number() }))
     .query(async ({ input }) => {
       // Return email draft with personalization data
     }),

   // Update follow-up email draft
   updateFollowUpEmailDraft: protectedProcedure
     .input(z.object({
       emailId: z.number(),
       subject: z.string().optional(),
       body: z.string().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Update draft
     }),

   // Send follow-up email
   sendFollowUpEmail: protectedProcedure
     .input(z.object({
       emailId: z.number(),
       sendAt: z.date().optional(), // Schedule for later
     }))
     .mutation(async ({ input, ctx }) => {
       // Send via Resend
     }),

   // Send all follow-up emails
   sendAllFollowUpEmails: protectedProcedure
     .input(z.object({
       webcastEventId: z.number(),
       sendAt: z.date().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Send all drafts
     }),
   ```

4. **Email Templates**
   - Generic: Standard thank you + key takeaways
   - Personalized: Include attendee's questions + relevant answers
   - Highly-personalized: Custom talking points based on sentiment + engagement

**Frontend Implementation:**

1. **Follow-Up Email Generator UI** (add to `client/src/pages/PostEvent.tsx`)
   - Customization level selector
   - Generate button
   - Show generation progress
   - Display list of generated emails

2. **Email Draft List** (`client/src/components/FollowUpEmailList.tsx`)
   - List of attendees with engagement scores
   - Email preview on hover
   - Edit button for each email
   - Send/Schedule buttons
   - Bulk send option

3. **Email Editor** (`client/src/components/FollowUpEmailEditor.tsx`)
   - Subject line input
   - Rich text editor for body
   - Personalization tokens ({{attendeeName}}, {{question}}, etc.)
   - Preview pane
   - Send/Schedule buttons

4. **Email Scheduling**
   - Schedule send time
   - Show "Scheduled for [date]" status
   - Allow cancellation before send
   - Confirm send with count

**Testing:**
- Unit tests for engagement scoring
- Integration tests for email generation
- Test personalization token replacement
- Test Resend API integration
- Test scheduling logic

**Estimated LOC:** 800–1000  
**Estimated Time:** 5–6 days  
**Dependencies:** Resend API, LLM for content generation  
**Risk:** Email personalization quality, Resend rate limits

---

### Feature 5.2: Advanced Q&A Moderation

**Objective:** Enhance Q&A moderation with category tags, analyst/retail labels, and priority scoring.

**User Story:**
> As a moderator, I want to categorize questions, label questioners as analysts or retail investors, and prioritize by importance, so that I can efficiently manage Q&A and ensure key questions are answered.

#### Technical Requirements

**Database Changes:**
```sql
-- Add moderation fields to webcastQa
ALTER TABLE webcastQa ADD COLUMN category VARCHAR(50);
ALTER TABLE webcastQa ADD COLUMN questionerType ENUM('analyst', 'retail', 'unknown') DEFAULT 'unknown';
ALTER TABLE webcastQa ADD COLUMN priorityScore INT DEFAULT 0;
ALTER TABLE webcastQa ADD COLUMN moderationNotes TEXT;
ALTER TABLE webcastQa ADD COLUMN answerSummary TEXT;
ALTER TABLE webcastQa ADD COLUMN relatedQuestions JSON;

-- New table for Q&A categories
CREATE TABLE qaCategories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webcastEventId INT NOT NULL,
  categoryName VARCHAR(100),
  color VARCHAR(7), -- hex color
  icon VARCHAR(50),
  FOREIGN KEY (webcastEventId) REFERENCES webcastEvents(id)
);

-- New table for Q&A priority rules
CREATE TABLE qaPriorityRules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  webcastEventId INT NOT NULL,
  keyword VARCHAR(100),
  priorityBoost INT,
  FOREIGN KEY (webcastEventId) REFERENCES webcastEvents(id)
);
```

**Backend Implementation:**

1. **Q&A Moderation Service** (`server/services/QaModerationService.ts`)
   - Categorize questions automatically
   - Detect questioner type (analyst vs retail)
   - Calculate priority score
   - Identify related questions
   - Suggest answers from transcript

2. **Questioner Type Detection**
   - Check if questioner is known analyst
   - Check company affiliation
   - Use LLM to infer from question content
   - Allow manual override

3. **Priority Scoring**
   - Base score from auto-triage (0-100)
   - Boost for keywords (earnings, guidance, risk)
   - Boost for analyst questions (+20)
   - Boost for duplicate questions (-10)
   - Boost for toxic/off-topic (-50)

4. **tRPC Procedures** (add to `server/routers/polls.ts`)
   ```typescript
   // Get Q&A with moderation data
   getQaWithModeration: publicProcedure
     .input(z.object({
       webcastEventId: z.number(),
       sortBy: z.enum(['priority', 'time', 'category']).optional(),
     }))
     .query(async ({ input }) => {
       // Return Q&A with categories, priority, etc.
     }),

   // Update Q&A moderation data
   updateQaModeration: operatorProcedure
     .input(z.object({
       qaId: z.number(),
       category: z.string().optional(),
       questionerType: z.enum(['analyst', 'retail', 'unknown']).optional(),
       priorityScore: z.number().optional(),
       moderationNotes: z.string().optional(),
       answerSummary: z.string().optional(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Update moderation data
       // Broadcast changes via Ably
     }),

   // Get related questions
   getRelatedQuestions: publicProcedure
     .input(z.object({ qaId: z.number() }))
     .query(async ({ input }) => {
       // Return similar questions
     }),

   // Suggest answer from transcript
   suggestAnswerFromTranscript: publicProcedure
     .input(z.object({ qaId: z.number() }))
     .query(async ({ input }) => {
       // Use LLM to find relevant transcript segment
     }),

   // Create Q&A category
   createQaCategory: operatorProcedure
     .input(z.object({
       webcastEventId: z.number(),
       categoryName: z.string(),
       color: z.string(),
       icon: z.string(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Create category
     }),

   // Set priority rule
   setPriorityRule: operatorProcedure
     .input(z.object({
       webcastEventId: z.number(),
       keyword: z.string(),
       priorityBoost: z.number(),
     }))
     .mutation(async ({ input, ctx }) => {
       // Create priority rule
     }),
   ```

**Frontend Implementation:**

1. **Enhanced Q&A Queue** (update `client/src/pages/OCC.tsx`)
   - Show category tags with colors
   - Show questioner type badge (analyst/retail)
   - Show priority score as number or bar
   - Sort by priority/time/category
   - Filter by category or questioner type

2. **Q&A Moderation Panel** (add to `client/src/pages/OCC.tsx`)
   - Category selector dropdown
   - Questioner type selector
   - Priority score slider
   - Moderation notes textarea
   - Answer summary field
   - Related questions list
   - Suggest answer button

3. **Category Management** (add to `client/src/pages/OCC.tsx`)
   - Add/edit/delete categories
   - Color picker
   - Icon selector
   - Apply to existing questions

4. **Priority Rules** (add to `client/src/pages/OCC.tsx`)
   - Add keyword + boost value
   - List of active rules
   - Edit/delete rules
   - Test rule with sample questions

**Testing:**
- Unit tests for priority scoring
- Integration tests for questioner type detection
- Test category assignment
- Test related questions detection
- Test answer suggestion

**Estimated LOC:** 700–900  
**Estimated Time:** 5–6 days  
**Dependencies:** LLM for answer suggestion, Ably for real-time updates  
**Risk:** LLM answer quality, priority scoring accuracy

---

### Feature 5.3: Additional Polish & Optimization

**Objective:** Performance optimization, security hardening, and UX improvements.

**Tasks:**

1. **Performance Optimization** (3–4 days)
   - Database query optimization
   - Add caching layer (Redis)
   - Lazy load components
   - Optimize Ably subscriptions
   - Profile and fix bottlenecks

2. **Security Audit** (3–4 days)
   - Review OAuth flow
   - Test SQL injection prevention
   - Test XSS protection
   - Review CORS configuration
   - Penetration testing

3. **Documentation** (2–3 days)
   - API documentation (OpenAPI/Swagger)
   - Operator training guide
   - Deployment runbook
   - Troubleshooting guide

4. **UX Improvements** (2–3 days)
   - Keyboard shortcuts
   - Dark mode support
   - Mobile responsiveness
   - Accessibility (WCAG AA)
   - Error message improvements

**Estimated LOC:** 500–700  
**Estimated Time:** 10–14 days  
**Risk:** Performance regression, security vulnerabilities

---

## 📊 ROADMAP SUMMARY TABLE

| Phase | Features | Duration | LOC | Priority | Status |
|-------|----------|----------|-----|----------|--------|
| **Phase 1** | Dial-Out, IR Contacts | 2 weeks | 1200–1500 | 🔴 High | 🔴 Not Started |
| **Phase 2** | OCC Settings, Custom Domain | 2 weeks | 1600–2000 | 🟡 Medium | 🔴 Not Started |
| **Phase 3** | Captions, Sentiment | 2 weeks | 1400–1800 | 🟡 Medium | 🔴 Not Started |
| **Phase 4** | Multi-Language, Press Release | 2 weeks | 1600–2000 | 🔴 High | 🔴 Not Started |
| **Phase 5** | Follow-ups, Q&A, Polish | 3 weeks | 2000–2600 | 🟡 Medium | 🔴 Not Started |
| **TOTAL** | 10 features | **8 weeks** | **7800–9900** | — | 🔴 Not Started |

---

## 🎯 IMPLEMENTATION STRATEGY

### Week-by-Week Breakdown

**Week 1–2: Dial-Out & Contacts**
- Mon–Tue: Database schema, CSV parser, dial-out queue
- Wed–Thu: Twilio integration, tRPC procedures
- Fri: Frontend UI, testing, deployment

**Week 2–3: OCC Settings & Domain**
- Mon–Tue: Settings database, service layer
- Wed–Thu: Domain verification, SSL certificates
- Fri: Frontend UI, testing, deployment

**Week 3–4: Captions & Sentiment**
- Mon–Tue: Caption service, Ably streaming
- Wed–Thu: Sentiment trends, keyword extraction
- Fri: Frontend UI, testing, deployment

**Week 4–5: Multi-Language & Press Release**
- Mon–Tue: Translation service, batch jobs
- Wed–Thu: Press release generator, format templates
- Fri: Frontend UI, testing, deployment

**Week 5–8: Follow-ups, Q&A, Polish**
- Week 5: Follow-up email generator
- Week 6: Advanced Q&A moderation
- Week 7–8: Performance, security, documentation

### Parallel Work Streams

**Stream A: Backend Services** (Weeks 1–8)
- Database schema updates
- Service implementations
- tRPC procedure definitions
- Testing and validation

**Stream B: Frontend Components** (Weeks 1–8)
- UI component development
- Real-time integration (Ably)
- Responsive design
- Accessibility compliance

**Stream C: Testing & QA** (Weeks 1–8)
- Unit tests
- Integration tests
- E2E tests
- Performance testing

**Stream D: Documentation** (Weeks 6–8)
- API documentation
- Operator guides
- Deployment runbook
- Troubleshooting guide

### Dependency Management

```
Phase 1 (Dial-Out) → Phase 2 (Settings) → Phase 3 (Captions)
                                         ↓
                                    Phase 4 (Language)
                                         ↓
                                    Phase 5 (Follow-ups)
```

**Critical Path:**
1. Dial-Out (Weeks 1–2) — Enables operator workflows
2. OCC Settings (Weeks 2–3) — Enables customization
3. Captions (Weeks 3–4) — Enables accessibility
4. Multi-Language (Weeks 4–5) — Enables international support
5. Follow-ups (Weeks 5–8) — Enables post-event automation

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Twilio rate limits** | Implement queue with backoff, test with mock API |
| **DNS propagation delays** | Use polling with exponential backoff |
| **Translation API costs** | Implement caching, batch processing, cost monitoring |
| **Real-time performance** | Profile Ably subscriptions, optimize message size |
| **LLM output quality** | Use prompt engineering, human review, fallback templates |

---

## 🚀 GO-LIVE CHECKLIST

### Pre-Launch (Week 8)

- [ ] All features implemented and tested
- [ ] Database migrations applied
- [ ] API endpoints documented
- [ ] Frontend components responsive
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Load testing passed (1000+ concurrent users)
- [ ] Operator training completed
- [ ] Documentation finalized
- [ ] Deployment runbook validated
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] Disaster recovery plan documented

### Launch Day

- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Confirm all features working
- [ ] Notify customers
- [ ] Monitor support tickets

### Post-Launch (Week 9)

- [ ] Collect customer feedback
- [ ] Monitor usage metrics
- [ ] Fix critical bugs
- [ ] Optimize performance
- [ ] Plan next iteration

---

## 📞 RESOURCE REQUIREMENTS

### Development Team

- **Backend Engineers:** 2–3 (tRPC, services, database)
- **Frontend Engineers:** 2–3 (React, Ably, UI components)
- **QA Engineers:** 1–2 (testing, automation)
- **DevOps Engineers:** 1 (deployment, monitoring)
- **Product Manager:** 1 (prioritization, requirements)

### Infrastructure

- **Database:** MySQL 8 (existing)
- **Cache:** Redis (new, for performance)
- **Message Queue:** Bull (new, for background jobs)
- **Real-time:** Ably (existing)
- **Storage:** AWS S3 (existing)
- **Monitoring:** DataDog or New Relic (new)

### Third-Party Services

- **Translation:** Google Translate, DeepL, or OpenAI
- **Email:** Resend (existing)
- **Video:** Mux (existing)
- **Phone:** Twilio, Telnyx (existing)
- **SSL Certificates:** Let's Encrypt (new)

---

## 💰 ESTIMATED EFFORT & COST

### Development Effort

| Phase | Backend | Frontend | QA | Total |
|-------|---------|----------|-----|-------|
| Phase 1 | 8 days | 6 days | 3 days | 17 days |
| Phase 2 | 10 days | 8 days | 4 days | 22 days |
| Phase 3 | 8 days | 8 days | 4 days | 20 days |
| Phase 4 | 10 days | 8 days | 4 days | 22 days |
| Phase 5 | 12 days | 10 days | 5 days | 27 days |
| **TOTAL** | **48 days** | **40 days** | **20 days** | **108 days** |

**Assuming 5-day work week and 1 developer per role:** ~22 weeks with 1 engineer, ~5–6 weeks with 3–4 engineers (parallel streams)

### Infrastructure Costs (Monthly)

- **Redis:** $50–100
- **Monitoring:** $100–200
- **Translation API:** $200–500 (usage-based)
- **SSL Certificates:** Free (Let's Encrypt)
- **Total:** ~$350–800/month

### Third-Party API Costs (Monthly)

- **Translation:** $200–500 (usage-based)
- **Twilio Dial-Out:** $0.01–0.05 per minute
- **Resend Emails:** $0.0001 per email (or flat rate)
- **Total:** Varies by usage

---

## 🎓 LESSONS LEARNED & BEST PRACTICES

### From Existing Codebase

1. **Type Safety First** — Use TypeScript strictly throughout
2. **Test-Driven Development** — Write tests before features
3. **Real-time First** — Use Ably for all collaborative features
4. **Service Layer** — Separate business logic from routes
5. **Database Normalization** — Design schema carefully
6. **Error Handling** — Comprehensive error messages
7. **Monitoring** — Log everything, monitor proactively
8. **Documentation** — Document as you build

### Recommendations for New Features

1. **Start with Database Schema** — Design tables first, then services
2. **Implement Backend First** — Get API working before UI
3. **Write Tests Early** — Aim for 80%+ coverage
4. **Use Ably for Real-time** — Don't reinvent the wheel
5. **Optimize for Performance** — Profile before and after
6. **Security by Default** — Add guards to all mutations
7. **Accessibility First** — WCAG AA from day one
8. **Document APIs** — Use OpenAPI/Swagger

---

## 📞 NEXT STEPS

1. **Prioritize Features** — Confirm which features are highest priority
2. **Allocate Resources** — Assign engineers to phases
3. **Set Deadlines** — Establish target dates for each phase
4. **Create Tickets** — Break down into GitHub issues
5. **Establish Metrics** — Define success criteria for each feature
6. **Plan Sprints** — 2-week sprints aligned with phases
7. **Schedule Reviews** — Weekly progress reviews
8. **Prepare Launch** — Plan go-live strategy

---

**Generated:** March 12, 2026  
**Codebase Version:** 28fd2a56  
**Last Updated:** Latest checkpoint

**Questions?** Contact the product team or engineering lead.
