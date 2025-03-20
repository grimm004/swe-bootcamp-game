import AuthPanel from "./panels/auth-panel.js";
import LobbyPanel from "./panels/lobby-panel.js";
import ProfilePanel from "./panels/profile-panel.js";
import { logoutUser } from "../services/auth.js";


class Menu {
    /**
     * The global current user.
     * @type {User|null}
     */
    #currentUser;

    #authPanel;
    #lobbyPanel;
    #profilePanel;

    #menuContainer;
    #navButtons;
    #logoutButton;

    /**
     * Creates a new menu.
     * @param {string} lobbyHubUrl - The URL of the lobby hub.
     */
    constructor(lobbyHubUrl) {
        this.#currentUser = null;

        this.#authPanel = new AuthPanel();
        this.#lobbyPanel = new LobbyPanel(lobbyHubUrl);
        this.#profilePanel = new ProfilePanel();

        this.#menuContainer = document.getElementById("menuContainer");
        this.#navButtons = document.querySelectorAll(".online-nav .nav-btn");
        this.#logoutButton = document.getElementById("logoutButton");

        /**
         * Callback that the main module can assign to start the game.
         * @type {(user: User, lobby: Lobby|null) => void}
         */
        this.onGameStart = null;

        this.#lobbyPanel.onGameStart = (user, lobby) => this.onGameStart?.(user, lobby);

        this.#authPanel.onLoginSuccess = (user) => {
            this.#currentUser = user;
            this.#authPanel.hide();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.remove("d-none");
            this.#lobbyPanel.onLoginSuccess(user);
            this.#profilePanel.onLoginSuccess(user);
            this.#lobbyPanel.show();
        };
    }

    /**
     * Sets up the UI event handlers.
     * @returns {Menu}
     */
    setup() {
        this.#authPanel.setup();
        this.#lobbyPanel.setup();
        this.#profilePanel.setup();

        this.#navButtons.forEach((btn) =>
            btn.addEventListener("click", () => {
                this.#lobbyPanel.hide();
                this.#profilePanel.hide();

                const targetPanel = btn.getAttribute("data-target");
                if (targetPanel)
                    document.getElementById(targetPanel).classList.remove("d-none");
            }));

        this.#logoutButton.addEventListener("click", async () => {
            await this.#lobbyPanel.leaveLobby();

            if (this.#currentUser) {
                await logoutUser();
                this.#currentUser = null;
            }

            this.#lobbyPanel.hide();
            this.#profilePanel.hide();
            this.#authPanel.show();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.add("d-none");
        });

        return this;
    }

    /**
     * Attempts to automatically log in the user.
     * @returns {Promise<void>}
     */
    async attemptAutoLogin() {
        await this.#authPanel.attemptAutoLogin();
    }

    /**
     * Shows the menu container.
     * @returns {this}
     */
    show() {
        this.#menuContainer.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the menu container.
     * @returns {this}
     */
    hide() {
        this.#menuContainer.classList.add("d-none");
        return this;
    }
}

export default Menu;