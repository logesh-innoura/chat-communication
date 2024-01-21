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
  const [fileModal, setFileModal] = useState(false);

  const [page, setPage] = useState(1);

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
          fileUrl: "",
          fileName: "",
        });
      } else {
        setUserData({ ...userData, message: "", fileUrl: "", fileName: "" });
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
  const handleGetChatHistory = async (sender, status, pageNumber) => {
    try {
      // Fetch messages for the user
      const response = await fetch(
        `http://13.68.177.51:8087/api/messages/private?sender=${sender.senderName}&receiver=${userData.username}&pageNo=${pageNumber}&pageSize=${pageSize}`
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
    scrollToBottom();
    setPageNo(0);
    setCurrentChatMember({ sender, isNewMember: false });
    const data = [...searchedInMembersList];
    data[index].unreadCount = 0;
    setSearchedInMembersList(data);

    handleGetChatHistory(sender, "load", 0);
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

      setUserData({
        ...userData,
        fileUrl: result.response.fileUploadedUrl,
        fileName: file.name,
        message: file.name
          ? userData.message + `(file:${file.name})`
          : userData.message,
      });
      setFileModal(true);
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
      handleGetChatHistory({ senderName: name }, "load", 0);
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
      handleGetChatHistory(currentChatMember.sender, "add", pageNo);
    }
  }, [pageNo]);

  const handleFileModalClose = () => {
    setFileModal(false);
    setUserData({ ...userData, message: "", fileUrl: "", fileName: "" });
  };

  return (
    <>
      {userData.connected ? (
        <MDBContainer
          fluid
          // className="py-3"
          style={{ backgroundColor: "#fff", minHeight: "100vh" }}
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
                        className="form-control rounded search"
                        placeholder="Search messages"
                        type="search"
                        onChange={handleSearchMembers}
                      />
                    </MDBInputGroup>
                  </div>
                )}
                <MDBCardBody className="m-3 customScroll">
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
                                className="p-2"
                                style={{
                                  backgroundColor:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "rgb(220 226 236)",
                                  color:
                                    currentChatMember?.sender?.senderName ===
                                      senderName && "#000",
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
                                    {/* <img
                                      src={profile}
                                      alt="avatar"
                                      className="d-flex align-self-center me-3 shadow-1-strong"
                                      width="50"
                                    /> */}
                                    <MDBIcon
                                      className="d-flex align-self-center me-3"
                                      fas
                                      size="3x"
                                      icon="user-circle"
                                      style={{ color: "#3b71ca" }}
                                    />
                                    <div className="pt-1">
                                      <p className="fw-bold mb-0">
                                        {senderName}
                                      </p>
                                      <p className="small text-muted">
                                        {lastMessage.slice(0, 10) + "..."}
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
                                    {unreadCount > 0 &&
                                      currentChatMember?.sender?.senderName !==
                                        senderName && (
                                        <span className="badge bg-danger float-end">
                                          {unreadCount}
                                        </span>
                                        // <span className="text-muted float-end">
                                        //   <MDBIcon fas icon="check" />
                                        // </span>
                                      )}
                                    <span className="text-muted float-end">
                                      <MDBIcon
                                        fas
                                        size="xs"
                                        icon="circle"
                                        style={{
                                          color: "#53c44d",
                                          marginRight: "0.5rem",
                                        }}
                                      />
                                    </span>
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
              <MDBCol md="6" lg="6" xl="6" className="p-0">
                <div>
                  <h4 style={{ padding: "9px" }}>Recent Chats</h4>
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
                  <div className="d-flex flex-row justify-content-center">
                    {/* <img
                      src={profile}
                      alt="avatar"
                      className="d-flex align-self-center me-3 shadow-1-strong"
                      width="40"
                    /> */}
                    <MDBIcon
                      className="d-flex align-self-center me-3"
                      fas
                      size="3x"
                      icon="user-circle"
                      style={{ color: "#3b71ca" }}
                    />
                    <div className="pt-1">
                      <p className="fw-bold mb-0">
                        {currentChatMember?.sender?.senderName}
                      </p>
                      <p className="small text-muted">
                        <span className="text-muted float-start">
                          <MDBIcon
                            fas
                            size="xs"
                            icon="circle"
                            style={{
                              color: "#53c44d",
                              marginRight: "0.5rem",
                            }}
                          />
                        </span>
                        Online
                      </p>
                    </div>
                  </div>
                  {fileModal ? (
                    <MDBCardBody className="mt-1">
                      <MDBIcon
                        className="d-flex align-self-center mt-3 me-3 float-end"
                        fas
                        size="lg"
                        icon="close"
                        style={{ color: "#3b71ca", cursor: "pointer" }}
                        onClick={handleFileModalClose}
                      />
                      <div>File Name: {userData.fileName}</div>
                    </MDBCardBody>
                  ) : (
                    <MDBCardBody
                      className="mt-1 customScroll"
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
                                      {/* <img
                                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                                      alt="avatar 1"
                                      style={{
                                        width: "45px",
                                        height: "100%",
                                      }}
                                    /> */}
                                      <div>
                                        <p className="small p-2 ms-3 mb-1 text-white bg-secondary bg-gradient bubble-left">
                                          {chat.message}
                                          {chat.fileUrl && (
                                            <a
                                              className="download-link"
                                              href={chat.fileUrl}
                                            >
                                              <MDBIcon
                                                fas
                                                size="sm"
                                                icon="download"
                                                style={{
                                                  color: "white",
                                                }}
                                              />
                                            </a>
                                          )}
                                        </p>

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
                                        <p className="small p-2 me-3 mb-1 text-white bg-primary bg-gradient bubble-right">
                                          {chat.message}
                                          {chat.fileUrl && (
                                            <a
                                              className="download-link"
                                              href={chat.fileUrl}
                                            >
                                              <MDBIcon
                                                fas
                                                size="sm"
                                                icon="download"
                                                style={{
                                                  color: "white",
                                                }}
                                              />
                                            </a>
                                          )}
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
                                                    size="xs"
                                                    style={{
                                                      color: "black",
                                                      marginLeft: "1rem",
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
                                                    size="xs"
                                                    style={{
                                                      color: "white",
                                                      marginLeft: "1rem",
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
                                                    size="xs"
                                                    style={{
                                                      color: "white",
                                                      marginLeft: "1rem",
                                                    }}
                                                  />
                                                </MDBTooltip>
                                              </span>
                                            )}
                                        </p>
                                        <p className="small me-3 mb-3 rounded-3 text-muted">
                                          {chat.date}
                                        </p>
                                      </div>
                                      {/* <img
                                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp"
                                      alt="avatar 1"
                                      style={{
                                        width: "45px",
                                        height: "100%",
                                      }}
                                    /> */}
                                    </li>
                                  )}
                                </>
                              ))}
                            </ul>

                            <div ref={messagesEndRef} />
                          </MDBTypography>
                        </div>
                      </div>
                    </MDBCardBody>
                  )}

                  <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2 mb-3">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="exampleFormControlInput2"
                      placeholder="Type message"
                      value={userData.message}
                      onChange={handleMessage}
                    />
                    <label className="ms-3" htmlFor="fileAdd">
                      <MDBIcon fas icon="upload" style={{ color: "#3b71ca" }} />
                    </label>

                    <input
                      type={"file"}
                      onChange={handleFile}
                      id="fileAdd"
                      style={{ display: "none" }}
                      className="ms-1 text-muted"
                    />

                    {/* <label for="image">
                          <input type="file" name="image" id="image" style={{display: 'none'}}
                                    onChange={handleFile}/>
                          <img src={profile} width={20}/>
                      </label> */}

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
                    Welcome {userData.username}
                  </h5>
                </div>
                <div className="p-3">
                  <h6 className="mb-4">
                    {"Team Members "}
                    <span className="badge bg-danger">{users.length}</span>
                  </h6>
                  <MDBInputGroup className="rounded">
                    <input
                      className="form-control rounded search"
                      placeholder="Search a new user"
                      type="search"
                      value={userData.searchNewUserMessage}
                      onChange={handleSearchUser}
                    />
                  </MDBInputGroup>
                </div>
                <MDBCardBody className="m-3 customScroll">
                  {searchedUsers && (
                    <MDBTypography listUnStyled className="mb-0">
                      <ul className="chat-persons">
                        {searchedUsers?.map((name, index) => (
                          <li className="p-2" key={index}>
                            <div
                              className="d-flex justify-content-between"
                              onClick={() => {
                                handleCreateNewChat(name);
                              }}
                            >
                              <div className="d-flex flex-row">
                                {/* <img
                                  src={profile}
                                  alt="avatar"
                                  className="d-flex align-self-center me-3 shadow-1-strong"
                                  width="50"
                                /> */}
                                <MDBIcon
                                  className="d-flex align-self-center me-3"
                                  fas
                                  size="3x"
                                  icon="user-circle"
                                  style={{ color: "#3b71ca" }}
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
