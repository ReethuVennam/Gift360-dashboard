# Gift360 Admin Dashboard — Complete Implementation Guide

## Product & Engineering

**Gift360 Admin Dashboard**
Product Requirements & Technical Solution Blueprint

A standalone, production-grade administration platform for Gift360 operations, reporting, investigation and controlled actions.

---

## 1. Executive Summary

Gift360 operational monitoring currently requires users to move into database systems and write manual queries for routine questions such as retrieving recent orders, checking transaction states or investigating voucher failures. This creates operational dependency on engineering/database access and increases investigation time.

The proposed Gift360 Admin Dashboard provides a dedicated operational layer over Gift360's existing services and data. The dashboard is designed for visibility first, exception handling second and controlled operational actions third.

**Key Architecture Decision**: The backend is a thin API layer. All business logic lives in MariaDB stored procedures. The backend calls stored procedures and returns the results as JSON maps to the frontend.

---

## 2. Scope

| In Scope | Out of Scope / Boundary |
|---|---|
| Gift360 orders and transactions | Karatly administration |
| Gift360 wallet and SuperCoins | SabbPe central administration |
| Gift360 vouchers and configuration | Direct frontend-to-database access |
| Gift360 customers and suspicious-user controls | Business logic bypassing Gift360 services |
| Gift360 refunds where technically feasible | Uncontrolled cross-system data access |
| Reporting, exports, exceptions and audit | Features belonging to other company dashboards |

---

## 3. Standalone Architecture

### 3.1 Architecture Principles

- Frontend and backend are separate applications and can be deployed independently.
- The frontend must never connect directly to the Gift360 database.
- Backend authorization must be enforced server-side for every protected API.
- Existing Gift360 business services should remain the source of truth for business rules wherever possible.
- Admin actions should be idempotent where repeated execution could cause financial or operational impact.
- All privileged actions must be auditable.

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER / CLIENT                          │
│              dashboard.gift360.com                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               GIFT360 ADMIN FRONTEND                        │
│           React / Next.js / Vite                             │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Dashboard │ │ Orders  │ │Customers│ │ Vouchers│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Wallets  │ │Refunds  │ │ Reports │ │  Audit  │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (JSON)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              GIFT360 ADMIN BACKEND                          │
│           Spring Boot (Thin API Layer)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Generic Stored Procedure Caller          │   │
│  │                                                      │   │
│  │  @GetMapping("/api/v1/admin/{sp_name}")              │   │
│  │  List<Map> callSP(spName, params...)                 │   │
│  │                                                      │   │
│  │  - Validates request parameters                      │   │
│  │  - Checks RBAC permissions                           │   │
│  │  - Calls stored procedure via SimpleJdbcCall         │   │
│  │  - Returns List<Map<String, Object>> as JSON         │   │
│  │  - Logs audit trail                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth & RBAC Module                      │   │
│  │  - JWT authentication                                │   │
│  │  - Role-based access control                         │   │
│  │  - Admin user management                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Audit Service                           │   │
│  │  - All admin actions logged                          │   │
│  │  - Correlation IDs                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ JDBC (SimpleJdbcCall)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MARIADB                                  │
│          sabbpegiftvouchers database                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Stored Procedures                       │   │
│  │                                                      │   │
│  │  sp_admin_dashboard_summary                          │   │
│  │  sp_admin_orders_list                                │   │
│  │  sp_admin_order_detail                               │   │
│  │  sp_admin_customer_list                              │   │
│  │  sp_admin_customer_detail                            │   │
│  │  sp_admin_customer_journey                           │   │
│  │  sp_admin_customer_block                             │   │
│  │  sp_admin_voucher_failed                             │   │
│  │  sp_admin_voucher_retry_eligible                     │   │
│  │  sp_admin_voucher_retry_execute                      │   │
│  │  sp_admin_supercoin_trend                            │   │
│  │  sp_admin_wallet_detail                              │   │
│  │  sp_admin_brand_stats                                │   │
│  │  sp_admin_geography                                  │   │
│  │  sp_admin_error_breakdown                            │   │
│  │  sp_admin_abandoned_carts                            │   │
│  │  sp_admin_cart_summary                               │   │
│  │  sp_admin_retention                                  │   │
│  │  sp_admin_refund_check                               │   │
│  │  sp_admin_refund_execute                             │   │
│  │  sp_admin_config_get                                 │   │
│  │  sp_admin_config_update                              │   │
│  │  sp_admin_audit_log                                  │   │
│  │  sp_admin_investigation_notes                        │   │
│  │  sp_admin_brand_config                               │   │
│  │  sp_admin_brand_config_update                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Existing Tables (Read-Only)              │   │
│  │  giftcard_orders, giftcard_order_items,               │   │
│  │  giftcard_coupons, client_profile, client_wallet,     │   │
│  │  client_wallet_transactions, master_transactions,     │   │
│  │  easebuzz_processor_transaction_details, brands,       │   │
│  │  giftcard_cart_items, feedback, coupon_usage,         │   │
│  │  coupons, giftvouchers_brands                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Admin Tables (Read/Write)                │   │
│  │  admin_users, admin_roles, admin_permissions,        │   │
│  │  admin_user_roles, admin_role_permissions,           │   │
│  │  admin_audit_logs, admin_investigation_notes         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Cross-DB Access (sabbpepayments)         │   │
│  │  master_transactions, easebuzz_processor_transaction  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Target Experience

An authorized Gift360 operator should be able to open dashboard.gift360.com, select Orders, choose a date range such as the last 10 days, apply status/order-type filters, inspect details and export a report — without writing SQL.

---

## 4. Users, Authentication & RBAC

Permissions should be feature- and action-level, not only menu-level. Access should be authenticated and session-secured. Sensitive actions require elevated permissions and confirmation. User activity and privileged operations must be recorded in audit logs.

### 4.1 Roles

| Role | Typical Access |
|---|---|
| Super Admin | All Gift360 features, configuration and critical actions. |
| Operations Admin | Orders, customers, vouchers, exceptions, reports and approved operational actions. |
| Finance | Transactions, payment information, refunds and financial reports. |
| Support | Customer/order investigation and limited actions. |
| Read Only | Dashboard, search and reports without state-changing actions. |

### 4.2 RBAC Tables

```sql
CREATE TABLE admin_users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE admin_roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE admin_user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE
);

CREATE TABLE admin_role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

CREATE TABLE admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id VARCHAR(36) NOT NULL,
    admin_username VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    target_entity VARCHAR(50),
    target_id VARCHAR(100),
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address VARCHAR(45),
    correlation_id VARCHAR(100),
    result VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_admin_user (admin_user_id),
    INDEX idx_audit_module (module)
);

CREATE TABLE admin_investigation_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_investigation_entity (entity_type, entity_id)
);
```

### 4.3 Seed Data

