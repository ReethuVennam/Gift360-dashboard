# Customer Lookup & Voucher Regeneration

This document describes the customer-lookup panel added to the Overview tab and
the "Regenerate Voucher" action added across the app.

## 1. Customer lookup panel (Overview tab)

**Component:** `src/shared/CustomerLookupPanel.tsx`, rendered at the top of
`src/pages/Overview.tsx`, above the existing KPI grid.

### Search

- A larger search bar (`.search-wrap.lg` in `src/styles/dashboard.css`) with a
  **Submit** button.
- Search by **name, email, mobile, or order ID**:
  1. Calls `GET /customers?search=<query>` (matches name / mobile / email /
     customer ID).
  2. If nothing matches, falls back to `GET /orders?search=<query>` to resolve
     an order number, then re-queries `/customers` using that order's email
     (or mobile) to land on the same customer record.
- Clicking **Submit** always re-fetches the customer's full transaction
  history via `GET /customers/{id}/journey` — this is the "entire history"
  behavior.

### Profile

Shows the customer's full profile: name, customer ID, mobile, email, account
status, total orders, total spent, SuperCoins earned, vouchers received, and
last order date.

### Transactions — tree structure

- Journey rows are grouped by their `ref` (order reference) into a
  parent/child tree: each **order** is a node, and its individual events
  (payment, voucher, etc.) are the expandable children underneath it.
- Sorted by most recent activity first.
- **Last 10 shown by default**; if there are more than 10, a pager (Prev /
  Next) appears to page through older ones, 10 at a time.
- Clicking **View order** on a node opens the shared order-detail drawer (see
  below) with the full order breakdown.
- Each order node fetches its authoritative `order_status` / `voucher_status`
  / `order_item_id` from `GET /orders?search=<ref>&size=1` (the same fields
  Orders.tsx uses) and shows the **Regenerate Voucher** button on the node
  whenever that order was paid but its voucher wasn't generated — the exact
  same condition as the Orders and Vouchers pages (see §3).

### Admin activity

Below the transaction tree, a table shows admin actions recorded against this
specific customer (block / suspend / reactivate, etc.), pulled from the audit
log and filtered to this customer's ID.

## 2. Shared order-detail drawer

**Component:** `src/shared/OrderDetailDrawer.tsx` (extracted out of
`src/pages/Orders.tsx` so both the Orders page and the customer lookup panel
show identical detail — status, customer, payment breakdown, line items, and
the Regenerate Voucher action where applicable).

## 3. Regenerate Voucher — two-level (maker-checker) approval, async inbox

**Components:**
- `src/shared/RegenerateVoucherButton.tsx` (Level 1 — submit a request)
- `src/pages/VoucherApprovals.tsx` (Level 2 — a real page, own sidebar nav
  item "Voucher Approvals", visited by the approver in their **own**
  separately-logged-in session, whenever they get to it)

**Backend:** `d:\gift360-admin-backend` (local Spring Boot project,
`server.port=8082`), specifically `AdminController.java` section "4b.
VOUCHER RETRY REQUESTS" and the new `voucher_retry_requests` table added to
`src/main/resources/db/admin_tables.sql`.

**Condition:** the button is shown wherever an order's payment succeeded but
its voucher was not generated (`order_status` is `PAID`/`SUCCESS` and
`voucher_status` isn't `GENERATED`).

**Behavior — genuinely asynchronous, no shared browser session:**
1. **Level 1** (permission `vouchers:retry:request`) clicks "Regenerate
   Voucher". This calls `POST /vouchers/retry-requests` (creates a `PENDING`
   row) and immediately locks into an **"Awaiting Approval"** pill. Level 1
   does not need Level 2 present, and nothing calls the ValueDesign GetEVC
   API yet.
