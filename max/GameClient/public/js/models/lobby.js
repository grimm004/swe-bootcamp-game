export class LobbyUser {
    /**
     * Creates a new lobby user.
     * @param {string} id
     * @param {string} username
     * @param {string} displayName
     */
    constructor(id, username, displayName) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
    }
}

export class Lobby {
    /**
     * Creates a new lobby.
     * @param {string} id
     * @param {string} joinCode
     * @param {string} hostId
     * @param {LobbyUser[]} users
     */
    constructor(id, joinCode, hostId, users) {
        this.id = id;
        this.joinCode = joinCode;
        this.hostId = hostId;
        this.users = users;
    }
}