```sql
INSERT INTO admin_roles (id, name, description) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Full system access'),
('role-admin', 'ADMIN', 'Standard admin access'),
('role-analyst', 'ANALYST', 'Read-only analytics access'),
('role-support', 'SUPPORT', 'Customer support access');

INSERT INTO admin_permissions (id, name, module, description) VALUES
('perm-dashboard-view', 'dashboard:view', 'dashboard', 'View dashboard summary'),
('perm-orders-view', 'orders:view', 'orders', 'View orders'),
('perm-orders-manage', 'orders:manage', 'orders', 'Manage order status'),
('perm-customers-view', 'customers:view', 'customers', 'View customers'),
('perm-customers-block', 'customers:block', 'customers', 'Block/suspend customers'),
('perm-vouchers-view', 'vouchers:view', 'vouchers', 'View vouchers'),
('perm-vouchers-retry', 'vouchers:retry', 'vouchers', 'Retry failed vouchers'),
('perm-supercoins-view', 'supercoins:view', 'supercoins', 'View SuperCoin data'),
('perm-wallet-view', 'wallet:view', 'wallet', 'View wallet data'),
('perm-reports-view', 'reports:view', 'reports', 'View reports'),
('perm-reports-export', 'reports:export', 'reports', 'Export reports'),
('perm-config-manage', 'config:manage', 'config', 'Manage configuration'),
('perm-admin-users', 'admin:users', 'admin', 'Manage admin users'),
('perm-audit-view', 'audit:view', 'audit', 'View audit logs'),
('perm-refunds-view', 'refunds:view', 'refunds', 'View refunds'),
('perm-refunds-execute', 'refunds:execute', 'refunds', 'Execute refunds');

INSERT INTO admin_role_permissions (role_id, permission_id) VALUES
('role-super-admin', 'perm-dashboard-view'),
('role-super-admin', 'perm-orders-view'),
('role-super-admin', 'perm-orders-manage'),
('role-super-admin', 'perm-customers-view'),
('role-super-admin', 'perm-customers-block'),
('role-super-admin', 'perm-vouchers-view'),
('role-super-admin', 'perm-vouchers-retry'),
('role-super-admin', 'perm-supercoins-view'),
('role-super-admin', 'perm-wallet-view'),
('role-super-admin', 'perm-reports-view'),
('role-super-admin', 'perm-reports-export'),
('role-super-admin', 'perm-config-manage'),
('role-super-admin', 'perm-admin-users'),
('role-super-admin', 'perm-audit-view'),
('role-super-admin', 'perm-refunds-view'),
('role-super-admin', 'perm-refunds-execute');
```

---

## 5. Dashboard Overview

| Widget / Area | Requirement |
|---|---|
| Order KPIs | Total orders, successful, failed, pending and other relevant states. |
| Payment summary | PG-paid amount, PG transaction status and relevant payment metrics. |
| Voucher health | Successful, failed, pending/retry-required voucher generations. |
| Wallet / SuperCoins | Usage and credit activity summaries. |
| Refunds | Pending, successful and failed refunds where supported. |
| Critical exceptions | High-priority operational cases requiring investigation. |
| Recent activity | Recent retries, refunds, configuration changes and administrative actions. |

---

## 6. Gift360 Order Information

The order area is the primary replacement for manual SQL-based order investigation.

| Data / Feature | Requirement |
|---|---|
| Order identification | Order ID/reference, merchant/customer reference and timestamps. |
| Order type | Normal PG order vs SuperCoin order. |
| Wallet | Wallet amount used and wallet amount credited. |
| SuperCoins | SuperCoins used and SuperCoins credited. |
| PG payment | Amount paid through PG and relevant payment/transaction reference. |
| Status | Current order/payment/voucher state and relevant timestamps. |
| Customer | Relevant customer details permitted by role. |
| Voucher | Voucher generation status and failure details where applicable. |
| Search | Order ID, customer, mobile/reference and other supported identifiers. |
| Filtering | Date range, status, order type, payment type and other relevant fields. |
| Sorting | Date, amount, status and other useful order-level sorting. |
| Export | Authorized CSV/Excel export with selected filters. |

---

## 7. Reporting & Self-Service Queries

Standard operational reporting should be available through controlled filters rather than requiring users to write database queries.

- Quick date ranges: Today, Yesterday, Last 7 Days, Last 10 Days, Last 30 Days and Custom.
- Filters should persist during pagination and export.
- Large result sets must use server-side pagination.
- Exports should run through the backend and be permission-controlled.

| Report Need | Example |
|---|---|
| Recent transactions | Gift360 orders from the last 10 days. |
| Successful orders | Date range + Success status. |
| PG orders | Date range + Normal PG order. |
| SuperCoin orders | Date range + SuperCoin order. |
| Voucher failures | Date range + Voucher Generation Failed. |
| Wallet activity | Date range + wallet used/credited. |
| Refund report | Date range + refund status. |
| Customer order history | Search customer/mobile → all authorized orders. |

---

## 8. Suspicious Customer Management

| Capability | Requirement |
|---|---|
| Identification | Display relevant indicators that help authorized users identify suspicious customers. |
| Search | Search customer by supported identifiers. |
| Block | Allow authorized admin to block a customer from eligible Gift360 operations. |
| Reason | Require an operational reason for blocking. |
| Confirmation | Show clear impact before execution. |
| Audit | Record admin, timestamp, reason, previous state, new state and result. |
| Unblock | If business rules support it, provide controlled unblock with equivalent audit requirements. |

---

## 9. Voucher Management

### 9.1 Voucher Generation

| Capability | Requirement |
|---|---|
| Status | Show generated, pending, failed and retry-eligible states. |
| Failure reason | Display useful failure/provider response information where available. |
| Retry | Provide controlled retry for eligible failed voucher generation. |
| Retry history | Show retry count, last attempt, result and timestamps. |
| Idempotency | Prevent duplicate voucher issuance when the provider/business flow supports idempotency. |

### 9.2 Voucher Discount Configuration

- Display current voucher discount percentage.
- Allow authorized admins to modify the percentage.
- Validate permitted ranges before saving.
- Show previous and new values in the audit trail.
- Require confirmation for production-impacting changes.

---

## 10. Wallet & SuperCoins Configuration

| Configuration | Requirement |
|---|---|
| Wallet deduction rate | View and configure current deduction rate with appropriate authorization. |
| Wallet credit rate | View and configure current credit rate with appropriate authorization. |
| SuperCoins | Display relevant usage/credit information and operational impact. |
| Change history | Record old value, new value, admin, timestamp and reason. |
| Validation | Prevent invalid values and enforce configured business constraints. |

---

## 11. Refund Management

Refund initiation should be implemented where the underlying payment/provider flow technically supports a safe admin-initiated refund.

| Step | Requirement |
|---|---|
| 1. Identify | Open the eligible Gift360 order/payment. |
| 2. Eligibility | Backend validates whether refund is allowed. |
| 3. Confirmation | Show amount, transaction reference and impact before execution. |
| 4. Execute | Backend performs the provider/business operation. |
| 5. Result | Display success, pending or failure state with provider/reference information. |
| 6. Audit | Record actor, time, amount, reason, request/result and state transition. |

---

## 12. Exception & Investigation Center

| Exception | Priority | Operator Should See |
|---|---|---|
| Voucher generation failed | High | Order, customer, voucher state, failure reason, retry eligibility and history. |
| Refund failed | High | Payment/order, refund state, provider response and next action. |
| Unexpected payment/order state | High | Order timeline, payment status and relevant references. |
| Wallet credit/deduction inconsistency | Critical | Order, wallet movement, expected vs actual state and audit context. |
| Repeated operational failure | High | Attempt count, timestamps and diagnostic context. |

**Investigation Principle**: Every exception should provide a path from summary → source order → related customer/payment/voucher → timeline → available action → action result.

---

## 13. Audit Logging

| Audit Field | Example |
|---|---|
| Actor | Admin user ID / username |
| Timestamp | Action execution time |
| Module | Orders / Voucher / Wallet / Refund / Customer |
| Action | Retry / Block / Update / Refund / Export |
| Target | Order ID / Customer ID / Configuration |
| Before state | Previous status/value |
| After state | New status/value |
| Reason | Admin-provided reason where applicable |
| Result | Success / failure / pending + relevant response reference |

---

## 14. Backend/API Requirements

| Area | Requirement |
|---|---|
| API versioning | Versioned APIs such as /api/v1/... |
| Authorization | Every protected endpoint validates authenticated user and permission. |
| Domain boundary | Gift360 backend only exposes authorized Gift360 operations. |
| Validation | Validate filters, identifiers, configuration values and action inputs server-side. |
| Pagination | Default and maximum page sizes enforced server-side. |
| Idempotency | Required for refund and other potentially repeatable state-changing operations. |
| Error model | Consistent error codes/messages without exposing sensitive internals. |
| Observability | Correlation IDs, structured logs, metrics and health checks. |
| Timeouts | Bounded downstream request timeouts and graceful failure handling. |

