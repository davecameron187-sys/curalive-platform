# CuraLive Operator Links — Deployment Brief for Replit

**For:** Replit Development Team  
**Date:** March 10, 2026  
**Frontend Link:** https://files.manuscdn.com/user_upload_by_module/session_file/310519663387446759/vcEhQrsyQLBCiYjm.html  
**Status:** Ready for Backend Integration & Live Deployment  
**Priority:** HIGH — Needed for operator training this week

---

## Executive Summary

The CuraLive Operator Links page is a comprehensive training and navigation hub for operators. The frontend is complete and ready. We need Replit to:

1. **Integrate the HTML** into the Express backend
2. **Set up routing** for all 50+ links
3. **Implement authentication** (Manus OAuth)
4. **Configure analytics** (link tracking, page views)
5. **Deploy to production** at `https://curalive-mdu4k2ib.manus.space/operator-links`

**Timeline:** 3-5 days for full integration and testing

---

## Frontend Asset

### HTML File Details

**CDN Link (Shareable):**
```
https://files.manuscdn.com/user_upload_by_module/session_file/310519663387446759/vcEhQrsyQLBCiYjm.html
```

**File Specifications:**
- **Format:** HTML5 + CSS3 + Vanilla JavaScript
- **Size:** 31.5 KB
- **Dependencies:** None (self-contained)
- **Responsive:** Mobile-first design
- **Accessibility:** WCAG 2.1 AA compliant
- **Performance:** <2s load time, <100KB total

**Content:**
- 50+ navigation links
- 7 main sections
- 16 AI features documented
- 6 AI bundles
- 4 pre-event checklists
- Color-coded badges
- Responsive grid layout

---

## Backend Integration Requirements

### 1. Express Route Setup

**Add to server:**

```javascript
// server/_core/index.ts or server/routers.ts

// Route for operator links page
app.get('/operator-links', (req, res) => {
  // Check authentication
  if (!req.user) {
    return res.redirect('/login');
  }
  
  // Serve the HTML file
  res.sendFile(path.join(__dirname, '../client/public/operator-links.html'));
});

// Alternative: Serve from CDN with auth check
app.get('/operator-links', (req, res) => {
  if (!req.user) {
    return res.redirect(`/login?returnTo=${encodeURIComponent('/operator-links')}`);
  }
  
  // Redirect to CDN or serve locally
  res.redirect('https://files.manuscdn.com/user_upload_by_module/session_file/310519663387446759/vcEhQrsyQLBCiYjm.html');
});
```

### 2. File Placement

**Option A: Serve from CDN (Recommended)**
- No file storage needed
- Always up-to-date
- Fast global delivery
- Use: `https://files.manuscdn.com/user_upload_by_module/session_file/310519663387446759/vcEhQrsyQLBCiYjm.html`

**Option B: Store Locally**
- Download HTML file
- Place in: `client/public/operator-links.html`
- Serve via Express static middleware
- Update manually when changes needed

**Option C: Dynamic Rendering**
- Store in database
- Render with template engine
- Allow admin updates without redeployment

### 3. Authentication Integration

**Manus OAuth Check:**

```javascript
// Middleware to protect operator links
const protectOperatorLinks = (req, res, next) => {
  if (!req.user) {
    return res.redirect(getLoginUrl('/operator-links'));
  }
  
  // Optional: Check if user is an operator
  if (req.user.role !== 'operator' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Apply middleware
app.get('/operator-links', protectOperatorLinks, (req, res) => {
  // Serve operator links
});
```

### 4. Link Routing Configuration

**All 50+ Links Need Backend Routes:**

```javascript
// Training Links
app.get('/operator-hub', protectOperatorLinks, (req, res) => {
  // Route to operator hub
});

app.get('/training', protectOperatorLinks, (req, res) => {
  // Route to training guide
});

app.get('/training-mode', protectOperatorLinks, (req, res) => {
  // Route to training mode console
});

// ... (repeat for all 50+ links)

// Console Links
app.get('/occ', protectOperatorLinks, (req, res) => {
  // Route to OCC console
});

app.get('/virtual-studio', protectOperatorLinks, (req, res) => {
  // Route to virtual studio
});

// ... (continue for all links)
```

