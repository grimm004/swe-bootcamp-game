// noinspection JSCheckFunctionSignatures,JSValidateTypes,JSUnusedGlobalSymbols

import {mat4, vec3, vec4} from "../../lib/gl-matrix/index.js";
import * as OIMO from "../../lib/oimo.module.js";

Math.clamp = (x, min, max) => Math.min(Math.max(x, min), max);
Math.radians = (degrees) => Math.PI * degrees / 180.0;
Math.degrees = (radians) => 180.0 * radians / Math.PI;
Math.lerp = (a, b, v) => (a * (1 - v)) + (b * v);

export class FrameCounter {
    constructor(bufferSize = 50) {
        this._bufferSize = bufferSize;
        this._frameTimeBuffer = new Float32Array(bufferSize);
        this.totalFrames = 0;
        this.averageFrameTime = 0.0;
    }

    get averageFrameRate() {
        return this.averageFrameTime ? 1.0 / this.averageFrameTime : 0.0;
    }

    tick(deltaTime) {
        this._frameTimeBuffer[this.totalFrames++ % this._bufferSize] = deltaTime;

        if (this.totalFrames > this._frameTimeBuffer.length) {
            this.averageFrameTime = 0.0;
            for (const frameTime of this._frameTimeBuffer)
                this.averageFrameTime += frameTime;
            this.averageFrameTime /= this._frameTimeBuffer.length;
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

    transpose() {
        mat4.transpose(this, this);
        return this;
    }

    invert() {
        return mat4.invert(this, this);
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
     * @param {boolean} [concat=true]
     * @returns {Matrix4}
     */
    scale(scaleVector, concat = true) {
        if (!concat) this.identity();
        mat4.scale(this, this, scaleVector);
        return this;
    }

    static scale(scaleVector) {
        return new Matrix4().scale(scaleVector);
    }

    /**
     * @param {number} angleRad
     * @param {Vector4|Vector3} axisVector
     * @param {boolean} [concat=true]
     * @returns {Matrix4}
     */
    rotate(angleRad, axisVector, concat = true) {
        if (!concat) this.identity();
        mat4.rotate(this, this, angleRad, axisVector.elements);
        return this;
    }

    static rotate(angleRad, axisVector) {
        return new Matrix4().scale(angleRad, axisVector);
    }

    /**
     * @param {Vector3} translationVector
     * @param {boolean} [concat=true]
     * @returns {Matrix4}
     */
    translate(translationVector, concat = true) {
        if (!concat) this.identity();
        mat4.translate(this, this, translationVector);
        return this;
    }

    static translate(translationVector) {
        return new Matrix4().translate(translationVector);
    }

    /**
     * @returns {Matrix4}
     */
    identity() {
        mat4.identity(this);
        return this;
    }

    /**
     * @returns {Matrix4}
     */
    static get identity() {
        return new Matrix4();
    }

    /**
     * @param {number} fov
     * @param {number} aspectRatio
     * @param {number} near
     * @param {number} far
     * @returns {Matrix4}
     */
    perspective(fov, aspectRatio, near, far) {
        mat4.perspective(this, fov, aspectRatio, near, far);
        return this;
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
        mat4.lookAt(this, eyeVector, centerVector, upVector);
        return this;
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
}

export class Vector extends Float32Array {
    constructor(elements, constructor) {
        super(elements);
        if (this.constructor === Vector) throw new Error("Cannot instantiate abstract Vector.");
        this._constructor = constructor;
    }

    get copy() {
        return new this._constructor(this);
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
        return new this._constructor(super.map(f));
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
        if (val.constructor === this._constructor)
            this.apply((x, i) => x + val[i]);
        else if (typeof val === "number")
            this.add(new this._constructor(val));
        return this;
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    plus(val) {
        return this.copy.add(val);
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    mul(val) {
        if (val.constructor === this._constructor)
            this.apply((x, i) => x * val[i]);
        else if (typeof val === "number")
            this.mul(new this._constructor(val));
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
        return this.add(typeof val === "number" ? new this._constructor(-val) : val.copy.negate());
    }

    subtracted(val) {
        return this.copy.sub(val);
    }

    /**
     * @param {Vector|number} val
     * @returns {this}
     */
    div(val) {
        return this.mul(typeof val === "number" ? new this._constructor(1.0 / val) : val.copy.invert());
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
     * @param {number|Vector3|OIMO.Vec3|Vector2|Float32Array|Array} [x]
     * @param {number} [y]
     * @param {number} [z]
     */
    constructor(x = undefined, y = undefined, z = undefined) {
        let xVal = 0.0, yVal = 0.0, zVal = 0.0;
        if (typeof x === "number") {
            xVal = x;
            yVal = typeof y === "number" ? y : xVal;
            zVal = typeof z === "number" ? z : yVal;
        } else if (x instanceof Vector3 || x instanceof OIMO.Vec3) {
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

    /**
     * @param {(x: number, i: number, vec: Vector3) => number} f
     * @returns {Vector3}
     */
    map(f) {
        return super.map(f);
    }

    /**
     * @param {number} yawRad
     * @param {number} pitchRad
     * @returns {Vector3}
     */
    direction(yawRad, pitchRad) {
        const sinYaw = Math.sin(yawRad), cosYaw = Math.cos(yawRad);
        const sinPitch = Math.sin(pitchRad), cosPitch = Math.cos(pitchRad);
        this.elements = [
            -sinYaw * cosPitch,
            sinPitch,
            -cosYaw * cosPitch
        ];
        return this;
    }

    static direction(yawRad, pitchRad) {
        return Vector3.zeros.direction(yawRad, pitchRad);
    }

    /**
     * @param {OIMO.Quat} quaternion
     * @returns {Vector3}
     */
    static directionFromQuaternion(quaternion) {
        const x = 2 * (quaternion.x * quaternion.z - quaternion.w * quaternion.y);
        const y = 2 * (quaternion.y * quaternion.z + quaternion.w * quaternion.x);
        const z = 1 - 2 * (quaternion.x * quaternion.x + quaternion.y * quaternion.y);
        return new Vector3(x, y, z);
    }

    /**
     * @param {OIMO.Quat} quaternion
     * @returns {Vector3}
     */
    static orientationFromQuaternion(quaternion) {
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
    static get zeros() {
        return new Vector3();
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
    static get unitX() {
        return new Vector3(1.0, 0.0, 0.0);
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
    static get unitZ() {
        return new Vector3(0.0, 0.0, 1.0);
    }
}

export class Vector4 {
    /**
     * @param {number|Vector4|Vector3|Vector2|Float32Array|Array} [x]
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
        } else if (x instanceof Vector4) {
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

        this.elements = [xVal, yVal, zVal, wVal];
    }

    get copy() {
        return new Vector4(this);
    }

    /**
     * @returns {number}
     */
    get sum() {
        return this.x + this.y + this.z;
    }

    get elements() {
        return new Float32Array([this.x, this.y, this.z, this.w]);
    }

    set elements(value) {
        [this.x, this.y, this.z, this.w] = value.slice(0, 4);
    }

    normalise() {
        const elements = this.elements;
        vec4.normalize(elements, elements);
        this.elements = elements;
    }

    /**
     * @param {(x: number) => number} f
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    map(f, includeW = false) {
        this.x = f(this.x);
        this.y = f(this.y);
        this.z = f(this.z);
        if (includeW)
            this.w = f(this.w);
        return this;
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    negate(includeW = false) {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        if (includeW)
            this.w *= -1;
        return this;
    }

    /**
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    invert(includeW = false) {
        this.x = 1 / this.x;
        this.y = 1 / this.y;
        this.z = 1 / this.z;
        if (includeW)
            this.w = 1 / this.w;
        return this;
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    add(val, includeW = false) {
        if (val instanceof Vector4) {
            this.x += val.x;
            this.y += val.y;
            this.z += val.z;
            if (includeW)
                this.w += val.w;
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
            this.x *= val.x;
            this.y *= val.y;
            this.z *= val.z;
            if (includeW)
                this.w *= val.w;
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
        this.add(val instanceof Vector4 ? val.copy.negate() : new Vector4(-val), includeW);
        return this;
    }

    /**
     * @param {Vector4|number} val
     * @param {boolean} [includeW=false]
     * @returns {Vector4}
     */
    div(val, includeW = false) {
        this.mul(val instanceof Vector4 ? val.copy.invert() : new Vector4(1.0 / val), includeW);
        return this;
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
}