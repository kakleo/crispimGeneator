# Tour Proposal Generator: Product Requirements Document

Version 0.1 (draft), October 29, 2026. Reference use case: Nusa Flores Travel proposals such as the Flores Overland Tour 4 Days.

## 1. Summary

The Tour Proposal Generator is a small web application that turns rows in a Google Sheet into polished, branded tour proposals. Staff edit tour data in the sheet, open a live HTML preview of the proposal in the browser, and save the preview as an A4 PDF to send to customers. The layout replicates the existing draft proposal (cover, general information, day-by-day itinerary, price options, includes and excludes) and ends with a fixed set of terms of service that is the same for every proposal.

The framework is Astro or Next.js. Section 9 compares them and recommends one.

## 2. Background and problem

Proposals are currently designed by hand as PDFs (for example draft\_v3\_crispim.pdf). Every new tour or price change means re-editing a design file, and copy errors slip through (typos, a duplicated hotel row, mis-numbered lists). The same structure repeats across every tour, so the content should live in structured data and the layout should be produced by a template.

Problems to solve:

- Creating a proposal takes too long because layout and content are mixed together.
- Content errors are hard to spot and are repeated from one proposal to the next.
- Changing a price or hotel requires re-exporting and re-checking the whole document.
- There is no single source of truth for tour content.

## 3. Goals and non-goals

### Goals

1. A non-technical staff member can create or update a proposal by editing a Google Sheet only.
2. Every proposal has a shareable HTML preview that matches the final PDF.
3. One click produces a print-quality A4 PDF with consistent branding, fonts and page breaks.
4. Static terms of service are stored once and appended to every proposal.
5. The system reports clear errors when sheet data is missing or malformed instead of rendering a broken proposal.

### Non-goals for v1

- Editing proposal content inside the app (the sheet remains the editor).
- Customer accounts, online payment, e-signature or booking.
- Sending email or WhatsApp messages from the app.
- Multiple languages or multiple brand themes.
- Analytics on who opened a proposal.

## 4. Users and scenarios

### Personas

- **Sales or operations staff (primary):** builds proposals, adjusts prices and hotels, exports PDFs for customers. Comfortable with Google Sheets, not with code.
- **Content owner:** maintains tour descriptions, includes and excludes, and the terms of service.
- **Customer (indirect):** receives the PDF and reads it on a phone or desktop.
- **Developer or admin:** deploys the app, manages credentials and fixes template issues.

### Core user stories

1. As staff, I add a row to the sheet, open its preview link and see a full proposal without touching any design file.
2. As staff, I change a price in the sheet, refresh the preview and see the new price within a minute.
3. As staff, I click Download PDF and get a file named after the proposal that I can send immediately.
4. As staff, I see exactly which sheet cell is wrong when a proposal cannot be rendered.
5. As the content owner, I update the terms of service in one place and every future PDF uses the new text.
6. As a customer, I receive a clean PDF where no section is cut off between pages.

## 5. Scope at a glance

**In v1:** Google Sheets as the data source, list page, HTML preview, PDF export, static terms, simple login (middleware), validation and error reporting, caching.

**Later (v2 and beyond):** in-app editing, saved snapshots and version history, share links with expiry, email or WhatsApp sending, multiple templates, multiple languages, view tracking.

## 6. Functional requirements

### 6.1 Data source (Google Sheets)

- FR-1: The app reads proposal data from one Google Spreadsheet using the Google Sheets API with a read-only service account. The sheet is shared with the service account email; it does not need to be public.
- FR-2: Data is organised into tabs as described in section 7. Each proposal is identified by a unique proposal\_id (a URL-safe slug).
- FR-3: Only proposals with status ready are listed and exportable by default. Proposals with status draft are previewable by authenticated staff and show a DRAFT marker. Proposals with status archived are hidden.
- FR-4: Sheet responses are cached in memory for a short, configurable time (default 60 seconds). Staff can force a refresh from the preview page.
- FR-5: If the Sheets API is unavailable, the app serves the last good cached copy and shows a visible notice that the data may be stale.

### 6.2 Proposal rendering

