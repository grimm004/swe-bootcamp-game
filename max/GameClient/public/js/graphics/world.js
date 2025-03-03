import {Matrix4, Quaternion, Vector3} from "./maths.js";


export class WorldObject {
    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Quaternion} [orientation=Quaternion.identity]
     */
    constructor(position = Vector3.zeros, orientation = Quaternion.identity) {
        this._position = new Vector3(position);
        this._orientation = new Quaternion(orientation);

        /**
         * @type {Matrix4}
         */
        this.matrix = Matrix4.fromRotationTranslation(this._orientation, this._position);
    }

    /**
     * Set the position of the world object
     * @param {Vector3} posVector
     */
    set position(posVector) {
        this._position = new Vector3(posVector);
        this.updateMatrix();
    }

    /**
     * Get the position of the world object
     * @returns {Vector3}
     */
    get position() {
        return this._position.copy;
    }

    /**
     * Set the orientation of the world object
     * @param {Quaternion} orientation
     */
    set orientation(orientation) {
        this._orientation.copyFrom(orientation);
        this.updateMatrix();
    }

    /**
     * Get the orientation of the world object
     * @returns {Quaternion}
     */
    get orientation() {
        return this._orientation.copy;
    }

    /**
     * Translate the world object by a vector
     * @param {Vector3} vec
     */
    translate(vec) {
        this._position.add(vec);
        this.updateMatrix();
    }

    /**
     * Rotate the world object by a quaternion
     * @param {Quaternion} quat
     */
    rotate(quat) {
        this._orientation.multiply(quat);
        this.updateMatrix();
    }

    /**
     * @returns {Matrix4}
     */
    updateMatrix() {
        return this.matrix
            .fromQuat(this._orientation)
            .translate(this._position);
    }
}