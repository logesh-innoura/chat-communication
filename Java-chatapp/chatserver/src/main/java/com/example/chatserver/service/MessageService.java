package com.example.chatserver.service;

import java.util.List;

import com.example.chatserver.model.ChatUsersHistory;
import com.example.chatserver.model.Message;
import com.example.chatserver.model.MessageStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MessageService {

    List<Message> getAllMessage();

    List<Message> getAllMessagesForUser(String username);

    Message save(Message message);

    void deleteByID(String id);

    public List<ChatUsersHistory> getChatUsersHistory(String sender);

    Long countMessageBySenderNameAndReceiverNameAndMessageStatus(String sender, String receiver, MessageStatus messageStatus);

    Page<Message> findMessageBySenderNameAndReceiverNameOrderByTimeStampDesc(String sender, String receiver, int page, int size);

    public void markMessagesStatus(List<String> messageIds, MessageStatus messageStatus);

}
