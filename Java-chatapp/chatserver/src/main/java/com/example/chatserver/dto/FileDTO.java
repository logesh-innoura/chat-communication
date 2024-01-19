package com.example.chatserver.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class FileDTO
{
    private String fileUploadedUrl;
    private Instant uploadedDate;
}
