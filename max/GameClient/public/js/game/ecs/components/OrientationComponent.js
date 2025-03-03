import {Component} from "../../../../lib/ape-ecs.module.js";
import {Quaternion} from "../../../graphics/maths.js";


export default class OrientationComponent extends Component {}
OrientationComponent.properties = {
    orientation: Quaternion.identity,
};