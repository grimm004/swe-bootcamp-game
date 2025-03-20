import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {KeyboardInputEntityId, MouseInputEntityId, PlayerEntityId} from "../../constants.js";
import {Vector2, Vector3} from "../../../graphics/maths.js";
import ImpulseComponent from "../components/ImpulseComponent.js";


export default class InputSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._mouseMoved = true;
        /**
         * @type {Vector2}
         * @private
         */
        this._mousePos = Vector2.zeros;
        /**
         * @type {Vector2}
         * @private
         */
        this._mouseChange = Vector2.zeros;

        this._mouseButtonsUpdated = false;
        this._pressedButtons = new Set();

        this._keyboadUpdated = false;
        this._pressedKeys = new Set();
    }

    onMouseMove(mousePos, mouseChange) {
        this._mouseMoved = true;
        this._mousePos = mousePos;
        this._mouseChange = mouseChange;
    }

    onMouseButtonUpdated(pressedButtons) {
        this._mouseButtonsUpdated = true;
        this._pressedButtons = pressedButtons;
    }

    onKeyboardUpdate(pressedKeys) {
        this._keyboadUpdated = true;
        this._pressedKeys = pressedKeys;
    }

    update() {
        const mouseInputComponent = this.world.getEntity(MouseInputEntityId).c.mouse;

        mouseInputComponent.update({
            dx: 0,
            dy: 0,
        });

        if (this._mouseMoved) {
            mouseInputComponent.update({
                x: this._mousePos.x,
                y: this._mousePos.y,
                dx: this._mouseChange.x,
                dy: this._mouseChange.y,
            });

            this._mouseMoved = false;
        }

        if (this._mouseButtonsUpdated) {
            mouseInputComponent.update({
                buttons: this._pressedButtons,
            });

            this._mouseButtonsUpdated = false;
        }

        if (this._keyboadUpdated) {
            const keyboardInputComponent = this.world.getEntity(KeyboardInputEntityId).c.keyboard;

            keyboardInputComponent.update({
                keys: this._pressedKeys,
            });

            this._keyboadUpdated = false;
        }
    }

    #updateImpulses() {
        const camera = this.world.getEntity(PlayerEntityId).c.camera.camera;
        if (key === " ") {
            // todo: move out to input system
            for (let i = 0; i < 6; i++) {
                const chairEntity = this.world.getEntity(`chair_${i}`);
                chairEntity.addComponent({
                    type: ImpulseComponent.name,
                    position: chairEntity.c.position.position.subtracted(new Vector3(0, -1, 0)),
                    force: new Vector3(0.0, 100.0, 0.0),
                });
            }
        } else if (key === "e") {
            for (let i = 0; i < 6; i++) {
                const chairEntity = this.world.getEntity(`chair_${i}`);
                chairEntity.addComponent({
                    type: ImpulseComponent.name,
                    position: chairEntity.c.position.position.multiplied(0.75),
                    force: new Vector3(0.0, 100.0, 0.0),
                });
            }
        } else if (key === "i") {
            for (let i = 0; i < 6; i++) {
                const chairEntity = this.world.getEntity(`chair_${i}`);
                chairEntity.addComponent({
                    type: ImpulseComponent.name,
                    position: chairEntity.c.position.position.multiplied(1.25),
                    force: new Vector3(0.0, 100.0, 0.0),
                });
            }
        }
    }
}