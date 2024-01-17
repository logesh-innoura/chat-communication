import React, { useEffect, useState } from 'react'
import { over } from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient = null;
const ChatRoom = () => {
    const [privateChats, setPrivateChats] = useState([]);
    const [message, setMessages] = useState([]);
    const [publicChats, setPublicChats] = useState([]);
    const [memberList, setMemberList] = useState([]);
    const [tab, setTab] = useState("CHATROOM");


    const [userData, setUserData] = useState({
        username: '',
        receivername: '',
        connected: false,
        message: ''
    });
    

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

            const response = await fetch('http://localhost:8080/api/users', {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant' : 'default',
                        'Authorization' : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSIsImtpZCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSJ9.eyJhdWQiOiJhcGk6Ly9mOTJkZGIwNS1iNzVjLTQ0NTktOTEwZi03M2M1OGQ3NWY1ZjUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9iNGQzNGU0Mi03OWE2LTQ3OGUtYjNhZi0xMmNlNzMxMWZhMDkvIiwiaWF0IjoxNzA1MzAyNzEwLCJuYmYiOjE3MDUzMDI3MTAsImV4cCI6MTcwNTMwODExNiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhWQUFBQWVVTmVGZG5OaWtPc0ZRbzlTK3RTSlc1THpjcTljVEtrSm5uU3F1NHBRUHdjNlF0NUw3YjdWNVY5TlFvUUxDVUYiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiZjkyZGRiMDUtYjc1Yy00NDU5LTkxMGYtNzNjNThkNzVmNWY1IiwiYXBwaWRhY3IiOiIxIiwiaXBhZGRyIjoiMjcuNC4xNDEuMjgiLCJsb2dpbl9oaW50IjoiTy5DaVEzWVRFeE5XRXpaUzAxTkRVeUxUUXhOemt0T0RjNE5DMWpaRGN6TWpReFpUTXlaV01TSkdJMFpETTBaVFF5TFRjNVlUWXRORGM0WlMxaU0yRm1MVEV5WTJVM016RXhabUV3T1JvbmJHOW5aWE5vTURGQVpXNWphWEJvWlhKb1pXRnNkR2d1YjI1dGFXTnliM052Wm5RdVkyOXRJQ0E9IiwibmFtZSI6ImxvZ2VzaCIsIm9pZCI6IjdhMTE1YTNlLTU0NTItNDE3OS04Nzg0LWNkNzMyNDFlMzJlYyIsInByZWZlcnJlZF91c2VybmFtZSI6ImxvZ2VzaDAxQGVuY2lwaGVyaGVhbHRoLm9ubWljcm9zb2Z0LmNvbSIsInJoIjoiMC5BYmNBUWs3VHRLWjVqa2V6cnhMT2N4SDZDUVhiTGZsY3QxbEVrUTl6eFkxMTlmWEpBSDguIiwicm9sZXMiOlsiQURNSU4iXSwic2NwIjoiZW5jaXBoZXJoZWFsdGgtbXVsdGl0ZW5hbnQuc2NvcGUiLCJzaWQiOiIxMzg0YWEyMC04ZDg0LTRkZjUtODYzYy05MWJiZWVmNDUwOTUiLCJzdWIiOiJ0eTNGa3VjRDlnbEVDeFVfWW82MFRhUWVxU29ybG5yYjM2MVRPcWxlc1RNIiwidGVuYW50X2N0cnkiOiJVUyIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJOQSIsInRpZCI6ImI0ZDM0ZTQyLTc5YTYtNDc4ZS1iM2FmLTEyY2U3MzExZmEwOSIsInVuaXF1ZV9uYW1lIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXBuIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXRpIjoiRks0M2g4N0JkMGFwZUcyTW83eDhBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il19.VGRvLuKUIo4x0GgXOVdRZcyUZ8aBt-mOoYc_8663mpieeHrHme62CMljU8N5zP0Uc1rmPwJ1hDRAfAsXBqS4zbL9xQ0eylRyhl5iXY6iTxM2aFubRIjVbrqS5XQAP4I5Y_DRvR3QrSKCt2CKlCy3ph0IOm2fVWEMQoyZIXr95VRSZwhulpEH6c4ShO8A2dfnax2IjXkyqsePErs9LC4hEjus4vjoifmLnPgxeScNheWFm56b04TmnYmsdmNPzCVMvXqd3_onTZyJ315ef8H0GnZ0qC8US3aO7sG3xVwopu_feQUK2EtElOp0oCCIjBoWST4HnvCvu2mk8fT6mXgr6A"
                    },
            });
            const data = await response.json();

            const temp = [];
            data.forEach(item => {
                temp.push(item.name);
            });
            setMemberList(temp);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };


    useEffect(() => {
        fetchUsers();
    }, []);


    useEffect(() => {
        if(tab !== 'CHATROOM') onTabChange(tab);
    }, [privateChats]);


    const connect = () => {

        let Sock = new SockJS('http://localhost:8080/ws', {
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant' : 'default',
                'Authorization' : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSIsImtpZCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSJ9.eyJhdWQiOiJhcGk6Ly9mOTJkZGIwNS1iNzVjLTQ0NTktOTEwZi03M2M1OGQ3NWY1ZjUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9iNGQzNGU0Mi03OWE2LTQ3OGUtYjNhZi0xMmNlNzMxMWZhMDkvIiwiaWF0IjoxNzA1MzAyNzEwLCJuYmYiOjE3MDUzMDI3MTAsImV4cCI6MTcwNTMwODExNiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhWQUFBQWVVTmVGZG5OaWtPc0ZRbzlTK3RTSlc1THpjcTljVEtrSm5uU3F1NHBRUHdjNlF0NUw3YjdWNVY5TlFvUUxDVUYiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiZjkyZGRiMDUtYjc1Yy00NDU5LTkxMGYtNzNjNThkNzVmNWY1IiwiYXBwaWRhY3IiOiIxIiwiaXBhZGRyIjoiMjcuNC4xNDEuMjgiLCJsb2dpbl9oaW50IjoiTy5DaVEzWVRFeE5XRXpaUzAxTkRVeUxUUXhOemt0T0RjNE5DMWpaRGN6TWpReFpUTXlaV01TSkdJMFpETTBaVFF5TFRjNVlUWXRORGM0WlMxaU0yRm1MVEV5WTJVM016RXhabUV3T1JvbmJHOW5aWE5vTURGQVpXNWphWEJvWlhKb1pXRnNkR2d1YjI1dGFXTnliM052Wm5RdVkyOXRJQ0E9IiwibmFtZSI6ImxvZ2VzaCIsIm9pZCI6IjdhMTE1YTNlLTU0NTItNDE3OS04Nzg0LWNkNzMyNDFlMzJlYyIsInByZWZlcnJlZF91c2VybmFtZSI6ImxvZ2VzaDAxQGVuY2lwaGVyaGVhbHRoLm9ubWljcm9zb2Z0LmNvbSIsInJoIjoiMC5BYmNBUWs3VHRLWjVqa2V6cnhMT2N4SDZDUVhiTGZsY3QxbEVrUTl6eFkxMTlmWEpBSDguIiwicm9sZXMiOlsiQURNSU4iXSwic2NwIjoiZW5jaXBoZXJoZWFsdGgtbXVsdGl0ZW5hbnQuc2NvcGUiLCJzaWQiOiIxMzg0YWEyMC04ZDg0LTRkZjUtODYzYy05MWJiZWVmNDUwOTUiLCJzdWIiOiJ0eTNGa3VjRDlnbEVDeFVfWW82MFRhUWVxU29ybG5yYjM2MVRPcWxlc1RNIiwidGVuYW50X2N0cnkiOiJVUyIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJOQSIsInRpZCI6ImI0ZDM0ZTQyLTc5YTYtNDc4ZS1iM2FmLTEyY2U3MzExZmEwOSIsInVuaXF1ZV9uYW1lIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXBuIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXRpIjoiRks0M2g4N0JkMGFwZUcyTW83eDhBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il19.VGRvLuKUIo4x0GgXOVdRZcyUZ8aBt-mOoYc_8663mpieeHrHme62CMljU8N5zP0Uc1rmPwJ1hDRAfAsXBqS4zbL9xQ0eylRyhl5iXY6iTxM2aFubRIjVbrqS5XQAP4I5Y_DRvR3QrSKCt2CKlCy3ph0IOm2fVWEMQoyZIXr95VRSZwhulpEH6c4ShO8A2dfnax2IjXkyqsePErs9LC4hEjus4vjoifmLnPgxeScNheWFm56b04TmnYmsdmNPzCVMvXqd3_onTZyJ315ef8H0GnZ0qC8US3aO7sG3xVwopu_feQUK2EtElOp0oCCIjBoWST4HnvCvu2mk8fT6mXgr6A"
            },
        });
        stompClient = over(Sock);
        stompClient.connect({}, onConnected, onError);
    }

    const onConnected = () => {
        
        setUserData({ ...userData, "connected": true });
        // localStorage.setItem('userData', JSON.stringify({ ...userData, "connected": true }));

        stompClient.subscribe('/chatroom/public', onMessageReceived);
        stompClient.subscribe('/user/' + userData.username + '/private', onPrivateMessage);
        stompClient.subscribe('/user/' + userData.username + '/topic', onUpdatedUsersHistory)
        // userJoin();
    }

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
      
        const formattedTime =
          `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year}, ${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes} ${hours >= 12 ? 'pm' : 'am'}`;
      
        return formattedTime;
      };

    const onMessageReceived = (payload) => {
        var payloadData = JSON.parse(payload.body);

        if (payloadData.status === "MESSAGE" && !payloadData.receiverName) {
            setPublicChats(prevPublicChats => [...prevPublicChats, payloadData]);
        }
    };



    const onPrivateMessage = (payload) => {
        const payloadData = JSON.parse(payload.body);
        setPrivateChats(temp => [...temp, payloadData]);

    };

    const onUpdatedUsersHistory = (payload) => {
        const payloadData = JSON.parse(payload.body);
        console.log(payload);

    };


    const onError = (err) => {
        console.log(err);

    }

    const handleMessage = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "message": value });
    }
    const sendValue = () => {
        if (stompClient) {
            var chatMessage = {
                senderName: userData.username,
                message: userData.message,
                date:getCurrentTimestamp(),
                status: "MESSAGE"
            };
            
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    }

    const sendPrivateValue = () => {
        if (stompClient) {
            const chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                date:getCurrentTimestamp(),
                status: "MESSAGE"
            };

            setPrivateChats([...privateChats, chatMessage]);
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
            setUserData({ ...userData, "message": "" });
        }
    }

    const handleUsername = (event) => {
        const { value } = event.target;
        setUserData({ ...userData, "username": value });
    }




    const registerUser = async () => {

        if (!userData.username.trim()) {
            alert('Username should not be empty');
            return;
        }

         fetchUsers();
        // Check if the entered username exists in the memberList
        const isUsernameExists = memberList.some(user => user === userData.username);

        if (isUsernameExists) {
            try {
                // Fetch messages for the user
                const response = await fetch(`http://localhost:8080/api/messages/${userData.username}`);
                const data = await response.json();

                // Separate messages into public and private chats
               
                const publicMessages = data.filter(message => !message.receiverName);
                const privateMessages = data.filter(message => message.receiverName);

               

                setPublicChats(publicMessages);
                setPrivateChats(privateMessages);

                // Connect to WebSocket after updating state
                connect();
            } catch (error) {
                console.error('Error fetching user messages:', error);
            }
        }else {
            try {
                // If username doesn't exist, add user to the database
                await addUserToDatabase(userData.username);
    
                // After adding user to the database, connect to WebSocket
                connect();
            } catch (error) {
                console.error('Error adding user to the database:', error);
            }
        }
    };

    const onTabChange = (name) => {
        const messages = privateChats?.filter(item => [name, userData?.username]?.includes(item.senderName) && [name, userData.username]?.includes(item.receiverName));
        setMessages(messages);
    }


    const addUserToDatabase = async (username) => {
        try {
            // Perform the necessary API call to add the user to the database
            const response = await fetch('http://localhost:8080/api/addUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant' : 'default',
                    'Authorization' : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSIsImtpZCI6IjVCM25SeHRRN2ppOGVORGMzRnkwNUtmOTdaRSJ9.eyJhdWQiOiJhcGk6Ly9mOTJkZGIwNS1iNzVjLTQ0NTktOTEwZi03M2M1OGQ3NWY1ZjUiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC9iNGQzNGU0Mi03OWE2LTQ3OGUtYjNhZi0xMmNlNzMxMWZhMDkvIiwiaWF0IjoxNzA1MzAyNzEwLCJuYmYiOjE3MDUzMDI3MTAsImV4cCI6MTcwNTMwODExNiwiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhWQUFBQWVVTmVGZG5OaWtPc0ZRbzlTK3RTSlc1THpjcTljVEtrSm5uU3F1NHBRUHdjNlF0NUw3YjdWNVY5TlFvUUxDVUYiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiZjkyZGRiMDUtYjc1Yy00NDU5LTkxMGYtNzNjNThkNzVmNWY1IiwiYXBwaWRhY3IiOiIxIiwiaXBhZGRyIjoiMjcuNC4xNDEuMjgiLCJsb2dpbl9oaW50IjoiTy5DaVEzWVRFeE5XRXpaUzAxTkRVeUxUUXhOemt0T0RjNE5DMWpaRGN6TWpReFpUTXlaV01TSkdJMFpETTBaVFF5TFRjNVlUWXRORGM0WlMxaU0yRm1MVEV5WTJVM016RXhabUV3T1JvbmJHOW5aWE5vTURGQVpXNWphWEJvWlhKb1pXRnNkR2d1YjI1dGFXTnliM052Wm5RdVkyOXRJQ0E9IiwibmFtZSI6ImxvZ2VzaCIsIm9pZCI6IjdhMTE1YTNlLTU0NTItNDE3OS04Nzg0LWNkNzMyNDFlMzJlYyIsInByZWZlcnJlZF91c2VybmFtZSI6ImxvZ2VzaDAxQGVuY2lwaGVyaGVhbHRoLm9ubWljcm9zb2Z0LmNvbSIsInJoIjoiMC5BYmNBUWs3VHRLWjVqa2V6cnhMT2N4SDZDUVhiTGZsY3QxbEVrUTl6eFkxMTlmWEpBSDguIiwicm9sZXMiOlsiQURNSU4iXSwic2NwIjoiZW5jaXBoZXJoZWFsdGgtbXVsdGl0ZW5hbnQuc2NvcGUiLCJzaWQiOiIxMzg0YWEyMC04ZDg0LTRkZjUtODYzYy05MWJiZWVmNDUwOTUiLCJzdWIiOiJ0eTNGa3VjRDlnbEVDeFVfWW82MFRhUWVxU29ybG5yYjM2MVRPcWxlc1RNIiwidGVuYW50X2N0cnkiOiJVUyIsInRlbmFudF9yZWdpb25fc2NvcGUiOiJOQSIsInRpZCI6ImI0ZDM0ZTQyLTc5YTYtNDc4ZS1iM2FmLTEyY2U3MzExZmEwOSIsInVuaXF1ZV9uYW1lIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXBuIjoibG9nZXNoMDFAZW5jaXBoZXJoZWFsdGgub25taWNyb3NvZnQuY29tIiwidXRpIjoiRks0M2g4N0JkMGFwZUcyTW83eDhBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il19.VGRvLuKUIo4x0GgXOVdRZcyUZ8aBt-mOoYc_8663mpieeHrHme62CMljU8N5zP0Uc1rmPwJ1hDRAfAsXBqS4zbL9xQ0eylRyhl5iXY6iTxM2aFubRIjVbrqS5XQAP4I5Y_DRvR3QrSKCt2CKlCy3ph0IOm2fVWEMQoyZIXr95VRSZwhulpEH6c4ShO8A2dfnax2IjXkyqsePErs9LC4hEjus4vjoifmLnPgxeScNheWFm56b04TmnYmsdmNPzCVMvXqd3_onTZyJ315ef8H0GnZ0qC8US3aO7sG3xVwopu_feQUK2EtElOp0oCCIjBoWST4HnvCvu2mk8fT6mXgr6A"
                },
                body: JSON.stringify({ name: username }),
            });
    
            // Handle the response if needed
            const result = await response.json();
           
        } catch (error) {
            throw new Error('Error adding user to the database:', error);
        }
    };

    return (
        <div className="container">
            {userData.connected ?
                <div className="chat-box">
                    <div className='current-user'>
                        <h3>Welcome back {userData.username} !</h3>
                    </div>
                    <div className="member-list">
                        <ul>
                            <li onClick={() => { setTab("CHATROOM") }} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                            {memberList?.filter(x => x !== userData?.username)?.map((name, index) => (
                                <li onClick={() => { setTab(name); onTabChange(name) }} className={`member ${tab === name && "active"}`} key={index}>{name}</li>
                            ))}
                        </ul>
                    </div>
                    {tab === "CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                        {publicChats.map((chat, index) => (
                            <li className={`message-container ${chat.senderName === userData.username ? 'self' : 'other'}`} key={index}>
                            {chat.senderName !== userData.username && <div className="avatar">{chat.senderName.charAt(0).toUpperCase()}</div>}
                            <div className="message-content">
                                <div className="message-data">{chat.message}</div>
                                <div className="timestamp">{chat.date}</div>
                            </div>
                            {chat.senderName === userData.username && <div className="avatar self">{chat.senderName.charAt(0).toUpperCase()}</div>}
                            </li>
                        ))}
                        </ul>


                        <div className="send-message">
                            <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} />
                            <button type="button" className="send-button" onClick={sendValue}>send</button>
                        </div>
                    </div>}
                    {tab !== "CHATROOM" && <div className="chat-content">
                        <ul className="chat-messages">
                            {message?.map((chat, index) => (

                               <li className={`message-container ${chat.senderName === userData.username ?"self" :"other"}`} key={index}>
                                    {chat.senderName !== userData.username && <div className="avatar">{chat.senderName.charAt(0).toUpperCase()}</div>}
                                    <div className="message-content">
                                        <div className="message-data">{chat.message}</div>
                                        <div className="timestamp">{chat.date}</div>
                                    </div>
                                    {chat.senderName === userData.username && <div className="avatar self">{chat.senderName.charAt(0).toUpperCase()}</div>}
                                </li>

                            ))}
                        </ul>

                        <div className="send-message">
                            <input type="text" className="input-message" placeholder="enter the message" value={userData.message} onChange={handleMessage} />
                            <button type="button" className="send-button" onClick={sendPrivateValue}>send</button>
                        </div>
                    </div>}
                </div>
                :
                <div className="register">
                    <input
                        id="user-name"
                        placeholder="Enter your name"
                        name="userName"
                        value={userData.username}
                        onChange={handleUsername}
                        margin="normal"
                    />
                    <button type="button" onClick={() => registerUser()}>
                        connect
                    </button>
                </div>}
        </div>
    )
}

export default ChatRoom






