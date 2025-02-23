import { loginUser, signupUser } from "../../services/auth.js";
import { showMessage } from "../message-popup.js";


class AuthPanel {
    constructor() {
        this._authPanel = document.getElementById("authPanel");
        this._authForm = document.getElementById("authForm");
        this._authPageTitle = document.getElementById("authPageTitle");
        this._authSubmitButton = document.getElementById("authSubmitButton");
        this._toggleAuthButton = document.getElementById("toggleAuthButton");
        this._toggleAuthText = document.getElementById("toggleAuthText");
        this._signUpOnlyFields = document.querySelectorAll(".sign-up-only");

        this._isSignUpMode = false;

        /**
         * Callback to be invoked when authentication is successful.
         * Expected to be set by the Menu orchestrator.
         * @type {(user: User) => void}
         */
        this.onLoginSuccess = null;
    }

    /**
     * Sets up the panel event handlers.
     * @returns {this}
     */
    setup() {
        this._toggleAuthButton.addEventListener("click", this._onToggleAuthButtonClicked.bind(this));
        this._authForm.addEventListener("submit", this._onAuthFormSubmit.bind(this));

        return this;
    }

    /**
     * Handles the toggle auth button click event.
     * @param {MouseEvent} e - The click event.
     * @private
     */
    _onToggleAuthButtonClicked(e) {
        e.preventDefault();
        this._setSignUpMode(!this._isSignUpMode);
    }

    /**
     * Handles the form submission event.
     * @param {SubmitEvent} e - The form submission event.
     * @private
     */
    async _onAuthFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this._authForm);
        const username = formData.get("username");
        const password = formData.get("password");

        try {
            if (this._isSignUpMode) {
                const displayName = formData.get("displayNameSignup");
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
                showMessage("Registration successful. Please log in.", "success");
                this._setSignUpMode(false);
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

            this.onLoginSuccess?.(user);

            this._authForm.reset();
        } catch (err) {
            showMessage(err.message || "Authentication failed.", "error");
        }
    }

    /**
     * Sets the sign-up mode for the authentication form.
     * @param {boolean} isSignUpMode - True to show the sign-up form; false to show the login form.
     * @private
     */
    _setSignUpMode(isSignUpMode) {
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
     * Shows the panel container.
     * @returns {this}
     */
    show() {
        this._authPanel.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the panel container.
     * @returns {this}
     */
    hide() {
        this._authPanel.classList.add("d-none");
        return this;
    }
}

export default AuthPanel;