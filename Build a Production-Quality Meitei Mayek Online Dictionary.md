# Build a Production-Quality Meitei Mayek Online Dictionary

Build a complete, modern, responsive, SEO-first online dictionary web application for the **Manipuri language using Meitei Mayek script**.

The application must be designed as a real production product, not a demo or generic CRUD application.

The primary goals are:

1. Excellent dictionary search experience
2. Excellent Meitei Mayek Unicode support
3. SEO-friendly individual word pages
4. Modern, premium, responsive UI
5. User registration and authentication
6. User contributions and edit suggestions
7. Moderator approval workflow
8. Admin management
9. Preservation of the existing dictionary database
10. High performance and accessibility

---

# 1. Technology Stack

Use the following stack unless there is a strong technical reason to change something:

- **Next.js** with App Router
- **React**
- **TypeScript**
- **MySQL**
- **Prisma ORM**
- **Tailwind CSS**
- **shadcn/ui** where appropriate
- **Lucide React** for icons
- **Zod** for validation
- **Auth.js** for authentication
- Next.js Metadata API
- Next.js sitemap
- Next.js robots support

Use Server Components by default.

Use Client Components only where interactivity requires them.

Do not introduce unnecessary dependencies.

Use strict TypeScript.

Avoid `any` unless absolutely necessary.

---

# 2. Existing Database — IMPORTANT

There may already be an existing MySQL database containing a large dictionary dataset imported from:

`manipuri_dictionary_new.sql`

The database may contain tens of thousands or more records.

The existing dictionary data is valuable and MUST NOT be deleted.

Before changing anything:

1. Inspect the existing database schema.
2. Inspect all relevant tables.
3. Understand existing relationships.
4. Identify the existing dictionary/word/sense tables.
5. Identify existing Meitei Mayek fields.
6. Identify existing Unicode-converted fields.
7. Preserve existing data.
8. Do not blindly run destructive Prisma migrations.
9. Do not drop existing tables.
10. Do not recreate the dictionary database from scratch.

If the existing database schema does not perfectly match the application's ideal schema:

- Reuse existing tables where practical.
- Add new tables only when necessary.
- Create a safe migration plan.
- Explain potentially destructive changes before applying them.

If the database already contains a field such as:

`meaning_mm`

and a converted Unicode field such as:

`meaning_mm_unicode`

use those fields appropriately rather than creating duplicate dictionary data unnecessarily.

Use Prisma introspection when appropriate:

```bash
npx prisma db pull
```

---

# 3. Product Identity

This is a **Manipuri language dictionary**, not a generic dictionary template.

The design and functionality should respect:

- Manipuri language
- Meitei Mayek script
- Unicode correctness
- Traditional dictionary/reference workflows
- Community contributions
- Editorial review

The application should feel like:

> A modern, trustworthy digital home for the Manipuri language.

Do not make it look like a generic SaaS dashboard.

---

# 4. UI / UX Design Direction

Create a modern, premium, calm, language-focused interface.

The design should feel:

- Modern
- Elegant
- Clean
- Trustworthy
- Readable
- Fast
- Professional
- Culturally respectful
- Accessible

Avoid:

- Generic admin-template appearance
- Excessive gradients
- Excessive animations
- Excessive colors
- Clutter
- Huge marketing illustrations
- Cryptocurrency/fintech styling
- Old-fashioned dictionary styling

The **dictionary content must always be the visual priority**.

---

# 5. Typography

Typography is extremely important.

Use a modern, highly readable UI font.

Ensure the font stack supports **Meitei Mayek Unicode** correctly.

Test with real characters:

```text
ꯀ ꯁ ꯂ ꯃ ꯄ ꯅ ꯆ ꯇ
ꯈ ꯉ ꯊ ꯋ ꯌ ꯍ ꯎ ꯏ
ꯐ ꯑ ꯒ ꯓ ꯔ ꯕ ꯖ ꯗ
ꯘ ꯙ ꯚ

ꯅꯥꯄꯤ
ꯍꯧꯕ
ꯂꯝ
ꯂꯝꯄꯥꯛ
```

There must be no tofu/missing-glyph boxes.

Use appropriate font sizing and line height for Meitei Mayek.

If a dedicated Meitei Mayek font is required, configure it correctly.

---

# 6. Responsive Design

The entire application must be mobile-first and responsive.

Test approximately:

```text
320px
375px
414px
768px
1024px
1280px
1440px+
```

The application must work well on:

- Mobile
- Tablet
- Laptop
- Desktop
- Large monitors

Do not simply shrink the desktop layout.

Design mobile layouts intentionally.

---

# 7. Color System

Use a restrained, modern color system.

Define semantic colors for:

