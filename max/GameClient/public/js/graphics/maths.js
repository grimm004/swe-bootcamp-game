// noinspection JSCheckFunctionSignatures,JSValidateTypes,JSUnusedGlobalSymbols

import {mat4, quat, vec3, vec4} from "../../lib/gl-matrix/index.js";
import {oimo} from "../../lib/oimo-physics.module.js";

Math.clamp = (x, min, max) => Math.min(Math.max(x, min), max);
Math.radians = (degrees) => Math.PI * degrees / 180.0;
Math.degrees = (radians) => 180.0 * radians / Math.PI;
Math.lerp = (a, b, v) => (a * (1 - v)) + (b * v);
Math.normalizeRadians = (angle) => ((angle + Math.PI) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) - Math.PI;
Math.normalizeDegrees = (angle) => ((angle + 180) % 360 + 360) % 360 - 180;

export class FrameCounter {
    #frameTimeBuffer;
    #bufferSize;

    /**
     * Creates a new frame counter.
     * @param {number} [bufferSize=50] - The size of the frame time buffer for averaging.
     */
    constructor(bufferSize = 50) {
        this.#bufferSize = bufferSize;
        this.#frameTimeBuffer = new Float32Array(bufferSize);
        this.totalFrames = 0;
        this.averageFrameTime = 0.0;
    }

    get averageFrameRate() {
        return this.averageFrameTime ? 1.0 / this.averageFrameTime : 0.0;
    }

    tick(deltaTime) {
        this.#frameTimeBuffer[this.totalFrames++ % this.#bufferSize] = deltaTime;

        if (this.totalFrames > this.#frameTimeBuffer.length) {
            this.averageFrameTime = 0.0;
            for (const frameTime of this.#frameTimeBuffer)
                this.averageFrameTime += frameTime;
            this.averageFrameTime /= this.#frameTimeBuffer.length;
        }
    }
}

export class Matrix4 extends Float32Array {
    constructor(value) {
        let elements;
        if (value instanceof Matrix4) elements = new Float32Array(value.elements);
        else if (value instanceof Float32Array || value instanceof Array) {
            elements = new Float32Array(16);
            for (let i = 0; i < Math.min(16, value.length); i++) elements[i] = value[i];
        } else elements = mat4.create();

        super(elements);
    }

    get copy() {
        return new Matrix4(this);
    }

    get elements() {
        return new Float32Array(this);
    }

    set elements(values) {
        for (let i = 0; i < Math.min(16, this.elements.length); i++) this[i] = values[i];
    }

    /**
     * @returns {Matrix4}
     */
    identity() {
        return mat4.identity(this);
    }

    /**
     * @returns {Matrix4}
     */
    static get identity() {
        return new Matrix4();
    }

    /**
     * @returns {Matrix4}
     */
    transpose() {
        return mat4.transpose(this, this);
    }

    /**
     * @returns {Matrix4}
     */
    invert() {
        return mat4.invert(this, this);
    }

    /**
     * @returns {Matrix4}
     */
    get inverted() {
        return this.copy.invert();
    }

    /**
     * @returns {Vector3}
     */
    get translation() {
        return mat4.getTranslation(new Vector3(), this);
    }

    /**
     * @param {Matrix4|Vector3|Vector4} rhs
     * @returns {Matrix4|Vector3|Vector4}
     */
    multiply(rhs) {
        if (rhs instanceof Matrix4)
            return mat4.mul(this, this, rhs.elements);
        else if (rhs instanceof Vector3)
            return vec3.transformMat4(new Vector3(), rhs, this);
        else if (rhs instanceof Vector4)
            return vec4.transformMat4(new Vector4(), rhs, this);
    }

    mul(rhs) {
        return this.multiply(rhs);
    }

    multiplied(rhs) {
        return this.copy.multiply(rhs);
    }

    /**
     * @param {Matrix4} lhs
     * @returns {Matrix4}
     */
    multiplyLeft(lhs) {
        return mat4.mul(this, lhs, this);
    }

    mull(lhs) {
        return this.multiplyLeft(lhs);
    }

