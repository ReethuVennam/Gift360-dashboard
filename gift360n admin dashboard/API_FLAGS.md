# API Flags — Contradictions & Decisions Needed

APIs with behavior that contradicts the standalone admin dashboard model or requires discussion before implementation.

---

## 0. Geography Endpoint — REMOVED

**Endpoint:** `GET /api/v1/admin/geography` (deleted)

**Flag:** No reliable source for city/state data. `client_profile.client_location` is optional (lat/long only when user shares). Payment gateway doesn't provide location either.

**Decision:** Endpoint removed from backend, SQL, and API spec.

---

## 1. Voucher Retry Execute (SP 11)

**Endpoint:** `POST /api/v1/admin/vouchers/retry-execute`

**Flag:** Placeholder only — SP just resets `status = 0`, doesn't call EVC API.

**Why:** The actual retry logic lives in the original Gift360 backend (`VoucherRetryService.java`), which calls `EvcService.getEvcApi()` to generate the voucher, logs attempts, and updates status.

**Decision needed:**
- Option A: Frontend calls original backend directly (`POST /api/v1/voucher-retry/execute`)
- Option B: Admin backend proxies request to original backend (adds dependency)
- Option C: Keep as placeholder, document as "future scope"

**Recommendation:** Option A for now. Proxy later if needed.

---

## 2. Config Update (SP 21)

**Endpoint:** `PUT /api/v1/admin/config/update`

**Flag:** Does NOT persist — just echoes back the input values.

**Why:** SuperCoin/wallet/retry configs are hardcoded in the original backend. No shared config table exists. Writing to a separate admin config table means the original backend won't read it.

**Decision needed:**
- Option A: Create a shared `admin_config` table, original backend reads from it
- Option B: Admin dashboard shows config as read-only (view only)
- Option C: Keep as placeholder, manual config changes go through code deploys

**Recommendation:** Option B (read-only) until shared config is implemented.

---

## 3. Voucher Retry Metrics (SP 10) — Second Result Set

**Endpoint:** `GET /api/v1/admin/vouchers/retry-metrics`

**Flag:** Returns 2 result sets. Second query (today's retries) uses `created_at` as proxy for retry time since `updated_at` doesn't exist on `giftcard_order_items`.

**Why:** `giftcard_order_items` has no `updated_at` column. The "retries today" metric is approximate — it counts items created today, not items retried today.

**Decision needed:**
- Option A: Accept approximation (good enough for dashboard)
- Option B: Create `admin_retry_log` table to track actual retry attempts with timestamps

---

## 4. SuperCoin Redemption Flow

**Endpoints:** `GET /api/v1/admin/supercoin/trend`, `GET /api/v1/admin/wallet/detail`

**Flag:** SuperCoin redemption is trigger-driven (`trg_giftcard_coupons_after_insert_cashback`), not application-driven. `coins_redeemed` on `giftcard_orders` is populated on PENDING orders as a hold; actual redemption happens only after PAID + voucher generated.

**Why:** The dashboard shows SuperCoin data, but cannot initiate or reverse SuperCoin actions. Burnt calculation relies on voucher generation status.

**Decision needed:** Accept as read-only analytics. No admin action possible.

---

## 5. Payment Refund

**Endpoint:** `GET /api/v1/admin/refund/check`

**Flag:** Check only — no actual refund execution. No payment refund API exists in the original backend.

**Why:** Refund execution needs gateway integration (EaseBuzz), which is out of scope.

**Decision needed:** Accept as informational only. Actual refunds handled manually or via future gateway integration.

---

## 6. Customer Block (SP 7)

**Endpoint:** `POST /api/v1/admin/customer/block`

**Flag:** Works, but `client_account_status` is ENUM — must use exact values: `active`, `pending_activation`, `suspended`, `closed`. Using `BLOCKED` or other invalid values will fail silently or cause errors.

**Why:** The original backend uses these exact ENUM values. No validation in SP.

**Decision needed:** Frontend must enforce valid status values. Consider adding validation in the Java layer.

---

## 7. Cross-DB Query Dependencies

**Affected SPs:** 2, 3, 9, 10, 15, 19

**Flag:** These SPs join `sabbpegiftvouchers` ↔ `sabbpepayments` using `COLLATE utf8mb4_unicode_ci` on both sides. If the payments DB schema changes or collation differs, queries break silently.

**Decision needed:** Monitor for schema drift. Consider adding health check endpoint that tests cross-DB connectivity.

---

## 8. Audit Log (SP 22)

**Endpoint:** `GET /api/v1/admin/audit-log`

**Flag:** Only logs actions performed through the admin dashboard. Original backend actions (orders, payments, etc.) are not captured.

**Why:** `admin_audit_logs` is a separate table from the original backend's audit trail.

**Decision needed:** Accept partial audit trail, or merge with original backend's audit system later.

---

*Last updated: 2026-08-28*
