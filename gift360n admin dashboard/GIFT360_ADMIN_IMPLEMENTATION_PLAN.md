# Gift360 Admin Backend — Implementation Plan

## Phase 1: Foundation (Week 1-2)

### 1.1 Project Setup
- [ ] Create new Spring Boot project (com.sabbpe.admin)
- [ ] Configure MariaDB connection (same database)
- [ ] Set up admin-specific tables via Flyway migrations
- [ ] Configure CORS for dashboard.gift360.com

### 1.2 Admin Auth & RBAC
- [ ] Implement AdminUser, AdminRole, AdminPermission entities
- [ ] Implement JWT token provider (admin-specific)
- [ ] Implement login/logout/refresh endpoints
- [ ] Implement user CRUD endpoints
- [ ] Implement role CRUD endpoints
- [ ] Implement permission listing
- [ ] Seed default roles and permissions
- [ ] Create first super admin user

### 1.3 Security Infrastructure
- [ ] JWT authentication filter
- [ ] Permission-based authorization (annotation + service)
- [ ] Global exception handler
- [ ] Rate limiting configuration
- [ ] Input validation

### 1.4 Audit Infrastructure
- [ ] AdminAuditLog entity + repository
- [ ] AuditService with async logging
- [ ] Audit aspect for automatic logging
- [ ] Correlation ID propagation

---

## Phase 2: Core Read APIs (Week 2-3)

### 2.1 Dashboard
- [ ] DashboardService (migrate SQL from AdminDashboardController)
- [ ] GET /api/v1/admin/dashboard/summary
- [ ] GET /api/v1/admin/dashboard/retention
- [ ] Permission: dashboard:view

### 2.2 Orders
- [ ] OrderService (admin-scoped)
- [ ] GET /api/v1/admin/orders (with search, filter, pagination)
- [ ] GET /api/v1/admin/orders/{orderNumber} (full detail)
- [ ] GET /api/v1/admin/orders/{orderNumber}/timeline
- [ ] Permission: orders:view

### 2.3 Customers
- [ ] CustomerService (admin-scoped)
- [ ] GET /api/v1/admin/customers (with search, pagination)
- [ ] GET /api/v1/admin/customers/{clientId}
- [ ] GET /api/v1/admin/customers/{clientId}/journey
- [ ] Permission: customers:view

### 2.4 Vouchers
- [ ] VoucherService (admin-scoped)
- [ ] GET /api/v1/admin/vouchers/failed
- [ ] GET /api/v1/admin/vouchers/retry-eligible
- [ ] GET /api/v1/admin/vouchers/retry-metrics
- [ ] Permission: vouchers:view

### 2.5 SuperCoins
- [ ] SuperCoinService
- [ ] GET /api/v1/admin/supercoins/trend
- [ ] GET /api/v1/admin/supercoins/config
- [ ] Permission: supercoins:view

### 2.6 Wallet
- [ ] WalletService
- [ ] GET /api/v1/admin/wallet/{clientId}
- [ ] GET /api/v1/admin/wallet/{clientId}/transactions
- [ ] Permission: wallet:view

### 2.7 Reports
- [ ] ReportService
- [ ] GET /api/v1/admin/reports/brands
- [ ] GET /api/v1/admin/reports/geography
- [ ] GET /api/v1/admin/reports/errors
- [ ] GET /api/v1/admin/reports/carts
- [ ] Permission: reports:view

---

## Phase 3: Write APIs (Week 3-4)

### 3.1 Customer Management
- [ ] POST /api/v1/admin/customers/{clientId}/status
- [ ] Audit logging for status changes
- [ ] Permission: customers:manage

### 3.2 Voucher Retry
- [ ] POST /api/v1/admin/vouchers/retry
- [ ] Audit logging for retry attempts
- [ ] Permission: vouchers:retry

### 3.3 Investigations
- [ ] InvestigationNote entity + repository
- [ ] CRUD for investigation notes
- [ ] Permission: orders:view (for note creation)

---

## Phase 4: Configuration & Export (Week 4-5)

### 4.1 Configuration Management
- [ ] GET/PUT /api/v1/admin/config/supercoin
- [ ] GET/PUT /api/v1/admin/config/wallet
- [ ] GET/PUT /api/v1/admin/config/retry
- [ ] Audit logging for config changes
- [ ] Permission: config:manage

### 4.2 Data Export
- [ ] Async export service (CSV/Excel)
- [ ] GET /api/v1/admin/reports/export
- [ ] File storage (S3 or local)
- [ ] Permission: reports:export

### 4.3 Audit Log Viewing
- [ ] GET /api/v1/admin/audit
- [ ] Permission: audit:view

---

## Phase 5: Hardening (Week 5-6)

### 5.1 Testing
- [ ] Unit tests for services
- [ ] Integration tests for endpoints
- [ ] Security tests (auth, authorization, injection)
- [ ] Performance tests for large datasets

### 5.2 Production Readiness
- [ ] Health checks
- [ ] Monitoring (metrics, logging)
- [ ] Alerting configuration
- [ ] Database connection pooling
- [ ] Graceful shutdown

### 5.3 Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Admin user guide

---

## Dependencies

### External Dependencies
- None (all reads from existing database)

### Internal Dependencies
- Gift360 database must be accessible
- sbuser must have read access to sabbpegiftvouchers and sabbpepayments
- sbuser must have read/write access to admin_* tables

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| Database performance impact | Read-only queries, connection pooling, pagination |
| Accidental data modification | Admin backend only writes to admin_* tables |
| Security breach | JWT + RBAC + audit logging + rate limiting |
| Gift360 application changes | Admin backend reads directly from DB, no API dependency |

---

## Success Criteria

1. Admin dashboard loads summary in < 2 seconds
2. Order listing paginates smoothly with 10K+ orders
3. Customer blocking takes effect immediately for new orders
4. Voucher retry works end-to-end
5. All admin actions are audit-logged
6. No impact on Gift360 customer-facing application performance
