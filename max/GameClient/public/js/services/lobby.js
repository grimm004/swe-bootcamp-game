import {Lobby, LobbyUser} from "../models/lobby.js";
import {BaseUrl} from "../constants.js";

const lobbyBaseUrl = `${BaseUrl}/lobbies`;

/**
 * Creates a new lobby.
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const createLobby = async () => {
    try {
        const response = await fetch(`${lobbyBaseUrl}`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const getLobbyByCode = async (joinCode) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}?code=${encodeURIComponent(joinCode)}`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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
 * @returns {Promise<Lobby|null>} - The lobby data on success; otherwise null.
 */
export const getLobbyById = async (id) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${id}`, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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
 * @returns {Promise<Lobby|null>} - The updated lobby data on success; otherwise null.
 */
export const joinLobby = async (joinCode) => {
    try {
        const lobbyData = await getLobbyByCode(joinCode);
        if (!lobbyData || !lobbyData.id) {
            console.error("Lobby not found for code:", joinCode);
            return null;
        }

        const response = await fetch(`${lobbyBaseUrl}/${lobbyData.id}/users`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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
 * @returns {Promise<boolean>} - True on success; otherwise false.
 */
export const leaveLobby = async (lobbyId, userId) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${lobbyId}/users/${userId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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
 * @returns {Promise<Lobby|null>} - The updated lobby data on success; otherwise null.
 */
export const removePlayerFromLobby = async (lobbyId, userId) => {
    try {
        const response = await fetch(`${lobbyBaseUrl}/${lobbyId}/users/${userId}`, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
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