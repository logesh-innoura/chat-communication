package com.example.chatserver.dto;

import com.example.chatserver.model.MessageStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatusChangeDTO
{
    private String primaryUser;
    private String secondaryUser;
    List<String> messageIds;
    MessageStatus messageStatus;
}
