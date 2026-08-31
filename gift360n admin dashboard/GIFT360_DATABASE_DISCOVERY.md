# Gift360 Database — Complete Discovery

## 1. Database Environment

- **Engine**: MariaDB (MySQL-compatible)
- **Primary Schema**: `sabbpegiftvouchers`
- **Cross-DB Schema**: `sabbpepayments`
- **Host**: 34.47.168.236:7306
- **User**: sbuser
- **Connection**: JDBC with HikariCP

---

## 2. Tables — Complete Inventory

### 2.1 Core Business Tables

#### `giftcard_orders`
| Column | Type | Notes |
|---|---|---|
| `order_id` | VARCHAR(36) PK | UUID |
| `client_id` | VARCHAR(36) FK | → client_profile |
| `order_number` | VARCHAR(50) UNIQUE | Business order reference |
| `invoice_number` | VARCHAR(50) UNIQUE | Generated invoice |
| `total_amount` | DECIMAL(12,2) | Server-computed |
| `wallet_used` | TINYINT(1) | Wallet deduction flag |
| `wallet_amount` | DECIMAL(12,2) | Wallet amount used |
| `earn_cashback` | TINYINT(1) | Cashback eligibility |
| `currency` | VARCHAR(10) | Default INR |
| `status` | ENUM | PENDING/PAID/CANCELLED/FAILED/REFUNDED/TAMPERED |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `paid_at` | DATETIME | Payment completion time |
| `payment_url` | VARCHAR(2048) | Hosted checkout URL |
| `payment_initiated_at` | DATETIME | When payment was initiated |
| `sc_merchant_txn_id` | VARCHAR(250) | Flipkart SuperCoin merchant txn |
| `sc_reference_txn_id` | VARCHAR(250) | Flipkart reference txn |
| `sc_redeem_txn_id` | VARCHAR(250) | Flipkart redeem txn |
| `coins_earned` | DECIMAL(10,2) | SuperCoins earned |
| `coins_redeemed` | INT | SuperCoins redeemed/held |
| `coin_issued` | TINYINT(1) | Flipkart earn confirmed |
| `coin_hold_expiry` | BIGINT | Flipkart hold expiry (epoch ms) |
| `sc_fk_response_id` | VARCHAR(64) | Flipkart response id |
| `coins_refunded` | INT | SuperCoins refunded |
| `sc_refund_txn_id` | VARCHAR(250) | Flipkart refund txn |
| `payment_method` | VARCHAR(20) | NORMAL/SUPERCOIN |

**Indexes**: `uq_order_number`, `idx_orders_client_id`

#### `giftcard_order_items`
| Column | Type | Notes |
|---|---|---|
| `order_item_id` | VARCHAR(36) PK | UUID |
| `order_id` | VARCHAR(36) FK | → giftcard_orders |
| `brand_id` | VARCHAR(36) FK | → brands |
| `quantity` | INT | Number of cards |
| `unit_value` | DECIMAL(12,2) | Per-card value |
| `line_total` | DECIMAL(12,2) | quantity × unit_value |
| `status` | TINYINT(1) | 0=pending, 1=success |
| `last_evc_response_code` | VARCHAR(20) | EVC failure code |
| `last_evc_response_msg` | VARCHAR(255) | EVC failure message |
| `last_evc_attempt_at` | DATETIME | Last EVC attempt time |
| `meta` | LONGTEXT (JSON) | Brand code, name, discount %, supercoin_multiplier |
| `is_scratched` | TINYINT(1) | Voucher scratched flag |
| `is_gift` | TINYINT(1) | Gifted flag |
| `gift_recipient_email` | VARCHAR(255) | AES-encrypted |
| `gift_sent_at` | DATETIME | Gift delivery time |
| `gift_recipient_mobile` | VARCHAR(255) | AES-encrypted |
| `gift_delivery_channel` | VARCHAR(20) | EMAIL/WHATSAPP/BOTH |
| `gift_sender_name` | VARCHAR(100) | Sender display name |
| `gift_message` | VARCHAR(1000) | AES-encrypted message |
| `gift_media_url` | VARCHAR(500) | Optional media |
| `scratched_at` | DATETIME | Scratch timestamp |
| `retry_count` | INT | Voucher retry count |
| `updated_at` | DATETIME | Last update |
| `created_at` | DATETIME | Creation time |