- Background
- Surface
- Primary text
- Secondary text
- Border
- Brand
- Success
- Warning
- Error

Use one distinctive brand/accent color.

Do not use many bright colors.

Ensure WCAG-appropriate contrast.

Support:

- Light mode
- Dark mode
- System preference

Test actual Meitei Mayek content in both themes.

---

# 8. Homepage

Route:

```text
/
```

The homepage must immediately communicate that this is a dictionary.

The search box should be the dominant element.

Suggested layout:

```text
Logo                         Dictionary   About   Sign In

                    Discover Words

              Explore the Manipuri language

          ┌─────────────────────────────────┐
          │ 🔍 Search for a word...         │
          └─────────────────────────────────┘

              Popular Words

       Word     Word     Word     Word

          Recently Added / Popular
```

Do not make the homepage a marketing-heavy landing page.

The primary action is:

**Search the dictionary.**

---

# 9. Header

Desktop navigation:

```text
Logo

Dictionary
Contribute
About

                         Search
                         Sign In
```

Authenticated user:

```text
Logo

Dictionary
Contribute
My Contributions

                         Search
                         Profile
```

Moderator:

```text
Logo

Dictionary
Contribute
Moderation

                         Search
                         Profile
```

Admin:

```text
Logo

Dictionary
Dashboard
Moderation
Entries
Users

                         Profile
```

Mobile:

```text
Logo                         Menu
```

Use a clean responsive navigation drawer.

---

# 10. Search

Search is one of the most important features.

Route:

```text
/search?q=...
```

Requirements:

- Fast search
- Exact word matching
- Prefix matching
- Partial matching
- Search suggestions
- Keyboard navigation
- Search-as-you-type
- Debounced requests
- Loading state
- Empty state
- No-result state
- Mobile-friendly search

Do not make an unnecessary database request on every keystroke.

Use debouncing.

Search ranking should prioritize:

1. Exact match
2. Prefix match
3. Strong partial match
4. Other relevant results

Example:

```text
Search: napi

┌──────────────────────────────┐
│ ꯅꯥꯄꯤ                      │
│ napi                         │
│ noun                         │
│ Definition preview...        │
└──────────────────────────────┘
```

---

# 11. Search Suggestions

While typing:

```text
napi
```

show:

```text
ꯅꯥꯄꯤ
napi

Related words...

Recent searches...
```

Support:

- Arrow Up
- Arrow Down
- Enter
- Escape

The search suggestions must be keyboard accessible.

---

# 12. Word Detail Page

Route:

```text
/word/[slug]
```

Every approved dictionary entry should have a clean, stable, indexable URL.

Example:

```text
/word/example-word
```

The word page is the most important SEO page.

Suggested structure:

```text
Home / Dictionary / Word

ꯅꯥꯄꯤ

napi

[ 🔊 ]

noun

Definition

1. Definition...

   Example:
   Example sentence...

2. Definition...

Translation

...

Synonyms

...

Related Words

...

Was this definition helpful?

👍 Yes     👎 No

Found an error?

[ Suggest an edit ]
```

The visual hierarchy must be:

1. Word
2. Pronunciation
3. Part of speech
4. Definition
5. Examples
6. Translation
7. Synonyms
8. Related words
9. Contribution controls

Do not allow secondary information to visually overpower the definition.

---

# 13. Word Page Meitei Mayek Display

The Meitei Mayek form should be prominent.

Example:

```text
ꯅꯥꯄꯤ
napi
```

Meitei Mayek should not be treated as a decorative or secondary script.

If both Meitei Mayek and Latin transliteration are available:

```text
ꯅꯥꯄꯤ
napi
```

show Meitei Mayek first.

---

# 14. Pronunciation

If pronunciation/audio is available:

```text
ꯅꯥꯄꯤ

/napi/

[ 🔊 Listen ]
```

The audio button should:

- Be accessible
- Show loading/playback state
- Work on mobile
- Have an accessible label

---

# 15. Definitions

Support multiple meanings.

Use clean dictionary-style formatting:

```text
1. First meaning.

   Example:
   "Example sentence."

2. Second meaning.

   Example:
   "Another example."
```

Do not put every definition inside a heavy card.

Use typography and spacing.

---

# 16. Parts of Speech

Support appropriate parts of speech such as:

```text
noun
verb
adjective
adverb
pronoun
preposition
conjunction
interjection
etc.
```

Display them subtly.

---

# 17. Related Words

Support:

- Synonyms
- Related words
- Variants
- Translations
- Cross references

These should link to their corresponding dictionary pages whenever possible.

This creates strong internal SEO linking.

---

# 18. No Result State

If a word isn't found:

