import {Component} from "../../../../lib/ape-ecs.module.js";
import {Vector3} from "../../../graphics/maths.js";

export default class SizeComponent extends Component {}
SizeComponent.properties = {
    size: Vector3.zeros,
};