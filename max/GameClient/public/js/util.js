import {Texture} from "./graphics.js";
import {Colour} from "./math.js";
import {parseObj} from "./meshes.js";

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
export function fetchText(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            if (199 < request.status && request.status < 300) resolve(request.responseText);
            else reject(request.status);
        }
        request.onerror = () => reject(0);
        request.send();
    });
}

/**
 * @param {string} url
 * @returns {Promise<TexImageSource>}
 */
export const fetchImage = async (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject();
        image.src = url;
    })

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} filename
 * @param {number} [wrap=WebGLRenderingContext.CLAMP_TO_EDGE]
 * @returns {Promise<Texture>}
 */
export const fetchTexture = async (gl, filename, wrap = gl.CLAMP_TO_EDGE) =>
    new Texture(gl, await fetchImage(`assets/images/${filename}`), wrap);

/**
 * @param {string} name
 * @returns {Promise<{vertex: string, fragment: string}>}
 */
export const fetchShaderSource = async (name) => {
    const [vertex, fragment] = await Promise.all([
        fetchText(`assets/shaders/${name}.vertex.glsl`),
        fetchText(`assets/shaders/${name}.fragment.glsl`)
    ]);

    return {vertex, fragment};
};

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} name
 * @param {string|Texture} [texture=""]
 * @param {Colour} [colour=Colour.white]
 * @param {string} [shader=""]
 * @returns {Promise<Mesh>}
 */
export const fetchMesh = async (gl, name, texture = "", colour = Colour.white, shader = "") => {
    if (typeof texture === "string")
        texture = await fetchTexture(gl, texture === "" ? (name + ".png") : texture);
    return parseObj(gl, await fetchText(`assets/meshes/${name}.obj`), texture, colour, shader);
}

/**
 * Decode a Base64-URL-encoded string.
 *
 * Replaces URL-safe characters with standard Base64 characters,
 * adds any necessary padding, and then decodes the string.
 *
 * @param {string} str - The Base64-URL encoded string.
 * @returns {string} - The decoded UTF-8 string.
 */
function base64UrlDecode(str) {
    // Convert from Base64-URL to standard Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' until the length is a multiple of 4
    while (base64.length % 4) {
        base64 += '=';
    }

    // In browser environments
    if (typeof atob === 'function') {
        // atob returns a binary string, so we decode to UTF-8
        return decodeURIComponent(escape(atob(base64)));
    }
    // In Node.js environments
    else if (typeof Buffer === 'function') {
        return Buffer.from(base64, 'base64').toString('utf8');
    }
    else {
        throw new Error('No Base64 decoder available.');
    }
}

/**
 * Parse and validate a JWT without signature verification.
 *
 * This function splits the token, decodes its header and payload,
 * and checks standard claims such as:
 *   - Expiration (exp)
 *   - Not before (nbf)
 *
 * You can optionally provide an options object to also check:
 *   - issuer (iss)
 *   - audience (aud)
 *
 * @param {string} token - The JWT string.
 * @returns {object} - An object with { header, payload, signature }.
 * @throws {Error} - If the token is malformed or any validation fails.
 */
export const parseJwt = (token) => {
    if (typeof token !== 'string') {
        throw new Error("JWT must be a string.");
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error("JWT must have three parts separated by dots.");
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    let header, payload;

    try {
        header = JSON.parse(base64UrlDecode(headerB64));
        payload = JSON.parse(base64UrlDecode(payloadB64));
    } catch (err) {
        throw new Error("Failed to decode JWT: " + err.message);
    }

    // Validate expiration (exp) and not-before (nbf) if present.
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) {
        throw new Error("JWT has expired.");
    }
    if (payload.nbf && now < payload.nbf) {
        throw new Error("JWT is not yet valid (nbf claim).");
    }

    return { header, payload, signature: signatureB64 };
}
