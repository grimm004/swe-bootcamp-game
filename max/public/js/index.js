import {Application, Camera, Renderer, SceneNode, Shader, Texture, VertexBufferLayout} from "./graphics.js";
import {Colour, FrameCounter, Matrix4, Vector2, Vector3} from "./math.js";
import {parseObj, TexCubeMesh, TexPlaneMesh} from "./meshes.js";
import {LitSceneNode, UnlitSceneNode} from "./objects.js";
import * as OIMO from "../lib/oimo.module.js";

function fetchText(url) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = () => {
            if (199 < request.status && request.status < 300) resolve(request.responseText);
            else reject(request.status);
        }
        request.onerror = () => reject(0);
        request.send();
    });
}

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject();
        image.src = url;
    });
}

async function fetchTexture(gl, filename, wrap = gl.CLAMP_TO_EDGE) {
    return new Texture(gl, await fetchImage(`assets/images/${filename}`), wrap);
}

async function fetchShaderSource(name) {
    return [await fetchText(`assets/shaders/${name}.vertex.glsl`), await fetchText(`assets/shaders/${name}.fragment.glsl`)];
}

async function fetchMesh(gl, name, texture = "", colour = Colour.white, shader = "") {
    if (typeof texture === "string")
        texture = await fetchTexture(gl, texture === "" ? (name + ".png") : texture);
    return parseObj(gl, await fetchText(`assets/meshes/${name}.obj`), texture, colour, shader);
}

class SweBootcampGame extends Application {
    constructor(gl) {
        super(gl);

        this.frameCounter = new FrameCounter();

        this.renderer = new Renderer(this.gl, Colour.white);

        this.lightBulb = null;
        this.roomLight = null;
        this.lightBulbAnimation = 0.0;
        this.lightColour = Colour.white;
        this.lightSwing = true;

        this.table = null;
        this.chair = null;
        this.chairTarget = -1.9;

        this.sceneGraph = null;

        this.mouseSensitivity = 20;

        this.camera = new Camera(Math.radians(90.0), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 1000,
            new Vector3(2.0), new Vector3(-45.0, 30.0, 0.0).apply(x => Math.radians(x)));

        this.physicsWorld = null;
    }

