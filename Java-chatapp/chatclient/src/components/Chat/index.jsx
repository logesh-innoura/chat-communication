import React, { useEffect, useState, useRef } from "react";
import { over } from "stompjs";
import Badge from "react-bootstrap/Badge";
import TimeAgo from "react-timeago";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import _ from "lodash";
import SockJS from "sockjs-client";
import profile from "../../assets/user1.png";
import chatProfile from "../../assets/user.png";
import { ToastContainer, toast } from "react-toastify";

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
  MDBBadge,
  MDBCardHeader,
  MDBInputGroup,
  MDBTooltip,
  MDBNavbar,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBNavbarBrand,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownItem,
  MDBDropdownMenu,
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

  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
    searchNewUserMessage: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState();
  const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.pdf|\.xls|\.xlsx)$/i;
  const imgExtensions = /(\.jpg|\.jpeg|\.png)$/i;

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
      // scrollToTop();
    }
  }, [message, chatAction]);
  const fetchChatHistory = async (username) => {
    try {
      fetch(
        "http://13.68.177.51:8087/chatservice/api/get/history?receiver=" +
          username
      )
        .then((response) => response.json())
        .then((data) => {
          setMessagedMembersList(data);
          setSearchedInMembersList(data);
        });
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
      const response = await fetch(
        "http://13.68.177.51:8087/chatservice/api/users"
      );
      const data = await response.json();

      const temp = [];
      data.forEach((item) => {
        temp.push(item);
      });
      setUsers(temp);
      setSearchedUsers(temp);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  const connect = () => {
    let Sock = new SockJS("http://13.68.177.51:8087/chatservice/ws");
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
    let memberList = [...searchedInMembersList];
    let updatedChatCountIndex = null;
    const activeChat = localStorage.getItem("activeChat");
    let result = _.find(memberList, function (obj) {
      if (obj.secondaryUser === payloadData.senderName) {
        return true;
      }
    });
    if (result) {
      searchedInMembersList.map((member, index) => {
        if (
          payloadData.senderName === member.secondaryUser &&
          activeChat === member.secondaryUser
        ) {
          updatedChatCountIndex = index;
          memberList[index].unreadCount = 0;
        } else if (
          payloadData.senderName === member.secondaryUser &&
          activeChat !== member.secondaryUser
        ) {
          updatedChatCountIndex = index;
          memberList[index].unreadCount = memberList[index].unreadCount + 1;
        } else {
          memberList[index].unreadCount = memberList[index].unreadCount;
        }
      });
      const chat = memberList[updatedChatCountIndex];
      memberList.splice(updatedChatCountIndex, 1);
      memberList.unshift(chat);
    } else {
      memberList.unshift({ ...payloadData, unreadCount: 1 });
    }

    setSearchedInMembersList(memberList);
    console.log("test:", 4);
    setMessages((temp) => [...temp, payloadData]);
  };

  const onUpdatedUsersHistory = (payload) => {
    const payloadData = JSON.parse(payload.body);
    console.log("payloadData", payloadData);
    if (payloadData.topicName === "read-messages-status") {
    } else {
      // setMessagedMembersList(payloadData);
      // setSearchedInMembersList(payloadData);
    }
  };

  const onError = (err) => {
    console.log(err);
  };

  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };

  const connectingFunction = async () => {
    const isUsernameExists = users.some(
      (user) => user.userName === userData.username
    );

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
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (userData.message === "") {
      return;
    }
    if (stompClient) {
      let chatMessage = {};

      if (userData.fileUrl) {
        chatMessage = {
          senderName: currentChatMember.sender.primaryUser,
          receiverName: currentChatMember.sender.secondaryUser,
          message: userData.message,
          messageStatus: "DELIVERED",
          fileUrl: userData.fileUrl,
          fileName: userData.fileName,
          fileType: userData.fileType,
          date: getCurrentTimestamp(),
          status: "MESSAGE",
        };
      } else {
        chatMessage = {
          senderName: currentChatMember.sender.primaryUser,
          receiverName: currentChatMember.sender.secondaryUser,
          message: userData.message,
          messageStatus: "DELIVERED",

          date: getCurrentTimestamp(),
          status: "MESSAGE",
        };
      }

      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      console.log("test:", 1);
      setMessages([...message, chatMessage]);
      setFileModal(false);

      if (!userData.receivername) {
        setUserData({
          ...userData,
          receivername: currentChatMember.sender?.secondaryUser,
          message: "",
          fileUrl: "",
          fileName: "",
          fileType: "",
        });
      } else {
        setUserData({
          ...userData,
          message: "",
          fileUrl: "",
          fileName: "",
          fileType: "",
        });
      }
      if (
        currentChatMember !== null &&
        searchedInMembersList.length > 0 &&
        searchedInMembersList[0].secondaryUser !==
          currentChatMember.sender?.secondaryUser
      ) {
        if (currentChatMember.isNewMember) {
          setSearchedInMembersList([
            currentChatMember.sender,
            ...searchedInMembersList,
          ]);
        } else {
          const data = [...searchedInMembersList];
          data.splice(
            _.findIndex(searchedInMembersList, function (member) {
              return (
                member.secondaryUser == currentChatMember.sender?.secondaryUser
              );
            }),
            1
          );
          data.unshift(currentChatMember.sender);
          setSearchedInMembersList(data);
        }
      } else if (searchedInMembersList.length === 0) {
        setSearchedInMembersList([currentChatMember.sender]);
      }
    } else {
      connect();
      // handleSendMessage();
      setFileModal(false);
    }
  };

  const handleSearchUser = (e) => {
    setUserData({ ...userData, searchNewUserMessage: e.target.value });
    if (e.target.value.length > 0) {
      const regexp = new RegExp(e.target.value, "i");
      const filteredUsers = users
        .filter((user) => user.userName !== userData.username)
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
    localStorage.setItem("activeChat", "");
    fetchUsers();
    // Check if the entered username exists in the messagedMembersList
  };
  const handleGetChatHistory = async (sender, status, pageNumber) => {
    try {
      // Fetch messages for the user
      const response = await fetch(
        `http://13.68.177.51:8087/chatservice/api/messages/private?sender=${sender?.secondaryUser}&receiver=${userData.username}&pageNo=${pageNumber}&pageSize=${pageSize}`
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
      handleResetReadHistory(privateMessages, sender);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user messages:", error);
    }
  };
  const handleResetReadHistory = async (privateMessages, sender) => {
    const messageIds = [];
    privateMessages.map((msg) => {
      if (msg.messageStatus === "UNREAD") {
        messageIds.push(msg.id);
      }
    });
    await fetch("http://13.68.177.51:8087/chatservice/api/change/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageIds: messageIds,
        messageStatus: "READ",
        primaryUser: userData.username,
        secondaryUser: sender.receiverName,
      }),
    });
  };
  const handleUpdateUrl = (activeMember) => {
    localStorage.setItem("activeChat", activeMember);
  };
  const onTabChange = (name, index, sender) => {
    scrollToBottom();
    setPageNo(0);
    setCurrentChatMember({ sender, isNewMember: false });
    handleUpdateUrl(sender?.secondaryUser);
    const data = [...searchedInMembersList];
    data[index].unreadCount = 0;
    setSearchedInMembersList(data);

    handleGetChatHistory(sender, "load", 0);
  };
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!allowedExtensions.exec(file.name)) {
      toast.error("File type not allowed", {
        position: "bottom-right",
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      // fileInput.value = '';
      return false;
    } else {
      let formData = new FormData();
      formData.append("file", file);
      try {
        // Perform the necessary API call to add the user to the database
        const response = await fetch(
          "http://13.68.177.51:8087/chatservice/api/uploadFile",
          {
            method: "POST",

            body: formData,
          }
        );

        // Handle the response if needed
        const result = await response.clone().json();

        setUserData({
          ...userData,
          fileUrl: result.response.fileUploadedUrl,
          fileName: file.name,
          fileType: file.type,
          message: file.name
            ? userData.message + `(file:${file.name})`
            : userData.message,
        });
        setFileModal(true);
      } catch (error) {
        // throw new Error("Error adding user to the database:", error);
        toast.error("Error occured when adding file", {
          position: "bottom-right",
          autoClose: 10000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    }
  };
  const addUserToDatabase = async (username) => {
    try {
      // Perform the necessary API call to add the user to the database

      const response = await fetch(
        "http://13.68.177.51:8087/chatservice/api/addUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: username }),
        }
      );

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
        regexp.test(member.secondaryUser)
      );
      setSearchedInMembersList(filteredMember);
    } else {
      setSearchedInMembersList(messagedMembersList);
    }

    console.log("searchedInMembersList", searchedInMembersList);
  };

  const handleCreateNewChat = (name) => {
    const isAlreadyMember = searchedInMembersList
      ? searchedInMembersList.filter((member) => member.secondaryUser === name)
      : [];
    if (isAlreadyMember.length === 0) {
      handleGetChatHistory({ senderName: name }, "load", 0);

      setCurrentChatMember({
        index: null,
        isNewMember: true,
        sender: {
          secondaryUser: name,
          primaryUser: userData.username,
          unreadCount: 0,
          lastMessageTimeStamp: "",
          lastMessage: "",
        },
      });
    } else {
      const index = messagedMembersList.findIndex(
        (member) => member.secondaryUser === name
      );
      onTabChange(name, index, isAlreadyMember[0]);
    }
    setPageNo(0);
    setMessages([]);
    setUserData({
      ...userData,
      searchNewUserMessage: "",
    });
    setSearchedUsers(users);
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

  const handleKeypress = (e) => {
    //it triggers by pressing the enter key
    if (e.keyCode === 13) {
      handleSendMessage();
    }
  };

  return (
    <>
      <ToastContainer />
      {userData.connected ? (
        <MDBContainer
          fluid
          // className="py-3"
          style={{ backgroundColor: "#fff", minHeight: "100vh" }}
        >
          <MDBRow>
            <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0 p-0">
              <MDBCard style={{ minHeight: "100vh" }}>
                <nav class="navbar navbar-expand-lg navbar-light bg-body-tertiary">
                  <div class="container-fluid">
                    <div
                      class="collapse navbar-collapse"
                      id="navbarSupportedContent"
                    >
                      <MDBIcon
                        className="d-flex align-self-center m-0 p-2"
                        fas
                        size="sm"
                        icon="comment-alt"
                        style={{ color: "#212529" }}
                      />
                      Chats
                    </div>
                  </div>
                </nav>
                {messagedMembersList && (
                  <div className="p-1">
                    <MDBInputGroup className="rounded p-0">
                      <input
                        className="form-control rounded search m-1"
                        placeholder="Search members"
                        type="search"
                        onChange={handleSearchMembers}
                      />
                    </MDBInputGroup>
                  </div>
                )}
                <MDBCardBody className="m-0 p-1 customScroll">
                  {messagedMembersList ? (
                    <MDBTypography listUnStyled className="mb-0">
                      {searchedInMembersList &&
                        searchedInMembersList.length > 0 && (
                          <ul className="chat-persons">
                            {searchedInMembersList?.map(
                              (
                                {
                                  secondaryUser,
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
                                      currentChatMember?.sender
                                        ?.secondaryUser === secondaryUser &&
                                      "rgb(220 226 236)",
                                    color:
                                      currentChatMember?.sender
                                        ?.secondaryUser === secondaryUser &&
                                      "#000",
                                    borderRadius:
                                      currentChatMember?.sender
                                        ?.secondaryUser === secondaryUser &&
                                      "0.5rem",
                                  }}
                                  onClick={() => {
                                    onTabChange(
                                      secondaryUser,
                                      index,
                                      searchedInMembersList[index]
                                    );
                                  }}
                                >
                                  <div className="d-flex justify-content-between">
                                    <div className="d-flex flex-row">
                                      {
                                        <img
                                          src={profile}
                                          alt="avatar"
                                          // className="d-flex align-self-center me-3 shadow-1-strong"
                                          className="rounded-4 shadow-4"
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                          }}
                                        />
                                      }

                                      <div className="pt-1 ms-3">
                                        <p className="fw-bold mb-0">
                                          {secondaryUser}
                                        </p>
                                        <p className="small text-muted">
                                          {lastMessage?.slice(0, 10) + "..."}
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
                                        currentChatMember?.sender
                                          ?.secondaryUser !== secondaryUser && (
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
                  <MDBInputGroup className="rounded p-1">
                    <input
                      className="form-control rounded searchByMessage m-1"
                      placeholder="Search Message"
                      type="search"
                      onChange={() => {}}
                    />
                  </MDBInputGroup>
                  {messagedMembersList && (
                    <div className="d-flex">
                      <div className="chatMembers">
                        <h6>At Work ({searchedInMembersList.length})</h6>
                        {searchedInMembersList && (
                          <ListGroup as="ol" className="mt-2">
                            {searchedInMembersList?.map(
                              (
                                {
                                  secondaryUser,
                                  unreadCount,
                                  lastMessage,
                                  lastMessageTimeStamp,
                                },
                                index
                              ) => (
                                <ListGroup.Item
                                  as="li"
                                  key={secondaryUser}
                                  className={`d-flex justify-content-between align-items-start ${
                                    currentChatMember?.sender?.secondaryUser ===
                                      secondaryUser && "active"
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      onTabChange(
                                        secondaryUser,
                                        index,
                                        searchedInMembersList[index]
                                      );
                                    }}
                                    className="d-flex flex-row"
                                    style={{ width: "100%" }}
                                  >
                                    {
                                      <img
                                        src={profile}
                                        alt="avatar"
                                        // className="d-flex align-self-center me-3 shadow-1-strong"
                                        className="rounded-4 shadow-4"
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                        }}
                                      />
                                    }
                                    <div className="ms-3">
                                      <div className="fw-bold d-block">
                                        {secondaryUser}
                                      </div>

                                      <p className="small text-muted mb-1 d-block">
                                        {lastMessage}
                                      </p>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              )
                            )}
                          </ListGroup>
                        )}
                      </div>
                      <div className="chatMembers">
                        <h6>Away ({searchedInMembersList.length})</h6>
                        {searchedInMembersList && (
                          <ListGroup as="ol" className="mt-2">
                            {searchedInMembersList?.map(
                              (
                                {
                                  secondaryUser,
                                  firstName,
                                  lastName,
                                  unreadCount,
                                  lastMessage,
                                  lastMessageTimeStamp,
                                },
                                index
                              ) => (
                                <ListGroup.Item
                                  as="li"
                                  key={secondaryUser}
                                  className={`d-flex justify-content-between align-items-start ${
                                    currentChatMember?.sender?.secondaryUser ===
                                      secondaryUser && "active"
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      onTabChange(
                                        secondaryUser,
                                        index,
                                        searchedInMembersList[index]
                                      );
                                    }}
                                    className="d-flex flex-row"
                                    style={{ width: "100%" }}
                                  >
                                    {
                                      <img
                                        src={profile}
                                        alt="avatar"
                                        // className="d-flex align-self-center me-3 shadow-1-strong"
                                        className="rounded-4 shadow-4"
                                        style={{
                                          width: "50px",
                                          height: "50px",
                                        }}
                                      />
                                    }
                                    <div className="ms-3">
                                      <div className="fw-bold d-block">
                                        {secondaryUser}
                                      </div>

                                      <p className="small text-muted mb-1 d-block">
                                        {lastMessage}
                                      </p>
                                    </div>
                                  </div>
                                </ListGroup.Item>
                              )
                            )}
                          </ListGroup>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </MDBCol>
            )}
            {currentChatMember && (
              <MDBCol md="6" lg="6" xl="6" className="p-0">
                <MDBCard style={{ minHeight: "100vh" }}>
                  <div className="d-flex flex-row border-bottom p-0">
                    <MDBInputGroup className="rounded p-0">
                      <input
                        className="form-control rounded search m-1"
                        placeholder="Search Messages"
                        type="search"
                        onChange={() => {}}
                      />
                    </MDBInputGroup>
                  </div>

                  <div className="d-flex flex-row border rounded-2 p-1">
                    {
                      <img
                        src={chatProfile}
                        alt="avatar"
                        // className="d-flex align-self-center me-3 shadow-1-strong float-start"
                        className="rounded-4 shadow-4"
                        style={{ width: "55px", height: "55px" }}
                      />
                    }

                    <div
                      className="ms-3 pt-2 float-start"
                      style={{ width: "90%" }}
                    >
                      <p className="fw-bold mb-0">
                        {currentChatMember?.sender?.secondaryUser}
                      </p>
                      <p className="small text-muted m-0">
                        <span className="text-muted float-start m-0 p-0">
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
                        Available
                      </p>
                    </div>
                    <div className="float-end mt-4">
                      <MDBIcon
                        className="d-flex align-self-center mt-1 me-2 float-end"
                        fas
                        size="lg"
                        icon="square-xmark"
                        style={{ color: "#212529", cursor: "pointer" }}
                        onClick={() => setCurrentChatMember(null)}
                      />
                    </div>
                  </div>

                  {fileModal ? (
                    <MDBCardBody className="mt-1 border">
                      <div className="mt-2 p-2 text-center">
                        <MDBIcon
                          className="d-flex align-self-center mt-3 me-3 float-end"
                          fas
                          size="lg"
                          icon="close"
                          style={{ color: "#3b71ca", cursor: "pointer" }}
                          onClick={handleFileModalClose}
                        />
                        <p className="fw-bold mb-0">Attachment</p>
                        <div className="pt-2">
                          {!imgExtensions.exec(userData.fileName) ? (
                            <>
                              <MDBIcon
                                className="mt-3 me-3"
                                fas
                                size="10x"
                                icon="file-lines"
                                style={{ color: "#3b71ca" }}
                              />
                              <p>{userData.fileName}</p>
                            </>
                          ) : (
                            <>
                              <img
                                src={userData.fileUrl}
                                height={300}
                                width={300}
                                alt={userData.fileName}
                              />
                              <p>{userData.fileName}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </MDBCardBody>
                  ) : (
                    <MDBCardBody
                      className="customScroll border rounded-2"
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
                                  {chat.receiverName !==
                                    currentChatMember.sender?.secondaryUser && (
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
                                                size="lg"
                                                icon="file-lines"
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
                                  )}{" "}
                                  {chat.receiverName ===
                                    currentChatMember.sender?.secondaryUser && (
                                    <li
                                      className="d-flex flex-row justify-content-end"
                                      key={index}
                                    >
                                      <div>
                                        <p className="small p-2 me-3 mb-1 text-white bg-info bg-gradient bubble-right">
                                          {chat.message}
                                          {chat.fileUrl && (
                                            <a
                                              className="download-link"
                                              href={chat.fileUrl}
                                            >
                                              <MDBIcon
                                                fas
                                                size="lg"
                                                icon="file-lines"
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
                  <form className="border rounded-2">
                    <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-1 mb-3 ms-3">
                      <label className="me-3" htmlFor="fileAdd">
                        <MDBIcon
                          fas
                          icon="link"
                          style={{ color: "#212529", cursor: "pointer" }}
                        />
                      </label>
                      <input
                        type={"file"}
                        onChange={handleFile}
                        id="fileAdd"
                        style={{ display: "none" }}
                        className="ms-1 text-muted"
                      />
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="exampleFormControlInput2"
                        placeholder="Type message"
                        value={userData.message}
                        onChange={handleMessage}
                        onKeyPress={handleKeypress}
                      />

                      {/* <label for="image">
                          <input type="file" name="image" id="image" style={{display: 'none'}}
                                    onChange={handleFile}/>
                          <img src={profile} width={20}/>
                      </label> */}
                      <button
                        onClick={handleSendMessage}
                        // ref={node => (this.btn = node)}
                        type="submit"
                        style={{ border: "none", background: "white" }}
                        className="ms-3"
                      >
                        <MDBIcon
                          fas
                          icon="paper-plane"
                          style={{ color: "#212529", cursor: "pointer" }}
                        />
                      </button>

                      {/* <a className="ms-3" onClick={handleSendMessage}>
                        <MDBIcon
                          fas
                          icon="paper-plane"
                          style={{ color: "#3b71ca", cursor: "pointer" }}
                        />
                      </a> */}
                    </div>
                  </form>
                </MDBCard>
              </MDBCol>
            )}

            <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0 p-0">
              <MDBCard style={{ minHeight: "100vh" }}>
                <nav class="navbar navbar-expand-lg navbar-light bg-body-tertiary">
                  <div class="container-fluid">
                    <div
                      class="collapse navbar-collapse"
                      id="navbarSupportedContent"
                    >
                      {"Team Members:"}
                      {/* <span className="badge bg-danger">{users.length}</span> */}
                      <MDBBadge className="ms-2 bg-secondary">
                        {users.length}
                      </MDBBadge>
                    </div>
                    <div class="d-flex align-items-center">
                      <div class="dropdown">
                        {/* <a
                          data-mdb-dropdown-init
                          class="text-reset me-3 dropdown-toggle hidden-arrow"
                          href="#"
                          id="navbarDropdownMenuLink"
                          role="button"
                          aria-expanded="false"
                        >
                          <i size="lg" class="fas fa-bell"></i>
                          <span class="badge rounded-pill badge-notification bg-danger">
                            1
                          </span>
                        </a> */}
                        <a className="mx-3" href="#!">
                          <MDBIcon
                            fas
                            icon="bell"
                            size="lg"
                            style={{ color: "#212529" }}
                          />
                          <MDBBadge color="danger" notification pill>
                            1
                          </MDBBadge>
                        </a>
                        <ul
                          class="dropdown-menu dropdown-menu-end"
                          aria-labelledby="navbarDropdownMenuLink"
                        >
                          <li>
                            <a class="dropdown-item" href="#">
                              Some news
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#">
                              Another news
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#">
                              Something else here
                            </a>
                          </li>
                        </ul>
                      </div>
                      {/* <div class="dropdown"> */}
                      {/* <a
                          data-mdb-dropdown-init
                          class="dropdown-toggle d-flex align-items-center hidden-arrow"
                          href="#"
                          id="navbarDropdownMenuAvatar"
                          role="button"
                          aria-expanded="false"
                        >
                          <img
                            src="https://mdbcdn.b-cdn.net/img/new/avatars/2.webp"
                            class="rounded-circle"
                            height="25"
                            alt="Black and White Portrait of a Man"
                            loading="lazy"
                          />
                        </a> */}

                      <MDBDropdown>
                        <MDBDropdownToggle
                          tag="a"
                          className="hidden-arrow"
                          style={{ cursor: "pointer" }}
                        >
                          {/* <a
                          data-mdb-dropdown-init
                          class="mx-2 dropdown-toggle d-flex align-items-center hidden-arrow"
                          href="#"
                          id="navbarDropdownMenuAvatar"
                          role="button"
                          aria-expanded="false"
                        > */}
                          <MDBIcon
                            fas
                            icon="circle-user"
                            size="lg"
                            style={{ color: "#212529" }}
                          />
                          {/* </a> */}
                        </MDBDropdownToggle>
                        <MDBDropdownMenu responsive="lg-end">
                          <MDBDropdownItem link>
                            Welcome {userData.username}
                          </MDBDropdownItem>
                          <MDBDropdownItem link>Settings</MDBDropdownItem>
                          {/* <MDBDropdownItem link>Something else here</MDBDropdownItem> */}
                        </MDBDropdownMenu>
                      </MDBDropdown>
                      {/* <ul
                          class="dropdown-menu dropdown-menu-end"
                          aria-labelledby="navbarDropdownMenuAvatar"
                        >
                          <li>
                            <a class="dropdown-item" href="#">
                              My profile
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#">
                              Settings
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#">
                              Logout
                            </a>
                          </li>
                        </ul> */}
                    </div>
                  </div>
                  {/* </div> */}
                </nav>

                <div className="p-2">
                  {/* <h6 className="mb-2">
                    {"Team Members:"}
                    <MDBBadge className="ms-2 bg-secondary">{users.length}</MDBBadge>
                  </h6> */}
                  <MDBInputGroup className="rounded">
                    <input
                      className="form-control rounded search m-0"
                      placeholder="Search a new user"
                      type="search"
                      value={userData.searchNewUserMessage}
                      onChange={handleSearchUser}
                    />
                  </MDBInputGroup>
                </div>
                <MDBCardBody className="m-0 p-1 customScroll">
                  {searchedUsers && (
                    <MDBTypography listUnStyled className="mb-0">
                      <ul className="chat-persons">
                        {searchedUsers?.map((user, index) => (
                          <li className="p-2" key={index}>
                            <div
                              className="d-flex justify-content-between"
                              onClick={() => {
                                handleCreateNewChat(user.userName);
                              }}
                            >
                              <div className="d-flex flex-row">
                                {
                                  <div className="d-inline-flex position-relative">
                                    <MDBBadge className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
                                      <span className="visually-hidden">
                                        New alerts
                                      </span>
                                    </MDBBadge>
                                    <img
                                      src={profile}
                                      alt="avatar"
                                      // className="d-flex align-self-center me-3 shadow-1-strong"
                                      className="rounded-4 shadow-4"
                                      style={{ width: "50px", height: "50px" }}
                                    />
                                  </div>
                                }
                                <div className="pt-1 ms-3">
                                  <p className="fw-bold mb-0">
                                    {user.firstName} {user.lastName}
                                    {/* <sup>
                                      <MDBIcon
                                        fas
                                        size="xs"
                                        icon="circle"
                                        className="ms-1"
                                        style={{
                                          color: "#53c44d",
                                          marginRight: "0.5rem",
                                        }}
                                      />
                                    </sup> */}
                                  </p>
                                  <p className="small text-muted">
                                    {user?.role[0]}
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
          <button
            className="connect-button"
            type="button"
            onClick={registerUser}
          >
            connect
          </button>
        </div>
      )}
    </>
  );
}
