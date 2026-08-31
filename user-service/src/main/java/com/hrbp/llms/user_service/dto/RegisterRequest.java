package com.hrbp.llms.user_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String nom;
    @NotBlank private String prenom;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 8) private String password;
    @NotBlank private String role; // collaborateur | manager | hrbp
}