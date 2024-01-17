package com.example.chatserver;

import com.example.chatserver.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class Test {
   @Autowired
   ChatService chatService;

   @org.junit.jupiter.api.Test
   public void testChatService()
   {
       System.out.println("result is : " + chatService.getUnreadMessageCount("ramesh"));
   }

}

