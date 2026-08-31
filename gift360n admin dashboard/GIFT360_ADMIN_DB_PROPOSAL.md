# Gift360 Admin Dashboard — Database Proposal

## 1. Principle

**Do NOT duplicate Gift360 business data.**

The existing `sabbpegiftvouchers` database remains the source of truth. Admin-specific tables are created ONLY for admin application concerns that don't exist in the business domain.

---

## 2. Admin-Specific Tables

### 2.1 `admin_users`
**Purpose**: Admin user accounts (separate from customer accounts)

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
```

### 2.2 `admin_roles`
**Purpose**: Role definitions

```sql
CREATE TABLE admin_roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO admin_roles (id, name, description) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Full system access'),
('role-admin', 'ADMIN', 'Standard admin access'),
('role-analyst', 'ANALYST', 'Read-only analytics access'),
('role-support', 'SUPPORT', 'Customer support access');
```

### 2.3 `admin_permissions`
**Purpose**: Granular permissions

```sql
CREATE TABLE admin_permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- Seed data
INSERT INTO admin_permissions (id, name, module, description) VALUES
('perm-dashboard-view', 'dashboard:view', 'dashboard', 'View dashboard summary'),
('perm-orders-view', 'orders:view', 'orders', 'View orders'),
('perm-orders-manage', 'orders:manage', 'orders', 'Manage order status'),
('perm-customers-view', 'customers:view', 'customers', 'View customers'),
('perm-customers-manage', 'customers:manage', 'customers', 'Block/suspend customers'),
('perm-vouchers-view', 'vouchers:view', 'vouchers', 'View vouchers'),
('perm-vouchers-retry', 'vouchers:retry', 'vouchers', 'Retry failed vouchers'),
('perm-supercoins-view', 'supercoins:view', 'supercoins', 'View SuperCoin data'),
('perm-wallet-view', 'wallet:view', 'wallet', 'View wallet data'),
('perm-reports-view', 'reports:view', 'reports', 'View reports'),
('perm-reports-export', 'reports:export', 'reports', 'Export reports'),
('perm-config-manage', 'config:manage', 'config', 'Manage configuration'),
('perm-admin-users', 'admin:users', 'admin', 'Manage admin users'),
('perm-audit-view', 'audit:view', 'audit', 'View audit logs');
```

### 2.4 `admin_user_roles`
**Purpose**: User-role assignment (many-to-many)

```sql
CREATE TABLE admin_user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE
);
```

### 2.5 `admin_role_permissions`
**Purpose**: Role-permission assignment (many-to-many)

```sql
CREATE TABLE admin_role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);
```

### 2.6 `admin_audit_logs`
**Purpose**: Audit trail for all admin actions

```sql
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
    user_agent VARCHAR(500),
    correlation_id VARCHAR(100),
    result VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    failure_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_admin_user (admin_user_id),
    INDEX idx_audit_module (module),
    INDEX idx_audit_target (target_entity, target_id)
);
```

### 2.7 `admin_investigation_notes`
**Purpose**: Notes/investigations for specific orders/customers

```sql
CREATE TABLE admin_investigation_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- 'ORDER', 'CUSTOMER', 'VOUCHER'
    entity_id VARCHAR(100) NOT NULL,
    note TEXT NOT NULL,
    is_internal TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_investigation_entity (entity_type, entity_id)
);
```

---

## 3. Tables NOT to Create

| Table | Reason |
|---|---|
| admin_orders | Use existing giftcard_orders |
| admin_customers | Use existing client_profile |
| admin_vouchers | Use existing giftcard_coupons |
| admin_wallets | Use existing client_wallet |
| admin_transactions | Use existing master_transactions |
| admin_payments | Use existing easebuzz_processor_transaction_details |
| admin_brands | Use existing brands |
| admin_feedback | Use existing feedback |

---

## 4. Summary

| Table | Purpose | Records | Growth |
|---|---|---|---|
| admin_users | Admin accounts | Low (10-50) | Slow |
| admin_roles | Role definitions | Fixed (4) | None |
| admin_permissions | Permission definitions | Fixed (~15) | Slow |
| admin_user_roles | User-role assignments | Low | Slow |
| admin_role_permissions | Role-permission assignments | Low | Slow |
| admin_audit_logs | Audit trail | High (every action) | Fast |
| admin_investigation_notes | Investigation notes | Medium | Medium |

**Total new tables: 7**
**Total business tables duplicated: 0**
