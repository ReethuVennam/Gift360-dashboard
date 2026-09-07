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

## 3. Regenerate Voucher button

**Component:** `src/shared/RegenerateVoucherButton.tsx`.

**Condition:** shown wherever an order's payment succeeded but its voucher
was not generated (`order_status` is `PAID`/`SUCCESS` and `voucher_status`
isn't `GENERATED`).

**Behavior — one-shot, no reason step:**
1. Click → button immediately disables and calls `POST /vouchers/retry` once.
2. On success, the button locks into a solid **yellow "Request Pending"**
   pill (can't be clicked again for that row).
3. On failure, it re-enables so the admin can retry.

Gated behind the `vouchers:retry` permission (same as the underlying
endpoint), using the existing `useAuth().can()` / tooltip convention.

**Used in:**
- Orders page (`src/pages/Orders.tsx`) — Voucher column, per row.
- Order detail drawer (`src/shared/OrderDetailDrawer.tsx`).
- Vouchers page (`src/pages/Vouchers.tsx`) — Failed and Retry-eligible tabs
  (replaced the old "Retry" + reason-modal flow).
- Customer lookup panel (`src/shared/CustomerLookupPanel.tsx`) — per order
  node in the transaction tree, using `order_status` / `voucher_status` /
  `order_item_id` fetched from `GET /orders?search=<ref>&size=1` (not the
  journey feed, which doesn't carry reliable status fields for this check).

## 4. Known backend gaps

- There is currently no real two-level (maker-checker) approval workflow on
  the backend — `/vouchers/retry` executes immediately once called. The
  "Request Pending" UI reflects that the request was submitted, not that a
  second admin has approved it.
- `/vouchers/retry` resets the item's status for reprocessing; it does not
  itself call the voucher provider (per the existing note in the codebase).

## 5. Files touched

- `src/shared/CustomerLookupPanel.tsx` (new)
- `src/shared/OrderDetailDrawer.tsx` (new, extracted from `Orders.tsx`)
- `src/shared/RegenerateVoucherButton.tsx` (new)
- `src/pages/Overview.tsx` — renders the lookup panel
- `src/pages/Orders.tsx` — uses the shared drawer + regenerate button
- `src/pages/Vouchers.tsx` — uses the regenerate button
- `src/styles/dashboard.css` — `.search-wrap.lg`, `.txn-tree` / `.txn-node` /
  `.txn-children`, `.btn-warning`
