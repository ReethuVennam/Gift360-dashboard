# Gift360 Backend — Complete Codebase Discovery

## 1. Project Identity

- **Name**: ValueDesign (Gift360 Backend)
- **Package**: `com.sabbpe.valuedesign`
- **Framework**: Spring Boot (Java 17)
- **Database**: MariaDB (`sabbpegiftvouchers` primary, cross-DB `sabbpepayments`)
- **Build**: Maven
- **Port**: 8081
- **Context Path**: None (root)
- **Packaging**: WAR

---

## 2. High-Level Architecture

```
Frontend (React/TypeScript)
    ↓ HTTPS/REST
ValueDesign Backend (Spring Boot, port 8081)
    ↓ JDBC/JPA
MariaDB: sabbpegiftvouchers (primary)
    ↓ Cross-DB queries
MariaDB: sabbpepayments (master_transactions, easebuzz_processor_transaction_details)
    ↓ External APIs
ValueDesign Voucher API (cards.vdwebapi.com)
Easebuzz Payment Gateway (pymntsuat.sabbpe.com)
Flipkart SuperCoin API (stage-supercoin.api.flipkart.net)
MSG91 OTP (control.msg91.com)
Email Service (notificationsuat.sabbpe.com)
Auth Service (gvauth.sabbpe.com)
```

---

## 3. Controllers (29 total)

### 3.1 Order Flow
| Controller | Path Prefix | Purpose |
|---|---|---|
| `GiftcardOrderController` | `/api/v1/giftcards` | Create order, get orders, initiate payment, update status |
| `SabbPePaymentCallbackController` | `/api/payment/sabbpe` | Payment webhook from SabbPe gateway |
| `OrderValidationController` | - | Order validation |
| `OrdersProcedureController` | - | Stored-procedure-based order queries |

### 3.2 SuperCoin Flow
| Controller | Path Prefix | Purpose |
|---|---|---|
| `FlipkartScController` | `/api/v1/supercoin` | Full Flipkart SuperCoin integration (search, enrol, add, balance, hold, initHold, deduct, authorizeHold, redeemHold, unhold, refund, status, expiring, transactions, burn-and-order, config) |

### 3.3 Wallet Flow
| Controller | Path Prefix | Purpose |
|---|---|---|
| `ClientWalletController` | `/api/wallet` | Wallet balance, redeem cashback |

### 3.4 Voucher Flow
| Controller | Path Prefix | Purpose |
|---|---|---|
| `VoucherRetryController` | `/api/v1/voucher` | Failed vouchers, retry eligible, retry metrics, execute retry |
| `GiftcardCouponController` | `/api/v1/giftcards/coupons` | Fetch coupons by client, by order item |
| `CouponValidationController` | - | Coupon validation |

### 3.5 Brand/Catalog
| Controller | Path Prefix | Purpose |
|---|---|---|
| `BrandController` | - | Brand CRUD |
| `BrandReadController` | - | Brand read operations |
| `BrandProcedureController` | - | Brand stored procedures |
| `StoreController` | - | Store management |
| `StoreReadController` | - | Store read operations |
| `StoreLocationController` | - | Store locations |

### 3.6 Gifting
| Controller | Path Prefix | Purpose |
|---|---|---|
| `GiftingController` | - | Gift operations (scratch, gift send) |

### 3.7 Cart
| Controller | Path Prefix | Purpose |
|---|---|---|
| `CartController` | - | Cart operations |

### 3.8 EVC (Voucher Provider)
| Controller | Path Prefix | Purpose |
|---|---|---|
| `EvcController` | - | GetEVC API |
| `EvcStatusController` | - | EVC status check |
| `ActivatedEvcController` | - | Activated EVC |

### 3.9 Auth & Security
| Controller | Path Prefix | Purpose |
|---|---|---|
| `AesController` | - | AES encryption/decryption |
| `EncryptObjController` | - | Encrypted object handling |
| `GenerateTokenController` | - | Token generation |
| `OrderValidationController` | - | Order validation with HMAC |

### 3.10 Admin
| Controller | Path Prefix | Purpose |
|---|---|---|
| `AdminDashboardController` | `/api/admin/dashboard` | Existing admin dashboard (X-Admin-Key auth) |

### 3.11 Other
| Controller | Path Prefix | Purpose |
|---|---|---|
| `HealthController` | `/api/health` | Health checks |
| `FeedbackController` | `/api/v1/feedback` | Customer feedback |
| `GuardRailsController` | `/api/guard-rails` | Brand limits, client usage |
| `NewLeadContactController` | - | Lead capture |
| `LoggingFilter` | - | Request logging filter |

---

## 4. Services (35+ total)

### 4.1 Core Business
- `GiftcardOrderService` — Order creation, status update, payment callback, invoice
- `GiftcardCouponService` — Voucher generation via EVC, SuperCoin redeem/earn/refund
- `GiftcardOrderService` — Order management
- `VoucherRetryService` — Failed voucher retry logic
- `ClientWalletService` — Wallet balance, cashback redemption

