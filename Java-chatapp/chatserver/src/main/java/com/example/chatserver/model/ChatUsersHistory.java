package com.example.chatserver.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Document(collection = "chatusershistory")
public class ChatUsersHistory {

    @Id
    private String id;

    private String sender;
    private String receiver;
    private Instant lastUpdated;
}
