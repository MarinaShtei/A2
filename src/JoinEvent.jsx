import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { App as RealmApp, Credentials } from "realm-web";

// initialize the realm app with the application id for authentication
const app = new RealmApp({ id: "application-0-rbrbg" });

const JoinEvent = () => {
  // state management for messages and the content of the new message being composed
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  // retrieve the current event name and logged-in username from local storage
  const eventName = localStorage.getItem('currentEventName');
  const username = localStorage.getItem('loggedInUsername');

  useEffect(() => {
    // fetch messages when the component mounts or the event name changes
    fetchMessages();
  }, [eventName]);

  const fetchMessages = async () => {
    if (!eventName) {
      // if no event name is found in local storage, log an error and redirect to events list
      console.error("no event name found in local storage");
      route('/events'); // redirect to events list if event name is not found
      return;
    }

    try {
      // log in anonymously to mongodb realm for accessing the database
      const user = await app.logIn(Credentials.anonymous());
      const mongodb = user.mongoClient("mongodb-atlas");
      const messagesCollection = mongodb.db("webProject").collection("messages");

      // fetch messages related to the current event and sort them by timestamp
      const relatedMessages = await messagesCollection.find({ eventName });
      setMessages(relatedMessages.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      // log an error message if fetching messages fails
      console.error("failed to fetch messages:", error);
    }
  };

  const sendMessage = async () => {
    if (messageContent.trim() === '') return; // prevent sending empty messages

    try {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const messagesCollection = mongodb.db("webProject").collection("messages");

      // insert a new message into the messages collection with the current timestamp
      await messagesCollection.insertOne({
        eventName,
        sender: username,
        text: messageContent,
        timestamp: new Date()
      });

      // clear the message input field and refresh the list of messages
      setMessageContent('');
      fetchMessages();
    } catch (error) {
      // log an error message if sending the message fails
      console.error("failed to send message:", error);
    }
  };

  const leaveEvent = () => {
    // navigate back to the events list page
    route('/events');
  };

  return (
    <div class="container mx-auto p-6 bg-gray-100">
      <h2 class="text-xl font-semibold mb-4">Messages for {eventName}</h2>
      <div class="mb-4 h-96 overflow-y-scroll">
        {messages.map((msg, index) => (
          <div key={index} class={`p-3 rounded-lg m-2 ${msg.sender === username ? 'bg-blue-200' : 'bg-green-200'} max-w-xs`}>
            <div class="text-sm mb-1 font-semibold">{msg.sender}</div>
            <div class="text-md">{msg.text}</div>
          </div>
        ))}
      </div>
      <textarea
        class="border rounded w-full p-2"
        placeholder="Type your message here..."
        value={messageContent}
        onInput={(e) => setMessageContent(e.target.value)}
      />
      <div class="flex justify-between mt-2">
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={sendMessage}>
          Send
        </button>
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={leaveEvent}>
          Leave Event
        </button>
      </div>
    </div>
  );
};

export default JoinEvent;