```text
Word not found

We couldn't find this word in the dictionary.

[ Search again ]

Know this word?

[ Suggest a word ]
```

Do not show a blank page.

---

# 19. 404 Page

Create a useful 404 experience.

Example:

```text
Word not found

The word you're looking for doesn't exist
or is not currently published.

[ Search dictionary ]
```

---

# 20. Authentication

Implement complete authentication.

Routes:

```text
/register
/login
/forgot-password
/reset-password
```

Support:

- Registration
- Login
- Logout
- Forgot password
- Password reset
- Session management
- Protected routes
- Role-based authorization

---

# 21. Registration

Registration fields:

```text
Name
Email
Password
Confirm Password
```

Validate using Zod.

Requirements:

- Validate email
- Validate password
- Confirm password
- Check duplicate email
- Securely hash password
- Never store plaintext passwords
- New accounts automatically receive `USER`
- Show useful validation errors

Example:

```text
Create your account

Name
[________________]

Email
[________________]

Password
[________________]

Confirm password
[________________]

[ Create Account ]

Already have an account?
Sign in
```

---

# 22. Login

Create a clean login page.

Fields:

- Email
- Password

Include:

```text
Forgot password?
Don't have an account? Create account
```

Show:

- Loading state
- Invalid credential error
- Validation errors
- Successful login behavior

---

# 23. Logout

Provide logout from the profile/account menu.

Logout must invalidate the session securely.

---

# 24. Forgot Password

Implement:

```text
Forgot password
       ↓
Enter email
       ↓
Send reset link
       ↓
Reset password
       ↓
Login
```

Password reset tokens must:

- Expire
- Be single-use
- Be securely generated
- Never be stored/logged insecurely

Do not expose whether an email exists in a way that allows account enumeration.

---

# 25. User Profile

Route:

```text
/profile
```

Show:

```text
Name
Email
Role
Member since

Total contributions
Approved
Pending
Rejected
```

Allow appropriate profile information to be edited.

Users cannot change their own role.

---

# 26. Account Settings

Route:

```text
/settings
```

Include:

### Profile

- Change name
- Change username if implemented

### Password

- Current password
- New password
- Confirm password

### Account

- Account status
- Logout
- Delete account

Sensitive actions require confirmation.

---

# 27. User Roles

Use exactly these roles initially:

```text
USER
MODERATOR
ADMIN
```

## USER

Responsibilities:

- Search dictionary
- View dictionary
- Submit new words
- Suggest corrections
- View own submissions
- Track submission status

## MODERATOR

Responsibilities:

- Everything USER can do
- View pending submissions
- Review submissions
- Approve submissions
- Reject submissions
- Add moderation notes
- Review edit history

## ADMIN

Responsibilities:

- Everything MODERATOR can do
- Manage users
- Change user roles
- Manage dictionary entries
- Delete/restore entries
- Manage moderators
- Manage system configuration
- View audit history

---

# 28. Permissions

| Feature | USER | MODERATOR | ADMIN |
|---|---:|---:|---:|
| View dictionary | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ |
| Register/Login | ✅ | ✅ | ✅ |
| Submit word | ✅ | ✅ | ✅ |
| Suggest edit | ✅ | ✅ | ✅ |
| View own submissions | ✅ | ✅ | ✅ |
| Review submissions | ❌ | ✅ | ✅ |
| Approve | ❌ | ✅ | ✅ |
| Reject | ❌ | ✅ | ✅ |
| Moderation notes | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Change roles | ❌ | ❌ | ✅ |
| Delete entries | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ✅ |

---

# 29. Authorization

Never rely only on frontend UI restrictions.

Every protected Server Action/API endpoint must verify:

```text
Authenticated?
      ↓
Valid session?
      ↓
Correct role?
      ↓
Permission?
      ↓
Database operation
```

For example:

```text
POST /api/submissions/123/approve
```

must independently verify that the current user is:

```text
MODERATOR
or
ADMIN
```

Never trust role values from:

- Browser requests
- Hidden form fields
- URL parameters
- Client-side state

---

# 30. User Contributions

Authenticated users can submit new dictionary content.

Route:

```text
/contribute
/contribute/new
```

Fields can include:

- Word
- Definition
- Part of speech
- Pronunciation
- Example sentence
- Synonyms
- Related words
- Translation
- Notes

Validate using Zod.

After submission:

```text
PENDING
```

The content must NOT become public immediately.

Show:

```text
Your submission has been received.

A moderator will review it before publication.
```

---

# 31. Suggest an Edit

Every public word page should provide:

```text
Suggest an edit
```

Users can suggest corrections to:

- Word information
- Definition
- Pronunciation
- Examples
- Part of speech
- Synonyms
- Translations
- Other dictionary information

