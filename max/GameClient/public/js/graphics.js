// noinspection JSUnusedGlobalSymbols

import {Colour, Matrix4, Vector2, Vector3, Vector4} from "./math.js";

export class Texture {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {TexImageSource} image
     * @param {number} [wrap=WebGLRenderingContext.CLAMP_TO_EDGE]
     * @param {number} [slot=0]
     */
    constructor(gl, image, wrap = gl.CLAMP_TO_EDGE, slot = 0) {
        this.gl = gl;

        this.id = gl.createTexture();
        this.slot = slot;

        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * @param {string} shaderName
     */
    bind(shaderName) {
        this.gl["shaders"][shaderName].setUniform1i("uSampler", this.slot);
        this.gl.activeTexture(this.gl.TEXTURE0 + this.slot);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    }
}

export class Shader {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {string} vertexShaderSource
     * @param {string} fragmentShaderSource
     */
    constructor(gl, vertexShaderSource, fragmentShaderSource) {
        this.gl = gl;

        this.name = null;
        this.id = this.createProgram(vertexShaderSource, fragmentShaderSource);

        this._layouts = {};

        this._locationCache = {
            attributes: {},
            uniforms: {},
        };
    }

    /**
     * @param {string} vertexShaderSource
     * @param {string} fragmentShaderSource
     * @returns {number|WebGLProgram}
     */
    createProgram(vertexShaderSource, fragmentShaderSource) {
        const glVertexShader = Shader.loadShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        if (!glVertexShader) return -1;

        const glFragmentShader = Shader.loadShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!glFragmentShader) return -1;

        const id = this.gl.createProgram();
        this.gl.attachShader(id, glVertexShader);
        this.gl.attachShader(id, glFragmentShader);
        this.gl.linkProgram(id);

        this.gl.deleteShader(glVertexShader);
        this.gl.deleteShader(glFragmentShader);

        if (this.gl.getProgramParameter(id, this.gl.LINK_STATUS)) return id;

        console.error("Could not link shader program: " + this.gl.getProgramInfoLog(id));
        this.gl.deleteProgram(id);
        return -1;
    }

    addLayout(name, layout) {
        this._layouts[name] = layout;
        return this;
    }

    getLayout(name) {
        return this._layouts[name];
    }

    hasLayout(name) {
        return Object.prototype.hasOwnProperty.call(this._layouts, name);
    }

    getAttrib(name) {
        if (!Object.prototype.hasOwnProperty.call(this._locationCache.attributes, name))
            this._locationCache.attributes[name] = this.gl.getAttribLocation(this.id, name);
        if (this._locationCache.attributes[name] === -1)
            throw new Error(`Unknown attribute name: ${name}`);
        return this._locationCache.attributes[name];
    }

    getUniform(name) {
        if (!Object.prototype.hasOwnProperty.call(this._locationCache.uniforms, name))
            this._locationCache.uniforms[name] = this.gl.getUniformLocation(this.id, name);
        if (this._locationCache.uniforms[name] === null)
            throw new Error(`Unknown uniform name: ${name}`);
        return this._locationCache.uniforms[name];
    }

    setUniform(name, value) {
        const location = this.getUniform(name);
        if (value instanceof Matrix4)
            this.gl.uniformMatrix4fv(location, false, value.elements);
        else if (value instanceof Vector2)
            this.gl.uniform2fv(location, value);
        else if (value instanceof Vector3)
            this.gl.uniform3fv(location, value);
        else if (value instanceof Vector4 || value instanceof Colour)
            this.gl.uniform4fv(location, value.elements);
        else if (typeof value === "boolean")
            this.gl.uniform1i(location, value ? 1 : 0);
        else if (typeof value === "number")
            this.gl.uniform1f(location, value);
        else
            throw new Error(`Unknown uniform type for '${name}'.`);
        return this;
    }

    setUniforms(uniforms) {
        Object.entries(uniforms).forEach(([name, value]) => this.setUniform(name, value));
        return this;
    }

    setUniform1i(name, value) {
        this.gl.uniform1i(this.getUniform(name), value);
        return this;
    }

    bind(uniforms = undefined) {
        if (this.gl["boundShader"] !== this.id) {
            this.gl.useProgram(this.id);
            this.gl["boundShader"] = this.id;
        }
        if (typeof uniforms === "object")
            this.setUniforms(uniforms);
    }

    static loadShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            return shader;

