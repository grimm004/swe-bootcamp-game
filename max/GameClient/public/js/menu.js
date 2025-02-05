import { loginUser, signupUser } from "./auth.js";
// Optionally import your lobby API functions if/when needed.

class Menu {
    constructor() {
        // Cache references to the DOM elements that comprise your online UI.
        this.onlineContainer = document.getElementById("onlineContainer");

        // --- Auth Panel Elements ---
        this.authPanel = document.getElementById("authPanel");
        this.authForm = document.getElementById("authForm");
        this.authSubmitButton = document.getElementById("authSubmitButton");
        this.toggleAuthButton = document.getElementById("toggleAuthButton");
        this.toggleAuthText = document.getElementById("toggleAuthText");
        // Keep the sign-up only fields in place (do not remove them from the DOM)
        this.signUpOnlyFields = document.querySelectorAll(".sign-up-only");

        // --- Navigation & Panels ---
        // Note: Online navigation (lobby/profile) is hidden until login.
        this.navButtons = document.querySelectorAll(".online-nav .nav-btn");
        this.lobbyPanel = document.getElementById("lobbyPanel");
        this.profilePanel = document.getElementById("profilePanel");

        // --- Lobby Sub-Elements ---
        this.lobbyUserList = document.getElementById("lobbyUserList");
        this.lobbyStatus = document.getElementById("lobbyStatus");
        this.createLobbyBtn = document.getElementById("createLobbyBtn");
        this.joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this.lobbyJoinCode = document.getElementById("lobbyJoinCode");

        // --- Profile Panel ---
        this.profileForm = document.getElementById("profileForm");

        this.isSignUpMode = false; // start in login mode

        // A callback that the main module can assign for auth success.
        /**
         * @type {(user: User) => void}
         */
        this.onAuthSuccess = null;
    }

    setupUI() {
        this.toggleAuthButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.isSignUpMode = !this.isSignUpMode;
            if (this.isSignUpMode) {
                this.toggleAuthText.innerText = "Already have an account?";
                this.authSubmitButton.innerText = "Sign Up";
                this.toggleAuthButton.innerText = "Log In";
                this.signUpOnlyFields.forEach((el) => {
                    el.classList.remove("collapsed");
                    el.classList.add("expanded");
                    const input = el.querySelector("input");
                    if (input) {
                        input.disabled = false;
                    }
                });
            } else {
                this.toggleAuthText.innerText = "Don't have an account?";
                this.authSubmitButton.innerText = "Log In";
                this.toggleAuthButton.innerText = "Sign Up";
                this.signUpOnlyFields.forEach((el) => {
                    el.classList.remove("expanded");
                    el.classList.add("collapsed");
                    const input = el.querySelector("input");
                    if (input) {
                        input.disabled = true;
                    }
                });
            }
        });


        this.authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(this.authForm);
            const username = formData.get("username");
            const email = formData.get("email");
            const password = formData.get("password");
            let signInResult = null;
            try {
                if (this.isSignUpMode) {
                    const confirmPassword = formData.get("confirmPassword");
                    if (password !== confirmPassword) {
                        this.showError("Passwords do not match.");
                        return;
                    }
                    signInResult = await signupUser({ username, email, password });
                } else {
                    signInResult = await loginUser({ username, password });
                }

                if (signInResult) {
                    this.authPanel.classList.add("d-none");
                    const nav = document.querySelector(".online-nav");
                    if (nav) {
                        nav.classList.remove("d-none");
                    }
                    this.lobbyPanel.classList.remove("d-none");

                    if (this.onAuthSuccess) {
                        this.onAuthSuccess(signInResult);
                    }
                }
            } catch (err) {
                this.showError(err.message || "Authentication failed.");
            }
        });

        this.navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetPanel = btn.getAttribute("data-target");
                this.lobbyPanel.classList.add("d-none");
                this.profilePanel.classList.add("d-none");
                document.getElementById(targetPanel).classList.remove("d-none");
            });
        });

        this.createLobbyBtn.addEventListener("click", async () => await this.createLobby());
        this.joinLobbyBtn.addEventListener("click", async () => {
            const code = this.lobbyJoinCode.value.trim();
            await this.joinLobby(code);
        });

        this.profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.updateProfile(new FormData(this.profileForm));
        });
    }

    showError(message) {
        let errorDisplay = document.getElementById("errorDisplay");
        if (!errorDisplay) {
            errorDisplay = document.createElement("div");
            errorDisplay.id = "errorDisplay";
            Object.assign(errorDisplay.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "red",
                display: "none",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "100",
                fontSize: "2em",
            });
            document.getElementById("gameContainer").appendChild(errorDisplay);
        }
        errorDisplay.innerText = message;
        errorDisplay.style.display = "flex";
        setTimeout(() => {
            errorDisplay.style.display = "none";
        }, 1000);
    }

    async createLobby() {
        console.log("Creating lobby...");
        const lobbyData = {
            joinCode: "ABC123",
            players: [{ username: "player1" }, { username: "player2" }],
        };
        this.updateLobbyUI(lobbyData);
    }

    async joinLobby(lobbyCode) {
        console.log("Joining lobby with code:", lobbyCode);
        const lobbyData = {
            joinCode: lobbyCode,
            players: [
                { username: "player1" },
                { username: "player2" },
                { username: "player3" },
            ],
        };
        this.updateLobbyUI(lobbyData);
    }

    updateLobbyUI(lobbyData) {
        this.lobbyUserList.innerHTML = "";
        lobbyData.players.forEach((player) => {
            const li = document.createElement("li");
            li.innerText = player.username;
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.addEventListener("click", async () => await this.removePlayerFromLobby(player.username));
            li.appendChild(removeBtn);
            this.lobbyUserList.appendChild(li);
        });
        this.lobbyStatus.innerText = "Lobby Code: " + lobbyData.joinCode;
    }

    async removePlayerFromLobby(username) {
        console.log("Removing player:", username);
        this.showError(`Player ${username} removed from lobby.`);
    }

    async updateProfile(formData) {
        const displayName = formData.get("displayName");
        const email = formData.get("email");
        console.log("Updating profile with:", displayName, email);
        this.showError("Profile updated successfully.");
    }

    hide() {
        this.onlineContainer.classList.add("d-none");
    }

    show() {
        this.onlineContainer.classList.remove("d-none");
    }
}

export default Menu;
