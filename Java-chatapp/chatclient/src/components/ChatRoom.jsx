import React, { useEffect, useState } from "react";
import { over } from "stompjs";
import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import SockJS from "sockjs-client";
import TimeAgo from 'react-timeago';
import profile from "../assets/profile.jpeg";

var stompClient = null;
const ChatRoom = () => {
  const [privateChats, setPrivateChats] = useState([]);
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchNewUser, setSearchNewUser] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [messagedMembersList, setMessagedMembersList] = useState([]);
  const [searchedInMembersList, setSearchedInMembersList] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [currentChatMember, setCurrentChatMember] = useState(null);

  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });

  const fetchChatHistory = async (username) => {
    try {
      const response = await fetch(
        "http://13.68.177.51:8087/api/get/history?receiver=" + username
      );
      const data = await response.json();

      setMessagedMembersList(data);
      setSearchedInMembersList(data);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  // useEffect(() => {
  //     // Check if userData is available in localStorage
  //     const storedUserData = localStorage.getItem('userData');
  //     if (storedUserData) {
  //       try {
  //         const parsedUserData = JSON.parse(storedUserData);

  //         // If userData is available and connected is true, establish the connection
  //         if (parsedUserData && parsedUserData.connected) {
  //           setUserData(parsedUserData);
  //           connect();
  //         }
  //       } catch (error) {
  //         console.error('Error parsing userData:', error);
  //       }
  //     }
  //   }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://13.68.177.51:8087/api/users");
      const data = await response.json();

      const temp = [];
      data.forEach((item) => {
        temp.push(item.name);
      });
      setUsers(temp);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const connect = () => {
    let Sock = new SockJS("http://13.68.177.51:8087/ws");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    // localStorage.setItem('userData', JSON.stringify({ ...userData, "connected": true }));

    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessage
    );
    stompClient.subscribe(
      "/user/" + userData.username + "/topic",
      onUpdatedUsersHistory
    );
    // userJoin();
  };

  // const userJoin = () => {
  //     var chatMessage = {
  //         senderName: userData.username,
  //         status: "JOIN"
  //     };
  //     stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  // }

  const getCurrentTimestamp = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const formattedTime = `${day < 10 ? "0" : ""}${day}-${
      month < 10 ? "0" : ""
    }${month}-${year}, ${hours % 12 || 12}:${
      minutes < 10 ? "0" : ""
    }${minutes} ${hours >= 12 ? "pm" : "am"}`;

    return formattedTime;
  };

  const onPrivateMessage = (payload) => {
    const payloadData = JSON.parse(payload.body);
    setPrivateChats((temp) => [...temp, payloadData]);
    setMessages((temp) => [...temp, payloadData]);
  };

  const onUpdatedUsersHistory = (payload) => {
    const payloadData = JSON.parse(payload.body);
    console.log("payloadData", payloadData);
    setMessagedMembersList(payloadData);
    setSearchedInMembersList(payloadData);
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };

  const connectingFunction = async () => {
    const isUsernameExists = users.some((user) => user === userData.username);
    
    if (isUsernameExists) {
      try {
        // Connect to WebSocket after updating state
        connect();
      } catch (error) {
        console.error("Error connecting web socket", error);
      }
    } else {
      try {
        // If username doesn't exist, add user to the database
        await addUserToDatabase(userData.username);

        // After adding user to the database, connect to WebSocket
        connect();
      } catch (error) {
        console.error("Error adding user to the database:", error);
      }
    }
  };

  useEffect(() => {
    console.log("users", users);
    users.length > 0 &&
      userData.username &&
      stompClient === null &&
      connectingFunction();
  }, [users, userData]);
  const sendPrivateValue = () => {
    if (stompClient) {
      const chatMessage = {
        senderName: userData.username,
        receiverName: currentChatMember.sender.senderName,
        message: userData.message,
        date: getCurrentTimestamp(),
        status: "MESSAGE",
      };

      setPrivateChats([...privateChats, chatMessage]);
      
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
      setMessages([...privateChats, chatMessage]);
      if (currentChatMember !== null) {
        const data = [...searchedInMembersList];
        data.splice(currentChatMember.index, 1);
        data.unshift(currentChatMember.sender);

        setSearchedInMembersList(data);
        setTab(currentChatMember.sender.sender);
      }
    }
  };

  const handleSearchUser = (e) => {
    setSearchNewUser(e.target.value);
    if (e.target.value.length > 0) {
      const regexp = new RegExp(e.target.value, "i");
      const filteredUsers = users
        .filter((user) => user !== userData.username)
        .filter((user) => regexp.test(user));
      setSearchedUsers([...filteredUsers]);
    } else {
      setSearchedUsers(null);
    }
  };

  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
    fetchChatHistory(value);
  };

  const registerUser = async () => {
    if (!userData.username.trim()) {
      alert("Username should not be empty");
      return;
    }

    fetchUsers();
    // Check if the entered username exists in the messagedMembersList
  };
  const handleGetChatHistory = async (sender) => {
    try {
      // Fetch messages for the user
      const response = await fetch(
        `http://13.68.177.51:8087/api/messages/private?sender=${sender.senderName}&receiver=${userData.username}&pageNo=${pageNo}&pageSize=${pageSize}`
      );
      const data = await response.json();

      // Separate messages into public and private chats
      const privateMessages = data.content.reverse();

      setPrivateChats(privateMessages);
      const messageIds = [];
      privateMessages.map((msg) => {
        if (msg.messageStatus === "UNREAD") {
          messageIds.push(msg.id);
        }
      });
      handleResetReadHistory(messageIds);
      setMessages(privateMessages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
    }
  };
  const handleResetReadHistory = async (messageIds) => {
    await fetch("http://13.68.177.51:8087/api/change/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messageIds: messageIds, messageStatus: "READ" }),
    });
  };
  const onTabChange = (name, index, sender) => {
    setCurrentChatMember({ index, sender });
    const data = [...searchedInMembersList];
    data[index].unreadCount = 0;
    setSearchedInMembersList(data);

    handleGetChatHistory(sender);
  };

  const addUserToDatabase = async (username) => {
    try {
      // Perform the necessary API call to add the user to the database
      const response = await fetch("http://13.68.177.51:8087/api/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: username }),
      });

      // Handle the response if needed
      const result = await response.json();
    } catch (error) {
      throw new Error("Error adding user to the database:", error);
    }
  };

  const handleSearchMembers = (e) => {
    if (e.target.value.length > 0) {
      const regexp = new RegExp(e.target.value, "i");
      const filteredMember = messagedMembersList.filter((member) =>
        regexp.test(member.sender)
      );
      setSearchedInMembersList(filteredMember);
    } else {
      setSearchedInMembersList(messagedMembersList);
    }

    console.log("searchedInMembersList", searchedInMembersList);
  };

  const handleCreateNewChat = (name) => {
    const isAlreadyMember = searchedInMembersList.filter(
      (member) => member.senderName === name
    );
    if (isAlreadyMember.length === 0) {
      handleGetChatHistory(name);
      setCurrentChatMember({
        index: null,
        sender: {
          senderName: name,
          receiverName: userData.username,
          unreadCounazt: 0,
          lastMessageTimeStamp: "",
          lastMessage: "",
        },
      });
    } else {
      const index = messagedMembersList.findIndex(
        (member) => member.senderName === name
      );
      onTabChange(name, index, isAlreadyMember[0]);
    }

    setSearchNewUser("");
    setSearchedUsers(null);
  };
  return (
    <div className="chatContainer">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <div className="left-sidebar-header">
              <h5>
                Messages
                <Badge bg="secondary" pill className="leftBadge">
                  {messagedMembersList.length}
                </Badge>
              </h5>
            </div>
            {messagedMembersList && (
              <div className="chatMembers">
                <Form.Control
                  className="search"
                  type="text"
                  onChange={handleSearchMembers}
                  placeholder="search..."
                />
                {searchedInMembersList && (
                  <ListGroup as="ol" className="mt-2">
                    {searchedInMembersList?.map(
                      (
                        {
                          senderName,
                          unreadCount,
                          lastMessage,
                          lastMessageTimeStamp,
                        },
                        index
                      ) => (
                        <ListGroup.Item
                          as="li"
                          key={index}
                          className={`d-flex justify-content-between align-items-start ${
                            currentChatMember?.sender?.senderName ===
                              senderName && "active"
                          }`}
                        >
                          <div
                            onClick={() => {
                              setTab(senderName);
                              onTabChange(
                                senderName,
                                index,
                                searchedInMembersList[index]
                              );
                            }}
                            className="ms-2"
                            style={{ width: "100%", cursor: "pointer" }}
                          >
                            <div className="fw-bold">
                              {senderName}
                              {unreadCount > 0 && (
                                <sup>
                                  <Badge bg="success" pill>
                                    {unreadCount}
                                  </Badge>
                                </sup>
                              )}
                            </div>
                            <span>{lastMessage}</span>

                            <span className="left-member-time">
                                <TimeAgo
                                    date={lastMessageTimeStamp}
                                    // component={Text}
                                    minPeriod={60}
                                    // style={styles.timeAgo}
                                />
                              {/* {lastMessageTimeStamp} */}
                            </span>
                          </div>
                        </ListGroup.Item>
                      )
                    )}
                  </ListGroup>
                )}
              </div>
            )}

            <div className="loggeInUserData">
              <h3>Welcome {userData.username}</h3>
            </div>
          </div>
          {!currentChatMember && (
            <div className="chat-content">
              <h1>Recent Chats</h1>
              {messagedMembersList && (
                <div className="chatMembers">
                  {searchedInMembersList && (
                    <ListGroup as="ol" className="mt-2">
                      {searchedInMembersList?.map(
                        (
                          {
                            senderName,
                            unreadCount,
                            lastMessage,
                            lastMessageTimeStamp,
                          },
                          index
                        ) => (
                          <ListGroup.Item
                            as="li"
                            key={index}
                            className={`d-flex justify-content-between align-items-start ${
                              currentChatMember?.sender?.senderName ===
                                senderName && "active"
                            }`}
                          >
                            <div
                              onClick={() => {
                                setTab(senderName);
                                onTabChange(
                                  senderName,
                                  index,
                                  searchedInMembersList[index]
                                );
                              }}
                              className="ms-2"
                              style={{ width: "100%" }}
                            >
                              <div className="fw-bold">
                                {senderName}
                                {unreadCount > 0 && (
                                  <sup>
                                    <Badge bg="success" pill>
                                      {unreadCount}
                                    </Badge>
                                  </sup>
                                )}
                              </div>
                              <span>{lastMessage}</span>

                              <span className="left-member-time">
                                {lastMessageTimeStamp}
                              </span>
                            </div>
                          </ListGroup.Item>
                        )
                      )}
                    </ListGroup>
                  )}
                </div>
              )}
            </div>
          )}
          {currentChatMember && (
            <div className="chat-content">
              <div className="chatHeader">
                <div className="chatProfileImage">
                  <img
                    src={profile}
                    alt="chat-header"
                    className="img-thumbnail chatProfile"
                  />
                </div>
                <div>
                  <h3>{currentChatMember?.sender?.senderName}</h3>
                  <p>{"Online"}</p>
                </div>
              </div>
              <ul className="chat-messages">
                {message?.map((chat, index) => (
                  <li
                    className={`message-container ${
                      chat.senderName === userData.username ? "self" : "other"
                    }`}
                    key={index}
                  >
                    {chat.senderName !== userData.username && (
                      <div className="avatar">
                        {chat.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="message-content">
                      <div className="message-data">{chat.message}</div>
                      <div className="timestamp">{chat.date}</div>
                    </div>
                    {chat.senderName === userData.username && (
                      <div className="avatar self">
                        {chat.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="enter the message"
                  value={userData.message}
                  onChange={handleMessage}
                />
                <button
                  type="button"
                  className="send-button"
                  onClick={sendPrivateValue}
                >
                  send
                </button>
              </div>
            </div>
          )}
          {
            <div className="member-list-right">
              <div className="left-sidebar-header">
                <h5>Users</h5>
              </div>
              <div className="chatMembers">
                <form>
                  <div class="form-group">
                    <label for="exampleInputPassword1">Search New User</label>
                    <input
                      type="text"
                      class="form-control"
                      id="exampleInputPassword1"
                      onChange={handleSearchUser}
                      placeholder="Search.."
                    />
                  </div>
                </form>

                {searchedUsers && searchNewUser && (
                  <ListGroup as="ol" className="mt-2">
                    {searchedUsers?.map((name, index) => (
                      <ListGroup.Item
                        as="li"
                        key={index}
                        className={`d-flex justify-content-between align-items-start`}
                      >
                        <div
                          onClick={() => {
                            setTab(name);
                            handleCreateNewChat(name);
                          }}
                          className="ms-2 me-auto"
                        >
                          <div className="fw-bold">{name}</div>
                          {"Designation"}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </div>
          }
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter your name"
            name="userName"
            value={userData.username}
            onChange={handleUsername}
            margin="normal"
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;