2. **Level 2** (permission `vouchers:retry:approve`) opens "Voucher
   Approvals" in the sidebar at any later time, in their own normal login
   session — no credential hand-off, no popup. They see every `PENDING`
   request (`GET /vouchers/retry-requests?status=PENDING`), and for any row
   can view **Details** + a **Retry history** tab
   (`GET /vouchers/{orderNumber}/{orderItemId}/retry-history`), then:
   - **Reject** (reason required) → `POST /vouchers/retry-requests/{id}/reject`,
     row becomes `REJECTED`. This *is* now recorded server-side (unlike the
     earlier same-session design).
   - **Approve & regenerate** → `POST /vouchers/retry-requests/{id}/approve`,
     which is what actually calls `ValueDesignClient.retryVoucher(...)` (the
     same call `POST /vouchers/retry` makes) and generates the voucher.
3. On `retryStatus: "SUCCESS"` the row becomes `APPROVED` and the modal
   closes. On `EXHAUSTED` the row is marked `EXHAUSTED` (out of the pending
   queue). On `FAILED`/`SKIPPED` the row stays `PENDING` so the approver can
   press Approve again later (subject to the backend's max-attempts /
   idempotency-window rules).

**Permissions:** `vouchers:retry:request` (Level 1) and
`vouchers:retry:approve` (Level 2) are real, enforced permissions as of this
change — added via `admin_permissions` + `admin_role_permissions` inserts in
`admin_tables.sql`, granted to the `ADMIN` and `SUPER_ADMIN` roles (and
`vouchers:retry:request` also to `SUPPORT`). These same permission *names*
already existed on some environments as unused DB rows before this change
(visible in JWTs but never checked anywhere in code); they are now actually
wired to the new endpoints.

**Used in:**
- Orders page (`src/pages/Orders.tsx`) — Voucher column, per row.
- Order detail drawer (`src/shared/OrderDetailDrawer.tsx`).
- Vouchers page (`src/pages/Vouchers.tsx`) — Failed and Retry-eligible tabs.
- Customer lookup panel (`src/shared/CustomerLookupPanel.tsx`) — per order
  node in the transaction tree, using `order_status` / `voucher_status` /
  `order_item_id` fetched from `GET /orders?search=<ref>&size=1` (not the
  journey feed, which doesn't carry reliable status fields for this check).

## 4. Known backend gaps

- `POST /vouchers/retry` (the original single-step endpoint from
  `VOUCHER_RETRY_API.md`) still exists and still works standalone — the new
  `/vouchers/retry-requests` endpoints are additive, not a replacement.
- The new `voucher_retry_requests` table/permissions must be applied by
  running the appended section of `admin_tables.sql` against the DB by
  hand (there's no Flyway/Liquibase/auto-schema-init in this project — every
  migration here is run manually), and the local backend (port 8082) needs
  a restart to pick up the new `AdminController` endpoints.
- The `/vouchers/failed` and `/vouchers/retry-eligible` response fields
  documented in `VOUCHER_RETRY_API.md` (flat array, camelCase: `orderNumber`,
  `orderItemId`, `paidAt`, `quantity`, `unitValue`, `lineTotal`, `currency`,
  `amount`, `status`, `canRetry`) don't match the richer shape
  `src/pages/Vouchers.tsx` currently reads (`{data: [...]}` wrapper,
  snake_case, customer/brand fields). Left as-is pending confirmation from
  backend on whether the documented example is complete or abbreviated.

## 5. Files touched

- `src/shared/CustomerLookupPanel.tsx` (new)
- `src/shared/OrderDetailDrawer.tsx` (new, extracted from `Orders.tsx`)
- `src/shared/RegenerateVoucherButton.tsx` (new)
- `src/pages/Overview.tsx` — renders the lookup panel
- `src/pages/Orders.tsx` — uses the shared drawer + regenerate button
- `src/pages/Vouchers.tsx` — uses the regenerate button
- `src/styles/dashboard.css` — `.search-wrap.lg`, `.txn-tree` / `.txn-node` /
  `.txn-children`, `.btn-warning`
