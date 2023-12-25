package com.example.chatserver.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.chatserver.model.Message;
import com.example.chatserver.model.User;
import com.example.chatserver.service.MessageService;
import com.example.chatserver.service.UserService;

@RestController
@RequestMapping("/api")
public class DataController {

    public MessageService messageService;
    public UserService userService;

    public DataController(MessageService messageService, UserService userService) {
        this.messageService = messageService;
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<User> getAllUser() {

        List<User> userList = userService.getAllUser();

        System.out.println(userList);
        return userList;
    }

    @PostMapping("/addUser")
    public User addUser(@RequestBody User user) {

        System.out.println(" ===========>    " + user);
        // the requestbody should match with thename of field in entity class eg:-
        // firstName;
        User theUser = userService.save(user);

        return theUser;
    }

    @DeleteMapping("/delete/{id}")

    public void deleteEmployeeByID(@PathVariable String id) {

        userService.deleteByID(id);
    }

    @GetMapping("/messages")
    public List<Message> getAllMessages() {

        System.out.println("messages=======>");
        List<Message> messageList = messageService.getAllMessage();

        System.out.println(messageList);
        return messageList;
    }

    @GetMapping("messages/{username}")
    public List<Message> getUserMessages(@PathVariable String username) {
        return messageService.getAllMessagesForUser(username);
    }

}
