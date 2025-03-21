import {Component} from "../../../../lib/ape-ecs.module.js";


export default class CollisionComponent extends Component {}
CollisionComponent.properties = {
    entityId: null,
};
CollisionComponent.changeEvents = true;