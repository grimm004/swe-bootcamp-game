import {Component} from "../../../../lib/ape-ecs.module.js";


export default class KeyboardInputComponent extends Component {}
KeyboardInputComponent.properties = {
    keys: new Set(),
};