The currently published content must remain unchanged until approval.

---

# 32. User Contribution Dashboard

Route:

```text
/dashboard
/dashboard/contributions
```

Show:

```text
My Contributions

Total       Approved       Pending       Rejected
  20            12             6             2
```

List:

```text
Word
Type
Status
Submitted
Reviewed
```

Users can view:

- Their submitted content
- Status
- Submission date
- Review date
- Moderator note
- Rejection reason where appropriate

---

# 33. Moderation Dashboard

Route:

```text
/admin/pending
/admin/moderation
```

Create an efficient review interface.

Show:

```text
Pending Review

Word

CURRENT
Definition:
...

PROPOSED
Definition:
...

Submitted by:
username

[ Reject ]       [ Approve ]
```

For edits, clearly show:

```text
Original
vs
Proposed
```

Allow moderators to:

- Approve
- Reject
- Add notes
- Review contributor
- View history

Use confirmation dialogs where appropriate.

---

# 34. Admin Dashboard

Route:

```text
/admin
```

Show useful metrics:

```text
Published Words
Pending Submissions
Users
Moderators
Recent Contributions
Recent Moderation Activity
```

Do not add meaningless charts just for visual decoration.

---

# 35. User Management

Route:

```text
/admin/users
```

Admins can:

- Search users
- View user
- Disable/enable account
- Change USER ↔ MODERATOR
- View contribution statistics

Do not allow users to change their own role.

Do not allow moderators to promote themselves.

---

# 36. Dictionary Management

Admin route:

```text
/admin/entries
```

Admins can:

- Search entries
- View entries
- Edit entries
- Delete entries
- Restore entries

Destructive actions require confirmation.

---

# 37. Moderation Audit Trail

Never destroy moderation history.

Record:

- Submission
- Submitted by
- Reviewed by
- Action
- Previous value
- Proposed value
- Decision
- Note
- Timestamp

Possible actions:

```text
SUBMITTED
APPROVED
REJECTED
UPDATED
RESTORED
DELETED
```

---

# 38. Database Model

Use Prisma with MySQL.

Conceptually support:

```text
User
Entry
Submission
ModerationAction
```

If required by Auth.js:

```text
Account
Session
VerificationToken
```

Use enums:

```text
Role:
USER
MODERATOR
ADMIN

SubmissionStatus:
PENDING
APPROVED
REJECTED
```

Account status:

```text
ACTIVE
DISABLED
```

Use proper:

- Foreign keys
- Indexes
- Unique constraints
- Created timestamps
- Updated timestamps
- Reviewed timestamps

---

# 39. Published Content vs Submissions

Prefer keeping published dictionary data separate from proposed changes.

Conceptually:

```text
entries
    ↓
Published dictionary content

submissions
    ↓
Proposed new entries/changes

moderation_actions
    ↓
Audit history
```

Public pages should read only approved/published content.

Do not expose pending or rejected content publicly.

---

# 40. SEO

SEO is a top priority.

Every approved word should have its own indexable URL:

```text
/word/[slug]
```

Implement:

- Server-rendered content
- Dynamic metadata
- Unique title
- Unique description
- Canonical URL
- Open Graph
- Twitter/X metadata
- JSON-LD
- Breadcrumb structured data
- Sitemap
- Robots.txt
- Semantic HTML
- Internal linking
- Proper headings
- Mobile-first pages
- Fast loading

Example:

```text
ꯅꯥꯄꯤ — Meaning, Definition & Examples | Dictionary
```

Do not index:

- Pending submissions
- Rejected submissions
- Admin pages
- User dashboards
- Private pages
- Internal API routes

---

# 41. Rendering Strategy

Do NOT statically generate millions of pages during every build.

Use:

- Server Components
- Server rendering
- Caching
- ISR/revalidation
- On-demand revalidation

When a moderator approves an entry:

```text
Submission approved
       ↓
Update database
       ↓
Revalidate affected word
       ↓
Updated page becomes available
```

Use appropriate Next.js caching/revalidation APIs.

---

# 42. Sitemap

Generate sitemap dynamically.

Include only published/indexable dictionary pages.

Do not include:

```text
/admin
/dashboard
/login
/register
/private content
pending submissions
```

If the dictionary becomes very large, implement sitemap segmentation/indexing as appropriate.

---

# 43. Structured Data

Use JSON-LD where appropriate.

Include:

- WebSite
- BreadcrumbList
- Dictionary/defined-term related structured data where appropriate

Do not add misleading structured data.

---

# 44. Performance

Optimize for Core Web Vitals.

Use:

- Server Components
- Efficient Prisma queries
- Database indexes
- Pagination
- Caching
- ISR/revalidation
- Lazy loading where appropriate
- Minimal client JavaScript
- Debounced search

