package com.example.chatserver.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Document(collection = "message")
public class Message {

    @Id
    private String id;

    private String senderName;
    private String receiverName;
    private String message;
    private String date;
    private Status status;

}
