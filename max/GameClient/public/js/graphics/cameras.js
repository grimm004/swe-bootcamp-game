// noinspection JSUnusedGlobalSymbols

import {Matrix4, Quaternion, Vector3} from "./maths.js";
import {WorldObject} from "./world.js";


export class PerspectiveCamera extends WorldObject {
    #fovRad;
    #aspectRatio;
    #near;
    #far;

    #maxPitchDegrees;
    #minPitchDegrees;

    /**
     * @type {Vector3}
     */
    #targetPosition;
    /**
     * @type {Quaternion}
     */
    #targetOrientation;
    /**
     * @type {Vector3}
     */
    #direction;
    #yaw;
    #pitch;

    /**
     * @param {number} fovRad
     * @param {number} aspectRatio
     * @param {number} [near=0.1]
     * @param {number} [far=1000]
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Quaternion} [orientation=Quaternion.identity]
     * @param {number} [yaw=0]
     * @param {number} [pitch=0]
     */
    constructor(fovRad, aspectRatio, near = 0.1, far = 1000, position = Vector3.zeros, orientation = Quaternion.identity, yaw = 0, pitch = 0) {
        super(position, orientation);

        this.#fovRad = fovRad;
        this.#aspectRatio = aspectRatio;
        this.#near = near;
        this.#far = far;

        this.#maxPitchDegrees = 89;
        this.#minPitchDegrees = -this.#maxPitchDegrees;

        this.#targetPosition = this._position.copy;
        this.#targetOrientation = this._orientation.copy;
        this.#direction = Vector3.directionFromQuaternion(this._orientation);
        this.#yaw = yaw;
        this.#pitch = pitch;

        this.projectionMatrix = Matrix4.perspective(fovRad, aspectRatio, near, far);

        this.updateMatrix();
        this.updateProjectionMatrix();
    }

    get fov() {
        return this.#fovRad;
    }

    set fov(value) {
        this.#fovRad = value;
        this.updateProjectionMatrix();
    }

    get aspectRatio() {
        return this.#aspectRatio;
    }

    set aspectRatio(value) {
        this.#aspectRatio = value;
        this.updateProjectionMatrix();
    }

    get near() {
        return this.#near;
    }

    set near(value) {
        this.#near = value;
        this.updateProjectionMatrix();
    }

    get far() {
        return this.#far;
    }

    set far(value) {
        this.#far = value;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.projectionMatrix.perspective(this.#fovRad, this.#aspectRatio, this.#near, this.#far);
    }

    update(deltaTime) {
        const t = 1 - Math.exp(-8 * deltaTime);
        this._orientation
            .slerpTo(this.#targetOrientation, t)
            .normalise();
        this.#direction.directionFromQuaternion(this._orientation);

        const lerpConstant = 1 - Math.exp(-10 * deltaTime);
        this._position.init(
            Math.lerp(this._position.x, this.#targetPosition.x, lerpConstant),
            Math.lerp(this._position.y, this.#targetPosition.y, lerpConstant),
            Math.lerp(this._position.z, this.#targetPosition.z, lerpConstant)
        );

        this.updateMatrix();
    }

    set position(posVector) {
        this.#targetPosition.init(posVector.x, posVector.y, posVector.z);
        super.position.init(posVector.x, posVector.y, posVector.z);
        this.updateMatrix();
    }

    get position() {
        return super.position;
    }

    set orientation(orientation) {
        this.#targetOrientation.copyFrom(orientation);
        super.orientation.copyFrom(orientation);
        this.updateMatrix();
    }

    get orientation() {
        return super.orientation;
    }

    set targetPosition(posVector) {
        this.#targetPosition.init(posVector.x, posVector.y, posVector.z);
    }

    get targetPosition() {
        return this.#targetPosition;
    }

    /**
     * @param {number} yawDegrees
     * @param {number} pitchDegrees
     */
    setTargetYawPitch(yawDegrees, pitchDegrees) {
        this.#yaw = yawDegrees;
        this.#pitch = pitchDegrees;

        this.#targetOrientation = Quaternion.fromYawPitch(this.#yaw, this.#pitch);
    }

    get direction() {
        return this.#direction.copy;
    }

    get yaw() {
        return this.#yaw;
    }

    get pitch() {
        return this.#pitch;
    }

    translate(vec) {
        this.#targetPosition.add(vec);
        super.translate(vec);
    }

    updateMatrix() {
        return this.matrix
            .fromRotationTranslation(this._orientation, this._position)
            .invert();
    }

    /**
     * Moves the camera along its forward and right directions.
     * The forward/backward movement follows the camera's full 3D direction,
     * but the sideways movement is computed using the x–z projection so that
     * its speed remains constant regardless of the camera’s pitch.
     *
     * @param {number} forward - Forward/backward movement.
     * @param {number} sideways - Left/right movement.
     */
    move(forward, sideways) {
        this.#targetPosition
            .add(this.#direction
                .multiplied(forward))
            .add(Vector3.unitY
                .leftCross(this.#direction)
                .mul(sideways));
    }

    /**
     * Rotates the camera.
     * @param {number} degreesHorizontal - Horizontal rotation in degrees.
     * @param {number} degreesVertical - Vertical rotation in degrees.
     */
    turn(degreesHorizontal, degreesVertical) {
        this.#yaw = Math.normalizeDegrees(this.#yaw + degreesHorizontal);
        this.#pitch = Math.clamp(this.#pitch + degreesVertical, this.#minPitchDegrees, this.#maxPitchDegrees);

        this.#targetOrientation = Quaternion.fromYawPitch(this.#yaw, this.#pitch);
    }
}