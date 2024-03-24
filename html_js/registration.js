async function registerUser() {
    if (!window.Realm) {
        alert('Realm Web SDK is not loaded. Please check the CDN link in your HTML file.');
        return;
    }
    
    const app = new Realm.App({ id: "application-0-rbrbg" }); // Replace YOUR_APP_ID with your MongoDB Realm application Id
    const credentials = Realm.Credentials.anonymous(); // Using anonymous credentials for simplicity

    try {
        // Authenticate the user
        const user = await app.logIn(credentials);

        // Access your MongoDB Atlas cluster
        const mongodb = user.mongoClient("mongodb-atlas"); // Replace "mongodb-atlas" with your Atlas service name if different
        const usersCollection = mongodb.db("webProject").collection("users");

        // Get user inputs
        const enteredUsername = document.getElementById('username').value;
        const enteredPassword = document.getElementById('password').value; // Remember, in real applications, hash passwords before storing
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (enteredPassword !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }

        // Insert a new user into the database
        await usersCollection.insertOne({
            username: enteredUsername,
            password: enteredPassword // Remember, storing passwords in plain text is unsafe
        });

    // On successful registration, show the modal
    document.getElementById('successModal').style.display = 'block';

    // Handle the "OK" button click
    document.getElementById('okButton').onclick = function() {
        window.location.href = 'index.html';
    };
    } catch (err) {
        console.error("Failed to log in or register user:", err);
        alert("Registration failed. Please try again.");
    }
}
