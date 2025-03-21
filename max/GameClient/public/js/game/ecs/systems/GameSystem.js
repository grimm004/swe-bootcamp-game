import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import GameComponent from "../components/GameComponent.js";
import GameObjectComponent from "../components/GameObjectComponent.js";


export default class GameSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.onGameFinished = null;

        this._gameQuery = this.createQuery()
            .fromAll(GameComponent.name)
            .persist();

        this._gameObjectQuery = this.createQuery()
            .fromAll(GameObjectComponent.name)
            .persist();
    }

    startGame() {
        for (const entity of this._gameQuery.execute()) {
            const gameComponent = entity.getOne(GameComponent.name);
            gameComponent.score = 0;
        }
    }

    update() {
        // const playerEntity = this.world.getEntity(PlayerEntityId);
    }
}