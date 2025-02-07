import { loginUser, signupUser } from "./auth.js";
// Optionally import your lobby API functions if/when needed.

class Menu {
    constructor() {
        this._onlineContainer = document.getElementById("onlineContainer");

        // --- Auth Panel Elements ---
        this._authPanel = document.getElementById("authPanel");
        this._authForm = document.getElementById("authForm");
        this._authPageTitle = document.getElementById("authPageTitle");
        this._authSubmitButton = document.getElementById("authSubmitButton");
        this._toggleAuthButton = document.getElementById("toggleAuthButton");
        this._toggleAuthText = document.getElementById("toggleAuthText");
        this._signUpOnlyFields = document.querySelectorAll(".sign-up-only");

        // --- Navigation & Panels ---
        this._navButtons = document.querySelectorAll(".online-nav .nav-btn");
        this._lobbyPanel = document.getElementById("lobbyPanel");
        this._profilePanel = document.getElementById("profilePanel");

        // --- Lobby Sub-Elements ---
        this._lobbyUserList = document.getElementById("lobbyUserList");
        this._lobbyStatus = document.getElementById("lobbyStatus");
        this._createLobbyBtn = document.getElementById("createLobbyBtn");
        this._joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this._lobbyJoinCode = document.getElementById("lobbyJoinCode");

        // --- Profile Panel ---
        this._profileForm = document.getElementById("profileForm");

        this._isSignUpMode = false;

        // A callback that the main module can assign for auth success.
        /**
         * @type {(user: User) => void}
         */
        this.onAuthSuccess = null;
    }

    setupUI() {
        this._toggleAuthButton.addEventListener("click", (e) => {
            e.preventDefault();
            this._isSignUpMode = !this._isSignUpMode;
            if (this._isSignUpMode) {
                this._authPageTitle.innerText = "Sign Up";
                this._authSubmitButton.innerText = "Sign Up";
                this._toggleAuthButton.innerText = "Log In";
                this._toggleAuthText.innerText = "Already have an account?";
                this._signUpOnlyFields.forEach((el) => {
                    el.classList.remove("collapsed");
                    el.classList.add("expanded");
                    const input = el.querySelector("input");
                    if (input) {
                        input.disabled = false;
                    }
                });
            } else {
                this._authPageTitle.innerText = "Log In";
                this._authSubmitButton.innerText = "Log In";
                this._toggleAuthButton.innerText = "Sign Up";
                this._toggleAuthText.innerText = "Don't have an account?";
                this._signUpOnlyFields.forEach((el) => {
                    el.classList.remove("expanded");
                    el.classList.add("collapsed");
                    const input = el.querySelector("input");
                    if (input) {
                        input.disabled = true;
                    }
                });
            }
        });


        this._authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(this._authForm);
            const username = formData.get("username");
            const email = formData.get("email");
            const password = formData.get("password");
            let signInResult = null;
            try {
                if (this._isSignUpMode) {
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
                    this._authPanel.classList.add("d-none");
                    const nav = document.querySelector(".online-nav");
                    if (nav) {
                        nav.classList.remove("d-none");
                    }
                    this._lobbyPanel.classList.remove("d-none");

                    if (this.onAuthSuccess) {
                        this.onAuthSuccess(signInResult);
                    }
                }
            } catch (err) {
                this.showError(err.message || "Authentication failed.");
            }
        });

        this._navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const targetPanel = btn.getAttribute("data-target");
                this._lobbyPanel.classList.add("d-none");
                this._profilePanel.classList.add("d-none");
                document.getElementById(targetPanel).classList.remove("d-none");
            });
        });

        this._createLobbyBtn.addEventListener("click", async () => await this.createLobby());
        this._joinLobbyBtn.addEventListener("click", async () => {
            const code = this._lobbyJoinCode.value.trim();
            await this.joinLobby(code);
        });

        this._profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await this.updateProfile(new FormData(this._profileForm));
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
        this._lobbyUserList.innerHTML = "";
        lobbyData.players.forEach((player) => {
            const li = document.createElement("li");
            li.innerText = player.username;
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.addEventListener("click", async () => await this.removePlayerFromLobby(player.username));
            li.appendChild(removeBtn);
            this._lobbyUserList.appendChild(li);
        });
        this._lobbyStatus.innerText = "Lobby Code: " + lobbyData.joinCode;
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
        this._onlineContainer.classList.add("d-none");
    }

    show() {
        this._onlineContainer.classList.remove("d-none");
    }
}

export default Menu;
