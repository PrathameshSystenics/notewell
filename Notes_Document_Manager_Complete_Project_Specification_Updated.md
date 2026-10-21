# Notes & Document Manager

## Detailed Phase-by-Phase Project Guide for Learning .NET

**Document purpose:** A complete implementation and learning plan for
building one small but realistic application while learning C#, .NET, EF
Core, ASP.NET Core MVC, Identity, Web API, SignalR, email integration,
MinIO, testing, and deployment.

**Project roles:** Admin and User\
**Database:** SQL Server\
**Web UI:** ASP.NET Core MVC + Razor Views\
**Data access:** Entity Framework Core\
**Authentication:** ASP.NET Core Identity\
**API:** ASP.NET Core Web API\
**Live updates:** SignalR, for note-status notifications only\
**Email:** An injectable email-service abstraction with an SMTP/provider
implementation\
**File storage:** MinIO using its S3-compatible object-storage API

------------------------------------------------------------------------

# 1. Project Definition

## 1.1 What are we building?

Notes & Document Manager is a web application where a registered user
can create and organize personal notes, search and filter them, change
their status, and attach files such as PDFs or images. An administrator
manages application users and shared categories.

The project is deliberately small. It should teach real development
concepts without becoming a full document collaboration or enterprise
workflow platform.

### Example scenario

A user registers and signs in. They create a category named
"Programming," then create a note titled "Learn EF Core." They add a
description, select the Programming category, and save the note as
Draft. Later they update the note, mark it Completed, and receive a
status notification while the application is open. They may attach a PDF
containing study material. The PDF is stored in MinIO while SQL Server
stores its metadata.

An Admin signs in separately, opens the admin dashboard, reviews
registered users, assigns or removes the User role where appropriate,
and manages shared categories. Admin does not automatically receive
permission to read every user's private notes.

## 1.2 Project goals

By completing the project, the learner should be able to:

1.  Model a small relational database.
2.  Use EF Core to query and update SQL Server.
3.  Build a server-rendered web UI using MVC and Razor.
4.  Validate input and handle errors.
5.  Implement registration, login, roles, and authorization with
    Identity.
6.  enforce ownership so users can access only their own notes.
7.  Design and test a REST API.
8.  Configure authentication for API clients.
9.  Send a SignalR notification to the intended user.
10. Send email through a replaceable service.
11. Upload and securely serve files using MinIO.
12. Write tests, log useful events, configure environments, and deploy
    the app.

## 1.3 What is intentionally excluded?

Do not implement these unless the core project is complete and you want
optional exercises:

-   Chat or messaging.
-   Multiple users editing one note collaboratively.
-   Public note sharing or complex sharing permissions.
-   Document version history.
-   Approval workflows.
-   Subscription plans, payment processing, or billing.
-   AI summaries or semantic search.
-   Mobile applications.
-   Microservices or event-bus infrastructure.
-   Multiple moderator/editor roles.
-   Complex rich-text editing.

These features add complexity but are not necessary for the learning
goals.

------------------------------------------------------------------------

# 2. Roles and Authorization Rules

There are exactly two application roles: **Admin** and **User**.

## 2.1 Admin

Admin can:

-   Access the Admin Dashboard.
-   View a paginated list of registered users and basic account
    information.
-   Assign or remove the User role where appropriate.
-   Create, edit, list, and delete shared categories.
-   View aggregate statistics such as user count, note count, and
    category count.
-   See administrative metadata needed to manage the application.

Admin does **not** automatically have permission to read all private
note content or download every user's attachments. This keeps the
privacy rule simple and demonstrates that roles and resource ownership
are different concepts.

## 2.2 User

User can:

-   Register, log in, and log out.
-   Access the User Dashboard.
-   Create, list, view, edit, and delete their own notes.
-   Search, sort, and filter their own notes.
-   Select a shared category.
-   Change a note's status.
-   Upload, list, download, and delete attachments belonging to their
    own notes.
-   View and edit allowed account details.

User cannot:

-   Open the Admin Dashboard.
-   Manage user accounts or roles.
-   Create, edit, or delete global categories.
-   Access another user's note by changing an ID.
-   Download another user's attachment by guessing an attachment ID or
    object key.

## 2.3 Three distinct security checks

-   **Authentication:** Is this request associated with a signed-in
    identity?
-   **Role authorization:** Does the identity have the role required for
    this action?
-   **Resource ownership:** Does the requested note belong to the
    current user?

For example, a signed-in User passes authentication but should fail
authorization when opening an Admin-only category-management page. The
same User should also be denied access to another User's note even
though both users have the User role.

Enforce ownership on the server in database queries or application
services. Hiding a button in a view is not an authorization mechanism.

## 2.4 Initial Admin setup

