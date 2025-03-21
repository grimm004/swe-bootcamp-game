import {Colour, Matrix4, Quaternion, Vector3} from "../graphics/maths.js";
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
    uniforms: {},
    _points: {},
    _singleDrawPoints: {},
    _boxes: {},
    _singleDrawBoxes: {},

    /**
     * @param {string} id
     * @param {Vector3} position
     * @param {Colour} [colour=Colour.black]
     * @param {boolean} [persistent=false]
     */
    setPoint(id, position, colour = Colour.black, persistent = false) {
        const pointPool = persistent ? this._points : this._singleDrawPoints;

        pointPool[id] = {
            position,
            colour: pointPool[id]?.colour ?? colour ?? this._colourPool[this._colourPoolIndex++ % this._colourPool.length]
        }
    },

    /**
     * @param {string} id
     * @param {Vector3} position
     * @param {Quaternion} orientation
     * @param {Vector3} scale
     * @param {Colour} [colour]
     * @param {boolean} [persistent=true]
     */
    setBox(id, position, orientation, scale, colour = null, persistent = true) {
        const boxPool = persistent ? this._boxes : this._singleDrawBoxes;

        boxPool[id] = {
            position,
            orientation,
            scale,
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
                ...this.uniforms,
                uModelMatrix: Matrix4.fromRotationTranslationScale(Quaternion.identity, point.position, Vector3.ones.mul(0.025))
            }
            this._pointMesh?.setColour(point.colour);
            this._pointMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this._pointMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        for (const box of [...Object.values(this._boxes), ...Object.values(this._singleDrawBoxes)]) {
            const uniforms = {
                ...this.uniforms,
                uModelMatrix: Matrix4.fromRotationTranslationScale(box.orientation, box.position, box.scale.multiplied(0.501))
            }
            this._boxMesh?.setColour(box.colour);
            this._boxMesh?.bind(uniforms);
            this.gl.drawElements(this.gl.TRIANGLES, this._boxMesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
        }

        this._singleDrawPoints = {};
        this._singleDrawBoxes = {};
    }
};