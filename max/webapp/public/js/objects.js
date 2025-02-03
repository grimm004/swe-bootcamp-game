import {DrawableSceneNode} from "./graphics.js";
import {Colour, Matrix4, Vector3} from "./math.js";

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