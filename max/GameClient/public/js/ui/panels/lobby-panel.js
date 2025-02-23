import {
    createLobby,
    getLobbyById,
    joinLobby,
    leaveLobby,
    removePlayerFromLobby
} from "../../services/lobby.js";
import { HubConnectionBuilder, LogLevel } from "../../../lib/signalr.module.js";
import { showMessage } from "../message-popup.js";


class LobbyPanel {
    /**
     * Creates a new lobby panel.
     * @param {string} lobbyHubUrl - The URL of the SignalR lobby hub.
     */
    constructor(lobbyHubUrl) {
        this._lobbyHubUrl = lobbyHubUrl;

        this._lobbyPanel = document.getElementById("lobbyPanel");
        this._lobbyPreJoin = document.getElementById("lobbyPreJoin");
        this._lobbyInGame = document.getElementById("lobbyInGame");
        this._lobbyCodeDisplay = document.getElementById("lobbyCodeDisplay");
        this._lobbyDetails = document.getElementById("lobbyDetails");
        this._lobbyUserList = document.getElementById("lobbyUserList");
        this._createLobbyBtn = document.getElementById("createLobbyBtn");
        this._joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this._lobbyJoinCode = document.getElementById("lobbyJoinCode");
        this._leaveLobbyBtn = document.getElementById("leaveLobbyBtn");
        this._startGameBtn = document.getElementById("startGameBtn");

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
         * The current user. Set by Menu when the user logs in.
         * @type {User|null}
         * @private
         */
        this._currentUser = null;

        /**
         * Callback to be invoked when the game should start.
         * @type {(user: User, lobby: Lobby) => void}
         */
        this.onGameStart = null;
    }

    /**
     * Sets up the panel event handlers.
     * @returns {this}
     */
    setup() {
        this._createLobbyBtn.addEventListener("click", this._createLobby.bind(this));

        this._joinLobbyBtn.addEventListener("click", async () => {
            const code = this._lobbyJoinCode.value.trim();
            await this._joinLobby(code);
        });

        this._leaveLobbyBtn.addEventListener("click", this.leaveLobby.bind(this));

        this._startGameBtn.addEventListener("click", async () => {
            if (this._lobbyHubConnection && this._currentLobby) {
                // noinspection JSCheckFunctionSignatures
                await this._lobbyHubConnection?.invoke("StartGame", this._currentLobby.id);
            }
        });

        return this;
    }

    /**
     * Handler for a successful login.
     * @param {User} user - The logged-in user.
     */
    onLoginSuccess(user) {
        this._currentUser = user;
    }

    /**
     * Creates a new lobby.
     * @returns {Promise<void>}
     * @private
     */
    async _createLobby() {
        if (!this._currentUser) return;

        const lobbyData = await createLobby(this._currentUser.token);
        if (!lobbyData) {
            showMessage("Failed to create lobby.", "error");
            return;
        }

        this._currentLobby = lobbyData;
        this._updateLobbyUi(lobbyData);

        await this._startLobbyHubConnection(lobbyData.id);

        this._lobbyJoinCode.value = "";
    }

    /**
     * Joins an existing lobby.
     * @param {string} joinCode - The join code provided by the user.
     * @returns {Promise<void>}
     * @private
     */
    async _joinLobby(joinCode) {
        if (!this._currentUser) return;

        const lobbyData = await joinLobby(joinCode, this._currentUser.token);
        if (!lobbyData) {
            showMessage(`Could not find lobby with code "${joinCode}".`, "error");
            return;
        }

        this._currentLobby = lobbyData;
        this._updateLobbyUi(lobbyData);
        this._lobbyJoinCode.value = "";

        await this._startLobbyHubConnection(lobbyData.id);
    }

