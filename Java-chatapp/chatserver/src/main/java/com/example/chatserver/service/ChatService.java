package com.example.chatserver.service;

import com.example.chatserver.dto.UnreadMessageCountDTO;
import com.example.chatserver.model.Message;
import com.example.chatserver.model.MessageStatus;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationExpression;
import org.springframework.data.mongodb.core.aggregation.AggregationOperationContext;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class ChatService {

    private final MongoTemplate mongoTemplate;

    public ChatService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public List<UnreadMessageCountDTO> getUnreadMessageCount(String receiver) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("receiverName").is(receiver)),
                Aggregation.sort(Sort.by(Sort.Order.desc("timeStamp"))),
                Aggregation.group(Fields.from(
                                Fields.field("senderName", "$senderName"),
                                Fields.field("receiverName", "$receiverName")
                        ))
                        .first("senderName").as("senderName")
                        .first("receiverName").as("receiverName")
                        .first("message").as("lastMessage")
                        .sum(
                                new AggregationExpression() {
                                    @Override
                                    public Document toDocument(AggregationOperationContext context) {
                                        return new Document("$cond",
                                                Arrays.asList(
                                                        new Document("$eq", Arrays.asList("$messageStatus", MessageStatus.UNREAD)),
                                                        1L,
                                                        0L
                                                )
                                        );
                                    }
                                }
                        ).as("unreadCount")
                        .first("timeStamp").as("lastMessageTimeStamp"),
                Aggregation.sort(Sort.by(Sort.Order.desc("lastMessageTimeStamp"))),
                Aggregation.project()
                        .and("senderName").as("senderName")
                        .and("receiverName").as("receiverName")
                        .and("lastMessage").as("lastMessage")
                        .and("unreadCount").as("unreadCount")
                        .and("lastMessageTimeStamp").as("lastMessageTimeStamp")
        );

        return mongoTemplate.aggregate(aggregation, Message.class, UnreadMessageCountDTO.class).getMappedResults();
    }
}