Do not allow the public registration form to accept an `Admin` role or
arbitrary role name. Create the initial Admin through a controlled
development seed or secure deployment procedure. Keep production
passwords and secrets outside source control. If a temporary bootstrap
password is used, require it to be changed and do not reuse it in
production.

------------------------------------------------------------------------

# 3. Feature Catalogue

This section describes what each feature does and the rules it must
follow.

## 3.1 Registration and sign-in

### Registration

A visitor provides the required account details and a password. The
server validates the input, checks that the account identifier is
available, and creates the account through ASP.NET Core Identity.

Expected behavior:

1.  Show a registration form.
2.  Validate required fields and password rules.
3.  Display validation errors safely.
4.  Create a User account by default.
5.  Never allow the visitor to select Admin.
6.  Redirect to a suitable page after successful registration.

Email confirmation can be added as a later extension. It is not required
before the basic Identity workflow is working.

### Login and logout

A registered user enters credentials. Identity verifies the credentials
and establishes the configured authentication session. Logout ends the
session.

Expected behavior:

-   Invalid credentials produce a generic, safe error message.
-   Protected pages redirect unauthenticated users to login where
    appropriate.
-   Logout is performed through a protected POST action, not a
    state-changing GET link.
-   Authentication cookies use appropriate security settings for the
    deployment environment.

### Password management

Identity manages password hashing and verification. Never store
plaintext passwords or implement your own password-hashing algorithm.
Password reset and change-password pages can be added after the core
account flow works.

## 3.2 Category management

Categories help users organize notes. Categories are shared globally and
managed by Admin.

Example categories:

-   Programming
-   Personal
-   Learning
-   Work Notes
-   Ideas

Admin can create, rename, list, and delete categories.

Rules:

-   Category name is required and has a maximum length.
-   Decide whether category names must be unique; if so, enforce it in
    the database as well as the UI.
-   Do not allow deletion to silently break existing notes. Either block
    deletion while notes reference the category, allow the category to
    be set to null, or require reassignment. Pick one behavior and
    document it.
-   Users can select a category but cannot modify the category list.

## 3.3 Note management

A note is the main entity of the application.

### Note fields

-   `NoteId`: unique identifier.
-   `Title`: required short title.
-   `Content`: note body.
-   `CategoryId`: optional category reference, depending on the chosen
    rule.
-   `UserId`: owner ID from Identity.
-   `Status`: one of the supported statuses.
-   `CreatedAt`: creation time.
-   `UpdatedAt`: last modification time.

### Create note

The user opens the create form, enters a title and content, optionally
selects a category, and submits it. The server validates the form and
sets `UserId` from the signed-in identity. The application must not
trust an owner ID sent by the browser.

After saving, redirect to the details page or notes list and show a
confirmation.

### View notes

The notes list shows only the current user's notes. Each row/card may
show title, category, status, and last-updated time. Avoid loading all
notes into memory for a large list; use server-side filtering and
pagination.

### View note details

The details page shows the full title, content, category, status,
creation/update timestamps, and attachment list. Before returning
details, verify the note belongs to the current user.

### Edit note

The user may update the title, content, category, or status. The server
loads the note using both the requested ID and the current user's ID,
validates changes, and saves them. The server controls the owner ID and
creation timestamp.

### Delete note

The user confirms deletion. The server verifies ownership and removes
the note. Decide how attachments are handled: delete their MinIO objects
and metadata, or use a controlled cleanup process. Avoid leaving
orphaned files indefinitely.

### Search, filter, sort, and paginate

-   **Search:** match title and optionally content.
-   **Filter by category:** show notes assigned to a chosen category.
-   **Filter by status:** show Draft, In Progress, or Completed notes.
-   **Sort:** title, created time, or updated time.
-   **Pagination:** return a limited page of results and navigation
    details.

Validate page number and page size. Set a maximum page size. Apply
filters and sorting in the database query before materializing results.

## 3.4 Note statuses

Use a small fixed set:

-   `Draft`
-   `InProgress`
-   `Completed`

You may implement this as a C# enum or another controlled
representation. Validate incoming values in MVC and API requests. A
client must not be able to persist arbitrary status text.

Changing a status is a normal database operation. SignalR is used only
to notify the intended user after the update has been saved.

## 3.5 User dashboard

The User Dashboard provides a short overview:

-   Total number of the user's notes.
-   Count of notes in each status.
-   Recently updated notes.
-   A shortcut to create a note.

Use aggregate queries such as counts rather than retrieving every note
just to count them.

## 3.6 Admin dashboard

The Admin Dashboard provides:

-   Total registered users.
-   Total notes in the system.
-   Total categories.
-   Links to user and category management.

These statistics do not require Admin to read private note bodies. The
user list should be paginated and should display only information needed
for administration.

## 3.7 Attachment management

Attachments are added only after the basic note application, Identity,
and API are stable.

Supported tutorial file types can be PDF and common image formats. Use
an allowlist and a conservative maximum file size.

