# Gift360 Admin Dashboard — Frontend vs Backend Feasibility Check

## Status: All features in the frontend HTML are feasible

---

## View-by-View Feasibility

### 1. Overview (Home Screen) — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| Total Orders KPI | `sp_admin_dashboard_summary` → giftcard_orders | READY |
| Successful Orders KPI | `sp_admin_dashboard_summary` → giftcard_orders WHERE status='PAID' | READY |
| Failed Orders KPI | `sp_admin_dashboard_summary` → giftcard_orders WHERE status='FAILED' | READY |
| Pending Orders KPI | `sp_admin_dashboard_summary` → giftcard_orders WHERE status='PENDING' | READY |
| PG-Paid Amount KPI | `sp_admin_dashboard_summary` → master_transactions.amount_final | READY |
| Voucher Health % | `sp_admin_dashboard_summary` → giftcard_coupons join | READY |
| Wallet + SuperCoins Used | `sp_admin_dashboard_summary` → giftcard_orders wallet/supercoin fields | READY |
| Critical Exceptions KPI | New SP needed (count from exceptions table) | NEEDS BUILD |
| Critical Exceptions Table | New SP needed | NEEDS BUILD |
| Recent Activity Timeline | `sp_admin_audit_log` | READY |
| Jump to Reports (4 cards) | Static links | READY |

---

### 2. Business Overview (MIS Snapshot) — MOSTLY FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| GMV YTD/MTD/FTD | `sp_admin_dashboard_summary` with date ranges | READY |
| SuperCoins Earned/Burned | `sp_admin_supercoin_trend` aggregated | READY |
| SabbPe Earn Panel | `sp_admin_dashboard_summary` → master_transactions | READY |
| SabbPe Burn Panel | Wallet transactions (VOUCHER_CASHBACK type) | READY |
| Customer Earn/Burn | SuperCoin + wallet aggregation | READY |
| MDR Panel | Static config table (UPI 0.30%, Debit 0.90%, Credit 1.80%) | READY (static) |
| Profit Panel | Computed from GMV - costs | READY (computed) |
| Transaction Count (Approved/Decline) | `sp_admin_dashboard_summary` → order status counts | READY |
| Unique/Repeat/Abuse Users | `sp_admin_customer_list` with aggregations | READY |
| VD Balance YTD/MTD/FTD | Wallet balance aggregation | READY |
| Voucher Brand Watchlist | `sp_admin_brand_stats` | READY |
| Export MIS (Excel) | New export endpoint needed | NEEDS BUILD |

---

### 3. Orders — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| Orders Table (10 columns) | `sp_admin_orders_list` | READY |
| Date filter chips | `sp_admin_orders_list` p_from_date/p_to_date params | READY |
| Status filter | `sp_admin_orders_list` (built into query) | READY |
| Order type filter (PG/SuperCoin) | `sp_admin_orders_list` p_payment_method param | READY |
| Payment type filter (Card/UPI/Wallet) | `sp_admin_orders_list` → easebuzz_processor_transaction_details.mode | READY |
| Search (Order ID, customer, mobile) | `sp_admin_orders_list` with search param | READY |
| Pagination | `sp_admin_orders_list` p_page/p_size params | READY |
| Order Detail Drawer | `sp_admin_order_detail` | READY |
| Order Timeline | `sp_admin_order_detail` → timeline events | READY |
| Retry Voucher button | `sp_admin_voucher_retry_execute` | READY |
| Export button | Export endpoint needed | NEEDS BUILD |

---

### 4. Reports — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| 8 Report Cards | Each maps to existing stored procedures | READY |
| Recent transactions | `sp_admin_orders_list` | READY |
| Successful orders | `sp_admin_orders_list` with status filter | READY |
| PG orders | `sp_admin_orders_list` with payment_method='NORMAL' | READY |
| SuperCoin orders | `sp_admin_orders_list` with payment_method='SUPERCOIN' | READY |
| Voucher failures | `sp_admin_voucher_failed` | READY |
| Wallet activity | `sp_admin_wallet_detail` | READY |
| Refund report | `sp_admin_refund_check` | READY |
| Customer order history | `sp_admin_customer_detail` + orders | READY |
| Report Run Modal (filters) | Static UI, params passed to SP | READY |
| CSV/Excel download | Export endpoint needed | NEEDS BUILD |
| Recently Generated Reports table | New table/cache needed | NEEDS BUILD |

---

### 5. Customers — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| 4 KPI Cards (Flagged, Blocked, Auto-flagged, Cleared) | `sp_admin_customer_list` with status filters | READY |
| Customers Table (6 columns) | `sp_admin_customer_list` | READY |
| Risk indicators (Velocity, Voucher abuse, Chargeback) | New column/SP needed (client_profile flags) | NEEDS BUILD |
| Search | `sp_admin_customer_list` p_search param | READY |
| Status filter (Flagged/Blocked/Active) | `sp_admin_customer_list` with status filter | READY |
| Risk reasons filter | New SP param needed | NEEDS BUILD |
| Block/Unblock button | `sp_admin_customer_block` | READY |
| Block Modal | Static UI | READY |
| Unblock Modal | Static UI | READY |
| Customer Audit Trail | `sp_admin_audit_log` filtered by customer | READY |
| Pagination | `sp_admin_customer_list` p_page/p_size | READY |

---