---

## 15. Suggested API Surface

| Endpoint Family | Example Purpose |
|---|---|
| /api/v1/auth/* | Login/session/profile/permissions. |
| /api/v1/dashboard/* | KPIs and dashboard summaries. |
| /api/v1/orders/* | Search, list, detail and reporting. |
| /api/v1/customers/* | Customer lookup and authorized blocking. |
| /api/v1/vouchers/* | Voucher status, detail and retry. |
| /api/v1/config/* | Voucher discount and wallet rate configuration. |
| /api/v1/refunds/* | Eligibility, initiation and refund status. |
| /api/v1/exceptions/* | Exception queue and investigation. |
| /api/v1/reports/* | Report generation and export. |
| /api/v1/audit/* | Authorized audit-log retrieval. |

---

## 16. Security & Production Readiness

- RBAC enforced at backend/API level.
- Sensitive customer/payment information masked by default where appropriate.
- No database credentials or database endpoints exposed to the frontend.
- Secrets stored outside source code and managed through secure configuration/secrets management.
- TLS for all external communication.
- Rate limiting and abuse protection for administrative APIs.
- Audit logging for privileged operations and sensitive data access.
- Idempotency and concurrency controls for financial/state-changing operations.
- Server-side filtering and parameterized queries to prevent injection risks.
- Secure export handling with authorization checks and controlled file generation.
- Operational monitoring for API errors, latency, downstream failures and unusual action volumes.

---

## 17. Performance & Scalability

| Area | Requirement |
|---|---|
| Large order tables | Server-side pagination and indexed search/filter columns. |
| Date-range reports | Bounded queries; asynchronous export for large datasets. |
| Dashboard KPIs | Efficient aggregate queries or pre-aggregated operational metrics where justified. |
| Concurrent admins | Backend designed for concurrent read and controlled write operations. |
| Downstream dependencies | Timeouts, retries and circuit-breaker patterns where appropriate. |
| Caching | Use selectively for non-sensitive, low-volatility reference/configuration data. |

---

## 18. Deployment Model

| Component | Deployment Requirement |
|---|---|
| Frontend | Independent Gift360 frontend deployment at dashboard.gift360.com. |
| Backend | Dedicated Gift360 Admin Backend deployment; independently scalable and deployable. |
| Database | Existing Gift360 DB remains the source of Gift360 operational data. |
| Environment separation | Development, UAT/staging and production configurations must be isolated. |
| CI/CD | Automated build, test, security checks and controlled production deployment. |
| Rollback | Versioned deployments with a tested rollback strategy. |

---

## 19. Recommended Implementation Phases

| Phase | Focus | Deliverables |
|---|---|---|
| Phase 1 | Foundation | Frontend shell, backend foundation, authentication, RBAC, database/service integration, audit foundation. |
| Phase 2 | Visibility | Dashboard KPIs, order search, filtering, sorting, detail pages and exports. |
| Phase 3 | Operations | Voucher retry, suspicious customer block, voucher discount and wallet-rate configuration. |
| Phase 4 | Financial & Exceptions | Refund flow, exception center, investigation timelines and operational reporting. |
| Phase 5 | Hardening | Performance, security testing, observability, failure testing, UAT and production readiness. |

---

## 20. Definition of Done

- Gift360 Admin is independently deployable at dashboard.gift360.com.
- Gift360 Admin Backend is independently deployable and is not dependent on a shared Karatly/SabbPe admin backend.
- Frontend has no direct database connectivity.
- Authorized users can retrieve common order reports without writing SQL.
- Users can search, filter, sort, paginate and export Gift360 orders.
- Wallet, SuperCoins, PG and order-type information is visible at order level.
- Eligible voucher failures can be retried with visible retry history.
- Authorized users can block suspicious customers with audit records.
- Authorized users can modify voucher discount and wallet rates with validation and audit.
- Refunds are safely initiated where technically feasible and all outcomes are tracked.
- Critical exceptions have investigation details and supported next actions.
- All privileged operations are authenticated, authorized, auditable and protected against duplicate execution.

---

## 21. Success Metrics

| Metric | Desired Outcome |
|---|---|
| Manual SQL usage for routine Gift360 reports | Significant reduction |
| Time to retrieve a 10-day order report | Minutes → self-service / near real-time |
| Average production investigation time | Reduction |
| Voucher failure recovery | Increase through controlled retry |
| Refund investigation time | Reduction |
| Privileged actions with audit records | 100% |
| Unauthorized data access | Zero |

---

## 22. Final Product Definition

GIFT360 ADMIN = STANDALONE PRODUCT. Gift360 Admin should be built as an independent frontend + independent backend + Gift360 data boundary. It should solve the immediate operational problem — eliminating routine dependence on manual database queries — while providing a secure foundation for reporting, investigation and controlled production operations.

---
---

# PART 2: TECHNICAL IMPLEMENTATION

---

## 23. Generic Backend Architecture

The backend follows a **thin API layer** pattern. Almost every endpoint:

1. Receives request parameters
2. Validates permissions (RBAC)
3. Calls a stored procedure via `SimpleJdbcCall`
4. Returns the result as `List<Map<String, Object>>`
5. Logs the action in audit

### 23.1 Generic Stored Procedure Caller

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminSpCaller {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final AuditService auditService;

    /**
     * Generic stored procedure call that returns List<Map>.
     * This is the ONLY pattern used for all admin read operations.
     */
    public List<Map<String, Object>> callQuery(String spName, Map<String, Object> params) {
        SimpleJdbcCall call = new SimpleJdbcCall(dataSource)
            .withProcedureName(spName)
            .returningResultSet("result",
                (rs, rowNum) -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
                        row.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i));
                    }
                    return row;
                });

        if (params != null && !params.isEmpty()) {
            call.addDeclaredParameter(new MapSqlParameterSource(params));
        }

        Map<String, Object> result = call.execute();
        Object resultSet = result.get("result");
        if (resultSet instanceof List) {
            return (List<Map<String, Object>>) resultSet;
        }
        return List.of();
    }

    /**
     * Generic stored procedure call that returns a single row (Map).
     */
    public Map<String, Object> callSingle(String spName, Map<String, Object> params) {
        List<Map<String, Object>> rows = callQuery(spName, params);
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    /**
     * Generic stored procedure call that returns a JSON string column.
     * Used for procedures that return JSON_OBJECT/JSON_ARRAYAGG.
     */
    public String callJson(String spName, Map<String, Object> params) {
        SimpleJdbcCall call = new SimpleJdbcCall(dataSource)
            .withProcedureName(spName);

        if (params != null && !params.isEmpty()) {
            call.addDeclaredParameter(new MapSqlParameterSource(params));
        }

        Map<String, Object> result = call.execute();
        // Extract the first column from the result
        for (Map.Entry<String, Object> entry : result.entrySet()) {
            if (entry.getValue() instanceof String) {
                return (String) entry.getValue();
            }
        }
        return "[]";
    }

    /**
     * Generic update/insert stored procedure call.
     * Returns rows affected.
     */
    public int callUpdate(String spName, Map<String, Object> params) {
        SimpleJdbcCall call = new SimpleJdbcCall(dataSource)
            .withProcedureName(spName);

        if (params != null && !params.isEmpty()) {
            call.addDeclaredParameter(new MapSqlParameterSource(params));
        }

        Map<String, Object> result = call.execute();
        Object rowCount = result.get("#update-count");
        return rowCount != null ? ((Number) rowCount).intValue() : 0;
    }
}
```

### 23.2 Generic Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminSpCaller spCaller;
    private final AuditService auditService;
    private final AuthService authService;

    // ========== DASHBOARD ==========
    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> dashboardSummary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("dashboard:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_dashboard_summary", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== ORDERS ==========
    @GetMapping("/orders")
    public ResponseEntity<?> ordersList(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String brandCode,
            @RequestParam(required = false) String voucherStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("orders:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString());
        params.put("p_to_date", to != null ? to : LocalDate.now().toString());
        params.put("p_brand_code", brandCode);
        params.put("p_voucher_status", voucherStatus);
        params.put("p_payment_method", paymentMethod);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_orders_list", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<?> orderDetail(
            @PathVariable String orderNumber,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("orders:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_order_number", orderNumber);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_order_detail", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== CUSTOMERS ==========
    @GetMapping("/customers")
    public ResponseEntity<?> customerList(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("customers:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString());
        params.put("p_to_date", to != null ? to : LocalDate.now().toString());
        params.put("p_search", search);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_list", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    @GetMapping("/customers/{clientId}")
    public ResponseEntity<?> customerDetail(
            @PathVariable String clientId,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("customers:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_client_id", clientId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_detail", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/customers/{clientId}/journey")
    public ResponseEntity<?> customerJourney(
            @PathVariable String clientId,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("customers:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_client_id", clientId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_journey", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PostMapping("/customers/{clientId}/block")
    public ResponseEntity<?> customerBlock(
            @PathVariable String clientId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("customers:block")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_client_id", clientId);
        params.put("p_status", body.get("status")); // "blocked" or "active"
        params.put("p_reason", body.get("reason"));
        params.put("p_admin_user_id", user.getId());

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_block", params);

        auditService.log(user.getId(), user.getUsername(), "BLOCK_CUSTOMER",
            "customer", clientId, null, body.get("status"), body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== VOUCHERS ==========
    @GetMapping("/vouchers/failed")
    public ResponseEntity<?> voucherFailed(
            @RequestParam(required = false) String clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("vouchers:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_client_id", clientId);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_failed", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    @GetMapping("/vouchers/retry-eligible")
    public ResponseEntity<?> voucherRetryEligible(
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("vouchers:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_retry_eligible", Map.of());
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PostMapping("/vouchers/retry")
    public ResponseEntity<?> voucherRetry(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("vouchers:retry")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_order_number", body.get("orderNumber"));
        params.put("p_order_item_id", body.get("orderItemId"));
        params.put("p_admin_user_id", user.getId());

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_retry_execute", params);

        auditService.log(user.getId(), user.getUsername(), "RETRY_VOUCHER",
            "voucher", body.get("orderNumber"), null, "RETRY", body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== SUPERCOINS ==========
    @GetMapping("/supercoins/trend")
    public ResponseEntity<?> supercoinTrend(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("supercoins:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_supercoin_trend", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== WALLET ==========
    @GetMapping("/wallet/{clientId}")
    public ResponseEntity<?> walletDetail(
            @PathVariable String clientId,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("wallet:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_client_id", clientId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_wallet_detail", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== BRANDS ==========
    @GetMapping("/brands")
    public ResponseEntity<?> brandStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("reports:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_brand_stats", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== GEOGRAPHY ==========
    @GetMapping("/geography")
    public ResponseEntity<?> geography(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("reports:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_geography", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== ERRORS ==========
    @GetMapping("/errors")
    public ResponseEntity<?> errorBreakdown(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("reports:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_error_breakdown", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== ABANDONED CARTS ==========
    @GetMapping("/abandoned")
    public ResponseEntity<?> abandonedCarts(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("reports:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString());
        params.put("p_to_date", to != null ? to : LocalDate.now().toString());
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_abandoned_carts", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    // ========== RETENTION ==========
    @GetMapping("/retention")
    public ResponseEntity<?> retention(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("reports:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_from_date", from != null ? from : LocalDate.now().minusDays(30).toString(),
            "p_to_date", to != null ? to : LocalDate.now().toString()
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_retention", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== REFUNDS ==========
    @GetMapping("/refunds/{orderNumber}/check")
    public ResponseEntity<?> refundCheck(
            @PathVariable String orderNumber,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("refunds:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_order_number", orderNumber);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_refund_check", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PostMapping("/refunds/{orderNumber}/execute")
    public ResponseEntity<?> refundExecute(
            @PathVariable String orderNumber,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("refunds:execute")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_order_number", orderNumber);
        params.put("p_reason", body.get("reason"));
        params.put("p_admin_user_id", user.getId());

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_refund_execute", params);

        auditService.log(user.getId(), user.getUsername(), "REFUND_EXECUTE",
            "order", orderNumber, null, "REFUND_INITIATED", body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== CONFIGURATION ==========
    @GetMapping("/config/{configType}")
    public ResponseEntity<?> configGet(
            @PathVariable String configType,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("config:manage")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_config_type", configType);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_config_get", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PutMapping("/config/{configType}")
    public ResponseEntity<?> configUpdate(
            @PathVariable String configType,
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("config:manage")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_config_type", configType);
        params.put("p_config_key", body.get("key"));
        params.put("p_config_value", body.get("value"));
        params.put("p_admin_user_id", user.getId());
        params.put("p_reason", body.get("reason"));

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_config_update", params);

        auditService.log(user.getId(), user.getUsername(), "CONFIG_UPDATE",
            "config", configType, null, body.get("value").toString(), body.get("reason").toString());

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== INVESTIGATIONS ==========
    @GetMapping("/investigations")
    public ResponseEntity<?> investigationList(
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("orders:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of(
            "p_entity_type", entityType,
            "p_entity_id", entityId
        );

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_investigation_notes", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PostMapping("/investigations")
    public ResponseEntity<?> investigationCreate(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("orders:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_admin_user_id", user.getId());
        params.put("p_entity_type", body.get("entityType"));
        params.put("p_entity_id", body.get("entityId"));
        params.put("p_note", body.get("note"));
        params.put("p_is_internal", body.get("isInternal"));

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_investigation_create", params);

        auditService.log(user.getId(), user.getUsername(), "CREATE_INVESTIGATION",
            body.get("entityType").toString(), body.get("entityId").toString(),
            null, "NOTE_CREATED", null);

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ========== AUDIT LOG ==========
    @GetMapping("/audit")
    public ResponseEntity<?> auditList(
            @RequestParam(required = false) String adminUserId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestHeader("Authorization") String token) {

        AuthService.AdminUser user = authService.validate(token);
        if (!user.hasPermission("audit:view")) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_admin_user_id", adminUserId);
        params.put("p_module", module);
        params.put("p_from_date", from);
        params.put("p_to_date", to);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_audit_log", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }
}
```

