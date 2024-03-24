import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { App as RealmApp, Credentials } from "realm-web";
import { route } from 'preact-router';

const app = new RealmApp({ id: "application-0-rbrbg" });


const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EventPage = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [showAttendeesSelection, setShowAttendeesSelection] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const username = localStorage.getItem("loggedInUsername");

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    async function init() {
      const user = await app.logIn(Credentials.anonymous());
      setLoggedInUser(user);
    
      // Fetch events and generate calendar days
      displayEvents(user);
      generateCalendarDays(currentYear, currentMonth);
  
      // Fetch all users excluding the current one
      const mongodb = user.mongoClient("mongodb-atlas");
      const usersCollection = mongodb.db("webProject").collection("users");
      const fetchedUsers = await usersCollection.find({});
      const filteredUsers = fetchedUsers.filter(u => u._id !== user.id); 
      setAllUsers(filteredUsers);
    }
    init();
  }, [events, currentMonth, currentYear]);

  
  const generateCalendarDays = (year, month) => {
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
  
    const calendarDays = Array.from({ length: firstDay }, () => null); 
  
    const username = localStorage.getItem('loggedInUsername');
  
    for (let day = 1; day <= numDays; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => formatDate(event.date) === fullDate);
      const isEvent = dayEvents.length > 0;
  
      // Updated logic to include check for user as organizer or attendee
      const isUserInvolved = dayEvents.some(event => 
        event.username === username || event.attendees.includes(username)
      );
  
      calendarDays.push({
        day,
        isEvent,
        isUserInvolved, // Flag to indicate if the user is involved in the event
      });
    }
  
    setCalendarDays(calendarDays);
  };
  

  const displayEvents = async (user) => {
    const mongodb = user.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const fetchedEvents = await eventsCollection.find({});
    setEvents(fetchedEvents);
  };

  const addEvent = async () => {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
  
    if (!eventName || !eventDate || !eventTime) {
      alert('All fields are required');
      return;
    }
  
    try {
        const mongodb = loggedInUser.mongoClient("mongodb-atlas");
        const eventsCollection = mongodb.db("webProject").collection("events");
        await eventsCollection.insertOne({
          name: eventName,
          date: eventDate,
          time: eventTime,
          username: localStorage.getItem('loggedInUsername'), // Organizer's username
          attendees: selectedUsers,
        });
  
      // Reset form and states,  fetch again and update events
      resetFormAndStates();
      await fetchAndUpdateEvents();
      // Generate calendar days for the current month
      generateCalendarDays(currentYear, currentMonth);
    } catch (error) {
      console.error("Error creating event:", error);
      alert('Failed to create the event. Please try again.');
    }
  };

  const updateCalendar = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const numberOfDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push({ day: null }); // Padding days
    }
    for (let day = 1; day <= numberOfDaysInMonth; day++) {
      daysArray.push({ day, isEvent: !!events.find(event => formatDate(event.date) === `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) });
    }

    setCalendarDays(daysArray);
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleMonthChange = (increment) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth + increment;
      if (newMonth < 0) {
        setCurrentYear((prevYear) => prevYear - 1);
        newMonth = 11;
      } else if (newMonth > 11) {
        setCurrentYear((prevYear) => prevYear + 1);
        newMonth = 0;
      }
      return newMonth;
    });
  };

  const handleUserSelection = (userId) => {
    // Find the username corresponding to the userId
    const user = allUsers.find(user => user._id === userId);
    if (!user) return; // exit if user not found
  
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(user.username)) {
        // If already selected, remove the username from the selection
        return prevSelected.filter(username => username !== user.username);
      } else {
        // Otherwise, add the username to the selection
        return [...prevSelected, user.username];
      }
    });
  };

  const handleDayClick = (day) => {
    if (day) {
      const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(event => formatDate(event.date) === fullDate);
      setSelectedDayEvents(dayEvents);
    }
  };

  const resetFormAndStates = () => {
    // Reset form fields
    document.getElementById('eventName').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    
    // Reset component states
    setSelectedUsers([]);
    setShowAttendeesSelection(false);
    setShowSuccessModal(true); // show a success message/modal
  };

  const fetchAndUpdateEvents = async () => {
    const mongodb = loggedInUser.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const fetchedEvents = await eventsCollection.find({});
    setEvents(fetchedEvents);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const eventsCollection = mongodb.db("webProject").collection("events");
      await eventsCollection.deleteOne({ _id: eventId });
      await fetchAndUpdateEvents(); // Refresh the events
    } catch (error) {
      console.error("Error deleting event:", error);
      alert('Failed to delete the event. Please try again.');
    }
  };

  const handleEditEvent = (eventName) => {
    localStorage.setItem('currentEventName', eventName);
    route('/edit-event'); // EditEvent page
  };

  return (
    <div class="bg-gray-100 font-sans">
      {/* Success Modal */}
      {showSuccessModal && (
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3 text-center">
              <p class="text-lg leading-6 font-medium text-gray-900">Registration was successful</p>
              <div class="mt-4">
                <button onClick={() => setShowSuccessModal(false)} class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-700 focus:outline-none">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    <header class="bg-blue-500 p-4 text-white">
    <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-3xl font-semibold">Virtual Event Platform</h1>
        <div>
        <span id="userGreeting" class="mr-4">Hello, {localStorage.getItem("loggedInUsername")}</span>
        <a href="#" onClick={logout} class="text-white">Logout</a>
        </div>
    </div>
    </header>

    <div class="container mx-auto mt-8 flex">
      <div class="flex-auto w-1/2 mr-8 bg-white shadow-lg rounded-lg">
        <div class="flex justify-between items-center p-4 border-b">
          <button onClick={() => handleMonthChange(-1)} class="px-4 py-2 bg-gray-200 rounded-md">Prev</button>
          <h2 class="text-2xl font-semibold">{`${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`}</h2>
          <button onClick={() => handleMonthChange(1)} class="px-4 py-2 bg-gray-200 rounded-md">Next</button>
        </div>
        <div class="grid grid-cols-7 gap-4 p-4">
          <div class="text-center font-semibold">Sun</div>
          <div class="text-center font-semibold">Mon</div>
          <div class="text-center font-semibold">Tue</div>
          <div class="text-center font-semibold">Wed</div>
          <div class="text-center font-semibold">Thu</div>
          <div class="text-center font-semibold">Fri</div>
          <div class="text-center font-semibold">Sat</div>
          {calendarDays.map((calendarDay, index) => (
  <div key={index} 
       className={`text-center cursor-pointer py-1 ${calendarDay && calendarDay.isEvent ? 'font-bold' : ''} ${calendarDay && calendarDay.isUserInvolved ? 'bg-red-500' : ''}`}
       onClick={() => handleDayClick(calendarDay.day)}>
    {calendarDay ? calendarDay.day : ''}
  </div>
))}
        </div>
      </div>


        {/* Event Creation Form */}
        <div class="flex-auto w-1/2 bg-white p-8 rounded-lg shadow-md">
          <h2 class="text-2xl font-semibold mb-6 text-center">Create an Event</h2>
          <form id="eventForm" class="space-y-4">
            <div>
              <label for="eventName" class="block text-sm font-medium text-gray-600">Event Name</label>
              <input type="text" id="eventName" name="eventName" class="mt-1 p-2 w-full border rounded" />
            </div>
            <div>
              <label for="eventDate" class="block text-sm font-medium text-gray-600">Event Date</label>
              <input type="date" id="eventDate" name="eventDate" class="mt-1 p-2 w-full border rounded" />
            </div>
            <div>
              <label for="eventTime" class="block text-sm font-medium text-gray-600">Event Time</label>
              <input type="time" id="eventTime" name="eventTime" class="mt-1 p-2 w-full border rounded" />
            </div>
            <label class="inline-flex items-center mt-3">
                <input type="checkbox" class="form-checkbox h-5 w-5 text-gray-600" onChange={() => setShowAttendeesSelection(!showAttendeesSelection)} />
                <span class="ml-2 text-gray-700">Add Users to Event</span>
            </label>
            {showAttendeesSelection && (
                <div id="usersSelectDiv" class="mt-4 bg-blue-500 p-4 rounded-lg">
                    <h3 class="text-white font-semibold mb-2">Select Attendees:</h3>
                    <div class="max-h-60 overflow-y-auto">
                    {allUsers.map(user => (
                        <div key={user._id} class="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id={`user-${user._id}`}
                            class="form-checkbox h-5 w-5 text-blue-700"
                            onChange={() => handleUserSelection(user._id)}
                        />
                        <label for={`user-${user._id}`} class="ml-2 text-white">{user.username}</label>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            <button type="button" onClick={addEvent} class="bg-blue-500 text-white p-2 rounded w-full">Create Event</button>
          </form>
        </div>
      </div>

        {/* Display Events for Selected Day */}
        <section id="selectedDayEvents" class="container mx-auto mt-8">
        <h2 class="text-2xl font-semibold mb-4">Events for Selected Day</h2>
        <div class="flex flex-wrap -m-4">
            {selectedDayEvents.length > 0 ? (
            selectedDayEvents.map((event, index) => (
                <div key={index} class="p-4 lg:w-1/3 md:w-1/2 w-full">
                <div class="h-full bg-white p-6 rounded-lg border border-gray-200 shadow-md">
                    <h3 class="text-lg text-gray-900 font-semibold mb-3">{event.name}</h3>
                    <p class="leading-relaxed mb-3">Time: {event.time}</p>
                    <p class="leading-relaxed text-gray-600">Organizer: {event.username}</p>
                    {/* Event details */}
                    <div class="flex justify-between mt-4">
                    {username === event.username && (
                        <>
                            <button onClick={() => handleEditEvent(event.name)} class="text-white bg-blue-500 hover:bg-blue-700 rounded-md px-4 py-2">Edit</button>
                            <button onClick={() => handleDeleteEvent(event._id)} class="text-white bg-red-500 hover:bg-red-700 rounded-md px-4 py-2">Delete</button>
                        </>
                        )}
                        {(username === event.username || event.attendees.includes(username)) && (
                        <button onClick={() => window.location.href = '/join'} class="text-white bg-green-500 hover:bg-green-700 rounded-md px-4 py-2">Join</button>
                        )}
                    </div>
                </div>
                </div>
            ))
            ) : (
            <p class="w-full bg-white p-6 rounded-lg border border-gray-200 shadow-md text-gray-600">No events for this day.</p>
            )}
        </div>
        </section>

      {/* Display Events */}
      <section id="eventList" class="container mx-auto mt-8">
        <h2 class="text-2xl font-semibold mb-4">Event List</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <li key={index} class="bg-white p-4 rounded-lg shadow-md">
              <h3 class="text-lg font-semibold mb-2">{event.name}</h3>
              <p class="text-sm text-gray-600">Date: {event.date}</p>
              <p class="text-sm text-gray-600">Time: {event.time}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default EventPage;

