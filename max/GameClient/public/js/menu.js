import { loginUser, logoutUser, signupUser, updateProfile } from "./auth.js";
import { showMessage } from "./message-popup.js";
import { createLobby, joinLobby, leaveLobby, removePlayerFromLobby, getLobbyByCode } from "./lobby.js";

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
        this._lobbyDetails = document.getElementById("lobbyDetails");
        this._lobbyUserList = document.getElementById("lobbyUserList");
        this._createLobbyBtn = document.getElementById("createLobbyBtn");
        this._joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this._lobbyJoinCode = document.getElementById("lobbyJoinCode");

        // --- Profile Panel ---
        this._profileForm = document.getElementById("profileForm");

        this._isSignUpMode = false;
        this.currentUser = null;
        this.currentLobby = null;

        // Store the polling interval ID so we can clear it later.
        this._lobbyPollInterval = null;

        /**
         * Callback that the main module can assign to start the game.
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
            if (this.onGameStart) {
                this.onGameStart(this.currentUser);
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

                const user = await loginUser({ username, password });
                if (!user) {
                    showMessage("Invalid username or password.", "error");
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
            this.stopLobbyPolling();
            if (this.currentLobby) {
                await this.leaveLobby();
                this.currentLobby = null;
                this.updateLobbyUI(null);
            }
            if (this.currentUser) {
                await logoutUser(this.currentUser);
                this.currentUser = null;
            }
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
        const lobbyData = await createLobby(this.currentUser.token);
        if (!lobbyData) {
            showMessage("Failed to create lobby.", "error");
            return;
        }
        this.currentLobby = lobbyData;
        this.updateLobbyUI(lobbyData);
        // Start polling for updates using the join code.
        this.startLobbyPolling(lobbyData.joinCode);
    }

    async joinLobby(joinCode) {
        console.log("Joining lobby with code:", joinCode);
        const lobbyData = await joinLobby(joinCode, this.currentUser.token);
        if (!lobbyData) {
            showMessage("Failed to join lobby.", "error");
            return;
        }
        this.currentLobby = lobbyData;
        this.updateLobbyUI(lobbyData);
        // Start polling for updates using the join code.
        this.startLobbyPolling(lobbyData.joinCode);
    }

    startLobbyPolling(joinCode) {
        // Clear any existing polling interval
        if (this._lobbyPollInterval) {
            clearInterval(this._lobbyPollInterval);
        }
        // Poll every 1000ms (1 second)
        this._lobbyPollInterval = setInterval(async () => {
            const updatedLobby = await getLobbyByCode(joinCode, this.currentUser.token);

            if (updatedLobby?.users?.filter(u => u.id === this.currentUser.id)?.length) {
                this.currentLobby = updatedLobby;
                this.updateLobbyUI(updatedLobby);
                return;
            }

            this.stopLobbyPolling();
            this.currentLobby = null;
            this.updateLobbyUI(null);
        }, 1000);
    }

    stopLobbyPolling() {
        if (!this._lobbyPollInterval) return;

        clearInterval(this._lobbyPollInterval);
        this._lobbyPollInterval = null;
    }

    updateLobbyUI(lobbyData) {
        if (!lobbyData) {
            document.getElementById("lobbyInGame").classList.add("d-none");
            document.getElementById("lobbyPreJoin").classList.remove("d-none");
            document.getElementById("lobbyCodeDisplay").value = "";
            this._lobbyDetails.classList.add("d-none");
            this._lobbyUserList.innerHTML = "";
            return;
        }

        // Hide the pre-join controls and show the in-lobby section.
        document.getElementById("lobbyPreJoin").classList.add("d-none");
        this._lobbyDetails.classList.remove("d-none");
        document.getElementById("lobbyInGame").classList.remove("d-none");

        // Set the lobby code in the disabled textbox.
        document.getElementById("lobbyCodeDisplay").value = lobbyData.joinCode;

        // Clear and update the user list.
        this._lobbyUserList.innerHTML = "";
        for (let user of lobbyData.users) {
            const li = document.createElement("li");

            li.textContent = user.displayName || user.username;

            if (user.id === lobbyData.hostId) {
                li.classList.add("host");
                li.textContent += " (Host)";
            }
            else if (this.currentUser && this.currentUser.id === lobbyData.hostId) {
                const removeBtn = document.createElement("button");
                removeBtn.innerText = "Remove";
                removeBtn.style.marginLeft = "auto";
                removeBtn.addEventListener("click", async () => await this.removePlayerFromLobby(user.id));
                li.appendChild(removeBtn);
            }

            this._lobbyUserList.appendChild(li);
        }

        // Show the Start Game button only if the current user is the host and there are at least 2 users.
        if (this.currentUser && this.currentUser.id === lobbyData.hostId && lobbyData.users.length >= 2) {
            document.getElementById("startGameBtn").classList.remove("d-none");
        } else {
            document.getElementById("startGameBtn").classList.add("d-none");
        }
    }

    async leaveLobby() {
        if (!this.currentLobby) return;

        await leaveLobby(this.currentLobby.id, this.currentUser.id, this.currentUser.token);

        this.currentLobby = null;
        this.stopLobbyPolling();
        this.updateLobbyUI(null);
    }

    async removePlayerFromLobby(userId) {
        const result = await removePlayerFromLobby(this.currentLobby.id, userId, this.currentUser.token);
        if (result) {
            showMessage("Player removed from lobby.", "info");
            this.currentLobby = result;
            this.updateLobbyUI(result);
        } else {
            showMessage("Failed to remove player.", "error");
        }
    }

    async updateProfile(formData) {
        this.currentUser.displayName = formData.get("displayName");
        const success = await updateProfile(this.currentUser);
        if (!success) {
            showMessage("Failed to update profile.", "error");
            return;
        }
        showMessage("Profile updated successfully.", "success");
    }

    hide() {
        this._onlineContainer.classList.add("d-none");
    }

    show() {
        this._onlineContainer.classList.remove("d-none");
    }
}

export default Menu;