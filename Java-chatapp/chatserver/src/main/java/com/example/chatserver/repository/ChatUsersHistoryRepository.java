package com.example.chatserver.repository;

import com.example.chatserver.model.ChatUsersHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatUsersHistoryRepository extends MongoRepository<ChatUsersHistory, String>
{
    List<ChatUsersHistory> findBySenderOrderByLastUpdatedDesc(String sender);

    Optional<ChatUsersHistory> findBySenderAndReceiver(String senderName, String receiverName);
}