    async loadShaders() {
        let vertSource, fragSource, shader;

        [vertSource, fragSource] = await fetchShaderSource("col");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("col", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        [vertSource, fragSource] = await fetchShaderSource("tex");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("tex", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));

        [vertSource, fragSource] = await fetchShaderSource("colLit");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("colLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aVertexColour"), 3));

        [vertSource, fragSource] = await fetchShaderSource("texLit");
        shader = new Shader(this.gl, vertSource, fragSource);
        this.addShader("texLit", shader);
        shader.addLayout("default", new VertexBufferLayout(this.gl)
            .addAttribute(shader.getAttrib("aVertexPosition"), 3)
            .addAttribute(shader.getAttrib("aVertexNormal"), 3)
            .addAttribute(shader.getAttrib("aTextureCoords"), 2));
    }

    async loadLightBulb() {
        const bulbMesh = await fetchMesh(this.gl, "lightbulb_b", null, Colour.white, "col");
        const bulb = new UnlitSceneNode(bulbMesh);

        const bulbHolderMesh = await fetchMesh(this.gl, "lightbulb_h");
        const bulbHolder = new LitSceneNode(bulbHolderMesh, new Vector3(0.0, -0.3, 0.0), Vector3.zeros, new Vector3(2.0), [bulb]);

        return [bulb, new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [bulbHolder])];
    }

    async loadChairs(count, texture) {
        const chairSeatMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.40, 0.07, 0.45), new Vector2(1.0));
        const chairRestMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.325, 0.45, 0.025), new Vector2(1.0));
        const frontLegMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.025, 0.45, 0.025), new Vector2(1.0));
        const backLegMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.025, 1.05, 0.025), new Vector2(1.0));
        const chairs = [];
        for (let i = 0; i < count; i++)
            chairs.push(new SceneNode(Vector3.zeros).addChild(
                new LitSceneNode(chairSeatMesh, new Vector3(0.0, 0.435, 0.0))
                    .addChild(new LitSceneNode(chairRestMesh, new Vector3(0.0, 0.325, -0.20)))
                    .addChild(new LitSceneNode(backLegMesh, new Vector3(0.175, 0.09, -0.20)))
                    .addChild(new LitSceneNode(backLegMesh, new Vector3(-0.175, 0.09, -0.20)))
                    .addChild(new LitSceneNode(frontLegMesh, new Vector3(0.175, -0.20, 0.20)))
                    .addChild(new LitSceneNode(frontLegMesh, new Vector3(-0.175, -0.20, 0.20)))
            ));
        return chairs;
    }

    async loadTable(texture) {
        const tableTopMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.90, 0.05, 1.80), new Vector2(1.0));
        const legMesh = new TexCubeMesh(this.gl, texture, new Vector3(0.10, 0.80, 0.10), new Vector2(1.0));
        const posX = 0.375, posY = 0.825;
        return new SceneNode(Vector3.zeros).addChild(
            new LitSceneNode(tableTopMesh, new Vector3(0.0, 0.825, 0.0))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, -0.4, -posY)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, -0.4, -posY)))
                .addChild(new LitSceneNode(legMesh, new Vector3(posX, -0.4, posY)))
                .addChild(new LitSceneNode(legMesh, new Vector3(-posX, -0.4, posY)))
        );
    }

    async initialise() {
        await this.loadShaders();

        [this.lightBulb, this.roomLight] = await this.loadLightBulb();

        const woodTexture = await fetchTexture(this.gl, "wood.png", this.gl.MIRRORED_REPEAT);
        const woodDirtyTexture = await fetchTexture(this.gl, "wood_dirty.jpg", this.gl.MIRRORED_REPEAT);
        const carpetTexture = await fetchTexture(this.gl, "carpet.jpg", this.gl.MIRRORED_REPEAT);
        const paintTexture = await fetchTexture(this.gl, "paint.jpg", this.gl.MIRRORED_REPEAT);
        const woodPlanksTexture = await fetchTexture(this.gl, "wood_planks.jpg", this.gl.MIRRORED_REPEAT);

        const chairs = await this.loadChairs(6, woodTexture);
        this.chair = chairs[0];
        chairs[0].position = new Vector3(0, 0, -0.9);
        chairs[0].orientation = new Vector3(0, 0, 0);

        chairs[1].position = new Vector3(0, 0, 0.9);
        chairs[1].orientation = new Vector3(Math.radians(180), 0.0, 0.0);

        chairs[2].position = new Vector3(-0.45, 0.0, 0.40);
        chairs[2].orientation = new Vector3(Math.radians(90), 0.0, 0.0);

        chairs[3].position = new Vector3(-0.45, 0.0, -0.40);
        chairs[3].orientation = new Vector3(Math.radians(90), 0.0, 0.0);

        chairs[4].position = new Vector3(0.45, 0.0, -0.40);
        chairs[4].orientation = new Vector3(Math.radians(-90), 0.0, 0.0);

        chairs[5].position = new Vector3(0.45, 0.0, 0.40);
        chairs[5].orientation = new Vector3(Math.radians(-90), 0.0, 0.0);

        this.table = await this.loadTable(woodTexture);
        for (const chair of chairs)
            this.table.addChild(chair);

        const shelfMesh = await fetchMesh(this.gl, "shelf", woodDirtyTexture);
        const shelves = [];
        for (let i = 0; i < 3; i++)
            shelves.push(new LitSceneNode(shelfMesh));

        shelves[0].position = new Vector3(0.25, 0, 0);
        shelves[0].orientation = new Vector3(Math.radians(-90.0), 0, 0);

        this.shelf = new SceneNode(new Vector2(2, 0, 0)).addChild(shelves[0]);

        shelves[0] = this.shelf;

        shelves[1].position = new Vector3(-2.25, 0, 0);
        shelves[1].orientation = new Vector3(Math.radians(90.0, 0, 0), 0, 0);

        shelves[2].position = new Vector3(0, 0, 2.25);
        shelves[2].orientation = new Vector3(Math.radians(0, 0, 0), 0, 0);

        const floorMesh = new TexPlaneMesh(this.gl, carpetTexture, new Vector2(2.5));
        const ceilingMesh = new TexPlaneMesh(this.gl, woodPlanksTexture, new Vector2(2.5), new Vector3(0.0, -1.0, 0.0));
        const wallMesh = new TexPlaneMesh(this.gl, paintTexture, new Vector2(2.5, 1.15));

        const staticSceneGraph = new LitSceneNode(floorMesh, Vector3.zeros, Vector3.zeros, Vector3.ones, [...shelves])
            .addChild(new LitSceneNode(ceilingMesh, new Vector3(0.0, 2.3, 0.0), new Vector3(), Vector3.ones, [this.roomLight]))
            .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, 2.5), new Vector3(0.0, -90.0, 0.0).map(x => Math.radians(x))))
            .addChild(new LitSceneNode(wallMesh, new Vector3(0.0, 1.15, -2.5), new Vector3(0.0, 90.0, 0.0).map(x => Math.radians(x))))
            .addChild(new LitSceneNode(wallMesh, new Vector3(-2.5, 1.15, 0.0), new Vector3(0.0, 90.0, -90.0).map(x => Math.radians(x))))
            .addChild(new LitSceneNode(wallMesh, new Vector3(2.5, 1.15, 0.0), new Vector3(0.0, 90.0, 90.0).map(x => Math.radians(x))));

        // Scene graph construction
        this.sceneGraph = new SceneNode(Vector3.zeros, Vector3.zeros, Vector3.ones, [...chairs])
            .addChild(staticSceneGraph)
            .addChild(this.table);

        this.physicsWorld = new OIMO.World({
            timestep: 1/60,
            iterations: 8,
            broadphase: 2,
            worldscale: 1,
            random: true,
            info: false,
            gravity: [0, -9.81, 0],
        });

        this.testFloorEntity = {
            sceneNode: staticSceneGraph,
            physicsBody: this.physicsWorld.add({
                type: "box",
                size: [2.5, 0.05, 2.5],
                pos: [0.0, -0.025, 0.0],
                rot: [0, 0, 0],
                move: false,
                density: 1,
                friction: 0.2,
                restitution: 0.2,
            })
        };

        this.testPhysicsEntity = {
            sceneNode: this.table,
            physicsBody: this.physicsWorld.add({
                type: "box",
                size: [1.8, 0.05, 0.9],
                pos: [0.0, 0.825, 0.0],
                rot: [0, 0, 0],
                move: true,
                density: 1,
                friction: 0.2,
                restitution: 0.2,
            })
        };

        this.entities = [
            this.testFloorEntity,
            this.testPhysicsEntity,
        ];

        return await super.initialise();
    }

    resize() {
        this.camera.aspectRatio = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    }

    keyDown(key) {
        if (key === "r") {
            SweBootcampGame.setSliderVector("PosSlider", 0.0);
            SweBootcampGame.setSliderVector("RotSlider", 0.0, "yaw", "pitch", "roll");
            SweBootcampGame.setSliderValue("scaleSlider", 1.0);
            SweBootcampGame.setSliderValue("tableRotationSlider", 0.0);
            this.camera.targetPosition = new Vector3(2.0);
            this.camera.targetOrientation = new Vector3(-45.0, 30.0, 0.0).apply(x => Math.radians(x));
        } else if (key === "c")
            console.log(`[${this.camera.position.join(", ")}], [${this.camera.orientation.join(", ")}]`);

        super.keyDown(key);
    }

    update(deltaTime) {
        // Turn camera with mouse movement
        this.camera.turn(new Vector3(this.mouseChange.x * deltaTime * this.mouseSensitivity, this.mouseChange.y * deltaTime * this.mouseSensitivity, 0.0).map(x => Math.radians(x)));

        // Move camera with keyboard input
        this.camera.move(new Vector2(
            Number(this.pressedKeys.has("w")) - Number(this.pressedKeys.has("s")),
            Number(this.pressedKeys.has("d")) - Number(this.pressedKeys.has("a"))
        ).mul(2 + (2 * Number(this.pressedKeys.has("Shift")))).mul(deltaTime));

        // Update camera state
        this.camera.update(deltaTime);

        // Set orientation of room light
        this.roomLight.orientation = new Vector3(0.0, Math.sin(this.lightBulbAnimation) / 2.0, 0.0);
        if (this.lightSwing)
            this.lightBulbAnimation += 5 * deltaTime;

        SweBootcampGame.setInnerText("fpsLabel", this.frameCounter.averageFrameRate.toFixed(2));

        // Set table orientation
        this.table.orientation = new Vector3(Math.radians(SweBootcampGame.getSliderValue("tableRotationSlider")), 0.0, 0.0);

        // Move the chair using linear interpolation
        this.chair.position = new Vector3(0.0, 0.0, Math.lerp(this.chair.position.z, this.chairTarget, 1 - Math.exp(-2 * deltaTime)));
        if (this.chair.position.z < -1.89)
            this.chairTarget = -0.9;
        else if (this.chair.position.z > -0.91)
            this.chairTarget = -1.9;

        const worldTransform = Matrix4.positionOrientationScale(
            SweBootcampGame.getSliderVector("PosSlider"),
            SweBootcampGame.getSliderVector("RotSlider", "yaw", "pitch", "roll").apply(x => Math.radians(x)),
            new Vector3(SweBootcampGame.getSliderValue("scaleSlider"))
        );

        const commonUniforms = {
            uViewMatrix: this.camera.matrix,
            uProjectionMatrix: this.camera.projectionMatrix,
        }

        const litUniforms = {
            ...commonUniforms,
            uLightPosition: this.lightBulb.transform.multiplied(this.lightBulb.position),
            uLightColour: this.lightColour.rgb,
            uEyePosition: this.camera.position
        };

        const unlitUniforms = {
            ...commonUniforms,
            uColour: this.lightColour
        };

        this.physicsWorld.step(deltaTime);

        // for (const entity of this.entities) {
        //     entity.sceneNode.position = new Vector3(entity.physicsBody.getPosition());
        //     entity.sceneNode.orientation = Vector3.directionFromQuaternion(entity.physicsBody.getQuaternion());
        // }

        this.sceneGraph.update(deltaTime, {col: unlitUniforms, tex: unlitUniforms, texLit: litUniforms, colLit: litUniforms}, worldTransform);

        super.update(deltaTime);
    }

    draw(deltaTime) {
        this.renderer.clear();
        this.sceneGraph.draw(this.renderer);
        this.frameCounter.tick(deltaTime);
        super.draw(deltaTime);
    }

    static getSliderValue(id, scale = 10.0) {
        return Number(document.getElementById(id).value) / scale;
    }

    static getSliderVector(idSuffix, xPrefix = "x", yPrefix = "y", zPrefix = "z", scale = 10.0) {
        return new Vector3(
            SweBootcampGame.getSliderValue(`${xPrefix}${idSuffix}`, scale),
            SweBootcampGame.getSliderValue(`${yPrefix}${idSuffix}`, scale),
            SweBootcampGame.getSliderValue(`${zPrefix}${idSuffix}`, scale)
        );
    }

    static setSliderValue(id, value, scale = 10.0) {
        document.getElementById(id).value = `${value * scale}`;
    }

    static setSliderVector(idSuffix, value, xPrefix = "x", yPrefix = "y", zPrefix = "z", scale = 10.0) {
        if (typeof value === "number")
            value = new Vector3(value);
        this.setSliderValue(`${xPrefix}${idSuffix}`, value.x, scale);
        this.setSliderValue(`${yPrefix}${idSuffix}`, value.y, scale);
        this.setSliderValue(`${zPrefix}${idSuffix}`, value.z, scale);
    }

    static setInnerText(id, text) {
        document.getElementById(id).innerText = String(text);
    }
}

