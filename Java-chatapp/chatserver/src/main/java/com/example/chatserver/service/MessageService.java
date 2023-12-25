package com.example.chatserver.service;

import java.util.List;

import com.example.chatserver.model.Message;

public interface MessageService {

    List<Message> getAllMessage();

    List<Message> getAllMessagesForUser(String username);

    Message save(Message employee);

    void deleteByID(String id);

}
