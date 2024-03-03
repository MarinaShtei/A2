let currentPage = 0;
const eventsPerPage = 9; // For a 3 by 3 grid
const app = new Realm.App({ id: "application-0-rbrbg" }); // Replace with your Realm app ID
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let events = []; // Global array to store fetched events

async function displayEvents() {
    const loggedInUsername = localStorage.getItem('loggedInUsername');
    const mongodb = app.currentUser.mongoClient("mongodb-atlas");
    const eventsCollection = mongodb.db("webProject").collection("events");
    const query = { username: loggedInUsername }; // Fetch all events for the logged-in user
    events = await eventsCollection.find(query); // Store fetched events globally
    updateEventList();
    updateCalendar(); // Refresh calendar with correct event highlights
}

async function addEvent() {
    const eventName = document.getElementById('eventName').value;
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const loggedInUsername = localStorage.getItem('loggedInUsername');

    if (eventName && eventDate && eventTime && loggedInUsername) {
        try {
            const mongodb = app.currentUser.mongoClient("mongodb-atlas");
            const eventsCollection = mongodb.db("webProject").collection("events");
            await eventsCollection.insertOne({
                name: eventName,
                date: eventDate,
                time: eventTime,
                username: loggedInUsername
            });

            if (document.getElementById('addUsersToggle').checked) {
                const selectedUsers = Array.from(document.getElementById('usersSelect').selectedOptions).map(option => option.value);
                const usersAtEventCollection = mongodb.db("webProject").collection("usersAtEvent");

                if (selectedUsers.length > 0) {
                    await usersAtEventCollection.insertOne({
                        eventName: eventName,
                        date: eventDate,
                        time: eventTime,
                        attendees: selectedUsers
                    });
                    console.log('Event and attendees saved successfully');
                }
            }

            alert('Event created');
            await displayEvents(); // Refresh the event list
        } catch (err) {
            console.error("Failed to add the event", err);
            alert('Failed to create the event. Please try again.');
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
    const usersSelect = document.getElementById('usersSelect');
    usersSelect.innerHTML = ''; // Clear current options
    const loggedInUsername = localStorage.getItem('loggedInUsername');

    try {
        const mongodb = app.currentUser.mongoClient("mongodb-atlas");
        const usersCollection = mongodb.db("webProject").collection("users");
        const users = await usersCollection.find({}, { projection: { password: 0 } });

        users.forEach(user => {
            if (user.username !== loggedInUsername) { // Exclude current user
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = user.username;
                usersSelect.appendChild(option);
            }
        });
    } catch (err) {
        console.error("Failed to fetch users", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await app.logIn(Realm.Credentials.anonymous());
    await displayEvents();
    document.getElementById('addUsersToggle').addEventListener('change', handleToggle);
});

async function updateCalendar() {
    const daysContainer = document.getElementById('calendarDays');
    daysContainer.innerHTML = ''; // Clear previous days
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // The corrected part: Filter events for the current month and year
    let eventDays = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).map(event => {
        const eventDate = new Date(event.date); // Correctly re-declare eventDate for this scope
        return eventDate.getDate(); // Now correctly calling getDate() on a Date object
    });

    for (let day = 1; day <= numDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;
        dayDiv.className = 'text-center cursor-pointer py-1';
        if (eventDays.includes(day)) {
            dayDiv.classList.add('font-bold'); // Bolden dates with events
        }
        dayDiv.onclick = () => displayEventsForDate(day);
        daysContainer.appendChild(dayDiv);
    }
    document.getElementById('monthYear').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}


function displayEventsForDate(day) {
    // Create a date object for the clicked day at 00:00 hours to avoid time zone issues
    const selectedDate = new Date(currentYear, currentMonth, day);
    const selectedDateString = selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0');

    // Filter events for the selected date
    const eventsForDate = events.filter(event => {
        // Assuming event.date is in 'YYYY-MM-DD' format
        return event.date === selectedDateString;
    });

    const eventInfo = document.getElementById('eventInfo');
    eventInfo.innerHTML = ''; // Clear previous event details

    if (eventsForDate.length > 0) {
        eventsForDate.forEach(event => {
            const eventDetail = document.createElement('div');
            eventDetail.innerHTML = `
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Hour:</strong> ${event.time}</p>
                <p><strong>Name:</strong> ${event.name}</p>
                <p><strong>Organizer:</strong> ${event.username}</p>
            `;
            eventInfo.appendChild(eventDetail);
        });
    } else {
        eventInfo.textContent = 'No events for this date.';
    }
}

function updateEventList() {
    const eventListView = document.getElementById('eventListView');
    eventListView.innerHTML = ""; // Clear existing content

    events.slice(currentPage * eventsPerPage, (currentPage + 1) * eventsPerPage).forEach(event => {
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

function changePage(direction) {
    currentPage += direction;
    updateEventList(); // Refresh the event list display with the new page of events
    updatePaginationButtons(); // Update the state of pagination buttons
}

function updatePaginationButtons() {
    document.getElementById('prevPage').disabled = currentPage <= 0;
    document.getElementById('nextPage').disabled = (currentPage + 1) * eventsPerPage >= events.length;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Call displayEvents on document load to initialize the calendar and event list
document.addEventListener('DOMContentLoaded', async () => {
    await app.logIn(Realm.Credentials.anonymous());
    await displayEvents();
});
