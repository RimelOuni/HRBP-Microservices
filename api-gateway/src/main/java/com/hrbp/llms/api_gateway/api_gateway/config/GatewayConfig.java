package com.hrbp.llms.api_gateway.api_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // ── Services Java existants ──
                .route("collaborateur-service", r -> r
                        .path("/api/collaborateur/**")
                        .uri("lb://collaborateur-service"))
                .route("manager-service", r -> r
                        .path("/api/manager/**")
                        .uri("lb://manager-service"))
                .route("hrbp-service", r -> r
                        .path("/api/hrbp/**")
                        .uri("lb://hrbp-service"))
                .route("user-service", r -> r
                        .path("/api/users/**")
                        .uri("lb://user-service"))
                .route("eval-service", r -> r
                        .path("/api/evaluations/**")
                        .uri("lb://eval-service"))

                // ── Microservices Node (HRBP Platform) ──
                .route("practice-service", r -> r
                        .path("/api/practices/**")
                        .uri("lb://practice-service"))
                .route("project-service", r -> r
                        .path("/api/projects/**")
                        .uri("lb://project-service"))
                .route("point-service", r -> r
                        .path("/api/points/**")
                        .uri("lb://point-service"))
                .route("action-service", r -> r
                        .path("/api/actions/**")
                        .uri("lb://action-service"))
                .route("alert-service", r -> r
                        .path("/api/alerts/**")
                        .uri("lb://alert-service"))
                .route("badge-service", r -> r
                        .path("/api/badges/**")
                        .uri("lb://badge-service"))
                .route("mood-service", r -> r
                        .path("/api/moods/**")
                        .uri("lb://mood-service"))
                .route("satisfaction-service", r -> r
                        .path("/api/satisfactions/**")
                        .uri("lb://satisfaction-service"))
                .route("pointrequest-service", r -> r
                        .path("/api/pointrequests/**")
                        .uri("lb://pointrequest-service"))
                .route("reclamation-service", r -> r
                        .path("/api/reclamations/**")
                        .uri("lb://reclamation-service"))
                .route("survey-service", r -> r
                        .path("/api/surveys/**")
                        .uri("lb://survey-service"))

                .build();
    }
}