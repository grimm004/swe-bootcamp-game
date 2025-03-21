import {Colour, FrameCounter, Quaternion, Vector2, Vector3} from "../graphics/maths.js";
import {TexCubeMesh, TexPlaneMesh} from "../graphics/meshes.js";
import {fetchMesh, fetchShaderSource, fetchTexture} from "./util.js";
import {
    PlayerEntityId,
    EveryDrawGroup,
    EveryUpdateGroup,
    FrameInfoEntityId,
    KeyboardInputEntityId,
    MouseInputEntityId,
    SceneRootEntityId,
    WindowInfoEntityId
} from "./constants.js";
import {World} from "../../lib/ape-ecs.module.js";
import FrameInfoComponent from "./ecs/components/FrameInfoComponent.js";
import PhysicsSystem from "./ecs/systems/PhysicsSystem.js";
import RenderingSystem from "./ecs/systems/RenderingSystem.js";
import ImpulseComponent from "./ecs/components/ImpulseComponent.js";
import PositionComponent from "./ecs/components/PositionComponent.js";
import OrientationComponent from "./ecs/components/OrientationComponent.js";
import DrawComponent from "./ecs/components/DrawComponent.js";
import PositioningSystem from "./ecs/systems/PositioningSystem.js";
import GraphicsSystem from "./ecs/systems/GraphicsSystem.js";
import LightComponent from "./ecs/components/LightComponent.js";
import EntityFactory from "./ecs/EntityFactory.js";
import CameraSystem from "./ecs/systems/CameraSystem.js";
import CameraComponent from "./ecs/components/CameraComponent.js";
import WindowInfoComponent from "./ecs/components/WindowInfoComponent.js";
import MouseInputComponent from "./ecs/components/MouseInputComponent.js";
import KeyboardInputComponent from "./ecs/components/KeyboardInputComponent.js";
import InputSystem from "./ecs/systems/InputSystem.js";
import {toDegree, toRadian} from "../../lib/gl-matrix/common.js";
import AnchorComponent from "./ecs/components/AnchorComponent.js";
import CyclicalAnimationComponent from "./ecs/components/CyclicalAnimationComponent.js";
import AnimationSystem from "./ecs/systems/AnimationSystem.js";
import {Debug} from "./debug.js";
import {Application} from "../graphics/application.js";
import {VertexBufferLayout} from "../graphics/buffers.js";
import {Shader} from "../graphics/shaders.js";
import {LitSceneNode, SceneNode, UnlitSceneNode} from "../graphics/scenes.js";
import MultiplayerSystem from "./ecs/systems/MultiplayerSystem.js";
import PlayerComponent from "./ecs/components/PlayerComponent.js";
import MultiplayerComponent from "./ecs/components/MultiplayerComponent.js";
import GameHostComponent from "./ecs/components/GameHostComponent.js";
import SizeComponent from "./ecs/components/SizeComponent.js";
import RigidBodyComponent from "./ecs/components/RigidBodyComponent.js";
import NetworkSynchroniseComponent from "./ecs/components/NetworkSyncroniseComponent.js";
import GameSystem from "./ecs/systems/GameSystem.js";
import GameComponent from "./ecs/components/GameComponent.js";
import GameObjectComponent from "./ecs/components/GameObjectComponent.js";
import CollisionComponent from "./ecs/components/CollisionComponent.js";

/**
 * @typedef {{position: [x: number, y: number, z: number], direction: [x: number, y: number, z: number], orientation: [x: number, y: number, z: number, w: number]}} PlayerState
 */

export class SweBootcampGame extends Application {
    #frameCounter;
    #debugEnabled;

    #ecsWorld;
    #entityFactory;

    #windowInfoEntity;
    #frameInfoEntity;

    #inputSystem;
    #physicsSystem;
    #multiplayerSystem;
    #gameSystem;

