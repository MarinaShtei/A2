import { useState } from "preact/hooks"
import { App, Credentials } from "realm-web"
//import Event from "./event";
import Registration from "./Registration";

//mongodb auth
const app = new App({ id: "application-0-rbrbg" })

const Login = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    

    const login = async () => {
        try {
            // Using anonymous credentials
            const credentials = Credentials.anonymous()
            const anonymousUser = await app.logIn(credentials)
            console.log("Successfully logged in anonymously", anonymousUser)

            // Pulling data from MongoDB 
            const mongodb = anonymousUser.mongoClient("mongodb-atlas")
            const usersCollection = mongodb.db("webProject").collection("users")

            // Querying the collection for the username and password
            const user = await usersCollection.findOne({ username: username, password: password }) // In a real scenario, consider hashing

            if (user) {
                console.log("Login successful for user:", user.username)
                // saving username in local storage
                localStorage.setItem("loggedInUsername", username)
                // Redirecting to a different page on successful login
                window.location.href = "/events"
            } else {
                throw new Error("Invalid username or password.")
            }
        } catch (err) {
            console.error("Failed to log in", err)
            alert("Invalid username or password. Please try again.")
        }
    }

    return (
        <div class="flex justify-center items-center h-screen bg-gray-100">
            <div class="w-full max-w-md p-8 space-y-3 rounded-lg bg-white shadow-md">
                <h2 class="text-2xl font-semibold text-center text-gray-900">Login</h2>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username"
                    class="block w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Password"
                    class="block w-full px-4 py-2 mt-2 border rounded-md bg-gray-50 focus:border-blue-500 focus:ring-blue-500 focus:outline-none focus:ring focus:ring-opacity-40"
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
            </div>
        </div>
    )
}

export default Login