### 4.2 Payment
- `PaymentInitiationService` — SabbPe payment gateway initiation
- `PaymentTamperService` — Payment amount mismatch detection & alerting

### 4.3 SuperCoin
- `SuperCoinBurnOrderService` — SuperCoin burn-and-order orchestration
- `FlipkartScEarnService` — SuperCoin accrual
- `FlipkartScRedeemService` — SuperCoin redemption (hold, confirm, cancel)
- `FlipkartScRefundService` — SuperCoin refund
- `FlipkartScStatusService` — Transaction status check
- `FlipkartScUserService` — User search/enrol
- `FlipkartSuperCoinClient` — HTTP client for Flipkart API
- `FlipkartJwtService` — JWT signing for Flipkart

### 4.4 EVC (Voucher Provider)
- `EvcService` — ValueDesign GetEVC API calls
- `EvcStatusService` — EVC status
- `ActivatedEvcService` — Activated EVC

### 4.5 Catalog
- `BrandService` — Brand management
- `BrandQueryService` — Brand queries
- `BrandDBService` — Brand DB operations
- `BrandPriceValidator` — Brand price validation
- `StoreService` — Store management
- `StoreQueryService` — Store queries
- `StoreDBService` — Store DB operations
- `StoreLocationService` — Store locations

### 4.6 Other
- `CartService` — Cart operations
- `CouponValidationService` — Coupon validation & reservation
- `FeedbackService` — Feedback submission
- `GuardRailsService` — Brand limits, usage tracking
- `GiftingService` — Gift operations
- `InvoiceGenerationService` — PDF invoice generation
- `InvoiceDataService` — Invoice data assembly
- `EmailServiceClient` — Email notifications
- `TokenGenerationService` — Token generation
- `NewLeadContactService` — Lead capture
- `EncryptedObjectService` — Encryption utilities
- `AesService` / `AesServiceImpl` — AES encryption

---

## 5. Repositories (27 total)

### 5.1 JPA Repositories
| Repository | Table | Purpose |
|---|---|---|
| `GiftcardOrderRepository` | `giftcard_orders` | Order CRUD, status queries, JSON function |
| `GiftcardOrderItemRepository` | `giftcard_order_items` | Order items, findByIdForUpdate (pessimistic lock) |
| `GiftcardOrderItemRepository1` | `giftcard_order_items` | Alternate item repository |
| `GiftcardCouponRepository` | `giftcard_coupons` | Coupon CRUD, existence checks |
| `GiftcardCouponItemRepository` | `giftcard_coupon_items` | Individual card items |
| `ClientProfileRepository` | `client_profile` | Customer profiles |
| `ClientWalletRepository` | `client_wallet` | Wallet balances, redeem_voucher_cashback SP |
| `GiftVouchersBrandsRepository` | `giftvouchers_public` | Brand catalog |
| `GiftVouchersBrandsModelRepository` | `brands` | Brand model |
| `GiftcardBrandLimitRepository` | `giftcard_brand_limits` | Monthly brand limits |
| `GiftcardClientBrandMonthlyUsageRepository` | `giftcard_client_brand_monthly_usage` | Monthly usage |
| `GiftCardCartItemRepository` | `giftcard_cart_items` | Shopping cart |
| `FeedbackRepository` | `feedback` | Feedback |
| `BrandViewEventRepository` | `brand_view_events` | Brand view tracking |
| `CouponUsageRepository` | `coupon_usage` | Coupon usage tracking |
| `NewLeadContactRepository` | - | Lead contacts |
| `VoucherRetryLogRepository` | `voucher_retry_log` | Retry log |
| `VoucherRetryEligibilityRepository` | - | Retry eligibility |

### 5.2 JDBC Repositories
| Repository | Table | Purpose |
|---|---|---|
| `CashbackTransactionJdbcRepository` | `client_wallet_transactions` | Cashback transaction queries |
| `CardItemJdbcRepository` | - | Card item queries |
| `MasterTransactionRepository` | `master_transactions` | Payment transaction amounts |
| `OrdersProcedureRepository` | - | Stored procedure calls |

---

## 6. Security

### 6.1 JWT Authentication
- Filter: `JwtAuthenticationFilter`
- Applied to: `/api/*` pattern
- PROTECTED_ENDPOINTS: Specific paths requiring JWT
- JWT token stored in `client_profile.json_web_token`
- No RBAC — single role (customer/distributor/merchant)

### 6.2 Admin Authentication
- Simple `X-Admin-Key` header check in `AdminDashboardController`
- Key stored in `app.admin.dashboard.key` property
- No user identity, no audit trail, no RBAC

### 6.3 Payment Security
- AES-CBC encryption for order status updates
- HMAC validation for order validation
- Payment tamper detection service
- Server-side amount computation (client amounts never trusted)

---

## 7. Enums

### 7.1 OrderStatus
`PENDING`, `PAID`, `CANCELLED`, `FAILED`, `REFUNDED`, `TAMPERED`

