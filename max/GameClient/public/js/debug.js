import {Colour, Matrix4, Vector3} from "./math.js";
import {ColCubeMesh} from "./meshes.js";

// todo: convert to system with debug component
export const Debug = {
    colourPool: [
        Colour.red,
        Colour.green,
        Colour.forestGreen,
        Colour.blue,
        Colour.yellow,
        Colour.magenta,
        Colour.cyan,
        Colour.grey,
    ],
    colourPoolIndex: 0,
    pointMesh: null,
    boxMesh: null,
    uniforms: {},
    points: {},
    singleDrawPoints: {},
    boxes: {},
    singleDrawBoxes: {},

    /**
     * @param {string} id
     * @param {Vector3} pos
     * @param {Colour} [colour=Colour.black]
     * @param {boolean} [persistent=false]
     */
    setPoint(id, pos, colour = Colour.black, persistent = false) {
        const pointPool = persistent ? this.points : this.singleDrawPoints;

        pointPool[id] = {
            pos: pos,
            colour: pointPool[id]?.colour ?? colour ?? this.colourPool[this.colourPoolIndex++ % this.colourPool.length]
        }
    },

    /**
     * @param {string} id
     * @param {Vector3} pos
     * @param {Vector3} dir
     * @param {Vector3} size
     * @param {Colour} [colour]
     * @param {boolean} [persistent=true]
     */
    setBox(id, pos, dir, size, colour = null, persistent = true) {
        const boxPool = persistent ? this.boxes : this.singleDrawBoxes;

        boxPool[id] = {
            pos: pos,
            dir: dir,
            size: size,
            colour: boxPool[id]?.colour ?? colour ?? this.colourPool[this.colourPoolIndex++ % this.colourPool.length]
        };
    },

    init(gl) {
        this.gl = gl;
        this.pointMesh = new ColCubeMesh(this.gl);
        this.boxMesh = new ColCubeMesh(this.gl);
    },

    draw() {
        for (const point of [...Object.values(this.points), ...Object.values(this.singleDrawPoints)]) {
            const uniforms = {
                ...this.uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(point.pos, Vector3.zeros, Vector3.ones.mul(0.025))
            }
            this.pointMesh?.setColour(point.colour);
            this.pointMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this.pointMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        for (const box of [...Object.values(this.boxes), ...Object.values(this.singleDrawBoxes)]) {
            const uniforms = {
                ...this.uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(box.pos, box.dir, box.size.multiplied(0.501))
            }
            this.boxMesh?.setColour(box.colour);
            this.boxMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this.boxMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        this.singleDrawPoints = {};
        this.singleDrawBoxes = {};
    }
};