- FR-6: A proposal is rendered from one template that contains these sections in order: cover, general information, tour itinerary, price information, include and exclude, terms of service.
- FR-7: The cover shows the product title, a hero image, the logo, and the contact footer (website, WhatsApp number, Instagram handle).
- FR-8: General information shows an intro paragraph and a key-value table (name of tour, type of tour, date of travel, route). Rows are driven by data, so extra rows can be added without code changes.
- FR-9: The itinerary shows one block per day with a title, bullet list, accommodation line and an optional photo. The number of days is not fixed.
- FR-10: Price information shows one or more options. Each option has one or more price rows (for example with and without tour guide) and each row lists its accommodation per night.
- FR-11: Include and exclude are shown as two numbered lists. Numbering is generated automatically, never typed by hand.
- FR-12: Terms of service are static content stored in the repository, rendered after the include and exclude page.
- FR-13: An optional custom\_html field on a proposal inserts an extra block (for example a special note) in a defined position. This HTML is sanitised before rendering.
- FR-14: Missing optional images show a neutral placeholder in preview and are omitted from the PDF when the proposal is marked ready.

### 6.3 Preview

- FR-15: Each proposal has a preview at /p/{proposal\_id} that shows the same A4 pages that the PDF will contain.
- FR-16: The preview page has a toolbar (outside the printed area) with Download PDF, Refresh data, and the proposal status and last-updated time.
- FR-17: The preview is usable on mobile by scaling pages to the screen width. Mobile scaling must not change the PDF output.

### 6.4 PDF export

- FR-18: Download PDF produces an A4 PDF from the same HTML and CSS as the preview, using a headless Chromium renderer, not a separate layout.
- FR-19: The PDF includes backgrounds, colours, web fonts and images, and does not include the preview toolbar.
- FR-20: Page breaks are controlled: a day block, a price table row group and an include or exclude item are never split across pages.
- FR-21: The PDF filename is {proposal\_id}-{YYYY-MM-DD}.pdf.
- FR-22: The contact footer appears on every page of the PDF.
- FR-23: The user can still use the browser Print dialog on the preview and get an equivalent result.

### 6.5 Static terms of service

- FR-24: Terms are authored as a Markdown file in the repository and rendered by the template. Changing the terms requires a code deploy, which is intentional because they are legal text.
- FR-25: An optional terms\_variant column can select between a small number of named terms files later. In v1 only one variant exists.

### 6.4 Proposal list

- FR-26: The home page lists ready proposals with title, route, last updated, and links to preview and PDF. Search by title is supported.

### 6.7 Access control

- FR-27: A login middleware runs before every request and allows access only with a valid session. It denies by default: only /login, /api/login, /health and static assets (fonts, CSS, icons) are public.
- FR-27a: An unauthenticated page request is redirected to /login with a next parameter holding the original path. Only relative paths on the same site are accepted as next, to prevent open redirects. API and PDF requests without a session receive a 401 response.
- FR-27b: The login page asks for a username and password. A failed attempt shows one generic message (Incorrect username or password) and never says which field was wrong.
- FR-27c: Staff accounts are defined in server configuration as a username plus a hashed password (argon2 or bcrypt). Passwords are never stored in plain text, in the repository or in the Google Sheet. v1 has no registration, roles or in-app password reset; adding or removing a user is a configuration change.
- FR-27d: A successful login sets a signed, HttpOnly, Secure, SameSite=Lax session cookie that expires after a configurable time (default 12 hours). A Logout action clears the cookie.
- FR-27e: Failed logins are rate limited (for example 5 failures per IP address in 15 minutes, then a temporary lock) and logged without recording the password.
- FR-27f: The PDF route checks the session first. The headless browser that renders the page carries the caller's session cookie, or a short-lived internal token, so it passes the same middleware as any other request.
- FR-28: Proposal URLs are not guessable and not publicly indexed (noindex header and robots rules).

### 6.8 Validation and errors

- FR-29: Rows are validated against a schema. Required fields: proposal\_id, status, title, at least one itinerary day, at least one price option, at least one include item.
- FR-30: Validation errors name the tab, row number and column, for example: Itinerary row 12, column day\_no is not a number.
- FR-31: A proposal with blocking errors is not exportable. Non-blocking warnings (such as a missing photo or a hotel repeated on consecutive days with the same name) are shown in the toolbar.

## 7. Data model (Google Sheet structure)

