# Notewell — Markdown Notes & Document Manager

**Live demo:** https://prathameshsystenics.github.io/notewell/

A free, simple notes app for everyday life: shopping lists, meal plans, trip checklists and budgets. Organise notes by colour-coded category and status (grid, list or to-do board), attach receipts and photos, and go back to any earlier version.

Notewell is a browser-only implementation of the *Notes & Document Manager* project specification. It is built with plain HTML pages, Tailwind CSS and daisyUI. All data is stored in **IndexedDB**. If IndexedDB cannot be opened (some private-browsing modes), the app uses **localStorage** instead.

## Run

Serve the folder over HTTP (recommended), then open `http://localhost:8080`:

```bash
npx serve -l 8080 .        # or: python -m http.server 8080
```

Opening `index.html` directly from disk also works in Chromium-based browsers. You need an internet connection the first time, so the browser can load Tailwind, daisyUI, marked and DOMPurify from the jsDelivr CDN.

### Development accounts (seeded on first run)

| Email               | Password      | Role  | Notes                                     |
| ------------------- | ------------- | ----- | ----------------------------------------- |
| `demo@notes.local`  | `Demo@12345`  | User  | Has 6 sample notes                        |
| `admin@notes.local` | `Admin@12345` | Admin | Must change the password at first sign-in |

To reset everything, clear the site data in your browser's DevTools (Application → Storage).

## Look and feel

- **Notion-style warm theme** (light and dark). Text and background colours follow Notion's published palette, the buttons use Notion's blue (`#2383E2`) and statuses are Notion-style coloured tags. Text uses Figtree, and code uses JetBrains Mono. Everything is defined in `css/app.css`.
- Mobile friendly: no sideways scrolling at 360 px, a slide-down menu, a swipeable editor toolbar and larger tap targets.
- Top navigation bar, with a slide-down menu on phones.
- The footer shows **"Made by Prathamesh"**, a GitHub source link, and the live-update connection status (the SignalR-style hub).
- The footer's source link is set by `SOURCE_URL` in `js/core.js`.

## SEO

- The home page has a descriptive title, a meta description, its preferred web address, social-share preview tags, and app details for search engines.
- Home, sign-in and register pages: descriptive titles, meta descriptions, preferred (canonical) web addresses, Open Graph and Twitter preview tags with a 1200×630 share image (`og-image.png`).
- Structured data on the home page: website, author, web app details and the visible FAQ.
- App icons for every device (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) and a web app manifest (`site.webmanifest`).
- Private app pages (dashboard, notes, admin, account, password reset) are marked so search engines don't index them. Only the home, sign-in and register pages are listed in `sitemap.xml`.
- A custom `404.html` for missing pages.

## Pages

| Page                    | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `index.html`            | Home page for visitors. Signed-in users are sent straight to their dashboard |
| `login.html`, `register.html`, `access-denied.html`, `404.html` | Public pages                       |
| `forgot-password.html`, `reset-password.html` | Forgot password: a one-time reset link that expires after 1 hour. This demo can't send real email, so the link is shown on screen |
| `dashboard.html`        | Counts by status, recently updated notes, pinned notes                    |
| `notes.html`            | Search, filter, sort and paginate notes. Views: **grid**, **list**, **board** (kanban with drag & drop) |
| `note-edit.html`        | Editor with a formatting toolbar, Write / Preview / Split, colour-coded status and category pickers, list continuation, draft recovery, Ctrl+S |
| `note.html`             | Rendered note, status change, clickable checklists, attachments, Markdown export, delete |
| `note-history.html`     | Every saved version, line diff (vs previous or current), restore          |
| `account.html`          | Profile, change password, theme, export notes as JSON                     |
| `admin-*.html`          | Admin overview, users (paginated, role management, unlock), categories with a colour for each |

## How the spec maps to this build

| Spec concept                  | Here                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| SQL Server + EF Core          | IndexedDB object stores with indexes (`js/db.js`)                          |
| Identity, roles, ownership    | PBKDF2 password hashes, User/Admin roles, security stamps that end other sessions on password or role changes, lockout after 5 failed sign-ins (`Auth` in `js/core.js`). Every note, history and attachment method checks the signed-in owner and returns "not found" for anyone else's data. |
| Service layer / API rules     | `Notes`, `Categories`, `History`, `Attachments`, `Admin` services. Pages never touch storage directly. |
| SignalR status notifications  | `Hub`: the status change is saved first, then a notification is sent only to the owner's open tabs (BroadcastChannel) |
| `IEmailService`               | `Email` with a replaceable provider. Welcome and "note completed" emails are stored internally and not shown in the UI |
| MinIO object storage          | `objects` store holds file bytes under server-generated keys. `attachments` holds the metadata. Both are written in one transaction. File types come from an allowlist and the file's actual header bytes are checked. |
| Category delete rule          | Notes that used the category become *Uncategorized*                        |
| Note delete                   | Removes the note's history, attachment metadata and file bytes in one transaction |

> Everything runs in the browser, so these checks show how the design works but are not a real security boundary. Anyone with DevTools can read or change local data. A production build needs the server-side ASP.NET Core stack described in the specification.
