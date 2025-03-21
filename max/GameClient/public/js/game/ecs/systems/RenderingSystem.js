import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {Renderer} from "../../../graphics/renderer.js";
import {Colour} from "../../../graphics/maths.js";
import {SceneRootEntityId} from "../../constants.js";


export default class RenderingSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init(gl) {
        this._renderer = new Renderer(gl, Colour.white);
    }

    update() {
        const sceneRoot = this.world.getEntity(SceneRootEntityId).c.draw.sceneNode;

        this._renderer.clear();
        sceneRoot.draw(this._renderer);
    }
}