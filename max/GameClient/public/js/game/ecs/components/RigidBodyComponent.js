import {Component} from "../../../../lib/ape-ecs.module.js";

export default class RigidBodyComponent extends Component {}
RigidBodyComponent.properties = {
    enabled: true,
    move: false,
    density: 1,
    friction: 0.2,
    restitution: 0.2,
    oimoBody: null,
};