### 7.2 ClientAccountStatus
`active`, `suspended`, `pending_activation`, `closed`

### 7.3 ClientAccountType
`merchant`, `distributor`, `customer`

### 7.4 ClientKycStatus
Enum exists (not fully explored)

### 7.5 ClientBusinessType
Enum exists (not fully explored)

### 7.6 ClientPaymentProvider
Enum exists (not fully explored)

---

## 8. External Integrations

### 8.1 ValueDesign Voucher API
- Base URL: `cards.vdwebapi.com/distributor/`
- Endpoints: `api-generatetoken`, `api-getbrand`, `api-getstore`, `getevc`, `getevcstatus`, `getactivatedevc`
- Used for: Voucher generation, brand/store catalog sync

### 8.2 SabbPe Payment Gateway
- Base URL: `pymntsuat.sabbpe.com/sabbpe/v1`
- Authentication: userid + merchantid + password
- Used for: Payment initiation, hosted checkout page
- Callback: `POST /api/payment/sabbpe/callback`

### 8.3 Flipkart SuperCoin
- Base URL: `stage-supercoin.api.flipkart.net`
- Authentication: JWT (signed with private key)
- Operations: searchUser, enrolUser, add (earn), balance, hold, initHold, deduct, authorizeHold, redeemHold, unhold, refund, status, expiring, transactions

### 8.4 MSG91 OTP
- Flow API: `control.msg91.com/api/v5/flow`
- OTP Verify: `control.msg91.com/api/v5/otp/verify`
- Auth: Auth key in header

### 8.5 Email Service
- URL: `notificationsuat.sabbpe.com`
- Used for: Invoice emails, gift delivery emails

### 8.6 Auth Service
- URL: `gvauth.sabbpe.com`
- Used for: OTP-based authentication

---

## 9. Configuration (application.properties)

### 9.1 Database
- URL: `jdbc:mariadb://34.47.168.236:7306/sabbpegiftvouchers`
- Driver: `org.mariadb.jdbc.Driver`
- Pool: HikariCP (max 20, min idle 5)

### 9.2 Payment
- SabbPe base URL, credentials, session TTL, reuse window
- Wallet max usage: 50%
- Platform fee: ₹5 flat

### 9.3 SuperCoin
- Earn percent: 1.0%
- Redemption surcharge: 10%
- Cap percent: 20%
- Restricted brand codes
- Burn-and-order earn percent: 1.0%

### 9.4 Voucher Retry
- Max attempts: 3
- Window: 72 hours
- Idempotency window: 2 minutes
- Scheduled: disabled

---

## 10. Existing Admin Dashboard

The `AdminDashboardController` already provides:

### 10.1 Endpoints
| Endpoint | Purpose |
|---|---|
| `GET /api/admin/dashboard/summary` | Order counts, revenue, SuperCoin stats |
| `GET /api/admin/dashboard/orders` | Full order detail list (paginated) |
| `GET /api/admin/dashboard/brands` | Brand-wise stats |
| `GET /api/admin/dashboard/customers` | Customer-wise stats (paginated) |
| `GET /api/admin/dashboard/customer-journey` | Single customer timeline |
| `GET /api/admin/dashboard/supercoins` | Daily SuperCoin trend |
| `GET /api/admin/dashboard/retention` | Retention cost analysis |
| `GET /api/admin/dashboard/errors` | Voucher failure breakdown |
| `GET /api/admin/dashboard/geography` | City/state breakdown |
| `GET /api/admin/dashboard/abandoned` | Abandoned carts (paginated) |
| `GET /api/admin/dashboard/carts/summary` | Current cart summary |
| `GET /api/admin/dashboard/carts/customers` | Cart by customer |
| `GET /api/admin/dashboard/carts/brands` | Cart by brand |

### 10.2 Limitations
- Single X-Admin-Key authentication (no users, no RBAC)
- No audit logging
- No customer management (block/suspend)
- No order management (refund, status change)
- No voucher retry from admin
- No configuration management
- No export functionality
- Raw SQL queries (no service layer)
- No error handling for query failures
- No rate limiting

---

## 11. Database Migrations (21 versions)

| Version | Purpose |
|---|---|
| V2 | Add gifting columns |
| V3 | SP orders include gifting fields |
| V4 | Add Flipkart SuperCoin columns |
| V5 | Alter coins_earned to decimal |
| V6 | Add pending_earn_fraction |
| V7 | Add earn_cashback column |
| V8 | Update cashback trigger |
| V9 | Create feedback table |
| V10 | Update feedback table |
| V11 | Add feedback columns |
| V12 | Add payment initiation columns |
| V13 | Fix redeem voucher cashback resignal |
| V14 | Fix negative final payable, add pricing fields |
| V15 | Add payment_method column |
| V16 | Add payment_method to stored procedures |
| V17 | (implied from V16 context) |
| V18 | Add client_location to client_profile |
| V19 | Add occasions column and recommendations SP |
| V20 | Move cashback trigger to voucher success |
| V21 | Brands occasions and dynamic brand SPs |