Never load the entire dictionary into the browser.

Never fetch thousands of entries unnecessarily.

---

# 45. Database Search

Start with MySQL search.

Index appropriate fields such as:

```text
word
slug
language
status
```

Use efficient queries.

Avoid:

```sql
SELECT * FROM entries;
```

when only a few fields are needed.

If the dictionary eventually becomes large enough to need dedicated search, keep the architecture flexible for:

- Meilisearch
- Typesense
- OpenSearch/Elasticsearch

Do not add a dedicated search engine prematurely.

---

# 46. Meitei Mayek Keyboard

Build a Meitei Mayek keyboard/input utility based on the following mapping.

The keyboard mapping is **case-sensitive**.

The system must preserve unmapped characters.

CORE RULE:

```text
If key has a mapping:
    convert it

If key does not have a mapping:
    preserve it unchanged
```

Spaces, line breaks, and unmapped punctuation must remain unchanged.

Do not introduce Bengali mappings.

Do not invent mappings.

---

# 47. Meitei Mayek Main Consonants

```text
k → ꯀ → U+ABC0
s → ꯁ → U+ABC1
l → ꯂ → U+ABC2
m → ꯃ → U+ABC3
p → ꯄ → U+ABC4
n → ꯅ → U+ABC5
c → ꯆ → U+ABC6
t → ꯇ → U+ABC7
K → ꯈ → U+ABC8
Z → ꯉ → U+ABC9
T → ꯊ → U+ABCA
w → ꯋ → U+ABCB
y → ꯌ → U+ABCC
h → ꯍ → U+ABCD
U → ꯎ → U+ABCE
I → ꯏ → U+ABCF
f → ꯐ → U+ABD0
A → ꯑ → U+ABD1
g → ꯒ → U+ABD2
J → ꯓ → U+ABD3
r → ꯔ → U+ABD4
b → ꯕ → U+ABD5
j → ꯖ → U+ABD6
d → ꯗ → U+ABD7
G → ꯘ → U+ABD8
D → ꯙ → U+ABD9
B → ꯚ → U+ABDA
```

---

# 48. Meitei Mayek Vowel Signs

```text
a → ꯥ → U+ABE5
e → ꯦ → U+ABE6
u → ꯨ → U+ABE8
i → ꯤ → U+ABE4
E → ꯩ → U+ABE9
o → ꯣ → U+ABE3
O → ꯧ → U+ABE7
q → ꯪ → U+ABEA
```

---

# 49. Independent Vowel Sequences

Based on the supplied keyboard layout:

```text
a → ꯑꯥ → U+ABD1 U+ABE5
e → ꯑꯦ → U+ABD1 U+ABE6
E → ꯑꯩ → U+ABD1 U+ABE9
o → ꯑꯣ → U+ABD1 U+ABE3
O → ꯑꯧ → U+ABD1 U+ABE7
q → ꯑꯪ → U+ABD1 U+ABEA
```

IMPORTANT:

These are contextual forms.

For example:

```text
n + a
```

should produce:

```text
ꯅꯥ
```

not:

```text
ꯅꯑꯥ
```

The input engine must understand context.

---

# 50. Lonsum

```text
Q → ꯛ → U+ABDB
L → ꯜ → U+ABDC
M → ꯝ → U+ABDD
P → ꯞ → U+ABDE
N → ꯟ → U+ABDF
Y → ꯠ → U+ABE0
H → ꯡ → U+ABE1
I → ꯢ → U+ABE2
```

Important:

`I` is context-sensitive:

```text
I → ꯏ
I → ꯢ
```

Do not assume a globally unique output without applying the appropriate typing context.

---

# 51. Meitei Mayek Digits

```text
0 → ꯰ → U+ABF0
1 → ꯱ → U+ABF1
2 → ꯲ → U+ABF2
3 → ꯳ → U+ABF3
4 → ꯴ → U+ABF4
5 → ꯵ → U+ABF5
6 → ꯶ → U+ABF6
7 → ꯷ → U+ABF7
8 → ꯸ → U+ABF8
9 → ꯹ → U+ABF9
```

Preserve normal ASCII numbers when the input mode is not explicitly using Meitei Mayek digits.

---

# 52. Meitei Mayek Marks

```text
| → ꯫ → U+ABEB
. → ꯬ → U+ABEC
_ → ꯭ → U+ABED
```

All other punctuation remains unchanged unless explicitly mapped.

Examples:

```text
/ → /
! → !
? → ?
, → ,
: → :
; → ;
- → -
+ → +
= → =
( → (
) → )
[ → ]
@ → @
# → #
```

---

# 53. Keyboard Examples