    multipliedLeft(lhs) {
        return this.copy.multiplyLeft(lhs);
    }

    /**
     * @param {Vector3} scaleVector
     * @returns {Matrix4}
     */
    scale(scaleVector) {
        return mat4.scale(this, this, scaleVector);
    }

    /**
     * @param {Vector3} scaleVector
     * @returns {Matrix4}
     */
    fromScale(scaleVector) {
        return mat4.fromScaling(this, scaleVector);
    }

    /**
     * @param {Vector3} scaleVector
     * @returns {Matrix4}
     */
    static fromScale(scaleVector) {
        return new Matrix4().fromScale(scaleVector);
    }

    /**
     * @param {number} angleRad
     * @param {Vector4|Vector3} axisVector
     * @returns {Matrix4}
     */
    rotate(angleRad, axisVector) {
        return mat4.rotate(this, this, angleRad, axisVector.elements);
    }

    /**
     * @param {number} angleRad
     * @param {Vector4|Vector3} axisVector
     * @returns {Matrix4}
     */
    static fromRotation(angleRad, axisVector) {
        return new Matrix4().rotate(angleRad, axisVector);
    }

    /**
     * @param {Quaternion} quat
     * @returns {Matrix4}
     */
    fromQuat(quat) {
        return mat4.fromQuat(this, quat);
    }

    /**
     * @param {Quaternion} quat
     * @returns {Matrix4}
     */
    static fromQuat(quat) {
        return new Matrix4().fromQuat(quat);
    }

    /**
     * @param {Vector3} translationVector
     * @returns {Matrix4}
     */
    translate(translationVector) {
        return mat4.translate(this, this, translationVector);
    }

    /**
     * @param {Vector3} translation
     * @returns {Matrix4}
     */
    fromTranslation(translation) {
        return mat4.fromTranslation(this, translation);
    }

    /**
     * @param {Vector3} translation
     * @returns {Matrix4}
     */
    static fromTranslation(translation) {
        return new Matrix4().fromTranslation(translation);
    }

    /**
     * @param {number} fov
     * @param {number} aspectRatio
     * @param {number} near
     * @param {number} far
     * @returns {Matrix4}
     */
    perspective(fov, aspectRatio, near, far) {
        return mat4.perspective(this, fov, aspectRatio, near, far);
    }

    static perspective(fov, aspectRatio, near, far) {
        return new Matrix4().perspective(fov, aspectRatio, near, far);
    }

    /**
     * @param {Vector3} eyeVector
     * @param {Vector3} centerVector
     * @param {Vector3} upVector
     * @returns {Matrix4}
     */
    lookAt(eyeVector, centerVector, upVector) {
        return mat4.lookAt(this, eyeVector, centerVector, upVector);
    }

    static createLookAt(eyeVector, centerVector, upVector) {
        return new Matrix4().lookAt(eyeVector, centerVector, upVector);
    }

    /**
     * @param {Vector3} eyeVector
     * @param {Vector3} centerVector
     * @param {Vector3} upVector
     * @param {boolean} [concat=true]
     * @returns {Matrix4}
     */
    targetTo(eyeVector, centerVector, upVector, concat = true) {
        if (!concat) this.identity();
        mat4.lookAt(this, eyeVector, centerVector, upVector);
        return this;
    }

    static createTargetTo(eyeVector, centerVector, upVector) {
        return new Matrix4().targetTo(eyeVector, centerVector, upVector);
    }

    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientation=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {boolean} [concat=false]
     * @returns {Matrix4}
     */
    positionOrientationScale(position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones, concat = false) {
        if (!concat) this.identity();
        this.translate(position)
            .rotate(orientation.x, new Vector4(0, 1, 0))
            .rotate(orientation.y, new Vector4(1, 0, 0))
            .rotate(orientation.z, new Vector4(0, 0, 1))
            .scale(scale);
        return this;
    }

    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientation=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @returns {Matrix4}
     */
    static positionOrientationScale(position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones) {
        return new Matrix4().positionOrientationScale(position, orientation, scale, true);
    }