Features:

-   Upload an attachment to a note the user owns.
-   Display attachment name, size, and upload time.
-   Download an attachment after checking ownership.
-   Delete an attachment after checking ownership.
-   Store file bytes in MinIO.
-   Store metadata and object key in SQL Server.

Attachment metadata fields:

-   `AttachmentId`
-   `NoteId`
-   `OriginalFileName`
-   `ObjectKey`
-   `ContentType`
-   `SizeInBytes`
-   `UploadedAt`

Security and reliability rules:

-   Generate a unique object key on the server.
-   Never use a supplied filename as the object key.
-   Do not expose a private MinIO bucket publicly.
-   Do not trust the browser's content type alone.
-   Verify the parent note's ownership before download or deletion.
-   Consider malware scanning in a real production environment.
-   A SQL transaction cannot roll back an upload to MinIO. Handle
    partial failure with cleanup or a recorded cleanup task.

## 3.8 Email notifications

Start with one email event, such as a welcome email after registration.
Optionally add a note-completed email later.

Implementation requirements:

-   Define an `IEmailService` interface.
-   Use dependency injection to provide the implementation.
-   Keep SMTP/provider details out of controllers and note business
    logic.
-   Store credentials in environment variables or a secret manager.
-   Log delivery failures without logging credentials or sensitive
    message content.
-   Use a development mail-capture tool or test inbox while learning.

In production, email delivery can be moved to a background queue with
retries so a slow email provider does not unnecessarily block the user's
request.

## 3.9 SignalR status notifications

SignalR is not a chat feature in this project. Its single responsibility
is to send live note-status notifications.

Example: the user changes "Learn EF Core" from In Progress to Completed.
The application saves the new status, then sends "Your note 'Learn EF
Core' is now Completed" to the intended user.

Rules:

-   Authenticate hub connections.
-   Do not broadcast private notifications to all connected clients.
-   Target the intended user using a trusted identity mapping.
-   Send only after the database save succeeds.
-   The database remains the source of truth; if the client is
    disconnected, the user can still retrieve the current status later.

## 3.10 Web API

The API exposes core note and category operations over HTTP. It should
use the same database and shared application logic as MVC rather than
implementing a second copy of the business rules.

The API uses DTOs for requests and responses. Avoid returning database
entities directly, particularly entities containing internal fields or
navigation properties.

The API must enforce authentication, role permissions, and ownership
independently of the MVC UI. Configure an appropriate API authentication
scheme. If bearer tokens/JWT are selected, configure and validate that
scheme explicitly; ASP.NET Core Identity does not automatically make
every API endpoint JWT-protected.

------------------------------------------------------------------------

# 4. Data Model and Relationships

Build only the entities required for the current phase.

## 4.1 Category

  Field          Type idea         Rules
  -------------- ----------------- -----------------------------
  `CategoryId`   Integer or GUID   Primary key
  `Name`         String            Required, length-limited
  `CreatedAt`    Date/time         Optional creation timestamp

A unique index on a normalized category name can prevent duplicate
categories if that is the desired business rule.

## 4.2 Note

  Field          Type idea                  Rules
  -------------- -------------------------- -------------------------------------
  `NoteId`       Integer or GUID            Primary key
  `Title`        String                     Required, length-limited
  `Content`      String                     Optional or required by chosen rule
  `CategoryId`   Nullable FK                References Category
  `UserId`       Identity key type          Owner; set by server
  `Status`       Enum or controlled value   Must be valid
  `CreatedAt`    Date/time                  Set by server
  `UpdatedAt`    Date/time                  Updated by server

Relationships:

-   One Category can be associated with many Notes.
-   One Identity User can own many Notes.
-   Each Note belongs to exactly one User.
-   A Note can have zero or one Category if `CategoryId` is nullable.

The default Identity user key is commonly a string, but it can be
customized. Match the Note's `UserId` type to the configured Identity
key type.

## 4.3 Attachment

  Field                Type idea         Rules
  -------------------- ----------------- ---------------------------------
  `AttachmentId`       Integer or GUID   Primary key
  `NoteId`             FK                Parent note
  `OriginalFileName`   String            Display name only
  `ObjectKey`          String            Unique MinIO object key
  `ContentType`        String            Validated/expected content type
  `SizeInBytes`        Long integer      Must be within allowed limit
  `UploadedAt`         Date/time         Set by server

Attachment ownership is derived through the parent Note. Verify that
relationship before accessing the stored object.

## 4.4 Identity tables

Let ASP.NET Core Identity manage users, password hashes, roles,
user-role assignments, claims, and related authentication tables. Do not
create a custom password table.

## 4.5 Relationship diagram

``` text
Identity User 1 ──────── * Note * ──────── 0..1 Category
                         |
                         | 1
                         |
                         * Attachment

Admin/User roles are managed through ASP.NET Core Identity.
```

