import {Component} from "../../lib/ape-ecs.module.js";

export default class AnchorComponent extends Component {}
AnchorComponent.properties = {
    offset: null,
    attachedTo: null,
};