import {Colour, FrameCounter, Vector2, Vector3} from "../graphics/maths.js";
import {TexCubeMesh, TexPlaneMesh} from "../graphics/meshes.js";
import {fetchMesh, fetchShaderSource, fetchTexture} from "./util.js";
import {
    CameraEntityId,
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


export class SweBootcampGame extends Application {
    /**
     * @param {WebGL2RenderingContext} gl
     */
    constructor(gl) {
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

        this._windowInfoEntity = this._entityFactory.createWindowEntity(WindowInfoEntityId, gl.canvas.clientWidth, gl.canvas.clientHeight);
        this._frameInfoEntity = this._entityFactory.createTimingEntity(FrameInfoEntityId);
        this._entityFactory.createMouseInputEntity(MouseInputEntityId);
        this._entityFactory.createKeyboardInputEntity(KeyboardInputEntityId);

        this._ecsWorld.registerSystem(EveryUpdateGroup, CameraSystem);
        this._entityFactory.createCameraEntity(
            CameraEntityId, toRadian(90.0), 0.1, 1000.0, new Vector3(2.0), new Vector3(-45.0, 30.0, 0.0).map(x => Math.radians(x)), 20);

        this._inputSystem = this._ecsWorld.registerSystem(EveryUpdateGroup, InputSystem);
        this._ecsWorld.registerSystem(EveryUpdateGroup, AnimationSystem);
        this._physicsSystem = this._ecsWorld.registerSystem(EveryUpdateGroup, PhysicsSystem);
        this._ecsWorld.registerSystem(EveryUpdateGroup, PositioningSystem);
        this._ecsWorld.registerSystem(EveryUpdateGroup, GraphicsSystem);
        this._ecsWorld.registerSystem(EveryDrawGroup, RenderingSystem, [gl]);

        /**
         * @type {(game: SweBootcampGame) => void}
         */
        this.onUpdateCompleted = null;
        /**
         * @type {(game: SweBootcampGame) => void}
         */
        this.onDrawCompleted = null;
    }

    get averageFrameRate() {
        return this._frameCounter.averageFrameRate;
    }

    get physicsDebugStats() {
        return this._physicsSystem.physicsWorld.getInfo();
    }

    get debugEnabled() {
        return this._debugEnabled;
    }

    set debugEnabled(value) {
        this._debugEnabled = value;
    }

    async loadShaders() {
        const shaderNames = ["col", "tex", "colLit", "texLit"];
        const shaderFetchPromises = shaderNames.map((name) => fetchShaderSource(name));
        const resolvedShaders = await Promise.all(shaderFetchPromises);

        const shaders = shaderNames.reduce((acc, name, i) => {
            acc[name] = resolvedShaders[i];
            return acc;
        }, {});

        let vertSource, fragSource, shader;

        ({vertex: vertSource, fragment: fragSource} = shaders.col);
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("col", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        ({vertex: vertSource, fragment: fragSource} = shaders.tex);
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("tex", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));

        ({vertex: vertSource, fragment: fragSource} = shaders.colLit);
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("colLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        ({vertex: vertSource, fragment: fragSource} = shaders.texLit);
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("texLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));
    }

    loadLightBulb(bulbMesh, bulbHolderMesh) {
        const bulb = new UnlitSceneNode(bulbMesh);
        const bulbHolder = new LitSceneNode(bulbHolderMesh, new Vector3(0.0, -0.3, 0.0), Vector3.zeros, new Vector3(2.0), [bulb]);

        return [bulb, new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [bulbHolder])];
    }

    loadChairs(count, texture) {
        const chairSeatMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.40, 0.07, 0.45), new Vector2(1.0));
        const chairRestMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.325, 0.45, 0.025), new Vector2(1.0));
        const frontLegMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.025, 0.45, 0.025), new Vector2(1.0));
        const backLegMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.025, 1.05, 0.025), new Vector2(1.0));

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

    loadTable(texture) {
        const tableTopMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.90, 0.05, 1.80), new Vector2(1.0));
        const legMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.10, 0.80, 0.10), new Vector2(1.0));
        const posX = 0.375, pozY = -0.425, posZ = 0.825;
        return new SceneNode(new Vector3(0.0, -0.425, 0.0), new Vector3(toRadian(90.0), 0.0, 0.0)).addChild(
            new LitSceneNode(tableTopMesh, new Vector3(0.0, 0.825, 0.0))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, pozY, -posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, pozY, -posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, pozY, posZ)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, pozY, posZ)))
        );
    }

    async initialise() {
        await this.loadShaders();

        const [
            woodTexture,
            woodDirtyTexture,
            carpetTexture,
            paintTexture,
            woodPlanksTexture,
        ] = await Promise.all([
            fetchTexture(this.gl, "wood.png", this.gl.MIRRORED_REPEAT),
            fetchTexture(this.gl, "wood_dirty.jpg", this.gl.MIRRORED_REPEAT),
            fetchTexture(this.gl, "carpet.jpg", this.gl.MIRRORED_REPEAT),
            fetchTexture(this.gl, "paint.jpg", this.gl.MIRRORED_REPEAT),
            fetchTexture(this.gl, "wood_planks.jpg", this.gl.MIRRORED_REPEAT),
        ]);

        const [
            shelfMesh,
            bulbMesh,
            bulbHolderMesh,
        ] = await Promise.all([
            fetchMesh(this.gl, "shelf", woodDirtyTexture),
            fetchMesh(this.gl, "lightbulb_b", null, Colour.white, "col"),
            fetchMesh(this.gl, "lightbulb_h"),
        ]);

        Debug.init(this.gl);
        Debug.setPoint("origin", Vector3.zeros, Colour.white, true);
        Debug.setPoint("unitX", Vector3.unitX, Colour.red, true);
        Debug.setPoint("unitY", Vector3.unitY, Colour.green, true);
        Debug.setPoint("unitZ", Vector3.unitZ, Colour.blue, true);

        const chairNodes = this.loadChairs(6, woodTexture);

        const tableNode = new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [this.loadTable(woodTexture)]);

        const shelves = [];
        for (let i = 0; i < 3; i++)
            shelves.push(new LitSceneNode(shelfMesh));

        shelves[0].position = new Vector3(2.25, 0, 0);
        shelves[0].orientation = new Vector3(Math.radians(-90.0), 0, 0);

        shelves[1].position = new Vector3(-2.25, 0, 0);
        shelves[1].orientation = new Vector3(Math.radians(90.0, 0, 0), 0, 0);

        shelves[2].position = new Vector3(0, 0, 2.25);
        shelves[2].orientation = new Vector3(Math.radians(0, 0, 0), 0, 0);

        const floorMesh = new TexPlaneMesh(this.gl, carpetTexture, new Vector2(2.5));
        const ceilingMesh = new TexPlaneMesh(this.gl, woodPlanksTexture, new Vector2(2.5), new Vector3(0.0, -1.0, 0.0));
        const wallMesh = new TexPlaneMesh(this.gl, paintTexture, new Vector2(2.5, 1.15));

        const [lightBulb, roomLight] = this.loadLightBulb(bulbMesh, bulbHolderMesh);

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

        return await super.initialise();
    }

    resize() {
        this._windowInfoEntity.c.window.update({
            width: this.gl.canvas.clientWidth,
            height: this.gl.canvas.clientHeight,
            aspectRatio: this.gl.canvas.clientWidth / this.gl.canvas.clientHeight
        });
    }

    keyDown(key) {
        const camera = this._ecsWorld.getEntity(CameraEntityId).c.camera.camera;
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

        super.keyDown(key);
        this._inputSystem.onKeyboardUpdate(this.pressedKeys);
    }

    keyUp(key) {
        super.keyUp(key);
        this._inputSystem.onKeyboardUpdate(this.pressedKeys);
    }

    mouseMove(dx, dy, x, y) {
        super.mouseMove(dx, dy, x, y);
        this._inputSystem.onMouseMove(this.mousePos, this.mouseChange);
    }

    mouseUp(button) {
        super.mouseUp(button);
        this._inputSystem.onMouseButtonUpdated(this.pressedButtons);
    }

    mouseDown(button) {
        super.mouseDown(button);
        this._inputSystem.onMouseButtonUpdated(this.pressedButtons);
    }

    update(deltaTime) {
        this._frameInfoEntity.c.time.update({deltaTime: deltaTime});
        this._ecsWorld.runSystems(EveryUpdateGroup);

        super.update(deltaTime);
        this.onUpdateCompleted?.(this);
    }

    draw(deltaTime) {
        super.draw(deltaTime);
        this._frameCounter.tick(deltaTime);

        this._ecsWorld.runSystems(EveryDrawGroup);

        if (this._debugEnabled)
            Debug.draw(this._debugEnabled);

        this.onDrawCompleted?.(this);
    }
}