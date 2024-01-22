package com.example.chatserver.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Date;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Document(collection = "message")
public class Message implements Cloneable {

    @Id
    private String id;

    private String senderName;
    private String receiverName;
    private String message;
    private String date;
    private Status status;
    private String fileUrl;
    private String fileType;
    private MessageStatus messageStatus;
    @CreatedDate
    private Instant timeStamp;

    @Override
    public Object clone() throws CloneNotSupportedException {
        return super.clone();
    }
}