### 23.3 Audit Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final JdbcTemplate jdbcTemplate;

    @Async
    public void log(String adminUserId, String username, String action,
                    String module, String targetEntity, String targetId,
                    String previousValue, String newValue, String reason) {
        try {
            String correlationId = MDC.get("correlationId");
            String ip = MDC.get("clientIp");

            jdbcTemplate.update(
                "INSERT INTO admin_audit_logs " +
                "(admin_user_id, admin_username, action, module, target_entity, target_id, " +
                "previous_value, new_value, reason, ip_address, correlation_id, result) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS')",
                adminUserId, username, action, module, targetEntity, targetId,
                previousValue, newValue, reason, ip, correlationId
            );
        } catch (Exception e) {
            log.error("Failed to write audit log", e);
        }
    }
}
```

### 23.4 Auth Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final JdbcTemplate jdbcTemplate;
    private final JwtTokenProvider jwtTokenProvider;

    @Data
    @Builder
    public static class AdminUser {
        private String id;
        private String username;
        private String email;
        private Set<String> permissions;

        public boolean hasPermission(String permission) {
            return permissions != null && permissions.contains(permission);
        }
    }

    public AdminUser validate(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new UnauthorizedException("Invalid token");
        }
        String jwt = token.substring(7);
        String userId = jwtTokenProvider.getUserId(jwt);

        // Load user with permissions
        Map<String, Object> userRow = jdbcTemplate.queryForMap(
            "SELECT u.id, u.username, u.email " +
            "FROM admin_users u WHERE u.id = ? AND u.is_active = 1", userId);

        Set<String> permissions = new HashSet<>();
        jdbcTemplate.queryForList(
            "SELECT p.name FROM admin_permissions p " +
            "JOIN admin_role_permissions rp ON rp.permission_id = p.id " +
            "JOIN admin_user_roles ur ON ur.role_id = rp.role_id " +
            "WHERE ur.user_id = ?", userId
        ).forEach(row -> permissions.add((String) row.get("name")));

        return AdminUser.builder()
            .id((String) userRow.get("id"))
            .username((String) userRow.get("username"))
            .email((String) userRow.get("email"))
            .permissions(permissions)
            .build();
    }
}
```

