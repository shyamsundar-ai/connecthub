
let currentUser = null;

async function api(action, extra = {}) {
    const response = await fetch("/api/", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({action, ...extra})
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Something went wrong");
    return data;
}

async function register() {
    try {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const data = await api("register", {username, password});
        currentUser = data.username;
        showApp();
    } catch (e) {
        alert(e.message);
    }
}

async function login() {
    try {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        const data = await api("login", {username, password});
        currentUser = data.username;
        showApp();
    } catch (e) {
        alert(e.message);
    }
}

async function logout() {
    try {
        await api("logout");
        location.reload();
    } catch (e) {
        alert(e.message);
    }
}

function showApp() {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("welcome").innerText = "Welcome, @" + currentUser;

    loadPosts();
    loadUsers();
}

async function createPost() {
    const box = document.getElementById("postText");
    const text = box.value.trim();

    if (!text) return alert("Write something!");

    try {
        await api("create", {text});
        box.value = "";
        loadPosts();
    } catch (e) {
        alert(e.message);
    }
}

async function loadPosts() {
    try {
        const data = await api("posts");
        const feed = document.getElementById("feed");
        feed.innerHTML = "";

        data.posts.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";

            const heading = document.createElement("h3");
            heading.textContent = "@" + p.user;

            const content = document.createElement("p");
            content.textContent = p.text;

            const like = document.createElement("button");
            const liked = p.likes.includes(currentUser);
            like.textContent = (liked ? "Unlike" : "Like") + " (" + p.likes.length + ")";
            like.onclick = async () => {
                await api("like", {id: p.id});
                loadPosts();
            };

            const input = document.createElement("input");
            input.placeholder = "Write a comment";

            const comment = document.createElement("button");
            comment.textContent = "Comment";
            comment.onclick = async () => {
                if (!input.value.trim()) return;
                await api("comment", {id: p.id, text: input.value});
                loadPosts();
            };

            card.append(heading, content, like, input, comment);

            p.comments.forEach(c => {
                const line = document.createElement("p");
                line.textContent = "@" + c.user + ": " + c.text;
                card.appendChild(line);
            });

            feed.appendChild(card);
        });
    } catch (e) {
        alert(e.message);
    }
}

async function loadUsers() {
    try {
        const data = await api("users");
        const area = document.getElementById("users");
        area.innerHTML = "";

        data.users.forEach(u => {
            const card = document.createElement("div");
            card.className = "card";

            const label = document.createElement("span");
            label.textContent = "@" + u.username + " ";

            const button = document.createElement("button");
            button.textContent = u.following ? "Unfollow" : "Follow";

            button.onclick = async () => {
                await api("follow", {username: u.username});
                loadUsers();
            };

            card.append(label, button);
            area.appendChild(card);
        });
    } catch (e) {
        alert(e.message);
    }
}

async function checkLogin() {
    try {
        const data = await api("me");
        if (data.username) {
            currentUser = data.username;
            showApp();
        }
    } catch (e) {
        console.log(e);
    }
}

checkLogin();