The keyboard converter must produce:

```text
napi
→ ꯅꯥꯄꯤ
```

```text
hOb
→ ꯍꯧꯕ
```

```text
lM
→ ꯂꯝ
```

```text
lMpaQ
→ ꯂꯝꯄꯥꯛ
```

Mixed input:

```text
napi hOb / lMpaQ!
```

must produce:

```text
ꯅꯥꯄꯤ ꯍꯧꯕ / ꯂꯝꯄꯥꯛ!
```

Notice:

```text
/
space
!
```

remain unchanged.

---

# 54. Keyboard UI

Create an optional on-screen Meitei Mayek keyboard.

It should:

- Show the available Meitei Mayek keys
- Support uppercase/lowercase keys
- Support Lonsum keys
- Support digits
- Support punctuation
- Work on mobile
- Insert characters into focused inputs
- Have visual pressed states
- Support physical keyboard input
- Support backspace
- Support space
- Support enter
- Support cursor movement

Do not replace the normal physical keyboard.

The virtual keyboard is an additional input method.

---

# 55. Keyboard Accessibility

The keyboard must support:

- Keyboard focus
- Focus indicators
- Screen-reader labels
- Touch targets large enough for mobile
- Dark mode
- Responsive layout

Do not use tiny keyboard buttons.

---

# 56. Contribution Editor

When users contribute Meitei Mayek content, provide:

- Normal text input
- Meitei Mayek keyboard
- Unicode-safe text handling
- Character preview
- Clear input
- Undo where appropriate

Do not convert existing Unicode Meitei Mayek text again.

Detect/handle already-Unicode input appropriately.

---

# 57. Unicode Data Integrity

All database connections and text handling must use UTF-8 / `utf8mb4`.

Ensure:

- MySQL uses `utf8mb4`
- Prisma correctly handles Unicode
- HTTP responses use UTF-8
- HTML uses UTF-8
- JSON uses UTF-8
- Files use UTF-8
- Search works with Meitei Mayek

Test:

```text
ꯀꯁꯂꯃꯄꯅ
ꯅꯥꯄꯤ
ꯂꯝꯄꯥꯛ
```

through:

```text
Database
↓
Prisma
↓
Server
↓
React
↓
Browser
```

---

# 58. Accessibility

Follow WCAG principles.

Implement:

- Semantic HTML
- Correct heading hierarchy
- Form labels
- Keyboard navigation
- Visible focus states
- Accessible dialogs
- Accessible dropdowns
- Screen-reader-friendly controls
- Good contrast
- Reduced motion support

Never communicate status only through color.

---

# 59. Loading States

Create proper loading UI.

Use:

```text
loading.tsx
```

where appropriate.

Create skeletons for:

- Search
- Word page
- Dashboard
- Moderation queue
- User table

Never leave users staring at an empty screen.

---

# 60. Error Handling

Create:

```text
error.tsx
not-found.tsx
loading.tsx
```

where appropriate.

Handle:

- Database failure
- Network failure
- Invalid input
- Unauthorized
- Forbidden
- Word not found
- Submission failure
- Authentication failure

Show friendly user-facing errors.

Do not expose database errors or sensitive implementation details.

---

# 61. Security

Implement:

- Secure authentication
- Secure password hashing
- Secure sessions
- HTTP-only cookies where applicable
- Input validation
- Server-side authorization
- Rate limiting where appropriate
- Password reset protection
- SQL injection protection through Prisma
- No secrets in client code
- No passwords in logs
- No sensitive data in public APIs

Never trust user input.

---

# 62. API / Server Actions

Public:

```text
Search dictionary
Get word
Get related words
```

Authenticated:

```text
Create submission
Suggest edit
View own submissions
```

Moderator:

```text
List pending
Approve
Reject
Add moderation note
```

Admin:

```text
Manage users
Change roles
Manage entries
View audit logs
```

Every protected operation must perform server-side authorization.

---

# 63. URL Structure

Use clean URLs:

```text
/
/search?q=...
/word/[slug]
/contribute
/dashboard
/profile
/settings
/login
/register
/admin
```

Do not use:

```text
/entry?id=123
```

for public word pages.

Use stable slugs.

Handle duplicate words and language distinctions appropriately.

---

# 64. Navigation and Internal Linking

Public word pages should link to:

- Related words
- Synonyms
- Categories
- Language information
- Other relevant entries

This helps both users and SEO.

Avoid dead-end pages.

---

# 65. Admin UI Design

Admin functionality should use the same design system but have a more information-dense layout.

Use:

- Sidebar
- Tables
- Filters
- Search
- Pagination
- Status badges
- Confirmation dialogs

Do not allow the admin interface to negatively affect the public dictionary experience.

