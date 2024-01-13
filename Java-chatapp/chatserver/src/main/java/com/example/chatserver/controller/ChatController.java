package com.example.chatserver.controller;

import com.example.chatserver.model.ChatUsersHistory;
import com.example.chatserver.service.AzureBlobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.chatserver.model.Message;
import com.example.chatserver.service.MessageService;

import java.io.IOException;
import java.util.List;

@Controller
@Slf4j
public class ChatController {

    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;
    private MessageService messageService;

    public ChatController(MessageService messageservice, AzureBlobService azureBlobService) {
        this.messageService = messageservice;
    }

    @MessageMapping("/message")
    @SendTo("/chatroom/public")
    public Message receiveMessage(@Payload Message message) {

        messageService.save(message);
        return message;
    }

    @MessageMapping("/private-message")
    public Message recMessage(@Payload Message message) {
        messageService.save(message);
        simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message);
        return message;
    }

    @MessageMapping("/get-users")
    public String getUsers(@Payload String sender) {
        return sender;
    }
}