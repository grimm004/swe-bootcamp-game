export class User {
    /**
     * @param {string} id
     * @param {string} username
     * @param {string} displayName
     * @param {string[]} roles
     * @param {Date} expiresAt
     */
    constructor(id, username, displayName, roles, expiresAt) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.roles = roles;
        this.expiresAt = expiresAt;
    }

    get isExpired() {
        return new Date() >= this.expiresAt;
    }
}