---

## 24. Database Stored Procedures

All stored procedures follow the pattern:
- Accept input parameters (filters, pagination, identifiers)
- Return result sets (rows)
- For JSON responses, return a single column with JSON_OBJECT/JSON_ARRAYAGG

### 24.1 Dashboard Summary

```sql
DROP PROCEDURE IF EXISTS sp_admin_dashboard_summary;

DELIMITER //

CREATE PROCEDURE sp_admin_dashboard_summary(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    -- Order KPIs
    SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' THEN o.order_id END) AS paid_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'PENDING' THEN o.order_id END) AS pending_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'FAILED' THEN o.order_id END) AS failed_orders,
        COUNT(DISTINCT CASE WHEN o.status = 'CANCELLED' THEN o.order_id END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.wallet_amount END), 0) AS total_wallet_used,
        COUNT(DISTINCT o.client_id) AS unique_customers,
        -- Voucher health
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_generated,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NULL THEN goi.order_item_id END) AS vouchers_failed,
        -- SuperCoins
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' AND EXISTS (
            SELECT 1 FROM giftcard_order_items goi2
            JOIN giftcard_coupons gc2 ON gc2.order_item_id = goi2.order_item_id
            WHERE goi2.order_id = o.order_id
        ) THEN o.coins_redeemed ELSE 0 END), 0) AS supercoins_burnt,
        COALESCE(SUM(o.coins_refunded), 0) AS supercoins_refunded,
        -- Wallet
        COALESCE(SUM(CASE WHEN o.wallet_used = 1 THEN o.wallet_amount ELSE 0 END), 0) AS wallet_redemptions
    FROM giftcard_orders o
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY);
END//

DELIMITER ;
```

### 24.2 Orders List

```sql
DROP PROCEDURE IF EXISTS sp_admin_orders_list;

DELIMITER //

CREATE PROCEDURE sp_admin_orders_list(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_brand_code VARCHAR(50),
    IN p_voucher_status VARCHAR(20),
    IN p_payment_method VARCHAR(20),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.order_id, o.order_number, o.client_id,
        cp.client_name, cp.client_email, cp.client_mobile,
        o.total_amount, o.status AS order_status,
        o.created_at, o.paid_at,
        o.wallet_used, o.wallet_amount,
        o.payment_method,
        o.coins_earned, o.coins_redeemed, o.coins_refunded,
        COALESCE(mt.status, '') AS payment_status,
        COALESCE(mt.processor, '') AS payment_processor,
        COALESCE(mt.amount_final, 0) AS payment_amount,
        goi.order_item_id, goi.quantity, goi.unit_value, goi.line_total,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        CASE
            WHEN gc.coupon_id IS NOT NULL THEN 'GENERATED'
            WHEN o.status = 'PAID' THEN 'FAILED'
            WHEN o.status = 'PENDING' THEN 'NOT_APPLICABLE_PENDING'
            ELSE 'NOT_APPLICABLE_FAILED'
        END AS voucher_status,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.is_scratched, goi.is_gift
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id = o.client_id
    LEFT JOIN sabbpepayments.master_transactions mt ON mt.order_reference = o.order_number
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (p_brand_code IS NULL OR p_brand_code = '' OR
             JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) = p_brand_code)
        AND (p_voucher_status IS NULL OR p_voucher_status = '' OR
             (p_voucher_status = 'generated' AND gc.coupon_id IS NOT NULL) OR
             (p_voucher_status = 'failed' AND o.status = 'PAID' AND gc.coupon_id IS NULL))
        AND (p_payment_method IS NULL OR p_payment_method = '' OR o.payment_method = p_payment_method)
    ORDER BY o.created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

DELIMITER ;
```

### 24.3 Order Detail

```sql
DROP PROCEDURE IF EXISTS sp_admin_order_detail;

DELIMITER //

CREATE PROCEDURE sp_admin_order_detail(
    IN p_order_number VARCHAR(50)
)
BEGIN
    -- Order info
    SELECT
        o.order_id, o.order_number, o.client_id, o.total_amount, o.status,
        o.created_at, o.paid_at, o.wallet_used, o.wallet_amount,
        o.payment_method, o.earn_cashback,
        o.coins_earned, o.coins_redeemed, o.coins_refunded,
        o.sc_merchant_txn_id, o.sc_reference_txn_id, o.sc_redeem_txn_id,
        cp.client_name, cp.client_email, cp.client_mobile
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id = o.client_id
    WHERE o.order_number = p_order_number;

    -- Order items with vouchers
    SELECT
        goi.order_item_id, goi.quantity, goi.unit_value, goi.line_total,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.is_scratched, goi.is_gift, goi.scratched_at, goi.gift_sent_at,
        gc.coupon_id, gc.status AS coupon_status
    FROM giftcard_order_items goi
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE goi.order_id = (SELECT order_id FROM giftcard_orders WHERE order_number = p_order_number LIMIT 1);

    -- Payment info
    SELECT
        mt.id AS payment_txn_id, mt.status AS payment_status,
        mt.processor, mt.amount_requested, mt.amount_final,
        mt.initiated_at, mt.completed_at,
        ept.bank_ref_num, ept.easepay_id, ept.mode AS payment_mode
    FROM sabbpepayments.master_transactions mt
    LEFT JOIN sabbpepayments.easebuzz_processor_transaction_details ept ON ept.master_transaction_id = mt.id
    WHERE mt.order_reference = p_order_number;

    -- Wallet transactions
    SELECT
        cwt.transaction_type, cwt.amount, cwt.previous_balance, cwt.new_balance,
        cwt.created_at, cwt.notes
    FROM client_wallet_transactions cwt
    WHERE cwt.order_id = (SELECT order_id FROM giftcard_orders WHERE order_number = p_order_number LIMIT 1)
    ORDER BY cwt.created_at;
END//

DELIMITER ;
```

### 24.4 Customer List

```sql
DROP PROCEDURE IF EXISTS sp_admin_customer_list;

DELIMITER //

CREATE PROCEDURE sp_admin_customer_list(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_search VARCHAR(255),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.client_id, cp.client_name, cp.client_email, cp.client_mobile,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_spent,
        COUNT(DISTINCT CASE WHEN gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_received,
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        MAX(o.created_at) AS last_order_at,
        cp.client_account_status
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id = o.client_id
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (p_search IS NULL OR p_search = '' OR
             cp.client_name LIKE CONCAT('%', p_search, '%') OR
             cp.client_email LIKE CONCAT('%', p_search, '%') OR
             cp.client_mobile LIKE CONCAT('%', p_search, '%') OR
             o.client_id LIKE CONCAT('%', p_search, '%'))
    GROUP BY o.client_id, cp.client_name, cp.client_email, cp.client_mobile, cp.client_account_status
    ORDER BY total_spent DESC
    LIMIT p_size OFFSET v_offset;
END//

DELIMITER ;
```

### 24.5 Customer Detail

