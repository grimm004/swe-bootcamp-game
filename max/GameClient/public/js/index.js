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

        window.addEventListener("resize", resize, false);

        const enableDebugCheckbox = document.getElementById("enableDebugCheckbox");
        enableDebugCheckbox.addEventListener("change", () => {
            document.getElementById("controls").className = enableDebugCheckbox.checked ? "" : "d-none";
            app.debugEnabled = enableDebugCheckbox.checked;
        }, false);

        let inputEnabled = false;

        const body = document.querySelector("body");
        body.addEventListener("keydown", e => inputEnabled ? app.keyDown(e.key.toLowerCase()) : null, false);
        body.addEventListener("keyup", e => inputEnabled ? app.keyUp(e.key.toLowerCase()) : null, false);

        canvas.addEventListener("pointermove",
                event => inputEnabled ? event.getCoalescedEvents()
                    .forEach(e => app.mouseMove(e.movementX, e.movementY, e.clientX, e.clientY)) : null, false);
        canvas.addEventListener("mousedown", e => inputEnabled ? app.mouseDown(e.button) : null, false);
        canvas.addEventListener("mouseup", e => inputEnabled ? app.mouseUp(e.button) : null, false);
        canvas.addEventListener("contextmenu", e => inputEnabled && e.button === 2 ? e.preventDefault() : null);

        // noinspection JSUnresolvedVariable
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;

        const mouseCaptureInfo = document.getElementById("mouseCaptureInfo");
        let allowPointerLock = true;

        const gameContainer = document.getElementById("gameContainer");
        gameContainer.addEventListener("dblclick", () => allowPointerLock ? canvas.requestPointerLock() : null, false);

        document.addEventListener("pointerlockchange", () => {
            // noinspection JSUnresolvedVariable
            if ((document.pointerLockElement || document.mozPointerLockElement) !== canvas) {
                inputEnabled = false;

                allowPointerLock = false;
                setTimeout(() => {
                    allowPointerLock = true;
                    mouseCaptureInfo.classList.remove("d-none");
                }, 2000);
                return;
            }

            inputEnabled = true;
            mouseCaptureInfo.classList.add("d-none");
        });

        (await app.initialise())
            .run();
    }
}

window.onload = Program.main;
