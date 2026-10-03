# FanzCreative React + Vite

This is the React/Vite conversion of the original static HTML template.

## Run

```bash
npm install
npm run dev
```

The shared navbar lives in `src/components/Navbar.jsx`, so every page uses the same navigation.

## Content Admin

### SMTP Contact And Password Resets

Both contact forms submit to `/api/contact`; success is shown only after SMTP accepts
the message and Firestore records confirmation. Attach up to two PDF/JPG/PNG/WebP
files, totalling at most 2 MB. File signatures, input sizes, same-origin requests,
honeypots, per-IP cooldown/hourly limits and persistent retry IDs are checked on the
server. Visitors cannot set the destination or sender; their email becomes Reply-To.
Messages and attachment metadata (not file contents) are stored in private
`mailDeliveries`. `mailRateLimits` stores hashed identifiers, not raw IP addresses.
Enable Firestore TTL on `expiresAt` for both collections (7 days / 1 day). TTL must
be enabled in Firebase; merely including the field does not delete expired records.

Users > Password reset > Send reset email sends a Firebase-generated HTTPS reset
link via the same SMTP account. Manual link generation/copy remains available.
Reset requests require a currently active admin and an active recipient account;
they are rate-limited per recipient. Passwords are never included in reset emails.
Blog previews disable the contact form to avoid accidental real submissions.

Add these **server-only** variables to Vercel Production (and Preview if used):
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_FROM_EMAIL`, `CONTACT_TO_EMAIL`. The verified current Namecheap cPanel host
is `premium130-4.web-hosting.com`, port `465`, secure `true`. Actual credentials are
in ignored local env files, never source code or `VITE_` variables. An optional
`MAIL_RATE_LIMIT_SECRET` can replace the existing Cloudinary secret for IP hashing.
Redeploy after setting variables and publish the updated `firestore.rules`.

`npm run test:mail` tests both forms locally with intercepted mail responses; no
real email is sent. With the local server on port 5180,
`npm run test:mail -- <existing-admin-email> --live` additionally sends one contact
test and one reset email to `CONTACT_TO_EMAIL`. It creates a temporary Firebase
account only if that address is not already a user, never changes an existing
password, and removes its own test account and delivery/rate records. SMTP
acceptance is not proof of inbox delivery; check the recipient mailbox/spam folder.

The public site remains React + Vite on Vercel. Firebase Authentication controls `/admin`,
Firestore stores blog and project records, and Cloudinary stores uploaded images. The
Vercel functions in `api/` sign admin uploads and serve published content without
shipping the Firebase SDK to public pages.

### Media Library And Users

`/admin/media` lists the existing images under Cloudinary's `fanzcreative/` root,
including blog, project and built-in site assets. Folder filters, server-side search,
60-image batches, bulk image upload, full previews, dimensions, original-image links
and copying URLs are available. Uploaded filenames are stored as signed contextual
metadata. Images referenced by the built-in media map or any saved blog/project
(including drafts and archived entries) cannot be deleted through the library.
Deletion checks current saved references; unsaved editor selections are not references.
Keep the current filter in mind: library uploads are stored in Site assets.

The cover, all three project-gallery slots and article image blocks can reuse library
images. Covers/gallery images with a different aspect ratio open the existing crop
panel; cropping creates a new image and leaves the original intact. Inline images
keep their original dimensions and do not require cropping.

`/admin/users` manages Firebase Authentication accounts: create users/admins, edit
name/email and roles, disable/re-enable accounts, generate password-reset links, and
permanently delete other accounts. Initial passwords require 12-128 characters and
are not saved in Firestore or returned by the API. Password resets can be emailed
through the server's SMTP account or generated as a link for manual sharing.
Generating a link alone does not send an email. Disabled accounts and removed admin roles
are checked on every authenticated API request, including already-issued tokens.
An administrator cannot delete, disable or demote their own account; the last active
admin is protected. Account changes use a Firestore lock across serverless instances.
Deleted accounts do not delete articles/projects.

Both sections use the existing Firebase/Cloudinary environment variables. Redeploy
Vercel to include `/api/admin-media` and `/api/admin-users`, and **publish the updated
`firestore.rules` to Firebase**. Direct content writes and private reads are now
server-only, preventing an older browser admin token from bypassing role removal.
The `_adminOperations` lock collection is also denied to browser clients. Node
serverless packaging explicitly includes the built-in media map for usage checks.

With a local server at `http://127.0.0.1:5180`, run
`npm run test:admin-tools -- <existing-admin-email>`. The real browser/API check uses
only temporary QA accounts, a draft and generated test uploads; it verifies upload,
library reuse/crop, authentication, reset links, role revocation, disabled sessions,
deletion protection, mobile dialogs and cleanup. Set `ADMIN_TEST_URL` for another
local port. This check currently requires a local Vite server for its isolated
secondary-account login/reset SDK calls. Unit tests cover validation, credential
privacy, access safeguards, account locking and image usage detection.
The admin UI check also uses simulated 125-user/65-image lists to verify pagination,
global media search, empty/error states, duplicate-email handling, retained edits
after failed saves, library selection in inline images/all gallery slots, and
320px/mobile layouts. These fixtures are intercepted in the test browser and are
never added to Firebase or Cloudinary.

