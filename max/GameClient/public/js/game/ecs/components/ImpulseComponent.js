import {Component} from "../../../../lib/ape-ecs.module.js";
import {Vector3} from "../../../graphics/maths.js";

export default class ImpulseComponent extends Component {}
ImpulseComponent.properties = {
    position: Vector3.zeros,
    force: Vector3.zeros,
};