---

# 66. Status Badges

Use semantic status badges:

```text
PENDING
APPROVED
REJECTED
ACTIVE
DISABLED
```

Do not rely only on color.

---

# 67. Forms

All forms should:

- Validate on server
- Validate on client where useful
- Show field-level errors
- Preserve user input after validation failure
- Show submission loading state
- Prevent duplicate submissions
- Show success state

Use Zod schemas shared where appropriate.

---

# 68. Database Indexing

Add appropriate indexes for frequently queried fields.

At minimum evaluate:

```text
word
slug
status
language
createdAt
updatedAt
submittedBy
reviewedBy
```

Do not blindly add indexes to every field.

---

# 69. Pagination

Use pagination for:

- Search results
- User lists
- Contributions
- Moderation queue
- Admin entries
- Audit logs

Do not load thousands of records at once.

---

# 70. Caching

Use caching strategically.

Public dictionary pages can be cached.

Search results should have appropriate short-lived caching where useful.

Private user/admin data must not be accidentally shared through public caches.

Be careful with Next.js caching semantics.

---

# 71. Account Deletion

Users may request account deletion.

Before deleting:

```text
Are you sure?

This action cannot be easily undone.

[Cancel] [Delete Account]
```

Do not destroy moderation/audit history if it needs to be retained for data integrity.

Anonymize historical contribution information where appropriate.

---

# 72. Environment Configuration

Create:

```text
.env.example
```

Example:

```env
DATABASE_URL="mysql://root:password@localhost:3306/manipuri_dictionary"

AUTH_SECRET=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never commit real secrets.

---

# 73. Project Structure

Use a maintainable structure similar to:

```text
dictionary/
├── app/
│   ├── page.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── word/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── contribute/
│   │   ├── page.tsx
│   │   └── new/
│   ├── dashboard/
│   │   └── contributions/
│   ├── profile/
│   ├── settings/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── pending/
│   │   ├── moderation/
│   │   ├── entries/
│   │   ├── users/
│   │   └── settings/
│   ├── api/
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── error.tsx
│   ├── not-found.tsx
│   └── loading.tsx
│
├── components/
│   ├── ui/
│   ├── dictionary/
│   ├── search/
│   ├── auth/
│   ├── contribution/
│   ├── moderation/
│   └── admin/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   ├── permissions/
│   ├── search/
│   ├── seo/
│   └── meitei-mayek/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│
├── .env.example
└── package.json
```

Adapt the structure if the existing project has a better organization.

---

# 74. Meitei Mayek Utilities

Create a dedicated utility/module for Meitei Mayek.

For example:

```text
lib/meitei-mayek/
```

Separate:

```text
keyboard mapping
Unicode helpers
context rules
validation
normalization
```

Do not put all Meitei Mayek logic into React components.

The logic should be reusable from:

- Web keyboard
- Contribution form
- Admin editor
- Tests
- Future mobile/API clients

---

# 75. Testing

Implement meaningful tests.

At minimum test:

### Keyboard

```text
napi → ꯅꯥꯄꯤ
hOb → ꯍꯧꯕ
lM → ꯂꯝ
lMpaQ → ꯂꯝꯄꯥꯛ
```

Test preservation:

```text
napi / lMpaQ!
→
ꯅꯥꯄꯤ / ꯂꯝꯄꯥꯛ!
```

Test:

- spaces
- punctuation
- unmapped characters
- uppercase
- lowercase
- Unicode input
- Lonsum
- vowel combinations

### Authentication

Test:

- Registration
- Login
- Logout
- Invalid password
- Password reset
- Disabled user

### Permissions

Test:

```text
USER cannot approve
MODERATOR can approve
ADMIN can approve
USER cannot manage users
MODERATOR cannot manage users
ADMIN can manage users
```

### Contributions

Test:

```text
Submit
→ PENDING

Approve
→ Published

