import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import CyclicalAnimationComponent from "../components/CyclicalAnimationComponent.js";
import {FrameInfoEntityId} from "../../constants.js";


export default class AnimationSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._cyclicalAnimationQuery = this.createQuery()
            .fromAll(CyclicalAnimationComponent.name)
            .persist();

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
    }

    update() {
        for (const entity of this._cyclicalAnimationQuery.execute())
            this.#processCyclicalAnimation(entity.getOne(CyclicalAnimationComponent.name), entity, this._frameInfo.deltaTime);
    }

    #processCyclicalAnimation(animationComponent, entity, deltaTime) {
        if (!animationComponent.enabled)
            return;

        animationComponent.time += deltaTime;
        if (animationComponent.time >= animationComponent.duration)
            animationComponent.time = 0;

        animationComponent.progress = animationComponent.duration ? animationComponent.time / animationComponent.duration : 0;

        if (!animationComponent.callback)
            return;
        animationComponent.callback(entity, animationComponent, deltaTime);
    }
}