import {User} from "../models/user.js";
import {BaseUrl, SessionCookie} from "../constants.js";
import {clearCookie} from "../ui/util/cookies.js";

const authBaseUrl = `${BaseUrl}/auth`;

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User|null>}
 */
export const loginUser = async (username, password) => {
    try{
        const response = await fetch(`${authBaseUrl}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) return null;

        const {
            user,
            expiresAt,
        } = await response.json();

        return new User(user.id, user.username, user.displayName, user.roles, new Date(expiresAt));
    }
    catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * @returns {Promise<User|null>}
 */
export const fetchUser = async () => {
    try {
        const response = await fetch(`${authBaseUrl}/me`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) return null;

        const {
            user,
            expiresAt,
        } = await response.json();

        return new User(user.id, user.username, user.displayName, user.roles, new Date(expiresAt));
    } catch (error) {
        console.error(error);
        return null;
    }
}

/**
 * @returns {Promise<boolean>}
 */
export const logoutUser = async () => {
    try{
        const response = await fetch(`${authBaseUrl}/logout`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
        });

        clearCookie(SessionCookie);

        return response.ok;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * @param {string} username
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const signupUser = async (username, password, displayName) => {
    const response = await fetch(`${authBaseUrl}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, displayName }),
    });

    if (!response.ok)
        switch (response.status) {
            case 400:
                return {success: false, error: "Invalid request."};
            case 409:
                return {success: false, error: "Username already exists."};
            default:
                return {success: false, error: "An unknown error occurred."};
        }

    return { success: true };
}

/**
 * @param {User} user
 * @returns {Promise<boolean>}
 */
export const updateProfile = async (user) => {
    try {
        const response = await fetch(`${authBaseUrl}/me`, {
            method: "PUT",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ displayName: user.displayName }),
        });

        return response.ok;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};