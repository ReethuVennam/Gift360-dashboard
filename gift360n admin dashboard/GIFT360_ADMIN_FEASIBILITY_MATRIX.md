# Gift360 Admin Dashboard — PRD Feasibility Matrix

> **IMPORTANT NOTE**: No PRD/Technical Blueprint document was found in the workspace. This feasibility matrix is constructed based on the analysis prompt's described requirements and the existing codebase capabilities. The PRD should be provided for a complete requirement-by-requirement assessment.

---

## 1. Assumed PRD Requirements (Based on Analysis Prompt)

Since the PRD was not found, the following requirements are inferred from the detailed analysis prompt:

| # | Assumed Requirement |
|---|---|
| 1 | Dashboard summary (orders, revenue, customers, vouchers) |
| 2 | Order listing with search, filter, pagination |
| 3 | Order detail view |
| 4 | Customer listing with search, filter |
| 5 | Customer detail / journey view |
| 6 | Voucher status monitoring |
| 7 | Failed voucher detection |
| 8 | Voucher retry capability |
| 9 | SuperCoin monitoring (earned, burnt, refunded) |
| 10 | Wallet monitoring |
| 11 | Payment status monitoring |
| 12 | Brand-wise analytics |
| 13 | Geographic analytics |
| 14 | Cart abandonment analysis |
| 15 | Retention/cost analysis |
| 16 | Error breakdown / failure analysis |
| 17 | Customer blocking/suspension |
| 18 | Order status management (refund, cancel) |
| 19 | Wallet configuration management |
| 20 | Brand configuration management |
| 21 | Admin user management (RBAC) |
| 22 | Audit logging |
| 23 | Data export (CSV/Excel) |
| 24 | Feedback monitoring |

---

## 2. Feasibility Matrix

| # | Requirement | Existing Support | Tables | Feasibility | Recommendation |
|---|---|---|---|---|---|
| 1 | Dashboard summary | **A** — AdminDashboardController.getSummary() exists | giftcard_orders, giftcard_order_items, giftcard_coupons | READY | Expose via Admin Backend with RBAC |
| 2 | Order listing | **A** — AdminDashboardController.getOrders() exists | giftcard_orders, client_profile, master_transactions, easebuzz_processor_transaction_details, giftcard_order_items, giftcard_coupons | READY | Refactor to service layer, add RBAC |
| 3 | Order detail | **B** — getOrderDetailsByOrderNumber() exists but is customer-scoped | giftcard_orders, giftcard_order_items, giftcard_coupons, coupon_usage | ADMIN BACKEND REQUIRED | Create admin-specific endpoint with no client scoping |
| 4 | Customer listing | **A** — AdminDashboardController.getCustomerStats() exists | giftcard_orders, client_profile, feedback | READY | Expose via Admin Backend with RBAC |
| 5 | Customer journey | **A** — AdminDashboardController.getCustomerJourney() exists | giftcard_orders, giftcard_order_items, giftcard_coupons, feedback | READY | Expose via Admin Backend |
| 6 | Voucher status | **A** — Already in order listing query | giftcard_coupons, giftcard_order_items | READY | Include in order detail |
| 7 | Failed voucher detection | **A** — sp_get_failed_gift_vouchers exists | giftcard_orders, giftcard_order_items, master_transactions | READY | Expose via Admin Backend |
| 8 | Voucher retry | **A** — VoucherRetryService.executeRetry() exists | giftcard_order_items, voucher_retry_log | READY | Expose via Admin Backend with audit |
| 9 | SuperCoin monitoring | **A** — AdminDashboardController.getSuperCoinTrend() exists | giftcard_orders | READY | Expose via Admin Backend |
| 10 | Wallet monitoring | **C** — ClientWalletService.getClientBalance() exists but is client-scoped | client_wallet, client_wallet_transactions | PARTIAL | Create admin-specific wallet view |
| 11 | Payment status | **A** — Already in order listing query | master_transactions, easebuzz_processor_transaction_details | READY | Include in order detail |
| 12 | Brand analytics | **A** — AdminDashboardController.getBrandStats() exists | giftcard_order_items, giftcard_orders, giftcard_coupons | READY | Expose via Admin Backend |
| 13 | Geographic analytics | **A** — AdminDashboardController.getGeography() exists | giftcard_orders, master_transactions, easebuzz_processor_transaction_details | READY | Expose via Admin Backend |
| 14 | Cart abandonment | **A** — AdminDashboardController.getAbandonedCarts() exists | giftcard_orders, giftcard_order_items, client_profile | READY | Expose via Admin Backend |
| 15 | Retention analysis | **A** — AdminDashboardController.getRetentionTrend() exists | giftcard_orders, giftcard_order_items, giftcard_coupons | READY | Expose via Admin Backend |
| 16 | Error breakdown | **A** — AdminDashboardController.getErrorBreakdown() exists | giftcard_order_items, giftcard_orders | READY | Expose via Admin Backend |
| 17 | Customer blocking | **D** — ClientAccountStatus enum exists (suspended/closed), but no admin API | client_profile | GIFT360 APPLICATION CHANGE | Add admin endpoint to update client_account_status |
| 18 | Order refund | **G** — No payment refund API exists | - | FUTURE SCOPE | Requires payment gateway refund integration |
| 19 | Wallet config | **G** — Wallet rates are in application.properties | - | FUTURE SCOPE | Requires new config management UI |
| 20 | Brand config | **C** — brands table exists, no admin API | brands, giftcard_brand_limits | PARTIAL | Create admin brand management endpoints |
| 21 | Admin RBAC | **H** — No admin user system exists | - | TECHNICALLY NOT FEASIBLE (current auth is customer-only) | Build new admin auth module |
| 22 | Audit logging | **G** — No audit system exists | - | FUTURE SCOPE | New admin_audit_logs table + service |
| 23 | Data export | **G** — No export capability | - | FUTURE SCOPE | Add async CSV/Excel export |
| 24 | Feedback monitoring | **A** — FeedbackService exists, already in customer stats | feedback | READY | Expose via Admin Backend |

