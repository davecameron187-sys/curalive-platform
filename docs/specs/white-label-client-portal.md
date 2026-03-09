# White-Label Client Portal

## REPLIT SUMMARY

**Feature**: White-Label Client Portal  
**Route**: `/portal/:clientSlug` (public-facing), `/admin/clients` (admin management)  
**Priority**: Medium  
**Status**: implemented  
**Dependencies**: Enterprise Billing (implemented), Ably Real-Time Channels (implemented), Mux Live Streaming (implemented)  

**What to build**: A multi-tenant white-label system that allows CuraLive's enterprise clients to offer branded event portals to their own audiences. Each client gets a customizable portal with their logo, colors, domain, and event listings. The admin panel allows CuraLive operators to manage client configurations, assign events to clients, and monitor usage. This is a revenue-critical feature for the enterprise billing tier.

**Key files to create or modify**:
- `client/src/pages/ClientPortal.tsx` — Public-facing branded portal page
- `client/src/pages/admin/ClientManagement.tsx` — Admin panel for managing client configurations
- `server/routers/clientPortal.ts` — tRPC router for portal data and configuration
- `server/services/WhiteLabelService.ts` — Service for theme resolution and client lookup
- `drizzle/schema.ts` — Add `white_label_clients` and `client_event_assignments` tables
- `client/src/App.tsx` — Register portal and admin routes

**Database tables**:

`white_label_clients`: `id`, `client_name` (varchar), `slug` (varchar, unique), `logo_url` (text), `primary_color` (varchar), `secondary_color` (varchar), `accent_color` (varchar), `custom_domain` (varchar, nullable), `contact_email` (varchar), `contact_name` (varchar), `billing_tier` (enum: starter, professional, enterprise), `max_concurrent_events` (int), `max_monthly_events` (int), `features_enabled` (JSON), `is_active` (boolean), `created_at`, `updated_at`

`client_event_assignments`: `id`, `client_id` (FK white_label_clients), `event_id` (FK conferences), `display_order` (int), `is_featured` (boolean), `custom_title` (varchar, nullable), `custom_description` (text, nullable), `created_at`

**tRPC procedures**:
- `clientPortal.getPortal` (query, public) — Returns portal config and event list by slug
- `clientPortal.getEventForPortal` (query, public) — Returns event details within portal context
- `clientPortal.createClient` (mutation, admin) — Creates a new white-label client
- `clientPortal.updateClient` (mutation, admin) — Updates client configuration
- `clientPortal.assignEvent` (mutation, admin) — Assigns an event to a client portal
- `clientPortal.listClients` (query, admin) — Lists all white-label clients with usage stats
- `clientPortal.getClientUsage` (query, admin) — Returns detailed usage metrics for a client

---

## Detailed Specification

### 1. Overview

CuraLive's enterprise clients — investment banks, IR consultancies, stock exchanges, and corporate communications firms — need to present events under their own brand. The White-Label Client Portal enables this by providing each client with a customizable, branded event portal that their audiences access directly. The portal inherits all CuraLive intelligence features (live transcription, Q&A, sentiment analysis) while presenting them under the client's visual identity.

This feature directly supports the enterprise billing tier and is essential for CuraLive's B2B go-to-market strategy in the South African financial services market, where white-labeling is a standard requirement for IR platform vendors.

### 2. Portal Architecture

The portal system follows a multi-tenant architecture where each client is identified by a unique slug. When a user navigates to `/portal/:clientSlug`, the system resolves the client configuration and applies the branded theme before rendering the event listings and event rooms.

| Component | Behavior |
|---|---|
| **URL Structure** | `/portal/:clientSlug` for portal home, `/portal/:clientSlug/event/:eventId` for event room |
| **Theme Resolution** | Client colors, logo, and fonts loaded from `white_label_clients` table |
| **Event Filtering** | Only events assigned to the client via `client_event_assignments` are displayed |
| **Feature Gating** | Client's `features_enabled` JSON controls which intelligence features are visible |
| **Custom Domain** | Optional CNAME mapping — client's domain resolves to CuraLive portal |

### 3. Client Configuration

Each white-label client has a configuration profile that controls the visual appearance and feature availability of their portal.

