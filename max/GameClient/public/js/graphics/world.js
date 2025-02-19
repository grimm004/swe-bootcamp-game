import {Matrix4, Vector3} from "./maths.js";


export class WorldObject {
    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientationRad=Vector3.zeros]
     */
    constructor(position = Vector3.zeros, orientationRad = Vector3.zeros) {
        this._position = new Vector3(position);
        this._orientation = new Vector3(orientationRad);

        /**
         * @type {Matrix4}
         */
        this.matrix = Matrix4.identity;
    }

    set position(posVector) {
        this._position = new Vector3(posVector);
        this.updateMatrix();
    }

    get position() {
        return this._position.copy;
    }

    set orientation(orientationRad) {
        this._orientation = orientationRad.copy;
        this.updateMatrix();
    }

    get orientation() {
        return this._orientation.copy;
    }

    translate(vec) {
        this._position.add(vec);
        this.updateMatrix();
    }

    updateMatrix() {
        return Matrix4.identity;
    }
}