import {Component} from "../../../../lib/ape-ecs.module.js";
import {toRadian} from "../../../../lib/gl-matrix/common.js";


export default class CameraComponent extends Component {}
CameraComponent.properties = {
    mouseSensitivity: 20,
    fovRad: toRadian(90),
    near: 0.1,
    far: 1000,
    camera: null,
};