1. In Firebase Authentication, enable Email/Password, create the intended admin user,
   and add `fanzcreative-nine.vercel.app` and any custom production domains as authorized domains.
2. Configure the Vercel project with `FIREBASE_SERVICE_ACCOUNT_JSON` (the complete
   service-account JSON), `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET`. Use a newly rotated Cloudinary secret. Never prefix these
   server-only values with `VITE_` or commit the service-account JSON.
   Also set the six public `VITE_FIREBASE_*` variables listed in `.env.example`
   using the Firebase web app configuration. These are included in the browser build,
   so they must never contain server secrets. Configure Production (and Preview if used)
   before deploying, and redeploy after changing their values.
3. Deploy `firestore.rules` with `firebase deploy --only firestore:rules --project fanzcreative-1bf9e`.
4. Grant the existing Auth user admin access once with
   `node scripts/grant-admin.mjs <admin-email>` while `FIREBASE_SERVICE_ACCOUNT_JSON`
   is set in the shell. Alternatively, set `GOOGLE_APPLICATION_CREDENTIALS` to the
   absolute path of a local service-account JSON file (for example,
   `firebase-service-account.json`, which is gitignored). Never share that file or
   commit it. Sign out and back in to refresh the admin claim.
5. Run `node scripts/seed-content.mjs --dry-run` to inspect the 6 blogs and 4 projects
   that will be imported. Then run `node scripts/seed-content.mjs` with the service
   account environment variable set. Existing Firestore documents are never overwritten.
6. Deploy the site to Vercel. Visit `/admin` to manage drafts and published content.

The Firebase web config in `src/lib/firebase.js` comes from `VITE_FIREBASE_*`
environment variables and is public by design. Auth tokens and
Firestore rules, not that config, enforce access. Existing hard-coded blog/project
entries remain as fallbacks until they are migrated to Firestore. Archiving a managed
entry removes it from the public site without exposing its draft content. Newly published
entries refresh on open public pages after admin saves and also refresh again when the
visitor focuses the page.

For local checks, create a gitignored `.env.local` with the public Firebase configuration
and the server-only values above. Restart the dev server after changing configuration,
then run:

```bash
npm test
npm run lint
npm run build
npm run test:admin -- <admin-email>
```

The browser admin check creates temporary QA blog/project records, verifies image
crop/upload, publish, archive/restore, public-page links, and then removes its own
test records and uploaded test images.

The admin, block editor, comments, quote options, preview, slug, and UI browser
checks also support deployed sites. Set `ADMIN_TEST_URL` to the deployed origin
and supply `ADMIN_TEST_PASSWORD` only in the test process environment. Deployed
checks use the actual email/password login form; localhost checks use custom tokens.
Never commit the test password or put it in a `VITE_` variable. The local Firebase
service account and Cloudinary credentials must point to the same deployed project
so temporary records and uploaded test media can be cleaned up.

For the 100-item layout check, set `LAYOUT_TEST_URL` instead. This check and the
UI/slug/preview fixture checks use intercepted API fixtures, not 100 real database
records. Core admin, block editor, comments, and quote checks do write temporary
QA records, and may briefly publish them, before removing only their own test data.

### Serverless Runtime Compatibility

The scoped `jwks-rsa > jose` override keeps Firebase Admin's key loader compatible
with serverless runtimes that cannot use CommonJS `require()` on ESM-only modules.
`jose` 5.10.0 provides both CommonJS and ESM exports; Firebase Admin and `jwks-rsa`
remain on their existing versions. Keep this override until the upstream loading
issue is resolved: https://github.com/auth0/node-jwks-rsa/issues/507.

`npm test` checks all API imports and authentication/method guards with Node's
`require(esm)` support disabled, plus RSA/EC signing-key conversion and signature
verification. Commit both `package.json` and `package-lock.json` when deploying
this fix so Vercel installs the same compatible dependency tree.

## Content Layout

The blog lists the latest 12 articles and adds 12 more per Load More click. Projects
also start with 12 and support combined industry, service and type filters in both
list and grid view. Filtering resets the visible count to 12. Only visible cards
are rendered; their images remain lazy loaded. Listing APIs currently fetch the
content metadata in one request, rather than fetching each 12-record batch.

In the project editor, enable **Featured on home** to select a project. Both home
project sections use the same selection, showing up to four published projects.
**Sort order** accepts a whole number from 0 to 999999; lower numbers come first,
with newer publication dates breaking ties. The projects listing puts featured
projects first. New projects start unfeatured. Existing records without this field
retain their previous home eligibility until explicitly changed in the editor.
Archiving or drafting a project removes it from the public selection.

Blog categories remain editable. Projects have separate industry, services
(comma-separated), and project type fields. Older projects derive their services
from deliverables until services are set explicitly. Admin lists show 20 items per
page and search/status filters apply across the complete library.

With a local server on port 5180, run `node scripts/check-content-layout.mjs` to
verify 100-record public layouts using mocked content. Add an existing admin email
as the argument to also check authenticated editor controls. This test signs into
the existing admin account but keeps all content writes in mocked APIs.

## Dummy Content for Manual Review

With Firebase server credentials in `.env.local`, run `npm run demo:add` to publish
20 dummy blogs and 20 dummy projects, including four featured projects. These reuse
existing Cloudinary images and include complete article/project content, project
gallery images, and varied filter values. Titles start with `Dummy`.

Run `npm run demo:status` to count the demo records. After reviewing the layout,
run `npm run demo:delete -- --dry-run` to preview cleanup and `npm run demo:delete`
to remove this batch. Cleanup requires both the exact generated document ID and
matching ownership markers. It never deletes shared images or other records.
Running add again keeps existing demo records and their edits without duplicating
or overwriting them. Refresh the site or the admin list after running either command.

## Article Blocks and Editable URLs

The blog editor supports paragraph, H2/H3/H4 heading, image, list, quote and divider
blocks. Use the plus button between blocks to insert content at that position.
Blocks can be moved, duplicated or removed. Preview opens the complete public
article layout, including navigation, sidebar, contact section and footer, with
desktop/tablet/mobile controls. It renders the current unsaved editor values without
saving or publishing. Draft content is transferred only to the editor's same-origin
preview frame, remains in memory, and is not exposed by the public content API.
Preview URLs are not shareable and preview forms cannot submit enquiries.
Images inside articles retain their original
ratio, with optional alt text and captions; cover/gallery crop requirements stay
separate. Old text-only articles become blocks when opened and saved in the editor.
An empty image block can be saved in a draft but must be filled or removed before
publication. The cover image remains optional.

Both blog and project slugs can be edited. Save moves the complete record in a
Firestore transaction and retains old URLs as redirect aliases. The React site
replaces the browser URL with the current slug when an old link is visited. These
are client-side redirects, not HTTP 301 responses. Aliases stay out of public and
admin listings, reserve their previous slugs, and stop serving content if the
current item is drafted or archived. Renaming back to a previous slug is supported.
Existing image URLs continue working without moving Cloudinary files.

New articles and projects generate a slug from the title until the slug is manually
edited. Spaces, punctuation and repeated separators in the slug field become single
hyphens; trailing separators are removed on blur/save. Clearing the slug re-enables
title-based generation for new items. Editing a saved item's title never changes its
existing URL automatically.

Run `npm run test:slugs -- <admin-email>` for a browser check of title-based slugs,
manual overrides, typed spaces, pasted text and existing URL preservation in both
editors. Content writes are mocked; no real records are created. An optional PNG
path after the email also checks that cover's dimensions and file size.

