import {Component} from "../../lib/ape-ecs.module.js";
import {Vector3} from "../math.js";

export default class OrientationComponent extends Component {}
OrientationComponent.properties = {
    direction: Vector3.zeros,
};