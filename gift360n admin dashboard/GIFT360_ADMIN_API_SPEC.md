# Gift360 Admin Backend — API Specification

## 1. Base URL

```
/api/v1/admin
```

## 2. Authentication

### 2.1 Login
```
POST /api/v1/admin/auth/login
Body: { "username": "...", "password": "..." }
Response: { "token": "...", "user": { "id", "username", "roles", "permissions" } }
```

### 2.2 Logout
```
POST /api/v1/admin/auth/logout
Headers: Authorization: Bearer <token>
Response: { "message": "Logged out" }
```

### 2.3 Refresh Token
```
POST /api/v1/admin/auth/refresh
Headers: Authorization: Bearer <token>
Response: { "token": "...", "expiresAt": "..." }
```

---

## 3. Admin Users (RBAC)

### 3.1 Users
```
GET    /api/v1/admin/users                    — List users
POST   /api/v1/admin/users                    — Create user
GET    /api/v1/admin/users/{id}               — Get user
PUT    /api/v1/admin/users/{id}               — Update user
DELETE /api/v1/admin/users/{id}               — Delete user
POST   /api/v1/admin/users/{id}/reset-password — Reset password
POST   /api/v1/admin/users/{id}/toggle-active  — Enable/disable
```

### 3.2 Roles
```
GET    /api/v1/admin/roles                    — List roles
POST   /api/v1/admin/roles                    — Create role
GET    /api/v1/admin/roles/{id}               — Get role
PUT    /api/v1/admin/roles/{id}               — Update role
DELETE /api/v1/admin/roles/{id}               — Delete role
POST   /api/v1/admin/roles/{id}/permissions   — Assign permissions
```

### 3.3 Permissions
```
GET    /api/v1/admin/permissions              — List all permissions
```

---

## 4. Dashboard

```
GET /api/v1/admin/dashboard/summary
    Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    Response: { total_orders, total_paid_orders, total_revenue, vouchers_generated, vouchers_failed, total_scratched, total_gifted, unique_customers, supercoins_earned, supercoins_burnt, supercoins_refunded }

GET /api/v1/admin/dashboard/retention
    Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
    Response: { data: [{ day, retention, retention_cashback, retention_supercoins, retention_standard }] }
```

---

## 5. Orders

```
GET /api/v1/admin/orders
    Query: ?from=&to=&brandCode=&voucherStatus=&page=&size=&search=
    Response: { data: [...], page, size, total }

GET /api/v1/admin/orders/{orderNumber}
    Response: { order details, items, payment, vouchers, SuperCoin, wallet, timeline }

POST /api/v1/admin/orders/{orderNumber}/status
    Body: { "status": "REFUNDED", "reason": "Customer request" }
    Response: { message }

GET /api/v1/admin/orders/{orderNumber}/timeline
    Response: { events: [{ timestamp, type, detail, actor }] }
```

---

## 6. Customers

```
GET /api/v1/admin/customers
    Query: ?from=&to=&page=&size=&search=
    Response: { data: [...], page, size, total }

GET /api/v1/admin/customers/{clientId}
    Response: { profile, orderSummary, walletBalance, feedback }

GET /api/v1/admin/customers/{clientId}/journey
    Response: { profile, timeline: [{ event_at, event_type, ref, status_detail, amount, detail }] }

POST /api/v1/admin/customers/{clientId}/status
    Body: { "status": "suspended", "reason": "Suspicious activity" }
    Response: { message }
```

---

## 7. Vouchers

```
GET /api/v1/admin/vouchers/failed
    Query: ?clientId=&page=&size=
    Response: { data: [...], page, size }

GET /api/v1/admin/vouchers/retry-eligible
    Response: { data: [...] }

GET /api/v1/admin/vouchers/retry-metrics
    Response: { eligibleOrderCount, eligibleItemCount, totalRetriesToday, successCountToday, failedCountToday }

POST /api/v1/admin/vouchers/retry
    Body: { "originalOrderNumber": "...", "orderItemId": "..." }
    Response: { retryOrderId, retryStatus, attemptNumber, items }
```

---

## 8. SuperCoins

```
GET /api/v1/admin/supercoins/trend
    Query: ?from=&to=
    Response: { data: [{ day, earned, burnt, held_not_burnt, refunded }] }

GET /api/v1/admin/supercoins/config
    Response: { capPercent, earnPercent, redemptionSurchargePercent }
```

---

## 9. Wallet

```
GET /api/v1/admin/wallet/{clientId}
    Response: { clientId, totalBalance, voucherCashbackBalance, pendingEarnFraction }

GET /api/v1/admin/wallet/{clientId}/transactions
    Query: ?page=&size=
    Response: { data: [...], page, size }
```

---

## 10. Payments

```
GET /api/v1/admin/payments/{orderNumber}
    Response: { masterTransaction, easebuzzDetails, paymentStatus, amountRequested, amountFinal }
```

---

## 11. Reports

```
GET /api/v1/admin/reports/brands
    Query: ?from=&to=
    Response: { data: [{ brandCode, brandName, totalItems, totalRevenue, vouchersGenerated, vouchersFailed }] }

GET /api/v1/admin/reports/geography
    Query: ?from=&to=
    Response: { data: [{ city, state, uniqueCustomers, totalOrders, totalRevenue }] }

GET /api/v1/admin/reports/errors
    Query: ?from=&to=
    Response: { data: [{ responseCode, responseMsg, brandCode, brandName, failureCount, amountStuck }] }

GET /api/v1/admin/reports/carts
    Response: { customersWithItemsInCart, totalLineItems, totalCartValue, stale1hPlus, stale24hPlus }

GET /api/v1/admin/reports/export
    Query: ?type=orders|customers|vouchers&from=&to=&format=csv|excel
    Response: File download (async for large datasets)
```

---

## 12. Investigations

```
GET    /api/v1/admin/investigations
    Query: ?entityType=ORDER|CUSTOMER&entityId=...
    Response: { data: [...] }

POST   /api/v1/admin/investigations
    Body: { "entityType": "ORDER", "entityId": "...", "note": "...", "isInternal": true }
    Response: { id, createdAt }

PUT    /api/v1/admin/investigations/{id}
    Body: { "note": "Updated note" }
    Response: { message }
```

---

## 13. Audit Log

```
GET /api/v1/admin/audit
    Query: ?adminUserId=&module=&action=&from=&to=&page=&size=
    Response: { data: [...], page, size, total }
```

---

## 14. Configuration

```
GET /api/v1/admin/config/supercoin
    Response: { capPercent, earnPercent, redemptionSurchargePercent, restrictedBrandCodes }

PUT /api/v1/admin/config/supercoin
    Body: { "capPercent": 25, ... }
    Response: { message }

GET /api/v1/admin/config/wallet
    Response: { maxUsagePercent, maxRedeemAmount, cashbackRedeemPercent }

PUT /api/v1/admin/config/wallet
    Body: { "maxUsagePercent": 60, ... }
    Response: { message }

GET /api/v1/admin/config/retry
    Response: { maxAttempts, retryWindowHours, idempotencyWindowMinutes }

PUT /api/v1/admin/config/retry
    Body: { "maxAttempts": 5, ... }
    Response: { message }
```

---

## 15. Common Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

### Error
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Paginated
```json
{
  "data": [...],
  "page": 0,
  "size": 50,
  "total": 1234
}
```

---

## 16. Authentication Header

All authenticated requests require:
```
Authorization: Bearer <jwt_token>
```

---

## 17. Rate Limiting

- Login: 5 attempts per minute per IP
- General API: 100 requests per minute per user
- Export: 1 request per minute per user
