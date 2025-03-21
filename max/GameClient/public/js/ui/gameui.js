import {getCookie} from "./util/cookies.js";
import {SessionCookie} from "../constants.js";

class GameUi {
    /**
     * @type {SweBootcampGame}
     */
    #app;
    /**
     * @type {HTMLCanvasElement}
     */
    #canvas;

    #inputEnabled = false;
    #allowCaptureAttempts = true;

    #gameContainer;
    #mouseCaptureOverlay;
    #enableDebugCheckbox;
    #fpsLabel;
    #playerPositionLabel;
    #physicsStatsLabel;
    #multiplayerStatsLabel;

    /**
     * Creates a new instance of the game UI.
     * @param {SweBootcampGame} app - The game instance.
     * @param {HTMLCanvasElement} canvas - The game canvas.
     */
    constructor(app, canvas) {
        this.#app = app;
        this.#canvas = canvas;

        this.#gameContainer = document.getElementById("gameContainer");
        this.#mouseCaptureOverlay = document.getElementById("mouseCaptureOverlay");
        this.#enableDebugCheckbox = document.getElementById("enableDebugCheckbox");
        this.#fpsLabel = document.getElementById("fpsLabel");
        this.#playerPositionLabel = document.getElementById("playerPositionLabel");
        this.#physicsStatsLabel = document.getElementById("physicsStatsLabel");
        this.#multiplayerStatsLabel = document.getElementById("multiplayerStatsLabel");

        /**
         * @type {() => void}
         */
        this.onGameFinish = null;
    }

