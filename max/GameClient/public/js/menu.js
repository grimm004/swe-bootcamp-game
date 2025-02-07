import {loginUser, logoutUser, signupUser, updateProfile} from "./auth.js";
import {showMessage} from "./message-popup.js";

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
        this._logoutButton = document.getElementById("logoutButton");

        // --- Lobby Sub-Elements ---
        this._lobbyUserList = document.getElementById("lobbyUserList");
        this._lobbyStatus = document.getElementById("lobbyStatus");
        this._createLobbyBtn = document.getElementById("createLobbyBtn");
        this._joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this._lobbyJoinCode = document.getElementById("lobbyJoinCode");

        // --- Profile Panel ---
        this._profileForm = document.getElementById("profileForm");

        this._isSignUpMode = false;
        this.currentUser = null;

        // A callback that the main module can assign for auth success.
        /**
         * @type {(user: User) => void}
         */
        this.onGameStart = null;
    }

    setSignUpMode(isSignUpMode) {
        if (isSignUpMode) {
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

        this._isSignUpMode = isSignUpMode;
    }

    setupUI() {
        this._toggleAuthButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.setSignUpMode(!this._isSignUpMode);
        });

        document.getElementById("startGameBtn").addEventListener("click", async () => {
            // If a callback is provided to start the game, call it.
            if (this.onGameStart) {
                this.onGameStart?.(this.currentUser);
            }
        });

        document.getElementById("leaveLobbyBtn").addEventListener("click", async () => {
            await this.leaveLobby();
        });

        this._authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(this._authForm);

            const username = formData.get("username");
            const displayName = formData.get("displayNameSignup");
            const password = formData.get("password");

            try {
                if (this._isSignUpMode) {
                    const confirmPassword = formData.get("confirmPassword");
                    if (password !== confirmPassword) {
                        showMessage("Passwords do not match.", "error");
                        return;
                    }
                    const signUpResult = await signupUser({ username, password, displayName });

                    if (!signUpResult.success) {
                        showMessage(`Failed to register: ${signUpResult.error}`, "error");
                        return;
                    }

                    this.setSignUpMode(false);
                    return;
                }

                const user = await loginUser({username, password});

                if (!user) {
                    showMessage("Authentication failed.", "error");
                    return;
                }

                if (!user.roles?.includes("player")) {
                    showMessage("Access Denied: You are not authorised to view the game.", "error");
                    return;
                }

                this.currentUser = user;
                this._authPanel.classList.add("d-none");
                const nav = document.querySelector(".online-nav");
                if (nav) nav.classList.remove("d-none");
                this._lobbyPanel.classList.remove("d-none");
                this._profileForm.querySelector("input[name='displayName']").value = user.displayName;
            } catch (err) {
                console.log(err);
                showMessage(err.message || "Authentication failed.", "error");
            }
        });

        this._navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                this._lobbyPanel.classList.add("d-none");
                this._profilePanel.classList.add("d-none");
                const targetPanel = btn.getAttribute("data-target");
                if (targetPanel)
                    document.getElementById(targetPanel).classList.remove("d-none");
            });
        });

        this._logoutButton.addEventListener("click", async () => {
            if (this.currentUser)
                await logoutUser(this.currentUser);
            this._lobbyPanel.classList.add("d-none");
            this._profilePanel.classList.add("d-none");
            this._authPanel.classList.remove("d-none");
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.add("d-none");
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
        // Hide the pre-join controls and show the in-lobby section.
        document.getElementById("lobbyPreJoin").classList.add("d-none");
        document.getElementById("lobbyInGame").classList.remove("d-none");

        // Set the lobby code in the disabled textbox.
        document.getElementById("lobbyCodeDisplay").value = lobbyData.joinCode;

        // Clear and update the player list.
        this._lobbyUserList.innerHTML = "";
        lobbyData.players.forEach((player) => {
            const li = document.createElement("li");
            // Use the displayName if available, otherwise the username.
            li.textContent = player.displayName || player.username;

            // If the current user is the lobby leader, add a remove button for players (other than the leader).
            if (this.currentUser && this.currentUser.username === lobbyData.leader && player.username !== lobbyData.leader) {
                const removeBtn = document.createElement("button");
                removeBtn.innerText = "Remove";
                // Optional: adjust spacing (e.g. margin-left) to align the button to the right.
                removeBtn.style.marginLeft = "auto";
                removeBtn.addEventListener("click", async () => await this.removePlayerFromLobby(player.username));
                li.appendChild(removeBtn);
            }
            this._lobbyUserList.appendChild(li);
        });

        // If the current user is the lobby leader and there are at least 2 players, show the Start Game button.
        if (this.currentUser && this.currentUser.username === lobbyData.leader && lobbyData.players.length >= 2) {
            document.getElementById("startGameBtn").classList.remove("d-none");
        } else {
            document.getElementById("startGameBtn").classList.add("d-none");
        }
    }

    async leaveLobby() {
        // Hide the in-lobby UI and show the pre-join controls.
        document.getElementById("lobbyInGame").classList.add("d-none");
        document.getElementById("lobbyPreJoin").classList.remove("d-none");
        // Clear the player list.
        this._lobbyUserList.innerHTML = "";
        // Optionally: call an API to leave the lobby.
    }

    async removePlayerFromLobby(username) {
        console.log("Removing player:", username);
        showMessage(`Player ${username} removed from lobby.`);
    }

    async updateProfile(formData) {
        this.currentUser.displayName = formData.get("displayName");
        const success = await updateProfile(this.currentUser);

        if (!success) {
            showMessage("Failed to update profile.", "error");
            return;
        }

        showMessage("Profile updated successfully.");
    }

    hide() {
        this._onlineContainer.classList.add("d-none");
    }

    show() {
        this._onlineContainer.classList.remove("d-none");
    }
}

export default Menu;
