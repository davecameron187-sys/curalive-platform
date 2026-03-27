# Manus ↔ ChatGPT Sync Protocol
## CuraLive Operator Console Development

**Purpose:** Enable seamless collaboration between Manus (implementation) and ChatGPT (architecture/strategy) on the Operator Console project.

**Last Updated:** 27 March 2026  
**Status:** Active

---

## Overview

This document establishes a bidirectional sync protocol between:
- **Manus Agent** (handles code implementation, testing, deployment)
- **ChatGPT** (handles architecture, design, strategy, documentation)
- **User** (provides direction, reviews progress, approves decisions)

---

## 1. Sync Mechanism

### 1.1 Single Source of Truth

All project state is tracked in **two locations**:

1. **Manus-side:** `/home/ubuntu/chorus-ai/todo.md` (implementation tasks)
2. **ChatGPT-side:** This document + `OPERATOR_CONSOLE_ROADMAP.md` (architecture/strategy)
3. **Shared:** `OPERATOR_CONSOLE_ARCHITECTURE.md` (current state, both platforms read/write)

### 1.2 Sync Frequency

- **Real-time:** Critical decisions, blockers, architecture changes
- **Checkpoint-based:** After each major implementation milestone
- **Daily:** Summary of progress and next steps

### 1.3 Communication Flow

```
User Request
    ↓
Manus: Audit & Plan
    ↓
ChatGPT: Review & Suggest Architecture
    ↓
Manus: Implement
    ↓
ChatGPT: Review Code & Documentation
    ↓
Manus: Test & Deploy
    ↓
User: Approve & Iterate
```

---

## 2. Manus Responsibilities

### 2.1 Implementation

- ✅ Audit current Shadow Mode and Live Q&A code
- ✅ Build/refine Operator Console components
- ✅ Implement tRPC procedures and backend services
- ✅ Write comprehensive tests (vitest)
- ✅ Deploy and validate in dev environment
- ✅ Save checkpoints after each phase

### 2.2 Documentation

- ✅ Update `todo.md` with implementation progress
- ✅ Maintain `OPERATOR_CONSOLE_ARCHITECTURE.md` with current state
- ✅ Document all code changes and rationale
- ✅ Create testing reports and validation results

### 2.3 Reporting

- ✅ After each checkpoint: Summary of what was built
- ✅ Any blockers or decisions requiring ChatGPT input
- ✅ Test results and code quality metrics
- ✅ Recommended next steps

---

## 3. ChatGPT Responsibilities

### 3.1 Architecture & Strategy

- 🤖 Review Manus implementation against roadmap
- 🤖 Suggest architectural improvements
- 🤖 Identify potential issues or edge cases
- 🤖 Recommend best practices and patterns
- 🤖 Help with complex algorithm design

### 3.2 Documentation

- 🤖 Create architecture diagrams and flow charts
- 🤖 Write technical specifications
- 🤖 Document design decisions and rationale
- 🤖 Create user-facing documentation
- 🤖 Generate implementation guides

### 3.3 Code Review

- 🤖 Review code for quality and patterns
- 🤖 Suggest refactoring opportunities
- 🤖 Validate against requirements
- 🤖 Identify potential performance issues
- 🤖 Ensure consistency with architecture

---

## 4. Project Phases & Sync Points

### Phase 1: Lock Core Operator Console

**Manus Tasks:**
- [ ] Audit Shadow Mode console code
- [ ] Audit Live Q&A code
- [ ] Create/refine Transcript Panel
- [ ] Create/refine Intelligence Panel
- [ ] Create/refine Session Controls
- [ ] Write tests for all components
- [ ] Deploy to dev environment

**ChatGPT Tasks:**
- [ ] Review Shadow Mode architecture
- [ ] Suggest Transcript Panel improvements
- [ ] Design Intelligence Panel signals
- [ ] Review Session Controls state machine
- [ ] Create technical specification
- [ ] Document design decisions

**Sync Point:** After Manus completes audit, before implementation starts

---

### Phase 2: Implement Live Q&A Tab

**Manus Tasks:**
- [ ] Integrate Live Q&A into Shadow Mode
- [ ] Create Q&A Tab component
- [ ] Implement question queue management
- [ ] Add approve/reject/hold actions
- [ ] Integrate with speaker workflow
- [ ] Write tests for Q&A functionality
- [ ] Deploy to dev environment

**ChatGPT Tasks:**
- [ ] Design Q&A Tab UX
- [ ] Suggest queue management algorithm
- [ ] Design action workflow
- [ ] Create compliance screening logic
- [ ] Document Q&A procedures
- [ ] Create operator training guide

**Sync Point:** After Phase 1 complete, before Phase 2 starts

---

### Phase 3: Deepen Operator Workflow

**Manus Tasks:**
- [ ] Implement action logging
- [ ] Add keyboard shortcuts
- [ ] Create alert system
- [ ] Add role-specific views
- [ ] Implement workflow prompts
- [ ] Write tests
- [ ] Deploy to dev environment

**ChatGPT Tasks:**
- [ ] Design action logging schema
- [ ] Suggest keyboard shortcuts
- [ ] Design alert prioritization
- [ ] Create role definitions
- [ ] Document workflows
- [ ] Create operator playbooks

**Sync Point:** After Phase 2 complete, before Phase 3 starts

---

## 5. Checkpoint Protocol

After each phase, Manus saves a checkpoint with:

