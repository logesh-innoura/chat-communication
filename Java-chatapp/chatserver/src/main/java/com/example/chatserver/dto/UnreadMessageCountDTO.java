package com.example.chatserver.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@ToString
@Getter
@Setter
public class UnreadMessageCountDTO {

    private String senderName;
    private String receiverName;
    private long unreadCount;
    private Instant lastMessageTimeStamp;
    private String lastMessage;

    // Constructors, getters, and setters

    public UnreadMessageCountDTO() {
    }

    public UnreadMessageCountDTO(String senderName, String receiverName, long unreadCount, Instant lastMessageTimeStamp) {
        this.senderName = senderName;
        this.receiverName = receiverName;
        this.unreadCount = unreadCount;
        this.lastMessageTimeStamp = lastMessageTimeStamp;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public Instant getLastMessageTimeStamp() {
        return lastMessageTimeStamp;
    }

    public void setLastMessageTimeStamp(Instant lastMessageTimeStamp) {
        this.lastMessageTimeStamp = lastMessageTimeStamp;
    }
}
