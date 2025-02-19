import {Component} from "../../../../lib/ape-ecs.module.js";


export default class CyclicalAnimationComponent extends Component {}
CyclicalAnimationComponent.properties = {
    enabled: false,
    duration: 0,
    time: 0,
    progress: 0,
    callback: null,
};