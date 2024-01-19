package com.example.chatserver.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> implements Serializable {

    public enum Status {
        SUCCESS, FAILED, EXCEPTION, USER_DEFINED_ERROR
    }

    private Status status;
    private String message;
    private T response;

}
