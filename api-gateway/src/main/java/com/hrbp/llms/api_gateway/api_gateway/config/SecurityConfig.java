package com.hrbp.llms.api_gateway.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/eureka/**", "/actuator/**", "/swagger-ui/**", "/v3/api-docs/**", "/webjars/**").permitAll()

                        // ── Services Java existants ──
                        .pathMatchers("/api/collaborateur/**").hasAnyRole("collaborateur", "manager", "hrbp")
                        .pathMatchers("/api/manager/**").hasAnyRole("manager", "hrbp")
                        .pathMatchers("/api/hrbp/**").hasRole("hrbp")
                        .pathMatchers("/api/evaluations/**").hasAnyRole("collaborateur", "manager", "hrbp")
                        .pathMatchers("/api/users/register", "/api/users/login", "/api/users/logout").permitAll()
                        .pathMatchers("/api/users/**").authenticated()

                        // ── Microservices Node (HRBP Platform) ──
                        .pathMatchers("/api/practices/**").authenticated()
                        .pathMatchers("/api/projects/**").authenticated()
                        .pathMatchers("/api/points/**").authenticated()
                        .pathMatchers("/api/actions/**").authenticated()
                        .pathMatchers("/api/alerts/**").authenticated()
                        .pathMatchers("/api/badges/**").authenticated()
                        .pathMatchers("/api/moods/**").authenticated()
                        .pathMatchers("/api/satisfactions/**").authenticated()
                        .pathMatchers("/api/pointrequests/**").authenticated()
                        .pathMatchers("/api/reclamations/**").authenticated()
                        .pathMatchers("/api/surveys/**").authenticated()

                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtDecoder(jwtDecoder()))
                )
                .build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        return NimbusReactiveJwtDecoder.withJwkSetUri(
                "http://localhost:8180/realms/entreprise-realm/protocol/openid-connect/certs"
        ).build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}