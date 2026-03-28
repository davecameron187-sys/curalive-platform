-- Chorus.AI Database Index Optimization Script
-- Purpose: Create strategic indexes for production performance
-- Target: <200ms response time for operator console queries
-- Last Updated: March 28, 2026

-- ============================================================================
-- PART 1: QUESTIONS TABLE INDEXES (HIGHEST PRIORITY)
-- ============================================================================

-- Index 1: Session-based question filtering (most common query)
-- Used by: Operator console, moderator dashboard
-- Query: SELECT * FROM questions WHERE session_id = ? ORDER BY created_at DESC
CREATE INDEX idx_questions_session_id ON questions(session_id, created_at DESC);

-- Index 2: Status-based filtering within session
-- Used by: Q&A moderation, approval workflow
-- Query: SELECT * FROM questions WHERE session_id = ? AND status = ?
CREATE INDEX idx_questions_session_status ON questions(session_id, status);

-- Index 3: Compliance risk filtering (high priority for moderators)
-- Used by: Moderator dashboard, priority sorting
-- Query: SELECT * FROM questions WHERE session_id = ? AND compliance_risk > ?
CREATE INDEX idx_questions_compliance_risk ON questions(session_id, compliance_risk DESC);

-- Index 4: Priority-based sorting
-- Used by: Moderator dashboard, speaker assignment
-- Query: SELECT * FROM questions WHERE session_id = ? ORDER BY priority DESC
CREATE INDEX idx_questions_priority ON questions(session_id, priority DESC);

-- Index 5: Sentiment-based filtering
-- Used by: Sentiment analysis dashboard, filtering
-- Query: SELECT * FROM questions WHERE session_id = ? AND sentiment < ?
CREATE INDEX idx_questions_sentiment ON questions(session_id, sentiment);

-- Index 6: Speaker assignment queries
-- Used by: Presenter teleprompter, speaker Q&A
-- Query: SELECT * FROM questions WHERE session_id = ? AND assigned_speaker_id = ?
CREATE INDEX idx_questions_assigned_speaker ON questions(session_id, assigned_speaker_id);

-- Index 7: Timestamp-based queries (for analytics)
-- Used by: Post-event analytics, historical queries
-- Query: SELECT * FROM questions WHERE session_id = ? AND created_at BETWEEN ? AND ?
CREATE INDEX idx_questions_created_at ON questions(session_id, created_at);

-- Index 8: Composite index for complex filtering
-- Used by: Advanced filtering, compliance + status
-- Query: SELECT * FROM questions WHERE session_id = ? AND status = ? AND compliance_risk > ?
CREATE INDEX idx_questions_session_status_compliance ON questions(session_id, status, compliance_risk DESC);

-- ============================================================================
-- PART 2: OPERATOR SESSIONS TABLE INDEXES
-- ============================================================================

-- Index 1: Event-based session lookup
-- Used by: Event dashboard, session list
-- Query: SELECT * FROM operator_sessions WHERE event_id = ?
CREATE INDEX idx_operator_sessions_event_id ON operator_sessions(event_id);

-- Index 2: Operator-based session lookup
-- Used by: Operator dashboard, session history
-- Query: SELECT * FROM operator_sessions WHERE operator_id = ?
CREATE INDEX idx_operator_sessions_operator_id ON operator_sessions(operator_id);

-- Index 3: Status-based filtering
-- Used by: Active session tracking
-- Query: SELECT * FROM operator_sessions WHERE status = ?
CREATE INDEX idx_operator_sessions_status ON operator_sessions(status);

-- Index 4: Composite index for operator sessions
-- Used by: Operator's active sessions
-- Query: SELECT * FROM operator_sessions WHERE operator_id = ? AND status = ?
CREATE INDEX idx_operator_sessions_operator_status ON operator_sessions(operator_id, status);

-- ============================================================================
-- PART 3: AUDIT LOGS TABLE INDEXES
-- ============================================================================

-- Index 1: User-based audit queries
-- Used by: User activity tracking, compliance audit
-- Query: SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);

-- Index 2: Action-based audit queries
-- Used by: Action tracking, compliance reports
-- Query: SELECT * FROM audit_logs WHERE action = ? ORDER BY timestamp DESC
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);

-- Index 3: Timestamp-based queries
-- Used by: Time-range audit reports
-- Query: SELECT * FROM audit_logs WHERE timestamp BETWEEN ? AND ?
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Index 4: Resource-based audit queries
-- Used by: Resource change tracking
-- Query: SELECT * FROM audit_logs WHERE resource_type = ? AND resource_id = ?
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC);

-- ============================================================================
-- PART 4: EVENTS TABLE INDEXES
-- ============================================================================

-- Index 1: Event status filtering
-- Used by: Event dashboard, active events
-- Query: SELECT * FROM events WHERE status = ?
CREATE INDEX idx_events_status ON events(status);

-- Index 2: Event date filtering
-- Used by: Event calendar, scheduling
-- Query: SELECT * FROM events WHERE scheduled_at BETWEEN ? AND ?
CREATE INDEX idx_events_scheduled_at ON events(scheduled_at);

-- Index 3: Operator-event relationship
-- Used by: Operator's events
-- Query: SELECT * FROM events WHERE operator_id = ?
CREATE INDEX idx_events_operator_id ON events(operator_id);

