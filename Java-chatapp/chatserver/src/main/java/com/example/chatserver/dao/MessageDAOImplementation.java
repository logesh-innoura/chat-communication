package com.example.chatserver.dao;

import com.example.chatserver.model.Message;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class MessageDAOImplementation implements MessageDAO {

    private final MongoTemplate mongoTemplate;

    // @Autowired
    public MessageDAOImplementation(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<Message> getAll() {
        return mongoTemplate.findAll(Message.class);
    }

    @Override
    public List<Message> getAllMessagesForUser(String username) {
        // Adjust the query to use MongoDB's query language
        Query query = new Query(
                new Criteria().orOperator(
                        Criteria.where("senderName").is(username),
                        Criteria.where("receiverName").is(username),
                        Criteria.where("receiverName").exists(false)
                )
        );
    
        List<Message> msg = mongoTemplate.find(query, Message.class);
        System.out.println(msg);
    
        return msg;
    }

    @Override
    public Message save(Message message) {
        // Save the message to MongoDB
        return mongoTemplate.save(message);
    }

    @Override
    public void deleteByID(String id) {
        // Delete the message by ID
        Query query = new Query(Criteria.where("id").is(id));
        mongoTemplate.remove(query, Message.class);
    }
}
