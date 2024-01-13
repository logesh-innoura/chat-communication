package com.example.chatserver.controller;

import java.io.IOException;
import java.util.List;

import com.azure.core.annotation.Post;
import com.example.chatserver.dto.StatusChangeDTO;
import com.example.chatserver.model.ChatUsersHistory;
import com.example.chatserver.model.MessageStatus;
import com.example.chatserver.service.AzureBlobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import com.example.chatserver.model.Message;
import com.example.chatserver.model.User;
import com.example.chatserver.service.MessageService;
import com.example.chatserver.service.UserService;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@Slf4j
public class DataController {

    public MessageService messageService;
    public UserService userService;
    private final AzureBlobService azureBlobService;

    public DataController(MessageService messageService, UserService userService, AzureBlobService azureBlobService) {
        this.messageService = messageService;
        this.userService = userService;
        this.azureBlobService = azureBlobService;
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

    @GetMapping("/getChatUsersHistory")
    public List<ChatUsersHistory> getChatUsersHistory(@RequestParam String sender) {
        return messageService.getChatUsersHistory(sender);
    }

    @PostMapping("/uploadFile")
    public String uploadFileAndGetToken(@RequestParam MultipartFile file)
    {
        try {
            String blobName = azureBlobService.uploadFileToBlob( file.getOriginalFilename(),
                    file.getInputStream(), file.getSize());
            return azureBlobService.generateSasToken(blobName);
        } catch (IOException e) {
            log.error("error while uploading file of the message");
            throw new RuntimeException("Exception while uploading file");
        }
    }

    @GetMapping("/message/count")
    public long getUnreadMessageCount(@RequestParam("sender") String sender, @RequestParam("receiver") String receiver, @RequestParam("messageStatus") MessageStatus messageStatus)
    {
        return messageService.countMessageBySenderNameAndReceiverNameAndMessageStatus(sender, receiver, messageStatus);
    }

    @GetMapping("/messages/private")
    public Page<Message> getMessages(@RequestParam("sender") String sender, @RequestParam("receiver") String receiver, @RequestParam("pageNo") int pageNo, @RequestParam("pageSize") int pageSize)
    {
        return messageService.findMessageBySenderNameAndReceiverNameOrderByTimeStampDesc(sender, receiver, pageNo, pageSize);
    }

    @PostMapping("/change/status")
    public void changeStatus(@RequestBody StatusChangeDTO statusChangeDTO)
    {
        messageService.markMessagesStatus(statusChangeDTO.getMessageIds(), statusChangeDTO.getMessageStatus());
    }

}
