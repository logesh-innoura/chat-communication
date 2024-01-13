package com.example.chatserver.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.example.chatserver.model.ChatUsersHistory;
import com.example.chatserver.model.MessageStatus;
import com.example.chatserver.repository.ChatUsersHistoryRepository;
import com.example.chatserver.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.chatserver.dao.MessageDAO;
import com.example.chatserver.model.Message;


@Service
public class MessageServiceImpl implements MessageService {

    public MessageDAO messageRepository;
    @Autowired
    private SimpMessagingTemplate simpMessagingTemplate;

    private MessageRepository mongoMessageRepository;

    private final ChatUsersHistoryRepository chatUsersHistoryRepository;

    public MessageServiceImpl(MessageDAO messageRepository, ChatUsersHistoryRepository chatUsersHistoryRepository) {
        this.messageRepository = messageRepository;
        this.chatUsersHistoryRepository = chatUsersHistoryRepository;
    }

    @Override
    public Message save(Message message)
    {
        updateChatUsers(message);
        new Message();
        Message clonedMessage;
        try {
            clonedMessage = (Message) message.clone();
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }
        String receiver = clonedMessage.getReceiverName();
        clonedMessage.setReceiverName(clonedMessage.getSenderName());
        clonedMessage.setSenderName(receiver);
        updateChatUsers(clonedMessage);
        System.out.println("cloned message is : " + clonedMessage);
        return messageRepository.save(message);
    }

    @Async
    public void updateChatUsers(Message message)
    {

        Optional<ChatUsersHistory> chatUsersHistoryOptional = chatUsersHistoryRepository.findBySenderAndReceiver(message.getSenderName(), message.getReceiverName());

        ChatUsersHistory chatUsersHistory;
        if (chatUsersHistoryOptional.isPresent())
        {
            chatUsersHistory = chatUsersHistoryOptional.get();
        }
        else {
            chatUsersHistory = new ChatUsersHistory();
            chatUsersHistory.setSender(message.getSenderName());
            chatUsersHistory.setReceiver(message.getReceiverName());
        }
        chatUsersHistory.setLastUpdated(Instant.now());
        chatUsersHistoryRepository.save(chatUsersHistory);
        List<ChatUsersHistory> chatUsersHistories = getChatUsersHistory(message.getSenderName());
        simpMessagingTemplate.convertAndSendToUser(message.getSenderName(), "/topic", chatUsersHistories);
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

    public List<ChatUsersHistory> getChatUsersHistory(String sender)
    {
        return chatUsersHistoryRepository.findBySenderOrderByLastUpdatedDesc(sender);
    }

    @Override
    public Long countMessageBySenderNameAndReceiverNameAndMessageStatus(String sender, String receiver, MessageStatus messageStatus) {
        return mongoMessageRepository.countMessageBySenderNameAndReceiverNameAndMessageStatus(sender, receiver, messageStatus);
    }

    @Override
    public Page<Message> findMessageBySenderNameAndReceiverNameOrderByTimeStampDesc(String sender, String receiver, int pageNo, int pageSize)
    {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return mongoMessageRepository.findMessageBySenderNameAndReceiverNameOrderByTimeStampDesc(sender, receiver, pageable);
    }

    @Override
    public void markMessagesStatus(List<String> messageIds, MessageStatus messageStatus) {
        List<Message> messages = mongoMessageRepository.findByIdIn(messageIds);
        messages.forEach(message -> message.setMessageStatus(messageStatus));
        if (!messages.isEmpty()) {
            mongoMessageRepository.saveAll(messages);
        }
    }

}
