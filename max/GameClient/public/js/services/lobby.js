import {Lobby, LobbyUser} from "../models/lobby.js";

const baseUrl = "/api/v1";
const lobbyBaseUrl = `${baseUrl}/lobbies`;

/**
 * Creates a new lobby.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const createLobby = async (token) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to create lobby:", response.status);
            return null;
        }

        const {
            id,
            joinCode,
            hostId,
            users,
        } = await response.json();

        return new Lobby(id, joinCode, hostId, users.map(u => new LobbyUser(u.id, u.username, u.displayName)));
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * Retrieves a lobby by its join code.
 * @param {string} joinCode - The join code to search for.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const getLobbyByCode = async (joinCode, token) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}?code=${encodeURIComponent(joinCode)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to get lobby by code:", response.status);
            return null;
        }

        const lobbyData = await response.json();
        if (!lobbyData || !lobbyData.length) {
            console.error("Lobby not found for code:", joinCode);
            return null;
        }

        const {
            id,
            hostId,
            users,
        } = lobbyData[0];

        return new Lobby(id, joinCode, hostId, users.map(u => new LobbyUser(u.id, u.username, u.displayName)));
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * Retrieves a lobby by its ID.
 * @param {string} id - The ID of the lobby to retrieve.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const getLobbyById = async (id, token) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to get lobby by ID:", response.status);
            return null;
        }

        const {
            joinCode,
            hostId,
            users,
        } = await response.json();

        return new Lobby(id, joinCode, hostId, users.map(u => new LobbyUser(u.id, u.username, u.displayName)));
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * Joins an existing lobby using its join code.
 * @param {string} joinCode - The join code provided by the user.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<Lobby|null>} - The updated lobby data on success; otherwise null.
 */
export const joinLobby = async (joinCode, token) => {
    try {
        const lobbyData = await getLobbyByCode(joinCode, token);
        if (!lobbyData || !lobbyData.id) {
            console.error("Lobby not found for code:", joinCode);
            return null;
        }

        const response = await fetch(`${lobbyBaseUrl}/${lobbyData.id}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ joinCode }),
        });

        if (!response.ok) {
            console.error("Failed to join lobby:", response.status);
            return null;
        }

        const {
            id,
            hostId,
            users,
        } = await response.json();

        return new Lobby(id, joinCode, hostId, users.map(u => new LobbyUser(u.id, u.username, u.displayName)));
    } catch (error) {
        console.error(error);
        return null;
    }
};

/**
 * Leaves the lobby.
 * @param {string} lobbyId - The lobby's ID.
 * @param {string} userId - The current user's ID.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<boolean>} - True on success; otherwise false.
 */
export const leaveLobby = async (lobbyId, userId, token) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${lobbyId}/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * Removes a player from the lobby (typically called by the lobby leader).
 * @param {string} lobbyId - The lobby's ID.
 * @param {string} userId - The user ID of the player to remove.
 * @param {string} token - The current user's auth token.
 * @returns {Promise<Lobby|null>} - The updated lobby data on success; otherwise null.
 */
export const removePlayerFromLobby = async (lobbyId, userId, token) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${lobbyId}/users/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error("Failed to remove player from lobby:", response.status);
            return null;
        }

        const {
            id,
            joinCode,
            hostId,
            users,
        } = await response.json();

        return new Lobby(id, joinCode, hostId, users.map(u => new LobbyUser(u.id, u.username, u.displayName)));
    } catch (error) {
        console.error(error);
        return null;
    }
};