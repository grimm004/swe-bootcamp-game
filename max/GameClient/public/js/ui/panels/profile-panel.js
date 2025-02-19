import { updateProfile } from "../../services/auth.js";
import { showMessage } from "../message-popup.js";


class ProfilePanel {
    constructor() {
        this._profilePanel = document.getElementById("profilePanel");
        this._profileForm = document.getElementById("profileForm");
        this._displayNameInput = this._profileForm.querySelector("input[name='displayName']");

        /**
         * The current user. This should be updated by Menu.
         * @type {User|null}
         */
        this._currentUser = null;
    }

    /**
     * Sets up the panel event handlers.
     */
    setupUi() {
        this._profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!this._currentUser) return;

            this._currentUser.displayName = this._displayNameInput.value;

            const success = await updateProfile(this._currentUser);
            if (!success) {
                showMessage("Failed to update profile.", "error");
                return;
            }

            showMessage("Profile updated successfully.", "success");
        });
    }

    /**
     * Set the profile UI values based on the current user.
     * @param {User} user
     */
    onLoginSuccess(user) {
        this._currentUser = user;
        if (this._displayNameInput) {
            this._displayNameInput.value = user.displayName;
        }
    }

    /**
     * Shows the panel container.
     */
    show() {
        this._profilePanel.classList.remove("d-none");
    }

    /**
     * Hides the panel container.
     */
    hide() {
        this._profilePanel.classList.add("d-none");
    }
}

export default ProfilePanel;