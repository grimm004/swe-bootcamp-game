import {Colour} from "./math.js";
import {SweBootcampGame} from "./game.js";

class Program {
    static async main() {
        const canvas = document.querySelector("#glCanvas");

        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.warn("WebGL could not be initialised.");
            return;
        }

        const app = new SweBootcampGame(gl);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            app.resize();

            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();

        const enableControlsCheckbox = document.getElementById("enableControlsCheckbox");
        enableControlsCheckbox.addEventListener("change", () =>
            document.getElementById("controls").className = enableControlsCheckbox.checked ? "" : "d-none", false);

        const lightCheckbox = document.getElementById("lightCheckbox");
        lightCheckbox.addEventListener("change", () => app.lightColour = lightCheckbox.checked ? Colour.white : Colour.black, false);

        const lightSwingCheckbox = document.getElementById("lightSwingCheckbox");
        lightSwingCheckbox.addEventListener("change", () => app.lightSwing = lightSwingCheckbox.checked, false);

        window.addEventListener("resize", resize, false);

        const body = document.querySelector("body");
        body.addEventListener("keydown", e => app.keyDown(e.key), false);
        body.addEventListener("keyup", e => app.keyUp(e.key), false);

        canvas.addEventListener("mousemove", e => {
            // noinspection JSUnresolvedVariable
            if (document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas)
                app.mouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mousedown", e => app.mouseDown(e.button), false);
        canvas.addEventListener("mouseup", e => app.mouseUp(e.button), false);
        canvas.addEventListener("contextmenu", e => {
            if (e.button === 2) e.preventDefault();
        });

        // noinspection JSUnresolvedVariable
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        document.addEventListener("dblclick", () => canvas.requestPointerLock(), false);

        (await app.initialise())
            .run();
    }
}

window.onload = Program.main;

export {};