Reject
→ REJECTED
```

---

# 76. Development Phases

Do not try to build everything blindly in one step.

Implement in phases.

## Phase 1 — Foundation

- Inspect existing database
- Initialize Next.js
- Configure TypeScript
- Configure Tailwind
- Configure shadcn/ui
- Configure Prisma
- Connect MySQL
- Verify existing data
- Build basic layout

## Phase 2 — Dictionary

- Homepage
- Search
- Search suggestions
- Word pages
- Related words
- Meitei Mayek rendering
- SEO
- Sitemap

## Phase 3 — Authentication

- Registration
- Login
- Logout
- Forgot password
- Reset password
- Profile
- Settings

## Phase 4 — Contributions

- Submit word
- Suggest edit
- User dashboard
- Submission history

## Phase 5 — Moderation

- Pending queue
- Compare changes
- Approve
- Reject
- Notes
- Audit history

## Phase 6 — Administration

- Admin dashboard
- User management
- Role management
- Entry management
- System settings

## Phase 7 — Polish

- Responsive design
- Dark mode
- Accessibility
- Performance
- SEO
- Error states
- Loading states
- Security review
- Testing

---

# 77. Development Rules

Before writing code:

1. Inspect the existing repository.
2. Inspect the existing database.
3. Inspect existing data structure.
4. Identify reusable code.
5. Do not delete existing dictionary data.
6. Do not perform destructive migrations without explicit confirmation.
7. Do not create duplicate dictionary tables unnecessarily.
8. Understand the existing `meaning_mm` and Unicode fields if present.
9. Build reusable components.
10. Keep business logic outside UI components.
11. Keep authorization server-side.
12. Keep public pages fast.
13. Keep SEO in mind from the beginning.
14. Test Meitei Mayek Unicode throughout the stack.
15. Do not use Bengali mappings.
16. Do not invent keyboard mappings.
17. Preserve unmapped ASCII characters.
18. Do not add unnecessary dependencies.

---

# 78. Important Product Principle

Do not optimize the application for a generic English dictionary.

The application must be designed specifically for **Manipuri language and Meitei Mayek**.

The system should gracefully support:

```text
Meitei Mayek
Latin transliteration
Definitions
Translations
Examples
Synonyms
Related words
Community contributions
Editorial review
```

The Meitei Mayek script should be treated as a first-class part of the product.

---

# 79. Final Quality Standard

Before considering the application complete, verify:

### Public experience

- [ ] Homepage looks modern
- [ ] Search is fast
- [ ] Search suggestions work
- [ ] Word pages are readable
- [ ] Meitei Mayek renders correctly
- [ ] Mobile layout works
- [ ] Dark mode works
- [ ] 404 works
- [ ] Loading states work
- [ ] Error states work

### SEO

- [ ] Word pages are server-rendered
- [ ] Metadata is dynamic
- [ ] Canonical URLs exist
- [ ] JSON-LD exists where appropriate
- [ ] Sitemap works
- [ ] Robots works
- [ ] Private pages are not indexed
- [ ] Internal links work

### Authentication

- [ ] Registration
- [ ] Login
- [ ] Logout
- [ ] Forgot password
- [ ] Reset password
- [ ] Profile
- [ ] Settings

### Contributions

- [ ] Submit word
- [ ] Suggest edit
- [ ] Track submissions
- [ ] View status
- [ ] Moderator review
- [ ] Approval
- [ ] Rejection
- [ ] Audit history

### Roles

- [ ] USER permissions
- [ ] MODERATOR permissions
- [ ] ADMIN permissions
- [ ] Server-side authorization
- [ ] Protected routes

### Database

- [ ] Existing data preserved
- [ ] Prisma connected
- [ ] Correct indexes
- [ ] UTF-8/utf8mb4
- [ ] Safe migrations
- [ ] No duplicate data unnecessarily

### Meitei Mayek

- [ ] Unicode correct
- [ ] Keyboard mapping correct
- [ ] Contextual vowel behavior handled
- [ ] Lonsum handled
- [ ] Digits handled
- [ ] Unmapped characters preserved
- [ ] No Bengali conversion
- [ ] Unicode tests pass

### Performance

- [ ] No unnecessary client rendering
- [ ] Efficient database queries
- [ ] Pagination
- [ ] Caching
- [ ] ISR/revalidation
- [ ] Debounced search
- [ ] Good Core Web Vitals

### Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus states
- [ ] Form labels
- [ ] Contrast
- [ ] Reduced motion

---

# FINAL INSTRUCTION TO THE CODING AGENT

Build this application as a **real production-quality Meitei Mayek dictionary**, not as a simple CRUD demo.

Prioritize:

```text
Dictionary UX
     ↓
Meitei Mayek Unicode correctness
     ↓
Search
     ↓
SEO
     ↓
Responsive design
     ↓
Authentication
     ↓
Contributions
     ↓
Moderation
     ↓
Administration
     ↓
Performance & security
```

Before making major architectural or destructive database changes, explain what you intend to change and why.

When existing data conflicts with the proposed schema, **preserve the existing data and adapt the application around it whenever reasonably possible**.

Do not fabricate dictionary content.

Do not invent Meitei Mayek keyboard mappings.

Do not add Bengali script mappings.

Do not expose unpublished submissions publicly.

Do not trust client-side role information.

Do not sacrifice dictionary readability for decorative UI.

The finished application should be visually polished, technically maintainable, SEO-friendly, fast, accessible, and ready to grow into a community-driven Manipuri language dictionary.
