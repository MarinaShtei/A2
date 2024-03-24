async function login() {
    const app = new Realm.App({ id: "application-0-rbrbg" }); // Replace with your Realm app ID
    try {
        // Authenticate the user anonymously
        const anonymousUser = await app.logIn(Realm.Credentials.anonymous());
        console.log("Successfully logged in anonymously", anonymousUser);

        // Access your MongoDB database
        const mongodb = anonymousUser.mongoClient("mongodb-atlas");
        const usersCollection = mongodb.db("webProject").collection("users");

        // Query the collection for the username and password
        const enteredUsername = document.getElementById('username').value;
        const enteredPassword = document.getElementById('password').value; // In real scenario, consider hashing
        
        const user = await usersCollection.findOne({ username: enteredUsername, password: enteredPassword });

        if (user) {
            console.log("Login successful for user:", user.username);
            const enteredUsername = document.getElementById('username').value;
            localStorage.setItem('loggedInUsername', enteredUsername);
            window.location.href = 'event.html';
        } else {
            throw new Error('Invalid username or password.');
        }
    } catch (err) {
        console.error("Failed to log in", err);
        alert('Invalid username or password. Please try again.');
    }
}
