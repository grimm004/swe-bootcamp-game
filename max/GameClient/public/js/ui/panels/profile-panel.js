import { updateProfile } from "../../services/auth.js";
import { showMessage } from "../message-popup.js";


class ProfilePanel {
    #profilePanel;
    #profileForm;
    #displayNameInput;

    /**
     * The current user. This should be updated by Menu.
     * @type {User|null}
     */
    #currentUser;

    constructor() {
        this.#profilePanel = document.getElementById("profilePanel");
        this.#profileForm = document.getElementById("profileForm");
        this.#displayNameInput = this.#profileForm.querySelector("input[name='displayName']");
    }

    /**
     * Sets up the panel event handlers.
     * @returns {this}
     */
    setup() {
        this.#profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!this.#currentUser) return;

            this.#currentUser.displayName = this.#displayNameInput.value;

            const success = await updateProfile(this.#currentUser);
            if (!success) {
                showMessage("Failed to update profile.", "error");
                return;
            }

            showMessage("Profile updated successfully.", "success");
        });

        return this;
    }

    /**
     * Set the profile UI values based on the current user.
     * @param {User} user
     */
    onLoginSuccess(user) {
        this.#currentUser = user;
        if (this.#displayNameInput) {
            this.#displayNameInput.value = user.displayName;
        }
    }

    /**
     * Shows the panel container.
     * @returns {this}
     */
    show() {
        this.#profilePanel.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the panel container.
     * @returns {this}
     */
    hide() {
        this.#profilePanel.classList.add("d-none");
        return this;
    }
}

export default ProfilePanel;