# Gift360 — Complete Business Flow Analysis

## 1. Normal Order Flow (Payment Gateway)

```
Customer adds items to cart
    ↓
POST /api/v1/giftcards/orders (GiftcardOrderController)
    ↓
GiftcardOrderService.createOrderFromDto()
    ├── Validate client exists (client_profile)
    ├── Validate account not suspended/closed
    ├── Server-side price validation (BrandPriceValidator)
    ├── Recompute line totals (never trust client amounts)
    ├── Validate wallet amount (if wallet_used)
    │   ├── Check wallet balance (client_wallet.voucher_cashback_balance)
    │   ├── Check 50% of cashback value cap
    │   └── Check ₹100 max redeem amount
    ├── Validate brand monthly limits
    ├── Wallet sufficiency pre-check (last known EVC balance)
    └── Save order (PENDING) + order items
    ↓
POST /api/v1/giftcards/orders/{orderNumber}/initiate-payment
    ↓
PaymentInitiationService.initiatePayment()
    ├── Generate payment token (SabbPe gateway)
    ├── Store checkout URL on order (payment_url)
    └── Return checkout URL to frontend
    ↓
Customer completes payment on hosted checkout page
    ↓
POST /api/payment/sabbpe/callback (SabbPePaymentCallbackController)
    ↓
GiftcardOrderService.updateOrderStatusFromSabbPeCallback()
    ├── Map payment status to OrderStatus
    ├── Validate callback amount against gateway transaction
    │   ├── Check master_transactions.amount_final
    │   ├── Check master_transactions.amount_requested
    │   └── Compare with expected net payable
    ├── Debit wallet (if wallet_used) BEFORE marking PAID
    │   └── SP: redeem_voucher_cashback → client_wallet UPDATE
    ├── Update order status to PAID
    └── Set paid_at timestamp
    ↓
CouponValidationService.finalizeReservationsForOrder()
    ↓
GiftcardCouponService.fetchCouponsAndSendEmail()
    ├── Verify payment status (master_transactions)
    ├── Acquire PESSIMISTIC_WRITE lock on order items
    ├── Check no existing coupon (existsByOrderItemId)
    ├── Call ValueDesign GetEVC API
    ├── Parse response, store coupon (giftcard_coupons)
    │   └── TRIGGER: trg_giftcard_coupons_after_insert_cashback
    │         └── Credit wallet cashback (client_wallet)
    ├── Create giftcard_coupon_items rows
    ├── Redeem SuperCoin hold (if applicable)
    ├── Issue SuperCoin earn (if applicable)
    └── Trigger invoice email
```

**Key Observations**:
- Order amount is ALWAYS server-computed
- Wallet debit happens BEFORE order status change (fail-safe)
- Voucher generation is triggered by payment callback
- Cashback crediting is trigger-driven (database side)
- Deadlock retry (3 attempts) for concurrent coupon generation

---

## 2. SuperCoin Burn-and-Order Flow

```
Customer selects "Pay with SuperCoins"
    ↓
POST /api/v1/supercoin/initHold (FlipkartScController)
    ├── Cap check: coins ≤ 20% of voucher value × supercoin_multiplier
    ├── Call Flipkart initHold API
    ├── Persist sc_merchant_txn_id, sc_reference_txn_id, coins_redeemed on order
    └── Handle SC0411 stale hold (unhold + retry with new txnId)
    ↓
POST /api/v1/supercoin/authorizeHold
    └── OTP authorization with Flipkart
    ↓
POST /api/v1/supercoin/burn-and-order (FlipkartScController)
    ↓
SuperCoinBurnOrderService.burnAndOrder()
    ├── IDOR guard (request.clientId == JWT userId)
    ├── Validate order is PENDING
    ├── Amount guard (request.amount == order.totalAmount)
    ├── Compute coin count: ceil(amount × (1 + surcharge%/100))
    ├── Hold guard (sc_merchant_txn_id exists, coins match)
    ├── Resolve Flipkart identity server-side (client_profile.mobile)
    ├── Mark order PAID
    │   ├── status = PAID
    │   ├── paid_at = now
    │   ├── earn_cashback = false (no cashback on SuperCoin orders)
    │   └── payment_method = "SUPERCOIN"
    └── GiftcardCouponService.fetchCouponsForSuperCoinOrder()
          ├── 1. Redeem hold (Flipkart redeemHold)
          ├── 2. Generate voucher (EVC getevc)
          ├── 3. If voucher fails → refund coins to Flipkart
          ├── 4. If voucher succeeds → earn SuperCoins (separate %)
          └── 5. Trigger invoice
```

