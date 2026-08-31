package com.hrbp.llms.user_service.service;

import com.hrbp.llms.user_service.dto.ResponseLogin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@Slf4j
@Service
public class KeycloakAuthService {

    @Value("${keycloak.auth-server-url}")
    private String authServerUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.frontend-client-id}")
    private String clientId;

    @Value("${keycloak.admin-client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public ResponseLogin login(String email, String password) {
        String tokenUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        form.add("username", email);
        form.add("password", password);

        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        log.info(">>> Keycloak login attempt: url={}, clientId={}, username={}", tokenUrl, clientId, email);

        try {
            Map<String, Object> resp = restTemplate.postForObject(
                    tokenUrl, new HttpEntity<>(form, headers), Map.class);

            return new ResponseLogin(
                    (String) resp.get("access_token"),
                    (String) resp.get("refresh_token"),
                    Long.parseLong(resp.get("expires_in").toString()),
                    (String) resp.get("token_type")
            );
        } catch (HttpClientErrorException e) {
            log.error(">>> Keycloak login FAILED: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Invalid email or password");
        }
    }

    public void logout(String refreshToken) {
        String logoutUrl = authServerUrl + "/realms/" + realm + "/protocol/openid-connect/logout";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("refresh_token", refreshToken);

        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        restTemplate.postForObject(logoutUrl, new HttpEntity<>(form, headers), Void.class);
    }
}