------------------------------------------------------------------------

# 5. Phase-by-Phase Learning and Implementation Plan

## Phase 0 --- C# and .NET foundations

### Purpose

Learn the C# features that will appear throughout the application before
starting web development.

### Topics to study

-   Classes, objects, properties, constructors, access modifiers.
-   Encapsulation and basic object-oriented design.
-   Interfaces and implementations.
-   Inheritance and polymorphism at a practical level.
-   Collections and generics.
-   Enums and nullable types.
-   Exception handling.
-   LINQ: `Where`, `Select`, `OrderBy`, `GroupBy`, `Any`,
    `FirstOrDefault`.
-   Async/await, `Task`, and cancellation-token concepts.
-   Dependency injection concepts.
-   NuGet packages and project files.
-   Configuration and environment-specific settings.
-   Basic Git workflow.

### Apply them to this project

Create plain C# classes representing a Note and Category. Use a
collection to store sample notes temporarily. Write methods to add a
note, find a note, filter by status, and group notes by category. Use an
enum for status and an interface for a simple repository abstraction as
a learning exercise.

This is only a console exercise. Do not build a second console
application into the final product.

### Tasks

1.  Create the solution and a console practice project.
2.  Define Note and Category classes.
3.  Create sample data.
4.  Implement search and filter methods using LINQ.
5.  Handle invalid input and exceptions.
6.  Practice async concepts with a small asynchronous example.
7.  Commit the work to Git.

### Completion checkpoint

You can explain each class and method, use LINQ to query collections,
and understand why interfaces, async methods, and dependency injection
are useful.

------------------------------------------------------------------------

## Phase 1 --- Entity Framework Core and SQL Server

### Purpose

Build and verify the database layer before adding web pages or user
authentication.

### Topics to study

-   Relational database fundamentals.
-   Entities, `DbContext`, and `DbSet<T>`.
-   SQL Server provider and connection configuration.
-   Migrations: create, inspect, apply, and plan schema changes.
-   Primary keys, foreign keys, required fields, maximum lengths.
-   Indexes and unique constraints.
-   One-to-many relationships.
-   Fluent API versus data annotations.
-   CRUD operations.
-   LINQ-to-Entities query translation.
-   Filtering, projection, sorting, grouping, and aggregation.
-   Async methods such as `ToListAsync`, `AnyAsync`, `CountAsync`, and
    `FirstOrDefaultAsync`.
-   Change tracking and `AsNoTracking`.
-   Eager loading with `Include`.
-   Pagination with `Skip` and `Take`.
-   `SaveChangesAsync`.
-   Basic transactions and concurrency concepts.
-   Avoiding N+1 queries and unnecessary data loading.
-   Seed data for development.

### Project implementation

Start with `Category` and `Note`. Do not add Identity or attachments
yet.

1.  Create the entities.
2.  Create `ApplicationDbContext`.
3.  Configure the SQL Server provider.
4.  Define primary keys and the Category-to-Note relationship.
5.  Configure required fields and string lengths.
6.  Create the first migration.
7.  Apply it to a development database.
8.  Insert development categories and sample notes.
9.  Implement CRUD operations.
10. Add filtering by category and status.
11. Add title search and sorting.
12. Add pagination.
13. Create dashboard aggregate queries.
14. Inspect generated SQL where useful.

### Data rules to implement

-   A title is required.
-   A title has a maximum length.
-   A category name is required.
-   A note's category must reference an existing category if supplied.
-   A note's status must be valid.
-   Creation and update timestamps are set by application logic.
-   Add database constraints for rules that should remain true even if
    data is written through another path.

### What not to build yet

Do not add MVC, Identity, API authentication, SignalR, email, or MinIO.
For this phase, use development data and a simple owner identifier only
if needed for the model exercise.

### Completion checkpoint

You can create, query, update, and delete notes and categories through
EF Core. Search, filters, sorting, pagination, and dashboard counts work
without retrieving the entire table into memory. You understand how
migrations change the database.

------------------------------------------------------------------------

## Phase 2 --- ASP.NET Core MVC

### Purpose

Turn the EF Core data layer into a usable browser-based application.

### Topics to study

-   ASP.NET Core application startup.
-   Service registration and dependency injection.
-   Middleware pipeline and request processing.
-   Routing, controllers, actions, and action results.
-   Model binding and validation.
-   Razor syntax and views.
-   Layouts, partial views, and tag helpers.
-   ViewModels and form models.
-   Configuration, logging, and environment settings.
-   Static files and basic page layout.
-   POST/Redirect/GET pattern.
-   Anti-forgery tokens for form posts.
-   Exception handling and error pages.
-   Filters and action results.
-   Search, sorting, and pagination in MVC.

### Pages to implement

#### Notes List

Shows the current development user's notes, title, category, status, and
update time. Includes search, status/category filters, sorting, and
pagination.

