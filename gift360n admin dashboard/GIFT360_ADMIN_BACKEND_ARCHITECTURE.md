# Gift360 Admin Backend — Architecture

## 1. Architecture Overview

```
dashboard.gift360.com
        │
        ▼
Gift360 Admin Frontend (React)
        │
        │ HTTPS / REST
        ▼
Gift360 Admin Backend (Spring Boot)
        │
   ┌────┴────┐
   │         │
   ▼         ▼
Existing   Admin-specific
Gift360    persistence
data       (7 tables)
```

**Key Principles**:
- Separate application, separate deployment
- Reads from existing Gift360 database (no data duplication)
- Own admin user/auth/audit tables
- All business data queried directly from sabbpegiftvouchers

---

## 2. Module Structure

```
com.sabbpe.admin
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   └── AppConfig.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── PasswordEncoder.java
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   └── dto/
├── user/
│   ├── AdminUserController.java
│   ├── AdminUserService.java
│   └── dto/
├── role/
│   ├── RoleController.java
│   ├── RoleService.java
│   └── dto/
├── dashboard/
│   ├── DashboardController.java
│   ├── DashboardService.java
│   └── dto/
├── orders/
│   ├── OrderController.java
│   ├── OrderService.java
│   └── dto/
├── customers/
│   ├── CustomerController.java
│   ├── CustomerService.java
│   └── dto/
├── vouchers/
│   ├── VoucherController.java
│   ├── VoucherService.java
│   └── dto/
├── supercoins/
│   ├── SuperCoinController.java
│   ├── SuperCoinService.java
│   └── dto/
├── wallet/
│   ├── WalletController.java
│   ├── WalletService.java
│   └── dto/
├── refunds/
│   ├── RefundController.java
│   ├── RefundService.java
│   └── dto/
├── reports/
│   ├── ReportController.java
│   ├── ReportService.java
│   └── dto/
├── exceptions/
│   ├── ExceptionController.java
│   └── exceptions/
├── audit/
│   ├── AuditService.java
│   └── model/
├── model/
│   ├── AdminUser.java
│   ├── AdminRole.java
│   ├── AdminPermission.java
│   ├── AdminUserRole.java
│   ├── AdminRolePermission.java
│   ├── AdminAuditLog.java
│   └── AdminInvestigationNote.java
└── repository/
    ├── AdminUserRepository.java
    ├── AdminRoleRepository.java
    ├── AdminPermissionRepository.java
    ├── AdminUserRoleRepository.java
    ├── AdminRolePermissionRepository.java
    ├── AdminAuditLogRepository.java
    └── AdminInvestigationNoteRepository.java
```

---

## 3. Security Architecture

### 3.1 Authentication
- JWT-based authentication
- Separate token provider from Gift360 customer JWT
- Token stored in HTTP-only cookie or Authorization header
- Token TTL: configurable (default 8 hours)

### 3.2 Authorization (RBAC)
```
AdminUser → (many) → AdminRole → (many) → AdminPermission
```

### 3.3 Permission Check
```java
@PreAuthorize("hasPermission('orders', 'view')")
@GetMapping("/orders")
public ResponseEntity<?> getOrders(...) { }
```

Or via service layer:
```java
if (!authorizationService.hasPermission(currentUser, "orders", "view")) {
    throw new ForbiddenException("Insufficient permissions");
}
```

### 3.4 Endpoint Protection
| Pattern | Authentication | Authorization |
|---|---|---|
| `/api/v1/admin/auth/*` | None (login/register) | None |
| `/api/v1/admin/**` | JWT required | RBAC permission check |

---

## 4. Data Access Pattern

### 4.1 Admin-Specific Data
- JPA entities for admin_users, admin_roles, admin_permissions, admin_audit_logs, admin_investigation_notes
- Standard Spring Data JPA repositories

### 4.2 Gift360 Business Data
- **Option A (Recommended)**: Direct JDBC/JdbcTemplate queries against sabbpegiftvouchers
  - Same pattern as existing AdminDashboardController
  - Reuse existing SQL queries
  - No JPA entity duplication
- **Option B**: Shared JPA entities (read-only)
  - More type-safe
  - Requires careful configuration to avoid accidental writes

**Decision**: Use Option A (JdbcTemplate) for business data to avoid coupling and accidental writes.

