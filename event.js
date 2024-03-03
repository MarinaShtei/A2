let currentPage = 0;
const eventsPerPage = 9; // For a 3 by 3 grid
const app = new Realm.App({ id: "application-0-rbrbg" });
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let events = []; // Global array to store fetched events
let selectedDayDiv = null; // To keep track of the currently selected day div

document.addEventListener('DOMContentLoaded', async () => {
    await app.logIn(Realm.Credentials.anonymous());
    document.getElementById('addUsersToggle').addEventListener('change', handleToggle);
    await displayEvents();
    updateCalendar();
});

document.addEventListener('DOMContentLoaded', async () => {
    await app.logIn(Realm.Credentials.anonymous());
    updateGreeting(); // Call this function to update the greeting
    document.getElementById('addUsersToggle').addEventListener('change', handleToggle);
    await displayEvents();
    updateCalendar();
});

function updateGreeting() {
    const loggedInUsername = localStorage.getItem('loggedInUsername');
    if (loggedInUsername) {
        document.getElementById('userGreeting').textContent = `Hello, ${loggedInUsername}`;
    }
}

// Updated displayEvents to fetch both created and attending events
// async function displayEvents() {
//     const loggedInUsername = localStorage.getItem('loggedInUsername');
//     const mongodb = app.currentUser.mongoClient("mongodb-atlas");
//     const eventsCollection = mongodb.db("webProject").collection("events");
//     const usersAtEventCollection = mongodb.db("webProject").collection("usersAtEvent");

//     // Fetch events created by the user
//     const createdEvents = await eventsCollection.find({ username: loggedInUsername });

//     // Fetch event IDs where the user is an attendee
//     const attendingEventsInfo = await usersAtEventCollection.find({ attendees: loggedInUsername });
//     const attendingEventIds = attendingEventsInfo.map(info => info.eventId); // Assuming eventId is stored in usersAtEvent

//     // Fetch the details of attending events
//     let attendingEvents = [];
//     if (attendingEventIds.length > 0) {
//         attendingEvents = await eventsCollection.find({
//             _id: { $in: attendingEventIds }
//         });
//     }

//     // Combine and remove duplicates
//     events = [...createdEvents, ...attendingEvents.filter(event => !createdEvents.map(e => e._id).includes(event._id))];

//     updateEventList();
//     updateCalendar();
// }

async function displayEvents() {
    const loggedInUsername = localStorage.getItem('loggedInUsername');
    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const usersAtEventCollection = mongodb.db("webProject").collection("usersAtEvent");

    // Fetch events created by the user
    const createdEvents = await eventsCollection.find({ username: loggedInUsername });

    // Fetch events where the user is an attendee
    const attendingEventsInfo = await usersAtEventCollection.find({ attendees: loggedInUsername });
    const attendingEventIds = attendingEventsInfo.map(info => info.eventId); // Assuming eventId is stored in usersAtEvent

    // Fetch the details of attending events, excluding those created by the user to avoid duplication
    const attendingEvents = await Promise.all(attendingEventIds.map(async (eventId) => {
        return eventsCollection.findOne({ _id: eventId, username: { $ne: loggedInUsername } });
    })).then(results => results.filter(event => event !== null)); // Filter out null results if an event wasn't found

    // Combine created and attending events without duplicates
    events = [...createdEvents, ...attendingEvents];

    updateEventList();
    updateCalendar();
}



async function addEvent() {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const loggedInUsername = localStorage.getItem('loggedInUsername');
    const addUsersToggle = document.getElementById('addUsersToggle');

    if (eventName && eventDate && eventTime && loggedInUsername) {
        try {
            const mongodb = app.currentUser.mongoClient("mongodb-atlas");
            const eventsCollection = mongodb.db("webProject").collection("events");
            const usersAtEventCollection = mongodb.db("webProject").collection("usersAtEvent"); // Ensure correct collection name
    
            // Insert the event with the creator as one of the attendees
            const eventResult = await eventsCollection.insertOne({
                name: eventName,
                date: eventDate,
                time: eventTime,
                username: loggedInUsername,
                attendees: [loggedInUsername] // Include creator as attendee
            });
    
            let attendeesToUpdate = [loggedInUsername];
    
            if (addUsersToggle.checked) {
                const checkboxElements = document.querySelectorAll('#usersCheckboxList input[type="checkbox"]:checked');
                const selectedUsers = Array.from(checkboxElements).map(checkbox => checkbox.value);
                attendeesToUpdate = [...new Set([...attendeesToUpdate, ...selectedUsers])]; // Ensure no duplicates
            }
    
            // Update or insert into usersAtEvent collection
            await usersAtEventCollection.updateOne(
                { eventId: eventResult.insertedId }, // Ensure you're using the correct identifier for the event
                { $set: { attendees: attendeesToUpdate } },
                { upsert: true } // Creates a new document if one doesn't exist
            );
    
            alert('Event created');
            await displayEvents(); // Refresh the event list
            updateCalendar(); // Update the calendar to reflect the new event
            
            // Reset the form and UI elements to their default state
            document.getElementById('eventName').value = '';
            document.getElementById('eventDate').value = '';
            document.getElementById('eventTime').value = '';
            addUsersToggle.checked = false;
            document.getElementById('usersCheckboxList').innerHTML = ''; // Assuming you change 'usersSelect' to 'usersCheckboxList'
            document.getElementById('usersSelectDiv').classList.add('hidden');

        } catch (err) {
            console.error("Failed to add the event or update attendees", err);
            alert('Failed to create the event or update attendees. Please try again.');
        }
    } else {
        alert('Please fill in all fields and make sure you are logged in.');
    }
}



