package com.sabbpe.admin.controller;

import com.sabbpe.admin.security.AuthUser;
import com.sabbpe.admin.security.JwtTokenProvider;
import com.sabbpe.admin.service.AdminSpCaller;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AdminSpCaller spCaller;
    private final JwtTokenProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Find user
        var userRows = spCaller.query(
            "SELECT id, username, email, password_hash FROM admin_users WHERE username = ? AND is_active = 1",
            request.getUsername());

        if (userRows.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        var user = userRows.get(0);
        String storedHash = (String) user.get("password_hash");

        if (!passwordEncoder.matches(request.getPassword(), storedHash)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String userId = (String) user.get("id");
        String username = (String) user.get("username");

        // Load permissions
        Set<String> permissions = new HashSet<>();
        spCaller.query(
            "SELECT p.name FROM admin_permissions p " +
            "JOIN admin_role_permissions rp ON rp.permission_id = p.id " +
            "JOIN admin_user_roles ur ON ur.role_id = rp.role_id " +
            "WHERE ur.user_id = ?", userId
        ).forEach(row -> permissions.add((String) row.get("name")));

        // Generate JWT
        String token = jwtProvider.createToken(userId, username);

        // Update last login
        spCaller.update("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?", userId);

        // Audit
        spCaller.update(
            "INSERT INTO admin_audit_logs (admin_user_id, admin_username, action, module, result, created_at) " +
            "VALUES (?, ?, 'LOGIN', 'auth', 'SUCCESS', NOW())",
            userId, username);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of(
                "id", userId,
                "username", username,
                "email", user.get("email"),
                "permissions", permissions
            )
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        AuthUser user = (AuthUser) request.getAttribute("authUser");
        if (user != null) {
            spCaller.update(
                "INSERT INTO admin_audit_logs (admin_user_id, admin_username, action, module, result, created_at) " +
                "VALUES (?, ?, 'LOGOUT', 'auth', 'SUCCESS', NOW())",
                user.getId(), user.getUsername());
        }
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        AuthUser user = (AuthUser) request.getAttribute("authUser");
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "permissions", user.getPermissions()
        ));
    }
}
