import {Component} from "../../lib/ape-ecs.module.js";

export default class DrawComponent extends Component {}
DrawComponent.properties = {
    visible: true,
    childrenVisible: null,
    sceneNode: null,
};
DrawComponent.changeEvents = true;