class Program {
    static async main() {
        const canvas = document.querySelector("#glCanvas");

        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.warn("WebGL could not be initialised.");
            return;
        }

        const app = new SweBootcampGame(gl);

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            app.resize();

            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        resize();

        const enableControlsCheckbox = document.getElementById("enableControlsCheckbox");
        enableControlsCheckbox.addEventListener("change", () =>
            document.getElementById("controls").className = enableControlsCheckbox.checked ? "" : "d-none", false);

        const lightCheckbox = document.getElementById("lightCheckbox");
        lightCheckbox.addEventListener("change", () => app.lightColour = lightCheckbox.checked ? Colour.white : Colour.black, false);

        const lightSwingCheckbox = document.getElementById("lightSwingCheckbox");
        lightSwingCheckbox.addEventListener("change", () => app.lightSwing = lightSwingCheckbox.checked, false);

        window.addEventListener("resize", resize, false);

        const body = document.querySelector("body");
        body.addEventListener("keydown", e => app.keyDown(e.key), false);
        body.addEventListener("keyup", e => app.keyUp(e.key), false);

        canvas.addEventListener("mousemove", e => {
            // noinspection JSUnresolvedVariable
            if (document.pointerLockElement === canvas ||
                document.mozPointerLockElement === canvas)
                app.mouseMove(e.movementX, e.movementY, e.clientX, e.clientY);
        }, false);
        canvas.addEventListener("mousedown", e => app.mouseDown(e.button), false);
        canvas.addEventListener("mouseup", e => app.mouseUp(e.button), false);
        canvas.addEventListener("contextmenu", e => {
            if (e.button === 2) e.preventDefault();
        });

        // noinspection JSUnresolvedVariable
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        document.addEventListener("dblclick", () => canvas.requestPointerLock(), false);

        (await app.initialise())
            .run();
    }
}

window.onload = Program.main;

export {};
