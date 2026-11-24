# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

NexoFood serves two primary contexts—a multi-tenant restaurant SaaS backoffice/platform console and direct-slug customer storefronts—across the following confirmed user roles:

- **Platform Superadmin (`SUPERADMIN`):** Global platform administrator managing SaaS subscription plans (`/api/v1/admin/plans`), global user accounts (`/api/v1/admin/users`), and cross-tenant oversight (bypassing tenant membership checks).
- **Restaurant Owner (`OWNER`):** Single-tenant owner (strict 1:1 relationship per active `TRIAL` or `ACTIVE` subscription) responsible for onboarding the restaurant, managing subscription billing, configuring restaurant details/delivery coverage, connecting Mercado Pago OAuth, managing all staff roles (`ADMIN`, `COCINERO`, `REPARTIDOR`), catalog, customers, orders, and payment audits.
- **Restaurant Administrator (`ADMIN`):** Delegated restaurant manager overseeing taxes, categories, products and stock, pricing/promotion rules, customer CRM (loyalty points, notes, blocks), order dispatching/driver assignment, payment logs, and operational staff (`COCINERO` and `REPARTIDOR` only; cannot manage `OWNER` or other `ADMIN` accounts).
- **Kitchen Staff (`COCINERO`):** Backoffice kitchen operator using the FIFO Kitchen Display System (KDS) queue (`/orders/kds`) to monitor paid orders and transition order statuses to `EN_PREPARACION` and `LISTO_PARA_ENTREGA`.
- **Delivery Driver (`REPARTIDOR`):** Delivery operator viewing assigned deliveries (`/orders/deliveries`), transitioning assigned `DELIVERY` orders to `EN_CAMINO` and `ENTREGADO`, and sending live GPS telemetry pings (`PUT .../tracking/location`).
- **Storefront Diners (Comensales / Customers):** Global `USER` accounts interacting with a specific restaurant's direct-slug storefront (`/store/[slug]`) with per-tenant `TenantCustomer` profiles (loyalty points, block status), saved WGS84 delivery addresses, per-tenant shopping carts, Mercado Pago Checkout Pro payments, order cancellation while `PENDIENTE`, and live delivery tracking.

## Product Purpose

NexoFood is a multi-tenant SaaS platform and online ordering system for restaurants operating in Peru (`es-PE`, Peruvian Sol `S/` / `PEN`). It enables each restaurant (`Tenant`) to operate an independent storefront accessible directly by unique `slug` while running end-to-end operations from a unified web backoffice:

- **SaaS Restaurant Backoffice:** Subscription lifecycle management (`TRIAL`, Mercado Pago preapproval recurring `ACTIVE` plans, sync, and cancellation), restaurant onboarding with WGS84 coordinates and delivery radius, staff RBAC, tax configuration (inclusive/exclusive e.g. IGV 18%), product catalog with direct integer stock and scheduled/promotional price rules, customer CRM, real-time order workflow (`OrderStateMachine`), KDS queue, driver dispatch, Mercado Pago OAuth connection and payment auditing, and live fleet tracking.
- **Direct-Slug Storefront:** Public menu browsing by restaurant slug (`/store/[slug]`) with real-time pricing and tax calculation, storefront-contextual authentication, delivery coverage validation (`ST_DistanceSphere` / Haversine) with dynamic ETA and delivery fee estimation, persistent backend cart synchronization, Mercado Pago Checkout Pro ordering, and privacy-scoped live order tracking.

Success means restaurants launch and manage digital ordering without third-party marketplace intermediaries, receive 100% of storefront payments directly into their own Mercado Pago account via OAuth 2.0, enforce anti-fraud payment and stock invariants on every order, and give diners accurate delivery coverage, pricing, and real-time order visibility.

## Positioning

- **Direct-to-Restaurant Payments via Mercado Pago OAuth 2.0:** Each restaurant links its own Mercado Pago seller account (encrypted with AES-256-GCM on the backend) so storefront Checkout Pro payments settle directly to the restaurant, while platform SaaS subscriptions use separate Mercado Pago preapproval billing.
- **Direct-Slug Storefront Architecture (No Marketplace Aggregator):** NexoFood deliberately exposes storefronts via direct restaurant URLs (`/store/[slug]`) rather than a public multi-restaurant discovery marketplace (`GET /tenants` public listing is not exposed).
- **Geospatial PostGIS Coverage & Live GPS Telemetry:** Delivery eligibility, road-factored ETA (`1.35` road factor, `25.0 km/h` average speed), and delivery fees are computed server-side using WGS84 (`SRID 4326`) coordinates and rendered client-side via Leaflet + OpenStreetMap without proprietary map lock-in.
- **Transactional Integrity & Kitchen Fraud Guard:** Order creation occurs atomically upon `APPROVED` payment with pessimistic stock locking (`SELECT ... FOR UPDATE`), immutable tax snapshots, and an enforced `OrderStateMachine` blocking kitchen preparation (`PENDIENTE -> EN_PREPARACION`) unless payment is confirmed `APPROVED`.

## Operating Context

- **Environments:** Kitchen tablets/monitors running the FIFO KDS queue, restaurant office/POS monitors managing orders, catalog, staff, and dispatch maps, mobile/web devices used by delivery drivers to send GPS pings every 10–15 seconds, and desktop/mobile web browsers used by diners ordering from `/store/[slug]`.
- **Locale & Currency:** Spanish (Peru, `es-PE`), Peruvian Sol currency (`PEN`, formatted `S/ 0.00`), 24-hour/local ISO 8601 timestamps converted in client UI, and Peruvian tax conventions (inclusive IGV 18%, exclusive taxes, or exempt 0%, plus optional `ruc` on checkout).
- **Security Context:** Backend JWT (`accessToken` 15 min, rotating `refreshToken` 7 days) held exclusively server-side in `httpOnly` Next.js cookies via a BFF proxy (`/api/bff/[...path]`) and single-flight refresh mutex—never stored in `localStorage` or readable client cookies.

