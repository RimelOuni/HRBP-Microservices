package com.hrbp.llms.user_service.controller;

import com.hrbp.llms.user_service.dto.*;
import com.hrbp.llms.user_service.entity.UserProfile;
import com.hrbp.llms.user_service.repository.UserProfileRepository;
import com.hrbp.llms.user_service.service.KeycloakAdminService;
import com.hrbp.llms.user_service.service.KeycloakAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Auth", description = "Register, login, logout, profile")
public class AuthController {

    private final KeycloakAdminService keycloakAdminService;
    private final KeycloakAuthService keycloakAuthService;
    private final UserProfileRepository userProfileRepository;


    @PostMapping("/register")
    @Transactional
    @Operation(summary = "Register a new user")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info(">>> register() reached for email={}", request.getEmail());

        if (userProfileRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(409).body("Email already registered in local database");
        }

        String keycloakId;
        try {
            log.info(">>> calling keycloakAdminService.createUser()");
            keycloakId = keycloakAdminService.createUser(
                    request.getEmail(), request.getPrenom(), request.getNom(),
                    request.getPassword(), request.getRole()
            );
            log.info(">>> Keycloak user created/reused, id={}", keycloakId);
        } catch (Exception e) {
            log.error(">>> createUser() failed: {}", e.getMessage(), e);
            return ResponseEntity.status(502).body("Keycloak error: " + e.getMessage());
        }

        try {
            UserProfile profile = new UserProfile();
            profile.setKeycloakId(keycloakId);
            profile.setNom(request.getNom());
            profile.setPrenom(request.getPrenom());
            profile.setEmail(request.getEmail());
            profile.setRole(request.getRole());
            profile.setActive(true);

            userProfileRepository.save(profile);
            log.info(">>> profile saved, id={}", profile.getId());
            return ResponseEntity.status(201).body(profile);
        } catch (Exception e) {
            log.error(">>> Local DB save failed, rolling back. Attempting Keycloak cleanup: {}", e.getMessage());
            // Optional: delete the Keycloak user if local save fails to avoid orphans
            try {
                keycloakAdminService.deleteUser(keycloakId);
            } catch (Exception cleanupEx) {
                log.error(">>> Keycloak cleanup also failed: {}", cleanupEx.getMessage());
            }
            return ResponseEntity.status(500).body("Failed to save user profile: " + e.getMessage());
        }
    }
    @PostMapping("/login")
    @Operation(summary = "Login and receive access/refresh tokens")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        var profile = userProfileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!profile.isActive()) {
            return ResponseEntity.status(403).body("User account is disabled");
        }

        ResponseLogin tokens = keycloakAuthService.login(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(tokens);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate refresh token")
    public ResponseEntity<?> logout(@RequestBody LogoutRequest request) {
        keycloakAuthService.logout(request.getRefreshToken());
        return ResponseEntity.ok("Logged out successfully");
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<?> me(@AuthenticationPrincipal Jwt jwt) {
        String keycloakId = jwt.getSubject();
        var profile = userProfileRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return ResponseEntity.ok(profile);
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a user (hrbp only, enforced at gateway)")
    public ResponseEntity<?> deactivate(@PathVariable java.util.UUID id) {
        var profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        profile.setActive(false);
        keycloakAdminService.setUserEnabled(profile.getKeycloakId(), false);
        userProfileRepository.save(profile);
        return ResponseEntity.ok(profile);
    }
}