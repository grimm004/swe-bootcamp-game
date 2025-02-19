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

    get isExpired() {
        return new Date() >= this.expiresAt;
    }
}