#### Create Note

Shows a form for title, content, category, and status. Server-side
validation is required. The category options come from the database.

#### Note Details

Shows all note fields and later the attachment list. It includes Edit
and Delete actions only where appropriate.

#### Edit Note

Loads the existing note, pre-populates the form, validates changes, and
saves the update.

#### Delete Note

Shows a confirmation page before deleting. Use POST for the
state-changing operation.

#### Category pages

Provide a list and create/edit/delete forms for the shared category
list. In this phase, these pages are for development only; Admin
authorization is added in Phase 3.

#### Dashboard

Displays total notes, status counts, and recently updated notes.

### Implementation tasks

1.  Register `ApplicationDbContext` and the required services in
    dependency injection.
2.  Create controllers for notes and categories.
3.  Create ViewModels for forms.
4.  Create Razor views and shared layout.
5.  Add validation messages and safe error handling.
6.  Add query-string-based search and filters.
7.  Add pagination links that preserve filter settings.
8.  Add logging for unexpected failures.
9.  Test invalid form input and missing note IDs.
10. Ensure state-changing forms use appropriate POST actions and
    anti-forgery protection.

### Important security note

Before Identity is added, the application is a development learning
build. Do not expose it as a public multi-user service. Ownership
enforcement becomes a required security boundary in Phase 3.

### Completion checkpoint

The core application works in a browser. A developer can create and
manage categories and notes, search and filter them, and see validation
errors. The UI does not need to be visually elaborate.

------------------------------------------------------------------------

## Phase 3 --- ASP.NET Core Identity, Roles, and Ownership

### Purpose

Add real accounts and enforce the two-role security model.

### Topics to study

-   Identity user model and Identity database schema.
-   Registration, login, and logout.
-   Password hashing and password policy.
-   Cookie authentication.
-   Role creation and assignment.
-   Safe initial Admin creation.
-   `[Authorize]` and `[AllowAnonymous]`.
-   Role-based authorization.
-   Claims and current-user lookup.
-   Access-denied behavior.
-   Resource ownership checks.
-   Secure account and role-management actions.
-   Optional email confirmation and password reset.

### Implementation tasks

1.  Integrate Identity with the existing SQL Server database.
2.  Configure Identity services and authentication middleware.
3.  Add registration, login, and logout pages.
4.  Configure the account creation flow to assign `User` by default.
5.  Seed `Admin` and `User` roles safely.
6.  Create the initial Admin through a controlled process.
7.  Add an Admin Dashboard.
8.  Protect admin routes with role authorization.
9.  Add a paginated user list.
10. Allow Admin to assign/remove the User role, while preventing
    accidental removal of the last usable Admin account if role
    management is implemented.
11. Add category-management authorization for Admin.
12. Assign note ownership from the signed-in principal.
13. Scope note queries to the current user's ID.
14. Verify ownership for details, edit, delete, and status-change
    operations.
15. Add access-denied and unauthorized handling.

### Ownership implementation rule

Do not load a note using only `NoteId` for a user-facing operation.
Query by both the note ID and the current user's ID, or load the
resource and explicitly verify ownership before proceeding. Apply this
consistently to MVC, API, SignalR-triggered actions, and attachment
operations.

### Security test cases

-   A logged-out visitor cannot access protected note pages.
-   A User cannot open the Admin Dashboard.
-   A User cannot manage categories.
-   A User cannot edit another user's note by changing the URL ID.
-   A User cannot delete another user's note.
-   A User cannot submit a different `UserId` in a form to change
    ownership.
-   Public registration cannot create an Admin.
-   Admin role changes require an Admin-authorized operation.

### Completion checkpoint

Two users can sign in independently. Each sees only their own notes.
Admin can manage users and categories within the defined scope. All
access checks happen on the server, not just in the UI.

------------------------------------------------------------------------

## Phase 4 --- ASP.NET Core Web API

### Purpose

Expose the same core note functionality through HTTP endpoints so it can
be tested by Swagger or an API client and later used by a separate
frontend.

### Topics to study

-   REST resource design.
-   HTTP methods and status codes.
-   Route and query parameters.
-   Request and response DTOs.
-   JSON serialization.
-   Model validation.
-   Error response consistency.
-   Dependency injection and shared application logic.
-   Async endpoints and cancellation tokens.
-   Filtering, sorting, and pagination.
-   Swagger/OpenAPI.
-   API authentication and authorization.
-   Bearer-token authentication/JWT if selected for API clients.
-   CORS only when a separate browser origin requires it.
-   Optional rate limiting and API versioning.

