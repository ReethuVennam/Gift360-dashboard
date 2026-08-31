# Gift360 Admin Dashboard — API Specification

> **Status:** Backend APIs are functional. Testing is still underway for some edge cases. Frontend team can start integrating — all core endpoints return valid responses.

**Base URL:** `http://<host>:8082`
**API Prefix:** `/api/v1/admin`
**Auth:** JWT Bearer token in `Authorization` header

---

## Authentication

### POST `/api/v1/admin/auth/login`

Login and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid-here",
    "username": "admin",
    "email": "admin@sabbpe.com",
    "permissions": ["dashboard:view", "orders:view", "customers:view", "customers:block", "vouchers:view", "vouchers:retry", "supercoins:view", "wallet:view", "reports:view", "refunds:view", "config:manage", "audit:view", "admin:users"]
  }
}
```

**Response 401:**
```json
{ "error": "Invalid credentials" }
```

---

### POST `/api/v1/admin/auth/logout`

Logs out current user (audit trail only, no token revocation).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "message": "Logged out" }
```

---

### GET `/api/v1/admin/auth/me`

Get current authenticated user details.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@sabbpe.com",
  "permissions": ["dashboard:view", "orders:view", ...]
}
```

**Response 401:**
```json
{ "error": "Not authenticated" }
```

---

## Common Headers

All authenticated requests require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Common Response Format

All endpoints return:
```json
{
  "data": { ... } | [ ... ],
  "page": 0,        // paginated endpoints only
  "size": 50        // paginated endpoints only
}
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 500 | Server error / SP call failed |

**403 Response:**
```json
{ "error": "Forbidden" }
```

## Pagination

Paginated endpoints accept `page` (0-indexed) and `size` query params. Default: `page=0, size=50`.

## Date Filtering

Most endpoints accept optional `from` and `to` query params in `YYYY-MM-DD` format.
- Default `to`: today
- Default `from`: 30 days before today
- The SP filters `created_at >= from AND created_at < to + 1 day`

---

## 1. Dashboard

### GET `/api/v1/admin/dashboard/summary`

Returns aggregate metrics for the date range.

**Permission:** `dashboard:view`

**Params:** `from` (optional), `to` (optional)

**Response 200:**
```json
{
  "data": {
    "total_orders": 1234,
    "paid_orders": 1100,
    "pending_orders": 50,
    "failed_orders": 30,
    "cancelled_orders": 54,
    "total_revenue": 450000.00,
    "total_wallet_used": 12000.00,
    "unique_customers": 890,
    "vouchers_generated": 1050,
    "vouchers_failed": 50,
    "supercoins_earned": 15000.00,
    "supercoins_burnt": 8000.00,
    "supercoins_refunded": 2000.00
  },
  "from": "2026-07-29",
  "to": "2026-08-28"
}
```

---

## 2. Orders

### GET `/api/v1/admin/orders`

Paginated order list with filters.

**Permission:** `orders:view`

**Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | string | today-30d | Start date YYYY-MM-DD |
| to | string | today | End date YYYY-MM-DD |
| brandCode | string | null | Filter by brand code |
| voucherStatus | string | null | `generated` or `failed` |
| paymentMethod | string | null | e.g. `UPI`, `CARD`, `WALLET` |
| search | string | null | Search by order#, name, email, mobile, client_id |
| page | int | 0 | Page number (0-indexed) |
| size | int | 50 | Page size |

