-- ══════════════════════════════════════════════════════════════
-- Gift360 Admin Backend — Admin Tables
-- Run this FIRST before stored procedures
-- ══════════════════════════════════════════════════════════════

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
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

-- 2. Admin Roles
CREATE TABLE IF NOT EXISTS admin_roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admin Permissions
CREATE TABLE IF NOT EXISTS admin_permissions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    description VARCHAR(255)
);

-- 4. User-Role mapping
CREATE TABLE IF NOT EXISTS admin_user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE
);

-- 5. Role-Permission mapping
CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id VARCHAR(36),
    admin_username VARCHAR(100),
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
    failure_reason TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_admin_user (admin_user_id),
    INDEX idx_audit_module (module)
);

-- 7. Investigation Notes
CREATE TABLE IF NOT EXISTS admin_investigation_notes (
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

-- ══════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════

-- Roles
INSERT IGNORE INTO admin_roles (id, name, description) VALUES
('role-super-admin', 'SUPER_ADMIN', 'Full system access'),
('role-admin', 'ADMIN', 'Standard admin access'),
('role-analyst', 'ANALYST', 'Read-only analytics access'),
('role-support', 'SUPPORT', 'Customer support access'),
('role-finance', 'FINANCE', 'Financial reports and refunds');

-- Permissions
INSERT IGNORE INTO admin_permissions (id, name, module, description) VALUES
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

-- Super Admin gets all permissions
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT 'role-super-admin', id FROM admin_permissions;

-- Operations Admin
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT 'role-admin', id FROM admin_permissions WHERE name IN (
    'dashboard:view', 'orders:view', 'orders:manage', 'customers:view', 'customers:block',
    'vouchers:view', 'vouchers:retry', 'supercoins:view', 'wallet:view',
    'reports:view', 'reports:export', 'audit:view'
);

-- Analyst (read only)
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT 'role-analyst', id FROM admin_permissions WHERE name IN (
    'dashboard:view', 'orders:view', 'customers:view', 'vouchers:view',
    'supercoins:view', 'wallet:view', 'reports:view', 'audit:view'
);

-- Support
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT 'role-support', id FROM admin_permissions WHERE name IN (
    'dashboard:view', 'orders:view', 'customers:view', 'vouchers:view', 'vouchers:retry'
);

-- Finance
INSERT IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT 'role-finance', id FROM admin_permissions WHERE name IN (
    'dashboard:view', 'orders:view', 'customers:view', 'reports:view', 'reports:export',
    'refunds:view', 'refunds:execute', 'wallet:view', 'audit:view'
);

-- Default Super Admin user (password: Admin@123)
-- BCrypt hash of "Admin@123"
INSERT IGNORE INTO admin_users (id, username, email, password_hash, full_name) VALUES
('admin-001', 'admin', 'admin@gift360.com', '$2b$10$OAeOBGDBnatZCspabHHyYuL6E9UjLHI01ejISDKF.SNg9QhWSbmyG', 'Super Admin');

INSERT IGNORE INTO admin_user_roles (user_id, role_id) VALUES
('admin-001', 'role-super-admin');