Each proposal is one row in the Proposals tab. Repeating groups (days, price rows, includes and excludes) live in their own tabs and point back to the proposal with proposal\_id. This keeps every cell short and editable, and supports any number of days or options.

### Tab: Proposals (one row per proposal)

- proposal\_id: unique slug, for example flores-overland-4d.
- status: draft, ready or archived.
- version: free text such as v3, shown in the toolbar and filename if set.
- title: product title, for example Flores Overland Tour 4 Days.
- cover\_image\_url: hero image.
- intro\_text: paragraph(s) shown under General Information. Blank line separates paragraphs.
- tour\_type: for example Private Tour (Minimum 2 People).
- travel\_date: free text, for example 2026.
- route: for example Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo.
- extra\_info: optional extra key-value pairs written as Label: Value, one per line.
- custom\_html: optional sanitised HTML block.
- terms\_variant: optional, defaults to standard.

### Tab: Itinerary (one row per day)

- proposal\_id
- day\_no: number, used for sorting.
- day\_title: for example Journey to Moni. The renderer prefixes DAY 01 automatically.
- items: bullet points, one per line in the cell.
- accommodation\_note: for example See Price List.
- image\_url: optional photo for the day.

### Tab: Pricing (one row per price row)

- proposal\_id
- option\_label: for example OPTION #1.
- row\_type: for example Without Tour Guide.
- price\_amount: number without separators.
- currency: default IDR. The renderer formats as IDR 5.000.000.
- stays: accommodation lines, one per line in the cell, each with its day.

### Tab: Inclusions (one row per item)

- proposal\_id
- kind: include or exclude.
- sort: number.
- text.

### Tab: Settings (single row of shared values)

- company\_name, website, whatsapp, instagram, logo\_url, brand colours (primary green, accent blue, exclude red).

### Static content in the repository

- content/terms.md: terms of service.
- Fonts and the footer icons.

### Data rules

- proposal\_id is unique and immutable once a proposal has been sent.
- Multi-line cells (items, stays, intro\_text) use line breaks inside the cell.
- Images are hosted on a public image host or in the repository. Google Drive sharing links are unreliable for hot-linking and should not be used in v1.
- All text is escaped on render; only custom\_html is passed through the sanitiser.

## 8. Proposal layout specification

The design follows the existing draft and the HTML version already built.

- Page size A4 (210 by 297 mm), no browser margins, colours printed exactly.
- Fonts: DM Sans for body and headings, Syne for the Price Information heading and option labels, self-hosted so the PDF does not depend on an external font service.
- Colours: green for the footer bar and include markers, blue for the day banners, red for exclude markers.
- Page 1 is the cover with a rounded hero image, a white notch holding the logo, a large title and the footer bar.
- Following pages flow with content instead of using fixed-height pages. Because tours differ in length, content must continue onto an extra page instead of being clipped. Day blocks, price tables and list items must keep together using break-inside: avoid.
- The green contact footer repeats on every page and sits inside the page margin so it never overlaps content.
- Terms of service start on a new page and may run over several pages.
- Photos appear on the right side of each day block in a polaroid frame, with a placeholder when no image is set.

## 9. Technical approach

### 9.1 Framework decision: Astro or Next.js

Both meet the requirements. The proposal itself is a read-only document, which favours a HTML-first tool, but future plans such as editing in the app or user accounts favour a full-stack React framework.

**Astro (recommended for v1):**

- Ships HTML with little or no client JavaScript, which suits a document-style output.
- On-demand rendering with the Node adapter lets the app read the sheet on request and serve API routes such as the PDF endpoint.
- Tailwind integrates cleanly and the existing HTML converts into .astro components with little change.
- Smaller and simpler to run and maintain.

**Next.js (choose if):**

- The team already works in React, or
- v2 will include an in-app editor, dashboard, authentication provider or database.
- It offers a bigger ecosystem, built-in route handlers and middleware, and more hosting options with tooling for caching.

**Recommendation:** start with Astro using the Node adapter. Move to Next.js only if in-app editing becomes a v2 priority. The data layer, validation schema and PDF service are framework-independent, so a later move is contained.

### 9.2 Architecture

