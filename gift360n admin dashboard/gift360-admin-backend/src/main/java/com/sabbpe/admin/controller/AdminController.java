package com.sabbpe.admin.controller;

import com.sabbpe.admin.security.AuthUser;
import com.sabbpe.admin.service.AdminSpCaller;
import com.sabbpe.admin.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminSpCaller spCaller;
    private final AuditService auditService;

    // ════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════

    private AuthUser getUser(HttpServletRequest request) {
        return (AuthUser) request.getAttribute("authUser");
    }

    private String[] resolveDateRange(String from, String to) {
        LocalDate toDate = (to != null && !to.isBlank()) ? LocalDate.parse(to) : LocalDate.now();
        LocalDate fromDate = (from != null && !from.isBlank()) ? LocalDate.parse(from) : toDate.minusDays(30);
        return new String[]{fromDate.toString(), toDate.plusDays(1).toString()};
    }

    private boolean denied(AuthUser user, String permission, HttpServletRequest request) {
        return user == null || !user.hasPermission(permission);
    }

    // ════════════════════════════════════════════════════════════
    // 1. DASHBOARD SUMMARY
    // ════════════════════════════════════════════════════════════

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> dashboardSummary(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "dashboard:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = Map.of("p_from_date", range[0], "p_to_date", range[1]);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_dashboard_summary", params);
        return ResponseEntity.ok(Map.of("data", result.isEmpty() ? Map.of() : result.get(0),
            "from", range[0], "to", range[1]));
    }

    // ════════════════════════════════════════════════════════════
    // 2. ORDERS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/orders")
    public ResponseEntity<?> ordersList(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String brandCode,
            @RequestParam(required = false) String voucherStatus,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "orders:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", range[0]);
        params.put("p_to_date", range[1]);
        params.put("p_brand_code", brandCode);
        params.put("p_voucher_status", voucherStatus);
        params.put("p_payment_method", paymentMethod);
        params.put("p_search", search);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_orders_list", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<?> orderDetail(
            @PathVariable String orderNumber,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "orders:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_order_number", orderNumber);

        // Get order + items + payment + wallet transactions
        List<Map<String, Object>> orderInfo = spCaller.callQuery("sp_admin_order_detail", params);

        return ResponseEntity.ok(Map.of("data", orderInfo));
    }

    // ════════════════════════════════════════════════════════════
    // 3. CUSTOMERS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/customers")
    public ResponseEntity<?> customerList(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "customers:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", range[0]);
        params.put("p_to_date", range[1]);
        params.put("p_search", search);
        params.put("p_status", status);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_list", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    @GetMapping("/customers/{clientId}")
    public ResponseEntity<?> customerDetail(
            @PathVariable String clientId,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "customers:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_client_id", clientId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_detail", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/customers/{clientId}/journey")
    public ResponseEntity<?> customerJourney(
            @PathVariable String clientId,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "customers:view", request)) {
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
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "customers:block", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_client_id", clientId);
        params.put("p_status", body.get("status"));
        params.put("p_reason", body.get("reason"));
        params.put("p_admin_user_id", user.getId());

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_customer_block", params);

        String prevStatus = result.isEmpty() ? "" : String.valueOf(result.get(0).get("previous_status"));
        auditService.log(user.getId(), user.getUsername(), "BLOCK_CUSTOMER",
            "customer", "customer", clientId, prevStatus, body.get("status"), body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 4. VOUCHERS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/vouchers/failed")
    public ResponseEntity<?> voucherFailed(
            @RequestParam(required = false) String clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "vouchers:view", request)) {
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
    public ResponseEntity<?> voucherRetryEligible(HttpServletRequest request) {
        AuthUser user = getUser(request);
        if (denied(user, "vouchers:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_retry_eligible", Map.of());
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/vouchers/retry-metrics")
    public ResponseEntity<?> voucherRetryMetrics(HttpServletRequest request) {
        AuthUser user = getUser(request);
        if (denied(user, "vouchers:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_retry_metrics", Map.of());
        return ResponseEntity.ok(Map.of("data", result.isEmpty() ? Map.of() : result.get(0)));
    }

    @PostMapping("/vouchers/retry")
    public ResponseEntity<?> voucherRetry(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "vouchers:retry", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_order_number", body.get("orderNumber"));
        params.put("p_order_item_id", body.get("orderItemId"));
        params.put("p_admin_user_id", user.getId());

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_voucher_retry_execute", params);

        auditService.log(user.getId(), user.getUsername(), "RETRY_VOUCHER",
            "voucher", "voucher", body.get("orderNumber"), "", "RETRY", body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 5. SUPERCOINS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/supercoins/trend")
    public ResponseEntity<?> supercoinTrend(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "supercoins:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = Map.of("p_from_date", range[0], "p_to_date", range[1]);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_supercoin_trend", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 6. WALLET
    // ════════════════════════════════════════════════════════════

    @GetMapping("/wallet/{clientId}")
    public ResponseEntity<?> walletDetail(
            @PathVariable String clientId,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "wallet:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_client_id", clientId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_wallet_detail", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 7. BRANDS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/brands")
    public ResponseEntity<?> brandStats(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "reports:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = Map.of("p_from_date", range[0], "p_to_date", range[1]);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_brand_stats", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 8. ERRORS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/errors")
    public ResponseEntity<?> errorBreakdown(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "reports:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = Map.of("p_from_date", range[0], "p_to_date", range[1]);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_error_breakdown", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 10. ABANDONED CARTS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/abandoned")
    public ResponseEntity<?> abandonedCarts(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "reports:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("p_from_date", range[0]);
        params.put("p_to_date", range[1]);
        params.put("p_page", page);
        params.put("p_size", size);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_abandoned_carts", params);
        return ResponseEntity.ok(Map.of("data", result, "page", page, "size", size));
    }

    // ════════════════════════════════════════════════════════════
    // 11. RETENTION
    // ════════════════════════════════════════════════════════════

    @GetMapping("/retention")
    public ResponseEntity<?> retention(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "reports:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        String[] range = resolveDateRange(from, to);
        Map<String, Object> params = Map.of("p_from_date", range[0], "p_to_date", range[1]);

        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_retention", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 12. REFUNDS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/refunds/{orderNumber}/check")
    public ResponseEntity<?> refundCheck(
            @PathVariable String orderNumber,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "refunds:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_order_number", orderNumber);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_refund_check", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 13. CONFIGURATION
    // ════════════════════════════════════════════════════════════

    @GetMapping("/config/{configType}")
    public ResponseEntity<?> configGet(
            @PathVariable String configType,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "config:manage", request)) {
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
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "config:manage", request)) {
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
            "config", "config", configType, "", String.valueOf(body.get("value")), (String) body.get("reason"));

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 14. INVESTIGATIONS
    // ════════════════════════════════════════════════════════════

    @GetMapping("/investigations")
    public ResponseEntity<?> investigationList(
            @RequestParam String entityType,
            @RequestParam String entityId,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "orders:view", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        Map<String, Object> params = Map.of("p_entity_type", entityType, "p_entity_id", entityId);
        List<Map<String, Object>> result = spCaller.callQuery("sp_admin_investigation_notes", params);
        return ResponseEntity.ok(Map.of("data", result));
    }

    @PostMapping("/investigations")
    public ResponseEntity<?> investigationCreate(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "orders:view", request)) {
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
            (String) body.get("entityType"), (String) body.get("entityType"), (String) body.get("entityId"),
            "", "NOTE_CREATED", "");

        return ResponseEntity.ok(Map.of("data", result));
    }

    // ════════════════════════════════════════════════════════════
    // 15. AUDIT LOG
    // ════════════════════════════════════════════════════════════

    @GetMapping("/audit")
    public ResponseEntity<?> auditList(
            @RequestParam(required = false) String adminUserId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {

        AuthUser user = getUser(request);
        if (denied(user, "audit:view", request)) {
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

    // ════════════════════════════════════════════════════════════
    // 16. ADMIN USERS (RBAC)
    // ════════════════════════════════════════════════════════════

    @GetMapping("/users")
    public ResponseEntity<?> userList(HttpServletRequest request) {
        AuthUser user = getUser(request);
        if (denied(user, "admin:users", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.query(
            "SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.last_login_at, " +
            "GROUP_CONCAT(r.name) AS roles " +
            "FROM admin_users u " +
            "LEFT JOIN admin_user_roles ur ON ur.user_id = u.id " +
            "LEFT JOIN admin_roles r ON r.id = ur.role_id " +
            "GROUP BY u.id ORDER BY u.created_at DESC");
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/roles")
    public ResponseEntity<?> roleList(HttpServletRequest request) {
        AuthUser user = getUser(request);
        if (denied(user, "admin:users", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.query("SELECT * FROM admin_roles ORDER BY name");
        return ResponseEntity.ok(Map.of("data", result));
    }

    @GetMapping("/permissions")
    public ResponseEntity<?> permissionList(HttpServletRequest request) {
        AuthUser user = getUser(request);
        if (denied(user, "admin:users", request)) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }

        List<Map<String, Object>> result = spCaller.query("SELECT * FROM admin_permissions ORDER BY module, name");
        return ResponseEntity.ok(Map.of("data", result));
    }
}