```
Checkpoint: [Phase Name]
Version: [version_id]
Status: [Complete/In Progress/Blocked]

What Was Built:
- [Feature 1]
- [Feature 2]
- [Feature 3]

Tests: [X/Y passing]
Blockers: [None/List]
Next Steps: [Recommended actions]

ChatGPT Review Needed: [Yes/No]
```

**ChatGPT then:**
1. Reviews the checkpoint
2. Validates against roadmap
3. Suggests improvements
4. Approves or requests changes
5. Documents learnings

---

## 6. Communication Template

### Manus → ChatGPT

```
**Checkpoint: [Phase Name]**
Version: [ID]

**Completed:**
- [Task 1] ✅
- [Task 2] ✅

**Tests:** [X/Y passing]

**Blockers:** [None or list]

**Next Steps:** [Recommended]

**ChatGPT Input Needed On:**
- [Question 1]
- [Question 2]
```

### ChatGPT → Manus

```
**Review: [Phase Name]**

**Validation:** ✅ Meets roadmap requirements

**Suggestions:**
1. [Improvement 1]
2. [Improvement 2]

**Architecture Notes:**
- [Note 1]
- [Note 2]

**Approved For:** [Next phase or deployment]
```

---

## 7. Decision Matrix

| Decision | Manus | ChatGPT | User |
|----------|-------|---------|------|
| **Code implementation** | ✅ Final | 🤖 Review | ✅ Approve |
| **Architecture** | 📋 Input | 🤖 Final | ✅ Approve |
| **Design/UX** | 📋 Input | 🤖 Final | ✅ Approve |
| **Testing strategy** | ✅ Final | 🤖 Review | ✅ Approve |
| **Deployment** | ✅ Final | 🤖 Review | ✅ Approve |
| **Scope changes** | 📋 Input | 📋 Input | ✅ Final |
| **Timeline** | ✅ Estimate | 🤖 Review | ✅ Approve |

---

## 8. Escalation Path

**If Manus encounters a blocker:**
1. Document in checkpoint
2. Flag "ChatGPT Input Needed"
3. Wait for ChatGPT review
4. User makes final decision if needed

**If ChatGPT identifies an issue:**
1. Document in review
2. Suggest solution
3. Manus implements or discusses
4. User makes final decision if needed

**If User disagrees:**
1. User provides direction
2. Both platforms adjust
3. Continue with new understanding

---

## 9. Documentation Standards

### Manus Documentation
- Code comments explaining complex logic
- Test descriptions explaining what's tested
- Checkpoint summaries with metrics
- Architecture decisions in code

### ChatGPT Documentation
- Architecture diagrams
- Design specifications
- Technical guides
- Training materials

### Shared Documentation
- `OPERATOR_CONSOLE_ROADMAP.md` — Requirements
- `OPERATOR_CONSOLE_ARCHITECTURE.md` — Current state
- `todo.md` — Implementation tasks
- This file — Sync protocol

---

## 10. Quality Gates

### Before Manus Deploys
- ✅ All tests passing
- ✅ TypeScript compilation successful
- ✅ Code review by ChatGPT (if complex)
- ✅ Checkpoint created
- ✅ Documentation updated

### Before ChatGPT Approves
- ✅ Code meets architecture spec
- ✅ Tests are comprehensive
- ✅ Documentation is complete
- ✅ No blockers identified
- ✅ Ready for next phase

### Before User Deploys to Production
- ✅ All phases complete
- ✅ Comprehensive testing done
- ✅ Documentation reviewed
- ✅ User approval obtained
- ✅ Rollback plan in place

---

## 11. Current Status

### Completed
- ✅ Viasocket real-time integration (Phase 0)
- ✅ Operator Console foundation (OperatorConsole.tsx)
- ✅ Session management procedures
- ✅ Operator notes and action logging

### In Progress
- 🔄 Manus-ChatGPT sync setup (this document)
- 🔄 Architecture audit and gap analysis

### Next
- ⏳ Phase 1: Lock core console
- ⏳ Phase 2: Live Q&A tab integration
- ⏳ Phase 3: Deepen operator workflow

---

## 12. How to Use This Document

### For Manus
- Reference this when creating checkpoints
- Use communication template for updates
- Check decision matrix for ownership
- Follow quality gates before deploying

### For ChatGPT
- Reference this when reviewing Manus work
- Use communication template for feedback
- Check decision matrix for authority
- Follow quality gates before approving

### For User
- Review checkpoints from both platforms
- Make decisions using escalation path
- Approve major milestones
- Provide direction on scope changes

---

## 13. Sync Checklist

Before each phase starts:
- [ ] Manus has completed audit
- [ ] ChatGPT has reviewed architecture
- [ ] User has approved phase scope
- [ ] This document is updated
- [ ] `todo.md` is synchronized
- [ ] `OPERATOR_CONSOLE_ARCHITECTURE.md` is current
- [ ] Both platforms understand deliverables
- [ ] Quality gates are clear

---

## 14. Contact & Escalation

**Manus Issues:**
- Document in checkpoint
- Flag in communication
- Wait for ChatGPT review

**ChatGPT Issues:**
- Document in review
- Suggest solution
- Wait for Manus response

**Scope/Timeline Issues:**
- Escalate to User
- User makes final decision
- Both platforms adjust

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-27 | Initial sync protocol created |
| | | 7 phases defined |
| | | Communication templates established |
| | | Quality gates documented |

---

**This protocol enables powerful collaboration. Manus handles implementation, ChatGPT handles architecture, and the User guides direction. Together, we'll build a world-class Operator Console.**
