import {HubConnectionBuilder, LogLevel} from "../../lib/signalr.module.js";
import {showMessage} from "./message-popup.js";
import {Vector3} from "../graphics/maths.js";

class GameUi {
    /**
     * @param {SweBootcampGame} app
     * @param {HTMLCanvasElement} canvas
     * @param {WebGL2RenderingContext} gl
     */
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
        this._playerPositionLabel = document.getElementById("playerPositionLabel");
        this._physicsStatsLabel = document.getElementById("physicsStatsLabel");

        /**
         * @type {User|null}
         * @private
         */
        this._currentUser = null;

        /**
         * @type {Lobby|null}
         */
        this._currentLobby = null;

        /**
         * @type {HubConnection|null}
         */
        this._gameHubConnection = null;
    }

    get captureEnabled() {
        return this._captureEnabled;
    }

    /**
     * @param {boolean} value
     */
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
        // noinspection JSUnresolvedReference
        this.canvas.requestPointerLock =
            this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
        const gameContainer = document.getElementById("gameContainer");
        gameContainer.addEventListener(
            "dblclick",
            () => this._captureEnabled && this._allowCaptureAttempts ? this.canvas.requestPointerLock() : null,
            false
        );

        document.addEventListener("pointerlockchange", () => {
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
        });
    }

    // When the game should start (after authentication).
    async run() {
        this.app.run();
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

        this.captureEnabled = await this.startGameHubConnection(lobby.id);
    }

    /**
     * Starts the game hub connection for the specified lobby.
     * @param {string} lobbyId - The lobby ID to connect to.
     * @returns {Promise<boolean>}
     */
    async startGameHubConnection(lobbyId) {
        if (this._gameHubConnection)
            await this.stopGameHubConnection();

        /**
         * @type {HubConnection|null}
         */
        const gameHubConnection = new HubConnectionBuilder()
            .withUrl("/hubs/v1/game")
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        try {
            await gameHubConnection?.start();
            await gameHubConnection?.invoke("AddToGameGroup", lobbyId);
        } catch {
            showMessage("Failed to connect to game hub.", "error");
            return false;
        }

        gameHubConnection?.on("PlayerStateUpdate", (playerId, state, deltaTime) => {
            if (playerId === this._currentUser.id) return;

            const {
                position,
                direction,
            } = JSON.parse(state);
            this.app.tempPlayerStates[playerId] = {
                position: new Vector3(position),
                direction: new Vector3(direction),
                deltaTime
            };
        });

        this._gameHubConnection = gameHubConnection;
        return true;
    }

    /**
     * Stops the game hub connection.
     * @returns {Promise<void>}
     */
    async stopGameHubConnection() {
        if (!this._gameHubConnection) return;

        try {
            await this._gameHubConnection?.stop();
        } catch {
            // Ignore errors.
        }

        this._gameHubConnection = null;
    }

    finishGame() {
        this._inputEnabled = false;
        this.captureEnabled = false;
        this._currentUser = null;
        this._currentLobby = null;
    }

    setupDebug() {
        this._enableDebugCheckbox.addEventListener("change", e => {
            this.app.debugEnabled = !!e.target.checked;
            this._playerPositionLabel.classList.toggle("d-none", !this.app.debugEnabled);
            this._physicsStatsLabel.classList.toggle("d-none", !this.app.debugEnabled);
        });

        this.app.onUpdateCompleted = async (app, deltaTime) => {
            // public async Task PlayerStateUpdate(string lobbyId, string playerId, string state, float deltaTime)
            await this._gameHubConnection?.invoke("PlayerStateUpdate", this._currentLobby.id, this._currentUser.id, JSON.stringify(app.playerState), deltaTime);
            const {position: [x, y, z], direction: [a, b, c]} = app.playerState;
            this._playerPositionLabel.innerHTML = `Pos: ${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}<br>Dir: ${a.toFixed(2)}, ${b.toFixed(2)}, ${c.toFixed(2)}`;
            this._physicsStatsLabel.innerHTML = app.physicsDebugStats.replace("Time in milliseconds<br><br>", "");
        };

        this.app.onDrawCompleted = (app) => this._fpsLabel.textContent = `${app.averageFrameRate.toFixed(2)} FPS`;
    }
}

export default GameUi;
