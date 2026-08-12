# Manipuri Dictionary — How to Run

A production-quality [Meitei Mayek](https://en.wikipedia.org/wiki/Meitei_script) online dictionary built with **Next.js 16 (App Router)**, **React 19**, **Prisma 7**, and **MariaDB/MySQL**.

## Tech Stack

| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Framework   | Next.js 16.3.0 (App Router, Turbopack)  |
| UI          | React 19.2.8, Tailwind CSS v4           |
| Icons       | lucide-react                            |
| ORM         | Prisma 7.9.1 (driver adapter)           |
| Database    | MySQL / MariaDB                         |
| Auth        | Auth.js (next-auth v5 beta)             |
| Validation  | zod                                     |

---

## Prerequisites

- **Node.js** 20+ (with npm)
- **MySQL** or **MariaDB** server running locally (or a remote instance)
- A database named `manipuri_dictionary` (the schema is preserved via Prisma introspection — it must already exist with tables; see [Database Setup](#database-setup))

---

## ⚠️ Windows Notes (Important)

Two Windows quirks affect how commands must be run on this system:

1. **PowerShell blocks `npm` / `npx`** — running `npm` in PowerShell fails with `npm.ps1 cannot be loaded because running scripts is disabled on this system`. The execution policy blocks the `.ps1` wrappers.
   - ✅ **Fix:** use `npm.cmd` / `npx.cmd` instead (they are batch wrappers that bypass the policy entirely).
   - Or permanently fix the policy from an **administrator** PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

2. **npm may not pick up a `cd`-changed directory** — running from the repository root fails with `Missing script: "dev"` because the root `package.json` has no scripts.

   - ✅ **Fix:** use the `--prefix manipuri-dictionary` flag from the repository root (`e:/projects/dictionary`), **or** open a terminal directly inside the `manipuri-dictionary` folder in VS Code (right-click the folder → "Open in Integrated Terminal").

---

## Quick Start

All commands below use `npm.cmd` with `--prefix` and work from the repository root (`e:/projects/dictionary`).

### 1. Install dependencies

```bash
cd e:/projects/dictionary
npm.cmd install --prefix manipuri-dictionary
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
copy manipuri-dictionary\.env.example manipuri-dictionary\.env
```

Then edit `manipuri-dictionary\.env`:

```dotenv
# Database connection
DATABASE_URL="mysql://root:password@localhost:3306/manipuri_dictionary"

# Auth.js
AUTH_SECRET="your-random-secret"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="http://localhost:3100"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3100"

# Database (used by the Prisma MariaDB driver adapter)
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="manipuri_dictionary"
```

> **Note:** The app connects to the database via the Prisma **driver adapter** which reads the individual `DB_*` variables. `DATABASE_URL` is used by the Prisma CLI (migrations / `prisma generate`).

### 3. Generate the Prisma client

```bash
npx.cmd --prefix manipuri-dictionary prisma generate
```

This generates the client into `generated/prisma/` (the app imports from there, so this step is required before running).

### 4. Start the development server

```bash
npm.cmd --prefix manipuri-dictionary run dev
```

The dev server runs on **port 3100** (configured in `package.json`):

- App: http://localhost:3100
- Search results page: http://localhost:3100/search?q=word

---

## Database Setup

The schema lives in `prisma/schema.prisma` and was preserved from an existing database via introspection, so **no migration files are required** — the tables must already exist in your MySQL/MariaDB instance before the app will function.

To quickly create an empty database:

```sql
CREATE DATABASE manipuri_dictionary
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

If you are starting from scratch without an existing database, you can generate the schema with:

```bash
npx.cmd --prefix manipuri-dictionary prisma db push
```

> ⚠️ `db push` will create/alter tables to match the schema but will **not** populate dictionary data. Import an existing `.sql` dump (e.g. `manipuri_dictionary_improved.sql` in the repository root) to load word data.

---

## Useful Scripts

| Command                                   | Description                                   |
| ----------------------------------------- | --------------------------------------------- |
| `npm.cmd --prefix manipuri-dictionary run dev` | Start the dev server on port 3100         |
| `npm.cmd --prefix manipuri-dictionary run build` | Create a production build                  |
| `npm.cmd --prefix manipuri-dictionary run start` | Start the production server                |
| `npm.cmd --prefix manipuri-dictionary run lint` | Run ESLint                                 |
| `npx.cmd --prefix manipuri-dictionary prisma generate` | Regenerate the Prisma client     |
| `npx.cmd --prefix manipuri-dictionary prisma studio` | Open Prisma Studio to browse/edit the database |
| `npx.cmd --prefix manipuri-dictionary prisma db push` | Sync the schema to the database     |

---

## Bookmarks

Signed-in users can bookmark words for quick access later.

- **Add / remove a bookmark** — each word page (`/word/[slug]`) has a **Bookmark** toggle button next to the "Listen" button. Guests who click it are redirected to the login page.
- **View bookmarks** — the **Bookmarks** link in the header (or `/bookmarks`) lists your saved words, ordered by most recently added. The page requires a signed-in session (guests are redirected to `/login?callbackUrl=/bookmarks`).
- **Behind the scenes** — bookmarks are stored in the `bookmarks` table (`user_id`, `word_id`, unique per user+word, with foreign keys to `users` and `words`). The Prisma schema has a `Bookmark` model; the table is created with `CREATE TABLE IF NOT EXISTS` so it is safe to add to an existing database.
- **API** — `POST /api/bookmarks` adds a bookmark, `DELETE /api/bookmarks?wordId=...` removes one. Both require an authenticated session (401 for guests).

---

## User Features

### Profile (`/profile`)
Shows your name, email, role, account status, member-since date, and contribution stats (total/approved/pending/rejected). The header shows your name as a link to this page.

### Account Settings (`/settings`)
Update your **name**, **email**, or **password** (current + new + confirm, validated against the stored bcrypt hash). Updates are handled by `PATCH /api/settings` (auth required).

### Forgot / Reset Password
- **Forgot password** (`/forgot-password`) — enter your email; a secure single-use reset token (32-byte random hex, valid 60 minutes) is generated and stored on the user row. To prevent account enumeration, the same response is returned whether or not the email exists. In local/dev the reset link is printed to the server console (configure an email provider for production).
- **Reset password** (`/reset-password?token=...`) — validate the token, set a new password (bcrypt), and clear the token. Expired/used tokens are rejected.
- APIs: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.

### My Contributions (`/dashboard`)
Lists all your word/edit proposals with their status (approved / pending / rejected), submission date, reviewer, and rejection reason. Stats cards summarize totals. Requires login.

---

## Roles & Admin

Roles: **USER**, **MODERATOR**, **ADMIN** (the `contributor` role also exists in the DB and behaves like USER in the UI).

- **Moderator** can view/review pending proposals (approve/reject with optional note).
- **Admin** additionally manages users and sees the full dashboard.

### Admin Dashboard (`/admin`)
- Metrics: published words, pending submissions, users, moderators.
- Quick links to Moderation, Users, and Audit Trail.

### Moderation (`/admin/moderation`)
- Lists pending proposals (new words + edits).
- Shows the **current vs proposed** content for edits.
- Approve / Reject with an optional moderation note.
- Approving a **new word** creates the word + approved sense; approving an **edit** updates the proposal status (the sense-level update is handled by the proposal model). The submitted user's stats are updated, and an entry is written to the **audit trail**.

### User Management (`/admin/users`)
- Searchable list of users (admin-only).
- Change roles (USER ↔ CONTRIBUTOR ↔ MODERATOR ↔ ADMIN) and toggle account status (active/banned).
- You cannot change your own role or ban yourself.

### Audit Trail (`/admin/audit`)
- History of every moderation action (who, what, when, note). Powered by the `moderation_logs` table.

**Authorization:** every admin page and API route verifies the session and role server-side (`/api/admin/*`, `/api/dashboard`). Guests/humans without the required role get redirected to login or a 403.

---

## Meitei Mayek Module

Meitei Mayek text conversion utilities live in `src/lib/meitei-mayek/` (mapping, converter, index). A test script is available:

```bash
npx.cmd --prefix manipuri-dictionary tsx scripts/test-meitei-mayek.ts
```

---

## Production Build

1. Build the app:

   ```bash
   npm.cmd --prefix manipuri-dictionary run build
   ```

2. Start the production server:

   ```bash
   npm.cmd --prefix manipuri-dictionary run start
   ```

   The production server also runs on port 3100. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your real domain in production.

---

## Environment Variables Reference

| Variable                | Required | Description                                          |
| ----------------------- | -------- | ---------------------------------------------------- |
| `DATABASE_URL`          | Yes      | SQL connection string used by the Prisma CLI        |
| `DB_HOST`               | Yes      | Database host (used by the driver adapter)           |
| `DB_PORT`               | Yes      | Database port (default `3306`)                       |
| `DB_USER`               | Yes      | Database username                                    |
| `DB_PASSWORD`           | Yes      | Database password                                    |
| `DB_NAME`               | Yes      | Database name (default `manipuri_dictionary`)        |
| `AUTH_SECRET`           | Yes      | Auth.js secret — generate with `npx auth secret`     |
| `AUTH_TRUST_HOST`       | No       | Set `true` for local/dev use                        |
| `NEXTAUTH_URL`          | No       | Canonical app URL (used for auth callbacks)          |
| `NEXT_PUBLIC_APP_URL`   | No       | Public app URL for client-facing links               |

---

## Future Features / Roadmap

A full feature roadmap is maintained in **[ROADMAP.md](./ROADMAP.md)** — it lists what's already implemented and the planned improvements across Search & Discovery, Content Richness, Learning & Engagement, Meitei Mayek–specific tools, Platform & Technical, and Admin / Data Quality (including a bulk translate tool to address the ~93% of senses currently lacking Manipuri content).

---

## Troubleshooting

| Problem                                   | Fix                                                            |
| ----------------------------------------- | -------------------------------------------------------------- |
| `npm.ps1 cannot be loaded because running scripts is disabled` | PowerShell execution policy blocks the `npm`/`npx` aliases. Use `npm.cmd` / `npx.cmd` instead, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in an admin PowerShell. |
| `Error: Missing script: "dev"`            | Run `npm.cmd --prefix manipuri-dictionary run dev` from the repository root instead of `npm run dev`. |
| `PrismaClientInitializationError`          | Check `DB_*` env vars, confirm the database exists and the server is reachable. |
| `Cannot find module ... generated/prisma`  | Run `npx.cmd --prefix manipuri-dictionary prisma generate` to create the Prisma client. |
| Port 3100 already in use                   | Change the port in `package.json` (`next dev -p <port>`) and update `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` accordingly. |
| Search returns no results                  | Ensure the `words` / `word_senses` tables contain data (import a SQL dump). |