class GameUi {
    /**
     * @param {SweBootcampGame} app
     * @param {HTMLCanvasElement} canvas
     */
    constructor(app, canvas) {
        this.app = app;
        this.canvas = canvas;

        this._inputEnabled = false;
        this._allowCaptureAttempts = true;

        this._gameContainer = document.getElementById("gameContainer");
        this._mouseCaptureOverlay = document.getElementById("mouseCaptureOverlay");
        this._enableDebugCheckbox = document.getElementById("enableDebugCheckbox");
        this._fpsLabel = document.getElementById("fpsLabel");
        this._playerPositionLabel = document.getElementById("playerPositionLabel");
        this._physicsStatsLabel = document.getElementById("physicsStatsLabel");

        /**
         * @type {User|null}
         * @private
         */
        this._currentUser = null;

        /**
         * @type {Lobby|null}
         * @private
         */
        this._currentLobby = null;
    }

    /**
     * Gets whether the mouse capture overlay is visible.
     * @returns {boolean}
     * @private
     */
    get _captureEnabled() {
        return !this._mouseCaptureOverlay.classList.contains("d-none");
    }

    /**
     * Sets whether the mouse capture overlay is visible.
     * @param {boolean} value - True to hide the overlay and enable mouse capture, false to hide it.
     * @private
     */
    set _captureEnabled(value) {
        this._mouseCaptureOverlay.classList.toggle("d-none", !value);
    }

    /**
     * Sets up the game UI.
     * @returns {this}
     */
    setup() {
        return this
            ._setupResize()
            ._setupInput()
            ._setupPointerLock()
            ._setupDebug();
    }

    /**
     * Sets up the canvas resize event.
     * @returns {this}
     * @private
     */
    _setupResize() {
        this._onResize();
        window.addEventListener("resize", this._onResize.bind(this), false);
        return this;
    }

    /**
     * Handles the window resize event.
     * @private
     */
    _onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.app.onResize(window.innerWidth, window.innerHeight);
    }

    /**
     * Sets up the input events.
     * @returns {this}
     * @private
     */
    _setupInput() {
        this.canvas.addEventListener("pointermove", this._onMouseMove.bind(this), false);
        this.canvas.addEventListener("mousedown", this._onMouseDown.bind(this), false);
        this.canvas.addEventListener("mouseup", this._onMouseUp.bind(this), false);
        this.canvas.addEventListener("contextmenu", this._onMouseContextMenu.bind(this), false);

        document.body.addEventListener("keydown", this._onKeyDown.bind(this), false);
        document.body.addEventListener("keyup", this._onKeyUp.bind(this), false);

        return this;
    }

    /**
     * Handles the mouse move event.
     * @param {PointerEvent} event - The mouse move event.
     * @private
     */
    _onMouseMove(event) {
        if (!this._inputEnabled) return;
        event.getCoalescedEvents().forEach((e) => {
            this.app.onMouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
        });
    }

    /**
     * Handles the mouse down event.
     * @param {MouseEvent} e - The mouse down event.
     * @private
     */
    _onMouseDown(e) {
        if (!this._inputEnabled) return;
        this.app.onMouseDown(e.button);
    }

    /**
     * Handles the mouse up event.
     * @param {MouseEvent} e - The mouse up event.
     * @private
     */
    _onMouseUp(e) {
        if (!this._inputEnabled) return;
        this.app.onMouseUp(e.button);
    }

    /**
     * Handles the mouse context menu event.
     * @param {MouseEvent} e - The mouse context menu event.
     * @private
     */
    _onMouseContextMenu(e) {
        if (!this._inputEnabled || e.button !== 2) return;
        e.preventDefault();
    }

    /**
     * Handles the key down event.
     * @param {KeyboardEvent} e - The key down event.
     * @private
     */
    _onKeyDown(e) {
        if (!this._inputEnabled) return;
        this.app.onKeyDown(e.key.toLowerCase());
    }

    /**
     * Handles the key up event.
     * @param {KeyboardEvent} e - The key up event
     * @private
     */
    _onKeyUp(e) {
        if (!this._inputEnabled) return;
        this.app.onKeyUp(e.key.toLowerCase());
    }

    /**
     * Sets up the pointer lock events.
     * @returns {this}
     * @private
     */
    _setupPointerLock() {
        // noinspection JSUnresolvedReference
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;

        this._gameContainer.addEventListener("dblclick", this._onGameContainerDoubleClick.bind(this), false);
        document.addEventListener("pointerlockchange", this._onPointerLockChange.bind(this), false);

        return this;
    }

    async _onGameContainerDoubleClick() {
        if (this._captureEnabled && this._allowCaptureAttempts) {
            await this.canvas.requestPointerLock();
        }
    }

    _onPointerLockChange() {
        // noinspection JSUnresolvedReference
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
    }

    /**
     * Sets up the debug UI.
     * @returns {this}
     * @private
     */
    _setupDebug() {
        this._enableDebugCheckbox.addEventListener("change", this._onDebugCheckboxChange.bind(this), false);

        this.app.onUpdateCompleted = this._onGameUpdateCompleted.bind(this);
        this.app.onDrawCompleted = this._onGameDrawCompleted.bind(this);

        return this;
    }

    /**
     * Handles the debug checkbox change event.
     * @param {Event} e - The checkbox change event.
     * @private
     */
    _onDebugCheckboxChange(e) {
        this.app.debugEnabled = !!e.target.checked;
        this._playerPositionLabel.classList.toggle("d-none", !this.app.debugEnabled);
        this._physicsStatsLabel.classList.toggle("d-none", !this.app.debugEnabled);
    }

    /**
     * Handles the game update completed event
     * @param {PlayerState} playerState
     * @param {string} physicsDebugStats
     * @private
     */
    _onGameUpdateCompleted({playerState, physicsDebugStats}) {
        const {position: [x, y, z], direction: [a, b, c]} = playerState;
        this._playerPositionLabel.innerHTML = `Pos: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}<br>Dir: ${a.toFixed(2)}, ${b.toFixed(2)}, ${c.toFixed(2)}`;
        this._physicsStatsLabel.innerHTML = physicsDebugStats.replace("Time in milliseconds<br><br>", "");
    }

    /**
     * Handles the game draw completed event.
     * @private
     */
    _onGameDrawCompleted() {
        this._fpsLabel.textContent = `${this.app.averageFrameRate.toFixed(2)} FPS`;
    }

    /**
     * Joins the specified lobby and starts the game hub connection.
     * @param {User} user - The user joining the game.
     * @param {Lobby} lobby - The lobby to join.
     * @returns {Promise<void>}
     */
    async joinGame(user, lobby) {
        this._currentUser = user;
        this._currentLobby = lobby;

        await this.app.joinGame(user.id, lobby.id);
        this._captureEnabled = true;
    }
}

export default GameUi;
