import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {
    FrameInfoEntityId,
    KeyboardInputEntityId,
    MouseInputEntityId,
    WindowInfoEntityId
} from "../../constants.js";
import CameraComponent from "../components/CameraComponent.js";
import {PerspectiveCamera} from "../../../graphics/cameras.js";
import {Vector2, Vector3} from "../../../graphics/maths.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";


export default class CameraSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.subscribe(CameraComponent.name);
        this.frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this.query = this.createQuery()
            .fromAll(CameraComponent.name)
            .persist();
    }

    onCameraComponentAdded(entity) {
        const windowInfo = this.world.getEntity(WindowInfoEntityId).c.window;

        let initialPosition = Vector3.zeros, initialOrientation = Vector3.zeros;

        if (entity.has(PositionComponent.name)) {
            const positionComponent = entity.getOne(PositionComponent.name);
            initialPosition = positionComponent.position.copy;
        }

        if (entity.has(OrientationComponent.name)) {
            const orientationComponent = entity.getOne(OrientationComponent.name);
            initialOrientation = orientationComponent.direction.copy;
        }

        const cameraComponent = entity.getOne(CameraComponent.name);
        cameraComponent.update({
            camera: new PerspectiveCamera(
                cameraComponent.fovRad,
                windowInfo.aspectRatio,
                cameraComponent.near,
                cameraComponent.far,
                initialPosition,
                initialOrientation),
        });
    }

    onChange(change) {
        switch (change.op) {
            case "add":
                this.onCameraComponentAdded(
                    this.world.getEntity(change.entity));
                return;
            default:
                return;
        }
    }

    update() {
        for (const change of this.changes)
            this.onChange(change);

        const deltaTime = this.frameInfo.deltaTime;
        const windowInfo = this.world.getEntity(WindowInfoEntityId).c.window;
        const mouseInputComponent = this.world.getEntity(MouseInputEntityId).c.mouse;
        const keyboardInputComponent = this.world.getEntity(KeyboardInputEntityId).c.keyboard;
        const pressedKeys = keyboardInputComponent.keys;

        for (const entity of this.query.execute()) {
            const cameraComponent = entity.getOne(CameraComponent.name);
            const camera = cameraComponent.camera;

            camera.aspectRatio = windowInfo.aspectRatio;

            // Turn camera with mouse movement
            camera.turn(new Vector2(
                mouseInputComponent.dx * deltaTime * cameraComponent.mouseSensitivity,
                mouseInputComponent.dy * deltaTime * cameraComponent.mouseSensitivity)
                .map(x => Math.radians(x)));

            // Move camera with keyboard input
            camera.move(new Vector2(
                Number(pressedKeys.has("w")) - Number(pressedKeys.has("s")),
                Number(pressedKeys.has("d")) - Number(pressedKeys.has("a"))
            ).mul(2 + (2 * Number(pressedKeys.has("shift")))).mul(deltaTime));

            // Update camera state
            camera.update(deltaTime);

            if (entity.has(PositionComponent.name)) {
                const positionComponent = entity.getOne(PositionComponent.name);

                positionComponent.update({
                    position: camera.position
                });
            }

            if (entity.has(OrientationComponent.name)) {
                const orientationComponent = entity.getOne(OrientationComponent.name);

                orientationComponent.update({
                    direction: camera.orientation
                });
            }
        }
    }
}