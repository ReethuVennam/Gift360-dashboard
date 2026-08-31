package com.sabbpe.admin.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtProvider;
    private final JdbcTemplate jdbcTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtProvider.validate(token)) {
                String userId = jwtProvider.getUserId(token);

                try {
                    Map<String, Object> userRow = jdbcTemplate.queryForMap(
                        "SELECT id, username, email FROM admin_users WHERE id = ? AND is_active = 1", userId);

                    Set<String> permissions = new HashSet<>();
                    jdbcTemplate.queryForList(
                        "SELECT p.name FROM admin_permissions p " +
                        "JOIN admin_role_permissions rp ON rp.permission_id = p.id " +
                        "JOIN admin_user_roles ur ON ur.role_id = rp.role_id " +
                        "WHERE ur.user_id = ?", userId
                    ).forEach(row -> permissions.add((String) row.get("name")));

                    AuthUser authUser = new AuthUser();
                    authUser.setId((String) userRow.get("id"));
                    authUser.setUsername((String) userRow.get("username"));
                    authUser.setEmail((String) userRow.get("email"));
                    authUser.setPermissions(permissions);

                    List<SimpleGrantedAuthority> authorities = permissions.stream()
                        .map(p -> new SimpleGrantedAuthority("ROLE_" + p.replace(":", "_")))
                        .toList();

                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(authUser, null, authorities);

                    SecurityContextHolder.getContext().setAuthentication(auth);
                    request.setAttribute("authUser", authUser);

                } catch (Exception e) {
                    log.warn("Failed to load admin user: {}", userId);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
