import DrawComponent from "./components/DrawComponent.js";
import FrameInfoComponent from "./components/FrameInfoComponent.js";
import PhysicsComponent from "./components/PhysicsComponent.js";
import PositionComponent from "./components/PositionComponent.js";
import OrientationComponent from "./components/OrientationComponent.js";
import WindowInfoComponent from "./components/WindowInfoComponent.js";
import MouseInputComponent from "./components/MouseInputComponent.js";
import KeyboardInputComponent from "./components/KeyboardInputComponent.js";
import CameraComponent from "./components/CameraComponent.js";
import {Vector3} from "../../graphics/maths.js";
import PlayerComponent from "./components/PlayerComponent.js";
import MultiplayerComponent from "./components/MultiplayerComponent.js";


export default class EntityFactory {
    constructor(ecsWorld) {
        this._ecsWorld = ecsWorld;
    }

    createWindowEntity(id, initialWidth, initialHeight) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                window: {
                    type: WindowInfoComponent.name,
                    width: initialWidth,
                    height: initialHeight,
                    aspectRatio: initialWidth / initialHeight,
                }
            }
        });
    }

    createTimingEntity(id) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                time: {
                    type: FrameInfoComponent.name,
                }
            }
        });
    }

    createMouseInputEntity(id) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                mouse: {
                    type: MouseInputComponent.name,
                    buttons: new Set(),
                }
            }
        });
    }

    createKeyboardInputEntity(id) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                keyboard: {
                    type: KeyboardInputComponent.name,
                    keys: new Set(),
                }
            }
        });
    }

    createPlayerEntity(id, fovRad, near, far, initialPosition, initialDirection, mouseSensitivity) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                player: {
                    type: PlayerComponent.name,
                },
                camera: {
                    type: CameraComponent.name,
                    mouseSensitivity,
                    fovRad,
                    near,
                    far,
                },
                position: {
                    type: PositionComponent.name,
                    position: initialPosition,
                },
                orientation: {
                    type: OrientationComponent.name,
                    direction: initialDirection,
                },
            }
        });
    }

    createMultiplayerEntity(id) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                multiplayer: {
                    type: MultiplayerComponent.name,
                    playerId: id,
                },
                position: {
                    type: PositionComponent.name,
                    position: Vector3.zeros,
                },
                orientation: {
                    type: OrientationComponent.name,
                    direction: Vector3.zeros,
                },
                time: {
                    type: FrameInfoComponent.name,
                },
            }
        });
    }

    createDrawEntity(id, sceneNode) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                draw: {
                    type: DrawComponent.name,
                    visible: true,
                    childrenVisible: true,
                    sceneNode,
                }
            }
        });
    }

    /**
     * @param {string} id
     * @param {SceneNode} sceneNode
     * @param {Vector3} size
     * @param {Vector3} initialPosition
     * @param {Vector3} initialDirection
     * @param {Vector3} [posShape=Vector3.zeros]
     * @param {Vector3} [rotShape=Vector3.zeros]
     * @param {string} [shape="box"]
     * @param {number} [density=1]
     * @param {number} [friction=0.2]
     * @param {number} [restitution=0.2]
     * @returns {WorldEntity}
     */
    createPhysicalObjectEntity(id, sceneNode, size, initialPosition, initialDirection, posShape = Vector3.zeros, rotShape = Vector3.zeros, shape = "box", density= 1, friction = 0.2, restitution = 0.2) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                physics: {
                    type: PhysicsComponent.name,
                    shapeType: shape,
                    size,
                    posShape,
                    rotShape,
                    move: true,
                    density,
                    friction,
                    restitution,
                },
                position: {
                    type: PositionComponent.name,
                    position: initialPosition,
                },
                orientation: {
                    type: OrientationComponent.name,
                    direction: initialDirection,
                },
                draw: {
                    type: DrawComponent.name,
                    visible: true,
                    childrenVisible: true,
                    sceneNode,
                }
            }
        });
    }

    /**
     * @param {string} id
     * @param {Vector3} size
     * @param {Vector3} initialPosition
     * @param {Vector3} initialDirection
     * @param {Vector3} posShape
     * @param {string} [shape="box"]
     * @param {number} [density=1]
     * @param {number} [friction=0.2]
     * @param {number} [restitution=0.2]
     * @returns {WorldEntity}
     */
    createCollisionBox(id, size, initialPosition, initialDirection, posShape, shape = "box", density= 1, friction = 0.2, restitution = 0.2) {
        return this._ecsWorld.createEntity({
            id,
            c: {
                physics: {
                    type: PhysicsComponent.name,
                    shapeType: shape,
                    size,
                    posShape,
                    move: false,
                    density,
                    friction,
                    restitution,
                },
                position: {
                    type: PositionComponent.name,
                    position: initialPosition,
                },
                orientation: {
                    type: OrientationComponent.name,
                    direction: initialDirection,
                },
            }
        });
    }
}