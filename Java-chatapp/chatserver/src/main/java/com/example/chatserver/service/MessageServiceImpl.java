package com.example.chatserver.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.chatserver.dao.MessageDAO;
import com.example.chatserver.model.Message;


@Service
public class MessageServiceImpl implements MessageService {

    public MessageDAO messageRepository;

    public MessageServiceImpl(MessageDAO messageRepository) {
        this.messageRepository = messageRepository;
    }

    @Override
    public Message save(Message Message) {
        return messageRepository.save(Message);
    }

    @Override
    public List<Message> getAllMessage() {
        System.out.println("entered Message service implementation");

        List<Message> messageList = messageRepository.getAll();
        System.out.println(messageList);
        return messageList;

    }

    @Override
    public void deleteByID(String id) {
        messageRepository.deleteByID(id);
    }

    @Override
    public List<Message> getAllMessagesForUser(String username) {
       return messageRepository.getAllMessagesForUser(username);
    }

}