---

## 5. Service Layer Design

### 5.1 DashboardService
```java
@Service
public class DashboardService {
    // Reuse SQL from AdminDashboardController
    public Map<String, Object> getSummary(String from, String to);
    public List<Map<String, Object>> getOrders(String from, String to, String brandCode, String voucherStatus, int page, int size);
    public List<Map<String, Object>> getBrandStats(String from, String to);
    public List<Map<String, Object>> getCustomerStats(String from, String to, int page, int size);
    public Map<String, Object> getCustomerJourney(String clientId, String email);
    public List<Map<String, Object>> getSuperCoinTrend(String from, String to);
    public List<Map<String, Object>> getRetentionTrend(String from, String to);
    public List<Map<String, Object>> getErrorBreakdown(String from, String to);
    public List<Map<String, Object>> getGeography(String from, String to);
    public Map<String, Object> getAbandonedCarts(String from, String to, int page, int size);
    public Map<String, Object> getCartsSummary();
    public List<Map<String, Object>> getCartsByCustomer(String minStaleHours, int page, int size);
    public List<Map<String, Object>> getCartsByBrand();
}
```

### 5.2 OrderService (Admin)
```java
@Service
public class AdminOrderService {
    // Read-only order queries
    public OrderDetailDTO getOrderDetail(String orderNumber);
    public OrderTimelineDTO getOrderTimeline(String orderNumber);
    // Write operations (with audit)
    @Transactional
    public void updateOrderStatus(String orderNumber, String status, String reason, String adminUserId);
}
```

### 5.3 CustomerService (Admin)
```java
@Service
public class AdminCustomerService {
    public CustomerDetailDTO getCustomerDetail(String clientId);
    public CustomerJourneyDTO getCustomerJourney(String clientId);
    @Transactional
    public void updateAccountStatus(String clientId, String status, String reason, String adminUserId);
}
```

---

## 6. Audit Architecture

### 6.1 What Gets Audited
| Action | Module | Entity | Details |
|---|---|---|---|
| Login | auth | admin_user | Success/failure |
| View order | orders | giftcard_order | Query parameters |
| Update order status | orders | giftcard_order | Previous → New status |
| Block customer | customers | client_profile | Previous → New status |
| Retry voucher | vouchers | giftcard_order_items | Retry attempt details |
| View sensitive data | various | various | Data access logged |
| Configuration change | config | various | Previous → New value |

### 6.2 Audit Service
```java
@Service
public class AuditService {
    @Async
    public void log(String adminUserId, String action, String module,
                    String targetEntity, String targetId,
                    String previousValue, String newValue,
                    String reason, String correlationId);
}
```

### 6.3 Audit Aspect
```java
@Aspect
@Component
public class AuditAspect {
    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) {
        // Before: capture previous state
        Object result = joinPoint.proceed();
        // After: capture new state, log audit
        return result;
    }
}
```

---

## 7. Error Handling

### 7.1 Exception Hierarchy
```
AdminException
├── AuthenticationException
├── AuthorizationException (ForbiddenException)
├── NotFoundException
├── ValidationException
├── BusinessException
└── ExternalServiceException
```

### 7.2 Global Exception Handler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(403).body(Map.of("error", "Forbidden", "message", ex.getMessage()));
    }
    // ... other handlers
}
```

---

## 8. Configuration

### 8.1 application.properties
```properties
# Server
server.port=8082

# Database (same as Gift360)
spring.datasource.url=jdbc:mariadb://34.47.168.236:7306/sabbpegiftvouchers
spring.datasource.username=sbuser
spring.datasource.password=...

# JWT
admin.jwt.secret=...
admin.jwt.expiration=28800000  # 8 hours

# Gift360 DB names (for cross-DB queries)
admin.giftvouchers-database=sabbpegiftvouchers
admin.payments-database=sabbpepayments

# CORS
admin.cors.allowed-origins=https://dashboard.gift360.com
```

---

## 9. Deployment

### 9.1 Separate Deployment
- Separate Spring Boot application
- Separate port (8082)
- Separate domain (dashboard.gift360.com)
- Can be deployed independently

### 9.2 Database Access
- Same database user (sbuser) with same permissions
- Read access to sabbpegiftvouchers and sabbpepayments
- Read/write access to admin_* tables
- No migration of existing tables