Run `npm run test:blocks -- <admin-email>` against the local server to check inline
image upload, article blocks, publishing, URL changes and redirects. Set
`ADMIN_TEST_URL` to use a server other than `http://localhost:5173`. The test removes
its temporary records, redirect aliases and uploaded images when finished.

Run `npm run test:preview -- <admin-email>` to check full-site preview, responsive
sizes, refresh, unsaved edits and draft isolation without creating content records.

## Admin Workspace Design

The admin uses a light, scoped design system: white navigation, a neutral canvas,
blue active/actions states, compact content tables and real dashboard counts. The
Overview shows recent content and unfinished drafts; the blog/project editor keeps
save/publish/preview controls in a sticky toolbar. Crop, moderation and preview
windows share the same styling without changing the public site's design.

At 800px and below, navigation becomes a keyboard-accessible drawer with focus
containment, Escape close and body scroll locking. Content tables scroll within
their own area on small screens; editor forms use a single-column layout.

Run `npm run test:admin-ui -- <admin-email>` for screenshot and interaction checks
at desktop, tablet, 390px and 320px widths. Content, comment and media writes are
mocked in this check; it does not create or edit live content. Other admin API tests
remain responsible for real backend persistence and moderation.

## Moderated Blog Comments

Public blog pages submit plain-text comments to `/api/comments`. All visitor
comments/replies start as pending; only approved comments under approved parents
appear publicly. Email addresses are returned only by the authenticated admin API,
never by the public API. The old demo comment/form has been replaced.

Visit `/admin/comments` for pending/approved/spam/trash queues, search, article
filtering, 20-row pages, bulk moderation, editing, team replies, restore and permanent
deletion. Team replies publish immediately beneath an approved original comment.
Trashing/unapproving a parent hides its replies; permanently deleting a trashed
parent also removes its replies. Comments retain a stable discussion ID through
article slug changes; drafted/archived articles cannot serve or receive comments.
Admin preview cannot submit comments.

Public submissions require same-origin JSON, validation, a honeypot, idempotent
submission IDs and Firestore-backed duplicate/cooldown limits (45 seconds between
new submissions, ten per hour per IP). IPs are HMAC-hashed, never stored in plain
text. Set `COMMENT_RATE_LIMIT_SECRET` to a private random value on the server, or
the existing `CLOUDINARY_API_SECRET` is used as a fallback. These protections are
basic abuse controls, not a replacement for a CAPTCHA/WAF on heavily targeted sites.
Optional Firestore TTL policies on `expiresAt` in `commentRateLimits` and
`commentDuplicates` remove expired abuse-protection records; expired limits reset
without TTL. No composite indexes are needed for the current equality queries.

Apply the repository's `firestore.rules` to the live Firebase project as part of
deployment. Direct client reads/writes to comments and protection collections must
remain denied, including for admin clients; authenticated server APIs perform all
moderation. The local rule file alone does not change already-deployed Firebase rules.

The article sidebar sticks below the header on desktop, stops at the article end,
and scrolls internally when taller than the viewport. Mobile/tablet narrow layouts
use normal document flow. The inner scrollbar is hidden consistently; native wheel,
touch and keyboard scrolling still work. Sidebar widgets do not use the scroll-reveal
translation that previously caused temporary overflow. Widgets on other page types
are unaffected.

The blog editor's End quote setting offers Default quote and Custom quote. Existing
articles without this setting keep the original default quote. Custom quotes are
plain text, required when selected, and limited to 2,000 characters. Switching back
to Default retains the saved custom text for later reuse. Unsaved changes appear in
the full-site preview, using the same quote validation and renderer as publication.

Run `npm run test:blog-options -- <admin-email>` to check default/custom end quotes,
real draft/publish/reload persistence, preview validation, public rendering and the
sidebar across desktop/short/mobile viewports. It removes only its temporary QA
article afterward; existing content and comments are not modified.

Run `npm run test:comments -- <admin-email>` against the local server (set
`ADMIN_TEST_URL` when needed). The browser/API check creates a temporary QA article
and comments, exercises moderation/privacy/rename/sticky/mobile flows, and cleans
up only its records, aliases and protection records when finished. Unit tests cover
validation, duplicate/rate limits, replies, privacy, rename and deletion.