**Response 200:**
```json
{
  "data": [
    {
      "order_id": "uuid",
      "order_number": "ORD260823B3132D0E5D3F",
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_mobile": "9876543210",
      "total_amount": 500.00,
      "order_status": "PAID",
      "created_at": "2026-08-23T10:30:00",
      "paid_at": "2026-08-23T10:31:00",
      "wallet_used": 0,
      "wallet_amount": 0.00,
      "payment_method": "UPI",
      "coins_earned": 50.00,
      "coins_redeemed": 0,
      "coins_refunded": 0,
      "payment_status": "SUCCESS",
      "payment_processor": "easebuzz",
      "payment_amount": 500.00,
      "order_item_id": "uuid",
      "quantity": 1,
      "unit_value": 500.00,
      "line_total": 500.00,
      "brand_code": "GV001",
      "brand_name": "Amazon",
      "voucher_status": "GENERATED",
      "last_evc_response_code": null,
      "last_evc_response_msg": null,
      "is_scratched": 0,
      "is_gift": 0
    }
  ],
  "page": 0,
  "size": 50
}
```

**Voucher Status Values:** `GENERATED`, `FAILED`, `NOT_APPLICABLE_PENDING`, `NOT_APPLICABLE_FAILED`

---

### GET `/api/v1/admin/orders/{orderNumber}`

Order detail with items, payment info, and wallet transactions.

**Permission:** `orders:view`

**Path:** `orderNumber` — e.g. `ORD260823B3132D0E5D3F`

**Response 200:**
```json
{
  "data": [
    {
      "order_id": "uuid",
      "order_number": "ORD260823B3132D0E5D3F",
      "client_id": "uuid",
      "total_amount": 500.00,
      "status": "PAID",
      "created_at": "2026-08-23T10:30:00",
      "paid_at": "2026-08-23T10:31:00",
      "wallet_used": 0,
      "wallet_amount": 0.00,
      "payment_method": "UPI",
      "earn_cashback": 0,
      "coins_earned": 50.00,
      "coins_redeemed": 0,
      "coins_refunded": 0,
      "sc_merchant_txn_id": null,
      "sc_reference_txn_id": null,
      "sc_redeem_txn_id": null,
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_mobile": "9876543210"
    },
    [
      {
        "order_item_id": "uuid",
        "quantity": 1,
        "unit_value": 500.00,
        "line_total": 500.00,
        "brand_code": "GV001",
        "brand_name": "Amazon",
        "last_evc_response_code": null,
        "last_evc_response_msg": null,
        "is_scratched": 0,
        "is_gift": 0,
        "scratched_at": null,
        "gift_sent_at": null,
        "coupon_id": "uuid",
        "coupon_status": "ACTIVE"
      }
    ],
    [
      {
        "payment_txn_id": "uuid",
        "payment_status": "SUCCESS",
        "processor": "easebuzz",
        "amount_requested": 500.00,
        "amount_final": 500.00,
        "initiated_at": "2026-08-23T10:30:00",
        "completed_at": "2026-08-23T10:31:00",
        "bank_ref_num": "123456789",
        "easepay_id": "EB12345",
        "payment_mode": "UPI"
      }
    ],
    [
      {
        "transaction_type": "DEBIT",
        "amount": 500.00,
        "previous_balance": 1000.00,
        "new_balance": 500.00,
        "created_at": "2026-08-23T10:31:00",
        "notes": "Order payment"
      }
    ]
  ]
}
```

**Note:** `data` is an array of 4 result sets: [order, items[], payments[], wallet[]].

---

## 3. Customers

### GET `/api/v1/admin/customers`

Paginated customer list.

**Permission:** `customers:view`

**Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | string | today-30d | Start date |
| to | string | today | End date |
| search | string | null | Search by name, email, mobile, client_id |
| status | string | null | Filter by account status |
| page | int | 0 | Page number |
| size | int | 50 | Page size |

**Status values:** `active`, `pending_activation`, `suspended`, `closed`

**Response 200:**
```json
{
  "data": [
    {
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_mobile": "9876543210",
      "client_account_status": "active",
      "total_orders": 5,
      "total_spent": 2500.00,
      "vouchers_received": 5,
      "supercoins_earned": 250.00,
      "last_order_at": "2026-08-23T10:30:00"
    }
  ],
  "page": 0,
  "size": 50
}
```

---

### GET `/api/v1/admin/customers/{clientId}`

Customer detail with stats, wallet, and feedback.

**Permission:** `customers:view`

