package com.example.chatserver.dao;

import java.util.List;

import com.example.chatserver.model.User;



public interface UserDAO {

    List<User> getAll();

    User save(User user);

    void deleteByID (String id);
    
}
