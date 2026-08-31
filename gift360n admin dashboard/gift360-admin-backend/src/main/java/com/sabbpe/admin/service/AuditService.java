package com.sabbpe.admin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }
}