**Indexes**: `idx_order_items_order`, `idx_order_items_brand`, `idx_order_items_is_gift`
**Constraints**: CHECK (is_scratched + is_gift ≤ 1)

#### `giftcard_coupons`
| Column | Type | Notes |
|---|---|---|
| `coupon_id` | VARCHAR(36) PK | UUID |
| `vd_raw_response` | LONGTEXT | Raw EVC API response |
| `order_item_id` | VARCHAR(36) UNIQUE FK | → giftcard_order_items |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |
| `is_gift` | TINYINT(1) | Gift flag |
| `gift_sent_at` | DATETIME | |

**Unique**: `uq_giftcard_coupons_order_item_id` (one coupon per order item)

#### `giftcard_coupon_items`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto-increment |
| `coupon_id` | VARCHAR(36) FK | → giftcard_coupons |
| `card_index` | INT | 0-based position |
| `card_no` | VARCHAR(100) | Physical card number |

---

### 2.2 Customer Tables

#### `client_profile`
| Column | Type | Notes |
|---|---|---|
| `client_id` | VARCHAR(36) PK | UUID |
| `client_onboarded_by` | VARCHAR(36) FK | Self-reference |
| `client_account_type` | ENUM | merchant/distributor/customer |
| `client_name` | VARCHAR | Full name |
| `client_mobile` | VARCHAR(20) UNIQUE | Mobile number |
| `client_email` | VARCHAR UNIQUE | Email |
| `client_password` | VARCHAR | Hashed password |
| `json_web_token` | LONGTEXT | JWT token |
| `client_account_status` | ENUM | active/suspended/pending_activation/closed |
| `client_business_name` | VARCHAR | |
| `client_business_type` | ENUM | |
| `client_business_registration_number` | VARCHAR(100) | |
| `client_tax_id` | VARCHAR(100) | |
| `client_business_industry` | VARCHAR(150) | |
| `client_business_website` | VARCHAR | |
| `client_business_docs` | LONGTEXT (JSON) | |
| `client_business_address` | LONGTEXT (JSON) | |
| `client_bank_account` | LONGTEXT (JSON) | |
| `client_bank_docs` | LONGTEXT (JSON) | |
| `client_kyc_status` | ENUM | |
| `client_kyc_docs` | LONGTEXT (JSON) | |
| `client_mobile_verified` | TINYINT(1) | |
| `client_email_verified` | TINYINT(1) | |
| `client_last_unsuccessful_login` | DATETIME | |
| `client_language_pref` | VARCHAR(5) | |
| `client_login_attempts` | INT | |
| `client_payment_provider` | ENUM | |
| `client_location` | JSON | |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

**Indexes**: `client_email`, `client_mobile`, `fk_client_onboarded_by`

---

### 2.3 Wallet Tables

#### `client_wallet`
| Column | Type | Notes |
|---|---|---|
| `wallet_id` | VARCHAR(36) PK | |
| `client_id` | VARCHAR(36) FK | → client_profile |
| `total_balance` | DECIMAL(19,4) | |
| `balance` | DECIMAL(19,4) | |
| `card_balance` | DECIMAL(19,4) | |
| `bonus_balance` | DECIMAL(19,4) | |
| `offer_balance` | DECIMAL(19,4) | |
| `cash_balance` | DECIMAL(19,4) | |
| `voucher_cashback_balance` | DECIMAL(19,4) | Spendable voucher cashback |
| `pending_earn_fraction` | DECIMAL(19,4) | Accumulated fractional SuperCoins |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

#### `client_wallet_transactions`
| Column | Type | Notes |
|---|---|---|
| `transaction_id` | VARCHAR(36) PK | UUID |
| `client_id` | VARCHAR(36) | |
| `wallet_id` | VARCHAR(36) FK | → client_wallet |
| `order_id` | VARCHAR(36) | Links to giftcard_orders |
| `transaction_type` | VARCHAR(50) | VOUCHER_CASHBACK, REDEEM, etc. |
| `amount` | DECIMAL(19,4) | |
| `previous_balance` | DECIMAL(19,4) | |
| `new_balance` | DECIMAL(19,4) | |
| `notes` | VARCHAR | |
| `created_at` | DATETIME | |

---

### 2.4 Brand/Catalog Tables