        console.error("Could not compile shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
}

export class Buffer {
    constructor(gl, type, typedData, accessType = gl.STATIC_DRAW) {
        this.gl = gl;

        this.type = type;
        this.length = typedData.length;
        this.id = gl.createBuffer();
        gl.bindBuffer(type, this.id);
        gl.bufferData(type, typedData, accessType);
    }

    setData(typedData) {
        if (typedData.length !== this.length)
            throw new Error("Data length does not match buffer length.");

        this.gl.bindBuffer(this.type, this.id);
        this.gl.bufferData(this.type, typedData, this.gl.STATIC_DRAW);
        return this;
    }

    bind() {
        this.gl.bindBuffer(this.type, this.id);
    }
}

export class VertexBuffer extends Buffer {
    constructor(gl, vertexData) {
        super(gl, gl.ARRAY_BUFFER, new Float32Array(vertexData));
    }
}

export class IndexBuffer extends Buffer {
    constructor(gl, indexData) {
        super(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData));
    }
}

export class VertexBufferLayout {
    constructor(gl) {
        this.gl = gl;
        this.attributes = [];
        this.stride = 0;
    }

    addAttribute(location, count, type = this.gl.FLOAT, normalise = false, offset = 0) {
        if (location === -1) throw new Error(`Unknown attribute location (layout element ${this.attributes.length}).`);
        const size = this.getSizeOfType(type);
        this.attributes.push({location, count, type, normalise, size, offset});
        this.stride += offset + (count * size);
        return this;
    }

    getSizeOfType(type) {
        switch (type) {
            case this.gl.UNSIGNED_BYTE:
            case this.gl.BYTE:
                return 1;
            case this.gl.SHORT:
            case this.gl.UNSIGNED_SHORT:
                return 2;
            case this.gl.FLOAT:
            case this.gl.INT:
            case this.gl.UNSIGNED_INT:
                return 4;
            default:
                throw Error(`Unsupported type: ${type}`);
        }
    }
}

export class VertexArray {
    constructor(gl) {
        this.gl = gl;
        this.id = gl.createVertexArray();
        this.buffers = {};
    }

    setBuffer(buffer, shaderName, layoutName = "default") {
        const layout = this.gl["shaders"][shaderName].getLayout(layoutName);

        this.bind();
        buffer.bind();
        let offset = 0;
        for (let i = 0; i < layout.attributes.length; i++) {
            const attribute = layout.attributes[i];
            this.gl.vertexAttribPointer(attribute.location,
                attribute.count, attribute.type, attribute.normalise, layout.stride, attribute.offset + offset);
            this.gl.enableVertexAttribArray(attribute.location);
            offset += attribute.offset + (attribute.count * attribute.size);
        }

        this.buffers[`${shaderName}-${layoutName}`] = buffer;
        return this;
    }

    getBuffer(shaderName, layoutName = "default") {
        return this.buffers[`${shaderName}-${layoutName}`];
    }

    bind() {
        this.gl.bindVertexArray(this.id);
    }
}

export class Mesh {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {VertexArray} vertexArray
     * @param {IndexBuffer} indexBuffer
     * @param {string} shaderName
     * @param {Texture} [texture]
     */
    constructor(gl, vertexArray, indexBuffer, shaderName, texture = undefined) {
        this.gl = gl;
        this.vertexArray = vertexArray;
        this.indexBuffer = indexBuffer;
        this.shaderName = shaderName;
        this.texture = texture;
    }

    get shader() {
        return this.gl["shaders"][this.shaderName];
    }

    bind(uniforms) {
        this.vertexArray.bind();
        this.indexBuffer.bind();
        this.shader.bind(uniforms);
        this.texture?.bind(this.shaderName);
    }
}

export class Renderer {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {Colour} [clearColour=Colour.black]
     */
    constructor(gl, clearColour = Colour.black) {
        this.gl = gl;

        gl.clearColor(clearColour.a, clearColour.g, clearColour.b, clearColour.a);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    draw(object) {
        object.bind();
        this.gl.drawElements(this.gl.TRIANGLES, object.mesh.indexBuffer.length, this.gl.UNSIGNED_SHORT, 0);
    }
}

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

export class SceneNode extends WorldObject {
    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientationRad=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(position = Vector3.zeros, orientationRad = Vector3.zeros, scale = Vector3.ones, children = []) {
        super(position, orientationRad);

        this._scale = new Vector3(scale);
        /**
         * @type {Matrix4}
         */
        this.transform = Matrix4.identity;

        this.updateMatrix();

        this.parent = null;
        this.children = [];
        for (const child of children)
            if (child instanceof SceneNode) {
                child.parent = this;
                this.children.push(child);
            }

        this.visible = true;
        /**
         * @type {Boolean|null}
         */
        this.childrenVisible = null;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
        return this;
    }

