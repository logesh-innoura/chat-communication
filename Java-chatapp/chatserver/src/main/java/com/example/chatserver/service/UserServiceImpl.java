package com.example.chatserver.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.chatserver.dao.UserDAO;
import com.example.chatserver.model.User;



@Service
public class UserServiceImpl implements UserService {

    public UserDAO userRepository;

    public UserServiceImpl(UserDAO userRepository) {
        this.userRepository = userRepository;
    }

    @Override

    public List<User> getAllUser() {
        List<User> userList = userRepository.getAll();

        return userList;
    }

    @Override

    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public void deleteByID(String id) {
        userRepository.deleteByID(id);
    }

}