    /**
     * @param {Quaternion} rotation
     * @param {Vector3} scale
     * @param {Vector3} translation
     * @returns {Matrix4}
     */
    fromOriginRotationScaleTranslation(rotation, scale, translation) {
        return mat4.fromRotationTranslationScaleOrigin(this, rotation, translation, scale, Vector3.zeros);
    }

    /**
     * @param {Quaternion} rotation
     * @param {Vector3} scale
     * @param {Vector3} translation
     * @returns {Matrix4}
     */
    static fromOriginRotationScaleTranslation(rotation, scale, translation) {
        return new Matrix4().fromOriginRotationScaleTranslation(scale, rotation, translation);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @param {Vector3} scale
     * @returns {Matrix4}
     */
    fromRotationTranslationScale(quat, vec, scale) {
        return mat4.fromRotationTranslationScale(this, quat, vec, scale);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @param {Vector3} scale
     * @returns {Matrix4}
     */
    static fromRotationTranslationScale(quat, vec, scale) {
        return new Matrix4().fromRotationTranslationScale(quat, vec, scale);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @returns {Matrix4}
     */
    fromOriginRotationTranslation(quat, vec) {
        return mat4.fromRotationTranslationScaleOrigin(this, quat, vec, Vector3.ones, Vector3.zeros);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @returns {Matrix4}
     */
    static fromOriginRotationTranslation(quat, vec) {
        return new Matrix4().fromOriginRotationTranslation(quat, vec);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @returns {Matrix4}
     */
    fromRotationTranslation(quat, vec) {
        return mat4.fromRotationTranslation(this, quat, vec);
    }

    /**
     * @param {Quaternion} quat
     * @param {Vector3} vec
     * @returns {Matrix4}
     */
    static fromRotationTranslation(quat, vec) {
        return new Matrix4().fromRotationTranslation(quat, vec);
    }
}

export class Vector extends Float32Array {
    #vectorConstructor;

    constructor(elements, constructor) {
        super(elements);
        if (this.constructor === Vector) throw new Error("Cannot instantiate abstract Vector.");
        this.#vectorConstructor = constructor;
    }

    get copy() {
        return new this.#vectorConstructor(this);
    }

    set elements(elements) {
        this.apply((x, i) => this[i] = elements[i]);
    }

    get elements() {
        return new Float32Array(this);
    }

    /**
     * @returns {number}
     */
    get sum() {
        let total = 0.0;
        for (const element of this)
            total += element;
        return total;
    }

    /**
     * @returns {number}
     */
    get squareSum() {
        let total = 0.0;
        for (const element of this)
            total += element * element;
        return total;
    }

    /**
     * @returns {this}
     */
    normalise() {
        return this.div(this.magnitude() || 1.0);
    }

    get normalised() {
        return this.copy.normalise();
    }

    /**
     * @param {(x: number, i: number, vec: Vector) => number} f
     * @returns {this}
     */
    apply(f) {
        for (let i = 0; i < this.length; i++)
            this[i] = f(this[i], i, this);
        return this;
    }

    /**
     * @param {(x: number, i: number, vec: Vector) => number} f
     * @returns {Vector}
     */
    map(f) {
        return new this.#vectorConstructor(super.map(f));
    }

    /**
     * @returns {this}
     */
    negate() {
        return this.apply(x => -x);
    }

    get negated() {
        return this.copy.negate();
    }

    /**
     * @returns {this}
     */
    invert() {
        return this.apply(x => 1 / x);
    }

    get inverted() {
        return this.copy.invert();
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    add(val) {
        if (val.constructor === this.#vectorConstructor)
            this.apply((x, i) => x + val[i]);
        else if (typeof val === "number")
            this.add(new this.#vectorConstructor(val));
        return this;
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    added(val) {
        return this.copy.add(val);
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    mul(val) {
        if (val.constructor === this.#vectorConstructor)
            this.apply((x, i) => x * val[i]);
        else if (typeof val === "number")
            this.mul(new this.#vectorConstructor(val));
        return this;
    }

    multiplied(val) {
        return this.copy.mul(val);
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    sub(val) {
        return this.add(typeof val === "number" ? new this.#vectorConstructor(-val) : val.copy.negate());
    }

    subtracted(val) {
        return this.copy.sub(val);
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    div(val) {
        return this.mul(typeof val === "number" ? new this.#vectorConstructor(1.0 / val) : val.copy.invert());
    }

    divided(val) {
        return this.copy.div(val);
    }

    /**
     * @param {Vector} vec
     * @returns {number}
     */
    dot(vec) {
        return this.multiplied(vec).sum;
    }

    /**
     * @returns {number}
     */
    magnitudeSquared() {
        return this.multiplied(this).sum;
    }

    /**
     * @returns {number}
     */
    magnitude() {
        return Math.hypot(...this);
    }

    /**
     * @returns {Vector}
     */
    zeros() {
        return this.apply(() => 0);
    }

    /**
     * @returns {Vector}
     */
    ones() {
        return this.apply(() => 1);
    }

    /**
     * @returns {number[]}
     */
    toArray() {
        return Array.from(this);
    }

    toString() {
        return `(${this.toArray().map(x => x.toFixed(2)).join(", ")})`;
    }
}

export class Vector2 extends Vector {
    constructor(x = undefined, y = undefined) {

        let xVal = 0.0, yVal = 0.0;

        if (typeof x === "number") {
            xVal = x;
            yVal = typeof y === "number" ? y : xVal;
        } else if (x instanceof Vector2) {
            xVal = x.x;
            yVal = x.y;
        } else if ((x instanceof Float32Array || x instanceof Array) && x.length > 1) {
            xVal = x[0];
            yVal = x[1];
        }

        super([xVal, yVal], Vector2, 2);
    }

    get x() {
        return this[0];
    }

    set x(value) {
        this[0] = value;
    }

    get y() {
        return this[1];
    }

    set y(value) {
        this[1] = value;
    }

    /**
     * @returns {Vector2}
     */
    static get zeros() {
        return new Vector2();
    }

    /**
     * @returns {Vector2}
     */
    static get ones() {
        return new Vector2(1.0);
    }

    /**
     * @returns {Vector2}
     */
    static get unitX() {
        return new Vector2(1.0, 0.0);
    }

    /**
     * @returns {Vector2}
     */
    static get unitY() {
        return new Vector2(0.0, 1.0);
    }
}

export class Vector3 extends Vector {
    /**
     * @param {number|Vector3|Vector2|Float32Array|Array|oimo.common.Vec3|{x: number, y: number, z: number}} [x]
     * @param {number} [y]
     * @param {number} [z]
     */
    constructor(x = undefined, y = undefined, z = undefined) {
        let xVal = 0.0, yVal = 0.0, zVal = 0.0;
        if (typeof x === "number") {
            xVal = x;
            yVal = typeof y === "number" ? y : xVal;
            zVal = typeof z === "number" ? z : yVal;
        } else if (x instanceof Vector3 || x instanceof Vector4 || x instanceof oimo.common.Vec3 ||
            (x instanceof Object && Object.hasOwn(x, "x") && Object.hasOwn(x, "y") && Object.hasOwn(x, "z"))) {
            xVal = x.x;
            yVal = x.y;
            zVal = x.z;
        } else if (x instanceof Vector2) {
            xVal = x.x;
            yVal = x.y;
            zVal = typeof y == "number" ? y : 0.0;
        } else if (x instanceof Float32Array || x instanceof Array) {
            xVal = x[0];
            yVal = x[1];
            zVal = x[2];
        }

        super([xVal, yVal, zVal], Vector3);
    }

    /**
     * @returns {number}
     */
    get x() {
        return this[0];
    }

    /**
     * @param {number} value
     */
    set x(value) {
        this[0] = value;
    }

    /**
     * @returns {number}
     */
    get y() {
        return this[1];
    }

    /**
     * @param value
     */
    set y(value) {
        this[1] = value;
    }

    /**
     * @returns {number}
     */
    get z() {
        return this[2];
    }

    /**
     * @param value
     */
    set z(value) {
        this[2] = value;
    }

    /**
     * @returns {{x: number, y: number, z: number}}
     */
    toSerializable() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Vector3}
     */
    init(x, y, z) {
        return vec3.set(this, x, y, z);
    }

    /**
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    copyFrom(vec) {
        return vec3.copy(this, vec);
    }

    /**
     * @param {(x: number, i: number, vec: Vector3) => number} f
     * @returns {Vector3}
     */
    map(f) {
        return super.map(f);
    }

    /**
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    cross(vec) {
        return vec3.cross(this, this, vec);
    }

    /**
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    crossed(vec) {
        return this.copy.cross(vec);
    }

    /**
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    leftCross(vec) {
        return vec3.cross(this, vec, this);
    }

    /**
     * @param {Vector3} vec
     * @returns {Vector3}
     */
    leftCrossed(vec) {
        return this.copy.leftCross(vec);
    }

    /**
     * @param {number} yawRad
     * @param {number} pitchRad
     * @returns {Vector3}
     */
    direction(yawRad, pitchRad) {
        const sinYaw = Math.sin(yawRad), cosYaw = Math.cos(yawRad);
        const sinPitch = Math.sin(pitchRad), cosPitch = Math.cos(pitchRad);
        this[0] = -sinYaw * cosPitch;
        this[1] = sinPitch;
        this[2] = -cosYaw * cosPitch;
        return this;
    }

    /**
     * @param {number} yawRad
     * @param {number} pitchRad
     * @returns {Vector3}
     */
    static direction(yawRad, pitchRad) {
        return Vector3.zeros.direction(yawRad, pitchRad);
    }

    /**
     * @param {Quaternion|oimo.Quat} quaternion
     * @returns {Vector3}
     */
    transformByQuaternion(quaternion) {
        return vec3.transformQuat(this, this, quaternion);
    }

    /**
     * @param {Quaternion|oimo.Quat} quaternion
     * @returns {Vector3}
     */
    directionFromQuaternion(quaternion) {
        return this.init(0, 0, -1).transformByQuaternion(quaternion);
    }

    /**
     * @param {Quaternion|oimo.Quat} quaternion
     * @returns {Vector3}
     */
    static directionFromQuaternion(quaternion) {
        return new Vector3().directionFromQuaternion(quaternion);
    }

    /**
     * @param {oimo.Quat} quaternion
     * @returns {Vector3}
     */
    static eulerFromQuaternion(quaternion) {
        const { w, x, y, z } = quaternion;

        const test = 2 * (w * x - y * z);
        let yaw, pitch, roll;

        if (test > 0.999999) {
            pitch = Math.PI / 2;
            yaw   = Math.atan2(y, w);
            roll  = 0;
        } else if (test < -0.999999) {
            pitch = -Math.PI / 2;
            yaw   = Math.atan2(y, w);
            roll  = 0;
        } else {
            pitch = Math.asin(test);

            yaw = Math.atan2(
                2 * (w * y + x * z),
                1 - 2 * (x * x + y * y)
            );

            roll = Math.atan2(
                2 * (w * z + x * y),
                1 - 2 * (x * x + z * z)
            );
        }

        return new Vector3(yaw, pitch, roll);
    }

    /**
     * @returns {Vector3}
     */
    zero() {
        return vec3.zero(this);
    }

    /**
     * @returns {Vector3}
     */
    static get zeros() {
        return new Vector3();
    }

    /**
     * @returns {Vector3}
     */
    ones() {
        return vec3.set(this, 1.0, 1.0, 1.0);
    }

    /**
     * @returns {Vector3}
     */
    static get ones() {
        return new Vector3(1.0);
    }

    /**
     * @returns {Vector3}
     */
    unitX() {
        return vec3.set(this, 1.0, 0.0, 0.0);
    }

    /**
     * @returns {Vector3}
     */
    static get unitX() {
        return new Vector3(1.0, 0.0, 0.0);
    }

    /**
     * @returns {Vector3}
     */
    unitY() {
        return vec3.set(this, 0.0, 1.0, 0.0);
    }

    /**
     * @returns {Vector3}
     */
    static get unitY() {
        return new Vector3(0.0, 1.0, 0.0);
    }

    /**
     * @returns {Vector3}
     */
    unitZ() {
        return vec3.set(this, 0.0, 0.0, 1.0);
    }

    /**
     * @returns {Vector3}
     */
    static get unitZ() {
        return new Vector3(0.0, 0.0, 1.0);
    }
}

export class Vector4 extends Float32Array {
    /**
     * @param {number|Vector4|Vector3|Vector2|Float32Array|Array|oimo.common.Quat|{x: number, y: number, z: number, w: number}} [x]
     * @param {number|Vector2} [y]
     * @param {number} [z]
     * @param {number} [w]
     */
    constructor(x = undefined, y = undefined, z = undefined, w = undefined) {
        let xVal = 0.0, yVal = 0.0, zVal = 0.0, wVal = 1.0;
        if (typeof x === "number") {
            xVal = x;
            yVal = typeof y === "number" ? y : xVal;
            zVal = typeof z === "number" ? z : yVal;
            wVal = typeof w === "number" ? w : 1.0;
        } else if (x instanceof Vector4 || x instanceof oimo.common.Quat ||
            (x instanceof Object && Object.hasOwn(x, "x") && Object.hasOwn(x, "y")
                && Object.hasOwn(x, "z") && Object.hasOwn(x, "w"))) {
            xVal = x.x;
            yVal = x.y;
            zVal = x.z;
            wVal = x.w;
        } else if (x instanceof Vector3) {
            xVal = x.x;
            yVal = x.y;
            zVal = x.z;
            wVal = typeof y == "number" ? y : 1.0;
        } else if (x instanceof Vector2) {
            xVal = x.x;
            yVal = x.y;
            if (y instanceof Vector2) {
                zVal = y.x;
                wVal = y.y;
            } else if (typeof y === "number") {
                zVal = y;
                wVal = typeof z === "number" ? z : 1.0;
            }
        } else if (x instanceof Float32Array || x instanceof Array) {
            xVal = x[0];
            yVal = x[1];
            zVal = x[2];
            wVal = x[3];
        }

        super([xVal, yVal, zVal, wVal]);
    }

    get x() {
        return this[0];
    }

    set x(value) {
        this[0] = value;
    }

    get y() {
        return this[1];
    }

    set y(value) {
        this[1] = value;
    }

    get z() {
        return this[2];
    }

    set z(value) {
        this[2] = value;
    }

    get w() {
        return this[3];
    }

    set w(value) {
        this[3] = value;
    }

    /**
     * @returns {Vector4}
     */
    get copy() {
        return new Vector4(this);
    }

    /**
     * @returns {number}
     */
    get sum() {
        return this.x + this.y + this.z;
    }

    /**
     * @returns {number}
     */
    get squareSum() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /**
     * @returns {Float32Array}
     */
    get elements() {
        return new Float32Array(this);
    }

    /**
     * @param {number[]|Float32Array} value
     */
    set elements(value) {
        [this.x, this.y, this.z, this.w] = value.slice(0, 4);
    }

    /**
     * @returns {number[]}
     */
    toArray() {
        return Array.from(this);
    }

    /**
     * @returns {{x: number, y: number, z: number, w: number}}
     */
    toSerializable() {
        return { x: this.x, y: this.y, z: this.z, w: this.w };
    }

    /**
     * @returns {Vector4}
     */
    normalise() {
        return vec4.normalize(this, this);
    }

    /**
     * @param {(x: number) => number} f
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    map(f, includeW = false) {
        this[0] = f(this[0]);
        this[1] = f(this[1]);
        this[2] = f(this[2]);
        if (includeW)
            this[3] = f(this[3]);
        return this;
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    negate(includeW = false) {
        this[0] *= -1;
        this[1] *= -1;
        this[2] *= -1;
        if (includeW)
            this[3] *= -1;
        return this;
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    invert(includeW = false) {
        this[0] = 1 / this[0];
        this[1] = 1 / this[1];
        this[2] = 1 / this[2];
        if (includeW)
            this[3] = 1 / this[3];
        return this;
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    add(val, includeW = false) {
        if (val instanceof Vector4) {
            this[0] += val[0];
            this[1] += val[1];
            this[2] += val[2];
            if (includeW)
                this[3] += val[3];
        } else if (typeof val === "number")
            this.add(new Vector4(val), includeW);
        return this;
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    mul(val, includeW = false) {
        if (val instanceof Vector4) {
            this[0] *= val[0];
            this[1] *= val[1];
            this[2] *= val[2];
            if (includeW)
                this[3] *= val[3];
        } else if (typeof val === "number")
            this.mul(new Vector4(val), includeW);
        return this;
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    sub(val, includeW = false) {
        return this.add(val instanceof Vector4 ? val.copy.negate() : new Vector4(-val), includeW);
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    div(val, includeW = false) {
        return this.mul(val instanceof Vector4 ? val.copy.invert() : new Vector4(1.0 / val), includeW);
    }

    /**
     * @param {Vector4} vec
     * @param {boolean} [includeW=false]
     * @returns {number}
     */
    dot(vec, includeW = false) {
        return (this.x * vec.x) + (this.y * vec.y) + (this.z * vec.z) + (includeW ? this.w * vec.w : 0);
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {number}
     */
    magnitudeSquared(includeW) {
        return (this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (includeW ? this.w * this.w : 0);
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {number}
     */
    magnitude(includeW) {
        return Math.hypot(this.x, this.y, this.z, includeW ? this.w : 0);
    }

    /**
     * @returns {Vector4}
     */
    static get zeros() {
        return new Vector4();
    }

    /**
     * @returns {Vector4}
     */
    static get ones() {
        return new Vector4(1.0);
    }
}

export class Quaternion extends Vector4 {
    /**
     * @param {number|Quaternion|Vector4|Vector3|Vector2|Float32Array|Array|oimo.common.Quat|{x: number, y: number, z: number, w: number}} [x]
     * @param {number|Vector2} [y]
     * @param {number} [z]
     * @param {number} [w=1.0]
     */
    constructor(x = undefined, y = undefined, z = undefined, w = undefined) {
        super(x, y, z, w);
    }

    /**
     * @returns {Quaternion}
     */
    get copy() {
        return new Quaternion(this);
    }

    /**
     * @param {Quaternion} value
     * @returns {Quaternion}
     */
    copyFrom(value) {
        return quat.copy(this, value);
    }

    /**
     * @returns {Quaternion}
     */
    get identity() {
        return quat.identity(this);
    }

    /**
     * @returns {Quaternion}
     */
    static get identity() {
        return new Quaternion(0, 0, 0, 1);
    }

    /**
     * @returns {Quaternion}
     */
    normalise() {
        return quat.normalize(this, this);
    }

    /**
     * @returns {Quaternion}
     */
    normalised() {
        return this.copy.normalise();
    }

    /**
     * @param {Quaternion} quaternion
     * @returns {Quaternion}
     */
    multiply(quaternion) {
        return quat.multiply(this, this, quaternion);
    }

    /**
     * @returns {Quaternion}
      */
    conjugate() {
        return quat.conjugate(this, this);
    }

    /**
     * @returns {Quaternion}
     */
    conjugated() {
        return this.copy.conjugate();
    }

    /**
     * @param {Quaternion} target
     * @param {number} t
     * @returns {Quaternion}
     */
    slerpTo(target, t) {
        return quat.slerp(this, this, target, t);
    }

    /**
     * @param {Quaternion} target
     * @param {number} t
     * @returns {Quaternion}
     */
    slerpedTo(target, t) {
        return this.copy.slerpTo(target, t);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotateX(angle) {
        return quat.rotateX(this, this, angle);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotatedX(angle) {
        return this.copy.rotateX(angle);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotateY(angle) {
        return quat.rotateY(this, this, angle);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotatedY(angle) {
        return this.copy.rotateY(angle);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotateZ(angle) {
        return quat.rotateZ(this, this, angle);
    }

    /**
     * @param {number} angle
     * @returns {Quaternion}
     */
    rotatedZ(angle) {
        return this.copy.rotateZ(angle);
    }

    /**
     * @param {Vector3} axis
     * @param {number} angle
     * @returns {Quaternion}
     */
    setAxisAngle(axis, angle) {
        return quat.setAxisAngle(this, axis, angle);
    }

    /**
     * @param {Vector3} axis
     * @param {number} angle
     * @returns {Quaternion}
     */
    static fromAxisAngle(axis, angle) {
        return Quaternion.identity.setAxisAngle(axis, angle);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Quaternion}
     */
    fromEuler(x, y, z) {
        return quat.fromEuler(this, x, y, z);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Quaternion}
     */
    static fromEuler(x, y, z) {
        return new Quaternion().fromEuler(x, y, z);
    }

    /**
     * @param {number} yaw
     * @param {number} pitch
     * @returns {Quaternion}
     */
    fromYawPitch(yaw, pitch) {
        return this.fromEuler(-pitch, -yaw, 0.0);
    }

    /**
     * @param {number} yawDegrees
     * @param {number} pitchDegrees
     * @returns {Quaternion}
     */
    static fromYawPitch(yawDegrees, pitchDegrees) {
        return new Quaternion().fromYawPitch(yawDegrees, pitchDegrees);
    }

    /**
     * @param {number} yawDegrees
     * @param {number} pitchDegrees
     * @param {number} rollDegrees
     * @returns {Quaternion}
     */
    fromTaitBryan(yawDegrees, pitchDegrees, rollDegrees) {
        return quat.fromEuler(this, yawDegrees, pitchDegrees, rollDegrees, "xyz");
    }

    /**
     * @param {number} yawDegrees
     * @param {number} pitchDegrees
     * @param {number} rollDegrees
     * @returns {Quaternion}
     */
    static fromTaitBryan(yawDegrees, pitchDegrees, rollDegrees) {
        return new Quaternion().fromTaitBryan(pitchDegrees, yawDegrees, rollDegrees);
    }
}

export class Colour {
    constructor(r, g, b, a) {
        const vec = new Vector4(r, g, b, a);
        this.r = vec.x;
        this.g = vec.y;
        this.b = vec.z;
        this.a = vec.w;
    }

    get rgb() {
        return new Vector3(this.r, this.g, this.b);
    }

    get rgba() {
        return new Vector4(this.r, this.g, this.b, this.a);
    }

    get elements() {
        return new Float32Array([this.r, this.g, this.b, this.a]);
    }

    set elements(value) {
        [this.r, this.g, this.b, this.a] = value.slice(0, 4);
    }

    static fromBytes(r, g, b, a = 255) {
        return new Colour(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
    }

    static get black() {
        return new Colour(0.0, 0.0, 0.0, 1.0);
    }

    static get white() {
        return new Colour(1.0, 1.0, 1.0, 1.0);
    }

    static get grey() {
        return new Colour(0.5, 0.5, 0.5, 1.0);
    }

    static get darkGrey() {
        return new Colour(0.25, 0.25, 0.25, 1.0);
    }

    static get lightGrey() {
        return new Colour(0.75, 0.75, 0.75, 1.0);
    }

    static get red() {
        return new Colour(1.0, 0.0, 0.0, 1.0);
    }

    static get green() {
        return new Colour(0.0, 1.0, 0.0, 1.0);
    }

    static get forestGreen() {
        return new Colour(0.133, 0.545, 0.133, 1.0);
    }

    static get blue() {
        return new Colour(0.0, 0.0, 1.0, 1.0);
    }

    static get yellow() {
        return new Colour(1.0, 1.0, 0.0, 1.0);
    }

    static get cyan() {
        return new Colour(0.0, 1.0, 1.0, 1.0);
    }

    static get magenta() {
        return new Colour(1.0, 0.0, 1.0, 1.0);
    }

    static get brown() {
        return new Colour(0.647, 0.165, 0.165, 1.0);
    }
}