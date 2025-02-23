import {Component} from "../../../../lib/ape-ecs.module.js";
import {Vector3} from "../../../graphics/maths.js";

export default class RigidBodyComponent extends Component {}
RigidBodyComponent.properties = {
    enabled: true,
    shapeType: "box",
    posShape: Vector3.zeros,
    rotShape: Vector3.zeros,
    move: false,
    density: 1,
    friction: 0.2,
    restitution: 0.2,
    oimoBodyId: null,
};