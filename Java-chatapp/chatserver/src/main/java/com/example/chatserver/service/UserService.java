package com.example.chatserver.service;

import java.util.List;

import com.example.chatserver.model.User;


public interface UserService {
    List<User> getAllUser();

    User save(User employee);

    void deleteByID(String id);
}
