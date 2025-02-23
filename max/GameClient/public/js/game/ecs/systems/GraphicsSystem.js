import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import DrawComponent from "../components/DrawComponent.js";
import {PlayerEntityId, FrameInfoEntityId, SceneRootEntityId} from "../../constants.js";
import {Matrix4} from "../../../graphics/maths.js";
import {Debug} from "../../debug.js";


export default class GraphicsSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.subscribe(DrawComponent.name);

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this._worldTransform = Matrix4.positionOrientationScale();
    }

    #onDrawComponentChanged(component, updatedProps) {
        if (component.sceneNode && (!updatedProps.includes("visible") && !updatedProps.includes("childrenVisible")))
            return;

        component.c.sceneNode.visible = component.visible;
        component.c.sceneNode.childrenVisible = component.childrenVisible;
    }

    #onChange(change) {
        if (change.type !== DrawComponent.name)
            return;

        switch (change.op) {
            case "change":
                this.#onDrawComponentChanged(
                    this.world.getComponent(change.component),
                    change.props);
                return;
            default:
                return;
        }
    }

    update() {
        for (const change of this.changes)
            this.#onChange(change);

        const deltaTime = this._frameInfo;

        const lightEntity = this.world.getEntity("light");
        const lightComponent = lightEntity.c.light;
        let lightPosition = lightComponent.attachedTo ? lightComponent.attachedTo.globalPosition : lightEntity.c.position.position;

        const camera = this.world.getEntity(PlayerEntityId).c.camera.camera;

        const commonUniforms = {
            uViewMatrix: camera.matrix,
            uProjectionMatrix: camera.projectionMatrix,
        }

        const litUniforms = {
            ...commonUniforms,
            uLightPosition: lightPosition,
            uLightColour: lightComponent.colour.rgb,
            uEyePosition: camera.position
        };

        const unlitUniforms = {
            ...commonUniforms,
            uColour: lightComponent.colour
        };

        Debug._uniforms = {
            uViewMatrix: camera.matrix,
            uProjectionMatrix: camera.projectionMatrix
        };

        const sceneRoot = this.world.getEntity(SceneRootEntityId).c.draw.sceneNode;
        sceneRoot.update(deltaTime, {
            col: unlitUniforms,
            tex: unlitUniforms,
            texLit: litUniforms,
            colLit: litUniforms
        }, this._worldTransform);
    }
}