**Path:** `clientId` — UUID

**Response 200:**
```json
{
  "data": [
    {
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_mobile": "9876543210",
      "client_account_status": "active",
      "created_at": "2026-01-15T00:00:00"
    },
    {
      "total_orders": 5,
      "total_spent": 2500.00,
      "supercoins_earned": 250.00,
      "supercoins_redeemed": 100.00,
      "last_order_at": "2026-08-23T10:30:00"
    },
    {
      "voucher_cashback_balance": 150.00,
      "total_balance": 200.00,
      "pending_earn_fraction": 0
    },
    {
      "feedback_count": 3,
      "avg_overall": 4.5,
      "avg_nps": 9
    }
  ]
}
```

**Note:** `data` is array of 4 result sets: [profile, stats, wallet, feedback].

---

### GET `/api/v1/admin/customers/{clientId}/journey`

Customer event timeline (orders + feedback).

**Permission:** `customers:view`

**Response 200:**
```json
{
  "data": [
    {
      "event_at": "2026-08-23T10:30:00",
      "event_type": "ORDER",
      "ref": "ORD260823B3132D0E5D3F",
      "status_detail": "PAID",
      "amount": 500.00,
      "detail": "Amazon",
      "coins_involved": 0
    },
    {
      "event_at": "2026-08-20T14:00:00",
      "event_type": "FEEDBACK",
      "ref": "5",
      "status_detail": "9",
      "amount": null,
      "detail": "Great service",
      "coins_involved": null
    }
  ]
}
```

---

### POST `/api/v1/admin/customers/{clientId}/block`

Block or unblock a customer.

**Permission:** `customers:block`

**Request:**
```json
{
  "status": "suspended",
  "reason": "Suspicious activity"
}
```

**Valid status values:** `active`, `pending_activation`, `suspended`, `closed`

**Response 200:**
```json
{
  "data": [
    {
      "rows_affected": 1,
      "previous_status": "active",
      "new_status": "suspended"
    }
  ]
}
```

---

## 4. Vouchers

### GET `/api/v1/admin/vouchers/failed`

List failed vouchers (paid but no coupon generated).

**Permission:** `vouchers:view`

**Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| clientId | string | null | Filter by client UUID |
| page | int | 0 | Page number |
| size | int | 50 | Page size |

**Response 200:**
```json
{
  "data": [
    {
      "order_number": "ORD260823B3132D0E5D3F",
      "order_item_id": "uuid",
      "client_id": "uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "brand_code": "GV001",
      "brand_name": "Amazon",
      "quantity": 1,
      "unit_value": 500.00,
      "line_total": 500.00,
      "last_evc_response_code": "ERR_TIMEOUT",
      "last_evc_response_msg": "EVC API timeout",
      "last_evc_attempt_at": "2026-08-23T10:31:00",
      "paid_at": "2026-08-23T10:30:00",
      "order_status": "PAID"
    }
  ],
  "page": 0,
  "size": 50
}
```

---

### GET `/api/v1/admin/vouchers/retry-eligible`

List items eligible for retry (payment success, voucher not generated).

**Permission:** `vouchers:view`

**Params:** None

**Response 200:**
```json
{
  "data": [
    {
      "original_order_number": "ORD260823B3132D0E5D3F",
      "order_item_id": "uuid",
      "brand_id": "uuid",
      "quantity": 1,
      "unit_value": 500.00,
      "line_total": 500.00,
      "order_paid_at": "2026-08-23T10:30:00",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_mobile": "9876543210"
    }
  ]
}
```

---

### GET `/api/v1/admin/vouchers/retry-metrics`

Retry metrics and today's retry stats.

**Permission:** `vouchers:view`

**Params:** None

**Response 200:**
```json
{
  "data": {
    "eligible_order_count": 176,
    "eligible_item_count": 184
  }
}
```

**Note:** SP returns 2 result sets. Current implementation returns first result set only.

---

### POST `/api/v1/admin/vouchers/retry`

