import { useState } from "preact/hooks";
import { Link } from 'preact-router/match';
import { App as RealmApp, Credentials } from "realm-web";

// Replace 'application-0-rbrbg' with your actual MongoDB Realm App ID
const app = new RealmApp({ id: "application-0-rbrbg" });

const Registration = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const registerUser = async () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }

        try {
            const credentials = Credentials.anonymous();
            const user = await app.logIn(credentials);
            const mongodb = user.mongoClient("mongodb-atlas");
            const usersCollection = mongodb.db("webProject").collection("users");

            await usersCollection.insertOne({
                username,
                password, // Remember, storing passwords in plain text is unsafe
            });

            // Show success modal
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Failed to register user:", err);
            alert("Registration failed. Please try again.");
        }
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
                                <button 
                                    onClick={() => (window.location.href = '/')}
                                    class="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Page */}
            <section class="container mx-auto mt-16 flex justify-center items-center">
                <div class="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                    <h2 class="text-2xl font-semibold mb-6 text-center">Registration</h2>
                    <div class="space-y-4">
                        <div>
                            <label for="username" class="block text-sm font-medium text-gray-600">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                class="mt-1 p-2 w-full border rounded" 
                                value={username} 
                                onInput={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-600">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                class="mt-1 p-2 w-full border rounded" 
                                value={password} 
                                onInput={e => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label for="confirmPassword" class="block text-sm font-medium text-gray-600">Confirm Password</label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                class="mt-1 p-2 w-full border rounded" 
                                value={confirmPassword} 
                                onInput={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={registerUser} 
                            class="bg-blue-500 text-white p-2 rounded w-full"
                        >
                            Register
                        </button>
                    </div>
                    <div class="mt-4 text-center">
                        <a href="/" class="text-blue-500">Already have an account? Login</a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Registration;
