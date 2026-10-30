# Notewell — Tutorial Topic → Feature Map

This file maps each lesson in the three Dot Net Tutorials courses to a Notewell feature. Topics are listed in the same order as the course. Work through the course from top to bottom and build each feature when you reach its lesson. Earlier work is never undone; later lessons build on it.

- Course 1: [ASP.NET Core Tutorials](https://dotnettutorials.net/course/asp-net-core-tutorials/)
- Course 2: [ASP.NET Core Identity Tutorials](https://dotnettutorials.net/course/asp-net-core-identity-tutorials/)
- Course 3: [ASP.NET Core Web API Tutorials](https://dotnettutorials.net/course/asp-net-core-web-api-tutorials/)
- Target UI (browser-only demo): https://prathameshsystenics.github.io/notewell/index.html

Page names (Home, My Notes, Note Details, …) refer to the demo pages: `index.html`, `notes.html`, `note.html`, `note-edit.html`, `note-history.html`, `dashboard.html`, `account.html`, `login.html`, `register.html`, `forgot-password.html`, `reset-password.html`, `access-denied.html`, `404.html`, `admin-dashboard.html`, `admin-users.html`, `admin-user.html`, `admin-categories.html`.

> These sections are left out because they are adverts, reading lists or interview prep, not lessons: *Online Training Program*, *Interview Questions and Answers*, *Popular Books*. Projects from other domains (Library, Ecommerce, Food Delivery, Hotel Booking, …) are reference reading only. Notewell takes their place.

---

# Course 1 — ASP.NET Core Tutorials

## 1.1 Introduction & Environment Setup

| #  | Tutorial topic                                   | Notewell page / feature               | What to do                                                             |
| -- | ------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| 1  | Overview of Microsoft Web Technologies           | —                                     | Reading only                                                           |
| 2  | Introduction to ASP.NET Core Framework           | Whole app                             | Decide on the `Notewell.Web` project                                   |
| 3  | ASP.NET Core Environment Setup                   | Dev machine                           | Install the tools below                                                |
| 4  | Download and Install Visual Studio 2022          | Dev machine                           | IDE                                                                    |
| 5  | Download and Install .NET Core SDK               | Dev machine                           | Run `dotnet --info`                                                    |
| 6  | Download and Install Visual Studio Code          | Dev machine                           | Optional editor                                                        |
| 7  | Download and Install SQL Server 2022             | Database                              | The `Notewell` database will live here                                 |
| 8  | Download and Install SSMS                        | Database                              | Inspect tables after each migration                                    |
| 9  | Download and Install Postman and Fiddler         | API testing                           | Used later for `/api/notes`                                            |
| 10 | .NET Core vs .NET Framework Code Execution       | —                                     | Reading only                                                           |
| 11 | Difference Between .NET Core and .NET Framework  | —                                     | Reading only                                                           |
| 12 | Difference Between Web Application and Website   | Home vs app pages                     | Home is the public "website" part; Dashboard and Notes are the "web app" part |

## 1.2 ASP.NET Core Basics

| #  | Tutorial topic                                  | Notewell page / feature           | What to build                                                                  |
| -- | ----------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| 1  | Creating ASP.NET Core Web Application           | Solution                          | Create `Notewell.sln` + `Notewell.Web` (Empty template)                        |
| 2  | ASP.NET Core Project File                       | `Notewell.Web.csproj`             | Target framework, nullable, package references added as you go                 |
| 3  | ASP.NET Core Main Method                        | `Program.cs`                      | Builder → services → app → pipeline → `Run()`                                  |
| 4  | ASP.NET Core InProcess Hosting                  | Hosting                           | Run under IIS Express in-process                                               |
| 5  | Kestrel Web Server                              | Hosting                           | Run with `dotnet run` on Kestrel                                               |
| 6  | ASP.NET Core Out Of Process Hosting             | Hosting                           | Try out-of-process and compare                                                 |
| 7  | LaunchSettings.json File                        | Profiles                          | `Development` profile, port, launch URL `/`                                    |
| 8  | AppSettings.json file                           | Configuration                     | `App:Name = "Notewell"`, `App:SourceUrl` (shown in the footer)                 |
| 9  | Middleware Components                           | Pipeline                          | Write a small custom middleware that logs request time                         |
| 10 | Request Processing Pipeline                     | Pipeline                          | Order: exception → static files → routing → (auth later) → endpoints           |
| 11 | wwwroot Folder                                  | `wwwroot/`                        | Copy `css/app.css`, `js/theme.js`, favicons, `og-image.png`, `site.webmanifest` |
| 12 | Static Files Middleware                         | Static assets                     | `UseStaticFiles()` so CSS and icons load                                       |
| 13 | Configuring Default Page                        | **Home** (`index.html`)           | Serve the static home page as the default page (replaced by MVC later)         |
| 14 | Developer Exception Page Middleware             | Errors (dev only)                 | Show the developer exception page only in Development                          |
| 15 | ASP.NET Core Command Line Interface             | Tooling                           | `dotnet new`, `dotnet build`, `dotnet watch`                                   |
| 16 | Project Templates                               | Tooling                           | Compare Empty / MVC / Web API templates                                        |

## 1.3 ASP.NET Core MVC – Basic

| # | Tutorial topic                                             | Notewell page / feature               | What to build                                                                          |
| - | ---------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| 1 | Introduction to ASP.NET Core MVC Framework                 | App structure                         | Create the `Controllers/`, `Models/` and `Views/` folders                              |
| 2 | How to Set up MVC in ASP.NET Core                          | `Program.cs`                          | `AddControllersWithViews()` + `MapControllerRoute`                                     |
| 3 | AddController vs AddMvc vs AddControllersWithViews vs AddRazorPages | `Program.cs`                 | Use `AddControllersWithViews` (add Razor Pages later for Identity)                     |
| 4 | Controllers                                                | `HomeController`, `NotesController`   | `Home/Index` (Home page), `Notes/Index` (My Notes)                                      |
| 5 | Models                                                     | `Note`, `Category`, `NoteStatus` enum | Plain classes; notes come from an in-memory list for now                               |
| 6 | Views                                                      | **Home**, **My Notes**                | `Views/Home/Index.cshtml`, `Views/Notes/Index.cshtml`                                   |
| 7 | Dependency Injection                                       | `INoteService` / `InMemoryNoteService` | Inject the service into `NotesController`                                             |
| 8 | Singleton vs Scoped vs Transient                           | Service lifetimes                     | In-memory store = Singleton (Scoped once EF Core arrives); write a demo `IClock`/GUID service to see the difference |

## 1.4 ASP.NET Core MVC – Data Passing Techniques

| # | Tutorial topic                    | Notewell page / feature                    | What to build                                                                            |
| - | --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1 | Application using MVC Template    | Whole app                                  | Compare the MVC template with your project; reuse its `_Layout` idea                     |
| 2 | **ViewData**                      | **Home page → FAQ** section + page `<title>` | Put the FAQ question/answer list in `ViewData["Faq"]`; `ViewData["Title"]` sets the page title |
| 3 | **ViewBag**                       | **Home page → Features** section           | Pass the 6 feature cards (Easy formatting, To-do board, Undo any change…) with `ViewBag.Features` |
| 4 | **Strongly Typed View**           | **Note Details** (`note.html`)             | `@model Note`: title, content, category, status, dates                                   |
| 5 | **ViewModel**                     | **Dashboard** (`dashboard.html`)           | `DashboardViewModel`: totals, count per status, recent notes, pinned notes               |
| 6 | **TempData**                      | Toast messages ("Note saved", "Note deleted") | Set `TempData["Success"]` before redirecting; the layout shows it once                |
| 7 | **Post-Redirect-Get (PRG)**       | **Create Note** (`note-edit.html`)         | POST create → redirect to Note Details, so refreshing the page doesn't post again        |

## 1.5 ASP.NET Core MVC – Routing

| # | Tutorial topic                              | Notewell page / feature                  | What to build                                                                    |
| - | ------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| 1 | Routing                                     | All pages                                | Default route `{controller=Home}/{action=Index}/{id?}`                           |
| 2 | Custom Routing                              | Friendly URLs                            | `/notes`, `/notes/new`, `/notes/{id}`, `/notes/{id}/edit`, `/dashboard`           |
| 3 | Custom Route Constraint                     | **My Notes** status filter               | `/notes/status/{status:noteStatus}` only accepts `draft`, `inprogress` or `completed` |
| 4 | Attribute Routing                           | **Note History**, **Admin** pages        | `[Route("notes/{id:int}/history")]`, `[Route("admin/categories")]`               |
| 5 | Attribute Routing using Tokens              | `AdminController`                        | `[Route("admin/[action]")]`                                                      |
| 6 | Attribute Routing vs Conventional Routing   | Decision                                 | Conventional for Home and Account; attribute routes for Notes and Admin. Write the choice down |

## 1.6 ASP.NET Core MVC – Views

| #  | Tutorial topic                            | Notewell page / feature                            | What to build                                                               |
| -- | ----------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| 1  | Layout View                               | `_Layout.cshtml`                                   | Top navbar, mobile slide-down menu, footer "Made by Prathamesh" + source link |
| 2  | Sections in Layout View                   | `@section Scripts` / `@section Head`               | Editor JS only on Edit Note; SEO meta tags only on Home/Login/Register      |
| 3  | ViewStart                                 | `_ViewStart.cshtml`                                | Default layout; a simpler `_AuthLayout` for Login/Register                   |
| 4  | ViewImports                               | `_ViewImports.cshtml`                              | Namespaces + tag helpers                                                    |
| 5  | Partial Views                             | `_NoteCard`, `_StatusBadge`, `_Pager`              | Note card used on My Notes and Dashboard                                    |
| 6  | Different Ways to Render Partial View     | **My Notes → Grid / List / Board**                 | `<partial>`, `Html.PartialAsync`, `RenderPartialAsync`, one per view mode    |
| 7  | View Components                           | **Pinned notes** widget, navbar user menu          | `PinnedNotesViewComponent` on the Dashboard                                 |
| 8  | Razor Syntax                              | All views                                          | Loops, `@if`, status colours, relative dates                                |
| 9  | How to Install Bootstrap                  | Styling                                            | Bootstrap via LibMan, or keep Tailwind/daisyUI from the demo                |
| 10 | How to Use Bootstrap                      | Styling                                            | Grid cards, navbar, badges, forms                                           |

## 1.7 ASP.NET Core MVC – Action Results

| #  | Tutorial topic          | Notewell page / feature                                  | What to build                                                       |
| -- | ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| 1  | Action Results          | All controllers                                          | Return `IActionResult` everywhere                                   |
| 2  | View Result             | My Notes, Note Details, Dashboard                        | `return View(model)`                                                |
| 3  | Partial View Result     | **My Notes** view switch / filter                        | Return only `_NotesGrid` when the grid is refreshed with AJAX       |
| 4  | JSON Result             | **Note Details → status change**, pin toggle             | `return Json(new { status })` for the AJAX status dropdown          |
| 5  | Content Result          | `robots.txt`, raw Markdown                               | `Content(text, "text/plain")`                                       |
| 6  | File Result             | **Note Details → Export Markdown**, **Account → Export JSON** | `File(bytes, "text/markdown", "note.md")`                       |
| 7  | Redirect Results        | After create/edit/delete, login                          | `RedirectToAction`, `RedirectToRoute`, `LocalRedirect`              |
| 8  | Status Results          | Note not found / not yours                               | `NotFound()`, `Forbid()`, `BadRequest()`                            |
| 9  | Object Result           | Small JSON endpoint                                      | `new ObjectResult(stats) { StatusCode = 200 }`                      |
| 10 | EmptyResult             | Fire-and-forget actions                                  | Mark a toast as seen; return `new EmptyResult()`                    |

## 1.8 ASP.NET Core MVC – HTML Helpers

| #  | Tutorial topic                               | Notewell page / feature                     | What to build                                                       |
| -- | -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| 1  | HTML Helpers                                 | Forms                                       | Overview                                                            |
| 2  | TextBox                                      | **Edit Note → Title**                       | `Html.TextBoxFor(m => m.Title)`                                     |
| 3  | TextArea                                     | **Edit Note → Content (Markdown)**          | `Html.TextAreaFor(m => m.Content)`                                  |
| 4  | DropDownList                                 | **Edit Note → Category**                    | `Html.DropDownListFor` with a `SelectList` of categories            |
| 5  | RadioButton                                  | **Edit Note → Status**                      | Draft / In progress / Completed                                     |
| 6  | Check Box                                    | **Edit Note → Pin**, **Login → Remember me** | `Html.CheckBoxFor(m => m.IsPinned)`                                |
| 7  | ListBox                                      | **My Notes → filter by several categories** | Multi-select category filter                                        |
| 8  | Editor                                       | **Account → Profile**                       | `Html.EditorFor` for the display name                               |
| 9  | Password                                     | **Login**, **Register**                     | `Html.PasswordFor`                                                  |
| 10 | Hidden                                       | **Edit Note**                               | `Html.HiddenFor(m => m.NoteId)`                                     |
| 11 | Custom HTML Helper                           | Status badge                                | `@Html.StatusBadge(note.Status)`                                    |
| 12 | Real-Time Examples of Custom HTML Helpers    | "Updated 2 hours ago", file size            | `@Html.TimeAgo(date)`, `@Html.FileSize(bytes)`                      |
| 13 | Creating Form Using HTML Helpers             | **Create Note** form                        | Whole form with `Html.BeginForm`                                    |
| 14 | Different Ways to Generate Links             | Navbar, pager, note links                   | `Html.ActionLink`, `Html.RouteLink`, `Url.Action`                   |

## 1.9 ASP.NET Core MVC – Tag Helpers

| #  | Tutorial topic                       | Notewell page / feature                         | What to build                                                       |
| -- | ------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------- |
| 1  | Tag Helpers                          | All forms                                       | Change the Create Note form from HTML Helpers to tag helpers        |
| 2  | Image Tag Helper                     | Logo, favicon, image previews                   | `asp-append-version="true"` to bust the cache                       |
| 3  | Environment Tag Helper               | `_Layout`                                       | Local CSS/JS in Development, CDN in Production                       |
| 4  | Navigation Menus                     | Top navbar                                      | Highlight the active page (Dashboard / My Notes / Account)          |
| 5  | Form Tag Helpers                     | **Register**, **Login**, **Edit Note**          | `asp-for`, `asp-action`, `asp-validation-for`                       |
| 6  | Partial Tag Helper                   | `<partial name="_NoteCard" />`                  | Use it on My Notes and Dashboard                                    |
| 7  | Custom Tag Helper                    | `<status-badge>`, `<time-ago>`                  | Same output as the HTML helpers, written as tag helpers             |
| 8  | View Component Tag Helper            | `<vc:pinned-notes />`                           | Dashboard pinned widget                                             |
| 9  | Cache Tag Helper                     | **Home → Features / FAQ**                       | `<cache expires-after="...">` around the static sections            |
| 10 | HTML Helpers vs. Tag Helpers         | Decision                                        | Tag helpers from here on                                            |

## 1.10 ASP.NET Core MVC – Model Binding

| # | Tutorial topic                      | Notewell page / feature                    | What to build                                                                   |
| - | ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| 1 | Model Binding                       | All POST actions                           | Overview                                                                        |
| 2 | FromForm                            | **Create / Edit Note**                     | `[FromForm] NoteFormViewModel`                                                  |
| 3 | FromQuery                           | **My Notes → search, filter, sort, page**  | `?q=&status=&categoryId=&sort=&page=&view=grid`                                 |
| 4 | FromRoute                           | **Note Details / Edit / History**          | `[FromRoute] int id`                                                            |
| 5 | Complex Type                        | **My Notes** filter object                 | `NoteFilterViewModel` (all query values in one class)                          |
| 6 | Custom Model Binding                | **My Notes → several statuses**            | `?status=draft,completed` → `List<NoteStatus>` with a custom binder             |

## 1.11 ASP.NET Core MVC – Data Annotation Validation

| #  | Tutorial topic                                  | Notewell page / feature                     | What to build                                                            |
| -- | ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| 1  | Data Annotations                                | ViewModels                                  | Overview                                                                 |
| 2  | Model Validations                               | **Create / Edit Note**                      | `if (!ModelState.IsValid) return View(model)`                            |
| 3  | Data Annotation Attributes                      | `NoteFormViewModel`, `CategoryFormViewModel` | `[Required]`, `[StringLength(200)]`, `[EmailAddress]`, `[Compare]`      |
| 4  | Custom Validation Attributes                    | Status / category                           | `[ValidNoteStatus]`, `[CategoryExists]`                                  |
| 5  | Remote Validation                               | **Admin → Categories**                      | Check "category name already taken" without reloading the page          |
| 6  | Display and DisplayFormat Attributes            | Note Details, Dashboard                     | `[Display(Name="Last updated")]`, date format                            |
| 7  | BindNever and BindRequired                      | **Edit Note**                               | `[BindNever]` on `UserId` / `CreatedAt` so the form can't change them    |
| 8  | Blacklist and Whitelist Checks                  | Category names, file types                  | Block reserved names ("Admin", "Uncategorized"); allow-list for uploads  |
| 9  | Custom Data Annotation Real-Time Examples       | Note title                                  | `[NoHtml]` (no tags in the title)                                        |
| 10 | Real-Time Examples of Data Annotations          | **Register** form                           | Full Register view model with error messages                            |

## 1.12 ASP.NET Core MVC – Fluent API Validation

| # | Tutorial topic                               | Notewell page / feature           | What to build                                                       |
| - | -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| 1 | Fluent API (FluentValidation)                | Validation                        | Add the FluentValidation package                                    |
| 2 | Fluent API Validation Examples               | **Create / Edit Note**            | `NoteFormValidator`                                                 |
| 3 | Fluent API Async Validators                  | **Admin → Categories**            | Async "name is unique" check against the database                  |
| 4 | Fluent API Custom Validators                 | Note content                      | Custom rule, e.g. maximum Markdown size                             |
| 5 | Real-Time Examples of Fluent API Validations | **Register**                      | `RegisterValidator`                                                 |
| 6 | Data Annotations vs. Fluent API              | Decision                          | Pick one style for the project and use it everywhere                |

## 1.13 ASP.NET Core MVC – State Management

| # | Tutorial topic                              | Notewell page / feature                      | What to build                                                  |
| - | ------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| 1 | Cookies                                     | **Theme** (light/dark), **My Notes view mode** | Remember the theme and the grid/list/board choice in cookies |
| 2 | Persistent vs Non-Persistent Cookies        | Theme = persistent, toast = non-persistent   | Set `Expires` on one, leave it off the other                  |
| 3 | Sessions                                    | **My Notes** last filter, unsaved draft      | Put the last filter in the session; restore it when coming back |
| 4 | Differences Between Cookies and Sessions    | Decision                                     | Write down why each was chosen                                 |

## 1.14 ASP.NET Core – Filters

| #  | Tutorial topic                              | Notewell page / feature                          | What to build                                                                 |
| -- | ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1  | Filters                                     | Overview                                         | —                                                                             |
| 2  | Exception Filter                            | Notes controller                                 | Log the error and show a friendly error page                                  |
| 3  | Handling Non-Success HTTP Status Codes      | **404 page**                                     | `UseStatusCodePagesWithReExecute("/Error/{0}")`                               |
| 4  | Error Pages Based on Status Code            | **404.html**, **access-denied.html**             | A separate view for 404, 403 and 500                                          |
| 5  | Result Filters                              | Private pages                                    | Add `X-Robots-Tag: noindex` to Dashboard / Notes / Admin                       |
| 6  | Custom Result Filter                        | Same                                             | Write it as a `[NoIndex]` attribute                                           |
| 7  | Response Caching                            | **Home** page                                    | `[ResponseCache(Duration=...)]`                                               |
| 8  | Authorization Filters                       | Admin pages (placeholder)                        | Simple custom filter now; replaced by Identity roles in Course 2              |
| 9  | Action Filters                              | Notes actions                                    | Log action timing; a `[ValidateModel]` filter                                 |
| 10 | TypeFilter vs ServiceFilter                 | Ownership filter                                 | `[ServiceFilter(typeof(NoteExistsFilter))]` (needs DI)                        |
| 11 | AntiForgery Token                           | All POST forms, delete note                      | `[ValidateAntiForgeryToken]` / auto-validate globally                         |

## 1.15 Entity Framework Core

| #  | Tutorial topic                                   | Notewell page / feature                         | What to build                                                                    |
| -- | ------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 1  | Introduction to EF Core                          | Data layer                                      | Replace the in-memory list                                                       |
| 2  | How to Install EF Core                           | Packages                                        | `SqlServer`, `Tools`, `Design`                                                   |
| 3  | DbContext                                        | `NotewellDbContext`                             | `DbSet<Note>`, `DbSet<Category>`                                                 |
| 4  | Database Connection String                       | `appsettings.Development.json`                  | `ConnectionStrings:Notewell`                                                     |
| 5  | CRUD Operations                                  | **Notes + Categories**                          | Add / find / update / remove                                                     |
| 6  | Entity States                                    | Edit Note                                       | Added / Modified / Deleted / Detached                                            |
| 7  | LINQ to Entities                                 | **My Notes** search, filter, sort, page          | `Where`, `OrderBy`, `Skip`/`Take`, `CountAsync`                                 |
| 8  | Code First Approach                              | First migration                                 | `Add-Migration InitialCreate`, `Update-Database`                                 |
| 9  | Eager Loading                                    | **My Notes** shows the category                 | `.Include(n => n.Category)`                                                      |
| 10 | Lazy Loading                                     | Experiment                                      | Try it, see the N+1 problem, then turn it off                                    |
| 11 | Explicit Loading                                 | **Note Details → history count**                | `Entry(note).Collection(n => n.Versions).LoadAsync()`                            |
| 12 | Default Conventions                              | Keys / foreign keys                             | `NoteId`, `CategoryId` found by convention                                       |
| 13 | Data Annotations in EF Core                      | Entities                                        | Overview                                                                         |
| 14 | Table Attribute                                  | `Note`                                          | `[Table("Notes")]`                                                               |
| 15 | Column Attribute                                 | `Note.Content`                                  | `[Column(TypeName="nvarchar(max)")]`                                             |
| 16 | Key Attribute                                    | `Note`                                          | `[Key] NoteId`                                                                   |
| 17 | ForeignKey Attribute                             | `Note.CategoryId`                               | `[ForeignKey(nameof(Category))]`                                                 |
| 18 | Index Attribute                                  | `Category.Name`                                 | `[Index(nameof(Name), IsUnique = true)]`                                         |
| 19 | InverseProperty Attribute                        | `Note` ↔ `NoteVersion`                          | Two links between the same entities (`Versions` and `CurrentVersion`)            |
| 20 | NotMapped Attribute                              | `Note.Excerpt`                                  | Preview text worked out in code, not stored                                      |
| 21 | Required Attribute                               | `Note.Title`, `Category.Name`                   | NOT NULL columns                                                                 |
| 22 | MaxLength and MinLength                          | Title 200, category name 50                     | Column lengths                                                                   |
| 23 | DatabaseGenerated Attribute                      | `CreatedAt`                                     | Default value `SYSUTCDATETIME()`                                                 |
| 24 | TimeStamp Attribute                              | `Note.RowVersion`                               | Stop two tabs from overwriting each other's edits                                |
| 25 | ConcurrencyCheck Attribute                       | `Category.Name`                                 | Catch two admins renaming the same category                                      |
| 26 | Fluent API in EF Core                            | `OnModelCreating`                               | Move the configuration into Fluent API                                           |
| 27 | Relationships                                    | Model                                           | Overview                                                                         |
| 28 | One-to-One                                       | User ↔ `UserSettings`                           | Theme / default view per user (stand-in user until Identity)                     |
| 29 | One-to-Many                                      | Category → Notes, Note → Attachments, Note → Versions | Main relationships                                                         |
| 30 | Many-to-Many                                     | Note ↔ Tag *(practice)*                         | Optional `Tag` table; Identity's UserRoles is a real example later               |
| 31 | Self-Referential Relationship                    | `Category.ParentCategoryId` *(practice)*        | Optional sub-categories                                                          |
| 32 | Global Configurations                            | Conventions                                     | All strings `nvarchar(…)`, all dates UTC                                         |
| 33 | Entity Configurations                            | `NoteConfiguration : IEntityTypeConfiguration`  | One configuration class per entity                                               |
| 34 | Property Configuration                           | Status stored as string                         | `.HasConversion<string>()`                                                       |
| 35 | Non-Primary Key Table                            | Dashboard stats                                 | Keyless `DashboardStats` mapped to a view                                        |
| 36 | Asynchronous Programming with EF Core            | All queries                                     | `ToListAsync`, `SaveChangesAsync`                                                |
| 37 | Bulk Operations                                  | **Admin → delete category**                     | `ExecuteUpdateAsync`: move its notes to *Uncategorized*                          |
| 38 | Bulk Ops using Z.EntityFramework.Extensions      | *(practice)*                                    | Compare with the built-in approach                                               |
| 39 | Bulk Ops using EFCore.BulkExtensions             | Seed many notes                                 | Insert 10,000 test notes to try out paging                                       |
| 40 | Bulk Operations Performance Benchmark            | *(practice)*                                    | Time the approaches                                                              |
| 41 | Disconnected Entities                            | **Edit Note** POST                              | Attach + update an entity that arrived from the form                             |
| 42 | Batch Processing with Job Scheduler              | Cleanup job                                     | Nightly job: remove expired reset tokens / orphaned files                        |
| 43 | Disconnected Entity Graph                        | Note + versions                                 | `TrackGraph` practice                                                            |
| 44 | Stored Procedures                                | **Admin Dashboard** totals                      | `sp_GetAdminStats` (users, notes, categories, attachments)                       |
| 45 | EF Core Inheritance                              | `Attachment` types                              | Overview                                                                         |
| 46 | Table Per Hierarchy                              | `ImageAttachment` / `PdfAttachment`             | One table with a discriminator column                                            |
| 47 | Table Per Type                                   | *(practice)*                                    | Compare the generated schema                                                     |
| 48 | Table Per Concrete Type                          | *(practice)*                                    | Compare the generated schema                                                     |
| 49 | Transactions                                     | **Save note + new version**, **delete note**    | One transaction for the note, its history and its attachments                   |
| 50 | Seed Data                                        | Categories + demo notes                         | Groceries, Meal planning, Travel, Budget… + 6 sample notes                       |
| 51 | Shadow Properties                                | `UpdatedAt` / `UpdatedBy`                       | Set automatically in `SaveChangesAsync`                                          |
| 52 | Global Query Filters                             | Ownership / soft delete                         | `HasQueryFilter(n => n.UserId == _currentUserId)`                                |
| 53 | Database First Approach                          | *(practice)*                                    | Scaffold a copy of the database into a scratch project                           |

## 1.16 ASP.NET Core MVC Using EF Core

| # | Tutorial topic                                        | Notewell page / feature                             | What to build                                                         |
| - | ----------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| 1 | CRUD Operations in MVC using EF Core                  | **My Notes, Create, Details, Edit, Delete**         | Full note CRUD pages working against SQL Server                      |
| 2 | Repository Design Pattern                             | `INoteRepository`                                   | Note-specific queries (search, page, dashboard counts)                |
| 3 | Generic Repository Pattern                            | `IRepository<T>`                                    | Category CRUD                                                         |
| 4 | Generic + Non-Generic Repository                      | Both                                                | `NoteRepository : Repository<Note>, INoteRepository`                  |
| 5 | Unit of Work Pattern                                  | `IUnitOfWork`                                       | Save note + version + attachment metadata with one `SaveChanges`      |

## 1.17 ASP.NET Core MVC – File Handling

| # | Tutorial topic                                  | Notewell page / feature                         | What to build                                                       |
| - | ----------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| 1 | File Handling                                   | **Note Details → Attachments**                  | Upload / list / download / delete with `IFormFile`                  |
| 2 | Restricting Uploaded File Type and Size         | Attachments                                     | PDF / PNG / JPG / WebP only, 5 MB max, check the file's header bytes |
| 3 | Export Data to Excel                            | **My Notes → Export to Excel**                  | Notes list as `.xlsx`                                               |
| 4 | Import Excel Data to Database                   | **Account → Import notes**                      | Create notes from rows in `.xlsx`                                   |
| 5 | Generate PDF                                    | **Note Details → Export PDF**                   | The note rendered as a PDF                                          |
| 6 | Generate Password Protected PDF                 | Export PDF option                               | Ask for a password before downloading                               |
| 7 | Working with Bar Chart and PDF                  | **Admin Dashboard**                             | Bar chart of notes per category (totals only) + PDF report          |
| 8 | Upload Multiple Files                           | **Note Details → drop zone**                    | Drop several files at once                                          |

## 1.18 ASP.NET Core MVC – Advanced

| #  | Tutorial topic                               | Notewell page / feature                       | What to build                                                            |
| -- | -------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| 1  | MVC Request Life Cycle                       | —                                             | Reading; trace one request to Note Details                               |
| 2  | MVC with EF Core DB First                    | *(practice)*                                  | Same as 1.15 #53                                                         |
| 3  | Bundling and Minification                    | `wwwroot/css`, `wwwroot/js`                   | Bundle and minify `app.css` and the editor JS                            |
| 4  | Host into IIS Server                         | Deployment                                    | Publish Notewell to local IIS                                            |
| 5  | Use SSL in Local IIS                         | Deployment                                    | HTTPS binding, HSTS                                                      |
| 6  | CRUD Operation on a Single Page              | **Admin → Categories** (`admin-categories.html`) | Add, rename, recolour and delete categories in place on one page      |
| 7  | Cascading Dropdown List                      | **My Notes** filter bar                       | Picking a category reloads the status list with counts for that category (AJAX) |
| 8  | Razor Pages Application                      | Identity UI area                              | Identity account pages are Razor Pages; see how they sit next to MVC     |
| 9  | Dynamic Menus                                | Top navbar                                    | Build the menu from the role (Admin link only for Admin)                 |
| 10 | Auto Page Refresh                            | **Dashboard** counts                          | Refresh the counts on a timer                                            |

---

# Course 2 — ASP.NET Core Identity Tutorials

## 2.1 ASP.NET Core Identity

| #  | Tutorial topic                                   | Notewell page / feature                         | What to build                                                                     |
| -- | ------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| 1  | Identity Setup                                   | `NotewellDbContext : IdentityDbContext`         | Add Identity to the existing database                                             |
| 2  | Identity Tables                                  | SQL Server                                      | Look at AspNetUsers, Roles, UserRoles, Claims… in SSMS                            |
| 3  | UserManager, SignInManager, RoleManager          | `AccountController`, `AdminController`          | Inject and use all three                                                          |
| 4  | Customizing Identity Database                    | `ApplicationUser`                               | `DisplayName`, `CreatedAt`, `LastLoginAt`, `MustChangePassword`; replace the stand-in user from 1.15 #28 |
| 5  | Register, Login, and Logout                      | **Register**, **Login**, logout in the navbar   | New users get the `User` role; logout is a POST                                   |
| 6  | Custom Password Policy                           | **Register**, **Account → Change password**     | Length, digits, symbols; a custom validator that rejects the email as the password |
| 7  | Redirect to ReturnUrl After Login                | **Login**                                       | `/notes/5` → login → back to `/notes/5` (`LocalRedirect` only)                    |
| 8  | Remote Validation                                | **Register → email**                            | "This email is already registered" as you type                                    |
| 9  | Roles Management                                 | **Admin** roles                                 | Seed the `Admin` and `User` roles                                                 |
| 10 | Users Management                                 | **Admin → Users** (`admin-users.html`), **User** (`admin-user.html`) | Paginated, searchable user list; user details page        |
| 11 | Role Based Authorization                         | Admin pages                                     | `[Authorize(Roles = "Admin")]`; Access Denied page                                |
| 12 | Claims Management                                | Display name in the navbar                      | Add a `DisplayName` claim                                                         |
| 13 | Manage User Claims                               | **Admin → User**                                | Give or remove an `Export` claim                                                  |
| 14 | Manage Role Claims                               | Admin role                                      | `Permission: Categories.Manage` on the Admin role                                 |
| 15 | Claims Based Authorization                       | Export to Excel/PDF                             | `[Authorize(Policy = "CanExport")]`                                               |
| 16 | Policy-Based Authorization                       | **Note ownership**                              | Resource-based `NoteOwnerHandler`; "must not need a password change" policy       |
| 17 | Hybrid Authorization                             | **Admin → Categories**                          | Admin role **and** the `Categories.Manage` claim                                  |

## 2.2 ASP.NET Core Identity – External Providers

| # | Tutorial topic                                   | Notewell page / feature             | What to build                                                      |
| - | ------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| 1 | External Identity Providers                      | **Login** page                      | Area for "Sign in with…" buttons                                   |
| 2 | Google External Authentication                   | **Login / Register**                | Sign in with Google                                                |
| 3 | Facebook External Authentication                 | **Login / Register**                | Sign in with Facebook                                              |
| 4 | Microsoft Account External Login Setup           | Azure app registration              | Client ID / secret                                                 |
| 5 | Microsoft External Authentication in MVC         | **Login / Register**                | Sign in with Microsoft                                             |
| 6 | Secret Manager                                   | Configuration                       | Keep Google, Facebook and Microsoft secrets and the SMTP password in user-secrets |
| 7 | Azure Key Vault vs. AWS Secrets Manager          | Deployment                          | Pick one for production secrets                                    |

## 2.3 ASP.NET Core Identity – Advanced

| #  | Tutorial topic                                         | Notewell page / feature                                    | What to build                                                       |
| -- | ------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| 1  | Forgot Password                                        | **Forgot password**, **Reset password**                    | Reset link sent by email, valid for 1 hour                          |
| 2  | How to Store Tokens                                    | Reset / external login tokens                              | `DataProtectorTokenProvider` lifetime, `AspNetUserTokens`           |
| 3  | Change Password                                        | **Account → Change password**                              | Signs out other sessions (security stamp)                           |
| 4  | Add Password to Local Account Linked to External Login | **Account**                                                | "Set a password" for users who signed up with Google                |
| 5  | Account Lockout                                        | **Login**, **Admin → User → Unlock**                       | Lock for 5 minutes after 5 failed sign-ins; Admin can unlock        |
| 6  | Password Change Policy                                 | Seeded Admin                                               | Must change the password at first sign-in (`MustChangePassword`)    |
| 7  | Implement CAPTCHA                                      | **Register**, **Forgot password**                          | reCAPTCHA / Turnstile                                               |
| 8  | Configure SMS Service                                  | `ISmsSender`                                               | Development sender that logs the message                            |
| 9  | Verify Phone Number                                    | **Account**                                                | Add and verify a phone number                                       |
| 10 | Two-Factor Authentication                              | **Account → Security**                                     | Authenticator app / SMS code at login                               |
| 11 | View and Edit Profile Details                          | **Account → Profile** (`account.html`)                     | Display name, email, member since, theme                            |

---

# Course 3 — ASP.NET Core Web API Tutorials

The API is added to the same Notewell app, under `/api/...`. It uses the same `NotewellDbContext`, services and rules as the MVC pages.

## 3.1 Introduction and Environment Setup

| # | Tutorial topic                                  | Notewell page / feature   | What to do                                  |
| - | ----------------------------------------------- | ------------------------- | ------------------------------------------- |
| 1 | Introduction to ASP.NET Core Framework          | —                         | Reading only (same as Course 1)             |
| 2 | .NET Core vs .NET Framework Code Execution      | —                         | Reading only                                |
| 3 | Environment Setup                               | Dev machine               | Already done                                |
| 4 | Download and Install .NET Core SDK              | Dev machine               | Already done                                |
| 5 | Download and Install Visual Studio 2022         | Dev machine               | Already done                                |
| 6 | Download and Install Visual Studio Code         | Dev machine               | Already done                                |
| 7 | Download and Install SQL Server 2022            | Dev machine               | Already done                                |
| 8 | Download and Install SSMS                       | Dev machine               | Already done                                |
| 9 | Download and Install Postman and Fiddler        | API testing               | Make a "Notewell API" Postman collection    |

## 3.2 ASP.NET Core Web API – Basics

| #  | Tutorial topic                                   | Notewell page / feature             | What to build                                                       |
| -- | ------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------- |
| 1  | Introduction to ASP.NET Core Web API             | `/api/*`                            | Overview                                                            |
| 2  | HTTP                                             | —                                   | Verbs, headers, status codes                                        |
| 3  | Creating Web API Project using .NET CLI          | *(practice)*                        | Scratch project with `dotnet new webapi`                            |
| 4  | Test Web API Using Postman                       | Postman collection                  | First request: `GET /api/categories`                                |
| 5  | Creating Web API Project in Visual Studio        | Notewell.Web                        | Add `AddControllers()` to the existing app                          |
| 6  | Default Web API Files and Folders                | `Controllers/Api/`                  | Keep API controllers apart from MVC controllers                     |
| 7  | Web API Project File                             | csproj                              | Swagger / OpenAPI packages                                          |
| 8  | Web API Main Method                              | `Program.cs`                        | Register `MapControllers()` next to the MVC routes                  |
| 9  | Controllers in Web API                           | `NotesApiController`, `CategoriesApiController` | `[ApiController]`, `ControllerBase`                       |
| 10 | Models in Web API                                | DTOs                                | `NoteResponse`, `CreateNoteRequest`, `UpdateNoteRequest`, `CategoryResponse` |
| 11 | Services in Web API                              | `INoteService`                      | Reuse the same service as MVC                                       |
| 12 | Web API AppSettings.json                         | Configuration                       | `Api:MaxPageSize`, `Jwt:*`                                          |
| 13 | In-Process Hosting Model                         | Hosting                             | Same as Course 1                                                    |
| 14 | Kestrel Web Server                               | Hosting                             | Same as Course 1                                                    |
| 15 | Out of Process Hosting Model                     | Hosting                             | Same as Course 1                                                    |
| 16 | Hosting Model Interview Q&A                      | —                                   | Reading only                                                        |
| 17 | Dependency Injection in Web API                  | API controllers                     | Inject `INoteService`, `ICurrentUser`                               |
| 18 | Singleton vs Scoped vs Transient                 | Lifetimes                           | Check the API services                                              |
| 19 | Swagger API                                      | `/swagger`                          | Swagger UI with JWT "Authorize" button (JWT added in 3.15)          |

## 3.3 ASP.NET Core Web API – Routing

| # | Tutorial topic                                  | Notewell page / feature                          | What to build                                                      |
| - | ----------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------ |
| 1 | Routing in Web API                              | `/api/notes`, `/api/categories`                  | Attribute routes                                                   |
| 2 | Route Parameters and Query Strings              | `GET /api/notes?q=&status=&categoryId=&sort=&page=&pageSize=` | Same filters as the My Notes page                 |
| 3 | Multiple URLs for a Single Resource             | `/api/notes/{id}` and `/api/me/notes/{id}`       | Two routes on one action                                           |
| 4 | Token Replacement                               | `[Route("api/[controller]")]`                    |                                                                    |
| 5 | Route Prefix                                    | `api/admin/...`                                  | Prefix on the controller for admin endpoints                       |
| 6 | Route Constraints                               | `{id:int:min(1)}`                                | Bad IDs get 404 before the action runs                             |
| 7 | How Routing Works in Web API                    | —                                                | Reading; endpoint routing                                          |

## 3.4 ASP.NET Core Web API – Return Types and Status Codes

| #  | Tutorial topic                              | Notewell endpoint / feature                              | What to build                                                    |
| -- | ------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| 1  | Action Return Types                         | All endpoints                                            | `ActionResult<NoteResponse>`, `IActionResult`                    |
| 2  | HTTP Status Codes                           | —                                                        | Overview                                                         |
| 3  | 200 OK                                      | `GET /api/notes`, `GET /api/notes/{id}`                  |                                                                  |
| 4  | 201 Created                                 | `POST /api/notes`                                        | `CreatedAtAction` with a `Location` header                       |
| 5  | 202 Accepted                                | `POST /api/notes/export`                                 | Export runs in the background; return a status URL               |
| 6  | 204 No Content                              | `DELETE /api/notes/{id}`, `PUT`                          |                                                                  |
| 7  | 301 Moved Permanently                       | Old route `/api/v0/notes` → `/api/notes`                 |                                                                  |
| 8  | 302 Found                                   | `GET /api/attachments/{id}/download`                     | Redirect to a short-lived download URL                           |
| 9  | 304 Not Modified                            | `GET /api/categories`                                    | `ETag` / `If-None-Match`                                         |
| 10 | 400 Bad Request                             | Invalid title / status                                   | `ValidationProblemDetails`                                       |
| 11 | 401 Unauthorized                            | No / invalid token                                       |                                                                  |
| 12 | 403 Forbidden                               | User calls `POST /api/categories`                        | Admin only                                                       |
| 13 | 404 Not Found                               | Another user's note                                      | Never reveal that the note exists                                |
| 14 | 405 Method Not Allowed                      | `DELETE /api/categories` without an id                   |                                                                  |
| 15 | Configure Allowed HTTP Methods Globally     | API                                                      | Allow only GET/POST/PUT/PATCH/DELETE                             |
| 16 | 500 Internal Server Error                   | Unhandled errors                                         | ProblemDetails, no stack traces sent to the client               |
| 17 | 501 Not Implemented                         | Endpoint still to come (e.g. bulk edit)                  |                                                                  |
| 18 | 503 Service Unavailable                     | Database down / maintenance mode                         | `/health` returns 503                                            |
| 19 | 504 Gateway Timeout                         | Slow outside service (email/storage)                     | Timeout → 504                                                    |

## 3.5 ASP.NET Core Web API – Model Binding

| #  | Tutorial topic                                      | Notewell endpoint / feature                      | What to build                                                  |
| -- | --------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| 1  | Model Binding in Web API                            | All endpoints                                    | Overview                                                       |
| 2  | FromForm                                            | `POST /api/notes/{id}/attachments`               | Multipart file upload                                          |
| 3  | FromQuery                                           | `GET /api/notes?...`                             | `[FromQuery] NoteQuery`                                        |
| 4  | FromRoute                                           | `/api/notes/{id}`                                |                                                                |
| 5  | FromHeader                                          | `If-Match` (row version), `X-Client`             | Optimistic concurrency on PUT                                  |
| 6  | FromBody                                            | `POST/PUT /api/notes`                            | JSON body                                                      |
| 7  | Custom Model Binding                                | `?status=draft,completed`                        | Same binder as MVC                                             |
| 8  | Binding Attributes on Model Properties              | DTOs                                             | Mix route, query and body values in one request model          |
| 9  | Content Negotiation                                 | `GET /api/notes/{id}`                            | JSON, XML, or `text/markdown` (plain Markdown export)          |
| 10 | Produces and Consumes Attributes                    | API controllers                                  | `[Produces("application/json")]`                               |
| 11 | Exclude Properties from Model Binding               | `UserId`, `CreatedAt`                            | Not in the request DTOs; `[BindNever]`                         |
| 12 | Validation using Data Annotations                   | Request DTOs                                     | `[Required]`, `[StringLength]`, `[EnumDataType]`               |

## 3.6 ASP.NET Core Web API – Entity Framework Core

| #  | Tutorial topic                                  | Notewell feature                         | What to build                                            |
| -- | ----------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| 1  | Brief Introduction to EF Core                   | —                                        | Review                                                   |
| 2  | EF Core in Web API with SQL Server              | API endpoints                            | Use the existing `NotewellDbContext` from the API        |
| 3  | Entity States                                   | `PUT /api/notes/{id}`                    | Update a disconnected entity                             |
| 4  | Relationships                                   | `NoteResponse.Category`                  | Return the category name with each note                  |
| 5  | Lazy Loading                                    | —                                        | Keep it off for the API (it causes serialization loops)  |
| 6  | Eager Loading                                   | `GET /api/notes`                         | `.Include(Category)`, or a projection                    |
| 7  | Explicit Loading                                | `GET /api/notes/{id}?include=attachments` | Load attachments only when asked for                    |
| 8  | Default Conventions                             | —                                        | Review                                                   |
| 9  | Data Annotation Attributes                      | —                                        | Review                                                   |
| 10 | Fluent API Configurations                       | —                                        | Review                                                   |
| 11 | Fluent API Global Configurations                | —                                        | Review                                                   |
| 12 | Fluent API Entity Configurations                | —                                        | Review                                                   |
| 13 | Fluent API Property Configuration               | —                                        | Review                                                   |
| 14 | EF Core Inheritance                             | Attachment TPH                           | Return a `type` field in the API                         |
| 15 | EF Core Transactions                            | `DELETE /api/notes/{id}`                 | Same transaction as MVC                                  |
| 16 | EF Core with Stored Procedures                  | `GET /api/admin/stats`                   | Call `sp_GetAdminStats`                                  |
| 17 | EF Core Database First                          | *(practice)*                             | —                                                        |

## 3.7 Auto Mapping

| #  | Tutorial topic                                  | Notewell DTO                              | What to build                                                    |
| -- | ----------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| 1  | AutoMapper                                      | `Note` → `NoteResponse`                   | `NotewellProfile`                                                |
| 2  | Complex Type Mapping                            | `Note.Category` → `CategoryResponse`      |                                                                  |
| 3  | Complex Type → Primitive                        | `Note.Category.Name` → `CategoryName`     |                                                                  |
| 4  | Reverse Mapping                                 | `CreateNoteRequest` ↔ `Note`              | `.ReverseMap()`                                                  |
| 5  | Conditional Mapping                             | `Content` only when `includeContent=true` | List view sends only an excerpt                                  |
| 6  | Ignore Property Mapping                         | `UserId`, `CreatedAt`, `RowVersion`       | `.Ignore()`                                                      |
| 7  | Null Substitution                               | Category is null                          | `"Uncategorized"`                                                |
| 8  | AutoMapper Advanced Concepts                    | `ProjectTo<NoteResponse>()`               | Map inside the SQL query                                         |
| 9  | AutoMapper Real-time Example                    | Attachment → `AttachmentResponse`         | File size label, download URL                                    |
| 10 | Mapperly                                        | *(alternative)*                           | Rewrite one mapping with the source generator                    |
| 11 | Mapperly Real-time Example                      | Decision                                  | Pick AutoMapper or Mapperly for the project                      |

## 3.8 HTTP Methods

| # | Tutorial topic          | Notewell endpoint                                               | Purpose                                                   |
| - | ----------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| 1 | HTTP Methods            | —                                                               | Overview                                                  |
| 2 | GET                     | `GET /api/notes`, `/api/notes/{id}`, `/api/categories`, `/api/dashboard` | Read                                             |
| 3 | POST                    | `POST /api/notes`, `/api/categories` (Admin)                    | Create                                                    |
| 4 | PUT                     | `PUT /api/notes/{id}`, `/api/categories/{id}` (Admin)           | Full update                                               |
| 5 | PATCH                   | `PATCH /api/notes/{id}/status`, `PATCH /api/notes/{id}/pin`     | Change status / pin (JSON Patch or a small DTO)           |
| 6 | DELETE                  | `DELETE /api/notes/{id}`, `/api/categories/{id}`, `/api/attachments/{id}` | Delete                                          |
| 7 | HEAD                    | `HEAD /api/attachments/{id}`                                    | Check that the file exists and get its size               |
| 8 | OPTIONS                 | Any endpoint                                                    | Allowed methods / CORS preflight                          |

## 3.9 Logging

| # | Tutorial topic                              | Notewell feature                                 | What to build                                               |
| - | ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| 1 | Logging in Web API                          | `ILogger<T>` everywhere                          | Log note created/deleted, failed logins, lockouts           |
| 2 | Custom Logging Provider                     | *(practice)*                                     | Write logs to a text file                                   |
| 3 | Serilog                                     | App-wide                                         | Console + rolling file, structured properties               |
| 4 | Serilog + Elasticsearch + Kibana            | *(practice)*                                     | Search the logs in Kibana                                   |
| 5 | NLog                                        | *(practice)*                                     | Compare with Serilog                                        |
| 6 | Logging to Database using NLog              | Audit log                                        | `AuditLogs` table for admin actions (role change, unlock)   |
| 7 | Serilog vs NLog                             | Decision                                         | Write down the choice                                       |

## 3.10 Caching

| # | Tutorial topic                                  | Notewell feature                         | What to build                                              |
| - | ----------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 1 | Caching in Web API                              | —                                        | Overview                                                   |
| 2 | In-Memory Caching                               | Categories list                          | `IMemoryCache`; clear it when Admin changes a category     |
| 3 | Custom In-Memory Cache                          | *(practice)*                             | —                                                          |
| 4 | Redis Cache                                     | Dashboard stats                          | `IDistributedCache` backed by Redis                        |
| 5 | In-Memory vs Distributed Caching                | Decision                                 | —                                                          |
| 6 | NCache Cluster and Types                        | *(reading)*                              | —                                                          |
| 7 | Download and Install NCache                     | *(practice)*                             | —                                                          |
| 8 | Implement NCache in Web API                     | *(practice)*                             | Swap the Redis cache for NCache                            |
| 9 | Response Caching                                | `GET /api/categories`                    | `[ResponseCache]`                                          |

## 3.11 Fluent Validations

| # | Tutorial topic                                  | Notewell DTO                             | What to build                                              |
| - | ----------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 1 | Fluent API Validation                           | `CreateNoteRequestValidator`             |                                                            |
| 2 | Async Validators                                | `CategoryId` exists                      |                                                            |
| 3 | Custom Validators                               | Status value is valid                    |                                                            |
| 4 | Conditional Validations                         | `UpdateNoteRequest`                      | Check `Content` only when it is sent                       |
| 5 | Nested Complex / Collection Property            | `BulkCreateNotesRequest`                 | Validate each note in the list                             |

## 3.12 Filters

| # | Tutorial topic                              | Notewell feature                             | What to build                                                      |
| - | ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| 1 | Filters in Web API                          | —                                            | Overview                                                           |
| 2 | Authorization Filters                       | API                                          | `[Authorize]` on API controllers                                   |
| 3 | Custom Authorization Filter                 | Must-change-password                         | Block every API call until the password is changed                 |
| 4 | Resource Filters                            | Upload endpoint                              | Reject large files before model binding runs                       |
| 5 | Action Filters                              | API                                          | Log request time; validate the model                               |
| 6 | Result Filters                              | `GET /api/notes`                             | Add `X-Total-Count` / pagination headers                           |
| 7 | Exception Filters                           | API                                          | Turn errors into ProblemDetails                                    |
| 8 | ServiceFilter vs TypeFilter                 | Ownership filter                             | Same idea as MVC                                                   |
| 9 | Request Processing Life Cycle               | —                                            | Reading                                                            |

## 3.13 Security

| # | Tutorial topic                                  | Notewell feature                             | What to build                                                       |
| - | ----------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| 1 | Store Password in Hash Format                   | Identity `PasswordHasher`                    | Already done by Identity; read how it works                         |
| 2 | HMAC Authentication                             | Signed download links                        | Attachment link that includes an HMAC signature and expiry time     |
| 3 | Encryption and Decryption                       | *(practice)*                                 | Data Protection API, e.g. for the export download token             |
| 4 | Asymmetric Encryption                           | JWT signing                                  | RS256 key pair (used in 3.14)                                       |
| 5 | Authentication and Authorization in Web APIs    | —                                            | Overview                                                            |
| 6 | Basic Authentication                            | *(practice)*                                 | Try it on a scratch endpoint; don't use it for real                 |
| 7 | Role-Based Basic Authentication                 | *(practice)*                                 | —                                                                   |
| 8 | JWT Authentication                              | API                                          | Overview                                                            |
| 9 | CORS                                            | API                                          | Allow only a separate front-end origin, when one exists             |

## 3.14 JWT

| # | Tutorial topic                                         | Notewell endpoint / feature                   | What to build                                                      |
| - | ------------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------ |
| 1 | JWT Authentication                                     | `POST /api/auth/login`                        | Return an access token; API uses Bearer, MVC keeps cookies         |
| 2 | Resource Server and Client Applications                | API = resource server, Postman/SPA = client   | Separate the auth endpoints from the resource endpoints            |
| 3 | Refresh Token                                          | `POST /api/auth/refresh`                      | `RefreshTokens` table                                              |
| 4 | Revoke Refresh Tokens                                  | `POST /api/auth/logout`, password change      | Revoke on logout, password change or role change                   |
| 5 | Role Based JWT Authentication                          | `/api/categories` POST/PUT/DELETE             | Role claim in the token; Admin only                                |

## 3.15 SSO Implementation

| # | Tutorial topic                              | Notewell feature              | What to build                                                 |
| - | ------------------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| 1 | SSO Authentication                          | *(optional)*                  | Overview                                                      |
| 2 | Authentication Server                       | *(optional)*                  | Move `/api/auth` into its own project                         |
| 3 | Resource Server                             | Notewell API                  | Accept tokens from that auth server                           |
| 4 | Client Application One (MVC)                | Notewell MVC                  | Sign in through the auth server                               |
| 5 | Client Application Two (MVC)                | *(optional)*                  | A second small app sharing the same login                     |

## 3.16 API Versioning

| # | Tutorial topic                              | Notewell endpoint                              | What to build                                                  |
| - | ------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| 1 | Web API Versioning                          | `/api/notes`                                   | v1 = flat list; v2 = paged result with metadata                |
| 2 | Query String Versioning                     | `/api/notes?api-version=2.0`                   |                                                                |
| 3 | URL Path Versioning                         | `/api/v2/notes`                                | Choose this as the main approach                               |
| 4 | Header Versioning                           | `X-Api-Version: 2`                             |                                                                |
| 5 | Media Type Versioning                       | `Accept: application/json;v=2`                 |                                                                |

## 3.17 Repository Pattern in Web API

| # | Tutorial topic                                      | Notewell feature                    | What to build                                       |
| - | --------------------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| 1 | Introduction to Repository Pattern                  | —                                   | Review (built in 1.16)                              |
| 2 | Start Without Repository Pattern                    | API controllers                     | Notice that the API uses the same repositories as MVC |
| 3 | Non-Generic Repository                              | `INoteRepository`                   | Reuse                                               |
| 4 | Generic Repository                                  | `IRepository<Category>`             | Reuse                                               |
| 5 | Combining Generic and Non-Generic                   | —                                   | Reuse                                               |
| 6 | Unit of Work with Repository                        | `IUnitOfWork`                       | Reuse                                               |

## 3.18 Unit Testing

| #  | Tutorial topic                                  | Notewell feature                                   | What to build                                                       |
| -- | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| 1  | Introduction to Unit Testing                    | `Notewell.Tests`                                   | xUnit project                                                       |
| 2  | Real-time Project for Unit Testing              | Notewell                                           | Make services testable                                              |
| 3  | Unit Testing Service Layer                      | `NoteService`                                      | Create, search, paging, status change                               |
| 4  | Unit Testing Controllers                        | `NotesApiController`                               | 201 / 400 / 404 results                                             |
| 5  | Unit Testing Repositories                       | `NoteRepository`                                   | SQLite in-memory                                                    |
| 6  | Integration Testing                             | `WebApplicationFactory`                            | User A can't read User B's note; User gets 403 on `POST /api/categories` |
| 7  | Test Driven Development                         | New feature                                        | Write the "pin note" tests first                                    |
| 8  | xUnit Theory Attribute                          | Validation                                         | Invalid statuses, page sizes, titles                                |
| 9  | Asynchronous Tests                              | All async services                                 |                                                                     |
| 10 | Fluent Assertions                               | All tests                                          | `result.Should().BeOfType<NotFoundResult>()`                        |

## 3.19 Minimal API

| # | Tutorial topic                                  | Notewell endpoint                       | What to build                                                  |
| - | ----------------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| 1 | Minimal API                                     | `GET /health`, `GET /api/categories`    | Write the categories endpoint again as a minimal API           |
| 2 | Error Handling and Logging                      | Minimal endpoints                       | ProblemDetails + logging                                       |
| 3 | Asynchronous Programming                        | Minimal endpoints                       |                                                                |
| 4 | Minimal API using EF Core                       | `MapGroup("/api/categories")`           |                                                                |
| 5 | Endpoint Filters                                | Validation filter                       |                                                                |
| 6 | JWT Authentication in Minimal API               | `.RequireAuthorization("Admin")`        |                                                                |
| 7 | API Versioning in Minimal API                   | `/api/v2/categories`                    |                                                                |

## 3.20 Web API – Advanced Concepts

| # | Tutorial topic                       | Notewell feature                   | What to build                                               |
| - | ------------------------------------ | ---------------------------------- | ----------------------------------------------------------- |
| 1 | 1XX HTTP Status Codes                | —                                  | Reading                                                     |
| 2 | 2XX HTTP Status Codes                | Notes API                          | Check 200/201/202/204 usage                                 |
| 3 | 3XX HTTP Status Codes                | Downloads / old routes             | Check 301/302/304                                           |
| 4 | 4XX HTTP Status Codes                | Validation / auth / ownership      | Check 400/401/403/404/405/409                               |
| 5 | 5XX HTTP Status Codes                | Errors / health                    | Check 500/503/504                                           |
| 6 | ApiController Attribute              | All API controllers                | Automatic 400s, binding-source inference                    |

## 3.21 Converting Console App to Web API App

| # | Tutorial topic                              | Notewell feature                         | What to build                                                 |
| - | ------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| 1 | Adding Web Host Builder                     | *(practice)*                             | Scratch console → web project                                 |
| 2 | Configuring Startup Class                   | *(practice)*                             | Compare `Startup.cs` with minimal hosting                     |
| 3 | Adding Controller                           | *(practice)*                             | —                                                             |
| 4 | Why .NET 6                                  | —                                        | Reading                                                       |
| 5 | Build Web API Project From Scratch          | *(practice)*                             | —                                                             |
| 6 | Middleware in Web API                       | Notewell pipeline                        | Correlation-ID middleware (`X-Correlation-Id`)                |
| 7 | Run, Use, and Next Method                   | Pipeline                                 | Request timing with `Use`; a terminal `Run`                   |
| 8 | Map Method                                  | `/health` branch                         | `app.Map("/health", ...)`                                     |
| 9 | Custom Middleware                           | Maintenance mode                         | Return 503 while `App:Maintenance = true`                     |

## 3.22 Microservices in ASP.NET Core

| # | Tutorial topic                       | Notewell feature   | What to do                                                    |
| - | ------------------------------------ | ------------------ | ------------------------------------------------------------- |
| 1 | Microservices using ASP.NET Core     | —                  | Reading only. The spec rules out microservices for Notewell   |

---

## Topics not covered by these three courses

These features are in the project specification and the demo, but none of the three courses teaches them. Build them after the courses, following the specification's phases:

| Spec feature                         | Notewell page                            |
| ------------------------------------ | ---------------------------------------- |
| SignalR status notifications         | Note Details / footer connection status |
| Email service (`IEmailService`)      | Welcome email, reset link, "note completed" |
| MinIO attachment storage             | Note Details → Attachments (replace local disk storage from 1.17) |