1. Browser requests /p/{proposal\_id}.
2. The login middleware checks the session cookie. Without a valid session the request is redirected to /login (API calls get a 401).
3. The server loads data through a sheet client (Google Sheets API, cached with a short TTL).
4. Rows are parsed and validated with a schema library such as Zod into a single Proposal object.
5. The template renders the Proposal and the terms Markdown into HTML with Tailwind classes and print CSS.
6. For PDF, /p/{proposal\_id}/pdf launches headless Chromium (Playwright or Puppeteer), opens the print version of the same page with the caller's session, waits for fonts and images to load, and returns the PDF with the proper filename.

### 9.3 Routes

- GET / : list of proposals.
- GET /login : login form (public).
- POST /api/login : checks credentials and sets the session cookie (public, rate limited).
- POST /api/logout : clears the session cookie.
- GET /p/{proposal\_id} : HTML preview.
- GET /p/{proposal\_id}/pdf : PDF download.
- POST /api/refresh : clears the cache (staff only).
- GET /health : service and sheet connectivity check (public, returns no proposal data).

### 9.4 PDF engine

- Use Chromium print-to-PDF so the PDF matches the preview exactly, including CSS, web fonts and break rules. Set preferCSSPageSize, printBackground and A4.
- Wait for document.fonts.ready and all images before printing.
- Run Chromium in a real Node runtime. This favours a container deployment (Docker on a VPS, Fly.io, Railway or Render). Serverless platforms can work with a slimmed Chromium build but have size and time limits, so treat that as a risk, not the default.
- Fallback option: a hosted headless browser service called over HTTP.

### 9.5 Caching and limits

- Sheets API quotas are limited per minute, so read all tabs in one batch request and cache the result.
- Cache generated PDFs by proposal\_id and a hash of the data, so repeated downloads are instant and a changed sheet invalidates the cache.
- Limit concurrent PDF jobs to protect server memory.

### 9.6 Configuration

Environment variables: Google service account credentials, spreadsheet ID, tab names, cache TTL, staff usernames with password hashes, session secret, session lifetime, public base URL.

### 9.7 Suggested project layout

- src/middleware.ts: login middleware (session check, public allow-list, redirects). Next.js uses middleware.ts at the project root.
- src/pages: login, list, preview and PDF routes, plus the login, logout and refresh API routes.
- src/components: Cover, GeneralInfo, DayBlock, PriceTable, IncludeExclude, Terms, Footer.
- src/lib/sheets: Google client and cache.
- src/lib/schema: validation and parsing.
- src/lib/auth: password check, session signing and login rate limiting.
- src/lib/pdf: Chromium service.
- content/terms.md and public/fonts.

### 9.8 Login middleware

- Flow: read the session cookie, verify its signature and expiry, then either continue or redirect to /login (pages) or return 401 (API and PDF calls).
- Deny by default: every route is protected unless it is on the allow-list (/login, /api/login, /health, static assets). New routes are therefore protected automatically.
- Passwords are compared against stored hashes with a constant-time check. No plain-text passwords in the repository, the sheet or the logs.
- Sessions are stateless signed tokens (for example with the jose library) in an HttpOnly, Secure, SameSite=Lax cookie, so no database is needed. A single token cannot be revoked before it expires; changing the session secret signs everyone out.
- Astro implements this in src/middleware.ts (on-demand rendering); Next.js uses middleware.ts. The check itself lives in src/lib/auth and is the same for both.
- Out of scope for v1: self-registration, roles, password reset, single sign-on. A likely v2 step is Google sign-in limited to the company domain.

## 10. Non-functional requirements

- Performance (targets): preview responds in under 2 seconds with a warm cache; a 6-page PDF is produced in under 10 seconds; cached PDF downloads in under 1 second.
- Reliability: stale-cache fallback if the Sheets API fails; PDF endpoint returns a clear error instead of a blank file.
- Security: service account is read-only; secrets live only in environment variables; custom\_html is sanitised; everything except the login page is behind the login middleware and not indexed.
- Accessibility: the preview uses semantic headings, tables with header cells and sufficient colour contrast; text in the PDF stays selectable.
- Maintainability: all design tokens (colours, fonts, spacing) live in one place; sample data and a fixture proposal exist for tests.
- Browser support: current Chrome, Safari and Edge for preview; PDF always generated by the server.

## 11. Acceptance criteria