**3.1 Visual Branding** — The client configuration includes a logo URL (uploaded to S3 via `storagePut`), a primary color (used for headers, buttons, and accents), a secondary color (used for backgrounds and cards), and an accent color (used for highlights and interactive elements). These colors are injected as CSS custom properties at the portal root, overriding the default CuraLive theme. The portal header displays the client logo instead of the CuraLive logo, and the footer shows "Powered by CuraLive" in small text (configurable per billing tier — enterprise clients can remove this).

**3.2 Feature Gating** — The `features_enabled` JSON field controls which CuraLive features are available in the client's portal. The default feature set for each billing tier is defined as follows.

| Feature | Starter | Professional | Enterprise |
|---|---|---|---|
| Live Transcription | Yes | Yes | Yes |
| Q&A | Yes | Yes | Yes |
| Sentiment Analysis | No | Yes | Yes |
| Compliance Flags | No | No | Yes |
| Post-Event Report | No | Yes | Yes |
| Custom Domain | No | No | Yes |
| Remove "Powered by" | No | No | Yes |
| API Access | No | Yes | Yes |
| Max Concurrent Events | 1 | 5 | Unlimited |
| Max Monthly Events | 5 | 25 | Unlimited |

**3.3 Custom Domain** — Enterprise clients can map a custom domain (e.g., `events.clientcompany.com`) to their CuraLive portal. The system resolves the domain to the correct client configuration using the `custom_domain` field. Domain verification is handled outside the application (DNS CNAME record pointing to CuraLive's domain).

### 4. Portal Frontend

The public-facing portal page renders a branded event listing for the client's audience.

**4.1 Portal Home** — The portal home page displays the client logo, a hero section with the client's branding, and a grid of upcoming and past events. Each event card shows the event title (or custom title if set), date and time, status (upcoming, live, completed), and a "Join" or "Watch Replay" button. Events are sorted by `display_order` with featured events pinned to the top.

**4.2 Portal Event Room** — When an attendee clicks into an event from the portal, they enter the standard CuraLive event room but with the client's branding applied. The header shows the client logo, the color scheme matches the client configuration, and only features enabled for the client are visible. The event room URL is `/portal/:clientSlug/event/:eventId`.

**4.3 Registration Flow** — If the event requires registration, the portal displays a registration form branded with the client's colors. Registration data is stored in the existing `event_registrations` table with the `client_id` field populated for attribution.

### 5. Admin Management Panel

The admin panel at `/admin/clients` allows CuraLive operators to manage white-label client configurations.

**5.1 Client List** — A table showing all white-label clients with columns for client name, slug, billing tier, active events, monthly usage, and status (active/inactive). The table supports search, filtering by tier, and sorting by any column.

**5.2 Client Detail** — Clicking a client opens a detail view with tabs for Configuration (branding settings, feature toggles), Events (assigned events with drag-and-drop reordering), Usage (monthly event count, attendee count, bandwidth usage), and Billing (link to enterprise billing records).

**5.3 Client Creation** — A form for creating new white-label clients with fields for client name, slug (auto-generated from name, editable), logo upload, color picker for primary/secondary/accent colors, billing tier selection, contact information, and feature toggles. The form validates that the slug is unique and the logo meets size requirements (max 2MB, PNG/SVG).

**5.4 Event Assignment** — A drag-and-drop interface for assigning events to a client portal. The left panel shows all available events, and the right panel shows events assigned to the selected client. Operators can set display order, mark events as featured, and override event titles and descriptions for the portal context.

### 6. Theme Engine

The theme engine resolves client branding and applies it to the portal pages. The implementation should use CSS custom properties injected at the portal layout root.

When the portal route is loaded, the `clientPortal.getPortal` query returns the client configuration including colors and logo. The portal layout component sets CSS variables (`--portal-primary`, `--portal-secondary`, `--portal-accent`) on the root element. All portal components reference these variables instead of the default CuraLive theme variables. This approach ensures that the theme is applied without modifying global styles or affecting other parts of the application.

### 7. Access Control

Portal pages are public by default — attendees do not need a CuraLive account to view the portal or join events. However, certain features (Q&A submission, poll voting) may require registration depending on the event configuration. The admin management panel requires admin role access. Client-specific usage data is only visible to admin users and the client's designated contact (if they have a CuraLive account).

### 8. Performance Considerations

Portal pages should load within 2 seconds on a standard connection. The client configuration should be cached on the server (in-memory or Redis) with a 5-minute TTL to avoid database queries on every page load. The logo image should be served from S3 CDN with appropriate cache headers. Event listings should be paginated (20 events per page) for clients with large event catalogs.
