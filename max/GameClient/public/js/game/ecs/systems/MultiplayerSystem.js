import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {FrameInfoEntityId, PlayerEntityId} from "../../constants.js";
import MultiplayerComponent from "../components/MultiplayerComponent.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import {Debug} from "../../debug.js";
import {Colour, FrameCounter, Quaternion, Vector3} from "../../../graphics/maths.js";
import {HubConnectionBuilder} from "../../../../lib/signalr.module.js";
import {showMessage} from "../../../ui/message-popup.js";
import NetworkSynchroniseComponent from "../components/NetworkSyncroniseComponent.js";
import GameHostComponent from "../components/GameHostComponent.js";
import RigidBodyComponent from "../components/RigidBodyComponent.js";
import SizeComponent from "../components/SizeComponent.js";
import {HubLogLevel} from "../../../constants.js";
import ImpulseComponent from "../components/ImpulseComponent.js";


export default class MultiplayerSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {EntityFactory} entityFactory
     * @param {string} gameHubUrl
     */
    init(entityFactory, gameHubUrl) {
        this.playerQuery = this.createQuery()
            .fromAll(MultiplayerComponent.name, PositionComponent.name, OrientationComponent.name)
            .persist();

        this.impulseQuery = this.createQuery()
            .fromAll(ImpulseComponent.name)
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

        this._lastOutboundTickTime = null;
        this._outboundFrameCounter = new FrameCounter();

        this._lastInboundTickTime = null;
        this._inboundFrameCounter = new FrameCounter();

        this._impulseAccumulator = [];

        this.onGameStopped = null;
        this.onPlayerLeft = null;

        this.playerSceneNodeFactory = null;

        this.onGameStart = null;
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
            Outbound Tickrate:&nbsp;&nbsp;&nbsp;${String(Math.max(0.0, this._outboundFrameCounter.averageFrameRate).toFixed(1)).padStart(5, "0")}<br>
            Inbound Tickrate:&nbsp;&nbsp;&nbsp;&nbsp;${String(Math.max(0.0, this._inboundFrameCounter.averageFrameRate).toFixed(1)).padStart(5, "0")}`
            : "<b>Multiplayer System</b><br>Not Connected";
    }

    /**
     * Joins the specified game.
     * @param {string} playerId
     * @param {string} gameId
     * @param {string} accessToken
     * @param {boolean} isHost
     */
    async joinGame(playerId, gameId, accessToken, isHost) {
        this.world.getEntity(PlayerEntityId).c.player.update({playerId, gameId});
        if (isHost)
            this.world.getEntity(PlayerEntityId).addComponent({
                type: GameHostComponent.name,
            });
        await this.#startGameHubConnection(gameId, accessToken);
    }

    /**
     * Starts the game hub connection for the specified lobby.
     * @param {string} gameId - The ID of the game to join.
     * @param {string} accessToken - The access token to use for the connection.
     * @returns {Promise<boolean>}
     */
    async #startGameHubConnection(gameId, accessToken) {
        if (this._gameHubConnection)
            await this.#stopGameHubConnection();

        /**
         * @type {HubConnection|null}
         */
        const gameHubConnection = new HubConnectionBuilder()
            .withUrl(this._gameHubUrl, { accessTokenFactory: () => accessToken })
            .withAutomaticReconnect()
            .configureLogging(HubLogLevel)
            .build();

        try {
            await gameHubConnection?.start();
        } catch {
            showMessage("Failed to connect to game hub.", "error");
            return false;
        }

        gameHubConnection?.on("GameStateUpdate", this.#onGameStateUpdate.bind(this));
        gameHubConnection?.on("GamePlayerImpulseAction", this.#onGamePlayerImpulseAction.bind(this));
        gameHubConnection?.on("PlayerLeft", this.#onPlayerLeft.bind(this));
        gameHubConnection?.on("GameStart", this.#onGameStart.bind(this));
        gameHubConnection?.on("GameStopped", this.#onGameStopped.bind(this));

        this._gameHubConnection = gameHubConnection;
        return true;
    }

    #onPlayerLeft(playerId) {
        const entity = this.world.getEntity(playerId);
        if (entity)
            entity.destroy();
        this.onPlayerLeft?.(playerId);
    }

    async #onGameStart() {
        this.onGameStart?.();
    }

    async #onGameStopped() {
        await this.#stopGameHubConnection();
        this.cleanEntities();
        this.onGameStopped?.();
    }

    cleanEntities() {
        for (const component of this.world.getEntity(PlayerEntityId).getComponents(GameHostComponent.name))
            component.destroy();

        for (const entity of this.playerQuery.execute())
            entity.destroy();
    }

    /**
     * @param {Object[]} playerStates
     * @param {Object[]} objectStates
     */
    #onGameStateUpdate({playerStates, objectStates}) {
        const now = performance.now();
        const tickDeltaTime = (now - (this._lastInboundTickTime ?? performance.now())) / 1000;
        this._lastInboundTickTime = now;
        this._inboundFrameCounter.tick(tickDeltaTime);

        for (const {playerId, position, orientation} of playerStates)
            this.#setMultiplayerState(playerId, new Vector3(position), new Quaternion(orientation));

        if (this.world.getEntity(PlayerEntityId).has(GameHostComponent.name)) return;

        for (const {objectId, position, orientation, size} of objectStates)
            this.#setRigidBodyState(objectId, new Vector3(position), new Quaternion(orientation), new Vector3(size));
    }

    /**
     * @param {string} playerId
     * @param {Vector3} position
     * @param {Quaternion} orientation
     */
    #setMultiplayerState(playerId, position, orientation) {
        if (this.world.getEntity(PlayerEntityId).c.player.playerId === playerId) return;

        let player = this.world.getEntity(playerId) ?? this._entityFactory.createMultiplayerEntity(playerId, this.playerSceneNodeFactory);

        // todo: add interpolation
        player.c.position.update({position});
        player.c.orientation.update({orientation});
    }

    /**
     * @param {string} entityId
     * @param {Vector3} position
     * @param {Quaternion} orientation
     * @param {Vector3} size
     */
    #setRigidBodyState(entityId, position, orientation, size) {
        let entity = this.world.getEntity(entityId);
        if (!entity)
            throw new Error(`Entity not found: ${entityId}`);

        entity.c.position.update({position});
        entity.c.orientation.update({orientation});
        entity.c.size.update({size});
    }

    /**
     * @param {Object[]} actions
     */
    #onGamePlayerImpulseAction(actions) {
        if (!this.world.getEntity(PlayerEntityId).has(GameHostComponent.name)) return;

        for (const {playerId, objectId, position, force} of actions)
            this.#addImpulse(playerId, objectId, new Vector3(position), new Vector3(force));
    }

    /**
     * @param {string} playerId
     * @param {string} objectId
     * @param {Vector3} position
     * @param {Vector3} force
     */
    #addImpulse(playerId, objectId, position, force) {
        const playerEntity = this.world.getEntity(playerId);
        if (!playerEntity) return;

        const entity = this.world.getEntity(objectId);
        if (!entity) return;

        entity.addComponent({
            type: ImpulseComponent.name,
            position,
            force,
        });
    }

    /**
     * Stops the game hub connection.
     * @returns {Promise<void>}
     */
    async #stopGameHubConnection() {
        if (!this._gameHubConnection) return;

        try {
            await this._gameHubConnection?.stop();
        } catch (e) {
            console.log(e);
        }

        this._gameHubConnection = null;
    }

    async update() {
        const playerEntity = this.world.getEntity(PlayerEntityId);
        if (!playerEntity) return;

        for (const entity of this.playerQuery.execute()) {
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

        const impulsedEntities = [...this.impulseQuery.refresh().execute()];
        const impulseData = impulsedEntities.map(impulsedEntity =>
            [...impulsedEntity.getComponents(ImpulseComponent.name)]
                .map(component => ({
                    playerId: playerEntity.c.player.playerId,
                    objectId: impulsedEntity.id,
                    position: component.position.toSerializable(),
                    force: component.force.toSerializable(),
                }))).flat();
        this._impulseAccumulator.push(...impulseData);

        if (this._lastOutboundTickTime == null) {
            this._lastOutboundTickTime = performance.now();
        }

        this._timeAccumulator += this._frameInfo.deltaTime;
        while (this._timeAccumulator >= this._fixedTimeStep) {
            await this.#sendState(playerEntity);
            this._timeAccumulator -= this._fixedTimeStep;

            const now = performance.now();
            const tickDeltaTime = (now - this._lastOutboundTickTime) / 1000;

            this._lastOutboundTickTime = now;
            this._outboundFrameCounter.tick(tickDeltaTime);
        }

    }

    /**
     * @param {Entity} playerEntity
     * @returns {Promise<void>}
     */
    async #sendState(playerEntity) {
        const playerId = playerEntity.c.player.playerId;
        const playerPosition = playerEntity.c.position.position;
        const playerOrientation = playerEntity.c.orientation.orientation;
        try {
            // noinspection JSCheckFunctionSignatures
            await this._gameHubConnection?.invoke("PlayerStateUpdate", {
                playerId,
                position: playerPosition.toSerializable(),
                orientation: playerOrientation.toSerializable(),
            });
        } catch {
            return;
        }

        if (!playerEntity.has(GameHostComponent.name)) {
            if (this._impulseAccumulator.length > 0) {
                try {
                    await this._gameHubConnection?.invoke("GamePlayerImpulseAction", this._impulseAccumulator);
                    this._impulseAccumulator = [];
                } catch {
                    return;
                }
            }

            return;
        }

        const entityData = [...this.synchroniseQuery.execute()].map(entity => ({
            objectId: entity.id,
            position: entity.c.position.position.toSerializable(),
            orientation: entity.c.orientation.orientation.toSerializable(),
            size: entity.c.size.size.toSerializable(),
        }));

        try {
            await this._gameHubConnection?.invoke("WorldStateUpdate", entityData);
        } catch {
            console.log("Failed to send world state update.");
        }
    }
}