```sql
DROP PROCEDURE IF EXISTS sp_admin_customer_detail;

DELIMITER //

CREATE PROCEDURE sp_admin_customer_detail(
    IN p_client_id VARCHAR(36)
)
BEGIN
    -- Profile
    SELECT client_id, client_name, client_email, client_mobile,
           client_account_status, created_at
    FROM client_profile WHERE client_id = p_client_id;

    -- Order summary
    SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_spent,
        COALESCE(SUM(o.coins_earned), 0) AS supercoins_earned,
        COALESCE(SUM(o.coins_redeemed), 0) AS supercoins_redeemed,
        MAX(o.created_at) AS last_order_at
    FROM giftcard_orders o WHERE o.client_id = p_client_id;

    -- Wallet
    SELECT voucher_cashback_balance, total_balance, pending_earn_fraction
    FROM client_wallet WHERE client_id = p_client_id;

    -- Feedback
    SELECT COUNT(*) AS feedback_count, ROUND(AVG(overall), 2) AS avg_overall,
           ROUND(AVG(nps), 2) AS avg_nps
    FROM feedback WHERE client_id = p_client_id;
END//

DELIMITER ;
```

### 24.6 Customer Journey

```sql
DROP PROCEDURE IF EXISTS sp_admin_customer_journey;

DELIMITER //

CREATE PROCEDURE sp_admin_customer_journey(
    IN p_client_id VARCHAR(36)
)
BEGIN
    SELECT * FROM (
        SELECT o.created_at AS event_at, 'ORDER' AS event_type,
            o.order_number AS ref, o.status AS status_detail,
            o.total_amount AS amount,
            (SELECT JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name'))
             FROM giftcard_order_items goi WHERE goi.order_id = o.order_id LIMIT 1) AS detail,
            o.coins_redeemed AS coins_involved
        FROM giftcard_orders o WHERE o.client_id = p_client_id

        UNION ALL

        SELECT f.created_at, 'FEEDBACK', f.overall, f.nps, NULL,
               COALESCE(f.suggestion, f.issue_detail), NULL
        FROM feedback f WHERE f.client_id = p_client_id
    ) timeline
    ORDER BY event_at DESC;
END//

DELIMITER ;
```

### 24.7 Customer Block

```sql
DROP PROCEDURE IF EXISTS sp_admin_customer_block;

DELIMITER //

CREATE PROCEDURE sp_admin_customer_block(
    IN p_client_id VARCHAR(36),
    IN p_status VARCHAR(20),
    IN p_reason TEXT,
    IN p_admin_user_id VARCHAR(36)
)
BEGIN
    DECLARE v_prev_status VARCHAR(20);

    SELECT client_account_status INTO v_prev_status
    FROM client_profile WHERE client_id = p_client_id;

    UPDATE client_profile
    SET client_account_status = p_status
    WHERE client_id = p_client_id;

    SELECT ROW_COUNT() AS rows_affected,
           v_prev_status AS previous_status,
           p_status AS new_status;
END//

DELIMITER ;
```

### 24.8 Voucher Failed

```sql
DROP PROCEDURE IF EXISTS sp_admin_voucher_failed;

DELIMITER //

CREATE PROCEDURE sp_admin_voucher_failed(
    IN p_client_id VARCHAR(36),
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        go.order_number, goi.order_item_id, go.client_id,
        cp.client_name, cp.client_email,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        goi.quantity, goi.unit_value, goi.line_total,
        goi.last_evc_response_code, goi.last_evc_response_msg,
        goi.last_evc_attempt_at, goi.retry_count,
        go.paid_at, go.status AS order_status
    FROM giftcard_orders go
    INNER JOIN giftcard_order_items goi ON go.order_id = goi.order_id
    LEFT JOIN client_profile cp ON cp.client_id = go.client_id
    WHERE go.status = 'PAID' AND goi.status = 0
        AND (p_client_id IS NULL OR p_client_id = '' OR go.client_id = p_client_id)
    ORDER BY go.paid_at DESC
    LIMIT p_size OFFSET v_offset;
END//

DELIMITER ;
```

### 24.9 Voucher Retry Eligible

```sql
DROP PROCEDURE IF EXISTS sp_admin_voucher_retry_eligible;

DELIMITER //

CREATE PROCEDURE sp_admin_voucher_retry_eligible()
BEGIN
    SELECT
        go.order_number AS original_order_number,
        goi.order_item_id AS order_item_id,
        goi.sku_code, goi.quantity, goi.amount,
        goi.distributor_id, go.paid_at AS order_paid_at,
        COALESCE(goi.retry_count, 0) AS attempt_count,
        go.customer_name, go.customer_email, go.customer_mobile
    FROM sabbpepayments.master_transactions mt
    INNER JOIN giftcard_orders go ON go.order_number = mt.order_reference
    INNER JOIN giftcard_order_items goi ON go.order_id = goi.order_id
    WHERE UPPER(TRIM(mt.status)) IN ('SUCCESS','PAID','COMPLETED')
        AND UPPER(TRIM(go.status)) = 'PAID'
        AND COALESCE(goi.status, 0) = 0
        AND (COALESCE(goi.retry_count, 0) < 3);
END//

DELIMITER ;
```

### 24.10 Voucher Retry Execute

```sql
DROP PROCEDURE IF EXISTS sp_admin_voucher_retry_execute;

DELIMITER //

CREATE PROCEDURE sp_admin_voucher_retry_execute(
    IN p_order_number VARCHAR(50),
    IN p_order_item_id VARCHAR(100),
    IN p_admin_user_id VARCHAR(36)
)
BEGIN
    -- Update retry count
    UPDATE giftcard_order_items
    SET retry_count = COALESCE(retry_count, 0) + 1,
        updated_at = NOW()
    WHERE order_item_id = p_order_item_id;

    SELECT ROW_COUNT() AS rows_affected,
           retry_count AS new_retry_count
    FROM giftcard_order_items
    WHERE order_item_id = p_order_item_id;
END//

DELIMITER ;
```

### 24.11 SuperCoin Trend

```sql
DROP PROCEDURE IF EXISTS sp_admin_supercoin_trend;

DELIMITER //

CREATE PROCEDURE sp_admin_supercoin_trend(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        DATE(o.created_at) AS day,
        COALESCE(SUM(o.coins_earned), 0) AS earned,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' AND EXISTS (
            SELECT 1 FROM giftcard_order_items goi2
            JOIN giftcard_coupons gc2 ON gc2.order_item_id = goi2.order_item_id
            WHERE goi2.order_id = o.order_id
        ) THEN o.coins_redeemed ELSE 0 END), 0) AS burnt,
        COALESCE(SUM(o.coins_refunded), 0) AS refunded
    FROM giftcard_orders o
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
        AND (o.coins_earned > 0 OR o.coins_redeemed > 0 OR o.coins_refunded > 0)
    GROUP BY DATE(o.created_at)
    ORDER BY day ASC;
END//

DELIMITER ;
```

### 24.12 Wallet Detail

```sql
DROP PROCEDURE IF EXISTS sp_admin_wallet_detail;

DELIMITER //

CREATE PROCEDURE sp_admin_wallet_detail(
    IN p_client_id VARCHAR(36)
)
BEGIN
    -- Wallet balance
    SELECT voucher_cashback_balance, total_balance, pending_earn_fraction
    FROM client_wallet WHERE client_id = p_client_id;

    -- Recent transactions
    SELECT transaction_type, amount, previous_balance, new_balance,
           order_id, created_at, notes
    FROM client_wallet_transactions
    WHERE client_id = p_client_id
    ORDER BY created_at DESC
    LIMIT 50;
END//

DELIMITER ;
```

### 24.13 Brand Stats

