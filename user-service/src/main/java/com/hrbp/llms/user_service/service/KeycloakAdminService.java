package com.hrbp.llms.user_service.service;

import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
@Slf4j
@Service
public class KeycloakAdminService {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.admin-client-id}")
    private String adminClientId;

    @Value("${keycloak.admin-client-secret}")
    private String adminClientSecret;

    private Keycloak getAdminClient() {
        return KeycloakBuilder.builder()
                .serverUrl(authServerUrl)
                .realm(realm)
                .clientId(adminClientId)
                .clientSecret(adminClientSecret)
                .grantType("client_credentials")
                .build();
    }

    /**
     * Creates the user in Keycloak, sets password, assigns realm role.
     * Returns the Keycloak user ID (sub).
     */
    public String createUser(String email, String firstName, String lastName,
                             String password, String role) {
        Keycloak kc = getAdminClient();
        RealmResource realmResource = kc.realm(realm);
        UsersResource usersResource = realmResource.users();

        // ========== FIX: Check if user already exists in Keycloak ==========
        List<UserRepresentation> existing = usersResource.search(email, true);
        if (!existing.isEmpty()) {
            String existingId = existing.get(0).getId();
            log.warn("User {} already exists in Keycloak with id {}, reusing", email, existingId);

            // Optional: update password and role to ensure consistency
            try {
                CredentialRepresentation credential = new CredentialRepresentation();
                credential.setType(CredentialRepresentation.PASSWORD);
                credential.setValue(password);
                credential.setTemporary(false);
                usersResource.get(existingId).resetPassword(credential);

                RoleRepresentation roleRepresentation = realmResource.roles().get(role).toRepresentation();
                usersResource.get(existingId).roles().realmLevel()
                        .add(Collections.singletonList(roleRepresentation));
            } catch (Exception e) {
                log.warn("Could not update existing Keycloak user: {}", e.getMessage());
            }
            return existingId;
        }

        UserRepresentation user = new UserRepresentation();
        user.setUsername(email);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEnabled(true);
        user.setEmailVerified(true);

        Response response = usersResource.create(user);
        if (response.getStatus() != 201) {
            throw new RuntimeException("Failed to create Keycloak user: " + response.getStatus()
                    + " " + response.readEntity(String.class));
        }

        String userId = extractUserId(response);

        // Set password
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(password);
        credential.setTemporary(false);
        usersResource.get(userId).resetPassword(credential);

        // Assign realm role
        RoleRepresentation roleRepresentation = realmResource.roles().get(role).toRepresentation();
        usersResource.get(userId).roles().realmLevel()
                .add(Collections.singletonList(roleRepresentation));

        response.close();
        return userId;
    }

    public void setUserEnabled(String keycloakId, boolean enabled) {
        Keycloak kc = getAdminClient();
        UserRepresentation user = kc.realm(realm).users().get(keycloakId).toRepresentation();
        user.setEnabled(enabled);
        kc.realm(realm).users().get(keycloakId).update(user);
    }

    public void deleteUser(String keycloakId) {
        getAdminClient().realm(realm).users().get(keycloakId).remove();
    }

    private String extractUserId(Response response) {
        String location = response.getHeaderString("Location");
        return location.substring(location.lastIndexOf('/') + 1);
    }
}