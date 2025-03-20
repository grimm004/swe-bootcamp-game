/**
 * Attempts to get a cookie by its name.
 * @param {string} name
 * @returns {string|null}
 */
export const getCookie = (name) => {
    name += "=";

    let cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === " ")
            cookie = cookie.substring(1);
        if (cookie.indexOf(name) === 0)
            return cookie.substring(name.length, cookie.length);
    }

    return null;
}

/**
 * Sets a cookie with the given name, value, and expiration date.
 * @param {string} name
 * @param {string} value
 * @param {Date} expiresAt
 * @returns {string}
 */
export const setCookie = (name, value, expiresAt) =>
    document.cookie = `${name}=${value};expires=${expiresAt.toUTCString()};path=/;`

/**
 * Clears a cookie by setting its expiration date to the past.
 * @param {string} name
 * @returns {string}
 */
export const clearCookie = (name) =>
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`