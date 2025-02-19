import {Colour, Matrix4, Vector3} from "./maths.js";
import {WorldObject} from "./world.js";


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

export class LitSceneNode extends DrawableSceneNode {
    /**
     * @param {Mesh} mesh
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientation=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones,
                children = []) {
        super(mesh, position, orientation, scale, children);

        this.uniforms = {
            uModelMatrix: Matrix4.identity,
            uViewMatrix: Matrix4.identity,
            uProjectionMatrix: Matrix4.identity,
            uEyePosition: Vector3.zeros,

            uAmbientColour: new Vector3(0.1),
            uLightColour: Vector3.ones,
            uLightPosition: Vector3.zeros
        };
    }

    /**
     * @param {number} deltaTime
     * @param {object} uniforms
     * @param {Matrix4} [transform=Matrix4.identity]
     */
    update(deltaTime, uniforms, transform = Matrix4.identity) {
        super.update(deltaTime, uniforms, transform);
        this.uniforms.uModelMatrix = this.transform;
    }
}

export class UnlitSceneNode extends DrawableSceneNode {
    /**
     * @param {Mesh} mesh
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Vector3} [orientation=Vector3.zeros]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientation = Vector3.zeros, scale = Vector3.ones,
                children = []) {
        super(mesh, position, orientation, scale, children);

        this.uniforms = {
            uModelMatrix: Matrix4.identity,
            uViewMatrix: Matrix4.identity,
            uProjectionMatrix: Matrix4.identity,

            uColour: Colour.white
        };
    }

    /**
     * @param {number} deltaTime
     * @param {object} uniforms
     * @param {Matrix4} [transform=Matrix4.identity]
     */
    update(deltaTime, uniforms, transform = Matrix4.identity) {
        super.update(deltaTime, uniforms, transform);
        this.uniforms.uModelMatrix = this.transform;
    }
}