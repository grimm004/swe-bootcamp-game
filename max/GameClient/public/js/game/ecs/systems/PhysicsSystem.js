import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {FrameInfoEntityId, MouseInputEntityId, PlayerEntityId} from "../../constants.js";
import {oimo} from "../../../../lib/oimo-physics.module.js";
import ImpulseComponent from "../components/ImpulseComponent.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import {FrameCounter, Quaternion, Vector3} from "../../../graphics/maths.js";
import {Debug} from "../../debug.js";
import SizeComponent from "../components/SizeComponent.js";
import RigidBodyComponent from "../components/RigidBodyComponent.js";


export default class PhysicsSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._fixedTimeStep = 0.001;
        this._physicsWorld = new oimo.dynamics.World(2);

        this.subscribe(ImpulseComponent.name);

        this._rigidBodyQuery = this.createQuery()
            .fromAll(PositionComponent.name, OrientationComponent.name, SizeComponent.name, RigidBodyComponent.name)
            .persist();
        this._impulseQuery = this.createQuery()
            .fromAll(RigidBodyComponent.name, ImpulseComponent.name)
            .persist();

        this._rigidBodyConfig = new oimo.dynamics.rigidbody.RigidBodyConfig();
        this._rigidBodyConfig.position = new oimo.common.Vec3(0, 0, 0);
        this._rigidBodyConfig.rotation = new oimo.common.Mat3(0).identity();
        this._rigidBodyConfig.linearVelocity = new oimo.common.Vec3(0, 0, 0);
        this._rigidBodyConfig.angularVelocity = new oimo.common.Vec3(0, 0, 0);

        this._shapeConfig = new oimo.dynamics.rigidbody.ShapeConfig();
        this._shapeConfig.geometry = new oimo.collision.geometry.BoxGeometry(new oimo.common.Vec3(0.5, 0.5, 0.5));

        this._rayCastClosest = new oimo.dynamics.callback.RayCastClosest();

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this._timeAccumulator = 0;
        this._frameCounter = new FrameCounter();
    }

    /**
     * Fetches the OIMO physics debug stats.
     * @returns {string}
     */
    get physicsDebugStats() {
        let debugStats = `
            <b>Physics System</b><br>
            RigidBody Count: ${this._physicsWorld.getNumRigidBodies()}<br>
            Joint Count: ${this._physicsWorld.getNumJoints()}<br>
            Shape Count: ${this._physicsWorld.getNumShapes()}<br>
            Contact Count: ${this._physicsWorld.getContactManager().getNumContacts()}<br>
            Island Count: ${this._physicsWorld.getNumIslands()}<br>
            Velocity Iteration Count: ${this._physicsWorld.getNumVelocityIterations()}<br>
            Position Iteration Count: ${this._physicsWorld.getNumPositionIterations()}<br>
            Broadphase Test Count: ${this._physicsWorld.getBroadPhase().getTestCount()}<br><br>
            Fixed Time Step:&nbsp;&nbsp;${this._fixedTimeStep.toFixed(4)}s<br>
            Time Accumulator:&nbsp;${this._timeAccumulator.toFixed(4)}s<br>
            Simulation FPS:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${String(this._frameCounter.averageFrameRate.toFixed(0)).padStart(4, "0")}<br><br>`;

        for (const entity of this._rigidBodyQuery.execute()) {
            const position = entity.getOne(PositionComponent.name)?.position;
            if (!position) continue;
            debugStats += `${entity.id}: ${position.toArray().map(v => v.toFixed(2)).join(", ")}<br>`;
        }

        return debugStats;
    }

    #getOrCreateOimoBody(entity) {
        const rigidBodyComponent = entity.getOne(RigidBodyComponent.name);
        if (rigidBodyComponent.oimoBody !== null)
            return rigidBodyComponent.oimoBody;

        const {x: sizeX, y: sizeY, z: sizeZ} = entity.getOne(SizeComponent.name).size;
        const size = new oimo.common.Vec3(sizeX, sizeY, sizeZ);

        this._rigidBodyConfig.position.zero();
        if (entity.has(PositionComponent.name)) {
            const {x, y, z} = entity.getOne(PositionComponent.name).position;
            this._rigidBodyConfig.position.init(x, y, z);
        }

        this._rigidBodyConfig.rotation.identity();
        if (entity.has(OrientationComponent.name)) {
            const {x, y, z, w} = entity.getOne(OrientationComponent.name).orientation;
            this._rigidBodyConfig.rotation.fromQuat(new oimo.common.Quat(x, y, z, w));
        }

        this._rigidBodyConfig.type = rigidBodyComponent.move
            ? oimo.dynamics.rigidbody.RigidBodyType.DYNAMIC
            : oimo.dynamics.rigidbody.RigidBodyType.STATIC;

        this._shapeConfig.geometry = new oimo.collision.geometry.BoxGeometry(size.scaleEq(0.5));
        this._shapeConfig.density = rigidBodyComponent.density;
        this._shapeConfig.friction = rigidBodyComponent.friction;
        this._shapeConfig.restitution = rigidBodyComponent.restitution;

        const oimoBody = new oimo.dynamics.rigidbody.RigidBody(this._rigidBodyConfig);
        oimoBody.userData = entity.id;
        oimoBody.addShape(new oimo.dynamics.rigidbody.Shape(this._shapeConfig));
        this._physicsWorld.addRigidBody(oimoBody);

        rigidBodyComponent.update({
            oimoBody,
        });
    }

    update() {
        for (const entity of this._rigidBodyQuery.execute()) {
            const physicsBody = this.#getOrCreateOimoBody(entity);
            if (!physicsBody) continue;

            physicsBody.setPosition(entity.c.position.position);
            physicsBody.setOrientation(entity.c.orientation.orientation);
        }

        for (const entity of this._impulseQuery.execute()) {
            const physicsBody = this.#getOrCreateOimoBody(entity);
            if (!physicsBody) continue;

            for (const impulseComponent of entity.getComponents(ImpulseComponent.name)) {
                physicsBody.applyImpulse(impulseComponent.force.multiplied(this._fixedTimeStep), impulseComponent.position);
                entity.removeComponent(impulseComponent);
            }
        }

        let stepCount = 0;
        this._timeAccumulator += this._frameInfo.deltaTime;
        while (this._timeAccumulator >= this._fixedTimeStep) {
            stepCount++;
            this._physicsWorld.step(this._fixedTimeStep);
            this._timeAccumulator -= this._fixedTimeStep;
        }

        const secondsPerStep = this._frameInfo.deltaTime / stepCount;
        this._frameCounter.tick(secondsPerStep);

        for (const entity of this._rigidBodyQuery.execute()) {
            const physicsBody = this.#getOrCreateOimoBody(entity);
            if (!physicsBody) continue;

            entity.c.position.update({
                position: new Vector3(physicsBody.getPosition()),
            });

            entity.c.orientation.update({
                orientation: new Quaternion(physicsBody.getOrientation()),
            });

            Debug.setBox(`physics_${entity.id}`, entity.c.position.position, entity.c.orientation.orientation, entity.c.size.size);
        }

        this.#inputRayCast();
    }

    /**
     * todo: move to separate system
     */
    #inputRayCast() {
        const camera = this.world.getEntity(PlayerEntityId).c.camera.camera;
        const {x, y, z} = camera.position;
        const {x: dx, y: dy, z: dz} = camera.direction;

        const cameraPos = new oimo.common.Vec3(x, y, z);
        const cameraDir = new oimo.common.Vec3(dx, dy, dz);
        const maxDistance = 10;

        const rayEnd = new oimo.common.Vec3(
            cameraPos.x + cameraDir.x * maxDistance,
            cameraPos.y + cameraDir.y * maxDistance,
            cameraPos.z + cameraDir.z * maxDistance
        );

        this._rayCastClosest.clear();
        this._physicsWorld.rayCast(cameraPos, rayEnd, this._rayCastClosest);

        if (!this._rayCastClosest.hit) return;

        const hitPosition = new Vector3(this._rayCastClosest.position);
        const entityId = this._rayCastClosest.shape.getRigidBody().userData;

        Debug.setPoint(`hit_${entityId}`, hitPosition);

        const mouseInputComponent = this.world.getEntity(MouseInputEntityId).c.mouse;
        if (!entityId || !mouseInputComponent.buttons.has(0)) return;

        this.world.getEntity(entityId).addComponent({
            type: ImpulseComponent.name,
            position: hitPosition,
            force: hitPosition.subtracted(camera.position).normalise().mul(10000 * this._frameInfo.deltaTime),
        });
    }
}