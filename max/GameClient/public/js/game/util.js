import {Texture} from "../graphics/textures.js";
import {Colour} from "../graphics/maths.js";
import {parseWavefrontObj} from "../graphics/meshes.js";


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
    return parseWavefrontObj(gl, await fetchText(`assets/meshes/${name}.obj`), texture, colour, shader);
}