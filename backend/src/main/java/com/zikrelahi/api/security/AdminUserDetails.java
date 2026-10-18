package com.zikrelahi.api.security;

import com.zikrelahi.api.admin.AdminUser;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class AdminUserDetails implements UserDetails {

    @Getter
    private final AdminUser adminUser;

    public AdminUserDetails(AdminUser adminUser) {
        this.adminUser = adminUser;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + adminUser.getRole().name()));
    }

    @Override
    public String getPassword() {
        return adminUser.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return adminUser.getEmail();
    }

    @Override
    public boolean isEnabled() {
        return adminUser.isEnabled();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
}
