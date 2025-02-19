import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {Renderer} from "../../../graphics/renderer.js";
import {Colour} from "../../../graphics/maths.js";
import {SceneRootEntityId} from "../../constants.js";


export default class RenderingSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init(gl) {
        this.renderer = new Renderer(gl, Colour.white);
    }

    update() {
        for (const change of this.changes)
            this.onChange(change);

        const sceneRoot = this.world.getEntity(SceneRootEntityId).c.draw.sceneNode;

        this.renderer.clear();
        sceneRoot.draw(this.renderer);
    }
}