### Suggested endpoints

  ------------------------------------------------------------------------------
  Method            Endpoint                 Access            Purpose
  ----------------- ------------------------ ----------------- -----------------
  `GET`             `/api/notes`             Signed-in User    List own notes
                                                               with filters

  `GET`             `/api/notes/{id}`        Owner             Retrieve one
                                                               owned note

  `POST`            `/api/notes`             Signed-in User    Create a note for
                                                               current user

  `PUT`             `/api/notes/{id}`        Owner             Update an owned
                                                               note

  `DELETE`          `/api/notes/{id}`        Owner             Delete an owned
                                                               note

  `GET`             `/api/categories`        Signed-in User or List categories
                                             public, by design 

  `POST`            `/api/categories`        Admin             Create a category

  `PUT`             `/api/categories/{id}`   Admin             Update a category

  `DELETE`          `/api/categories/{id}`   Admin             Delete a category
  ------------------------------------------------------------------------------

Add status and attachment endpoints only when their phases are
implemented.

### Request and response design

Use DTOs such as `CreateNoteRequest`, `UpdateNoteRequest`, and
`NoteResponse`. Do not accept `UserId` as a trusted field in
create/update requests. Derive the owner from the authenticated
principal. Validate category IDs and status values server-side.

### Status codes to practice

-   `200 OK`: successful read or update returning data.
-   `201 Created`: resource created.
-   `204 No Content`: successful operation with no response body.
-   `400 Bad Request`: invalid request.
-   `401 Unauthorized`: authentication is missing or invalid.
-   `403 Forbidden`: authenticated identity is not allowed.
-   `404 Not Found`: resource does not exist or is intentionally not
    disclosed to the caller.
-   `409 Conflict`: a genuine state conflict, if relevant.
-   `500 Internal Server Error`: unexpected server error; do not return
    stack traces to clients.

### Authentication design

MVC commonly uses cookie authentication. A separate API client may use
bearer-token authentication. Choose and configure the API authentication
scheme deliberately. Do not assume that adding Identity automatically
configures JWT bearer authentication. Test API authentication separately
from MVC cookies.

### Completion checkpoint

The API supports note CRUD and category reads/administration, returns
appropriate status codes, validates DTOs, and enforces both role
permissions and ownership. API testing does not depend on navigating MVC
pages.

------------------------------------------------------------------------

## Phase 5 --- SignalR for Status Notifications

### Purpose

Learn real-time server-to-client communication through one narrowly
scoped feature.

### Topics to study

-   SignalR hubs and connection lifecycle.
-   Registering and mapping a hub.
-   Client connection setup.
-   Sending server-to-client messages.
-   Hub authentication and authorization.
-   Targeting the correct user.
-   Disconnect and reconnect behavior.
-   Database-save ordering and failure handling.

### Implementation tasks

1.  Create a `NoteStatusHub`.
2.  Register SignalR and map the hub endpoint.
3.  Require authenticated connections.
4.  Configure a trusted mapping from the authenticated user to their
    SignalR user identity.
5.  Add a status-change operation.
6.  Validate the new status and verify note ownership.
7.  Save the status to SQL Server.
8.  Only after the save succeeds, send a notification to the owner.
9.  Add a small browser client that listens for the event.
10. Test with two signed-in users and verify that one user's event is
    not shown to the other.

### Notification example

`Your note "Learn EF Core" is now Completed.`

Do not send the entire note body in the notification. If delivery fails
because the client is offline, the saved status remains available
through normal note queries.

### Completion checkpoint

A status change is persisted first, then a live notification is sent
only to the intended user. There is no chat or collaborative editing.

------------------------------------------------------------------------

## Phase 6 --- Email Service

### Purpose

Learn how to integrate an external service without tying business logic
to one provider.

### Topics to study

-   Interfaces and dependency injection.
-   `IEmailService` abstraction.
-   SMTP or provider API.
-   HTML email templates.
-   Configuration and secret storage.
-   Error handling and logging.
-   Async I/O.
-   Optional background queue and retries.

### Implementation tasks

1.  Define an email request model with recipient, subject, and
    body/template data.
2.  Define `IEmailService`.
3.  Implement a development email sender or provider adapter.
4.  Register the service through dependency injection.
5.  Create a simple welcome email template.
6.  Trigger the email after successful registration or another clearly
    defined event.
7.  Handle delivery failure without exposing secrets.
8.  Test with a mail-capture tool or test inbox.

### Design rule

Controllers should not contain provider-specific SMTP code. They should
call an application-level service. Keep email credentials out of
`appsettings.json` committed to source control. For a production
application, consider a background job/queue and retry strategy.

### Completion checkpoint

A business event can trigger an email through an injectable service. The
provider can be changed without rewriting note-management logic.

------------------------------------------------------------------------

## Phase 7 --- MinIO Attachment Storage

### Purpose

Learn object storage and secure file access without storing file bytes
directly in SQL Server.

### Topics to study

-   Object storage concepts: bucket, object, object key, metadata.
-   MinIO and S3-compatible client configuration.
-   Private buckets.
-   Uploading and streaming files.
-   File size and type validation.
-   Unique object keys.
-   SQL metadata versus object storage.
-   Authorization before download and deletion.
-   Partial failures and cleanup.
-   Optional short-lived pre-signed URLs.

