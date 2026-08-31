# Gift360 Database — Dependency Map

## 1. Application → Service → Repository → DB Object → Trigger → Table

### 1.1 Order Creation Flow

```
GiftcardOrderController.createGiftcardOrder()
  └── GiftcardOrderService.createOrderFromDto()
        ├── ClientProfileRepository.findById()          → client_profile (READ)
        ├── ClientWalletRepository.findByClientId()     → client_wallet (READ)
        ├── GiftVouchersBrandsRepository                → giftvouchers_public (READ)
        ├── GiftcardBrandLimitRepository                → giftcard_brand_limits (READ)
        ├── GiftcardClientBrandMonthlyUsageRepository   → giftcard_client_brand_monthly_usage (READ)
        ├── GiftcardOrderRepository.saveAndFlush()      → giftcard_orders (WRITE)
        ├── GiftcardOrderItemRepository.deleteByOrderId() → giftcard_order_items (DELETE)
        └── GiftcardOrderItemRepository.saveAll()       → giftcard_order_items (WRITE)
```

### 1.2 Payment Callback Flow

```
SabbPePaymentCallbackController.receiveCallback()
  └── GiftcardOrderService.updateOrderStatusFromSabbPeCallback()
        ├── GiftcardOrderRepository.findByOrderNumber()   → giftcard_orders (READ)
        ├── MasterTransactionRepository.findAmounts()      → master_transactions (READ)
        ├── ClientWalletRepository.redeemVoucherCashback() → SP: redeem_voucher_cashback
        │     └── client_wallet (UPDATE), client_wallet_transactions (INSERT)
        └── GiftcardOrderRepository.save()                → giftcard_orders (UPDATE)
  └── GiftcardCouponService.fetchCouponsAndSendEmail()
        ├── GiftcardOrderRepository                      → giftcard_orders (READ)
        ├── GiftcardOrderItemRepository.findByIdForUpdate() → giftcard_order_items (LOCK+READ)
        ├── GiftcardCouponRepository.existsByOrderItemId() → giftcard_coupons (READ)
        ├── EvcService.getEvcApi()                       → External API (ValueDesign)
        ├── GiftcardCouponRepository.saveAllAndFlush()   → giftcard_coupons (WRITE)
        │     └── TRIGGER: trg_giftcard_coupons_after_insert_cashback
        │           ├── giftcard_order_items (READ)
        │           ├── giftcard_orders (READ)
        │           ├── client_wallet (READ/INSERT/UPDATE)
        │           └── client_wallet_transactions (INSERT)
        ├── GiftcardCouponItemRepository.save()          → giftcard_coupon_items (WRITE)
        └── FlipkartScRedeemService.redeemConfirmRaw()   → External API (Flipkart)
  └── GiftcardOrderService.triggerInvoiceEmailForPaidOrder()
        ├── InvoiceDataService.buildInvoiceData()
        ├── InvoiceGenerationService.saveInvoicePDF()
        └── EmailServiceClient.sendInvoiceEmail()        → External API (Email)
```

### 1.3 SuperCoin Burn-and-Order Flow

```
FlipkartScController.burnAndOrder()
  └── SuperCoinBurnOrderService.burnAndOrder()
        ├── GiftcardOrderRepository.findByOrderNumber()   → giftcard_orders (READ)
        ├── ClientProfileRepository.findById()            → client_profile (READ)
        ├── GiftcardOrderRepository.saveAndFlush()        → giftcard_orders (WRITE)
        └── GiftcardCouponService.fetchCouponsForSuperCoinOrder()
              ├── FlipkartScRedeemService.redeemConfirmRaw() → External API (Flipkart)
              ├── GiftcardCouponService.fetchAndStoreCoupons() → (see 1.2)
              │     └── TRIGGER: trg_giftcard_coupons_after_insert_cashback
              ├── FlipkartScRefundService.refundRaw()     → External API (Flipkart) [on failure]
              └── FlipkartScEarnService.addRaw()          → External API (Flipkart) [on success]
```

### 1.4 Wallet Balance Flow

```
ClientWalletController.getClientBalance()
  └── ClientWalletService.getClientBalance()
        └── ClientWalletRepository.findByClientId()       → client_wallet (READ)
```

### 1.5 Voucher Retry Flow

```
VoucherRetryController.executeRetry()
  └── VoucherRetryService.executeRetry()
        ├── GiftVoucherFailedRepository.findFailedByClientId() → SP: sp_get_failed_gift_vouchers
        │     └── giftcard_orders, giftcard_order_items, client_profile, master_transactions (READ)
        ├── VoucherRetryEligibilityRepository             → SP: sp_get_retry_eligible_vouchers
        │     └── master_transactions, giftcard_orders, giftcard_order_items (READ)
        ├── VoucherRetryLogRepository.findByOriginalOrderNumber() → voucher_retry_log (READ)
        ├── EvcService.getEvcApi()                        → External API (ValueDesign)
        ├── SP: sp_log_voucher_retry                      → voucher_retry_log (WRITE)
        └── SP: sp_update_order_item_status               → giftcard_order_items (UPDATE)
```

### 1.6 Admin Dashboard Flow (Existing)