**Complete Link Map:**

| Link | Route | Destination |
|------|-------|-------------|
| Operator Hub | `/operator-hub` | Training hub page |
| Training Guide | `/training` | OCC training module |
| Training Mode | `/training-mode` | Sandbox console |
| Virtual Studio Training | `/training/virtual-studio` | Studio training |
| AI Features Training | `/training/ai-features` | AI features training |
| OCC Console | `/occ` | Main operator console |
| Operator Analytics | `/operator/analytics` | Performance dashboard |
| Virtual Studio | `/virtual-studio` | Studio configuration |
| Live Sentiment | `/live-sentiment` | Sentiment dashboard |
| Intelligent Broadcaster | `/intelligent-broadcaster` | AI alert panel |
| Schedule Event | `/events/schedule` | Event scheduler |
| Event Calendar | `/events/calendar` | Calendar view |
| Webcasting Hub | `/live-video/webcasting` | Webcast manager |
| Create Webcast | `/live-video/webcast/create` | Webcast wizard |
| Studio Config | `/studio-config` | Pre-event setup |
| ESG Setup | `/esg-setup` | ESG configuration |
| Feature Map | `/feature-map` | Interconnection graph |
| Analytics Dashboard | `/admin/interconnection-analytics` | Analytics dashboard |
| Workflows | `/workflows` | Recommended workflows |
| AI Shop | `/ai-shop` | Feature browser |
| Post-Event Report | `/post-event` | Event reports |
| Webcast Recap | `/webcast-recap` | Recap generator |
| [... 16 Feature Routes ...] | `/features/*` | Feature pages |
| [... 6 Bundle Routes ...] | `/bundles/*` | Bundle pages |
| Support | `/support` | Support page |
| Docs | `/docs` | Documentation |
| Certification | `/certification` | Cert program |
| Dashboard | `/my-dashboard` | Personal dashboard |
| Feedback | `/feedback` | Feedback form |
| What's New | `/whats-new` | Updates page |

### 5. Analytics Integration

**Track Link Clicks:**

```javascript
// Add analytics tracking to each link
const trackLinkClick = async (req, res, next) => {
  const linkPath = req.path;
  const userId = req.user?.id;
  
  // Log to database
  await db.insert(operatorLinkAnalytics).values({
    operator_id: userId,
    link_path: linkPath,
    accessed_at: new Date(),
    user_agent: req.headers['user-agent'],
    ip_address: req.ip
  });
  
  next();
};

// Apply to all operator routes
app.use('/operator-*', trackLinkClick);
app.use('/training*', trackLinkClick);
app.use('/occ*', trackLinkClick);
```

**Database Schema:**

```sql
CREATE TABLE operator_link_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operator_id INT NOT NULL,
  link_path VARCHAR(255) NOT NULL,
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_spent_seconds INT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  INDEX (operator_id, accessed_at)
);

CREATE TABLE operator_links_metadata (
  id INT PRIMARY KEY AUTO_INCREMENT,
  link_path VARCHAR(255) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  badge_type VARCHAR(50),
  sort_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6. tRPC Procedures (Optional)

**For Real-Time Analytics:**

```typescript
// server/routers.ts

