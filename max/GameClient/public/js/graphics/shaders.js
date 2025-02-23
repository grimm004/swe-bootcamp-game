// noinspection JSUnusedGlobalSymbols

import {Colour, Matrix4, Vector2, Vector3, Vector4} from "./maths.js";


export class Shader {
    #layouts;
    #locationCache;

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {string} vertexShaderSource
     * @param {string} fragmentShaderSource
     */
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.gl = gl;

        this.name = null;
        this.id = this.createProgram(vertexShaderSource, fragmentShaderSource);

        this.#layouts = {};

        this.#locationCache = {
            attributes: {},
            uniforms: {},
        };
    }

    /**
     * @param {string} vertexShaderSource
     * @param {string} fragmentShaderSource
     * @returns {number|WebGLProgram}
     */
    createProgram(vertexShaderSource, fragmentShaderSource) {
        const glVertexShader = Shader.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        if (!glVertexShader) return -1;

        const glFragmentShader = Shader.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!glFragmentShader) return -1;

        const id = this.gl.createProgram();
        this.gl.attachShader(id, glVertexShader);
        this.gl.attachShader(id, glFragmentShader);
        this.gl.linkProgram(id);

        this.gl.deleteShader(glVertexShader);
        this.gl.deleteShader(glFragmentShader);

        if (this.gl.getProgramParameter(id, this.gl.LINK_STATUS)) return id;

        console.error("Could not link shader program: " + this.gl.getProgramInfoLog(id));
        this.gl.deleteProgram(id);
        return -1;
    }

    addLayout(name, layout) {
        this.#layouts[name] = layout;
        return this;
    }

    getLayout(name) {
        return this.#layouts[name];
    }

    hasLayout(name) {
        return Object.prototype.hasOwnProperty.call(this.#layouts, name);
    }

    getAttrib(name) {
        if (!Object.prototype.hasOwnProperty.call(this.#locationCache.attributes, name))
            this.#locationCache.attributes[name] = this.gl.getAttribLocation(this.id, name);
        if (this.#locationCache.attributes[name] === -1)
            throw new Error(`Unknown attribute name: ${name}`);
        return this.#locationCache.attributes[name];
    }

    getUniform(name) {
        if (!Object.prototype.hasOwnProperty.call(this.#locationCache.uniforms, name))
            this.#locationCache.uniforms[name] = this.gl.getUniformLocation(this.id, name);
        if (this.#locationCache.uniforms[name] === null)
            throw new Error(`Unknown uniform name: ${name}`);
        return this.#locationCache.uniforms[name];
    }

    setUniform(name, value) {
        const location = this.getUniform(name);
        if (value instanceof Matrix4)
            this.gl.uniformMatrix4fv(location, false, value.elements);
        else if (value instanceof Vector2)
            this.gl.uniform2fv(location, value);
        else if (value instanceof Vector3)
            this.gl.uniform3fv(location, value);
        else if (value instanceof Vector4 || value instanceof Colour)
            this.gl.uniform4fv(location, value.elements);
        else if (typeof value === "boolean")
            this.gl.uniform1i(location, value ? 1 : 0);
        else if (typeof value === "number")
            this.gl.uniform1f(location, value);
        else
            throw new Error(`Unknown uniform type for '${name}'.`);
        return this;
    }

    setUniforms(uniforms) {
        Object.entries(uniforms).forEach(([name, value]) => this.setUniform(name, value));
        return this;
    }

    setUniform1i(name, value) {
        this.gl.uniform1i(this.getUniform(name), value);
        return this;
    }

    bind(uniforms = undefined) {
        if (this.gl["boundShader"] !== this.id) {
            this.gl.useProgram(this.id);
            this.gl["boundShader"] = this.id;
        }
        if (typeof uniforms === "object")
            this.setUniforms(uniforms);
    }

    static loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            return shader;

        console.error("Could not compile shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
}