    /**
     * Gets whether the mouse capture overlay is visible.
     * @returns {boolean}
     */
    get #captureEnabled() {
        return !this.#mouseCaptureOverlay.classList.contains("d-none");
    }

    /**
     * Sets whether the mouse capture overlay is visible.
     * @param {boolean} value - True to hide the overlay and enable mouse capture, false to hide it.
     */
    set #captureEnabled(value) {
        this.#mouseCaptureOverlay.classList.toggle("d-none", !value);
    }

    /**
     * Sets up the game UI.
     * @returns {this}
     */
    setup() {
        return this
            .#setupResize()
            .#setupInput()
            .#setupPointerLock()
            .#setupGame()
            .#setupDebug();
    }

    /**
     * Sets up the canvas resize event.
     * @returns {this}
     */
    #setupResize() {
        this.#onResize();
        window.addEventListener("resize", this.#onResize.bind(this), false);
        return this;
    }

    /**
     * Handles the window resize event.
     */
    #onResize() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
        this.#app.onResize(window.innerWidth, window.innerHeight);
    }

    /**
     * Sets up the input events.
     * @returns {this}
     */
    #setupInput() {
        this.#canvas.addEventListener("pointermove", this.#onMouseMove.bind(this), false);
        this.#canvas.addEventListener("mousedown", this.#onMouseDown.bind(this), false);
        this.#canvas.addEventListener("mouseup", this.#onMouseUp.bind(this), false);
        this.#canvas.addEventListener("contextmenu", this.#onMouseContextMenu.bind(this), false);

        document.body.addEventListener("keydown", this.#onKeyDown.bind(this), false);
        document.body.addEventListener("keyup", this.#onKeyUp.bind(this), false);

        return this;
    }

    /**
     * Handles the mouse move event.
     * @param {PointerEvent} event - The mouse move event.
     */
    #onMouseMove(event) {
        if (!this.#inputEnabled) return;
        event.getCoalescedEvents().forEach((e) => {
            this.#app.onMouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
        });
    }

    /**
     * Handles the mouse down event.
     * @param {MouseEvent} e - The mouse down event.
     */
    #onMouseDown(e) {
        if (!this.#inputEnabled) return;
        this.#app.onMouseDown(e.button);
    }

    /**
     * Handles the mouse up event.
     * @param {MouseEvent} e - The mouse up event.
     */
    #onMouseUp(e) {
        if (!this.#inputEnabled) return;
        this.#app.onMouseUp(e.button);
    }

    /**
     * Handles the mouse context menu event.
     * @param {MouseEvent} e - The mouse context menu event.
     */
    #onMouseContextMenu(e) {
        if (!this.#inputEnabled || e.button !== 2) return;
        e.preventDefault();
    }

    /**
     * Handles the key down event.
     * @param {KeyboardEvent} e - The key down event.
     */
    #onKeyDown(e) {
        if (!this.#inputEnabled) return;
        this.#app.onKeyDown(e.key.toLowerCase());
    }

    /**
     * Handles the key up event.
     * @param {KeyboardEvent} e - The key up event
     */
    #onKeyUp(e) {
        if (!this.#inputEnabled) return;
        this.#app.onKeyUp(e.key.toLowerCase());
    }

    /**
     * Sets up the pointer lock events.
     * @returns {this}
     */
    #setupPointerLock() {
        // noinspection JSUnresolvedReference
        this.#canvas.requestPointerLock = this.#canvas.requestPointerLock || this.#canvas.mozRequestPointerLock;

        this.#gameContainer.addEventListener("dblclick", this.#onGameContainerDoubleClick.bind(this), false);
        document.addEventListener("pointerlockchange", this.#onPointerLockChange.bind(this), false);

        return this;
    }

    /**
     * Handles the game container double click event.
     * @returns {Promise<void>}
     */
    async #onGameContainerDoubleClick() {
        if (!(this.#captureEnabled && this.#allowCaptureAttempts)) return;
        await this.#canvas.requestPointerLock();
    }

    /**
     * Handles the pointer lock change event.
     */
    #onPointerLockChange() {
        // noinspection JSUnresolvedReference
        if (
            (document.pointerLockElement || document.mozPointerLockElement) !==
            this.#canvas
        ) {
            this.#inputEnabled = false;
            this.#allowCaptureAttempts = false;
            setTimeout(() => {
                this.#allowCaptureAttempts = true;
                this.#mouseCaptureOverlay.classList.remove("d-none");
            }, 2000);
            return;
        }

        this.#inputEnabled = true;
        this.#mouseCaptureOverlay.classList.add("d-none");
    }

    /**
     * Sets up the game hooks.
     * @returns {this}
     */
    #setupGame() {
        this.#app.onGameFinished = this.#onGameFinish.bind(this);

        return this;
    }

    #onGameFinish() {
        document.exitPointerLock();
        this.#captureEnabled = false;
        this.onGameFinish?.();
    }

    /**
     * Sets up the debug UI.
     * @returns {this}
     */
    #setupDebug() {
        this.#enableDebugCheckbox.addEventListener("change", this.#onDebugCheckboxChange.bind(this), false);

        this.#app.onUpdateCompleted = this.#onGameUpdateCompleted.bind(this);
        this.#app.onDrawCompleted = this.#onGameDrawCompleted.bind(this);

        return this;
    }

    /**
     * Handles the debug checkbox change event.
     * @param {Event} e - The checkbox change event.
     */
    #onDebugCheckboxChange(e) {
        this.#app.debugEnabled = !!e.target.checked;
        this.#playerPositionLabel.classList.toggle("d-none", !this.#app.debugEnabled);
        this.#physicsStatsLabel.classList.toggle("d-none", !this.#app.debugEnabled);
        this.#multiplayerStatsLabel.classList.toggle("d-none", !this.#app.debugEnabled);
    }

    /**
     * Handles the game update completed event
     * @param {PlayerState} playerState
     * @param {string} physicsDebugStats
     * @param {string} multiplayerDebugStats
     */
    #onGameUpdateCompleted({playerState: {position, cameraRotation, direction, orientation}, physicsDebugStats, multiplayerDebugStats}) {
        this.#playerPositionLabel.innerHTML = `
            Pos: ${position.map(x => x.toFixed(2)).join(", ")}<br>
            Yaw: ${cameraRotation.yaw.toFixed(0)} / Pitch: ${cameraRotation.pitch.toFixed(0)}<br>
            Dir: ${direction.map(x => x.toFixed(2)).join(", ")}<br>
            Quat: ${orientation.map(x => x.toFixed(2)).join(", ")}<br>`;
        this.#physicsStatsLabel.innerHTML = physicsDebugStats;
        this.#multiplayerStatsLabel.innerHTML = multiplayerDebugStats;
    }

    /**
     * Handles the game draw completed event.
     */
    #onGameDrawCompleted() {
        this.#fpsLabel.textContent = `${this.#app.averageFrameRate.toFixed(2)} FPS`;
    }

    /**
     * Joins the specified lobby and starts the game hub connection.
     * @param {User} user - The user joining the game.
     * @param {Lobby} lobby - The lobby to join.
     * @returns {Promise<void>}
     */
    async joinGame(user, lobby) {
        await this.#app.joinGame(user.id, lobby.id, getCookie(SessionCookie), user.id === lobby.hostId);
        await this.startGame();
    }

    /**
     * Starts the game without joining online.
     * @returns {Promise<void>}
     */
    async startGame() {
        this.#captureEnabled = true;
        await this.#app.startGame();
    }
}

export default GameUi;
