package com.sabbpe.admin.security;

import lombok.Data;

import java.util.Set;

@Data
public class AuthUser {
    private String id;
    private String username;
    private String email;
    private Set<String> permissions;

    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }
}
