import {Component} from "../../../../lib/ape-ecs.module.js";
import {Colour} from "../../../graphics/maths.js";


export default class LightComponent extends Component {}
LightComponent.properties = {
    colour: Colour.white,
    attachedTo: null,
};