async function handleToggle() {
    const usersDiv = document.getElementById('usersSelectDiv');
    const toggle = document.getElementById('addUsersToggle');
    if (toggle.checked) {
        usersDiv.classList.remove('hidden');
        await populateUsersSelect();
    } else {
        usersDiv.classList.add('hidden');
    }
}

async function populateUsersSelect() {
    const usersCheckboxList = document.getElementById('usersCheckboxList');
    usersCheckboxList.innerHTML = ''; // Clear current options
    const loggedInUsername = localStorage.getItem('loggedInUsername');

    try {
        const mongodb = app.currentUser.mongoClient("mongodb-atlas");
        const usersCollection = mongodb.db("webProject").collection("users");
        const users = await usersCollection.find({}, { projection: { password: 0 } });

        users.forEach(user => {
            if (user.username !== loggedInUsername) { // Exclude the current user
                // Create a checkbox for each user
                const checkboxId = `user-${user.username}`;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.value = user.username;
                checkbox.className = "form-checkbox h-5 w-5 text-gray-600 mr-2"; // Tailwind CSS for checkboxes
                
                // Create a label for the checkbox
                const label = document.createElement('label');
                label.htmlFor = checkboxId;
                label.className = "text-gray-700"; // Tailwind CSS for labels
                label.textContent = user.username;

                // Create a div to wrap the checkbox and label, for better styling
                const userDiv = document.createElement('div');
                userDiv.appendChild(checkbox);
                userDiv.appendChild(label);

                // Append the div to the usersCheckboxList container
                usersCheckboxList.appendChild(userDiv);
            }
        });

        // Make the user selection list visible
        usersCheckboxList.classList.remove('hidden');
    } catch (err) {
        console.error("Failed to fetch users", err);
    }
}

// function updateCalendar() {
//     const daysContainer = document.getElementById('calendarDays');
//     daysContainer.innerHTML = ''; // Clear previous days
//     const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();

//     for (let day = 1; day <= numDays; day++) {
//         const dayDiv = document.createElement('div');
//         dayDiv.textContent = day;
//         dayDiv.className = 'text-center cursor-pointer rounded-lg py-1 hover:bg-blue-100'; // Tailwind hover effect
//         if (events.map(event => new Date(event.date).getDate()).includes(day)) {
//             dayDiv.classList.add('font-bold');
//         }
//         dayDiv.onclick = () => {
//             if (selectedDayDiv) {
//                 selectedDayDiv.classList.remove('bg-blue-500', 'text-white', 'rounded-lg'); // Remove from previously selected
//             }
//             dayDiv.classList.add('bg-blue-500', 'text-white', 'rounded-lg'); // Add to current selected
//             selectedDayDiv = dayDiv; // Update reference to currently selected
//             displayEventsForDate(day);
//         };
//         daysContainer.appendChild(dayDiv);
//     }
//     document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
// }