**Key Observations**:
- SuperCoin identity derived server-side (never from client)
- Coin hold MUST exist before burn-and-order
- Voucher failure triggers automatic coin refund
- Earn rate is configurable separately from redemption surcharge

---

## 3. Wallet Flow

### 3.1 Wallet Balance
```
POST /api/wallet/{clientId} (ClientWalletController)
    → ClientWalletService.getClientBalance()
        → ClientWalletRepository.findByClientId() → client_wallet
```

### 3.2 Wallet Cashback Credit (TRIGGER-DRIVEN)
```
TRIGGER: trg_giftcard_coupons_after_insert_cashback
    ↓ (fires on giftcard_coupons INSERT with status='ISSUED')
    ├── Load order: giftcard_order_items → giftcard_orders
    ├── Guard: earn_cashback=1 AND coins_redeemed=NULL/0
    ├── Guard: no existing VOUCHER_CASHBACK transaction
    ├── Compute discount: Σ(line_total × customer_discount_percent/100)
    ├── Scale by payable_ratio: discount × (payable_amount / total_amount)
    ├── Credit client_wallet.voucher_cashback_balance
    └── Insert client_wallet_transactions record
```

### 3.3 Wallet Redemption
```
POST /api/wallet/redeem (ClientWalletController)
    → ClientWalletService.redeemCashback()
        → ClientWalletRepository.redeemVoucherCashback() → SP
            ├── Deduct from voucher_cashback_balance
            └── Insert client_wallet_transactions (REDEEM)
```

### 3.4 Wallet Balance Computation
- `voucher_cashback_balance`: Spendable cashback from vouchers
- `total_balance`: Sum of all wallet components
- `pending_earn_fraction`: Accumulated fractional SuperCoins (not yet issued)
- Max wallet usage: 50% of cart's cashback value, up to ₹100

---

## 4. Voucher Generation Flow

```
Payment confirmed (callback or burn-and-order)
    ↓
GiftcardCouponService.fetchCouponsAndSendEmail()
    ↓
    ├── Verify payment: master_transactions.status = SUCCESS/PAID
    ├── For each order item:
    │   ├── PESSIMISTIC_WRITE lock (findByIdForUpdate)
    │   ├── Double-check no existing coupon
    │   ├── Parse meta JSON → brand_code
    │   ├── Build EVC request (brand code, amount, customer details)
    │   ├── Call ValueDesign GetEVC API
    │   ├── Parse response
    │   │   ├── responseCode = "0" → SUCCESS
    │   │   │   └── Decrypt data, parse EvcResponse
    │   │   └── responseCode != "0" → FAILURE
    │   │       └── Persist failure code/message on order item
    │   ├── Store coupon (giftcard_coupons)
    │   │   └── TRIGGER fires → wallet cashback
    │   └── Create giftcard_coupon_items (one per physical card)
    ├── After all items:
    │   ├── Redeem SuperCoin hold (if applicable)
    │   ├── Issue SuperCoin earn (if applicable)
    │   └── Trigger invoice email
    └── Return result
```

**Key Observations**:
- PESSIMISTIC_WRITE lock prevents duplicate voucher generation
- READ_COMMITTED isolation ensures post-lock visibility
- Unique constraint on order_item_id is defense-in-depth
- EVC failure reason is persisted (last_evc_response_code/msg)

---

## 5. Voucher Retry Flow

```
Admin/Vendor detects "Paid but Voucher Not Received"
    ↓
POST /api/v1/voucher/failed (VoucherRetryController)
    → SP: sp_get_failed_gift_vouchers
        → Returns: orders where status=PAID AND item status=0
    ↓
POST /api/v1/voucher/retry-eligible
    → SP: sp_get_retry_eligible_vouchers
        → Filters by max attempts and retry window
    ↓
POST /api/v1/voucher/retry {originalOrderNumber, orderItemId}
    ↓
VoucherRetryService.executeRetry()
    ├── Validate orderItemId provided
    ├── Idempotency check (2-minute window)
    ├── Find matching failed items
    ├── Check retry limit (max 3)
    ├── Check retry window (72 hours)
    ├── Generate retry_order_id: R_{timestamp}_{originalOrderNumber}
    ├── Call ValueDesign GetEVC API
    ├── Log retry (SP: sp_log_voucher_retry)
    ├── Update item status on success (SP: sp_update_order_item_status)
    └── Return result
```

