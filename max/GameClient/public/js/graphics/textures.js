// noinspection JSUnusedGlobalSymbols

export class Texture {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {TexImageSource} image
     * @param {number} [wrap=WebGLRenderingContext.CLAMP_TO_EDGE]
     * @param {number} [slot=0]
     */
    constructor(gl, image, wrap = gl.CLAMP_TO_EDGE, slot = 0) {
        this.gl = gl;

        this.id = gl.createTexture();
        this.slot = slot;

        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * @param {string} shaderName
     */
    bind(shaderName) {
        this.gl["shaders"][shaderName].setUniform1i("uSampler", this.slot);
        this.gl.activeTexture(this.gl.TEXTURE0 + this.slot);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    }
}