### Implementation tasks

1.  Run MinIO in a development environment.
2.  Create a private bucket.
3.  Configure endpoint, bucket name, and credentials through environment
    settings.
4.  Add the `Attachment` entity and migration.
5.  Create an attachment service abstraction if it helps keep storage
    code separate.
6.  Validate the uploaded file's size and allowed extension/type.
7.  Generate a unique object key on the server.
8.  Upload the file bytes to MinIO.
9.  Save metadata in SQL Server.
10. Display the attachment list on the owning note's details page.
11. Add an authorized download endpoint.
12. Add an authorized deletion endpoint.
13. Test that another user cannot download or delete the attachment.
14. Handle the case where storage succeeds but metadata persistence
    fails.

### Storage responsibilities

-   **MinIO:** actual file bytes.
-   **SQL Server:** attachment ID, parent note, original display name,
    object key, content type, size, upload timestamp.

The original filename is for display only. The generated object key is
used to locate the object. Do not expose the bucket publicly. A
pre-signed URL can be an optional later exercise, but only generate
short-lived URLs after authorization.

### Completion checkpoint

A User can upload and download a supported file attached to their own
note. File bytes are in MinIO, metadata is in SQL Server, and every
download is authorized.

------------------------------------------------------------------------

## Phase 8 --- Testing, Logging, and Deployment

### Purpose

Make the application verifiable, diagnosable, and reproducible outside
the developer's machine.

### Topics to study

-   Unit tests for validation and business rules.
-   Integration tests for controllers/endpoints and database behavior.
-   Testing authorization boundaries.
-   Test data setup and cleanup.
-   Logging and structured diagnostic information.
-   Exception handling and safe error responses.
-   Environment-specific configuration.
-   Secrets management.
-   Database migration/deployment strategy.
-   Health checks.
-   Optional basic rate limiting and caching.
-   Deployment to a test environment.

### Essential tests

#### Notes

-   Create a valid note.
-   Reject an invalid title or status.
-   Search and filters return the expected records.
-   Pagination respects the configured maximum page size.
-   Updating a note changes its update timestamp.

#### Roles and ownership

-   Logged-out visitors cannot access protected pages.
-   User cannot manage categories.
-   User cannot access Admin pages.
-   User A cannot read, edit, or delete User B's note.
-   User A cannot download User B's attachment.
-   Public registration cannot grant Admin.
-   API endpoints enforce the same boundaries as MVC.

#### Integrations

-   SignalR status notifications target the correct user.
-   Email failure does not expose secrets or corrupt the note record.
-   MinIO upload and download work for valid files.
-   Invalid file types and oversized files are rejected.
-   Storage/metadata partial failure is handled.

### Deployment tasks

1.  Store environment-specific settings outside source control.
2.  Use secure production secrets for SQL Server, email, and MinIO.
3.  Apply database migrations through a controlled deployment process.
4.  Configure HTTPS and secure authentication cookies.
5.  Configure MinIO networking and private bucket access.
6.  Verify logs and health checks.
7.  Run smoke tests after deployment.

### Completion checkpoint

The application can be configured and deployed to a test environment
without hard-coded secrets. Core flows and authorization boundaries are
covered by tests.

------------------------------------------------------------------------

# 6. Suggested Project Structure

Start with one ASP.NET Core web project and one test project. Do not
introduce a large multi-project architecture before it is useful.

``` text
NotesDocumentManager/
├── NotesDocumentManager.sln
├── NotesDocumentManager.Web/
│   ├── Controllers/
│   ├── Views/
│   ├── Models/
│   │   ├── Note.cs
│   │   ├── Category.cs
│   │   └── Attachment.cs
│   ├── ViewModels/
│   ├── Dtos/
│   ├── Data/
│   │   └── ApplicationDbContext.cs
│   ├── Services/
│   ├── Hubs/
│   ├── wwwroot/
│   ├── Program.cs
│   └── appsettings.json
└── NotesDocumentManager.Tests/
```

The API can initially live in the same ASP.NET Core application. A
separate API project is optional. If the API is separated later, share
the data/business layer rather than duplicating business logic.

Possible service abstractions added as they become useful:

-   `INoteService` for reusable note operations.
-   `IEmailService` for email sending.
-   `IFileStorageService` for MinIO operations.

Do not create interfaces for every class automatically. Add abstractions
where they support reuse, testing, or separation of external
integrations.

------------------------------------------------------------------------

# 7. Suggested Pages and Navigation

## Public pages

-   Register.
-   Login.
-   Access Denied.
-   Optional Forgot Password / Reset Password.

## User pages

-   Dashboard.
-   My Notes.
-   Create Note.
-   Note Details.
-   Edit Note.
-   Delete Confirmation.
-   Attachment upload/list/download.
-   Account management.

