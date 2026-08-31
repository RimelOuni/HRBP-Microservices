package com.hrbp.llms.api_gateway.api_gateway.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

        @Bean
        public GroupedOpenApi collaborateurApi() {
            return GroupedOpenApi.builder()
                    .group("collaborateur-service")
                    .pathsToMatch("/api/collaborateur/**")
                    .build();
        }

        @Bean
        public GroupedOpenApi managerApi() {
            return GroupedOpenApi.builder()
                    .group("manager-service")
                    .pathsToMatch("/api/manager/**")
                    .build();
        }

        @Bean
        public GroupedOpenApi hrbpApi() {
            return GroupedOpenApi.builder()
                    .group("hrbp-service")
                    .pathsToMatch("/api/hrbp/**")
                    .build();
        }
    }

