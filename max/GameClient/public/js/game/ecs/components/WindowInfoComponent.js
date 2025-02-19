import {Component} from "../../../../lib/ape-ecs.module.js";


export default class WindowInfoComponent extends Component {}
WindowInfoComponent.properties = {
    width: 1,
    height: 1,
    aspectRatio: 1,
};
WindowInfoComponent.changeEvents = true;