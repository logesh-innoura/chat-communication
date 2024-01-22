package com.example.chatserver.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class MessageReadStatusDTO
{
    private String topicName;
    private String primaryUser;
    private String secondaryUser;
    private List<String> readMessageIDs;
    public MessageReadStatusDTO()
    {
        this.topicName = "read-messages-status";
    }
}
