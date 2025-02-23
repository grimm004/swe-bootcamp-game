import {Colour, Matrix4, Vector3} from "../graphics/maths.js";
import {ColCubeMesh} from "../graphics/meshes.js";


// todo: convert to system with debug component
export const Debug = {
    _colourPool: [
        Colour.red,
        Colour.green,
        Colour.forestGreen,
        Colour.blue,
        Colour.yellow,
        Colour.magenta,
        Colour.cyan,
        Colour.grey,
    ],
    _colourPoolIndex: 0,
    _pointMesh: null,
    _boxMesh: null,
    _uniforms: {},
    _points: {},
    _singleDrawPoints: {},
    _boxes: {},
    _singleDrawBoxes: {},

    /**
     * @param {string} id
     * @param {Vector3} pos
     * @param {Colour} [colour=Colour.black]
     * @param {boolean} [persistent=false]
     */
    setPoint(id, pos, colour = Colour.black, persistent = false) {
        const pointPool = persistent ? this._points : this._singleDrawPoints;

        pointPool[id] = {
            pos: pos,
            colour: pointPool[id]?.colour ?? colour ?? this._colourPool[this._colourPoolIndex++ % this._colourPool.length]
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
        const boxPool = persistent ? this._boxes : this._singleDrawBoxes;

        boxPool[id] = {
            pos: pos,
            dir: dir,
            size: size,
            colour: boxPool[id]?.colour ?? colour ?? this._colourPool[this._colourPoolIndex++ % this._colourPool.length]
        };
    },

    init(gl) {
        this.gl = gl;
        this._pointMesh = new ColCubeMesh(this.gl);
        this._boxMesh = new ColCubeMesh(this.gl);
    },

    draw() {
        for (const point of [...Object.values(this._points), ...Object.values(this._singleDrawPoints)]) {
            const uniforms = {
                ...this._uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(point.pos, Vector3.zeros, Vector3.ones.mul(0.025))
            }
            this._pointMesh?.setColour(point.colour);
            this._pointMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this._pointMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        for (const box of [...Object.values(this._boxes), ...Object.values(this._singleDrawBoxes)]) {
            const uniforms = {
                ...this._uniforms,
                uModelMatrix: Matrix4.positionOrientationScale(box.pos, box.dir, box.size.multiplied(0.501))
            }
            this._boxMesh?.setColour(box.colour);
            this._boxMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this._boxMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        this._singleDrawPoints = {};
        this._singleDrawBoxes = {};
    }
};