```sql
DROP PROCEDURE IF EXISTS sp_admin_brand_stats;

DELIMITER //

CREATE PROCEDURE sp_admin_brand_stats(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        COUNT(DISTINCT goi.order_item_id) AS total_items,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN goi.line_total END), 0) AS total_revenue,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NOT NULL THEN goi.order_item_id END) AS vouchers_generated,
        COUNT(DISTINCT CASE WHEN o.status = 'PAID' AND gc.coupon_id IS NULL THEN goi.order_item_id END) AS vouchers_failed
    FROM giftcard_order_items goi
    JOIN giftcard_orders o ON o.order_id = goi.order_id
    LEFT JOIN giftcard_coupons gc ON gc.order_item_id = goi.order_item_id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    GROUP BY brand_code, brand_name
    ORDER BY total_revenue DESC;
END//

DELIMITER ;
```

### 24.14 Geography

```sql
DROP PROCEDURE IF EXISTS sp_admin_geography;

DELIMITER //

CREATE PROCEDURE sp_admin_geography(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        COALESCE(NULLIF(TRIM(ept.city), ''), 'Unknown') AS city,
        COALESCE(NULLIF(TRIM(ept.state), ''), 'Unknown') AS state,
        COUNT(DISTINCT o.client_id) AS unique_customers,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount END), 0) AS total_revenue
    FROM giftcard_orders o
    JOIN sabbpepayments.master_transactions mt ON mt.order_reference = o.order_number
    LEFT JOIN sabbpepayments.easebuzz_processor_transaction_details ept ON ept.master_transaction_id = mt.id
    WHERE o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    GROUP BY city, state
    ORDER BY total_revenue DESC;
END//

DELIMITER ;
```

### 24.15 Error Breakdown

```sql
DROP PROCEDURE IF EXISTS sp_admin_error_breakdown;

DELIMITER //

CREATE PROCEDURE sp_admin_error_breakdown(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT
        goi.last_evc_response_code AS response_code,
        goi.last_evc_response_msg AS response_msg,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_code')) AS brand_code,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name,
        COUNT(*) AS failure_count,
        COALESCE(SUM(goi.line_total), 0) AS amount_stuck
    FROM giftcard_order_items goi
    JOIN giftcard_orders o ON o.order_id = goi.order_id
    WHERE o.status = 'PAID'
        AND goi.last_evc_response_code IS NOT NULL
        AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    GROUP BY response_code, response_msg, brand_code, brand_name
    ORDER BY failure_count DESC;
END//

DELIMITER ;
```

### 24.16 Abandoned Carts

```sql
DROP PROCEDURE IF EXISTS sp_admin_abandoned_carts;

DELIMITER //

CREATE PROCEDURE sp_admin_abandoned_carts(
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT
        o.order_number, o.status AS order_status, o.total_amount, o.created_at,
        cp.client_name, cp.client_email, cp.client_mobile,
        JSON_UNQUOTE(JSON_EXTRACT(goi.meta, '$.brand_name')) AS brand_name
    FROM giftcard_orders o
    LEFT JOIN client_profile cp ON cp.client_id = o.client_id
    LEFT JOIN giftcard_order_items goi ON goi.order_id = o.order_id
    WHERE o.status != 'PAID'
        AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    ORDER BY o.created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

DELIMITER ;
```

### 24.17 Retention

```sql
DROP PROCEDURE IF EXISTS sp_admin_retention;

DELIMITER //

CREATE PROCEDURE sp_admin_retention(
    IN p_from_date DATE,
    IN p_to_date DATE
)
BEGIN
    SELECT DATE(order_level.created_at) AS day,
        ROUND(SUM(order_level.retention), 2) AS retention,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'CASHBACK' THEN order_level.order_id END) AS cashback_orders,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'SUPERCOINS' THEN order_level.order_id END) AS supercoins_orders,
        COUNT(DISTINCT CASE WHEN order_level.flow_type = 'STANDARD' THEN order_level.order_id END) AS standard_orders
    FROM (
        SELECT o.order_id, o.created_at,
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM giftcard_order_items goi7
                    JOIN giftcard_coupons gc7 ON gc7.order_item_id = goi7.order_item_id
                    WHERE goi7.order_id = o.order_id
                ) THEN 0
                WHEN o.earn_cashback = 1 THEN item_discount.discount_value
                WHEN o.coins_earned > 0 THEN o.coins_earned * 0.75
                ELSE 2 * item_discount.discount_value
            END AS retention,
            CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM giftcard_order_items goi8
                    JOIN giftcard_coupons gc8 ON gc8.order_item_id = goi8.order_item_id
                    WHERE goi8.order_id = o.order_id
                ) THEN 'NONE'
                WHEN o.earn_cashback = 1 THEN 'CASHBACK'
                WHEN o.coins_earned > 0 THEN 'SUPERCOINS'
                ELSE 'STANDARD'
            END AS flow_type
        FROM giftcard_orders o
        LEFT JOIN (
            SELECT goi9.order_id,
                SUM(COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(goi9.meta, '$.customer_discount_percent')) AS DECIMAL(10,4)), 0) / 100 * goi9.line_total) AS discount_value
            FROM giftcard_order_items goi9
            JOIN giftcard_coupons gc9 ON gc9.order_item_id = goi9.order_item_id
            GROUP BY goi9.order_id
        ) item_discount ON item_discount.order_id = o.order_id
        WHERE o.status = 'PAID' AND o.created_at >= p_from_date AND o.created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY)
    ) order_level
    GROUP BY DATE(order_level.created_at)
    ORDER BY day ASC;
END//

DELIMITER ;
```

### 24.18 Refund Check

```sql
DROP PROCEDURE IF EXISTS sp_admin_refund_check;

DELIMITER //

CREATE PROCEDURE sp_admin_refund_check(
    IN p_order_number VARCHAR(50)
)
BEGIN
    SELECT
        o.order_number, o.total_amount, o.status AS order_status,
        o.payment_method, o.coins_redeemed,
        mt.status AS payment_status, mt.processor, mt.amount_final,
        CASE
            WHEN o.status = 'PAID' AND o.coins_redeemed = 0 THEN 'ELIGIBLE'
            WHEN o.status = 'PAID' AND o.coins_redeemed > 0 THEN 'SUPERCOIN_ORDER'
            ELSE 'NOT_ELIGIBLE'
        END AS refund_eligibility
    FROM giftcard_orders o
    LEFT JOIN sabbpepayments.master_transactions mt ON mt.order_reference = o.order_number
    WHERE o.order_number = p_order_number;
END//

DELIMITER ;
```

### 24.19 Refund Execute

```sql
DROP PROCEDURE IF EXISTS sp_admin_refund_execute;

DELIMITER //

CREATE PROCEDURE sp_admin_refund_execute(
    IN p_order_number VARCHAR(50),
    IN p_reason TEXT,
    IN p_admin_user_id VARCHAR(36)
)
BEGIN
    -- Update order status
    UPDATE giftcard_orders
    SET status = 'REFUNDED'
    WHERE order_number = p_order_number AND status = 'PAID';

    SELECT ROW_COUNT() AS rows_affected,
           p_order_number AS order_number,
           'REFUNDED' AS new_status;
END//

DELIMITER ;
```

### 24.20 Config Get

```sql
DROP PROCEDURE IF EXISTS sp_admin_config_get;

DELIMITER //

CREATE PROCEDURE sp_admin_config_get(
    IN p_config_type VARCHAR(50)
)
BEGIN
    IF p_config_type = 'supercoin' THEN
        SELECT 'cap_percent' AS config_key, '25' AS config_value
        UNION ALL
        SELECT 'earn_percent', '1'
        UNION ALL
        SELECT 'redemption_surcharge_percent', '25';

    ELSEIF p_config_type = 'wallet' THEN
        SELECT 'max_usage_percent' AS config_key, '60' AS config_value
        UNION ALL
        SELECT 'max_redeem_amount', '500'
        UNION ALL
        SELECT 'cashback_redeem_percent', '100';

    ELSEIF p_config_type = 'retry' THEN
        SELECT 'max_attempts' AS config_key, '3' AS config_value
        UNION ALL
        SELECT 'retry_window_hours', '72'
        UNION ALL
        SELECT 'idempotency_window_minutes', '2';
    END IF;
END//

DELIMITER ;
```

