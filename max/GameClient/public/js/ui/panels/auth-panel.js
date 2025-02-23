import { loginUser, signupUser } from "../../services/auth.js";
import { showMessage } from "../message-popup.js";


class AuthPanel {
    #authPanel;
    #authForm;
    #authPageTitle;
    #authSubmitButton;
    #toggleAuthButton;
    #toggleAuthText;
    #signUpOnlyFields;

    #isSignUpMode;

    /**
     * Creates a new authentication panel.
     */
    constructor() {
        this.#authPanel = document.getElementById("authPanel");
        this.#authForm = document.getElementById("authForm");
        this.#authPageTitle = document.getElementById("authPageTitle");
        this.#authSubmitButton = document.getElementById("authSubmitButton");
        this.#toggleAuthButton = document.getElementById("toggleAuthButton");
        this.#toggleAuthText = document.getElementById("toggleAuthText");
        this.#signUpOnlyFields = document.querySelectorAll(".sign-up-only");

        this.#isSignUpMode = false;

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
        this.#toggleAuthButton.addEventListener("click", this.#onToggleAuthButtonClicked.bind(this));
        this.#authForm.addEventListener("submit", this.#onAuthFormSubmit.bind(this));

        return this;
    }

    /**
     * Handles the toggle auth button click event.
     * @param {MouseEvent} e - The click event.
     */
    #onToggleAuthButtonClicked(e) {
        e.preventDefault();
        this.#setSignUpMode(!this.#isSignUpMode);
    }

    /**
     * Handles the form submission event.
     * @param {SubmitEvent} e - The form submission event.
     */
    async #onAuthFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.#authForm);
        const username = formData.get("username");
        const password = formData.get("password");

        try {
            if (this.#isSignUpMode) {
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
                this.#setSignUpMode(false);
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

            this.#authForm.reset();
        } catch (err) {
            showMessage(err.message || "Authentication failed.", "error");
        }
    }

    /**
     * Sets the sign-up mode for the authentication form.
     * @param {boolean} isSignUpMode - True to show the sign-up form; false to show the login form.
     */
    #setSignUpMode(isSignUpMode) {
        if (isSignUpMode) {
            this.#authPageTitle.innerText = "Sign Up";
            this.#authSubmitButton.innerText = "Sign Up";
            this.#toggleAuthButton.innerText = "Log In";
            this.#toggleAuthText.innerText = "Already have an account?";
            this.#signUpOnlyFields.forEach((el) => {
                el.classList.remove("collapsed");
                el.classList.add("expanded");
                const input = el.querySelector("input");
                if (input) {
                    input.disabled = false;
                }
            });
        } else {
            this.#authPageTitle.innerText = "Log In";
            this.#authSubmitButton.innerText = "Log In";
            this.#toggleAuthButton.innerText = "Sign Up";
            this.#toggleAuthText.innerText = "Don't have an account?";
            this.#signUpOnlyFields.forEach((el) => {
                el.classList.remove("expanded");
                el.classList.add("collapsed");
                const input = el.querySelector("input");
                if (input) {
                    input.disabled = true;
                }
            });
        }
        this.#isSignUpMode = isSignUpMode;
    }

    /**
     * Shows the panel container.
     * @returns {this}
     */
    show() {
        this.#authPanel.classList.remove("d-none");
        return this;
    }

    /**
     * Hides the panel container.
     * @returns {this}
     */
    hide() {
        this.#authPanel.classList.add("d-none");
        return this;
    }
}

export default AuthPanel;