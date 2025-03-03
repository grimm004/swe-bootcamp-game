import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import DrawComponent from "../components/DrawComponent.js";


export default class PositioningSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._drawPositionQuery = this.createQuery()
            .fromAll(DrawComponent.name, PositionComponent.name, OrientationComponent.name)
            .persist();
    }

    update() {
        for (const entity of this._drawPositionQuery.execute()) {
            const drawComponent = entity.getOne(DrawComponent.name);
            drawComponent.sceneNode.position = entity.c.position.position;
            drawComponent.sceneNode.orientation = entity.c.orientation.orientation;
        }
    }
}