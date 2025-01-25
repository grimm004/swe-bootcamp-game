import {Component} from "../../lib/ape-ecs.module.js";
import {Vector3} from "../math.js";

export default class PositionComponent extends Component {}
PositionComponent.properties = {
    position: Vector3.zeros,
};