## Admin pages

-   Admin Dashboard.
-   User List.
-   User Details.
-   Role management for permitted roles.
-   Category List.
-   Create Category.
-   Edit Category.

Keep the visual design simple. The goal is to learn the .NET stack and
secure application behavior, not to build a complex design system.

------------------------------------------------------------------------

# 8. Milestone Checklist

## Milestone 1 --- EF Core

-   [ ] Create the solution and configure SQL Server.
-   [ ] Create Category and Note entities.
-   [ ] Configure relationships and constraints.
-   [ ] Create and apply migrations.
-   [ ] Implement CRUD operations.
-   [ ] Add search, filters, sorting, grouping, and pagination.
-   [ ] Implement aggregate dashboard queries.
-   [ ] Verify query behavior and avoid unnecessary data loading.

**Checkpoint:** EF Core can manage notes and categories reliably.

## Milestone 2 --- MVC

-   [ ] Build list, details, create, edit, and delete pages.
-   [ ] Add validation and error display.
-   [ ] Add search, filters, sorting, and pagination.
-   [ ] Add dashboards and category pages.
-   [ ] Add logging and safe error handling.

**Checkpoint:** the application works in a browser.

## Milestone 3 --- Identity

-   [ ] Integrate Identity.
-   [ ] Add registration, login, and logout.
-   [ ] Seed Admin/User roles safely.
-   [ ] Create the initial Admin securely.
-   [ ] Protect Admin pages.
-   [ ] Enforce note ownership in every operation.
-   [ ] Test role restrictions and ID tampering.

**Checkpoint:** users cannot access each other's notes.

## Milestone 4 --- Web API

-   [ ] Add request/response DTOs.
-   [ ] Implement note endpoints.
-   [ ] Implement category endpoints.
-   [ ] Add validation, status codes, filtering, and pagination.
-   [ ] Configure API authentication and authorization.
-   [ ] Test through Swagger or an API client.

**Checkpoint:** the API independently enforces the same rules as MVC.

## Milestone 5 --- SignalR

-   [ ] Add a hub and map its endpoint.
-   [ ] Authenticate hub connections.
-   [ ] Notify after successful status changes.
-   [ ] Test that only the intended user receives the notification.

## Milestone 6 --- Email

-   [ ] Define `IEmailService`.
-   [ ] Configure a development provider.
-   [ ] Create a template.
-   [ ] Trigger one notification event.
-   [ ] Test delivery failure handling.

## Milestone 7 --- MinIO

-   [ ] Configure a private bucket.
-   [ ] Validate and upload files.
-   [ ] Save metadata in SQL Server.
-   [ ] Secure download and deletion.
-   [ ] Test invalid files and partial failures.

## Milestone 8 --- Testing and deployment

-   [ ] Add unit tests.
-   [ ] Add integration tests.
-   [ ] Test role and ownership boundaries.
-   [ ] Configure environment-specific settings.
-   [ ] Remove secrets from source control.
-   [ ] Deploy to a test environment and run smoke tests.

------------------------------------------------------------------------

# 9. Final Acceptance Criteria

The project is complete when:

1.  Admin and User can authenticate.
2.  Public registration cannot grant Admin privileges.
3.  Admin can manage users and shared categories within the defined
    scope.
4.  Users can create, view, edit, and delete only their own notes.
5.  Search, filtering, sorting, and pagination work correctly.
6.  MVC forms validate input and handle errors safely.
7.  API endpoints use DTOs and return appropriate HTTP status codes.
8.  MVC and API both enforce role authorization and ownership.
9.  SignalR notifications are delivered only to the intended user.
10. The configured email notification can be sent.
11. File bytes are stored in MinIO and metadata in SQL Server.
12. Every attachment download/delete verifies ownership.
13. Important business rules and authorization boundaries are tested.
14. Secrets are not committed to source control.
15. Deployment and configuration steps are documented.

------------------------------------------------------------------------

# 10. Learning Strategy and Final Order

Follow this exact sequence:

1.  **C# and .NET fundamentals**
2.  **Entity Framework Core and SQL Server**
3.  **ASP.NET Core MVC**
4.  **ASP.NET Core Identity: Admin/User roles and ownership**
5.  **ASP.NET Core Web API and API authentication**
6.  **SignalR for note-status notifications**
7.  **Email service**
8.  **MinIO file storage**
9.  **Testing, logging, and deployment**

Complete and verify each phase before starting the next. Do not add
SignalR, email, or MinIO while learning basic EF Core. Keep the first
working version small, then extend it one technology at a time.

**Core design principle:** MVC and Web API should share the same
database and business rules. Identity handles accounts and roles; SQL
Server stores application data and file metadata; MinIO stores file
bytes; SignalR delivers status notifications; and the email service
handles outbound email.
