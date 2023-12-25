package com.example.chatserver.dao;

import java.util.List;
import com.example.chatserver.model.Message;

public interface MessageDAO {

    List<Message> getAll();

    List<Message> getAllMessagesForUser(String username);

    Message save(Message message);

    void deleteByID(String id);

}
