import AuthPanel from "./panels/auth-panel.js";
import LobbyPanel from "./panels/lobby-panel.js";
import ProfilePanel from "./panels/profile-panel.js";
import { logoutUser } from "../services/auth.js";


class Menu {
    /**
     * Creates a new menu.
     * @param {string} lobbyHubUrl - The URL of the lobby hub.
     */
    constructor(lobbyHubUrl) {
        this._menuContainer = document.getElementById("menuContainer");
        this._navButtons = document.querySelectorAll(".online-nav .nav-btn");
        this._logoutButton = document.getElementById("logoutButton");

        /**
         * The global current user.
         * @type {User|null}
         * @private
         */
        this._currentUser = null;

        this._authPanel = new AuthPanel();
        this._lobbyPanel = new LobbyPanel(lobbyHubUrl);
        this._profilePanel = new ProfilePanel();

        /**
         * Callback that the main module can assign to start the game.
         * @type {(user: User, lobby: Lobby) => void}
         */
        this.onGameStart = null;

        this._lobbyPanel.onGameStart = (user, lobby) => this.onGameStart?.(user, lobby);

        this._authPanel.onLoginSuccess = (user) => {
            this._currentUser = user;
            this._authPanel.hide();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.remove("d-none");
            this._lobbyPanel.onLoginSuccess(user);
            this._profilePanel.onLoginSuccess(user);
            this._lobbyPanel.show();
        };
    }

    /**
     * Sets up the UI event handlers.
     * @returns {Menu}
     */
    setup() {
        this._authPanel.setup();
        this._lobbyPanel.setup();
        this._profilePanel.setup();

        this._navButtons.forEach((btn) =>
            btn.addEventListener("click", () => {
                this._lobbyPanel.hide();
                this._profilePanel.hide();

                const targetPanel = btn.getAttribute("data-target");
                if (targetPanel)
                    document.getElementById(targetPanel).classList.remove("d-none");
            }));

        this._logoutButton.addEventListener("click", async () => {
            await this._lobbyPanel.leaveLobby();

            if (this._currentUser) {
                await logoutUser(this._currentUser);
                this._currentUser = null;
            }

            this._lobbyPanel.hide();
            this._profilePanel.hide();
            this._authPanel.show();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.add("d-none");
        });

        return this;
    }

    /**
     * Shows the menu container.
     * @returns {this}
     */
    show() {
        this._menuContainer.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the menu container.
     * @returns {this}
     */
    hide() {
        this._menuContainer.classList.add("d-none");
        return this;
    }
}

export default Menu;