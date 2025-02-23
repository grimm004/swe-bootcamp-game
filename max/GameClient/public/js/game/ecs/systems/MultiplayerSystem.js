import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {FrameInfoEntityId, PlayerEntityId} from "../../constants.js";
import MultiplayerComponent from "../components/MultiplayerComponent.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import {Debug} from "../../debug.js";
import {Colour, Vector3} from "../../../graphics/maths.js";
import {HubConnectionBuilder, LogLevel} from "../../../../lib/signalr.module.js";
import {showMessage} from "../../../ui/message-popup.js";


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

        this._entityFactory = entityFactory;
        this._gameHubUrl = gameHubUrl;

        /**
         * @type {HubConnection|null}
         * @private
         */
        this._gameHubConnection = null;

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
    }

    /**
     * Joins the specified game.
     * @param {string} playerId
     * @param {string} gameId
     */
    async joinGame(playerId, gameId) {
        this.world.getEntity(PlayerEntityId).c.player.update({playerId, gameId});
        await this.#startGameHubConnection(gameId);
    }

    /**
     * Starts the game hub connection for the specified lobby.
     * @param {string} gameId - The ID of the game to join.
     * @returns {Promise<boolean>}
     * @private
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

        this._gameHubConnection = gameHubConnection;
        return true;
    }

    /**
     * @param {string} playerId
     * @param {string} state
     * @param {number} deltaTime
     * @private
     */
    #onPlayerStateUpdate(playerId, state, deltaTime) {
        if (this.world.getEntity(PlayerEntityId).c.player.playerId === playerId) return;

        const {
            position,
            direction,
        } = JSON.parse(state);

        this.#setMultiplayerState(playerId, new Vector3(position), new Vector3(direction), deltaTime);
    }

    /**
     * @param {string} playerId
     * @param {Vector3} position
     * @param {Vector3} direction
     * @param {number} deltaTime
     * @private
     */
    #setMultiplayerState(playerId, position, direction, deltaTime) {
        let player = this.world.getEntity(playerId);
        if (!player)
            player = this._entityFactory.createMultiplayerEntity(playerId);

        // todo: add actions
        // todo: add interpolation
        // todo: potentially convert to action components and process them in the update loop (replay actions or take latest state, etc.)
        player.c.position.update({position});
        player.c.orientation.update({direction});
        player.c.time.update({deltaTime});
    }

    /**
     * Stops the game hub connection.
     * @returns {Promise<void>}
     * @private
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
        const playerComponent = playerEntity.c.player;

        for (const entity of this.query.execute()) {
            const multiplayerComponent = entity.c.multiplayer;
            const positionComponent = entity.c.position;
            const orientationComponent = entity.c.orientation;

            if (multiplayerComponent.playerId === playerComponent.playerId)
                throw new Error("Player entity found with multiplayer component.");

            const playerPosition = positionComponent.position;
            const playerDirection = orientationComponent.direction;

            // todo remove after testing
            Debug.setBox(`player_${multiplayerComponent.playerId}`, playerPosition, playerDirection.multiplied(-1), new Vector3(0.2), Colour.black, false);
        }

        // Broadcast local player state
        if (this._gameHubConnection) {
            const playerPosition = playerEntity.c.position.position;
            const playerDirection = playerEntity.c.orientation.direction;

            // noinspection JSCheckFunctionSignatures
            await this._gameHubConnection?.invoke("PlayerStateUpdate", playerComponent.gameId, playerComponent.playerId, JSON.stringify({
                position: playerPosition.toArray(),
                direction: playerDirection.toArray(),
            }), this._frameInfo.deltaTime);
        }
    }
}