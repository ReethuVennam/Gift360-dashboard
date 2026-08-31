# Gift360 Admin Dashboard — PRD Gaps & Recommendations

> **Note**: No PRD document was found in the workspace. This document identifies operational pain points discovered from codebase analysis and recommends capabilities that would provide real operational value.

---

## 1. Missing Pain Points Discovered from Codebase

| Pain Point | Evidence in Code/DB | Business Impact | Proposed Admin Capability | Priority | Feasibility |
|---|---|---|---|---|---|
| **No payment refund API** | No refund endpoint in codebase; GiftcardCouponService.refundSuperCoin() only handles SuperCoin refunds | Cannot process customer refund requests from admin | Refund management endpoint (requires payment gateway integration) | HIGH | FUTURE SCOPE (provider dependent) |
| **Voucher generation failures not visible in real-time** | GiftcardCouponService catches EVC failures but only persists last_evc_response_code/msg on order items | Failed vouchers require manual DB investigation | Real-time failure alerts + failure dashboard | HIGH | READY (data exists) |
| **Concurrent webhook + frontend coupon race condition** | SabbPePaymentCallbackController has deadlock retry (3 attempts) | Occasional deadlock errors in production | Deadlock monitoring + retry visibility | MEDIUM | READY |
| **Wallet cashback trigger side effects not visible** | trg_giftcard_coupons_after_insert_cashback modifies client_wallet silently | Admin cannot see when/why wallet balance changed | Wallet transaction audit trail view | HIGH | READY (client_wallet_transactions exists) |
| **SuperCoin hold expiry not monitored** | coin_hold_expiry stored but no monitoring | Stale holds consume user's SuperCoin balance | Hold expiry dashboard + alerts | MEDIUM | READY |
| **No automated suspicious activity detection** | No velocity checks, no fraud flags | Fraudulent orders not caught automatically | Suspicious activity rules engine | LOW | FUTURE SCOPE |
| **Gift delivery status not trackable** | gift_sent_at, gift_delivery_channel stored but no delivery confirmation | Cannot confirm gift was delivered | Gift delivery status tracking | MEDIUM | PARTIAL (depends on email provider) |
| **Invoice generation failures not visible** | InvoiceGenerationService catches exceptions but only logs | Failed invoices not tracked | Invoice failure dashboard | LOW | READY |
| **Brand cashback percentage stored as free-text** | GiftVouchersBrands.discount is String, parsed with try-catch | Malformed values silently treated as 0 | Brand configuration validation | LOW | READY |
| **SuperCoin earn failures not retried** | GiftcardCouponService.issueSuperCoinEarnAfterVoucherSuccess catches but doesn't retry | Lost SuperCoin earns | SuperCoin earn retry mechanism | MEDIUM | FUTURE SCOPE |

---

## 2. Requirements to Modify

| Requirement | Issue | Recommendation |
|---|---|---|
| Customer blocking | ClientAccountStatus enum exists but no admin API | Add POST /api/v1/admin/customers/{id}/status — straightforward |
| Wallet monitoring | client_wallet_transactions exists but no admin view | Add read endpoint — data already available |
| Voucher retry | VoucherRetryService exists but no admin UI integration | Expose existing service via admin API |

---

## 3. Requirements to Defer

| Requirement | Reason |
|---|---|
| Payment refund | Requires payment gateway integration (Easebuzz/SabbPe refund API). High risk, should be separate phase with thorough testing |
| Wallet configuration management | Currently in application.properties. Live config requires cache invalidation and careful rollout |
| SuperCoin earn retry | Requires understanding of Flipkart's idempotency guarantees. Defer until volume justifies |

---

## 4. Requirements That Are Unnecessary

| Requirement | Reason |
|---|---|
| Duplicate business data tables | Admin should NOT create copies of orders, customers, vouchers. Query existing data directly |
| Real-time WebSocket updates | Admin dashboard can use polling initially. WebSocket is premature optimization |
| Complex reporting engine | Start with pre-built reports. Add ad-hoc reporting only if requested |

---

## 5. Requirements That Are Technically Infeasible

| Requirement | Reason |
|---|---|
| Direct database modification from frontend | Security risk. All writes must go through admin backend API |
| Bypass existing Gift360 business logic | Cashback trigger, voucher generation, SuperCoin flows must not be circumvented |
| Modify existing Gift360 customer-facing APIs | Admin backend must be separate application |

---

## 6. Business Clarifications Needed

| Question | Impact |
|---|---|
| What payment refund operations should admin support? | Full refund? Partial refund? Which gateway? |
| Should admin be able to manually credit wallet? | Current flow is trigger-driven. Manual credit bypasses business rules |
| Should admin be able to manually generate vouchers? | Current flow is EVC API driven. Manual generation bypasses provider |
| What SuperCoin operations should admin support? | Earn retry? Manual refund? Hold cancellation? |
| Should admin configuration changes take effect immediately? | Some settings (SuperCoin cap, wallet max) are application.properties — live changes require cache |

---

## 7. Recommended Additional Operational Features

| Feature | Evidence | Value |
|---|---|---|
| **Order stuck in PENDING** | No monitoring for orders that never reach PAID or FAILED | Prevents revenue leakage |
| **Payment success but order not updated** | SabbPePaymentCallbackController handles this but no alerting | Critical operational issue |
| **Duplicate payment callbacks** | Idempotency exists but duplicates not logged | Audit trail gap |
| **Wallet balance discrepancy** | No reconciliation between wallet balance and transaction history | Financial accuracy |
| **SuperCoin hold without redemption** | coin_hold_expiry exists but no monitoring | User experience issue |
| **Brand availability monitoring** | stock_available in brands table but no alerting | Prevents selling unavailable vouchers |
