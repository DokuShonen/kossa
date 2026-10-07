package com.kossa.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    private Long id;
    private String nom;
    private String email;
    private String role;
    private String token;
}