## Capabilities and Constraints

- **Confirmed Backend Contract:** 8 bounded contexts (`Identity`, `Subscription`, `Tenant / Store`, `Catalog`, `Cart`, `Order`, `Payment`, `Tracking`) exposing 100 frontend-consumable REST endpoints under `/api/v1` (plus 2 server-to-server `/api/v1/webhooks/mercadopago` endpoints excluded from frontend consumption).
- **Strict JSON Serialization:** Backend enforces `fail-on-unknown-properties: true`; frontend payloads must strictly omit unknown or UI-only fields (such as `confirmPassword` or empty optional strings where omitted).
- **Rate Limiting:** Auth endpoints (`POST /auth/login|register|refresh` and `POST /store/{slug}/auth/login|register`) enforce 10 requests per 60 seconds per IP/group, returning `429 Too Many Requests` with `Retry-After` and `X-Rate-Limit-Remaining`.
- **Pagination Contract Exception:** Paginated endpoints return `PageResponse<T>` (`page` 0-indexed), except `GET /api/v1/admin/tenants/{tenantId}/customers` which returns Spring Data `Page<TenantCustomerResponse>` (`number` instead of `page`).
- **Removed Non-API Scopes:** Standalone inventory management (`/inventory`), public multi-restaurant marketplace directory/search, hardcoded mock restaurants/brand assets, and client-only cart/order stores are excluded because they do not exist in the backend v1 contract.
- **Catalog Plan Enforcement:** Product creation is gated by the active subscription's `maxProducts` limit (`null` = unlimited).
- **Cart & Order Rules:** Carts are unique per `(tenant, customer)`; checkout requires an active restaurant, non-blocked customer, within-radius coordinates for `DELIVERY`, and active online payment linkage. Diners can cancel orders only in `PENDIENTE` (triggering Mercado Pago refund + stock restoration); backoffice cancellation is allowed in `PENDIENTE` or `EN_PREPARACION`.
- **Map & Coordinate Rules:** WGS84 (`latitude` -90..90, `longitude` -180..180) rendered via Leaflet (`leaflet` + `@types/leaflet`) with client-side dynamic imports; driver GPS tracking enforces 5-second soft throttling and anomalous jump filtering (`> 150 km/h` over `> 250 m`), marking signals `stale: true` after 60s without updates and hiding driver coordinates from diners outside `EN_CAMINO`.

## Brand Commitments

- **Brand Name:** NexoFood (`nexofood`).
- **Brand Personality:** "Tech-Forward Gourmet" — balancing operational SaaS precision for high-pressure restaurant environments with appetizing culinary clarity (`docs/design/DESIGN.md`).
- **Design System Authority:** Governed by the existing design system document at `docs/design/DESIGN.md` ("Nexofood Core").
- **Language:** User-facing copy, validation feedback, and status labels in `es-PE`.

## Evidence on Hand

- **Authoritative Backend API Specification:** `docs/document/API_DOCUMENTATION.md` (102 documented endpoints across 8 bounded contexts, exact DTOs, enums, envelopes, and state machine rules).
- **Design System Specification:** `docs/design/DESIGN.md` (Nexofood Core tokens, typography scale, spacing grid, elevation, and component guidelines).
- **Architecture & Implementation Plan:** `docs/api_implementation_plan.md`.
- **Explicit Absences (Do Not Fabricate):** No customer testimonials, case studies, press quotes, static restaurant brand logos, hardcoded SaaS pricing tiers, or production deployment/SLA metrics exist in the repository; all subscription plans, restaurant profiles, menus, and customer data are loaded dynamically from the backend API.

## Product Principles

1. **API-True Product Surface:** Every route, form, and state transition maps strictly to verified backend capabilities—never inventing mock workflows, unbacked inventory modules, or phantom marketplace listings.
2. **Operational Speed Under Pressure:** Kitchen (KDS), order dispatch, and live delivery workflows minimize friction, surface payment/state-machine constraints upfront, and enforce role-appropriate actions.
3. **Tenant & Financial Isolation:** Storefront branding, carts, customer loyalty/blocks, taxes, and Mercado Pago payouts remain strictly isolated per restaurant tenant while preserving global user identity.
4. **Defense-in-Depth Session Security:** JWT credentials stay in `httpOnly` cookies behind Next.js BFF and Server Actions with single-flight refresh rotation, never exposed to client JavaScript.
5. **Geospatial & Payment Transparency:** Diners always see verified delivery coverage, itemized tax/delivery breakdowns in `S/`, and live ETA/tracking boundaries before and after checkout.

## Accessibility & Inclusion

- **Standard:** WCAG 2.1 Level AA compliance across all backoffice and storefront interfaces (contrast ratios >= 4.5:1 for text and >= 3:1 for UI/scrollbar non-text indicators).
- **Keyboard & Assistive Semantics:** Native `<dialog>` top-layer modals (`showModal()`, `Esc` dismissal, automatic focus restoration), keyboard-scrollable semantic `<table>` regions (`tabIndex={0}`, `role="region"`, `caption`, sticky headers, container-query mobile stacking), accessible form labels and validation error associations, and `>= 16px` (`max(1rem, 1em)`) input typography to prevent unintended mobile zoom.
- **Motion & Contrast Preferences:** Honor `prefers-reduced-motion: reduce` and OS/browser text-scaling preferences.
