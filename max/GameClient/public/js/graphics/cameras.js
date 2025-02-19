// noinspection JSUnusedGlobalSymbols

import {Matrix4, Vector3} from "./maths.js";
import {WorldObject} from "./world.js";


export class PerspectiveCamera extends WorldObject {
    /**
     * @param {number} fovRad
     * @param {number} aspectRatio
     * @param {number} [near=0.1]
     * @param {number} [far=1000]
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientationRad=Vector3.zeros]
     */
    constructor(fovRad, aspectRatio, near = 0.1, far = 1000, position = Vector3.zeros, orientationRad = Vector3.zeros) {
        super(position, orientationRad);

        this._fovRad = fovRad;
        this._aspectRatio = aspectRatio;
        this._near = near;
        this._far = far;
        this.maxPitch = Math.PI / 2 - Math.radians(1);
        this.minPitch = -this.maxPitch;

        this._targetPosition = this._position.copy;
        this._targetOrientation = this._orientation.copy;
        this._direction = Vector3.direction(-this._orientation.x, -this._orientation.y);

        this.projectionMatrix = Matrix4.perspective(fovRad, aspectRatio, near, far);

        this.updateMatrix();
        this.updateProjectionMatrix();
    }

    get fov() {
        return this._fovRad;
    }

    set fov(value) {
        this._fovRad = value;
        this.updateProjectionMatrix();
    }

    get aspectRatio() {
        return this._aspectRatio;
    }

    set aspectRatio(value) {
        this._aspectRatio = value;
        this.updateProjectionMatrix();
    }

    get near() {
        return this._near;
    }

    set near(value) {
        this._near = value;
        this.updateProjectionMatrix();
    }

    get far() {
        return this._far;
    }

    set far(value) {
        this._far = value;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix.perspective(this._fovRad, this._aspectRatio, this._near, this._far);
    }

    update(deltaTime) {
        this._targetOrientation.y = Math.clamp(this._targetOrientation.y, this.minPitch, this.maxPitch);

        this._orientation.elements = [
            Math.lerp(this._orientation.x, this._targetOrientation.x, 1 - Math.exp(-8 * deltaTime)),
            Math.lerp(this._orientation.y, this._targetOrientation.y, 1 - Math.exp(-8 * deltaTime)),
            0.0,
        ];

        const lerpConstant = 1 - Math.exp(-10 * deltaTime);
        this._position.elements = [
            Math.lerp(this._position.x, this._targetPosition.x, lerpConstant),
            Math.lerp(this._position.y, this._targetPosition.y, lerpConstant),
            Math.lerp(this._position.z, this._targetPosition.z, lerpConstant)
        ];

        this._direction.direction(-this._orientation.x, -this._orientation.y);

        this.updateMatrix();
    }

    set position(posVector) {
        this._targetPosition = new Vector3(posVector);
        super.position = posVector;
    }

    get position() {
        return super.position;
    }

    set orientation(orientationRad) {
        this.targetOrientation = orientationRad.copy;
        super.orientation = orientationRad;
    }

    get orientation() {
        return super.orientation;
    }

    set targetPosition(posVector) {
        this._targetPosition = new Vector3(posVector);
    }

    get targetPosition() {
        return this._targetPosition;
    }

    set targetOrientation(orientationRad) {
        this._targetOrientation = orientationRad.copy;
    }

    get targetOrientation() {
        return this._targetOrientation.copy;
    }

    get direction() {
        return this._direction.copy;
    }

    translate(vec) {
        this._targetPosition.add(vec);
        super.translate(vec);
    }

    /**
     * Moves the camera along its forward and right directions.
     * The forward/backward movement follows the camera's full 3D direction,
     * but the sideways movement is computed using the x–z projection so that
     * its speed remains constant regardless of the camera’s pitch.
     *
     * @param {Vector2} vec - x component for forward/backward and y for sideways.
     */
    move(vec) {
        const forwardComponent = this._direction.copy.mul(vec.x);

        let forwardXZ = new Vector3(this._direction.x, 0, this._direction.z);
        if (forwardXZ.magnitudeSquared() < 1e-6) forwardXZ = new Vector3(0, 0, -1);
        else forwardXZ.normalise();

        const right = new Vector3(-forwardXZ.z, 0, forwardXZ.x);
        const sidewaysComponent = right.mul(vec.y);

        // Add both components to the target position.
        this._targetPosition.add(forwardComponent).add(sidewaysComponent);
    }

    turn(vecRad) {
        this._targetOrientation.add(new Vector3(vecRad.x, vecRad.y, 0.0));
    }

    updateMatrix() {
        return this.matrix.lookAt(this._position, this._position.copy.add(this._direction), Vector3.unitY);
    }
}