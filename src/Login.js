import { useState, useEffect } from "preact/hooks";
import { App, Credentials } from "realm-web";
// import Event from "./event";
import Registration from "./Registration";

// mongodb auth
const app = new App({ id: "application-0-rbrbg" });

const Login = () => {
    // state management
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [lightMode, setLightMode] = useState("light");

    useEffect(() => {
        // handle theme mode on initial load
        const savedMode = localStorage.getItem("lightmode") || "light";
        setLightMode(savedMode);
        document.documentElement.classList.toggle("dark", savedMode === "dark");
    }, []);

    const login = async () => {
        try {
            // using anonymous credentials for login
            const credentials = Credentials.anonymous();
            const anonymousUser = await app.logIn(credentials);
            console.log("Successfully logged in anonymously", anonymousUser);

            // pulling data from mongodb 
            const mongodb = anonymousUser.mongoClient("mongodb-atlas");
            const usersCollection = mongodb.db("webProject").collection("users");

            // querying the collection for the username and password
            const user = await usersCollection.findOne({ username: username, password: password }); // in a real scenario, consider hashing

            if (user) {
                console.log("Login successful for user:", user.username);
                // saving username in local storage
                localStorage.setItem("loggedInUsername", username);
                // redirecting to a different page on successful login
                window.location.href = "/events";
            } else {
                throw new Error("Invalid username or password.");
            }
        } catch (err) {
            console.error("Failed to log in", err);
            alert("Invalid username or password. Please try again.");
        }
    };

    const toggleMode = () => {
        // toggling light/dark mode
        const newMode = lightMode === "light" ? "dark" : "light";
        setLightMode(newMode);
        localStorage.setItem("lightmode", newMode);
        document.documentElement.classList.toggle("dark", newMode === "dark");
    };


    return (
        <div class={`flex justify-center items-center h-screen ${lightMode === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
            <div class={`w-full max-w-md p-8 space-y-3 rounded-lg shadow-md ${lightMode === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <h2 class="text-2xl font-semibold text-center">Login</h2>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username"
                    class={`block w-full px-4 py-2 mt-2 border rounded-md ${lightMode === "dark" ? "bg-gray-700 border-gray-600 focus:border-blue-300 focus:ring-blue-300" : "bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"} focus:outline-none focus:ring focus:ring-opacity-40`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    class={`block w-full px-4 py-2 mt-2 border rounded-md ${lightMode === "dark" ? "bg-gray-700 border-gray-600 focus:border-blue-300 focus:ring-blue-300" : "bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"} focus:outline-none focus:ring focus:ring-opacity-40`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={login}
                    class="w-full px-4 py-2 text-white bg-blue-500 rounded-md focus:bg-blue-600 focus:outline-none"
                >
                    Login
                </button>
                <div class="text-center">
                    <a href="/password_recovery" class="text-sm text-blue-500 hover:underline">
                        Forgot your password?
                    </a>
                    <span class="mx-2 text-sm text-gray-600">|</span>
                    <a href="/registration" class="text-sm text-blue-500 hover:underline">
                        Register
                    </a>
                </div>
                <div class="text-center mt-4">
                    <button onClick={toggleMode} class="px-4 py-2 bg-gray-500 text-white rounded-md">
                        Dark / Light
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;