1. Adding a ready row plus its itinerary, pricing and inclusion rows makes a new proposal appear on the list within the cache window.
2. The Flores Overland Tour 4 Days data, entered in the sheet, produces a proposal that matches the existing draft in structure, text, colours and section order.
3. The downloaded PDF is A4, has selectable text, shows the footer on every page and has no section split across pages.
4. A 7-day tour with 3 price options renders without clipped content and flows to extra pages correctly.
5. Removing a required value produces an error that names the tab, row and column and blocks export.
6. A change to the terms file appears in the next PDF after deployment, with no sheet changes.
7. Unauthenticated requests to any page, preview or PDF are redirected to the login page (API calls get a 401); after a valid login the same URL opens, and after logout it does not.
8. The preview and the PDF show the same content for the same data.

## 12. Milestones

1. **Foundation (week 1):** project setup, Tailwind, fonts, sheet client, schema, sample data tab structure.
2. **Template (week 2):** all components built from the existing HTML, flowing page layout, print CSS, terms rendering.
3. **PDF and preview tooling (week 3):** Chromium service, toolbar, filenames, PDF cache.
4. **Hardening (week 4):** validation messages, access control, stale-cache handling, deployment, test with 5 real proposals.

Week counts are estimates for one developer and should be revisited after the Foundation milestone.

## 13. Risks and mitigations

- **Chromium on serverless hosting:** cold starts, bundle size and timeouts. Mitigation: deploy as a container on a normal Node runtime.
- **Page breaks in long proposals:** content may split badly. Mitigation: flowing layout, break-inside rules and a long-tour fixture test.
- **Bad sheet data:** typos and missing cells reach customers. Mitigation: schema validation, warnings, ready status gate.
- **Image links break or are slow:** Mitigation: public image host, size guidance, placeholders and a warning on failed images.
- **Sheet structure changes by accident:** Mitigation: header-row checks, protected header cells, clear error on a missing column.
- **Sheets API limits:** Mitigation: batch reads and caching.
- **Font loading differences in the PDF:** Mitigation: self-hosted fonts and waiting for fonts before printing.

## 14. Open questions

1. What exactly should the html column contain: a full custom block, a rich-text description, or a template choice? This PRD assumes an optional sanitised custom block (custom\_html).
2. Should one sheet row hold a whole proposal (wide columns) or are separate tabs acceptable? This PRD recommends separate tabs for repeating groups.
3. Who needs access to the previews and PDFs, and is one shared login enough for v1, or does each person need their own account?
4. Do proposals need saved snapshots, so that a sent PDF can be regenerated exactly later even after the sheet changes?
5. Where will images be stored (for example Cloudinary, object storage, or the repository)?
6. Is Indonesian or another language needed in addition to English?
7. Do terms of service ever vary by tour or customer type?
8. What hosting budget and provider are preferred?

## Appendix A: sample data for the Flores Overland Tour 4 Days

**Proposals row:** proposal\_id flores-overland-4d; status ready; version v3; title Flores Overland Tour 4 Days; tour\_type Private Tour (Minimum 2 People); travel\_date 2026; route Ende - Kelimutu - Bajawa - Ruteng - Labuan Bajo.

**Itinerary rows:** day 1 Journey to Moni (3 items); day 2 Kelimutu (5 items); day 3 Journey to Ruteng (6 items); day 4 Journey to Labuan Bajo (4 items, accommodation note blank or a dash).

**Pricing rows:** OPTION #1 Without Tour Guide 5000000 IDR with three stays; OPTION #1 Include Tour Guide 6100000 IDR with three stays; OPTION #2 Without Tour Guide 5000000 IDR with three stays; OPTION #2 Include Tour Guide 6100000 IDR with three stays.

**Inclusions rows:** six include items (private car, driver and petrol; tour guide; entrance fee; mineral water; accommodation 3 nights; 3x breakfast at hotel) and four exclude items (flight tickets; lunch and dinner; optional tour; and tour guide only if guide is not part of the option).

## Appendix B: data quality notes from the current draft

The validation rules should catch the kinds of problems found in the existing PDF:

- A hotel row repeated for different days (Option 2 lists Spring Hill Hotel Ruteng for Day 3 twice).
- Tour guide shown as both included and excluded.
- Manually typed numbering that skipped or repeated numbers; numbering is automatic in the new template.
- Repeated spelling mistakes such as Accomodation; a shared label setting removes repeated typing.
