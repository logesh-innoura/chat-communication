package com.example.chatserver.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@ToString
@Getter
@Setter
public class ChatSummaryDTO {

    private String sender;
    private String receiver;
    private Instant lastUpdated;
    private int unreadCount;
    private String lastMessage;

    public ChatSummaryDTO(String sender, String receiver, Instant lastUpdated, int unreadCount, String lastMessage) {
        this.sender = sender;
        this.receiver = receiver;
        this.lastUpdated = lastUpdated;
        this.unreadCount = unreadCount;
        this.lastMessage = lastMessage;
    }

    // Getters and setters

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }
}
