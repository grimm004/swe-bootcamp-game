class GameUi {
    constructor(app, canvas, gl) {
        this.app = app;
        this.canvas = canvas;
        this.gl = gl;
        this._inputEnabled = false;
        this._allowCaptureAttempts = true;
        this._captureEnabled = false;
        this._mouseCaptureOverlay = document.getElementById("mouseCaptureOverlay");
        this._enableDebugCheckbox = document.getElementById("enableDebugCheckbox");
        this._fpsLabel = document.getElementById("fpsLabel");
        this._physicsStatsLabel = document.getElementById("physicsStatsLabel");
    }

    get captureEnabled() {
        return this._captureEnabled;
    }

    set captureEnabled(value) {
        this._captureEnabled = value;
        this._mouseCaptureOverlay.classList.toggle("d-none", !value);
    }

    async setup() {
        this.setupResize();
        this.setupInput();
        this.setupPointerLock();
        this.setupDebug();

        await this.app.initialise();
    }

    setupResize() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.app.resize();
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        };
        resize();
        window.addEventListener("resize", resize, false);
    }

    setupInput() {
        // Key events.
        document.body.addEventListener(
            "keydown",
            (e) => {
                if (this._inputEnabled) this.app.keyDown(e.key.toLowerCase());
            },
            false
        );
        document.body.addEventListener(
            "keyup",
            (e) => {
                if (this._inputEnabled) this.app.keyUp(e.key.toLowerCase());
            },
            false
        );

        // Mouse events.
        this.canvas.addEventListener(
            "pointermove",
            (event) => {
                if (this._inputEnabled) {
                    event.getCoalescedEvents().forEach((e) => {
                        this.app.mouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
                    });
                }
            },
            false
        );
        this.canvas.addEventListener(
            "mousedown",
            (e) => {
                if (this._inputEnabled) this.app.mouseDown(e.button);
            },
            false
        );
        this.canvas.addEventListener(
            "mouseup",
            (e) => {
                if (this._inputEnabled) this.app.mouseUp(e.button);
            },
            false
        );
        this.canvas.addEventListener(
            "contextmenu",
            (e) => {
                if (this._inputEnabled && e.button === 2) e.preventDefault();
            },
            false
        );
    }

    setupPointerLock() {
        // Support for pointer lock.
        this.canvas.requestPointerLock =
            this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
        const gameContainer = document.getElementById("gameContainer");
        gameContainer.addEventListener(
            "dblclick",
            () => this._captureEnabled && this._allowCaptureAttempts ? this.canvas.requestPointerLock() : null,
            false
        );

        document.addEventListener("pointerlockchange", () => {
            if (
                (document.pointerLockElement || document.mozPointerLockElement) !==
                this.canvas
            ) {
                this._inputEnabled = false;
                this._allowCaptureAttempts = false;
                setTimeout(() => {
                    this._allowCaptureAttempts = true;
                    this._mouseCaptureOverlay.classList.remove("d-none");
                }, 2000);
                return;
            }
            this._inputEnabled = true;
            this._mouseCaptureOverlay.classList.add("d-none");
        });
    }

    // When the game should start (after authentication).
    async run() {
        this.app.run();
    }

    // Optionally, a method to finish the game.
    finishGame() {
        this._inputEnabled = false;
        // Additional cleanup or UI changes as needed.
    }

    setupDebug() {
        this._enableDebugCheckbox.addEventListener("change", e => {
            this.app.debugEnabled = !!e.target.checked;
            this._physicsStatsLabel.classList.toggle("d-none", !this.app.debugEnabled);
        });
        this.app.onUpdateCompleted = () => this._physicsStatsLabel.innerHTML = this.app.physicsDebugStats.replace("Time in milliseconds<br><br>", "");
        this.app.onDrawCompleted = () => this._fpsLabel.textContent = `${this.app.averageFrameRate.toFixed(2)} FPS`;
    }
}

export default GameUi;