---

## 6. Refund Flow

### 6.1 SuperCoin Refund (Automatic)
```
Voucher generation fails (burn-and-order)
    ↓
GiftcardCouponService.refundSuperCoin()
    ├── Check coins were redeemed
    ├── Check not already fully refunded
    ├── Resolve Flipkart identity from client_profile
    ├── Build refund request (redeemTxnId as reference)
    └── Call FlipkartScRefundService.refundRaw()
```

### 6.2 Payment Refund (NOT IMPLEMENTED)
- No payment refund API exists in the codebase
- Order status can be set to REFUNDED but no actual gateway refund call
- **This is a gap for admin dashboard**

---

## 7. Customer Blocking/Suspension

### 7.1 Existing Mechanism
- `client_profile.client_account_status` enum: `active`, `suspended`, `pending_activation`, `closed`
- `GiftcardOrderService.createOrderFromDto()` checks:
  ```java
  if (accountStatus == ClientAccountStatus.suspended || accountStatus == ClientAccountStatus.closed) {
      throw new IllegalArgumentException("Your account is not active. Please contact support.");
  }
  ```
- **No admin API to change account status**
- **No blocking/blacklist mechanism beyond account status**

### 7.2 What's Missing
- No fraud flag
- No IP-based blocking
- No order velocity checks
- No automated suspicious activity detection

---

## 8. SuperCoin Flow

### 8.1 Earn Flow
```
Voucher generated successfully
    ↓
GiftcardCouponService.issueSuperCoinEarnAfterVoucherSuccess()
    ├── Check: order PAID, earn_cashback=false (SuperCoin orders don't earn)
    ├── Check: not already coin_issued
    ├── Compute: netAmountPaid × earnPercent/100
    ├── Accumulate fractional coins in wallet.pending_earn_fraction
    ├── Issue integer coins via FlipkartScEarnService.addRaw()
    ├── Update order: coins_earned, coin_issued=true
    └── Save wallet (pending_earn_fraction)
```

### 8.2 Redeem Flow
```
initHold → authorizeHold → burn-and-order → redeemHold
    ↓
All via FlipkartScController → FlipkartSuperCoinClient
    ↓
Order tracks: sc_merchant_txn_id, sc_reference_txn_id, sc_redeem_txn_id, coins_redeemed
```

### 8.3 Refund Flow
```
Voucher generation fails
    ↓
GiftcardCouponService.refundSuperCoin()
    → FlipkartScRefundService.refundRaw()
    → Update order: coins_refunded
```

---

## 9. Invoice Flow

```
Voucher generated successfully
    ↓
GiftcardOrderService.triggerInvoiceEmailForPaidOrder()
    ├── Verify order is PAID
    ├── InvoiceDataService.buildInvoiceData()
    │   ├── Compute: subTotal, walletAmount, couponDiscount, netAmountPaid
    │   └── Build: customer name, email, order details
    ├── InvoiceGenerationService.saveInvoicePDF()
    │   └── Generate PDF using iText 7
    └── EmailServiceClient.sendInvoiceEmail()
        └── POST to notificationsuat.sabbpe.com
```

---

## 10. Feedback Flow

```
POST /api/v1/feedback (FeedbackController)
    → FeedbackService.submit()
        → Insert into feedback table
```

---

## 11. Key Business Rules

1. **Order amount is always server-computed** — client amounts are never trusted
2. **Wallet debit before order status change** — fail-safe against free vouchers
3. **Cashback only on voucher success** — trigger fires on coupon INSERT, not order PAID
4. **SuperCoin orders don't earn cashback** — earn_cashback=false set server-side
5. **Max 3 voucher retry attempts** — configurable
6. **72-hour retry window** — configurable
7. **2-minute idempotency window** — prevents rapid duplicate retries
8. **SuperCoin cap: 20% of voucher value** — live-configurable
9. **Wallet max usage: 50% of cashback value, up to ₹100** — configurable
10. **Platform fee: ₹5 flat** — applied to all orders
11. **Per-line-item quantity cap: 3** — same brand/denomination in one order
12. **Account suspension blocks order creation** — but no admin API to suspend