    /**
     * @param {WebGL2RenderingContext} gl
     * @param {string} gameHubUrl
     */
    constructor(gl, gameHubUrl) {
        super(gl);

        this.#frameCounter = new FrameCounter();
        this.#debugEnabled = false;

        this.#ecsWorld = new World();
        this.#entityFactory = new EntityFactory(this.#ecsWorld);

        this.#ecsWorld.registerComponent(WindowInfoComponent);
        this.#ecsWorld.registerComponent(FrameInfoComponent);
        this.#ecsWorld.registerComponent(MouseInputComponent);
        this.#ecsWorld.registerComponent(KeyboardInputComponent);
        this.#ecsWorld.registerComponent(CameraComponent);
        this.#ecsWorld.registerComponent(SizeComponent);
        this.#ecsWorld.registerComponent(RigidBodyComponent);
        this.#ecsWorld.registerComponent(CollisionComponent);
        this.#ecsWorld.registerComponent(ImpulseComponent);
        this.#ecsWorld.registerComponent(DrawComponent);
        this.#ecsWorld.registerComponent(LightComponent);
        this.#ecsWorld.registerComponent(CyclicalAnimationComponent);
        this.#ecsWorld.registerComponent(PositionComponent);
        this.#ecsWorld.registerComponent(OrientationComponent);
        this.#ecsWorld.registerComponent(AnchorComponent);
        this.#ecsWorld.registerComponent(PlayerComponent);
        this.#ecsWorld.registerComponent(MultiplayerComponent);
        this.#ecsWorld.registerComponent(GameHostComponent);
        this.#ecsWorld.registerComponent(GameComponent);
        this.#ecsWorld.registerComponent(GameObjectComponent);
        this.#ecsWorld.registerComponent(NetworkSynchroniseComponent);

        this.#windowInfoEntity = this.#entityFactory.createWindowEntity(WindowInfoEntityId, gl.canvas.clientWidth, gl.canvas.clientHeight);
        this.#frameInfoEntity = this.#entityFactory.createTimingEntity(FrameInfoEntityId);
        this.#entityFactory.createMouseInputEntity(MouseInputEntityId);
        this.#entityFactory.createKeyboardInputEntity(KeyboardInputEntityId);

        this.#ecsWorld.registerSystem(EveryUpdateGroup, CameraSystem);
        /** @type {InputSystem} */
        this.#inputSystem = this.#ecsWorld.registerSystem(EveryUpdateGroup, InputSystem);
        this.#ecsWorld.registerSystem(EveryUpdateGroup, AnimationSystem);
        /** @type {PhysicsSystem} */
        this.#physicsSystem = this.#ecsWorld.registerSystem(EveryUpdateGroup, PhysicsSystem);
        this.#ecsWorld.registerSystem(EveryUpdateGroup, PositioningSystem);
        /** @type {MultiplayerSystem} */
        this.#multiplayerSystem = this.#ecsWorld.registerSystem(EveryUpdateGroup, MultiplayerSystem, [this.#entityFactory, gameHubUrl]);
        this.#gameSystem = this.#ecsWorld.registerSystem(EveryUpdateGroup, GameSystem);
        this.#ecsWorld.registerSystem(EveryUpdateGroup, GraphicsSystem);
        this.#ecsWorld.registerSystem(EveryDrawGroup, RenderingSystem, [gl]);

        /**
         * @type {(game: SweBootcampGame, deltaTime: number) => void}
         */
        this.onUpdateCompleted = null;

        /**
         * @type {(game: SweBootcampGame, deltaTime: number) => void}
         */
        this.onDrawCompleted = null;

        /**
         * @type {() => void}
         */
        this.onGameFinished = null;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Fetches the local player's current state.
     * @returns {PlayerState}
     */
    get playerState() {
        const playerEntity = this.#ecsWorld.getEntity(PlayerEntityId);
        const cameraComponent = playerEntity.c.camera.camera;
        return {
            position: playerEntity.c.position.position.toArray(),
            cameraRotation: {
                yaw: cameraComponent.yaw,
                pitch: cameraComponent.pitch,
            },
            direction: cameraComponent.direction.toArray(),
            orientation: playerEntity.c.orientation.orientation.toArray()
        };
    }

    /**
     * Fetches the average frame rate over the last 50 frames.
     * @returns {number}
     */
    get averageFrameRate() {
        return this.#frameCounter.averageFrameRate;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Fetches the OIMO physics debug stats.
     * @returns {string}
     */
    get physicsDebugStats() {
        return this.#physicsSystem.physicsDebugStats;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Fetches the multiplayer debug stats.
     * @returns {string}
     */
    get multiplayerDebugStats() {
        return this.#multiplayerSystem.multiplayerDebugStats;
    }

    /**
     * Fetches whether debug mode is enabled.
     * @returns {boolean}
     */
    get debugEnabled() {
        return this.#debugEnabled;
    }

    /**
     * Sets whether debug mode is enabled.
     * @param {boolean} value - The new value.
     */
    set debugEnabled(value) {
        this.#debugEnabled = value;
    }

    /**
     * Asynchronously Load the Game's shaders in parallel.
     * @returns {Promise<void>}
     */
    async #loadShaders() {
        const shaderNames = ["col", "tex", "colLit", "texLit"];
        const shaderFetchPromises = shaderNames.map((name) => fetchShaderSource(name));
        const resolvedShaders = await Promise.all(shaderFetchPromises);

        const shaders = shaderNames.reduce((acc, name, i) => {
            acc[name] = resolvedShaders[i];
            return acc;
        }, {});

        let vertSource, fragSource, shader;

        ({vertex: vertSource, fragment: fragSource} = shaders.col);
        shader = new Shader(this._gl, vertSource, fragSource);
        this.addShader("col", shader);
        shader.addLayout("default", new VertexBufferLayout(this._gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        ({vertex: vertSource, fragment: fragSource} = shaders.tex);
        shader = new Shader(this._gl, vertSource, fragSource);
        this.addShader("tex", shader);
        shader.addLayout("default", new VertexBufferLayout(this._gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));

        ({vertex: vertSource, fragment: fragSource} = shaders.colLit);
        shader = new Shader(this._gl, vertSource, fragSource);
        this.addShader("colLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this._gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        ({vertex: vertSource, fragment: fragSource} = shaders.texLit);
        shader = new Shader(this._gl, vertSource, fragSource);
        this.addShader("texLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this._gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));
    }

    /**
     * Create a lightbulb scene node.
     * @param {Mesh} bulbMesh - The lightbulb mesh.
     * @param {Mesh} bulbHolderMesh - The lightbulb holder mesh.
     * @returns {[UnlitSceneNode, SceneNode]}
     */
    #loadLightBulb(bulbMesh, bulbHolderMesh) {
        const bulb = new UnlitSceneNode(bulbMesh);
        const bulbHolder = new LitSceneNode(bulbHolderMesh, new Vector3(0.0, -0.3, 0.0), Quaternion.identity, new Vector3(2.0), [bulb]);

        return [bulb, new SceneNode(Vector3.zeros, Quaternion.identity, Vector3.ones, [bulbHolder])];
    }

    /**
     * Create chair scene nodes.
     * @param {number} count - The number of chairs to create.
     * @param {Texture} texture - The chair texture.
     * @returns {SceneNode[]}
     */
    #loadChairs(count, texture) {
        const chairSeatMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.40, 0.07, 0.45), new Vector2(1.0));
        const chairRestMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.325, 0.45, 0.025), new Vector2(1.0));
        const frontLegMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.025, 0.45, 0.025), new Vector2(1.0));
        const backLegMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.025, 1.05, 0.025), new Vector2(1.0));

        const chairs = [];
        for (let i = 0; i < count; i++)
            chairs.push(new SceneNode(Vector3.zeros).addChild(
                new LitSceneNode(chairSeatMesh, new Vector3(0.0, -0.09, 0.0), Quaternion.fromTaitBryan(90, 0.0, 0.0))
                    .addChild(new LitSceneNode(chairRestMesh, new Vector3(0.0, 0.325, -0.20)))
                    .addChild(new LitSceneNode(backLegMesh, new Vector3(0.175, 0.09, -0.20)))
                    .addChild(new LitSceneNode(backLegMesh, new Vector3(-0.175, 0.09, -0.20)))
                    .addChild(new LitSceneNode(frontLegMesh, new Vector3(0.175, -0.20, 0.20)))
                    .addChild(new LitSceneNode(frontLegMesh, new Vector3(-0.175, -0.20, 0.20)))
            ));

        return chairs;
    }

    /**
     * Create table scene node.
     * @param {Texture} texture - The table texture.
     * @returns {SceneNode}
     */
    #loadTable(texture) {
        const tableTopMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.90, 0.05, 1.80), new Vector2(1.0));
        const legMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.10, 0.80, 0.10), new Vector2(1.0));
        const posX = 0.375, pozY = -0.425, posZ = 0.825;
        return new SceneNode(new Vector3(0.0, -0.425, 0.0), Quaternion.fromEuler(0.0, 90.0, 0.0)).addChild(
            new LitSceneNode(tableTopMesh, new Vector3(0.0, 0.825, 0.0))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, pozY, -posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, pozY, -posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, pozY, posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, pozY, posZ)))
        );
    }

    /**
     * Asynchronously load the game's resources.
     * @returns {Promise<this>}
     */
    async initialise() {
        await this.#loadShaders();

        const [
            woodTexture,
            woodDirtyTexture,
            carpetTexture,
            paintTexture,
            woodPlanksTexture,
        ] = await Promise.all([
            fetchTexture(this._gl, "wood.png", this._gl.MIRRORED_REPEAT),
            fetchTexture(this._gl, "wood_dirty.jpg", this._gl.MIRRORED_REPEAT),
            fetchTexture(this._gl, "carpet.jpg", this._gl.MIRRORED_REPEAT),
            fetchTexture(this._gl, "paint.jpg", this._gl.MIRRORED_REPEAT),
            fetchTexture(this._gl, "wood_planks.jpg", this._gl.MIRRORED_REPEAT),
        ]);

        const [
            shelfMesh,
            bulbMesh,
            bulbHolderMesh,
            cameraMesh,
        ] = await Promise.all([
            fetchMesh(this._gl, "shelf", woodDirtyTexture),
            fetchMesh(this._gl, "lightbulb_b", null, Colour.white, "col"),
            fetchMesh(this._gl, "lightbulb_h"),
            fetchMesh(this._gl, "camera", null, Colour.white, "colLit"),
        ]);

        const multiplayerNode = new SceneNode(Vector3.zeros, Quaternion.identity, Vector3.ones);

        this.#multiplayerSystem.playerSceneNodeFactory = (playerId) => {
            const playerNode = new SceneNode(Vector3.zeros, Quaternion.identity, Vector3.ones, [
                new LitSceneNode(cameraMesh, new Vector3(0, -0.115, 0), Quaternion.fromYawPitch(180, 90), new Vector3(0.025))
            ]);
            multiplayerNode.addChild(playerNode, playerId);
            return playerNode;
        };

        this.#multiplayerSystem.onPlayerLeft = (playerId) => {
            multiplayerNode.removeChildById(playerId);
        };

        this.#multiplayerSystem.onGameStopped = () => {
            multiplayerNode.clearChildren();
            this.onGameFinished?.();
        };

        this.#gameSystem.onGameFinished = () => {
            multiplayerNode.clearChildren();
            this.onGameFinished?.();
        };

        Debug.init(this._gl);
        Debug.setPoint("origin", Vector3.zeros, Colour.white, true);
        Debug.setPoint("unitX", Vector3.unitX, Colour.red, true);
        Debug.setPoint("unitY", Vector3.unitY, Colour.green, true);
        Debug.setPoint("unitZ", Vector3.unitZ, Colour.blue, true);

        const chairNodes = this.#loadChairs(6, woodTexture);

        const tableNode = new SceneNode(Vector3.zeros, Quaternion.identity, Vector3.ones, [this.#loadTable(woodTexture)]);

        const shelves = [];
        for (let i = 0; i < 4; i++)
            shelves.push(new LitSceneNode(shelfMesh));

        shelves[0].position = new Vector3(2.25, 0, 0);
        shelves[0].orientation = Quaternion.fromTaitBryan(-90.0, 0, 0);

        shelves[1].position = new Vector3(-2.25, 0, 0);
        shelves[1].orientation = Quaternion.fromTaitBryan(90.0, 0, 0);

        shelves[2].position = new Vector3(0, 0, 2.25);
        shelves[2].orientation = Quaternion.fromTaitBryan(0, 0, 0);

        shelves[3].position = new Vector3(0, 0, -2.25);
        shelves[3].orientation = Quaternion.fromTaitBryan(180, 0, 0);

        const floorMesh = new TexPlaneMesh(this._gl, carpetTexture, new Vector2(2.5));
        const ceilingMesh = new TexPlaneMesh(this._gl, woodPlanksTexture, new Vector2(2.5), new Vector3(0.0, -1.0, 0.0));
        const wallMesh = new TexPlaneMesh(this._gl, paintTexture, new Vector2(2.5, 1.15));

        const [lightBulb, roomLight] = this.#loadLightBulb(bulbMesh, bulbHolderMesh);

        const staticSceneGraph = new SceneNode(Vector3.zeros, Quaternion.identity, Vector3.ones, [roomLight])
            .addChild(new LitSceneNode(floorMesh, new Vector3(0.0, 0.0, 0.0), Quaternion.identity, Vector3.ones, [...shelves])
                .addChild(new LitSceneNode(ceilingMesh, new Vector3(0.0, 2.3, 0.0), Quaternion.identity, Vector3.ones))
                .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, 2.5), Quaternion.fromTaitBryan(0.0, -90.0, 0.0)))
                .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, -2.5), Quaternion.fromTaitBryan(0.0, 90.0, 0.0)))
                .addChild(new LitSceneNode(wallMesh, new Vector3(-2.5, 1.15, 0.0), Quaternion.fromTaitBryan(0.0, 90.0, -90.0)))
                .addChild(new LitSceneNode(wallMesh, new Vector3(2.5, 1.15, 0.0), Quaternion.fromTaitBryan(0.0, 90.0, 90.0))));

        // Scene graph root entity
        this.#entityFactory.createDrawEntity(
            SceneRootEntityId,
            new SceneNode()
                .addChild(staticSceneGraph)
                .addChild(multiplayerNode)
                .addChild(tableNode)
                .addChildren(chairNodes));

        this.#entityFactory.createPlayerEntity(
            PlayerEntityId, toRadian(90.0), 0.1, 1000.0, new Vector3(2.0), 20, -45, 30);

        this.#ecsWorld.createEntity({
            id: "light",
            c: {
                light: {
                    type: LightComponent.name,
                    attachedTo: lightBulb,
                },
                position: {
                    type: PositionComponent.name,
                    position: new Vector3(0.0, 2.3, 0.0),
                },
                orientation: {
                    type: OrientationComponent.name,
                    orientation: Quaternion.fromTaitBryan(0.0, toDegree(-0.3), 0.0),
                },
                draw: {
                    type: DrawComponent.name,
                    sceneNode: roomLight,
                },
                animation: {
                    type: CyclicalAnimationComponent.name,
                    enabled: true,
                    duration: 1.5,
                    callback: (entity, animation) => {
                        entity.c.orientation.update({
                            orientation: entity.c.orientation.orientation
                                .fromEuler(toDegree(Math.sin(animation.progress * Math.PI * 2.0) / 2.0), 0.0, 0.0),
                        });
                    }
                }
            }
        });

        const collisionBoxes = [
            {
                id: "floor",
                size: new Vector3(5, 0.1, 5),
                position: new Vector3(0.0, -0.05, 0.0),
                orientation: Quaternion.identity,
            },
            {
                id: "ceiling",
                size: new Vector3(0.1, 2.5, 5),
                position: new Vector3(-2.55, 1.25, 0.0),
                orientation: Quaternion.identity,
            },
            {
                id: "wall1",
                size: new Vector3(0.1, 2.5, 5),
                position: new Vector3(2.55, 1.25, 0.0),
                orientation: Quaternion.identity,
            },
            {
                id: "wall2",
                size: new Vector3(5, 2.5, 0.1),
                position: new Vector3(0.0, 1.25, -2.55),
                orientation: Quaternion.identity,
            },
            {
                id: "wall3",
                size: new Vector3(5, 2.5, 0.1),
                position: new Vector3(0.0, 1.25, 2.55),
                orientation: Quaternion.identity,
            },
            {
                id: "wall4",
                size: new Vector3(5, 0.1, 5),
                position: new Vector3(0.0, 2.35, 0.0),
                orientation: Quaternion.identity,
            },
        ];

        let i = 0;
        for (const {id, size, position, orientation} of collisionBoxes)
            this.#entityFactory.createCollisionBox(id, size, position, orientation);

        this.#entityFactory.createPhysicalObjectEntity(
            "table",
            tableNode,
            new Vector3(1.8, 0.85, 0.9),
            new Vector3(0.0, 2.25, 0.0),
            Quaternion.fromEuler(0.0, 90.0, 0.0),
            1.0,
            0.2,
            0.2,
            4,
        );

        const chairPositions = [
            {position: new Vector3(0.0, 0.01, -1.2), orientation: Quaternion.fromEuler(0.0, -90, 0.0)},
            {position: new Vector3(0.0, 0.01, 1.2), orientation: Quaternion.fromEuler(0.0, 90, 0.0)},
            {position: new Vector3(-0.75, 0.01, 0.40), orientation: Quaternion.fromEuler(0.0, 0, 0.0)},
            {position: new Vector3(-0.75, 0.01, -0.40), orientation: Quaternion.fromEuler(0.0, 0, 0.0)},
            {position: new Vector3(0.75, 0.01, -0.40), orientation: Quaternion.fromEuler(0.0, 180, 0.0)},
            {position: new Vector3(0.75, 0.01, 0.40), orientation: Quaternion.fromEuler(0.0, 180, 0.0)},
        ];

        i = 0;
        for (const {position, orientation} of chairPositions)
            this.#entityFactory.createPhysicalObjectEntity(
                `chair_${i}`,
                chairNodes[i++],
                new Vector3(0.45, 1.05, 0.40),
                position,
                orientation,
            );

        return super.initialise();
    }

    /**
     * Resize the game's window and update the aspect ratio.
     * @param {number} width - The new width in pixels.
     * @param {number} height - The new height in pixels.
     */
    onResize(width, height) {
        this._gl.viewport(0, 0, width, height);

        this.#windowInfoEntity.c.window.update({
            width,
            height,
            aspectRatio: width / height,
        });
    }

    /**
     * Join the specified game.
     * @param {string} playerId - The ID of the player to join.
     * @param {string} gameId - The ID of the game to join.
     * @param {string} accessToken - The access token to use for the connection.
     * @param {boolean} isHost - Whether the player is the host.
     */
    async joinGame(playerId, gameId, accessToken, isHost) {
        await this.#multiplayerSystem.joinGame(playerId, gameId, accessToken, isHost);
    }

    startGame() {
        this.#gameSystem.startGame();
    }

    onMouseMove(dx, dy, x, y) {
        super.onMouseMove(dx, dy, x, y);
        this.#inputSystem.onMouseMove(this._mousePos, this._mouseChange);
    }

    onMouseDown(button) {
        super.onMouseDown(button);
        this.#inputSystem.onMouseButtonUpdated(this._pressedButtons);
    }

    onMouseUp(button) {
        super.onMouseUp(button);
        this.#inputSystem.onMouseButtonUpdated(this._pressedButtons);
    }

    onKeyDown(key) {
        super.onKeyDown(key);
        this.#inputSystem.onKeyboardUpdate(this._pressedKeys);
    }

    onKeyUp(key) {
        super.onKeyUp(key);
        this.#inputSystem.onKeyboardUpdate(this._pressedKeys);
    }

    _update(deltaTime) {
        this.#frameInfoEntity.c.time.update({deltaTime: deltaTime});
        this.#ecsWorld.runSystems(EveryUpdateGroup);

        super._update(deltaTime);
        this.onUpdateCompleted?.(this, deltaTime);
    }

    _draw(deltaTime) {
        super._draw(deltaTime);
        this.#frameCounter.tick(deltaTime);

        this.#ecsWorld.runSystems(EveryDrawGroup);

        if (this.#debugEnabled)
            Debug.draw();

        this.onDrawCompleted?.(this, deltaTime);
    }
}