-- ============================================================================
-- PART 5: USERS TABLE INDEXES
-- ============================================================================

-- Index 1: Email lookup (for authentication)
-- Used by: Login, user lookup
-- Query: SELECT * FROM users WHERE email = ?
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Index 2: Role-based user filtering
-- Used by: Admin dashboard, user management
-- Query: SELECT * FROM users WHERE role = ?
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- PART 6: COMPLIANCE RULES TABLE INDEXES
-- ============================================================================

-- Index 1: Event-based rule lookup
-- Used by: Rule evaluation, compliance engine
-- Query: SELECT * FROM compliance_rules WHERE event_id = ? AND enabled = true
CREATE INDEX idx_compliance_rules_event_enabled ON compliance_rules(event_id, enabled);

-- Index 2: Rule type filtering
-- Used by: Rule management UI, rule type queries
-- Query: SELECT * FROM compliance_rules WHERE event_id = ? AND rule_type = ?
CREATE INDEX idx_compliance_rules_type ON compliance_rules(event_id, rule_type);

-- ============================================================================
-- PART 7: RULE EVALUATIONS TABLE INDEXES
-- ============================================================================

-- Index 1: Rule evaluation history
-- Used by: Rule performance tracking
-- Query: SELECT * FROM rule_evaluations WHERE rule_id = ? ORDER BY evaluated_at DESC
CREATE INDEX idx_rule_evaluations_rule_id ON rule_evaluations(rule_id, evaluated_at DESC);

-- Index 2: Question evaluation history
-- Used by: Question compliance history
-- Query: SELECT * FROM rule_evaluations WHERE question_id = ?
CREATE INDEX idx_rule_evaluations_question_id ON rule_evaluations(question_id);

-- ============================================================================
-- PART 8: FULL-TEXT SEARCH INDEXES (OPTIONAL - For Advanced Search)
-- ============================================================================

-- Full-text search on question text (optional, for search features)
-- Used by: Question search, transcript search
-- ALTER TABLE questions ADD FULLTEXT INDEX ft_questions_text (text);

-- ============================================================================
-- PART 9: QUERY OPTIMIZATION VERIFICATION
-- ============================================================================

-- After creating indexes, verify with EXPLAIN ANALYZE
-- Example: EXPLAIN ANALYZE SELECT * FROM questions WHERE session_id = 'test-001' AND status = 'approved' ORDER BY priority DESC;

-- Expected results:
-- - Using index: idx_questions_session_status or idx_questions_session_status_compliance
-- - Rows examined: <100 (for typical session)
-- - Query time: <50ms

-- ============================================================================
-- PART 10: INDEX MAINTENANCE PROCEDURES
-- ============================================================================

-- Analyze table statistics (run weekly)
-- ANALYZE TABLE questions;
-- ANALYZE TABLE operator_sessions;
-- ANALYZE TABLE audit_logs;

-- Optimize table (run monthly)
-- OPTIMIZE TABLE questions;
-- OPTIMIZE TABLE operator_sessions;
-- OPTIMIZE TABLE audit_logs;

-- Check index fragmentation (run monthly)
-- SELECT * FROM information_schema.STATISTICS WHERE TABLE_NAME = 'questions' AND SEQ_IN_INDEX > 1;

-- ============================================================================
-- PART 11: PERFORMANCE TARGETS
-- ============================================================================

-- Target Response Times (after indexes):
-- - Operator console session load: <200ms
-- - Moderator dashboard Q&A list: <300ms
-- - Presenter teleprompter transcript: <100ms
-- - Attendee dashboard: <500ms
-- - Post-event analytics: <2s

-- Monitoring queries:
-- SELECT COUNT(*) FROM questions WHERE session_id = 'test-001'; -- Should use index
-- SELECT COUNT(*) FROM audit_logs WHERE user_id = 1; -- Should use index
-- SELECT COUNT(*) FROM compliance_rules WHERE event_id = 'test-001' AND enabled = true; -- Should use index

-- ============================================================================
-- PART 12: INDEX STATISTICS
-- ============================================================================

-- View all indexes on questions table
-- SHOW INDEX FROM questions;

-- View index usage statistics
-- SELECT * FROM performance_schema.table_io_waits_summary_by_index_usage WHERE OBJECT_NAME = 'questions';

-- ============================================================================
-- DEPLOYMENT NOTES
-- ============================================================================

-- 1. Execute this script in production during low-traffic window
-- 2. Monitor query performance before and after index creation
-- 3. Use EXPLAIN ANALYZE to verify index usage
-- 4. Update query execution plans if needed
-- 5. Document any performance improvements
-- 6. Schedule weekly ANALYZE and monthly OPTIMIZE tasks

-- ============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- ============================================================================

-- DROP INDEX idx_questions_session_id ON questions;
-- DROP INDEX idx_questions_session_status ON questions;
-- DROP INDEX idx_questions_compliance_risk ON questions;
-- DROP INDEX idx_questions_priority ON questions;
-- DROP INDEX idx_questions_sentiment ON questions;
-- DROP INDEX idx_questions_assigned_speaker ON questions;
-- DROP INDEX idx_questions_created_at ON questions;
-- DROP INDEX idx_questions_session_status_compliance ON questions;
-- (and so on for other tables)

-- ============================================================================
-- END OF INDEX OPTIMIZATION SCRIPT
-- ============================================================================
