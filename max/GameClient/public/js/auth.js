const baseUrl = "/api/v1";
const authBaseUrl = `${baseUrl}/auth`;

export const loginUser = async ({username, password}) => {
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

        return new User(user.id, user.username, user.displayName, user.roles, token, expiresAt);
    }
    catch (error) {
        console.error(error);
        return null;
    }
};

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

export const signupUser = async ({username, password, displayName}) => {
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
    constructor(id, username, displayName, roles, token, expiresAt) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.roles = roles;
        this.token = token;
        this.expiresAt = expiresAt;
    }
}