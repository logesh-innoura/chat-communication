import React, { useEffect, useState, useRef } from "react";
import { over } from "stompjs";
import Badge from "react-bootstrap/Badge";
import TimeAgo from "react-timeago";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import _ from "lodash";
import SockJS from "sockjs-client";
import profile from "../../assets/user-profile-default.png";
import "./chat.css";
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBIcon,
  MDBBtn,
  MDBTypography,
  MDBTextArea,
  MDBCardHeader,
  MDBInputGroup,
  MDBTooltip,
} from "mdb-react-ui-kit";

let stompClient = null;
let pageSize = 10;

export default function App() {
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);
  const [pageNo, setPageNo] = useState(0);
  const [chatAction, setChatAction] = useState("");
  const [message, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [messagedMembersList, setMessagedMembersList] = useState([]);
  const [searchedInMembersList, setSearchedInMembersList] = useState([]);
  const [currentChatMember, setCurrentChatMember] = useState(null);
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
    searchNewUserMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToTop = () => {
    messagesTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (message && chatAction === "load") {
      scrollToBottom();
    } else if (message && chatAction === "add") {
      scrollToTop();
    }
  }, [message, chatAction]);
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
      setSearchedUsers(temp);
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
    users.length > 0 &&
      userData.username &&
      stompClient === null &&
      connectingFunction();
  }, [users, userData]);
  const handleSendMessage = () => {
    if (userData.message === "") {
      return;
    }
    if (stompClient) {
      const chatMessage = {
        senderName: userData.username,
        receiverName: currentChatMember.sender.senderName,
        message: userData.message,
        messageStatus: "DELIVERED",
        fileUrl: userData.fileUrl,
        date: getCurrentTimestamp(),
        status: "MESSAGE",
      };

      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));

      setMessages([...message, chatMessage]);
      if (!userData.receivername) {
        setUserData({
          ...userData,
          receivername: currentChatMember.sender.senderName,
          message: "",
        });
      } else {
        setUserData({ ...userData, message: "" });
      }
      if (
        currentChatMember !== null &&
        !currentChatMember.isNewMember &&
        searchedInMembersList[0].senderName !==
          currentChatMember.sender.senderName
      ) {
        const data = [...searchedInMembersList];
        data.splice(
          _.findIndex(searchedInMembersList, function (member) {
            return member.senderName == currentChatMember.sender.senderName;
          }),
          1
        );
        data.unshift(currentChatMember.sender);

        setSearchedInMembersList(data);
      }
    } else {
      connect();
      handleSendMessage();
    }
  };

  const handleSearchUser = (e) => {
    setUserData({ ...userData, searchNewUserMessage: e.target.value });
    if (e.target.value.length > 0) {
      const regexp = new RegExp(e.target.value, "i");
      const filteredUsers = users
        .filter((user) => user !== userData.username)
        .filter((user) => regexp.test(user));
      setSearchedUsers([...filteredUsers]);
    } else {
      setSearchedUsers(users);
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
  const handleGetChatHistory = async (sender, status) => {
    try {
      // Fetch messages for the user
      const response = await fetch(
        `http://13.68.177.51:8087/api/messages/private?sender=${sender.senderName}&receiver=${userData.username}&pageNo=${pageNo}&pageSize=${pageSize}`
      );
      const data = await response.json();

      // Separate messages into public and private chats
      const privateMessages = data.content.reverse();
      setIsLastPage(data.last);
      setChatAction(status);
      if (status === "load") {
        setMessages(privateMessages);
      } else {
        setMessages([...privateMessages, ...message]);
      }
      handleResetReadHistory(privateMessages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user messages:", error);
    }
  };
  const handleResetReadHistory = async (privateMessages) => {
    const messageIds = [];
    privateMessages.map((msg) => {
      if (msg.messageStatus === "UNREAD") {
        messageIds.push(msg.id);
      }
    });
    await fetch("http://13.68.177.51:8087/api/change/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messageIds: messageIds, messageStatus: "READ" }),
    });
  };
  const onTabChange = (name, index, sender) => {
    setPageNo(0);
    setCurrentChatMember({ sender, isNewMember: false });
    const data = [...searchedInMembersList];
    data[index].unreadCount = 0;
    setSearchedInMembersList(data);

    handleGetChatHistory(sender, "load");
  };
  const handleFile = async (e) => {
    const file = e.target.files[0];
    let formData = new FormData();
    formData.append("file", file);
    try {
      // Perform the necessary API call to add the user to the database
      const response = await fetch("http://13.68.177.51:8087/api/uploadFile", {
        method: "POST",

        body: formData,
      });

      // Handle the response if needed
      const result = await response.clone().json();

      setUserData({ ...userData, fileUrl: result.response.fileUploadedUrl });
    } catch (error) {
      throw new Error("Error adding user to the database:", error);
    }
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
        regexp.test(member.senderName)
      );
      setSearchedInMembersList(filteredMember);
    } else {
      setSearchedInMembersList(messagedMembersList);
    }

    console.log("searchedInMembersList", searchedInMembersList);
  };

  const handleCreateNewChat = (name) => {
    setPageNo(0);
    setMessages([]);
    setUserData({
      ...userData,
      searchNewUserMessage: "",
    });
    setSearchedUsers(users);
    const isAlreadyMember = searchedInMembersList.filter(
      (member) => member.senderName === name
    );
    if (isAlreadyMember.length === 0) {
      handleGetChatHistory({ senderName: name }, "load");
      setCurrentChatMember({
        index: null,
        isNewMember: true,
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
  };
  const handleChatScroll = (e) => {
    console.log(e.target.scrollTop);
    if (e.target.scrollTop === 0 && !isLastPage) {
      setLoading(true);
      setPageNo(pageNo + 1);
    }
  };
  useEffect(() => {
    // Fetch the list of users
    if (pageNo > 0 && currentChatMember.sender) {
      handleGetChatHistory(currentChatMember.sender, "add");
    }
  }, [pageNo]);

  return (
    <>
      {userData.connected ? (
        <MDBContainer
          fluid
          // className="py-3"
          style={{ backgroundColor: "#e1e3ff", minHeight: "100vh" }}
        >
          <MDBRow>
            <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0">
              <MDBCard style={{ minHeight: "100vh" }}>
                <div className="mt-3 border-bottom">
                  <h5 className="font-weight-bold mb-3 text-center">
                    Messages
                  </h5>
                </div>
                {messagedMembersList && (
                  <div className="p-3">
                    <h6 className="mb-4">
                      {"Chat List "}
                      <span className="badge bg-danger">
                        {messagedMembersList.length}
                      </span>
                    </h6>
                    <MDBInputGroup className="rounded">
                      <input
                        className="form-control rounded"
                        placeholder="Search messages"
                        type="search"
                        onChange={handleSearchMembers}
                      />
                      <span
                        className="input-group-text border-0"
                        id="search-addon"
                      >
                        <MDBIcon fas icon="search" />
                      </span>
                    </MDBInputGroup>
                  </div>
                )}
                <MDBCardBody style={{ height: "0px", overflowY: "auto" }}>
                  {messagedMembersList ? (
                    <MDBTypography listUnStyled className="mb-0">
                      {searchedInMembersList && (
                        <ul className="chat-persons">
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
                              <li
                                key={index}
                                className="p-2 border-bottom"
                                style={{
                                  backgroundColor:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "#3b71ca",
                                  color:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "#fff",
                                  border:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "1px solid",
                                  borderRadius:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "0.5rem",
                                }}
                                onClick={() => {
                                  onTabChange(
                                    senderName,
                                    index,
                                    searchedInMembersList[index]
                                  );
                                }}
                              >
                                <div className="d-flex justify-content-between">
                                  <div className="d-flex flex-row">
                                    <img
                                      src={profile}
                                      alt="avatar"
                                      className="d-flex align-self-center me-3 shadow-1-strong"
                                      width="50"
                                    />
                                    <div className="pt-1">
                                      <p className="fw-bold mb-0">
                                        {senderName}
                                      </p>
                                      <p className="small text-muted">
                                        {lastMessage}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="pt-1">
                                    <p className="small text-muted mb-1">
                                      <TimeAgo
                                        date={lastMessageTimeStamp}
                                        minPeriod={60}
                                      />
                                    </p>
                                    {unreadCount > 0 && (
                                      <span className="badge bg-danger float-end">
                                        {unreadCount}
                                      </span>
                                      // <span className="text-muted float-end">
                                      //   <MDBIcon fas icon="check" />
                                      // </span>
                                    )}
                                  </div>
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </MDBTypography>
                  ) : (
                    <MDBTypography listUnStyled className="mb-0">
                      No Chats
                    </MDBTypography>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>

            {!currentChatMember && (
              <MDBCol md="6" lg="6" xl="6">
                <div>
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
                                key={senderName}
                                className={`d-flex justify-content-between align-items-start ${
                                  currentChatMember?.sender?.senderName ===
                                    senderName && "active"
                                }`}
                              >
                                <div
                                  onClick={() => {
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

                                  <p className="small text-muted mb-1">
                                    <TimeAgo
                                      date={lastMessageTimeStamp}
                                      minPeriod={60}
                                    />
                                  </p>
                                </div>
                              </ListGroup.Item>
                            )
                          )}
                        </ListGroup>
                      )}
                    </div>
                  )}
                </div>
              </MDBCol>
            )}
            {currentChatMember && (
              <MDBCol md="6" lg="6" xl="6">
                <MDBCard style={{ minHeight: "100vh" }}>
                  <div className="d-flex flex-row justify-content-center border-bottom">
                    <img
                      src={profile}
                      alt="avatar"
                      className="d-flex align-self-center me-3 shadow-1-strong"
                      width="40"
                    />
                    <div className="pt-1">
                      <p className="fw-bold mb-0">
                        {currentChatMember?.sender?.senderName}
                      </p>
                      <p className="small text-muted">Online</p>
                    </div>
                  </div>
                  <MDBCardBody
                    style={{ height: "0px", overflowY: "auto" }}
                    onScroll={handleChatScroll}
                  >
                    <div>
                      <div>
                        <MDBTypography listUnStyled>
                          <ul>
                            {loading && <span>Loading</span>}
                            <div ref={messagesTopRef} />
                            {message?.map((chat, index) => (
                              <>
                                {chat.senderName !== userData.username ? (
                                  <li
                                    className="d-flex flex-row justify-content-start"
                                    key={index}
                                    ref={index === 2 ? messagesTopRef : {}}
                                  >
                                    <img
                                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                                      alt="avatar 1"
                                      style={{
                                        width: "45px",
                                        height: "100%",
                                      }}
                                    />
                                    <div>
                                      <p
                                        className="small p-2 ms-3 mb-1 rounded-3"
                                        style={{
                                          backgroundColor: "#f5f6f7",
                                        }}
                                      >
                                        {chat.message}
                                      </p>
                                      {chat.fileUrl && (
                                        <embed
                                          src={chat.fileUrl}
                                          width="100px"
                                          height="100px"
                                        />
                                      )}
                                      <p className="small ms-3 mb-3 rounded-3 text-muted float-end">
                                        {chat.date}
                                      </p>
                                    </div>
                                  </li>
                                ) : (
                                  <li
                                    className="d-flex flex-row justify-content-end"
                                    key={index}
                                  >
                                    <div>
                                      <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                                        {chat.message}
                                        {chat.senderName ===
                                          userData.username &&
                                          chat.messageStatus ===
                                            "DELIVERED" && (
                                            <span className="text-muted float-end">
                                              <MDBTooltip
                                                tag="a"
                                                wrapperProps={{
                                                  href: "#",
                                                }}
                                                title="Sent"
                                              >
                                                <MDBIcon
                                                  fas
                                                  icon="check"
                                                  style={{
                                                    color: "black",
                                                  }}
                                                />
                                              </MDBTooltip>
                                            </span>
                                          )}
                                        {chat.senderName ===
                                          userData.username &&
                                          chat.messageStatus === "READ" && (
                                            <span className="text-muted float-end">
                                              <MDBTooltip
                                                tag="a"
                                                wrapperProps={{
                                                  href: "#",
                                                }}
                                                title="Read"
                                              >
                                                <MDBIcon
                                                  fas
                                                  icon="check-double"
                                                  style={{
                                                    color: "white",
                                                  }}
                                                />
                                              </MDBTooltip>
                                            </span>
                                          )}
                                        {chat.senderName ===
                                          userData.username &&
                                          chat.messageStatus === "UNREAD" && (
                                            <span className="text-muted float-end">
                                              <MDBTooltip
                                                tag="a"
                                                wrapperProps={{
                                                  href: "#",
                                                }}
                                                title="Unread"
                                              >
                                                <MDBIcon
                                                  fas
                                                  icon="check"
                                                  style={{
                                                    color: "white",
                                                  }}
                                                />
                                              </MDBTooltip>
                                            </span>
                                          )}
                                      </p>
                                      <p className="small me-3 mb-3 rounded-3 text-muted">
                                        {chat.date}
                                      </p>
                                      {chat.fileUrl && (
                                        <embed
                                          src={chat.fileUrl}
                                          width="100px"
                                          height="100px"
                                        />
                                      )}
                                    </div>
                                    <img
                                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                                      alt="avatar 1"
                                      style={{
                                        width: "45px",
                                        height: "100%",
                                      }}
                                    />
                                  </li>
                                )}
                              </>
                            ))}
                          </ul>

                          <div ref={messagesEndRef} />
                        </MDBTypography>
                      </div>

                      {/* <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                                <form
                                  onSubmit={handleSendMessage}
                                  style={{ width: "100%", display: "flex" }}
                                >
                                  
                                  <MDBTextArea
                                    label="Message"
                                    id="textAreaExample"
                                    rows={4}
                                    value={userData.message}
                                    onChange={handleMessage}
                                  />
                                  <input
                                    type={"file"}
                                    onChange={handleFile}
                                    className="ms-1 text-muted"
                                  />
                                  <a className="ms-3" href="#!">
                                    <MDBIcon
                                      fas
                                      icon="paper-plane"
                                      onClick={handleSendMessage}
                                    />
                                  </a>
                                </form>
                              </div> */}
                    </div>
                  </MDBCardBody>
                  <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                    <img
                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                      alt="avatar 3"
                      style={{ width: "40px", height: "100%" }}
                    />
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="exampleFormControlInput2"
                      placeholder="Type message"
                      value={userData.message}
                      onChange={handleMessage}
                    />
                    <a className="ms-1 text-muted" href="#!">
                      <input
                        type={"file"}
                        onChange={handleFile}
                        className="ms-1 text-muted"
                      />

                      {/* <label for="image">
                          <input type="file" name="image" id="image" style={{display: 'none'}}
                                    onChange={handleFile}/>
                          <img src={profile} width={20}/>
                      </label> */}
                    </a>
                    <a className="ms-3" onClick={handleSendMessage}>
                      <MDBIcon fas icon="paper-plane" />
                    </a>
                  </div>
                </MDBCard>
              </MDBCol>
            )}

            <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0">
              <MDBCard style={{ minHeight: "100vh" }}>
                <div className="mt-3 border-bottom">
                  <h5 className="font-weight-bold mb-3 text-center">
                    Directory
                  </h5>
                </div>
                <div className="p-3">
                  <h6 className="mb-4">
                    {"Team Members "}
                    <span className="badge bg-danger">{users.length}</span>
                  </h6>
                  <MDBInputGroup className="rounded">
                    <input
                      className="form-control rounded"
                      placeholder="Search a new user"
                      type="search"
                      value={userData.searchNewUserMessage}
                      onChange={handleSearchUser}
                    />
                    <span
                      className="input-group-text border-0"
                      id="search-addon"
                    >
                      <MDBIcon fas icon="search" />
                    </span>
                  </MDBInputGroup>
                </div>
                <MDBCardBody style={{ height: "0px", overflowY: "auto" }}>
                  {searchedUsers && (
                    <MDBTypography listUnStyled className="mb-0">
                      <ul className="chat-persons">
                        {searchedUsers?.map((name, index) => (
                          <li className="p-2 border-bottom" key={index}>
                            <div
                              className="d-flex justify-content-between"
                              onClick={() => {
                                handleCreateNewChat(name);
                              }}
                            >
                              <div className="d-flex flex-row">
                                <img
                                  src={profile}
                                  alt="avatar"
                                  className="d-flex align-self-center me-3 shadow-1-strong"
                                  width="50"
                                />
                                <div className="pt-1">
                                  <p className="fw-bold mb-0">{name}</p>
                                  <p className="small text-muted">
                                    Designation
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </MDBTypography>
                  )}
                </MDBCardBody>
              </MDBCard>
            </MDBCol>
          </MDBRow>
        </MDBContainer>
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
    </>
  );
}