function updateCalendar() {
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = ''; // Clear previous days
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Convert event dates to a format that is easy to compare (YYYY-MM-DD)
    const eventDates = events.map(event => {
        const eventDate = new Date(event.date);
        return `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    });

    for (let day = 1; day <= numDays; day++) {
        // Generate a string for the current day in the loop
        const currentDayString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.className = 'text-center cursor-pointer py-1 hover:bg-blue-100'; // Base styling

        // Apply bold styling if there's an event on this day
        if (eventDates.includes(currentDayString)) {
            dayDiv.classList.add('font-bold', 'text-red-500');
        }

        dayDiv.onclick = () => {
            if (selectedDayDiv) {
                selectedDayDiv.classList.remove('bg-blue-500', 'text-white', 'rounded-lg'); // Remove from previously selected
            }
            dayDiv.classList.add('bg-blue-500', 'text-white', 'rounded-lg'); // Add to current selected
            selectedDayDiv = dayDiv; // Update reference to currently selected
            displayEventsForDate(day);
        };

        daysContainer.appendChild(dayDiv);
    }
    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}


// function displayEventsForDate(day) {
//     const selectedDate = new Date(currentYear, currentMonth, day);
//     const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

//     const eventsForDate = events.filter(event => event.date === selectedDateString);
//     const loggedInUsername = localStorage.getItem('loggedInUsername'); // Retrieve the logged-in user's username

//     const eventInfo = document.getElementById('eventInfo');
//     eventInfo.innerHTML = ''; // Clear the container for new event details
//     eventInfo.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'; // Apply Tailwind grid layout

//     if (eventsForDate.length > 0) {
//         eventsForDate.forEach(event => {
//             // Dynamically create a container for each event's details
//             const eventContainer = document.createElement('div');
//             eventContainer.className = 'p-4 bg-white rounded-lg shadow-md m-2'; // Tailwind styles for the event box
//             eventContainer.innerHTML = `
//                 <h3 class="text-lg font-semibold mb-2">${event.name}</h3>
//                 <p class="text-sm text-gray-600">Date: ${event.date}</p>
//                 <p class="text-sm text-gray-600">Time: ${event.time}</p>
//                 <p class="text-sm text-gray-600">Organizer: ${event.username}</p>
//                 <button onclick="window.location.href='attend.html'" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300">Enter Event</button>
//             `;

//             // Conditionally add the 'Edit Event' button if the event was created by the current user
//             if (event.username === loggedInUsername) {
//                 eventContainer.innerHTML += `<button onclick="window.location.href='manage.html'" class="mt-2 ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-300">Edit Event</button>`;
//             }

//             // Append the event container to the eventInfo element
//             eventInfo.appendChild(eventContainer);
//         });
//     } else {
//         eventInfo.textContent = 'No events for this date.';
//     }
// }

function displayEventsForDate(day) {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const eventsForDate = events.filter(event => event.date === selectedDateString);
    const loggedInUsername = localStorage.getItem('loggedInUsername'); // Retrieve the logged-in user's username

    const eventInfo = document.getElementById('eventInfo');
    eventInfo.innerHTML = ''; // Clear previous event details
    eventInfo.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'; // Tailwind grid layout for responsiveness

    if (eventsForDate.length > 0) {
        eventsForDate.forEach(event => {
            eventInfo.innerHTML += generateEventHTML(event, loggedInUsername);
        });
    } else {
        eventInfo.textContent = 'No events for this date.';
    }
}



function updateEventList() {
    const eventListView = document.getElementById('eventListView');
    eventListView.innerHTML = ""; // Clear existing content

    events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.className = "bg-white p-4 rounded-lg shadow-md";
        listItem.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">${event.name}</h3>
            <p class="text-sm text-gray-600">Date: ${event.date}</p>
            <p class="text-sm text-gray-600">Time: ${event.time}</p>
        `;
        eventListView.appendChild(listItem);
    });
}


document.getElementById('prevMonth').addEventListener('click', () => {
    if (currentMonth === 0) {
        currentMonth = 11;
        currentYear -= 1;
    } else {
        currentMonth -= 1;
    }
    updateCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    if (currentMonth === 11) {
        currentMonth = 0;
        currentYear += 1;
    } else {
        currentMonth += 1;
    }
    updateCalendar();
});

function updateEventList() {
    const eventListView = document.getElementById('eventListView');
    eventListView.innerHTML = ""; // Clear existing content
    const loggedInUsername = localStorage.getItem('loggedInUsername');

    events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.className = "bg-white p-4 rounded-lg shadow-md m-2";
        listItem.innerHTML = generateEventHTML(event, loggedInUsername);
        eventListView.appendChild(listItem);
    });
}

function generateEventHTML(event, loggedInUsername) {
    let isCreator = event.username === loggedInUsername;
    let bgColor = isCreator ? "bg-blue-100" : "bg-gray-100"; // Different background for creator's events

    let eventHTML = `
        <div class="p-4 ${bgColor} rounded-lg shadow m-2">
            <h3 class="text-lg font-semibold">${event.name}</h3>
            <p>Date: ${event.date}</p>
            <p>Time: ${event.time}</p>
            <p>Organizer: ${event.username}</p>
            <button onclick="window.location.href='attend.html'" class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Enter Event</button>
    `;

    if (isCreator) {
        eventHTML += `<button onclick="window.location.href='manage.html'" class="mt-2 ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Edit Event</button>`;
    }

    eventHTML += `</div>`;
    return eventHTML;
}

// Update displayEventsForDate and updateEventList accordingly

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}