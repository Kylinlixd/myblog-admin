# Production Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Push both verified repositories and deploy the tested revisions to `leexd.top` with backups, HTTPS repair, smoke tests, and rollback records.

**Architecture:** Treat GitHub revisions as release identifiers. Inspect first, back up current application/configuration/data, deploy backend and frontend independently, validate Nginx before reload, and record every before/after revision.

**Tech Stack:** Git, GitHub, SSH, Nginx, systemd, Gunicorn, Vite, Django, MySQL or SQLite as discovered on the server, Certbot or the server's existing certificate manager.

---

### Task 1: Inspect production without mutation

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Record current application topology**

Over SSH, read only: OS version, disk/memory, Nginx enabled sites and validated configuration, systemd units, listening ports, application directories, current Git remotes/revisions, frontend document root, backend environment-file path, database engine, media path, and certificate inventory/expiry.

- [ ] **Step 2: Record current HTTP behavior**

Run local and server-side requests for `/`, `/blog`, `/api/blog/dynamics/`, and `/login` over HTTP and HTTPS. Record status, redirect chain, certificate subject/SAN/expiry, and failing layer.

- [ ] **Step 3: Add a `Production baseline` section to the delivery log**

Record paths and revisions but redact passwords, secret keys, database credentials, access tokens, and cookie values.

### Task 2: Create recoverable backups

**Files:**
- Modify: production backup directory only
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Create a timestamped, explicit backup directory**

Use a validated path such as `/root/backups/kylin-blog-YYYYMMDD-HHMMSS`; never target `/root`, `/srv`, or the document root recursively.

- [ ] **Step 2: Back up application state**

Copy Nginx site files, systemd unit files, backend `.env`, current frontend artifact, and media metadata. Dump MySQL with `mysqldump --single-transaction` if MySQL is active; copy the SQLite database only after identifying SQLite.

- [ ] **Step 3: Verify backup contents**

List exact files, validate the SQL dump is non-empty or the SQLite copy opens, and record the recovery directory in the delivery log without recording secrets.

### Task 3: Push release commits to GitHub

**Files:**
- Git histories in both repositories

- [ ] **Step 1: Verify clean local repositories**

Run in each repository: full project gate, `git diff --check`, `git status --short`, `git log -1 --oneline`, and `git remote -v`.

Expected: tests/build pass and worktrees are clean.

- [ ] **Step 2: Push frontend and backend main branches**

Run `git push origin main` in each repository.

Expected: both remotes accept the verified commits.

- [ ] **Step 3: Confirm remote revisions**

Run `git ls-remote origin refs/heads/main` in each repository and match the local `HEAD` exactly.

### Task 4: Deploy backend and frontend

**Files:**
- Production backend checkout
- Production frontend checkout and artifact directory

- [ ] **Step 1: Fetch exact pushed revisions**

In each production checkout, run non-destructive fetch, verify the worktree is clean, and fast-forward to the recorded release revision. Stop if local production edits overlap the release.

- [ ] **Step 2: Update backend dependencies and verify**

Activate the existing virtual environment, install from `requirements.txt`, run `python manage.py check`, `python manage.py test`, `python manage.py migrate --noinput`, and `python manage.py collectstatic --noinput`.

Expected: every command succeeds before service restart.

- [ ] **Step 3: Build and publish frontend**

Run `npm ci` and `npm run build`. Publish the new `dist` through a timestamped release directory and switch the Nginx document-root symlink atomically where the existing topology supports it; otherwise preserve the old artifact before copying.

- [ ] **Step 4: Restart only changed services**

Restart the Gunicorn service after backend deployment. Run `nginx -t` before reloading Nginx.

### Task 5: Repair HTTPS and verify the release

**Files:**
- Production Nginx TLS configuration
- Existing certificate storage
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Repair the discovered TLS failure at its owning layer**

If the certificate is missing/expired, renew or issue it with the existing certificate manager after verifying DNS points to the server. If Nginx lacks a 443 server block or has the wrong certificate path, correct only the active site file. Do not enable preload HSTS during this release.

- [ ] **Step 2: Validate before reload**

Run `nginx -t`, inspect the resolved 80/443 server blocks, then reload Nginx.

- [ ] **Step 3: Run production smoke tests**

Verify valid HTTPS, HTTP redirect, `/blog`, homepage assets, public API, login response, authenticated dashboard using the owner's normal account if available, media delivery, and mobile viewport layout. Verify Gunicorn and Nginx service health and recent error logs.

- [ ] **Step 4: Record final revisions and rollback commands**

Update the delivery log with local/remote/production revisions, backup directory, service status, certificate expiry, smoke results, and the exact previous revision or artifact needed for rollback.

- [ ] **Step 5: Commit and push the final delivery record**

```bash
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record production release"
git push origin main
```