export const appRouter = router({
  operator: router({
    links: router({
      // Get link analytics
      getAnalytics: protectedProcedure
        .query(async ({ ctx }) => {
          return await db.query.operatorLinkAnalytics.findMany({
            where: eq(operatorLinkAnalytics.operator_id, ctx.user.id),
            orderBy: desc(operatorLinkAnalytics.accessed_at),
            limit: 100
          });
        }),
      
      // Get popular links
      getPopularLinks: protectedProcedure
        .query(async () => {
          return await db.query.operatorLinkAnalytics.findMany({
            orderBy: desc(sql`COUNT(*)`),
            groupBy: [operatorLinkAnalytics.link_path],
            limit: 10
          });
        }),
      
      // Track link click
      trackClick: protectedProcedure
        .input(z.object({ linkPath: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return await db.insert(operatorLinkAnalytics).values({
            operator_id: ctx.user.id,
            link_path: input.linkPath,
            accessed_at: new Date()
          });
        })
    })
  })
});
```

---

## Deployment Steps

### Phase 1: Setup (Day 1)

- [ ] Download HTML file from CDN link
- [ ] Create `/operator-links` route in Express
- [ ] Set up authentication middleware
- [ ] Test local access at `http://localhost:3000/operator-links`

### Phase 2: Link Integration (Day 2)

- [ ] Create all 50+ route handlers
- [ ] Verify each link destination exists
- [ ] Test link navigation
- [ ] Add error handling for missing routes

### Phase 3: Analytics (Day 2-3)

- [ ] Create database tables for analytics
- [ ] Implement link click tracking
- [ ] Add tRPC procedures for analytics
- [ ] Test analytics collection

### Phase 4: Testing (Day 3-4)

- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance testing (Lighthouse)
- [ ] Link validation (all 50+ links)
- [ ] Analytics verification

### Phase 5: Deployment (Day 4-5)

- [ ] Deploy to staging environment
- [ ] Final QA testing
- [ ] Deploy to production
- [ ] Monitor performance
- [ ] Support operator onboarding

---

## Production URLs

### Primary Domain
```
https://curalive-mdu4k2ib.manus.space/operator-links
```

### Subdomain Routes
```
https://curalive-mdu4k2ib.manus.space/training
https://curalive-mdu4k2ib.manus.space/occ
https://curalive-mdu4k2ib.manus.space/virtual-studio
https://curalive-mdu4k2ib.manus.space/feature-map
https://curalive-mdu4k2ib.manus.space/admin/interconnection-analytics
```

---

## Frontend Asset Details

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CuraLive — Operator Platform Links</title>
  <style>
    /* All CSS inline - no external stylesheets */
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <!-- 7 Main Sections -->
    <!-- 50+ Navigation Links -->
    <!-- 4 Checklists -->
    <!-- Footer -->
  </div>
  <script>
    // Vanilla JavaScript - no external libraries
  </script>
</body>
</html>
```

### Sections

1. **Training** (6 links)
2. **Operator Console** (5 links)
3. **Event Setup** (6 links)
4. **Interconnection Analytics** (4 links) — NEW
5. **AI Features** (16 links)
6. **AI Bundles** (6 links)
7. **Quick Reference** (6 links)

### Checklists

1. Pre-Launch Training
2. Pre-Event Setup
3. During Event
4. Post-Event

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | <2s | <1s |
| First Contentful Paint | <1s | <0.5s |
| Lighthouse Score | >90 | >95 |
| Mobile Score | >85 | >90 |
| Accessibility | >95 | >98 |

---

## Support & Escalation

### For Questions
- **Technical:** Contact Replit team
- **Content:** Contact CuraLive product team
- **Training:** Contact training coordinator
- **Analytics:** Contact analytics team

### Documentation
- [Tech Stack](./OPERATOR_LINKS_TECH_STACK.md)
- [Frontend HTML](./operator-links-updated.html)
- [API Documentation](./docs/api.md)

---

## Success Criteria

✅ **Deployment is successful when:**
- [ ] Page loads at `https://curalive-mdu4k2ib.manus.space/operator-links`
- [ ] All 50+ links are functional
- [ ] Authentication works (Manus OAuth)
- [ ] Analytics tracking is active
- [ ] Performance targets met (<2s load)
- [ ] Mobile responsive design works
- [ ] Team can access and bookmark
- [ ] No broken links or 404 errors

---

## Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Setup | 1 day | Routes configured, auth working |
| Link Integration | 1 day | All 50+ links functional |
| Analytics | 1-2 days | Analytics tracking active |
| Testing | 1 day | All tests passing |
| Deployment | 1 day | Live in production |
| **Total** | **3-5 days** | **Ready for operator training** |

---

## Next Steps

1. **Replit Reviews** this brief
2. **Replit Implements** backend integration
3. **Replit Tests** all functionality
4. **Replit Deploys** to production
5. **Team Begins** operator training

---

**Frontend Asset:** https://files.manuscdn.com/user_upload_by_module/session_file/310519663387446759/vcEhQrsyQLBCiYjm.html

**Production URL:** https://curalive-mdu4k2ib.manus.space/operator-links

**Status:** Ready for Backend Integration ✅

---

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Status:** Ready for Replit Implementation