### 24.21 Config Update

```sql
DROP PROCEDURE IF EXISTS sp_admin_config_update;

DELIMITER //

CREATE PROCEDURE sp_admin_config_update(
    IN p_config_type VARCHAR(50),
    IN p_config_key VARCHAR(100),
    IN p_config_value VARCHAR(255),
    IN p_admin_user_id VARCHAR(36),
    IN p_reason TEXT
)
BEGIN
    -- For now, just log the change
    -- In production, this would update application.properties or a config table
    SELECT p_config_type AS config_type,
           p_config_key AS config_key,
           p_config_value AS new_value,
           p_admin_user_id AS admin_user_id,
           NOW() AS updated_at;
END//

DELIMITER ;
```

### 24.22 Audit Log

```sql
DROP PROCEDURE IF EXISTS sp_admin_audit_log;

DELIMITER //

CREATE PROCEDURE sp_admin_audit_log(
    IN p_admin_user_id VARCHAR(36),
    IN p_module VARCHAR(50),
    IN p_from_date DATE,
    IN p_to_date DATE,
    IN p_page INT,
    IN p_size INT
)
BEGIN
    DECLARE v_offset INT DEFAULT p_page * p_size;

    SELECT id, admin_user_id, admin_username, action, module,
           target_entity, target_id, previous_value, new_value,
           reason, ip_address, correlation_id, result, created_at
    FROM admin_audit_logs
    WHERE (p_admin_user_id IS NULL OR admin_user_id = p_admin_user_id)
        AND (p_module IS NULL OR module = p_module)
        AND (p_from_date IS NULL OR created_at >= p_from_date)
        AND (p_to_date IS NULL OR created_at < DATE_ADD(p_to_date, INTERVAL 1 DAY))
    ORDER BY created_at DESC
    LIMIT p_size OFFSET v_offset;
END//

DELIMITER ;
```

### 24.23 Investigation Notes

```sql
DROP PROCEDURE IF EXISTS sp_admin_investigation_notes;

DELIMITER //

CREATE PROCEDURE sp_admin_investigation_notes(
    IN p_entity_type VARCHAR(50),
    IN p_entity_id VARCHAR(100)
)
BEGIN
    SELECT id, admin_user_id, entity_type, entity_id,
           note, is_internal, created_at, updated_at
    FROM admin_investigation_notes
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
    ORDER BY created_at DESC;
END//

DELIMITER ;
```

### 24.24 Investigation Create

```sql
DROP PROCEDURE IF EXISTS sp_admin_investigation_create;

DELIMITER //

CREATE PROCEDURE sp_admin_investigation_create(
    IN p_admin_user_id VARCHAR(36),
    IN p_entity_type VARCHAR(50),
    IN p_entity_id VARCHAR(100),
    IN p_note TEXT,
    IN p_is_internal TINYINT
)
BEGIN
    INSERT INTO admin_investigation_notes
    (admin_user_id, entity_type, entity_id, note, is_internal)
    VALUES (p_admin_user_id, p_entity_type, p_entity_id, p_note, p_is_internal);

    SELECT LAST_INSERT_ID() AS id, NOW() AS created_at;
END//

DELIMITER ;
```

---

## 25. Frontend Component Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── Dashboard/
│   │   ├── SummaryCards.tsx
│   │   ├── RevenueChart.tsx
│   │   └── VoucherHealth.tsx
│   ├── Orders/
│   │   ├── OrderList.tsx
│   │   ├── OrderDetail.tsx
│   │   ├── OrderFilters.tsx
│   │   └── OrderExport.tsx
│   ├── Customers/
│   │   ├── CustomerList.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── CustomerJourney.tsx
│   │   └── CustomerBlock.tsx
│   ├── Vouchers/
│   │   ├── VoucherList.tsx
│   │   ├── VoucherFailed.tsx
│   │   ├── VoucherRetry.tsx
│   │   └── VoucherConfig.tsx
│   ├── Wallet/
│   │   ├── WalletDetail.tsx
│   │   └── WalletTransactions.tsx
│   ├── Reports/
│   │   ├── BrandStats.tsx
│   │   ├── Geography.tsx
│   │   ├── ErrorBreakdown.tsx
│   │   ├── AbandonedCarts.tsx
│   │   └── Retention.tsx
│   ├── Refunds/
│   │   ├── RefundCheck.tsx
│   │   └── RefundExecute.tsx
│   ├── Config/
│   │   ├── SuperCoinConfig.tsx
│   │   ├── WalletConfig.tsx
│   │   └── RetryConfig.tsx
│   ├── Investigations/
│   │   ├── InvestigationList.tsx
│   │   └── InvestigationCreate.tsx
│   └── Audit/
│       └── AuditLog.tsx
├── hooks/
│   ├── useApi.ts
│   └── useAuth.ts
├── services/
│   └── api.ts
├── store/
│   └── authStore.ts
└── App.tsx
```

---

## 26. Deployment Model

| Component | Deployment Requirement |
|---|---|
| Frontend | Independent Gift360 frontend deployment at dashboard.gift360.com. |
| Backend | Dedicated Gift360 Admin Backend deployment; independently scalable and deployable. |
| Database | Existing Gift360 DB remains the source of Gift360 operational data. |
| Environment separation | Development, UAT/staging and production configurations must be isolated. |
| CI/CD | Automated build, test, security checks and controlled production deployment. |
| Rollback | Versioned deployments with a tested rollback strategy. |

---

## 27. Implementation Phases

| Phase | Focus | Deliverables | Duration |
|---|---|---|---|
| Phase 1 | Foundation | Frontend shell, backend foundation, authentication, RBAC, database/service integration, audit foundation. | Week 1-2 |
| Phase 2 | Visibility | Dashboard KPIs, order search, filtering, sorting, detail pages and exports. | Week 3-4 |
| Phase 3 | Operations | Voucher retry, suspicious customer block, voucher discount and wallet-rate configuration. | Week 5-6 |
| Phase 4 | Financial & Exceptions | Refund flow, exception center, investigation timelines and operational reporting. | Week 7-8 |
| Phase 5 | Hardening | Performance, security testing, observability, failure testing, UAT and production readiness. | Week 9-10 |

---

## 28. Definition of Done

- Gift360 Admin is independently deployable at dashboard.gift360.com.
- Gift360 Admin Backend is independently deployable and is not dependent on a shared Karatly/SabbPe admin backend.
- Frontend has no direct database connectivity.
- Authorized users can retrieve common order reports without writing SQL.
- Users can search, filter, sort, paginate and export Gift360 orders.
- Wallet, SuperCoins, PG and order-type information is visible at order level.
- Eligible voucher failures can be retried with visible retry history.
- Authorized users can block suspicious customers with audit records.
- Authorized users can modify voucher discount and wallet rates with validation and audit.
- Refunds are safely initiated where technically feasible and all outcomes are tracked.
- Critical exceptions have investigation details and supported next actions.
- All privileged operations are authenticated, authorized, auditable and protected against duplicate execution.

---

## 29. Success Metrics

| Metric | Desired Outcome |
|---|---|
| Manual SQL usage for routine Gift360 reports | Significant reduction |
| Time to retrieve a 10-day order report | Minutes → self-service / near real-time |
| Average production investigation time | Reduction |
| Voucher failure recovery | Increase through controlled retry |
| Refund investigation time | Reduction |
| Privileged actions with audit records | 100% |
| Unauthorized data access | Zero |

---

*GIFT360 ADMIN = STANDALONE PRODUCT. Gift360 Admin should be built as an independent frontend + independent backend + Gift360 data boundary. It should solve the immediate operational problem — eliminating routine dependence on manual database queries — while providing a secure foundation for reporting, investigation and controlled production operations.*
