import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { App as RealmApp, Credentials } from "realm-web";

// Assuming the RealmApp is initialized similarly
const app = new RealmApp({ id: "application-0-rbrbg" });

const EditEvent = () => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    const currentEventName = localStorage.getItem('currentEventName');
    console.log(currentEventName)
    if (!currentEventName) {
      console.error("No event name found in local storage");
      route('/events'); // Redirect back if event name is not found
      return;
    }

    const fetchData = async () => {
      try {
        const user = await app.logIn(Credentials.anonymous());
        const mongodb = user.mongoClient("mongodb-atlas");
        const eventsCollection = mongodb.db("webProject").collection("events");

        // Use the event name to fetch the event data
        const event = await eventsCollection.findOne({ name: currentEventName });
        if(event) {
          setEventName(event.name);
          setEventDate(event.date);
          setEventTime(event.time);
          setAttendees(event.attendees);
          setEventId(event._id);
          // Fetch all users excluding the current one
          const usersCollection = mongodb.db("webProject").collection("users");
          const users = await usersCollection.find({});
          setAllUsers(users.map(user => user.username).filter(username => username !== localStorage.getItem("loggedInUsername")));
        } else {
          console.error("Event not found");
          route('/events'); // Redirect back if event is not found
        }
      } catch (error) {
        console.error("Failed to fetch event or user data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!eventId) {
      alert('Event ID is missing.');
      return;
    }
  
    try {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const eventsCollection = mongodb.db("webProject").collection("events");
  
      await eventsCollection.updateOne(
        { _id: eventId },
        {
          $set: {
            name: eventName,
            date: eventDate,
            time: eventTime,
            attendees,
          },
        }
      );
  
      localStorage.removeItem('currentEventName'); // Cleanup after saving
      route('/events'); // Navigate back to the main page or event list
    } catch (error) {
      console.error("Failed to update the event:", error);
    }
  };
  

  const handleCancel = () => {
    localStorage.removeItem('currentEvent');
    route('/events'); // Use 'route' for navigation in preact-router
  };

  const handleAttendeeChange = (username, isSelected) => {
    if (isSelected) {
      setAttendees(prev => [...prev, username]);
    } else {
      setAttendees(prev => prev.filter(u => u !== username));
    }
  };

  return (
    <div class="container mx-auto p-6 bg-gray-100">
      <h2 class="text-xl font-semibold mb-4">Edit Event: {eventName}</h2>
      {/* Event Name Input */}
      {/* Date and Time Input */}
      {/* Attendees Selection */}
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">
          Attendees
        </label>
        {allUsers.map(username => (
          <div key={username}>
            <input
              type="checkbox"
              id={`attendee-${username}`}
              checked={attendees.includes(username)}
              onChange={(e) => handleAttendeeChange(username, e.target.checked)}
            />
            <label htmlFor={`attendee-${username}`} class="ml-2">
              {username}
            </label>
          </div>
        ))}
      </div>
      {/* Save and Cancel Buttons */}
      <div class="flex justify-end mt-4">
        <button
          onClick={handleSave}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditEvent;