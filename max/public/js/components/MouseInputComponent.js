import {Component} from "../../lib/ape-ecs.module.js";

export default class MouseInputComponent extends Component {}
MouseInputComponent.properties = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    buttons: new Set(),
};