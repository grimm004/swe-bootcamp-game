import {Component} from "../../lib/ape-ecs.module.js";
import {Colour} from "../math.js";

export default class LightComponent extends Component {}
LightComponent.properties = {
    colour: Colour.white,
    attachedTo: null,
};