#### `brands`
| Column | Type | Notes |
|---|---|---|
| `id` | VARCHAR(36) PK | |
| `brand_name` | VARCHAR | |
| `brand_image_url` | VARCHAR | |
| `discount` | VARCHAR | Customer discount % |
| `occasions` | JSON | e.g. ["Rakhi","Onam"] |

#### `giftvouchers_public` (VIEW)
- Purpose: Public-facing brand catalog
- Columns: brand_id, brand_code, customer_discount_percent, supercoin_multiplier, brand_name, brand_type, min_price, max_price, denomination_list, stock_available, availability, category, description, tnc, images, important_instruction, redeem_steps, created_at, updated_at
- Used by: `GiftVouchersBrandsRepository`

#### `giftcard_brand_limits`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `brand_code` | VARCHAR | |
| `monthly_limit` | DECIMAL | |
| `is_active` | TINYINT(1) | |

#### `giftcard_client_brand_monthly_usage`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `client_id` | VARCHAR | |
| `brand_code` | VARCHAR | |
| `ym` | VARCHAR | Year-month |
| `total_amount` | DECIMAL | |

---

### 2.5 Cart Table

#### `giftcard_cart_items`
| Column | Type | Notes |
|---|---|---|
| `client_id` | VARCHAR(36) | |
| `brand_id` | VARCHAR(36) | |
| `brand_name` | VARCHAR | |
| `quantity` | INT | |
| `unit_value` | DECIMAL(12,2) | |
| `line_total` | DECIMAL(12,2) | |
| `created_at` | DATETIME | |
| `updated_at` | DATETIME | |

---

### 2.6 Feedback Table

#### `feedback`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | Auto-increment |
| `speed` | INT | Speed rating |
| `usability` | VARCHAR(20) | |
| `payment` | VARCHAR(20) | |
| `overall` | INT | Overall rating |
| `nps` | INT | NPS score |
| `voucher_delivery` | VARCHAR(30) | |
| `missing_brand` | VARCHAR(20) | |
| `brand_bought` | VARCHAR(255) | |
| `has_suggestion` | VARCHAR(20) | |
| `suggestion` | TEXT | |
| `issue_detail` | TEXT | |
| `client_id` | VARCHAR(100) | |
| `created_at` | DATETIME | |

---

### 2.7 Coupon Usage Table

#### `coupon_usage`
| Column | Type | Notes |
|---|---|---|
| (varies) | | Tracks coupon redemption |
| `order_id` | VARCHAR | Links to giftcard_orders |
| `discount_amount` | DECIMAL | Discount applied |

---

### 2.8 Voucher Retry Table

#### `voucher_retry_log`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `original_order_number` | VARCHAR | |
| `retry_order_id` | VARCHAR | |
| `attempt_number` | INT | |
| `retry_status` | VARCHAR | SUCCESS/FAILED |
| `response_payload` | TEXT | |
| `created_at` | DATETIME | |

---

### 2.9 Payment Tables (sabbpepayments schema)

#### `master_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `order_reference` | VARCHAR | Maps to giftcard_orders.order_number |
| `processor` | VARCHAR | Payment gateway name |
| `amount_requested` | DECIMAL | |
| `amount_final` | DECIMAL | Settled amount |
| `status` | VARCHAR | SUCCESS/FAILED/PENDING |
| `initiated_at` | DATETIME | |
| `completed_at` | DATETIME | |

#### `easebuzz_processor_transaction_details`
| Column | Type | Notes |
|---|---|---|
| `master_transaction_id` | BIGINT FK | → master_transactions |
| `txnid` | VARCHAR | Gateway transaction id |
| `bank_ref_num` | VARCHAR | Bank reference |
| `easepay_id` | VARCHAR | Easebuzz payment id |
| `mode` | VARCHAR | Payment mode (NB/CC/DC/UPI) |
| `city` | VARCHAR | Checkout city |
| `state` | VARCHAR | Checkout state |

---

### 2.10 Brand View Events

#### `brand_view_events`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `brand_id` | VARCHAR | |
| `client_id` | VARCHAR | |
| `created_at` | DATETIME | |

---

## 3. Views

### 3.1 `giftvouchers_public`
- **Purpose**: Public-facing brand catalog with pricing and availability
- **Base tables**: `brands` (with column mappings)
- **Used by**: `GiftVouchersBrandsRepository`
- **Admin relevance**: Brand management, reporting

