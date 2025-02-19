import { loginUser, logoutUser, signupUser, updateProfile } from "../services/auth.js";
import { showMessage } from "../message-popup.js";
import {
    createLobby,
    getLobbyById,
    joinLobby,
    leaveLobby,
    removePlayerFromLobby
} from "../services/lobby.js";
import {HubConnectionBuilder, LogLevel} from "../../lib/signalr.module.js";

class Menu {
    constructor() {
        this._menuContainer = document.getElementById("menuContainer");

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

        /**
         * @type {User|null}
         * @private
         */
        this._currentUser = null;
        /**
         * @type {Lobby|null}
         * @private
         */
        this._currentLobby = null;

        /**
         * @type {HubConnection|null}
         * @private
         */
        this._lobbyHubConnection = null;

        /**
         * Callback that the main module can assign to start the game.
         * @type {(user: User) => void}
         */
        this.onGameStart = null;
    }

    /**
     * Sets the sign-up mode for the authentication form.
     * @param {boolean} isSignUpMode - True to show the sign-up form; false to show the login form.
     */
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

    /**
     * Sets up the UI event handlers.
     */
    setupUi() {
        this._toggleAuthButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.setSignUpMode(!this._isSignUpMode);
        });

        document.getElementById("startGameBtn").addEventListener(
            "click", async () => await this._lobbyHubConnection?.invoke("StartGame", this._currentLobby.id));

        document.getElementById("leaveLobbyBtn").addEventListener(
            "click", async () => await this.leaveLobby());

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

                    const signUpResult = await signupUser(username, password, displayName);
                    if (!signUpResult.success) {
                        showMessage(`Failed to register: ${signUpResult.error}`, "error");
                        return;
                    }

                    this.setSignUpMode(false);
                    return;
                }

                const user = await loginUser(username, password);

                if (!user) {
                    showMessage("Invalid username or password.", "error");
                    return;
                }

                if (!user.roles?.includes("player")) {
                    showMessage("Access Denied: You are not authorised to view the game.", "error");
                    return;
                }

                this._currentUser = user;
                this._authPanel.classList.add("d-none");
                const nav = document.querySelector(".online-nav");
                if (nav) nav.classList.remove("d-none");
                this._lobbyPanel.classList.remove("d-none");
                this._profileForm.querySelector("input[name='displayName']").value = user.displayName;
            } catch (err) {
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
            await this.stopLobbyHubConnection();

            if (this._currentLobby) {
                await this.leaveLobby();
                this._currentLobby = null;
                this.updateLobbyUI(null);
            }

            if (this._currentUser) {
                await logoutUser(this._currentUser);
                this._currentUser = null;
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

    /**
     * Creates a new lobby.
     * @returns {Promise<void>}
     */
    async createLobby() {
        const lobbyData = await createLobby(this._currentUser.token);
        if (!lobbyData) {
            showMessage("Failed to create lobby.", "error");
            return;
        }

        this._currentLobby = lobbyData;
        this.updateLobbyUI(lobbyData);

        // Start SignalR connection to lobby hub.
        await this.startLobbyHubConnection(lobbyData.id);
    }

    /**
     * Joins an existing lobby.
     * @param {string} joinCode - The join code provided by the user.
     * @returns {Promise<void>}
     */
    async joinLobby(joinCode) {
        const lobbyData = await joinLobby(joinCode, this._currentUser.token);
        if (!lobbyData) {
            showMessage(`Could not find lobby with code "${joinCode}".`, "error");
            return;
        }

        this._currentLobby = lobbyData;
        this.updateLobbyUI(lobbyData);

        // Connect to the lobby hub.
        await this.startLobbyHubConnection(lobbyData.id);
    }

    async startLobbyHubConnection(lobbyId) {
        if (this._lobbyHubConnection)
            await this.stopLobbyHubConnection();

        this._lobbyHubConnection = new HubConnectionBuilder()
            .withUrl("/hubs/v1/lobby")
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        try {
            await this._lobbyHubConnection?.start();
            await this._lobbyHubConnection?.invoke("AddToLobbyGroup", lobbyId);
        } catch {
            this._lobbyHubConnection = null;
            return;
        }

        this._lobbyHubConnection?.on("PlayerJoined", async () => {
            const lobbyData = await getLobbyById(lobbyId, this._currentUser.token);
            if (!lobbyData) return;

            this._currentLobby = lobbyData;
            this.updateLobbyUI(lobbyData);
        });

        this._lobbyHubConnection?.on("PlayerLeft", async (userId) => {
            if (userId === this._currentUser.id) {
                this._currentLobby = null;
                await this.stopLobbyHubConnection();
                this.updateLobbyUI(null);
                return;
            }

            const lobbyData = await getLobbyById(lobbyId, this._currentUser.token);
            if (!lobbyData) return;

            this._currentLobby = lobbyData;
            this.updateLobbyUI(lobbyData);
        });

        this._lobbyHubConnection?.on("LobbyDisbanded", async () => {
            this._currentLobby = null;
            await this.stopLobbyHubConnection();
            this.updateLobbyUI(null);
        });

        this._lobbyHubConnection?.on("GameStarted", () => {
            this.onGameStart?.(this._currentUser);
        });
    }

    async stopLobbyHubConnection() {
        if (!this._lobbyHubConnection) return;

        try {
            await this._lobbyHubConnection?.stop();
        } catch {
            // Ignore errors.
        }

        this._lobbyHubConnection = null;
    }

    /**
     * Updates the lobby UI with the provided lobby data.
     * @param {Lobby|null} lobbyData - The lobby data to display.
     */
    updateLobbyUI(lobbyData) {
        if (!lobbyData) {
            document.getElementById("lobbyInGame").classList.add("d-none");
            document.getElementById("lobbyPreJoin").classList.remove("d-none");
            document.getElementById("lobbyCodeDisplay").value = "";
            this._lobbyDetails.classList.add("d-none");
            this._lobbyUserList.innerHTML = "";
            return;
        }

        document.getElementById("lobbyPreJoin").classList.add("d-none");
        this._lobbyDetails.classList.remove("d-none");
        document.getElementById("lobbyInGame").classList.remove("d-none");

        document.getElementById("lobbyCodeDisplay").value = lobbyData.joinCode;

        this._lobbyUserList.innerHTML = "";
        for (let user of lobbyData.users) {
            const li = document.createElement("li");

            li.textContent = user.displayName || user.username;

            if (user.id === lobbyData.hostId) {
                li.classList.add("host");
                li.textContent += " (Host)";
            }
            else if (this._currentUser && this._currentUser.id === lobbyData.hostId) {
                const removeBtn = document.createElement("button");
                removeBtn.innerText = "Remove";
                removeBtn.style.marginLeft = "auto";
                removeBtn.addEventListener("click", async () => await this.removePlayerFromLobby(user.id));
                li.appendChild(removeBtn);
            }

            this._lobbyUserList.appendChild(li);
        }

        if (this._currentUser && this._currentUser.id === lobbyData.hostId && lobbyData.users.length >= 2) {
            document.getElementById("startGameBtn").classList.remove("d-none");
        } else {
            document.getElementById("startGameBtn").classList.add("d-none");
        }
    }

    /**
     * Leaves the current lobby
     * @returns {Promise<void>}
     */
    async leaveLobby() {
        if (!this._currentLobby) return;

        await leaveLobby(this._currentLobby.id, this._currentUser.id, this._currentUser.token);

        this._currentLobby = null;
        await this.stopLobbyHubConnection();
        this.updateLobbyUI(null);
    }

    /**
     * Removes a player from the current lobby.
     * @param {string} userId - The user ID to remove.
     * @returns {Promise<void>}
     */
    async removePlayerFromLobby(userId) {
        const result = await removePlayerFromLobby(this._currentLobby.id, userId, this._currentUser.token);
        if (result) {
            showMessage("Player removed from lobby.", "info");
            this._currentLobby = result;
            this.updateLobbyUI(result);
        } else {
            showMessage("Failed to remove player.", "error");
        }
    }

    /**
     * Updates the current user's profile.
     * @param {FormData} formData - The form data to update the profile with.
     * @returns {Promise<void>}
     */
    async updateProfile(formData) {
        this._currentUser.displayName = formData.get("displayName");
        const success = await updateProfile(this._currentUser);
        if (!success) {
            showMessage("Failed to update profile.", "error");
            return;
        }
        showMessage("Profile updated successfully.", "success");
    }

    /**
     * Hides the online container.
     */
    hide() {
        this._menuContainer.classList.add("d-none");
    }

    /**
     * Shows the online container.
     */
    show() {
        this._menuContainer.classList.remove("d-none");
    }
}

export default Menu;