package com.hrbp.llms.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResponseLogin {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
}