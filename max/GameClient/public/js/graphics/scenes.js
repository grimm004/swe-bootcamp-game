import {Colour, Matrix4, Quaternion, Vector3} from "./maths.js";
import {WorldObject} from "./world.js";


export class SceneNode extends WorldObject {
    #scale;

    /**
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Quaternion} [orientation=Quaternion.identity]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(position = Vector3.zeros, orientation = Quaternion.identity, scale = Vector3.ones, children = []) {
        super(position, orientation);

        this.#scale = new Vector3(scale);
        /**
         * @type {Matrix4}
         * @protected
         */
        this._transform = Matrix4.identity;

        this.updateMatrix();

        this.parent = null;
        this.children = [];
        for (const child of children)
            if (child instanceof SceneNode) {
                child.parent = this;
                this.children.push(child);
            }
        this.ids = {};

        this.visible = true;
        /**
         * @type {Boolean|null}
         */
        this.childrenVisible = null;
    }

    addChild(child, id = null) {
        child.parent = this;
        this.children.push(child);
        if (id !== null)
            this.ids[id] = this.children.length - 1;
        return this;
    }

    addChildren(children) {
        for (const child of children)
            this.addChild(child);
        return this;
    }

    removeChildById(id) {
        this.children.splice(this.ids[id], 1);
        return this;
    }

    clearChildren() {
        this.children = [];
        return this;
    }

    /**
     * @param {number} deltaTime
     * @param {object} uniforms
     * @param {Matrix4} [transform=Matrix4.identity]
     */
    update(deltaTime, uniforms, transform = Matrix4.identity) {
        this._transform = transform.multiplied(this.matrix);

        if (Object.hasOwn(this, "isSuzanne")) {
            console.trace(uniforms);
        }

        for (const child of this.children)
            child.update(deltaTime, uniforms, this._transform);
    }

    set scale(scaleVector) {
        this.#scale.copyFrom(scaleVector);
        this.updateMatrix();
    }

    get scale() {
        return this.#scale.copy;
    }

    get globalPosition() {
        return this._transform.translation;
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

    /**
     * @protected
     */
    _drawSelf() {}

    updateMatrix() {
        return this.matrix.fromRotationTranslationScale(this._orientation, this._position, this.#scale);
    }
}

export class DrawableSceneNode extends SceneNode {
    /**
     * @param {Mesh} mesh
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Quaternion} [orientation=Quaternion.identity]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientation = Quaternion.identity, scale = Vector3.ones, children = []) {
        super(position, orientation, scale, children);

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

    /**
     * @param {Renderer} renderer
     * @protected
     */
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
     * @param {Quaternion} [orientation=Quaternion.identity]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientation = Quaternion.identity, scale = Vector3.ones,
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
        this.uniforms.uModelMatrix = this._transform;
    }
}

export class UnlitSceneNode extends DrawableSceneNode {
    /**
     * @param {Mesh} mesh
     * @param {Vector3} [position=Vector3.zeros]
     * @param {Quaternion} [orientation=Quaternion.identity]
     * @param {Vector3} [scale=Vector3.ones]
     * @param {SceneNode[]} [children=[]]
     */
    constructor(mesh, position = Vector3.zeros, orientation = Quaternion.identity, scale = Vector3.ones,
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
        this.uniforms.uModelMatrix = this._transform;
    }
}