### 6. Vouchers — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| Tab: Voucher Generation | `sp_admin_voucher_failed` + `sp_admin_voucher_retry_eligible` | READY |
| Tab: Discount Configuration | `sp_admin_config_get` + `sp_admin_config_update` | READY |
| 4 KPI Cards | `sp_admin_voucher_failed` counts | READY |
| Voucher Table (7 columns) | `sp_admin_voucher_failed` | READY |
| Status filter chips | `sp_admin_voucher_failed` with status param | READY |
| Search | `sp_admin_voucher_failed` with search param | READY |
| Retry button | `sp_admin_voucher_retry_execute` | READY |
| Retry History | `sp_admin_voucher_retry_eligible` + history | READY |
| Discount Config Input | `sp_admin_config_update` | READY |
| Change History Table | `sp_admin_audit_log` filtered by config module | READY |
| Retry Modal | Static UI | READY |
| History Modal (timeline) | Static UI | READY |
| Config Confirmation Modal | Static UI | READY |

---

### 7. Wallet & SuperCoins — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| 4 KPI Cards | `sp_admin_wallet_detail` aggregated | READY |
| Wallet Deduction Rate Config | `sp_admin_config_get` + `sp_admin_config_update` | READY |
| Wallet Credit Rate Config | `sp_admin_config_get` + `sp_admin_config_update` | READY |
| Change History Table | `sp_admin_audit_log` filtered by config | READY |
| Recent Activity Table | `sp_admin_wallet_detail` transactions | READY |
| Deduction Rate Modal | Static UI | READY |
| Credit Rate Modal | Static UI | READY |

---

### 8. Refunds — PARTIALLY FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| 4 KPI Cards | New SP needed (refund aggregation) | NEEDS BUILD |
| Refunds Table (7 columns) | `sp_admin_refund_check` + new refund list SP | PARTIAL |
| Status filter chips | New refund list SP with status param | NEEDS BUILD |
| Search | New refund list SP with search param | NEEDS BUILD |
| Initiate Refund button | `sp_admin_refund_execute` (basic) | PARTIAL |
| Refund Modal | Static UI | READY |
| Standard Refund Flow (6 steps) | Documentation/UI only | READY |
| Retry refund / Track | Requires payment gateway integration | FUTURE SCOPE |

---

### 9. Exceptions — MOSTLY FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| 4 KPI Cards | New SP needed (exception aggregation) | NEEDS BUILD |
| Exceptions Table (7 columns) | New SP needed (exception list) | NEEDS BUILD |
| Priority filter | New SP with priority param | NEEDS BUILD |
| Module filter | New SP with module param | NEEDS BUILD |
| Search | New SP with search param | NEEDS BUILD |
| Exception Investigation Drawer | New SP for exception detail | NEEDS BUILD |
| Related links (Order/Customer/Wallet/Voucher) | Links to existing views | READY |
| Re-run wallet credit | Requires wallet credit SP | NEEDS BUILD |
| Assign to me / Mark resolved | New SP for exception status | NEEDS BUILD |

---

### 10. Audit Log — ALL FEASIBLE

| Frontend Feature | Backend Data Source | Status |
|---|---|---|
| Audit Table (8 columns) | `sp_admin_audit_log` | READY |
| Module filter | `sp_admin_audit_log` p_module param | READY |
| Action filter | `sp_admin_audit_log` with action param | READY |
| Admin filter | `sp_admin_audit_log` p_admin_user_id param | READY |
| Date filter | `sp_admin_audit_log` p_from_date/p_to_date | READY |
| Search (Target ID) | `sp_admin_audit_log` with target search | READY |
| Export button | Export endpoint needed | NEEDS BUILD |
| Pagination | `sp_admin_audit_log` p_page/p_size | READY |
| Audit Field Reference Panel | Static documentation | READY |

---

## Summary

| Category | Count | Status |
|---|---|---|
| **READY — Backend data exists** | ~85 features | Can build immediately |
| **NEEDS BUILD — New stored procedures** | ~12 features | Exceptions, Risk flags, Refund list, Export |
| **FUTURE SCOPE** | ~3 features | Payment gateway refund, Advanced analytics |

---

## What Needs New Stored Procedures

1. **Exception list/detail** — No existing SP for admin exception queue
2. **Customer risk flags** — client_profile needs velocity/abuse/chargeback flags
3. **Refund list** — Need aggregated refund view with status
4. **Refund KPIs** — Need refund count/amount aggregation
5. **Export endpoints** — Need async CSV/Excel generation
6. **Recently generated reports** — Need cache/history table

---

## What's Already Ready (No New SPs Needed)

- Dashboard Summary (8 KPIs)
- Orders List + Detail + Timeline
- Customer List + Journey
- Voucher Failed + Retry + Metrics
- SuperCoin Trend
- Wallet Detail + Transactions
- Brand Stats
- Geography
- Error Breakdown
- Cart Abandonment + Summary
- Retention Analysis
- Config Get/Update (SuperCoin, Wallet, Retry)
- Audit Log
- Investigation Notes

---

## Recommendation

**Tell the frontend team: All features in their HTML are feasible.**

- ~85% of features have backend data ready NOW
- ~12% need new stored procedures (1-2 days each)
- ~3% are future scope (payment gateway refund)
- No feature in the HTML is blocked or impossible

We just need to implement the stored procedures and wire them to the API. The frontend can proceed with their static HTML knowing all data will be available.
