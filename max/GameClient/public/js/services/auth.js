const baseUrl = "/api/v1";
const authBaseUrl = `${baseUrl}/auth`;

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
            token,
            expiresAt,
        } = await response.json();

        return new User(user.id, user.username, user.displayName, user.roles, token, new Date(expiresAt));
    }
    catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * @param {User} user
 * @returns {Promise<boolean>}
 */
export const logoutUser = async (user) => {
    try{
        const response = await fetch(`${authBaseUrl}/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`,
            },
        });

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
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`,
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

export class User {
    /**
     * @param {string} id
     * @param {string} username
     * @param {string} displayName
     * @param {string[]} roles
     * @param {string} token
     * @param {Date} expiresAt
     */
    constructor(id, username, displayName, roles, token, expiresAt) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.roles = roles;
        this.token = token;
        this.expiresAt = expiresAt;
    }
}