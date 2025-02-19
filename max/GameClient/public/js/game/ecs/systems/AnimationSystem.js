import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import CyclicalAnimationComponent from "../components/CyclicalAnimationComponent.js";
import {FrameInfoEntityId} from "../../constants.js";


export default class AnimationSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this.cyclicalAnimationQuery = this.createQuery()
            .fromAll(CyclicalAnimationComponent.name)
            .persist();

        this.frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
    }

    update() {
        const deltaTime = this.frameInfo.deltaTime;
        for (const entity of this.cyclicalAnimationQuery.execute()) {
            const animationComponent = entity.getOne(CyclicalAnimationComponent.name);
            if (!animationComponent.enabled)
                continue;
            animationComponent.time += deltaTime;
            if (animationComponent.time >= animationComponent.duration)
                animationComponent.time = 0;
            animationComponent.progress = animationComponent.duration ? animationComponent.time / animationComponent.duration : 0;
            if (!animationComponent.callback)
                continue;
            animationComponent.callback(entity, animationComponent, deltaTime);
        }
    }
}