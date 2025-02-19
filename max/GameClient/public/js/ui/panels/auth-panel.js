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
     * Sets up the panel event handlers.
     */
    setupUi() {
        this._toggleAuthButton.addEventListener("click", (e) => {
            e.preventDefault();
            this.setSignUpMode(!this._isSignUpMode);
        });

        this._authForm.addEventListener("submit", async (e) => {
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

                this.onLoginSuccess?.(user);
            } catch (err) {
                showMessage(err.message || "Authentication failed.", "error");
            }
        });
    }

    /**
     * Shows the panel container.
     */
    show() {
        this._authPanel.classList.remove("d-none");
    }

    /**
     * Hides the panel container.
     */
    hide() {
        this._authPanel.classList.add("d-none");
    }
}

export default AuthPanel;