    /**
     * Starts the lobby hub connection for the provided lobby ID.
     * @param {string} lobbyId - The lobby ID to connect to.
     * @returns {Promise<void>}
     * @private
     */
    async _startLobbyHubConnection(lobbyId) {
        if (this._lobbyHubConnection)
            await this._stopLobbyHubConnection();

        this._lobbyHubConnection = new HubConnectionBuilder()
            .withUrl(this._lobbyHubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        try {
            await this._lobbyHubConnection?.start();
            // noinspection JSCheckFunctionSignatures
            await this._lobbyHubConnection?.invoke("AddToLobbyGroup", lobbyId);
        } catch {
            showMessage("Failed to connect to lobby hub.", "error");
            this._lobbyHubConnection = null;
            return;
        }

        this._lobbyHubConnection?.on("PlayerJoined", async () => {
            const lobbyData = await getLobbyById(lobbyId, this._currentUser.token);
            if (!lobbyData) return;

            this._currentLobby = lobbyData;
            this._updateLobbyUi(lobbyData);
        });

        this._lobbyHubConnection?.on("PlayerLeft", async (userId) => {
            if (userId === this._currentUser.id) {
                this._currentLobby = null;
                await this._stopLobbyHubConnection();
                this._updateLobbyUi(null);
                return;
            }

            const lobbyData = await getLobbyById(lobbyId, this._currentUser.token);
            if (!lobbyData) return;

            this._currentLobby = lobbyData;
            this._updateLobbyUi(lobbyData);
        });

        this._lobbyHubConnection?.on("LobbyDisbanded", async () => {
            this._currentLobby = null;
            await this._stopLobbyHubConnection();
            this._updateLobbyUi(null);
        });

        this._lobbyHubConnection?.on("GameStarted", () => {
            this.onGameStart?.(this._currentUser, this._currentLobby);
        });
    }

    /**
     * Stops the current lobby hub connection.
     * @returns {Promise<void>}
     * @private
     */
    async _stopLobbyHubConnection() {
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
     * @private
     */
    _updateLobbyUi(lobbyData) {
        if (!lobbyData) {
            this._lobbyInGame.classList.add("d-none");
            this._lobbyPreJoin.classList.remove("d-none");
            this._lobbyCodeDisplay.value = "";
            this._lobbyDetails.classList.add("d-none");
            this._lobbyUserList.replaceChildren();
            return;
        }

        this._lobbyPreJoin.classList.add("d-none");
        this._lobbyDetails.classList.remove("d-none");
        this._lobbyInGame.classList.remove("d-none");

        this._lobbyCodeDisplay.value = lobbyData.joinCode;

        /**
         * @param {LobbyUser} user
         * @returns {HTMLLIElement}
         */
        const createPlayerRow = (user) => {
            const li = document.createElement("li");
            li.textContent = user.displayName || user.username;

            if (user.id === lobbyData.hostId) {
                li.classList.add("host");
                li.textContent += " [Host]";
                return li;
            }

            if (!this._currentUser || this._currentUser.id !== lobbyData.hostId)
                return li;

            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.style.marginLeft = "auto";
            removeBtn.addEventListener("click", async () => await this._removePlayerFromLobby(user.id));

            return li;
        };

        this._lobbyUserList.replaceChildren(
            createPlayerRow(lobbyData.users.find(u => u.id === lobbyData.hostId)),
            ...lobbyData.users
                .filter(u => u.id !== lobbyData.hostId)
                .map(createPlayerRow)
        );

        this._startGameBtn.classList.toggle(
            "d-none",
            !this._currentUser || this._currentUser.id !== lobbyData.hostId || lobbyData.users.length < 2
        );
    }

    /**
     * Leaves the current lobby
     * @returns {Promise<void>}
     */
    async leaveLobby() {
        if (!this._currentLobby) return;

        await leaveLobby(this._currentLobby.id, this._currentUser.id, this._currentUser.token);
        this._currentLobby = null;
        await this._stopLobbyHubConnection();
        this._updateLobbyUi(null);
    }

    /**
     * Removes a player from the current lobby.
     * @param {string} userId - The user ID to remove.
     * @returns {Promise<void>}
     * @private
     */
    async _removePlayerFromLobby(userId) {
        if (!this._currentLobby) return;

        const result = await removePlayerFromLobby(this._currentLobby.id, userId, this._currentUser.token);
        if (result) {
            showMessage("Player removed from lobby.", "info");
            this._currentLobby = result;
            this._updateLobbyUi(result);
        } else showMessage("Failed to remove player.", "error");
    }

    /**
     * Shows the panel container.
     * @returns {this}
     */
    show() {
        this._lobbyPanel.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the panel container.
     * @returns {this}
     */
    hide() {
        this._lobbyPanel.classList.add("d-none");
        return this;
    }
}

export default LobbyPanel;