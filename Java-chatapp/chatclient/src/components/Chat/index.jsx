import React, { useEffect, useState, useRef } from "react";
import { over } from "stompjs";
import Badge from "react-bootstrap/Badge";
import TimeAgo from "react-timeago";
import ListGroup from "react-bootstrap/ListGroup";
import Form from "react-bootstrap/Form";
import SockJS from "sockjs-client";
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
} from "mdb-react-ui-kit";

var stompClient = null;
export default function App() {
  const [privateChats, setPrivateChats] = useState([]);
  const messagesEndRef = useRef(null);
  const [pageNo, setPageNo] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchNewUser, setSearchNewUser] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [messagedMembersList, setMessagedMembersList] = useState([]);
  const [searchedInMembersList, setSearchedInMembersList] = useState([]);
  const [currentChatMember, setCurrentChatMember] = useState(null);
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [isLastPage, setIsLastPage] = useState();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [message]);
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
        messageStatus: "DELIVERED",
        fileUrl:
          "https://cogentaifiles.blob.core.windows.net/congetaiocrpdf/c5963be9-bc6a-401f-ad50-a6efd05fb9c5profile.jpeg?sv=2022-11-02&se=2026-10-14T17%3A52%3A30Z&sr=b&sp=r&sig=YFgS16mwwiswUWlx0v5jl3SNelkP5rX3v1hSrmSabOQ%3D",
        date: getCurrentTimestamp(),
        status: "MESSAGE",
      };

      setPrivateChats([...privateChats, chatMessage]);

      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));

      setMessages([...privateChats, chatMessage]);
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
        data.splice(currentChatMember.index, 1);
        data.unshift(currentChatMember.sender);

        setSearchedInMembersList(data);
      }
    } else {
      connect();
      sendPrivateValue();
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
      if (status === "load") {
        setPrivateChats(privateMessages);
        setMessages(privateMessages);
      } else {
        setPrivateChats([...privateMessages, ...privateChats]);
        setMessages([...privateMessages, ...privateChats]);
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
    setCurrentChatMember({ index, sender, isNewMember: false });
    const data = [...searchedInMembersList];
    data[index].unreadCount = 0;
    setSearchedInMembersList(data);

    handleGetChatHistory(sender, "load");
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
    const isAlreadyMember = searchedInMembersList.filter(
      (member) => member.senderName === name
    );
    if (isAlreadyMember.length === 0) {
      handleGetChatHistory(name);
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

    setSearchNewUser("");
    setSearchedUsers(null);
  };
  const handleChatScroll = (e) => {
    if (e.target.scrollTop === 0 && !isLastPage) {
      setLoading(true);
      setPageNo(pageNo + 1);
    }
  };
  useEffect(() => {
    // Fetch the list of users
    if (pageNo > 0) {
      handleGetChatHistory(currentChatMember.sender, "add");
    }
  }, [pageNo]);

  return (
    <>
      {userData.connected ? (
        <MDBContainer
          fluid
          className="py-3"
          style={{ backgroundColor: "#CDC4F9" }}
        >
          <MDBRow>
            <MDBCol md="12">
              <MDBCard
                id="chat3"
                style={{ borderRadius: "15px", backgroundColor: "#eee" }}
              >
                <MDBCardBody>
                  <MDBRow>
                    <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0">
                      <h5 className="font-weight-bold mb-3 text-center">
                        {"Messages "}
                        <span className="badge bg-danger">
                          {messagedMembersList.length}
                        </span>
                      </h5>

                      <MDBCard>
                        <MDBCardBody>
                          {messagedMembersList ? (
                            <>
                              <div className="p-3">
                                <MDBInputGroup className="rounded mb-3">
                                  <input
                                    className="form-control rounded"
                                    placeholder="Search Users"
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

                              <MDBTypography
                                listUnStyled
                                className="mb-0"
                                style={{
                                  position: "relative",
                                  height: "430px",
                                  overflowX: "hidden",
                                  overflowY: "auto",
                                }}
                              >
                                {searchedInMembersList && (
                                  <ul>
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
                                          style={{ backgroundColor: "#eee" }}
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
                                                src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-8.webp"
                                                alt="avatar"
                                                className="rounded-circle d-flex align-self-center me-3 shadow-1-strong"
                                                width="60"
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
                            </>
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
                                          currentChatMember?.sender
                                            ?.senderName === senderName &&
                                          "active"
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
                      </MDBCol>
                    )}
                    {currentChatMember && (
                      <MDBCol md="6" lg="6" xl="6">
                        <div className="chatHeader">
                          <div className="chatProfileImage">
                            <img
                              src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-5.webp"
                              alt="chat-header"
                              className="img-thumbnail chatProfile"
                            />
                          </div>
                          <div>
                            <h3>{currentChatMember?.sender?.senderName}</h3>
                            <p>{"Online"}</p>
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              position: "relative",
                              height: "380px",
                              overflowX: "hidden",
                              overflowY: "auto",
                            }}
                            onScroll={handleChatScroll}
                          >
                            <MDBTypography listUnStyled>
                                <ul>
                                  {loading && <span>Loading</span>}
                                  {message?.map((chat, index) => (
                                    <>
                                      {chat.senderName === userData.username ? (
                                        <li
                                          className="d-flex flex-row justify-content-start"
                                          key={index}
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
                                            <p className="small ms-3 mb-3 rounded-3 text-muted float-end">
                                              12:00 PM | Aug 13
                                            </p>
                                          </div>
                                        </li>
                                      ) : (
                                        // <li
                                        //   className="d-flex justify-content-between mb-4"
                                        //   key={index}
                                        // >
                                        //   <img
                                        //     src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp"
                                        //     alt="avatar"
                                        //     className="rounded-circle d-flex align-self-start me-3 shadow-1-strong"
                                        //     width="60"
                                        //   />
                                        //   <MDBCard className="w-100">
                                        //     <MDBCardHeader className="d-flex justify-content-between p-3">
                                        //       <p className="fw-bold mb-0">
                                        //         Brad Pitt
                                        //       </p>
                                        //       <p className="text-muted small mb-0">
                                        //         <MDBIcon far icon="clock" /> 12:00
                                        //         PM | Aug 13
                                        //       </p>
                                        //     </MDBCardHeader>
                                        //     <MDBCardBody>
                                        //       <p className="mb-0">
                                        //         {chat.message}
                                        //       </p>
                                        //     </MDBCardBody>
                                        //   </MDBCard>
                                        // </li>
                                        <li
                                          className="d-flex flex-row justify-content-end"
                                          key={index}
                                        >
                                          <div>
                                            <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                                              {chat.message}
                                            </p>
                                            <p className="small me-3 mb-3 rounded-3 text-muted">
                                              12:00 PM | Aug 13
                                            </p>
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
                                        // <li
                                        //   class="d-flex justify-content-between mb-4"
                                        //   key={index}
                                        // >
                                        //   <MDBCard className="w-100">
                                        //     <MDBCardHeader className="d-flex justify-content-between p-3">
                                        //       <p class="fw-bold mb-0">
                                        //         Lara Croft
                                        //       </p>
                                        //       <p class="text-muted small mb-0">
                                        //         <MDBIcon far icon="clock" /> 2
                                        //         mins ago
                                        //       </p>
                                        //     </MDBCardHeader>
                                        //     <MDBCardBody>
                                        //       <p className="mb-0">
                                        //         {chat.message}
                                        //       </p>
                                        //     </MDBCardBody>
                                        //   </MDBCard>
                                        //   <img
                                        //     src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-5.webp"
                                        //     alt="avatar"
                                        //     className="rounded-circle d-flex align-self-start ms-3 shadow-1-strong"
                                        //     width="60"
                                        //   />
                                        // </li>
                                      )}
                                    </>
                                  ))}
                                </ul>

                              <div ref={messagesEndRef} />
                            </MDBTypography>
                          </div>
                          <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                            {/* <img
                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                      alt="avatar 3"
                      style={{ width: "40px", height: "100%" }}
                    /> */}
                            {/* <img
                          src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-6.webp"
                          alt="avatar"
                          className="rounded-circle"
                          style={{ width: "40px", height: "100%" }}
                          // width="60"
                        /> */}
                            <MDBTextArea
                              label="Message"
                              id="textAreaExample"
                              rows={4}
                              value={userData.message}
                              onChange={handleMessage}
                            />
                            <a className="ms-1 text-muted" href="#!">
                              <MDBIcon fas icon="paperclip" />
                            </a>
                            <a className="ms-3 text-muted" href="#!">
                              <MDBIcon fas icon="smile" />
                            </a>
                            <a className="ms-3" href="#!">
                              <MDBIcon
                                fas
                                icon="paper-plane"
                                onClick={sendPrivateValue}
                              />
                            </a>
                          </div>
                        </div>
                      </MDBCol>
                    )}

                    <MDBCol md="3" lg="3" xl="3" className="mb-4 mb-md-0">
                      <h5 className="font-weight-bold mb-3 text-center">
                        Welcome {userData.username}
                      </h5>

                      <MDBCard>
                        <MDBCardBody
                          style={{
                            height: "560px",
                          }}
                        >
                          <div className="p-3">
                            <MDBInputGroup className="rounded mb-3">
                              <input
                                className="form-control rounded"
                                placeholder="Search a new user"
                                type="search"
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
                          {searchedUsers && searchNewUser && (
                            <MDBTypography
                              listUnStyled
                              className="mb-0"
                              style={{
                                position: "relative",
                                height: "430px",
                                overflowX: "hidden",
                                overflowY: "auto",
                              }}
                            >
                              <ul>
                                {searchedUsers?.map((name, index) => (
                                  <li
                                    className="p-2 border-bottom"
                                    style={{ backgroundColor: "#eee" }}
                                    key={index}
                                  >
                                    <div
                                      className="d-flex justify-content-between"
                                      onClick={() => {
                                        handleCreateNewChat(name);
                                      }}
                                    >
                                      <div className="d-flex flex-row">
                                        <img
                                          src="https://mdbcdn.b-cdn.net/img/Photos/Avatars/avatar-8.webp"
                                          alt="avatar"
                                          className="rounded-circle d-flex align-self-center me-3 shadow-1-strong"
                                          width="60"
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