Execute voucher retry (placeholder — resets status for reprocessing).

**Permission:** `vouchers:retry`

**Request:**
```json
{
  "orderNumber": "ORD260823B3132D0E5D3F",
  "orderItemId": "uuid",
  "reason": "Customer reported not receiving voucher"
}
```

**Response 200:**
```json
{
  "data": [
    {
      "rows_affected": 1,
      "current_status": 0
    }
  ]
}
```

**⚠️ FLAG:** This is a placeholder. Actual retry execution requires calling the original Gift360 backend's `/api/v1/voucher-retry/execute` endpoint. See `API_FLAGS.md`.

---

## 5. SuperCoins

### GET `/api/v1/admin/supercoins/trend`

Daily SuperCoin earned/burnt/refunded trend.

**Permission:** `supercoins:view`

**Params:** `from` (optional), `to` (optional)

**Response 200:**
```json
{
  "data": [
    {
      "day": "2026-08-20",
      "earned": 1519.88,
      "burnt": 1662,
      "refunded": 605
    },
    {
      "day": "2026-08-23",
      "earned": 2.60,
      "burnt": 252,
      "refunded": 0
    }
  ]
}
```

**Note:** Only days with activity are returned. Days with all zeros are excluded.

---

## 6. Wallet

### GET `/api/v1/admin/wallet/{clientId}`

Customer wallet balance and recent transactions.

**Permission:** `wallet:view`

**Path:** `clientId` — UUID

**Response 200:**
```json
{
  "data": [
    {
      "voucher_cashback_balance": 150.00,
      "total_balance": 200.00,
      "pending_earn_fraction": 0
    },
    [
      {
        "transaction_type": "CREDIT",
        "amount": 50.00,
        "previous_balance": 100.00,
        "new_balance": 150.00,
        "order_id": "uuid",
        "created_at": "2026-08-23T10:30:00",
        "notes": "Cashback earned"
      }
    ]
  ]
}
```

**Note:** `data` is array of 2 result sets: [balance, transactions[]]. Max 50 transactions returned.

---

## 7. Brands

### GET `/api/v1/admin/brands`

Brand-wise stats for the date range.

**Permission:** `reports:view`

**Params:** `from` (optional), `to` (optional)

**Response 200:**
```json
{
  "data": [
    {
      "brand_code": "GV001",
      "brand_name": "Amazon",
      "total_items": 500,
      "total_revenue": 250000.00,
      "vouchers_generated": 480,
      "vouchers_failed": 20
    }
  ]
}
```

---

## 8. Errors

### GET `/api/v1/admin/errors`

Error breakdown by response code and brand.

**Permission:** `reports:view`

**Params:** `from` (optional), `to` (optional)

**Response 200:**
```json
{
  "data": [
    {
      "response_code": "ERR_TIMEOUT",
      "response_msg": "EVC API timeout",
      "brand_code": "GV001",
      "brand_name": "Amazon",
      "failure_count": 15,
      "amount_stuck": 7500.00
    }
  ]
}
```

---

## 10. Abandoned Carts

### GET `/api/v1/admin/abandoned`

Non-PAID orders (abandoned carts).

**Permission:** `reports:view`

**Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | string | today-30d | Start date |
| to | string | today | End date |
| page | int | 0 | Page number |
| size | int | 50 | Page size |

**Response 200:**
```json
{
  "data": [
    {
      "order_number": "ORD260823ABC123",
      "order_status": "PENDING",
      "total_amount": 500.00,
      "created_at": "2026-08-23T10:30:00",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "client_mobile": "9876543210",
      "brand_name": "Amazon"
    }
  ],
  "page": 0,
  "size": 50
}
```

---

## 11. Retention

### GET `/api/v1/admin/retention`

Daily retention metrics by flow type.

**Permission:** `reports:view`

**Params:** `from` (optional), `to` (optional)