---

## 4. Stored Procedures — Complete Inventory

### 4.1 `sp_get_failed_gift_vouchers`
- **Purpose**: Find orders where payment succeeded but voucher not generated
- **Parameters**: p_client_id, p_giftvouchers_db, p_payments_db
- **Tables read**: giftcard_orders, giftcard_order_items, client_profile, master_transactions
- **Cross-DB**: sabbpepayments.master_transactions
- **Called by**: VoucherRetryService (via repository)
- **Admin relevance**: CRITICAL — voucher retry dashboard

### 4.2 `sp_get_retry_eligible_vouchers`
- **Purpose**: Get orders eligible for voucher retry
- **Parameters**: p_max_attempts, p_retry_window_hours, p_giftvouchers_db, p_payments_db
- **Tables read**: master_transactions, giftcard_orders, giftcard_order_items
- **Cross-DB**: Yes
- **Called by**: VoucherRetryService
- **Admin relevance**: CRITICAL — retry eligibility

### 4.3 `sp_update_order_item_status`
- **Purpose**: Update order item status and retry count
- **Parameters**: p_order_item_id, p_status, p_giftvouchers_db
- **Tables modified**: giftcard_order_items
- **Called by**: VoucherRetryService
- **Admin relevance**: Retry execution

### 4.4 `sp_get_retry_metrics`
- **Purpose**: Get retry metrics (eligible counts, today's stats)
- **Parameters**: p_max_attempts, p_retry_window_hours, p_giftvouchers_db, p_payments_db
- **Tables read**: master_transactions, giftcard_orders, giftcard_order_items
- **Cross-DB**: Yes
- **Called by**: VoucherRetryService
- **Admin relevance**: CRITICAL — retry dashboard metrics

### 4.5 `sp_log_voucher_retry`
- **Purpose**: Log voucher retry attempt
- **Parameters**: p_original_order_number, p_retry_order_id, p_attempt_number, p_retry_status, p_response_payload
- **Tables modified**: voucher_retry_log
- **Called by**: VoucherRetryService
- **Admin relevance**: Retry audit trail

### 4.6 `get_distinct_occasions`
- **Purpose**: Get distinct occasions across all brands
- **Parameters**: None
- **Tables read**: brands
- **Called by**: BrandProcedureController
- **Admin relevance**: Brand/occasion management

### 4.7 `get_brands_json_with_occasion`
- **Purpose**: Get brands filtered by occasion
- **Parameters**: p_occasion
- **Tables read**: brands
- **Called by**: BrandProcedureController
- **Admin relevance**: Brand filtering

### 4.8 `get_client_orders_json`
- **Purpose**: Get client orders as JSON (used by repository)
- **Parameters**: clientId
- **Tables read**: giftcard_orders, giftcard_order_items, giftcard_coupons, client_wallet
- **Called by**: GiftcardOrderRepository.findOrdersAsJsonByClientId
- **Admin relevance**: Order listing

### 4.9 `redeem_voucher_cashback`
- **Purpose**: Deduct wallet cashback for an order
- **Parameters**: client_id, order_number
- **Tables modified**: client_wallet, client_wallet_transactions
- **Called by**: ClientWalletRepository
- **Admin relevance**: Wallet operations

---

## 5. Triggers — Complete Inventory

### 5.1 `trg_giftcard_coupons_after_insert_cashback` (ACTIVE — V20)
- **Table**: `giftcard_coupons`
- **Event**: AFTER INSERT
- **Condition**: `NEW.status = 'ISSUED'`
- **Logic**:
  1. Load order data from giftcard_order_items → giftcard_orders
  2. Check `earn_cashback = 1` AND `coins_redeemed IS NULL OR = 0`
  3. Check no existing VOUCHER_CASHBACK transaction for this order
  4. Compute discount from order items' `customer_discount_percent`
  5. Credit `client_wallet.voucher_cashback_balance`
  6. Insert `client_wallet_transactions` record
- **Tables modified**: `client_wallet`, `client_wallet_transactions`
- **Tables read**: `giftcard_order_items`, `giftcard_orders`, `client_wallet`, `client_wallet_transactions`
- **Admin relevance**: CRITICAL — wallet cashback is trigger-driven, not application-driven

### 5.2 `trg_giftcard_orders_status_paid` (DROPPED — V20 replaced it)
- Previously fired on giftcard_orders UPDATE when status changed to PAID
- Replaced by the coupon-based trigger above

### 5.3 `trg_giftcard_order_items_bi/bu` (referenced in code)
- Purpose: Populate `meta` JSON on order items with brand data from `giftvouchers_brands`
- Referenced in GiftcardCouponService comments about ORM staleness
- Admin relevance: meta population for order items

---

## 6. Database Events / Scheduled Jobs

**No MySQL EVENT objects found in the codebase.**

Voucher retry scheduling is application-level (`app.voucher-retry.scheduled-enabled=false`).

---

## 7. Key Data Relationships

```
client_profile (1) ──── (N) giftcard_orders
    │                           │
    │                           ├── (N) giftcard_order_items
    │                           │       │
    │                           │       ├── (1) giftcard_coupons
    │                           │       │       └── (N) giftcard_coupon_items
    │                           │       │
    │                           │       └── meta JSON → brand_code, brand_name, discount%, supercoin_multiplier
    │                           │
    │                           ├── (N) client_wallet_transactions (via order_id)
    │                           │
    │                           └── voucher_retry_log (via original_order_number)
    │
    ├── (1) client_wallet
    │       └── (N) client_wallet_transactions
    │
    └── (N) feedback

brands (1) ──── (N) giftcard_order_items (via brand_id)
brands (1) ──── (N) giftcard_brand_limits (via brand_code)
brands (1) ──── (N) giftcard_client_brand_monthly_usage (via brand_code)

master_transactions (1) ──── (1) easebuzz_processor_transaction_details
master_transactions.order_reference = giftcard_orders.order_number

coupon_usage.order_id = giftcard_orders.order_id
```

---

## 8. Cross-DB Access Pattern

The application uses dynamic SQL ( CONCAT + PREPARE ) for cross-database queries:
- `sabbpegiftvouchers` — primary business data
- `sabbpepayments` — payment gateway data (master_transactions, easebuzz_processor_transaction_details)

Database names are configurable via:
- `app.voucher-retry.giftvouchers-database=sabbpegiftvouchers`
- `app.voucher-retry.payments-database=sabbpepayments`

---

## 9. Sensitive Data Locations

| Data | Location | Encryption |
|---|---|---|
| Customer mobile | client_profile.client_mobile | Plain text |
| Customer email | client_profile.client_email | Plain text |
| Customer password | client_profile.client_password | Hashed |
| JWT token | client_profile.json_web_token | Plain text |
| Gift recipient email | giftcard_order_items.gift_recipient_email | AES-CBC encrypted |
| Gift recipient mobile | giftcard_order_items.gift_recipient_mobile | AES-CBC encrypted |
| Gift message | giftcard_order_items.gift_message | AES-CBC encrypted |
| Voucher codes | giftcard_coupons.vd_raw_response | Plain JSON |
| Payment credentials | application.properties | Plain text |
| SuperCoin private key | src/main/resources/keys/flipkart-private.pem | PEM file |

---

## 10. Admin Dashboard Relevance — Table Classification

| Table | Classification | Admin Use |
|---|---|---|
| giftcard_orders | Core business | Orders, revenue, status |
| giftcard_order_items | Core business | Voucher status, brand breakdown |
| giftcard_coupons | Voucher tracking | Voucher generation success/failure |
| giftcard_coupon_items | Voucher tracking | Individual card details |
| client_profile | Customer | Customer management, KYC |
| client_wallet | Wallet | Balance monitoring |
| client_wallet_transactions | Wallet audit | Transaction history |
| brands | Catalog | Brand management |
| giftvouchers_public | Catalog view | Brand listing |
| giftcard_brand_limits | Configuration | Spending limits |
| giftcard_client_brand_monthly_usage | Usage tracking | Limit enforcement |
| giftcard_cart_items | Cart | Abandoned cart analysis |
| feedback | Feedback | Customer satisfaction |
| coupon_usage | Coupon tracking | Discount analysis |
| voucher_retry_log | Retry audit | Retry monitoring |
| master_transactions | Payment | Payment status |
| easebuzz_processor_transaction_details | Payment | Gateway details |
| brand_view_events | Analytics | Brand engagement |
