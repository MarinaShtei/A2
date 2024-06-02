import { useState } from "preact/hooks";
import { App, Credentials } from "realm-web";

// Register component to handle user registration
const Register = () => {
    // State management for username, password, and confirm password
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Function to handle user registration
    const registerUser = async () => {
        try {
            // Initialize Realm app with application ID
            const app = new App({ id: "application-0-rbrbg" });

            // Log in anonymously to MongoDB Realm
            const credentials = Credentials.anonymous();
            const user = await app.logIn(credentials);

            // Access MongoDB collection for users
            const mongodb = user.mongoClient("mongodb-atlas");
            const usersCollection = mongodb.db("webProject").collection("users");

            // Check if passwords match before proceeding
            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                return;
            }

            // Insert new user document into the users collection
            await usersCollection.insertOne({
                username: username,
                password: password
            });

            // Show success modal to the user upon successful registration
            document.getElementById("successModal").style.display = "block";

            // Redirect to the login page after the user acknowledges the success modal
            document.getElementById("okButton").onclick = function() {
                window.location.href = "index.html"; // Change to your login page
            };
        } catch (err) {
            // Handle registration errors and alert the user
            console.error("Failed to register user:", err);
            alert("Registration failed. Please try again.");
        }
    };

    return (
        <div class="flex justify-center items-center h-screen bg-gray-100">
            <div class="w-full max-w-md p-8 space-y-3 rounded-lg bg-white shadow-md">
                <h2 class="text-2xl font-semibold text-center text-gray-900">Register</h2>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username"
                    class="block w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    value={username}
                    onInput={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    class="block w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    value={password}
                    onInput={(e) => setPassword(e.target.value)}
                />
                <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    class="block w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    value={confirmPassword}
                    onInput={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                    onClick={registerUser}
                    class="w-full px-4 py-2 text-white bg-blue-500 rounded-md focus:bg-blue-600 focus:outline-none"
                >
                    Register
                </button>
            </div>
        </div>
    );
};

export default Register;