---

## 3. Classification Summary

| Classification | Count | Requirements |
|---|---|---|
| **A — READY** | 14 | Summary, orders, customers, journey, vouchers, retry, SuperCoin, brands, geography, abandoned, retention, errors, feedback, payment |
| **B — ADMIN BACKEND REQUIRED** | 1 | Order detail (needs admin-scoped endpoint) |
| **C — PARTIAL** | 2 | Wallet monitoring, brand config |
| **D — GIFT360 APPLICATION CHANGE** | 1 | Customer blocking |
| **E — DATABASE CHANGE** | 0 | (covered by new admin tables) |
| **F — PROVIDER DEPENDENT** | 0 | |
| **G — FUTURE SCOPE** | 4 | Payment refund, wallet config, audit logging, data export |
| **H — TECHNICALLY NOT FEASIBLE** | 1 | Admin RBAC (requires new auth module) |
| **I — BUSINESS DECISION REQUIRED** | 1 | Payment refund (which gateway operations to support) |

---

## 4. Key Findings

### What Already Exists
The existing `AdminDashboardController` already provides ~80% of the read-only analytics functionality. It uses raw JdbcTemplate queries with X-Admin-Key authentication.

### What Needs to Change
1. **Architecture**: Move from raw JdbcTemplate to proper service/repository layer
2. **Security**: Replace X-Admin-Key with RBAC (admin users, roles, permissions)
3. **Admin-scoped endpoints**: Customer blocking, order management
4. **Missing capabilities**: Audit logging, data export, payment refund

### What Should NOT Be Built
- **Payment refund**: Requires payment gateway integration, high risk, should be separate phase
- **Wallet configuration**: Currently in application.properties, changing requires restart — consider if this needs live management
- **Duplicate data stores**: Admin should NOT duplicate gift360 business data
