import {Colour, FrameCounter, Vector2, Vector3} from "../graphics/maths.js";
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
import PhysicsComponent from "./ecs/components/PhysicsComponent.js";
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
import {toRadian} from "../../lib/gl-matrix/common.js";
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

/**
 * @typedef {{position: [x: number, y: number, z: number], direction: [x: number, y: number, z: number]}} PlayerState
 */

export class SweBootcampGame extends Application {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {string} gameHubUrl
     */
    constructor(gl, gameHubUrl) {
        super(gl);

        this._frameCounter = new FrameCounter();
        this._debugEnabled = false;

        this._ecsWorld = new World();
        this._entityFactory = new EntityFactory(this._ecsWorld);

        this._ecsWorld.registerComponent(WindowInfoComponent);
        this._ecsWorld.registerComponent(FrameInfoComponent);
        this._ecsWorld.registerComponent(MouseInputComponent);
        this._ecsWorld.registerComponent(KeyboardInputComponent);
        this._ecsWorld.registerComponent(CameraComponent);
        this._ecsWorld.registerComponent(PhysicsComponent);
        this._ecsWorld.registerComponent(DrawComponent);
        this._ecsWorld.registerComponent(LightComponent);
        this._ecsWorld.registerComponent(CyclicalAnimationComponent);
        this._ecsWorld.registerComponent(PositionComponent);
        this._ecsWorld.registerComponent(OrientationComponent);
        this._ecsWorld.registerComponent(AnchorComponent);
        this._ecsWorld.registerComponent(PlayerComponent);
        this._ecsWorld.registerComponent(MultiplayerComponent);
        this._ecsWorld.registerComponent(GameHostComponent);

        this._windowInfoEntity = this._entityFactory.createWindowEntity(WindowInfoEntityId, gl.canvas.clientWidth, gl.canvas.clientHeight);
        this._frameInfoEntity = this._entityFactory.createTimingEntity(FrameInfoEntityId);
        this._entityFactory.createMouseInputEntity(MouseInputEntityId);
        this._entityFactory.createKeyboardInputEntity(KeyboardInputEntityId);

        this._ecsWorld.registerSystem(EveryUpdateGroup, CameraSystem);
        this._entityFactory.createPlayerEntity(
            PlayerEntityId, toRadian(90.0), 0.1, 1000.0, new Vector3(2.0), new Vector3(-45.0, 30.0, 0.0).map(x => Math.radians(x)), 20);

        /** @type {InputSystem} */
        this._inputSystem = this._ecsWorld.registerSystem(EveryUpdateGroup, InputSystem);
        this._ecsWorld.registerSystem(EveryUpdateGroup, AnimationSystem);
        /** @type {PhysicsSystem} */
        this._physicsSystem = this._ecsWorld.registerSystem(EveryUpdateGroup, PhysicsSystem);
        this._ecsWorld.registerSystem(EveryUpdateGroup, PositioningSystem);
        /** @type {MultiplayerSystem} */
        this._multiplayerSystem = this._ecsWorld.registerSystem(EveryUpdateGroup, MultiplayerSystem, [this._entityFactory, gameHubUrl]);
        this._ecsWorld.registerSystem(EveryUpdateGroup, GraphicsSystem);
        this._ecsWorld.registerSystem(EveryDrawGroup, RenderingSystem, [gl]);

        /**
         * @type {(game: SweBootcampGame, deltaTime: number) => void}
         */
        this.onUpdateCompleted = null;

        /**
         * @type {(game: SweBootcampGame, deltaTime: number) => void}
         */
        this.onDrawCompleted = null;
    }

    /**
     * Fetches the local player's current state.
     * @returns {PlayerState}
     */
    get playerState() {
        const playerEntity = this._ecsWorld.getEntity(PlayerEntityId);
        return {
            position: playerEntity.c.position.position.toArray(),
            direction: playerEntity.c.orientation.direction.toArray()
        };
    }

