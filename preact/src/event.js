import { h, render } from "preact"
import { useState, useEffect } from "preact/hooks"

let currentPage = 0
const eventsPerPage = 9 // For a 3 by 3 grid
const currentMonth = new Date().getMonth()
const currentYear = new Date().getFullYear()
const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]
let events = [] // Global array to store fetched events
let selectedDayDiv = null // To keep track of the currently selected day div

const App = () => {
    const [loggedInUsername, setLoggedInUsername] = useState("")

    useEffect(() => {
        const loggedInUsername = localStorage.getItem("loggedInUsername")
        setLoggedInUsername(loggedInUsername)
        displayEvents()
        updateCalendar()
    }, [])

    const updateGreeting = () => {
        if (loggedInUsername) {
            return `Hello, ${loggedInUsername}`
        }
        return ""
    }

    return (
        <div class="bg-gray-100 font-sans">
            {/* Navigation Bar */}
            <header class="bg-blue-500 p-4 text-white">
                <div class="container mx-auto flex justify-between items-center">
                    <h1 class="text-3xl font-semibold">Virtual Event Platform</h1>
                    <div>
                        <span class="mr-4">{updateGreeting()}</span> {/* Placeholder for dynamic username */}
                        <a href="chat.html" class="text-white">
                            Chat
                        </a>
                        <span class="mx-2 text-white">|</span>
                        <a href="profile.html" class="text-white">
                            Profile
                        </a>
                        <span class="mx-2 text-white">|</span>
                        <a href="#" onClick={logout} class="text-white">
                            Logout
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div class="container mx-auto mt-8 flex">
                {/* Calendar Display */}
                <Calendar />

                {/* Event Creation Form */}
                <EventForm />
            </div>

            {/* Display Events */}
            <EventList />

            {/* Pagination Controls */}
            <div class="container mx-auto mt-4 flex justify-center items-center">
                <button id="prevPage" class="bg-blue-500 text-white p-2 rounded mx-2" onClick={() => changePage(-1)}>
                    Previous
                </button>
                <button id="nextPage" class="bg-blue-500 text-white p-2 rounded mx-2" onClick={() => changePage(1)}>
                    Next
                </button>
            </div>
        </div>
    )
}

const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    useEffect(() => {
        updateCalendar()
    }, [currentMonth, currentYear])

    const updateCalendar = () => {
        const daysContainer = document.getElementById("calendarDays")
        daysContainer.innerHTML = "" // Clear previous days
        const numDays = new Date(currentYear, currentMonth + 1, 0).getDate()

        // Convert event dates to a format that is easy to compare (YYYY-MM-DD)
        const eventDates = events.map((event) => {
            const eventDate = new Date(event.date)
            return `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`
        })

        for (let day = 1; day <= numDays; day++) {
            // Generate a string for the current day in the loop
            const currentDayString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

            const dayDiv = document.createElement("div")
            dayDiv.textContent = day
            dayDiv.className = "text-center cursor-pointer py-1 hover:bg-blue-100" // Base styling

            // Apply bold styling if there's an event on this day
            if (eventDates.includes(currentDayString)) {
                dayDiv.classList.add("font-bold", "text-red-500")
            }

            dayDiv.onclick = () => {
                if (selectedDayDiv) {
                    selectedDayDiv.classList.remove("bg-blue-500", "text-white", "rounded-lg") // Remove from previously selected
                }
                dayDiv.classList.add("bg-blue-500", "text-white", "rounded-lg") // Add to current selected
                selectedDayDiv = dayDiv // Update reference to currently selected
                displayEventsForDate(day)
            }

            daysContainer.appendChild(dayDiv)
        }
        document.getElementById("monthYear").textContent = `${monthNames[currentMonth]} ${currentYear}`
    }

    return <div class="flex-auto w-1/2 mr-8 bg-white shadow-lg rounded-lg">{/* Calendar display content */}</div>
}

const EventForm = () => {
    const [eventName, setEventName] = useState("")
    const [eventDate, setEventDate] = useState("")
    const [eventTime, setEventTime] = useState("")
    const [addUsersToggle, setAddUsersToggle] = useState(false)

    const handleToggle = () => {
        setAddUsersToggle(!addUsersToggle)
    }

    const addEvent =  async () => {
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

    return <div class="flex-auto w-1/2 bg-white p-8 rounded-lg shadow-md">{/* Event creation form content */}</div>
}

const EventList = () => {
    // Your event list component
}

// Other functions and constants remain the same

const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
}

const changePage = (page) => {
    currentPage += page
    // Logic to update page content based on currentPage
}

render(<App />, document.body)