    addChildren(children) {
        for (const child of children)
            this.addChild(child);
        return this;
    }

    /**
     * @param {number} deltaTime
     * @param {object} uniforms
     * @param {Matrix4} [transform=Matrix4.identity]
     */
    update(deltaTime, uniforms, transform = Matrix4.identity) {
        this.transform = transform.copy.mul(this.matrix);

        for (const child of this.children)
            child.update(deltaTime, uniforms, this.transform);
    }

    set scale(scaleVector) {
        this._scale = new Vector3(scaleVector);
    }

    get scale() {
        return this._scale.copy;
    }

    get globalPosition() {
        return this.transform.translation;
    }

    /**
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (this.visible) this._drawSelf(renderer);

        if (this.childrenVisible === true || (this.visible && this.childrenVisible === null))
            for (const child of this.children)
                child.draw(renderer);
    }

    _drawSelf() {}

    updateMatrix() {
        return this.matrix.positionOrientationScale(this._position, this._orientation, this._scale);
    }
}

export class DrawableSceneNode extends SceneNode {
    /**
     * @param {Mesh} mesh
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientationRad=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientationRad = Vector3.zeros, scale = Vector3.ones, children = []) {
        super(position, orientationRad, scale, children);

        this.mesh = mesh;
        this.uniforms = {};
    }

    /**
     * @param {number} deltaTime
     * @param {object} uniforms
     * @param {Matrix4} [transform=Matrix4.identity]
     */
    update(deltaTime, uniforms, transform = Matrix4.identity) {
        if (typeof uniforms === "object" && Object.prototype.hasOwnProperty.call(uniforms, this.mesh.shaderName))
            this.uniforms = {...this.uniforms, ...uniforms[this.mesh.shaderName]};

        super.update(deltaTime, uniforms, transform);
    }

    _drawSelf(renderer) {
        renderer.draw(this);
    }

    bind() {
        this.mesh.bind({...this.uniforms});
    }
}

export class Camera extends WorldObject {
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

export class Application {
    /**
     * @param {WebGL2RenderingContext} gl
     */
    constructor(gl) {
        this.gl = gl;
        this.gl["shaders"] = {};
        this.gl["boundShader"] = null;

        /**
         * @type {Vector2}
         */
        this.mousePos = Vector2.zeros;
        /**
         * @type {Vector2}
         */
        this.mouseChange = Vector2.zeros;

        this.pressedButtons = new Set();
        this.pressedKeys = new Set();

        this.initialised = false;
    }

    addShader(name, shader) {
        this.gl["shaders"][name] = shader;
        shader.name = name;
        return this;
    }

    mouseMove(dx, dy, x, y) {
        const rect = this.gl.canvas.getBoundingClientRect();
        this.mousePos = new Vector2(x - rect.left, y - rect.top);
        this.mouseChange = new Vector2(dx, dy);
    }

    mouseDown(button) {
        this.pressedButtons.add(button);
    }

    mouseUp(button) {
        this.pressedButtons.delete(button);
    }

    keyDown(key) {
        this.pressedKeys.add(key);
    }

    keyUp(key) {
        this.pressedKeys.delete(key);
    }

    isKeyDown(key) {
        return this.pressedKeys.has(key);
    }

    isKeyUp(key) {
        return !this.isKeyDown(key);
    }

    isButtonDown(key) {
        return this.pressedButtons.has(key);
    }

    isButtonUp(key) {
        return !this.isButtonDown(key);
    }

    async initialise() {
        this.initialised = true;
        return this;
    }

    update() {
        if (!this.initialised) throw Error("Not initialised.");
        this.mouseChange = Vector2.zeros;
    }

    draw() {
        if (!this.initialised) throw Error("Not initialised.");
    }

    run() {
        let previousTime = 0;
        const app = this;

        function mainloop(currentTime) {
            if (previousTime === 0) previousTime = currentTime;

            const deltaTime = (currentTime - previousTime) / 1000;

            app.update(deltaTime);
            app.draw(deltaTime);

            previousTime = currentTime;
            requestAnimationFrame(mainloop);
        }

        requestAnimationFrame(mainloop);
    }
}