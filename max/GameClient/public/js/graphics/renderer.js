import {Colour} from "./maths.js";


export class Renderer {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {Colour} [clearColour=Colour.black]
     */
    constructor(gl, clearColour = Colour.black) {
        this.gl = gl;

        gl.clearColor(clearColour.a, clearColour.g, clearColour.b, clearColour.a);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    draw(object) {
        object.bind();
        this.gl.drawElements(this.gl.TRIANGLES, object.mesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
    }
}