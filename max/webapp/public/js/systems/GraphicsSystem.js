import * as ApeEcs from "../../lib/ape-ecs.module.js";
import DrawComponent from "../components/DrawComponent.js";
import {CameraEntityId, FrameInfoEntityId, SceneRootEntityId} from "../constants.js";
import {Matrix4} from "../math.js";
import {Debug} from "../debug.js";

export default class GraphicsSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.subscribe(DrawComponent.name);
    }

    onDrawComponentChanged(component, updatedProps) {
        if (component.sceneNode && (!updatedProps.includes("visible") && !updatedProps.includes("childrenVisible")))
            return;

        component.sceneNode.visible = component.visible;
        component.sceneNode.childrenVisible = component.childrenVisible;

        this.frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this.worldTransform = Matrix4.positionOrientationScale();
    }

    onChange(change) {
        switch (change.op) {
            case "change":
                this.onDrawComponentChanged(
                    this.world.getComponent(change.component),
                    change.props);
                return;
            default:
                return;
        }
    }

    update() {
        for (const change of this.changes)
            this.onChange(change);

        const deltaTime = this.frameInfo;

        const lightEntity = this.world.getEntity("light");
        const lightComponent = lightEntity.c.light;
        let lightPosition = lightComponent.attachedTo ? lightComponent.attachedTo.globalPosition : lightEntity.c.position.position;

        const camera = this.world.getEntity(CameraEntityId).c.camera.camera;

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

        Debug.uniforms = {
            uViewMatrix: camera.matrix,
            uProjectionMatrix: camera.projectionMatrix
        };

        const sceneRoot = this.world.getEntity(SceneRootEntityId).c.draw.sceneNode;
        sceneRoot.update(deltaTime, {
            col: unlitUniforms,
            tex: unlitUniforms,
            texLit: litUniforms,
            colLit: litUniforms
        }, this.worldTransform);
    }
}