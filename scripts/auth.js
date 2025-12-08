// ==============================
//  HARD-CODED OWNER LOGIN
// ==============================

const OWNER_USERNAME = "crucifix";
const OWNER_PASSWORD = "Rhyder1228";

function ownerLoginSuccess() {
    // What gets stored in localStorage
    const ownerUser = {
        name: "Owner",
        email: "crucifix",
        role: "owner",
        approved: true
    };

    localStorage.setItem("currentUser", JSON.stringify(ownerUser));

    // Redirect to rooms
    window.location.href = "rooms.html";
}

// ==============================
//  HANDLE LOGIN FORM
// ==============================

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    // ------------------------------
    //  CHECK OWNER BACKDOOR LOGIN
    // ------------------------------
    if (email === OWNER_USERNAME && password === OWNER_PASSWORD) {
        ownerLoginSuccess();
        return;
    }

    // ------------------------------
    //  NORMAL LOGIN (Firebase)
    // ------------------------------
    try {
        const dbRef = ref(db, "users");
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) {
            alert("No accounts exist yet.");
            return;
        }

        const users = snapshot.val();
        const key = email.replace(/\./g, ",");

        if (!users[key]) {
            alert("User not found.");
            return;
        }

        const user = users[key];

        if (user.password !== password) {
            alert("Incorrect password.");
            return;
        }

        if (!user.approved) {
            alert("Your account has not been approved yet.");
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location.href = "rooms.html";

    } catch (err) {
        console.error(err);
        alert("Error logging in.");
    }
});
