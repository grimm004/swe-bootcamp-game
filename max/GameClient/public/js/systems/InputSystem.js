import * as ApeEcs from "../../lib/ape-ecs.module.js";
import {KeyboardInputEntityId, MouseInputEntityId} from "../constants.js";
import {Vector2} from "../math.js";

export default class InputSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._mouseMoved = true;
        /**
         * @type {Vector2}
         */
        this.mousePos = Vector2.zeros;
        /**
         * @type {Vector2}
         */
        this.mouseChange = Vector2.zeros;

        this._mouseButtonsUpdated = false;
        this._pressedButtons = new Set();

        this._keyboadUpdated = false;
        this._pressedKeys = new Set();
    }

    onMouseMove(mousePos, mouseChange) {
        this._mouseMoved = true;
        this.mousePos = mousePos;
        this.mouseChange = mouseChange;
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
                x: this.mousePos.x,
                y: this.mousePos.y,
                dx: this.mouseChange.x,
                dy: this.mouseChange.y,
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
}