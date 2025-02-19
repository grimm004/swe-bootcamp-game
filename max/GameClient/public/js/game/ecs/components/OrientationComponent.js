import {Component} from "../../../../lib/ape-ecs.module.js";
import {Vector3} from "../../../graphics/maths.js";


export default class OrientationComponent extends Component {}
OrientationComponent.properties = {
    direction: Vector3.zeros,
};