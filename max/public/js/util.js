import {Texture} from "./graphics.js";
import {Colour} from "./math.js";
import {parseObj} from "./meshes.js";

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

export const fetchImage = async (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject();
        image.src = url;
    })

export const fetchTexture = async (gl, filename, wrap = gl.CLAMP_TO_EDGE) =>
    new Texture(gl, await fetchImage(`assets/images/${filename}`), wrap);

export const fetchShaderSource = async (name) => ({
    vertex: await fetchText(`assets/shaders/${name}.vertex.glsl`),
    fragment: await fetchText(`assets/shaders/${name}.fragment.glsl`)
});

export const fetchMesh = async (gl, name, texture = "", colour = Colour.white, shader = "") => {
    if (typeof texture === "string")
        texture = await fetchTexture(gl, texture === "" ? (name + ".png") : texture);
    return parseObj(gl, await fetchText(`assets/meshes/${name}.obj`), texture, colour, shader);
}