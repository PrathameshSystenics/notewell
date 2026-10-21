# Notes & Document Manager

**Live demo:** https://prathameshsystenics.github.io/notes-document-manager/

Write notes in Markdown, organise them by category and status (grid, list or kanban board), attach PDFs and images, and go back to any earlier version.

A browser-only version of the Notes & Document Manager specification. It is built with plain HTML pages, Tailwind CSS and daisyUI. All data is stored in **IndexedDB**. If IndexedDB cannot be opened (some private-browsing modes), the app uses **localStorage** instead.

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

## Pages

| Page                    | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `index.html`            | Home page for visitors. Signed-in users are sent straight to their dashboard |
| `login.html`, `register.html`, `access-denied.html` | Public pages                                  |
| `dashboard.html`        | Counts by status, recently updated notes, pinned notes                    |
| `notes.html`            | Search, filter, sort and paginate notes. Views: **grid**, **list**, **board** (kanban with drag & drop) |
| `note-edit.html`        | Markdown editor (toolbar, Write / Preview / Split, list continuation, draft recovery, Ctrl+S) |
| `note.html`             | Rendered note, status change, clickable checklists, attachments, Markdown export, delete |
| `note-history.html`     | Every saved version, line diff (vs previous or current), restore          |
| `account.html`          | Profile, change password, theme, export notes as JSON                     |
| `admin-*.html`          | Admin overview, users (paginated, role management, unlock), categories    |

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
