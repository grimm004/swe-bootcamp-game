import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {FrameInfoEntityId, PlayerEntityId} from "../../constants.js";
import MultiplayerComponent from "../components/MultiplayerComponent.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import {Debug} from "../../debug.js";
import {Colour, FrameCounter, Quaternion, Vector3} from "../../../graphics/maths.js";
import {HubConnectionBuilder, LogLevel} from "../../../../lib/signalr.module.js";
import {showMessage} from "../../../ui/message-popup.js";
import NetworkSynchroniseComponent from "../components/NetworkSyncroniseComponent.js";
import GameHostComponent from "../components/GameHostComponent.js";
import RigidBodyComponent from "../components/RigidBodyComponent.js";
import SizeComponent from "../components/SizeComponent.js";


export default class MultiplayerSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {EntityFactory} entityFactory
     * @param {string} gameHubUrl
     */
    init(entityFactory, gameHubUrl) {
        this.query = this.createQuery()
            .fromAll(MultiplayerComponent.name, PositionComponent.name, OrientationComponent.name)
            .persist();

        this.synchroniseQuery = this.createQuery()
            .fromAll(NetworkSynchroniseComponent.name, PositionComponent.name, OrientationComponent.name, SizeComponent.name, RigidBodyComponent.name)
            .persist();

        this._entityFactory = entityFactory;
        this._gameHubUrl = gameHubUrl;

        /**
         * @type {HubConnection|null}
         * @private
         */
        this._gameHubConnection = null;

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this._fixedTimeStep = 1 / 64;
        this._timeAccumulator = 0;
        this._frameCounter = new FrameCounter();
        this._lastTickTime = null;
    }

    /**
     * Fetches the multiplayer debug stats.
     * @returns {string}
     */
    get multiplayerDebugStats() {
        return this._gameHubConnection
            ? `
            <b>Multiplayer System</b><br>
            Fixed Time Step:&nbsp;&nbsp;${this._fixedTimeStep.toFixed(4)}s<br>
            Time Accumulator:&nbsp;${this._timeAccumulator.toFixed(4)}s<br>
            Network Tickrate:&nbsp;&nbsp;&nbsp;${String(Math.max(0.0, this._frameCounter.averageFrameRate).toFixed(1)).padStart(5, "0")}`
            : "<b>Multiplayer System</b><br>Not Connected";
    }

    /**
     * Joins the specified game.
     * @param {string} playerId
     * @param {string} gameId
     * @param {boolean} isHost
     */
    async joinGame(playerId, gameId, isHost) {
        this.world.getEntity(PlayerEntityId).c.player.update({playerId, gameId});
        if (isHost)
            this.world.getEntity(PlayerEntityId).addComponent({
                type: GameHostComponent.name,
            });
        await this.#startGameHubConnection(gameId);
    }

    /**
     * Starts the game hub connection for the specified lobby.
     * @param {string} gameId - The ID of the game to join.
     * @returns {Promise<boolean>}
     */
    async #startGameHubConnection(gameId) {
        if (this._gameHubConnection)
            await this.#stopGameHubConnection();

        /**
         * @type {HubConnection|null}
         */
        const gameHubConnection = new HubConnectionBuilder()
            .withUrl(this._gameHubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        try {
            await gameHubConnection?.start();
            // noinspection JSCheckFunctionSignatures
            await gameHubConnection?.invoke("AddToGameGroup", gameId);
        } catch {
            showMessage("Failed to connect to game hub.", "error");
            return false;
        }

        gameHubConnection?.on("PlayerStateUpdate", this.#onPlayerStateUpdate.bind(this));
        gameHubConnection?.on("WorldStateUpdate", this.#onWorldStateUpdate.bind(this));

        this._gameHubConnection = gameHubConnection;
        return true;
    }

    /**
     * @param {string} playerId
     * @param {string} state
     * @param {number} deltaTime
     */
    #onPlayerStateUpdate(playerId, state, deltaTime) {
        if (this.world.getEntity(PlayerEntityId).c.player.playerId === playerId) return;

        const {
            position,
            orientation,
        } = JSON.parse(state);

        this.#setMultiplayerState(playerId, new Vector3(position), new Quaternion(orientation), deltaTime);
    }

    /**
     * @param {string} playerId
     * @param {Vector3} position
     * @param {Quaternion} orientation
     * @param {number} deltaTime
     */
    #setMultiplayerState(playerId, position, orientation, deltaTime) {
        let player = this.world.getEntity(playerId);
        if (!player)
            player = this._entityFactory.createMultiplayerEntity(playerId);

        // todo: add actions
        // todo: add interpolation
        // todo: potentially convert to action components and process them in the update loop (replay actions or take latest state, etc.)
        player.c.position.update({position});
        player.c.orientation.update({orientation});
        player.c.time.update({deltaTime});
    }

    /**
     * @param {string} playerId
     * @param {string} state
     */
    #onWorldStateUpdate(playerId, state) {
        if (this.world.getEntity(PlayerEntityId).c.player.playerId === playerId) return;

        for (const entityStateUpdate of JSON.parse(state)) {
            const {
                id,
                data: {
                    position,
                    orientation,
                    size,
                },
            } = entityStateUpdate;

            this.#setRigidBodyState(playerId, id, position, orientation, size);
        }
    }

    #setRigidBodyState(playerId, entityId, position, orientation, size) {
        let entity = this.world.getEntity(entityId);
        if (!entity)
            throw new Error(`Entity not found: ${entityId}`);

        entity.c.position.update({position: new Vector3(position)});
        entity.c.orientation.update({orientation: new Quaternion(orientation)});
        entity.c.size.update({size: new Vector3(size)});
    }

    /**
     * Stops the game hub connection.
     * @returns {Promise<void>}
     */
    async #stopGameHubConnection() {
        if (!this._gameHubConnection) return;

        try {
            await this._gameHubConnection?.stop();
        } catch {
            // Ignore errors.
        }

        this._gameHubConnection = null;
    }

    async update() {
        const playerEntity = this.world.getEntity(PlayerEntityId);
        if (!playerEntity) return;

        for (const entity of this.query.execute()) {
            const multiplayerComponent = entity.c.multiplayer;
            const positionComponent = entity.c.position;
            const orientationComponent = entity.c.orientation;

            if (multiplayerComponent.playerId === playerEntity.c.player.playerId)
                throw new Error("Player entity found with multiplayer component.");

            const playerPosition = positionComponent.position;
            const playerOrientation = orientationComponent.orientation;

            // todo remove after testing
            Debug.setBox(`player_${multiplayerComponent.playerId}`, playerPosition, playerOrientation, new Vector3(0.2), Colour.black, false);
        }

        if (!this._gameHubConnection) return;

        if (this._lastTickTime == null) {
            this._lastTickTime = performance.now();
        }

        this._timeAccumulator += this._frameInfo.deltaTime;
        while (this._timeAccumulator >= this._fixedTimeStep) {
            await this.#sendState(playerEntity);
            this._timeAccumulator -= this._fixedTimeStep;

            const now = performance.now();
            const tickDeltaTime = (now - this._lastTickTime) / 1000;

            this._lastTickTime = now;
            this._frameCounter.tick(tickDeltaTime);
        }

    }

    /**
     * @param {Entity} playerEntity
     * @returns {Promise<void>}
     */
    async #sendState(playerEntity) {
        const playerComponent = playerEntity.c.player;
        const playerPosition = playerEntity.c.position.position;
        const playerOrientation = playerEntity.c.orientation.orientation;
        await this._gameHubConnection?.invoke("PlayerStateUpdate", playerComponent.gameId, playerComponent.playerId, JSON.stringify({
            position: playerPosition.toArray(),
            orientation: playerOrientation.toArray(),
        }), this._frameInfo.deltaTime);

        if (!playerEntity.has(GameHostComponent.name)) return;

        const entityData = [...this.synchroniseQuery.execute()].map(entity => ({
            id: entity.id,
            data: {
                position: entity.c.position.position.toArray(),
                orientation: entity.c.orientation.orientation.toArray(),
                size: entity.c.size.size.toArray(),
            }
        }));

        await this._gameHubConnection?.invoke(
            "WorldStateUpdate", playerComponent.gameId, playerComponent.playerId, JSON.stringify(entityData));
    }
}