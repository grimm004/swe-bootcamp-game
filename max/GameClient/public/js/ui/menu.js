import AuthPanel from "./panels/auth-panel.js";
import LobbyPanel from "./panels/lobby-panel.js";
import ProfilePanel from "./panels/profile-panel.js";
import { logoutUser } from "../services/auth.js";


class Menu {
    constructor() {
        this._menuContainer = document.getElementById("menuContainer");
        this._navButtons = document.querySelectorAll(".online-nav .nav-btn");
        this._logoutButton = document.getElementById("logoutButton");

        /**
         * The global current user.
         * @type {User|null}
         */
        this.currentUser = null;

        this.authPanel = new AuthPanel();
        this.lobbyPanel = new LobbyPanel();
        this.profilePanel = new ProfilePanel();

        /**
         * Callback that the main module can assign to start the game.
         * @type {(user: User) => void}
         */
        this.onGameStart = null;

        this.lobbyPanel.onGameStart = (user) => this.onGameStart?.(user);

        this.authPanel.onLoginSuccess = (user) => {
            this.currentUser = user;
            this.authPanel.hide();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.remove("d-none");
            this.lobbyPanel.show();
            this.lobbyPanel.currentUser = user;
            this.profilePanel.setProfile(user);
        };
    }

    /**
     * Sets up the UI event handlers.
     */
    setupUi() {
        this.authPanel.setupUi();
        this.lobbyPanel.setupUi();
        this.profilePanel.setupUi();

        // Navigation between Lobby and Profile panels.
        this._navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                // Hide both panels, then show the target.
                this.lobbyPanel.hide();
                this.profilePanel.hide();
                const targetPanel = btn.getAttribute("data-target");
                if (targetPanel) {
                    document.getElementById(targetPanel).classList.remove("d-none");
                }
            });
        });

        this._logoutButton.addEventListener("click", async () => {
            // Stop lobby hub and leave lobby if needed.
            await this.lobbyPanel.stopLobbyHubConnection();
            if (this.lobbyPanel._currentLobby) {
                await this.lobbyPanel.leaveLobby();
                this.lobbyPanel._currentLobby = null;
                this.lobbyPanel.updateLobbyUi(null);
            }
            if (this.currentUser) {
                await logoutUser(this.currentUser);
                this.currentUser = null;
            }
            // Hide panels and show the auth panel.
            this.lobbyPanel.hide();
            this.profilePanel.hide();
            this.authPanel.show();
            const nav = document.querySelector(".online-nav");
            if (nav) nav.classList.add("d-none");
        });
    }

    /**
     * Shows the menu container.
     */
    show() {
        this._menuContainer.classList.remove("d-none");
    }

    /**
     * Hides the menu container.
     */
    hide() {
        this._menuContainer.classList.add("d-none");
    }
}

export default Menu;