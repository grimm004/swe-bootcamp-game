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
    #lobbyHubUrl;

    #lobbyPanel;
    #lobbyPreJoin;
    #lobbyInGame;
    #lobbyCodeDisplay;
    #lobbyDetails;
    #lobbyUserList;
    #createLobbyBtn;
    #joinLobbyBtn;
    #lobbyJoinCode;
    #leaveLobbyBtn;
    #startGameBtn;

    /**
     * @type {Lobby|null}
     */
    #currentLobby = null;
    /**
     * @type {HubConnection|null}
     */
    #lobbyHubConnection = null;
    /**
     * The current user. Set by Menu when the user logs in.
     * @type {User|null}
     */
    #currentUser = null;

    /**
     * Creates a new lobby panel.
     * @param {string} lobbyHubUrl - The URL of the SignalR lobby hub.
     */
    constructor(lobbyHubUrl) {
        this.#lobbyHubUrl = lobbyHubUrl;

        this.#lobbyPanel = document.getElementById("lobbyPanel");
        this.#lobbyPreJoin = document.getElementById("lobbyPreJoin");
        this.#lobbyInGame = document.getElementById("lobbyInGame");
        this.#lobbyCodeDisplay = document.getElementById("lobbyCodeDisplay");
        this.#lobbyDetails = document.getElementById("lobbyDetails");
        this.#lobbyUserList = document.getElementById("lobbyUserList");
        this.#createLobbyBtn = document.getElementById("createLobbyBtn");
        this.#joinLobbyBtn = document.getElementById("joinLobbyBtn");
        this.#lobbyJoinCode = document.getElementById("lobbyJoinCode");
        this.#leaveLobbyBtn = document.getElementById("leaveLobbyBtn");
        this.#startGameBtn = document.getElementById("startGameBtn");

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
        this.#createLobbyBtn.addEventListener("click", this.#createLobby.bind(this));

        this.#joinLobbyBtn.addEventListener("click", async () => {
            const code = this.#lobbyJoinCode.value.trim();
            await this.#joinLobby(code);
        });

        this.#leaveLobbyBtn.addEventListener("click", this.leaveLobby.bind(this));

        this.#startGameBtn.addEventListener("click", async () => {
            if (this.#lobbyHubConnection && this.#currentLobby) {
                // noinspection JSCheckFunctionSignatures
                await this.#lobbyHubConnection?.invoke("StartGame", this.#currentLobby.id);
            }
        });

        return this;
    }

    /**
     * Handler for a successful login.
     * @param {User} user - The logged-in user.
     */
    onLoginSuccess(user) {
        this.#currentUser = user;
    }

    /**
     * Creates a new lobby.
     * @returns {Promise<void>}
     */
    async #createLobby() {
        if (!this.#currentUser) return;

        const lobbyData = await createLobby(this.#currentUser.token);
        if (!lobbyData) {
            showMessage("Failed to create lobby.", "error");
            return;
        }

        this.#currentLobby = lobbyData;
        this.#updateLobbyUi(lobbyData);

        await this.#startLobbyHubConnection(lobbyData.id);

        this.#lobbyJoinCode.value = "";
    }

    /**
     * Joins an existing lobby.
     * @param {string} joinCode - The join code provided by the user.
     * @returns {Promise<void>}
     */
    async #joinLobby(joinCode) {
        if (!this.#currentUser) return;

        const lobbyData = await joinLobby(joinCode, this.#currentUser.token);
        if (!lobbyData) {
            showMessage(`Could not find lobby with code "${joinCode}".`, "error");
            return;
        }

        this.#currentLobby = lobbyData;
        this.#updateLobbyUi(lobbyData);
        this.#lobbyJoinCode.value = "";

        await this.#startLobbyHubConnection(lobbyData.id);
    }

    /**
     * Starts the lobby hub connection for the provided lobby ID.
     * @param {string} lobbyId - The lobby ID to connect to.
     * @returns {Promise<void>}
     */
    async #startLobbyHubConnection(lobbyId) {
        if (this.#lobbyHubConnection)
            await this.#stopLobbyHubConnection();

        this.#lobbyHubConnection = new HubConnectionBuilder()
            .withUrl(this.#lobbyHubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        try {
            await this.#lobbyHubConnection?.start();
            // noinspection JSCheckFunctionSignatures
            await this.#lobbyHubConnection?.invoke("AddToLobbyGroup", lobbyId);
        } catch {
            showMessage("Failed to connect to lobby hub.", "error");
            this.#lobbyHubConnection = null;
            return;
        }

        this.#lobbyHubConnection?.on("PlayerJoined", async () => {
            const lobbyData = await getLobbyById(lobbyId, this.#currentUser.token);
            if (!lobbyData) return;

            this.#currentLobby = lobbyData;
            this.#updateLobbyUi(lobbyData);
        });

        this.#lobbyHubConnection?.on("PlayerLeft", async (userId) => {
            if (userId === this.#currentUser.id) {
                this.#currentLobby = null;
                await this.#stopLobbyHubConnection();
                this.#updateLobbyUi(null);
                return;
            }

            const lobbyData = await getLobbyById(lobbyId, this.#currentUser.token);
            if (!lobbyData) return;

            this.#currentLobby = lobbyData;
            this.#updateLobbyUi(lobbyData);
        });

        this.#lobbyHubConnection?.on("LobbyDisbanded", async () => {
            this.#currentLobby = null;
            await this.#stopLobbyHubConnection();
            this.#updateLobbyUi(null);
        });

        this.#lobbyHubConnection?.on("GameStarted", () => {
            this.onGameStart?.(this.#currentUser, this.#currentLobby);
        });
    }

    /**
     * Stops the current lobby hub connection.
     * @returns {Promise<void>}
     */
    async #stopLobbyHubConnection() {
        if (!this.#lobbyHubConnection) return;

        try {
            await this.#lobbyHubConnection?.stop();
        } catch {
            // Ignore errors.
        }

        this.#lobbyHubConnection = null;
    }

    /**
     * Updates the lobby UI with the provided lobby data.
     * @param {Lobby|null} lobbyData - The lobby data to display.
     */
    #updateLobbyUi(lobbyData) {
        if (!lobbyData) {
            this.#lobbyInGame.classList.add("d-none");
            this.#lobbyPreJoin.classList.remove("d-none");
            this.#lobbyCodeDisplay.value = "";
            this.#lobbyDetails.classList.add("d-none");
            this.#lobbyUserList.replaceChildren();
            return;
        }

        this.#lobbyPreJoin.classList.add("d-none");
        this.#lobbyDetails.classList.remove("d-none");
        this.#lobbyInGame.classList.remove("d-none");

        this.#lobbyCodeDisplay.value = lobbyData.joinCode;

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

            if (!this.#currentUser || this.#currentUser.id !== lobbyData.hostId)
                return li;

            const removeBtn = document.createElement("button");
            removeBtn.innerText = "Remove";
            removeBtn.style.marginLeft = "auto";
            removeBtn.addEventListener("click", async () => await this.#removePlayerFromLobby(user.id));

            return li;
        };

        this.#lobbyUserList.replaceChildren(
            createPlayerRow(lobbyData.users.find(u => u.id === lobbyData.hostId)),
            ...lobbyData.users
                .filter(u => u.id !== lobbyData.hostId)
                .map(createPlayerRow)
        );

        this.#startGameBtn.classList.toggle(
            "d-none",
            !this.#currentUser || this.#currentUser.id !== lobbyData.hostId || lobbyData.users.length < 2
        );
    }

    /**
     * Leaves the current lobby
     * @returns {Promise<void>}
     */
    async leaveLobby() {
        if (!this.#currentLobby) return;

        await leaveLobby(this.#currentLobby.id, this.#currentUser.id, this.#currentUser.token);
        this.#currentLobby = null;
        await this.#stopLobbyHubConnection();
        this.#updateLobbyUi(null);
    }

    /**
     * Removes a player from the current lobby.
     * @param {string} userId - The user ID to remove.
     * @returns {Promise<void>}
     */
    async #removePlayerFromLobby(userId) {
        if (!this.#currentLobby) return;

        const result = await removePlayerFromLobby(this.#currentLobby.id, userId, this.#currentUser.token);
        if (result) {
            showMessage("Player removed from lobby.", "info");
            this.#currentLobby = result;
            this.#updateLobbyUi(result);
        } else showMessage("Failed to remove player.", "error");
    }

    /**
     * Shows the panel container.
     * @returns {this}
     */
    show() {
        this.#lobbyPanel.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the panel container.
     * @returns {this}
     */
    hide() {
        this.#lobbyPanel.classList.add("d-none");
        return this;
    }
}

export default LobbyPanel;