**Response 200:**
```json
{
  "data": [
    {
      "day": "2026-08-20",
      "retention": 1250.00,
      "cashback_orders": 10,
      "supercoins_orders": 5,
      "standard_orders": 20
    }
  ]
}
```

---

## 12. Refunds

### GET `/api/v1/admin/refunds/{orderNumber}/check`

Check refund eligibility for an order.

**Permission:** `refunds:view`

**Path:** `orderNumber` — e.g. `ORD260823B3132D0E5D3F`

**Response 200:**
```json
{
  "data": [
    {
      "order_number": "ORD260823B3132D0E5D3F",
      "total_amount": 500.00,
      "order_status": "PAID",
      "payment_method": "UPI",
      "coins_redeemed": 0,
      "payment_status": "SUCCESS",
      "processor": "easebuzz",
      "amount_final": 500.00,
      "refund_eligibility": "ELIGIBLE"
    }
  ]
}
```

**Refund eligibility values:** `ELIGIBLE`, `SUPERCOIN_ORDER`, `NOT_ELIGIBLE`

**⚠️ FLAG:** Check only — no refund execution. See `API_FLAGS.md`.

---

## 13. Configuration

### GET `/api/v1/admin/config/{configType}`

Get config by type.

**Permission:** `config:manage`

**Path:** `configType` — `supercoin`, `wallet`, or `retry`

**Response 200:**
```json
{
  "data": [
    { "config_key": "cap_percent", "config_value": "25" },
    { "config_key": "earn_percent", "config_value": "1" },
    { "config_key": "redemption_surcharge_percent", "config_value": "25" }
  ]
}
```

**⚠️ FLAG:** Read-only placeholder. Updates are not persisted. See `API_FLAGS.md`.

---

### PUT `/api/v1/admin/config/{configType}`

Update config (placeholder — echoes back, does not persist).

**Permission:** `config:manage`

**Request:**
```json
{
  "key": "cap_percent",
  "value": "30",
  "reason": "Business decision to increase cap"
}
```

**Response 200:**
```json
{
  "data": [
    {
      "config_type": "supercoin",
      "config_key": "cap_percent",
      "new_value": "30",
      "admin_user_id": "uuid",
      "updated_at": "2026-08-28T12:00:00"
    }
  ]
}
```

---

## 14. Investigations

### GET `/api/v1/admin/investigations`

List investigation notes for an entity.

**Permission:** `orders:view`

**Params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| entityType | string | yes | e.g. `order`, `customer`, `voucher` |
| entityId | string | yes | UUID of the entity |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "admin_user_id": "uuid",
      "entity_type": "order",
      "entity_id": "uuid",
      "note": "Customer contacted support about missing voucher",
      "is_internal": 0,
      "created_at": "2026-08-28T12:00:00",
      "updated_at": "2026-08-28T12:00:00"
    }
  ]
}
```

---

### POST `/api/v1/admin/investigations`

Create an investigation note.

**Permission:** `orders:view`

**Request:**
```json
{
  "entityType": "order",
  "entityId": "uuid",
  "note": "Investigating payment discrepancy",
  "isInternal": 1
}
```

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "created_at": "2026-08-28T12:00:00"
    }
  ]
}
```

---

## 15. Audit Log

### GET `/api/v1/admin/audit`

Admin audit trail.

**Permission:** `audit:view`

**Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| adminUserId | string | null | Filter by admin user UUID |
| module | string | null | Filter by module (e.g. `auth`, `config`) |
| from | string | null | Start date |
| to | string | null | End date |
| page | int | 0 | Page number |
| size | int | 50 | Page size |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "admin_user_id": "uuid",
      "admin_username": "admin",
      "action": "LOGIN",
      "module": "auth",
      "target_entity": null,
      "target_id": null,
      "previous_value": null,
      "new_value": null,
      "reason": null,
      "ip_address": "192.168.1.1",
      "correlation_id": null,
      "result": "SUCCESS",
      "created_at": "2026-08-28T12:00:00"
    }
  ],
  "page": 0,
  "size": 50
}
```

---

## 16. Admin Users (RBAC)

### GET `/api/v1/admin/users`

List all admin users.

**Permission:** `admin:users`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "admin",
      "email": "admin@sabbpe.com",
      "full_name": "Admin User",
      "is_active": 1,
      "last_login_at": "2026-08-28T12:00:00",
      "roles": "super_admin"
    }
  ]
}
```

