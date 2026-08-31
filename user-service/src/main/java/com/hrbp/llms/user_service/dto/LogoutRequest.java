package com.hrbp.llms.user_service.dto;

import lombok.Data;

@Data
public class LogoutRequest {
    private String refreshToken;
}