    /**
     * Fetches the average frame rate over the last 50 frames.
     * @returns {number}
     */
    get averageFrameRate() {
        return this._frameCounter.averageFrameRate;
    }

    /**
     * Fetches the OIMO physics debug stats.
     * @returns {string}
     */
    get physicsDebugStats() {
        return this._physicsSystem.physicsDebugStats;
    }

    /**
     * Fetches whether debug mode is enabled.
     * @returns {boolean}
     */
    get debugEnabled() {
        return this._debugEnabled;
    }

    /**
     * Sets whether debug mode is enabled.
     * @param {boolean} value - The new value.
     */
    set debugEnabled(value) {
        this._debugEnabled = value;
    }

    /**
     * Asynchronously Load the Game's shaders in parallel.
     * @returns {Promise<void>}
     * @private
     */
    async _loadShaders() {
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
     * @private
     */
    _loadLightBulb(bulbMesh, bulbHolderMesh) {
        const bulb = new UnlitSceneNode(bulbMesh);
        const bulbHolder = new LitSceneNode(bulbHolderMesh, new Vector3(0.0, -0.3, 0.0), Vector3.zeros, new Vector3(2.0), [bulb]);

        return [bulb, new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [bulbHolder])];
    }

    /**
     * Create chair scene nodes.
     * @param {number} count - The number of chairs to create.
     * @param {Texture} texture - The chair texture.
     * @returns {SceneNode[]}
     * @private
     */
    _loadChairs(count, texture) {
        const chairSeatMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.40, 0.07, 0.45), new Vector2(1.0));
        const chairRestMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.325, 0.45, 0.025), new Vector2(1.0));
        const frontLegMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.025, 0.45, 0.025), new Vector2(1.0));
        const backLegMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.025, 1.05, 0.025), new Vector2(1.0));

        const chairs = [];
        for (let i = 0; i < count; i++)
            chairs.push(new SceneNode(Vector3.zeros).addChild(
                new LitSceneNode(chairSeatMesh, new Vector3(0.0, -0.09, 0.0), new Vector3(Math.radians(90), 0.0, 0.0))
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
     * @private
     */
    _loadTable(texture) {
        const tableTopMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.90, 0.05, 1.80), new Vector2(1.0));
        const legMesh = new TexCubeMesh(this._gl, texture, new Vector3(0.10, 0.80, 0.10), new Vector2(1.0));
        const posX = 0.375, pozY = -0.425, posZ = 0.825;
        return new SceneNode(new Vector3(0.0, -0.425, 0.0), new Vector3(toRadian(90.0), 0.0, 0.0)).addChild(
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
        await this._loadShaders();

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
        ] = await Promise.all([
            fetchMesh(this._gl, "shelf", woodDirtyTexture),
            fetchMesh(this._gl, "lightbulb_b", null, Colour.white, "col"),
            fetchMesh(this._gl, "lightbulb_h"),
        ]);

        Debug.init(this._gl);
        Debug.setPoint("origin", Vector3.zeros, Colour.white, true);
        Debug.setPoint("unitX", Vector3.unitX, Colour.red, true);
        Debug.setPoint("unitY", Vector3.unitY, Colour.green, true);
        Debug.setPoint("unitZ", Vector3.unitZ, Colour.blue, true);

        const chairNodes = this._loadChairs(6, woodTexture);

        const tableNode = new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [this._loadTable(woodTexture)]);

        const shelves = [];
        for (let i = 0; i < 3; i++)
            shelves.push(new LitSceneNode(shelfMesh));

        shelves[0].position = new Vector3(2.25, 0, 0);
        shelves[0].orientation = new Vector3(Math.radians(-90.0), 0, 0);

        shelves[1].position = new Vector3(-2.25, 0, 0);
        shelves[1].orientation = new Vector3(Math.radians(90.0, 0, 0), 0, 0);

        shelves[2].position = new Vector3(0, 0, 2.25);
        shelves[2].orientation = new Vector3(Math.radians(0, 0, 0), 0, 0);

        const floorMesh = new TexPlaneMesh(this._gl, carpetTexture, new Vector2(2.5));
        const ceilingMesh = new TexPlaneMesh(this._gl, woodPlanksTexture, new Vector2(2.5), new Vector3(0.0, -1.0, 0.0));
        const wallMesh = new TexPlaneMesh(this._gl, paintTexture, new Vector2(2.5, 1.15));

        const [lightBulb, roomLight] = this._loadLightBulb(bulbMesh, bulbHolderMesh);

        const staticSceneGraph = new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [roomLight])
            .addChild(new LitSceneNode(floorMesh, new Vector3(0.0, 0.0, 0.0), Vector3.zeros, Vector3.ones, [...shelves])
                .addChild(new LitSceneNode(ceilingMesh, new Vector3(0.0, 2.3, 0.0), new Vector3(), Vector3.ones))
                .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, 2.5), new Vector3(0.0, -90.0, 0.0).map(x => Math.radians(x))))
                .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, -2.5), new Vector3(0.0, 90.0, 0.0).map(x => Math.radians(x))))
                .addChild(new LitSceneNode(wallMesh, new Vector3(-2.5, 1.15, 0.0), new Vector3(0.0, 90.0, -90.0).map(x => Math.radians(x))))
                .addChild(new LitSceneNode(wallMesh, new Vector3(2.5, 1.15, 0.0), new Vector3(0.0, 90.0, 90.0).map(x => Math.radians(x)))));

        // Scene graph root entity
        this._entityFactory.createDrawEntity(
            SceneRootEntityId,
            new SceneNode()
                .addChild(staticSceneGraph)
                .addChild(tableNode)
                .addChildren(chairNodes));

        this._ecsWorld.createEntity({
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
                    direction: new Vector3(0.0, -0.3, 0.0),
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
                            direction: new Vector3(0.0, Math.sin(animation.progress * Math.PI * 2.0) / 2.0, 0.0),
                        });
                    }
                }
            }
        });

        const collisionBoxes = [
            {
                size: new Vector3(5, 0.1, 5),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(0.0, -0.05, 0.0)
            },
            {
                size: new Vector3(0.1, 2.5, 5),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(-2.55, 1.25, 0.0)
            },
            {
                size: new Vector3(0.1, 2.5, 5),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(2.55, 1.25, 0.0)
            },
            {
                size: new Vector3(5, 2.5, 0.1),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(0.0, 1.25, -2.55)
            },
            {
                size: new Vector3(5, 2.5, 0.1),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(0.0, 1.25, 2.55)
            },
            {
                size: new Vector3(5, 0.1, 5),
                position: Vector3.zeros,
                orientation: Vector3.zeros,
                offset: new Vector3(0.0, 2.35, 0.0)
            },
        ];

        let i = 0;
        for (const {size, position, orientation, offset} of collisionBoxes)
            this._entityFactory.createCollisionBox(`collisionBox_${i++}`, size, position, orientation, offset);

        this._entityFactory.createPhysicalObjectEntity(
            "table",
            tableNode,
            new Vector3(1.8, 0.85, 0.9),
            new Vector3(0.0, 1.25, 0.0),
            new Vector3(0.0, -Math.PI / 2, 0.0),
            new Vector3(0, 0.425, 0),
        );

        const chairPositions = [
            {position: new Vector3(0.0, 0.0, -1.2), orientation: new Vector3(0.0, Math.radians(-90), 0.0)},
            {position: new Vector3(0.0, 0.0, 1.2), orientation: new Vector3(Math.PI / 2, Math.radians(90), 0.0)},
            {position: new Vector3(-0.75, 0.0, 0.40), orientation: new Vector3(0.0, Math.radians(0), 0.0)},
            {position: new Vector3(-0.75, 0.0, -0.40), orientation: new Vector3(0.0, Math.radians(0), 0.0)},
            {position: new Vector3(0.75, 0.0, -0.40), orientation: new Vector3(0.0, Math.radians(180), 0.0)},
            {position: new Vector3(0.75, 0.0, 0.40), orientation: new Vector3(0.0, Math.radians(180), 0.0)},
        ];

        i = 0;
        for (const {position, orientation} of chairPositions)
            this._entityFactory.createPhysicalObjectEntity(
                `chair_${i}`,
                chairNodes[i++],
                new Vector3(0.45, 1.05, 0.40),
                position,
                orientation,
                new Vector3(0, 0.525, 0),
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

        this._windowInfoEntity.c.window.update({
            width,
            height,
            aspectRatio: width / height,
        });
    }

    /**
     * Join the specified game.
     * @param {string} playerId - The ID of the player to join.
     * @param {string} gameId - The ID of the game to join.
     */
    async joinGame(playerId, gameId) {
        await this._multiplayerSystem.joinGame(playerId, gameId);
    }

    onMouseMove(dx, dy, x, y) {
        super.onMouseMove(dx, dy, x, y);
        this._inputSystem.onMouseMove(this._mousePos, this._mouseChange);
    }

    onMouseDown(button) {
        super.onMouseDown(button);
        this._inputSystem.onMouseButtonUpdated(this._pressedButtons);
    }

    onMouseUp(button) {
        super.onMouseUp(button);
        this._inputSystem.onMouseButtonUpdated(this._pressedButtons);
    }

    onKeyDown(key) {
        const camera = this._ecsWorld.getEntity(PlayerEntityId).c.camera.camera;
        if (key === "r") {
            camera.targetPosition = new Vector3(2.0);
            camera.targetOrientation = new Vector3(-45.0, 30.0, 0.0).apply(x => Math.radians(x));
        } else if (key === "c")
            console.log(`[${camera.position.join(", ")}], [${camera.orientation.join(", ")}]`);
        else if (key === " ") {
            // todo: move out to input system
            for (let i = 0; i < 6; i++) {
                const chairEntity = this._ecsWorld.getEntity(`chair_${i}`);
                chairEntity.c.physics.update({
                    impulse: {
                        position: chairEntity.c.position.position.subtracted(new Vector3(0, -1, 0)),
                        force: new Vector3(0.0, 100.0, 0.0)
                    }
                });
            }
        } else if (key === "e") {
            for (let i = 0; i < 6; i++) {
                const chairEntity = this._ecsWorld.getEntity(`chair_${i}`);
                chairEntity.c.physics.update({
                    impulse: {
                        position: chairEntity.c.position.position.multiplied(0.75),
                        force: new Vector3(0.0, 100.0, 0.0)
                    }
                });
            }
        } else if (key === "i") {
            for (let i = 0; i < 6; i++) {
                const chairEntity = this._ecsWorld.getEntity(`chair_${i}`);
                chairEntity.c.physics.update({
                    impulse: {
                        position: chairEntity.c.position.position.multiplied(1.25),
                        force: new Vector3(0.0, 100.0, 0.0)
                    }
                });
            }
        }

        super.onKeyDown(key);
        this._inputSystem.onKeyboardUpdate(this._pressedKeys);
    }

    onKeyUp(key) {
        super.onKeyUp(key);
        this._inputSystem.onKeyboardUpdate(this._pressedKeys);
    }

    _update(deltaTime) {
        this._frameInfoEntity.c.time.update({deltaTime: deltaTime});
        this._ecsWorld.runSystems(EveryUpdateGroup);

        super._update(deltaTime);
        this.onUpdateCompleted?.(this, deltaTime);
    }

    _draw(deltaTime) {
        super._draw(deltaTime);
        this._frameCounter.tick(deltaTime);

        this._ecsWorld.runSystems(EveryDrawGroup);

        if (this._debugEnabled)
            Debug.draw(this._debugEnabled);

        this.onDrawCompleted?.(this, deltaTime);
    }
}