---

### GET `/api/v1/admin/roles`

List all roles.

**Permission:** `admin:users`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "super_admin",
      "description": "Full access",
      "created_at": "2026-08-28T00:00:00"
    }
  ]
}
```

---

### GET `/api/v1/admin/permissions`

List all permissions.

**Permission:** `admin:users`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "dashboard:view",
      "module": "dashboard",
      "description": "View dashboard"
    }
  ]
}
```

---

## Permissions Reference

| Permission | Module | Description |
|------------|--------|-------------|
| `dashboard:view` | Dashboard | View dashboard summary |
| `orders:view` | Orders | View orders, investigations |
| `customers:view` | Customers | View customers |
| `customers:block` | Customers | Block/unblock customers |
| `vouchers:view` | Vouchers | View failed/retry-eligible vouchers |
| `vouchers:retry` | Vouchers | Execute voucher retry |
| `supercoins:view` | SuperCoins | View SuperCoin trends |
| `wallet:view` | Wallet | View wallet details |
| `reports:view` | Reports | View brands, errors, abandoned carts, retention |
| `refunds:view` | Refunds | Check refund eligibility |
| `config:manage` | Config | View/update configuration |
| `audit:view` | Audit | View audit logs |
| `admin:users` | RBAC | Manage admin users, roles, permissions |

---

## Testing Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| POST `/auth/login` | ✅ Tested | |
| POST `/auth/logout` | ✅ Tested | |
| GET `/auth/me` | ✅ Tested | |
| GET `/dashboard/summary` | ✅ Tested | |
| GET `/orders` | ✅ Tested | |
| GET `/orders/{orderNumber}` | ✅ Tested | |
| GET `/customers` | ✅ Tested | |
| GET `/customers/{clientId}` | ✅ Tested | |
| GET `/customers/{clientId}/journey` | ⚠️ Testing | Collation fix applied, needs retest |
| POST `/customers/{clientId}/block` | ✅ Tested | |
| GET `/vouchers/failed` | ✅ Tested | |
| GET `/vouchers/retry-eligible` | ✅ Tested | Column fix applied |
| GET `/vouchers/retry-metrics` | ✅ Tested | |
| POST `/vouchers/retry` | ⚠️ Placeholder | See API_FLAGS.md |
| GET `/supercoins/trend` | ✅ Tested | |
| GET `/wallet/{clientId}` | ⚠️ Testing | Needs retest |
| GET `/brands` | ⚠️ Testing | Needs retest |
| GET `/errors` | ⚠️ Testing | Needs retest |
| GET `/abandoned` | ⚠️ Testing | Needs retest |
| GET `/retention` | ⚠️ Testing | Needs retest |
| GET `/refunds/{orderNumber}/check` | ⚠️ Testing | Needs retest |
| GET `/config/{configType}` | ⚠️ Testing | Read-only placeholder |
| PUT `/config/{configType}` | ⚠️ Placeholder | Does not persist |
| GET `/investigations` | ⚠️ Testing | Needs retest |
| POST `/investigations` | ⚠️ Testing | Needs retest |
| GET `/audit` | ⚠️ Testing | Needs retest |
| GET `/users` | ⚠️ Testing | Needs retest |
| GET `/roles` | ⚠️ Testing | Needs retest |
| GET `/permissions` | ⚠️ Testing | Needs retest |

**Legend:**
- ✅ Tested — Working, validated
- ⚠️ Testing — Code complete, needs manual validation
- ⚠️ Placeholder — Functional but limited behavior

---

*Last updated: 2026-08-28*
