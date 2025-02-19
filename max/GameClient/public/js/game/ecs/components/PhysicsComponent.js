import {Component} from "../../../../lib/ape-ecs.module.js";

export default class PhysicsComponent extends Component {}
PhysicsComponent.properties = {
    enabled: true,
    shapeType: "box",
    size: [1, 1, 1],
    posShape: [0.0, 0.0, 0.0],
    rotShape: [0.0, 0.0, 0.0],
    move: false,
    density: 1,
    friction: 0.2,
    restitution: 0.2,
    bodyId: -1,
    impulse: null,
};