```
AdminDashboardController.getSummary()
  └── JdbcTemplate.queryForMap()
        ├── giftcard_orders (READ)
        ├── giftcard_order_items (READ)
        ├── giftcard_coupons (READ)
        └── SuperCoin subquery → giftcard_orders (READ)

AdminDashboardController.getOrders()
  └── JdbcTemplate.queryForList()
        ├── giftcard_orders (READ)
        ├── client_profile (READ)
        ├── master_transactions (READ)
        ├── easebuzz_processor_transaction_details (READ)
        ├── giftcard_order_items (READ)
        └── giftcard_coupons (READ)
```

---

## 2. Trigger Dependency Chain

```
INSERT INTO giftcard_coupons (status='ISSUED')
  │
  ▼
trg_giftcard_coupons_after_insert_cashback
  │
  ├── READ: giftcard_order_items (get order_id)
  ├── READ: giftcard_orders (get client_id, total_amount, wallet_amount, earn_cashback, coins_redeemed)
  ├── READ: client_wallet (get wallet_id, voucher_cashback_balance)
  ├── READ: client_wallet_transactions (check existing VOUCHER_CASHBACK)
  │
  ├── IF earn_cashback=1 AND coins_redeemed=NULL/0 AND no existing tx:
  │     ├── INSERT/UPDATE: client_wallet (voucher_cashback_balance, total_balance)
  │     └── INSERT: client_wallet_transactions (VOUCHER_CASHBACK)
  │
  └── END
```

**Critical Insight**: Wallet cashback crediting is DATABASE-TRIGGER-DRIVEN, not application-driven. The trigger fires on `giftcard_coupons` INSERT, not on order status change. This means:
- Cashback is only credited when a voucher is ACTUALLY generated (status='ISSUED')
- Cashback is NOT credited on order PAID status alone
- The trigger computes the discount from `giftcard_order_items.meta.customer_discount_percent`
- Admin actions that insert into `giftcard_coupons` will trigger cashback

---

## 3. Stored Procedure Dependency Graph

```
Application Layer:
  │
  ├── VoucherRetryService
  │     ├── sp_get_failed_gift_vouchers
  │     │     ├── giftcard_orders (READ)
  │     │     ├── giftcard_order_items (READ)
  │     │     ├── client_profile (READ)
  │     │     └── master_transactions (READ, cross-DB)
  │     │
  │     ├── sp_get_retry_eligible_vouchers
  │     │     ├── master_transactions (READ, cross-DB)
  │     │     ├── giftcard_orders (READ)
  │     │     └── giftcard_order_items (READ)
  │     │
  │     ├── sp_update_order_item_status
  │     │     └── giftcard_order_items (UPDATE)
  │     │
  │     ├── sp_get_retry_metrics
  │     │     ├── master_transactions (READ, cross-DB)
  │     │     ├── giftcard_orders (READ)
  │     │     └── giftcard_order_items (READ)
  │     │
  │     └── sp_log_voucher_retry
  │           └── voucher_retry_log (INSERT)
  │
  ├── ClientWalletRepository
  │     └── redeem_voucher_cashback
  │           ├── client_wallet (UPDATE)
  │           └── client_wallet_transactions (INSERT)
  │
  ├── BrandProcedureController
  │     ├── get_distinct_occasions
  │     │     └── brands (READ)
  │     └── get_brands_json_with_occasion
  │           └── brands (READ)
  │
  └── GiftcardOrderRepository
        └── get_client_orders_json
              ├── giftcard_orders (READ)
              ├── giftcard_order_items (READ)
              ├── giftcard_coupons (READ)
              └── client_wallet (READ)
```

---

## 4. Indirect Dependencies

### 4.1 SuperCoin Hold → Voucher → Cashback Chain

```
FlipkartScController.initHold()
  └── giftcard_orders (UPDATE: sc_merchant_txn_id, coins_redeemed, sc_reference_txn_id)
        │
        ▼
SabbPePaymentCallbackController (on PAID)
  └── GiftcardCouponService.fetchCouponsAndSendEmail()
        └── giftcard_coupons (INSERT)
              │
              ▼ [TRIGGER]
        trg_giftcard_coupons_after_insert_cashback
              └── client_wallet (UPDATE), client_wallet_transactions (INSERT)
```

### 4.2 Payment Amount Validation Chain

```
SabbPePaymentCallbackController
  └── GiftcardOrderService.updateOrderStatusFromSabbPeCallback()
        └── validateCallbackAmount()
              ├── MasterTransactionRepository.findAmounts() → master_transactions
              ├── calculateExpectedNetPayable()
              │     ├── giftcard_orders (total_amount, wallet_amount)
              │     ├── coupon_usage (discount_amount)
              │     └── giftcard_order_items (supercoin_multiplier from meta)
              └── PaymentAmountMismatchException on mismatch
```

---

## 5. Tables NOT Directly Referenced by Java Code

These tables exist in the database but are not directly referenced by JPA entities or repository queries. They are only accessed via stored procedures or triggers:

| Table | Access Method | Admin Relevance |
|---|---|---|
| `client_wallet_transactions` | Trigger + SP | Wallet transaction audit |
| `voucher_retry_log` | SP | Retry audit |
| `coupon_usage` | SP + Repository | Discount tracking |

**Important**: `client_wallet_transactions` is primarily written by the trigger `trg_giftcard_coupons_after_insert_cashback` and read by `CashbackTransactionJdbcRepository`. It is NOT a JPA entity.
