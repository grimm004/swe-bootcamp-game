import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {
    FrameInfoEntityId,
    KeyboardInputEntityId,
    MouseInputEntityId,
    WindowInfoEntityId
} from "../../constants.js";
import CameraComponent from "../components/CameraComponent.js";
import {PerspectiveCamera} from "../../../graphics/cameras.js";
import {Quaternion, Vector2, Vector3} from "../../../graphics/maths.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import PlayerComponent from "../components/PlayerComponent.js";


export default class CameraSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.subscribe(CameraComponent.name);
        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this._cameraQuery = this.createQuery()
            .fromAll(CameraComponent.name)
            .persist();
    }

    #onCameraComponentAdded(entity) {
        const windowInfo = this.world.getEntity(WindowInfoEntityId).c.window;

        let initialPosition = Vector3.zeros, initialOrientation = Quaternion.identity;

        if (entity.has(PositionComponent.name)) {
            const positionComponent = entity.getOne(PositionComponent.name);
            initialPosition = positionComponent.position.copy;
        }

        if (entity.has(OrientationComponent.name)) {
            const orientationComponent = entity.getOne(OrientationComponent.name);
            initialOrientation.copyFrom(orientationComponent.orientation);
        }

        const cameraComponent = entity.getOne(CameraComponent.name);
        cameraComponent.update({
            camera: new PerspectiveCamera(
                cameraComponent.fovRad,
                windowInfo.aspectRatio,
                cameraComponent.near,
                cameraComponent.far,
                initialPosition,
                initialOrientation,
                cameraComponent.yawDegrees,
                cameraComponent.pitchDegrees),
        });
    }

    #onChange(change) {
        switch (change.op) {
            case "add":
                this.#onCameraComponentAdded(
                    this.world.getEntity(change.entity));
                return;
            default:
                return;
        }
    }

    update() {
        for (const change of this.changes)
            this.#onChange(change);

        const deltaTime = this._frameInfo.deltaTime;
        const windowInfo = this.world.getEntity(WindowInfoEntityId).c.window;
        const mouseInputComponent = this.world.getEntity(MouseInputEntityId).c.mouse;
        const keyboardInputComponent = this.world.getEntity(KeyboardInputEntityId).c.keyboard;
        const pressedKeys = keyboardInputComponent.keys;

        for (const entity of this._cameraQuery.execute()) {
            const cameraComponent = entity.getOne(CameraComponent.name);
            const camera = cameraComponent.camera;

            camera.aspectRatio = windowInfo.aspectRatio;

            if (entity.has(PlayerComponent.name)) {
                camera.turn(
                    mouseInputComponent.dx * deltaTime * cameraComponent.mouseSensitivity,
                    mouseInputComponent.dy * deltaTime * cameraComponent.mouseSensitivity);

                const {x: forwards, y: sideways} = new Vector2(
                    Number(pressedKeys.has("w")) - Number(pressedKeys.has("s")),
                    Number(pressedKeys.has("d")) - Number(pressedKeys.has("a"))
                ).mul(2 + (2 * Number(pressedKeys.has("shift")))).mul(deltaTime);
                camera.move(forwards, sideways);

                if (pressedKeys.has("r")) {
                    camera.targetPosition = new Vector3(2.0);
                    camera.setTargetYawPitch(-45.0, 30.0);
                }
            }

            if (entity.has(PositionComponent.name)) {
                const positionComponent = entity.getOne(PositionComponent.name);

                positionComponent.update({
                    position: camera.position
                });
            }

            if (entity.has(OrientationComponent.name)) {
                const orientationComponent = entity.getOne(OrientationComponent.name);

                orientationComponent.update({
                    orientation: camera.orientation
                });
            }

            cameraComponent.update({
                yawDegrees: camera.yaw,
                pitchDegrees: camera.pitch,
            });

            camera.update(deltaTime);
        }
    }
}