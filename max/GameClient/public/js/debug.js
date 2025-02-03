import {Colour, Matrix4, Vector3} from "./math.js";
import {ColCubeMesh} from "./meshes.js";

export const Debug = {
    pointMesh: null,
    boxMesh: null,
    uniforms: {},
    points: {},
    boxes: {},

    setPoint(id, pos) {
        this.points[id] = pos;
    },

    setBox(id, pos, dir, size) {
        this.boxes[id] = {pos, dir, size};
    },

    init(gl) {
        this.gl = gl;
        this.pointMesh = new ColCubeMesh(this.gl, Colour.red);
        this.boxMesh = new ColCubeMesh(this.gl, Colour.blue);
    },

    draw(enabled) {
        if (!enabled) return;

        for (const point of Object.values(this.points)) {
            const uniforms = {
                ...this.uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(point, Vector3.zeros, Vector3.ones.mul(0.05))
            }
            this.pointMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this.pointMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        for (const box of Object.values(this.boxes)) {
            const uniforms = {
                ...this.uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(box.pos, box.dir, box.size.multiplied(0.5))
            }
            this.boxMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this.boxMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }
    }
};