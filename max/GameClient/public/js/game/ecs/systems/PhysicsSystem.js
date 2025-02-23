import * as ApeEcs from "../../../../lib/ape-ecs.module.js";
import {PlayerEntityId, FrameInfoEntityId, GRAVITY, MouseInputEntityId} from "../../constants.js";
import * as OIMO from "../../../../lib/oimo.module.js";
import ImpulseComponent from "../components/ImpulseComponent.js";
import PositionComponent from "../components/PositionComponent.js";
import OrientationComponent from "../components/OrientationComponent.js";
import {toDegree} from "../../../../lib/gl-matrix/common.js";
import {Vector3} from "../../../graphics/maths.js";
import {mat4, quat, vec3} from "../../../../lib/gl-matrix/index.js";
import {Debug} from "../../debug.js";
import SizeComponent from "../components/SizeComponent.js";
import RigidBodyComponent from "../components/RigidBodyComponent.js";


export default class PhysicsSystem extends ApeEcs.System {
    // noinspection JSUnusedGlobalSymbols
    init() {
        this._physicsWorld = new OIMO.World({
            timestep: 0.001,
            iterations: 8,
            broadphase: 2,
            worldscale: 1,
            random: true,
            info: true,
            gravity: [0, GRAVITY, 0],
        });

        this.subscribe(ImpulseComponent.name);

        this._rigidBodyQuery = this.createQuery()
            .fromAll(PositionComponent.name, OrientationComponent.name, SizeComponent.name, RigidBodyComponent.name)
            .persist();
        this._impulseQuery = this.createQuery()
            .fromAll(RigidBodyComponent.name, ImpulseComponent.name)
            .persist();

        this._frameInfo = this.world.getEntity(FrameInfoEntityId).c.time;
        this._timeAccumulator = 0;
    }

    /**
     * Fetches the OIMO physics debug stats.
     * @returns {string}
     */
    get physicsDebugStats() {
        return this._physicsWorld.getInfo();
    }

    #getOrCreateOimoBody(entity) {
        const rigidBodyComponent = entity.getOne(RigidBodyComponent.name);
        if (rigidBodyComponent.oimoBodyId !== null)
            return rigidBodyComponent.oimoBodyId;

        const size = entity.getOne(SizeComponent.name).size.toArray();

        const pos = [0, 0, 0];
        if (entity.has(PositionComponent.name)) {
            const positionComponent = entity.getOne(PositionComponent.name);
            pos[0] = positionComponent.position.x;
            pos[1] = positionComponent.position.y;
            pos[2] = positionComponent.position.z;
        }

        const rot = [0, 0, 0];
        if (entity.has(OrientationComponent.name)) {
            const orientationComponent = entity.getOne(OrientationComponent.name);
            rot[0] = toDegree(orientationComponent.direction.x);
            rot[1] = toDegree(orientationComponent.direction.y);
            rot[2] = toDegree(orientationComponent.direction.z);
        }

        const physicsBody = this._physicsWorld.add({
            type: rigidBodyComponent.shapeType,
            size,
            pos,
            rot,
            posShape: rigidBodyComponent.posShape?.toArray(),
            rotShape: rigidBodyComponent.rotShape?.map(toDegree)?.toArray(),
            move: rigidBodyComponent.move,
            density: rigidBodyComponent.density,
            friction: rigidBodyComponent.friction,
            restitution: rigidBodyComponent.restitution,
        });
        physicsBody.entityId = entity.id;

        rigidBodyComponent.update({
            oimoBodyId: physicsBody.id
        });

        return physicsBody.id;
    }

    update() {
        for (const entity of this._impulseQuery.execute()) {
            const physicsBody = this._physicsWorld.getByName(this.#getOrCreateOimoBody(entity));
            if (!physicsBody) continue;

            for (const impulseComponent of entity.getComponents(ImpulseComponent.name)) {
                physicsBody.applyImpulse(impulseComponent.position, impulseComponent.force.multiplied(this._physicsWorld.timeStep));
                entity.removeComponent(impulseComponent);
            }
        }

        this._timeAccumulator += this._frameInfo.deltaTime;
        while (this._timeAccumulator >= this._physicsWorld.timeStep) {
            this._physicsWorld.step();
            this._timeAccumulator -= this._physicsWorld.timeStep;
        }

        for (const entity of this._rigidBodyQuery.execute()) {
            const physicsBody = this._physicsWorld.getByName(this.#getOrCreateOimoBody(entity));
            if (!physicsBody) continue;

            entity.c.position.update({
                position: new Vector3(physicsBody.getPosition()),
            });

            entity.c.orientation.update({
                direction: Vector3.orientationFromQuaternion(physicsBody.getQuaternion()),
            });

            Debug.setBox(`physics_${entity.id}`, entity.c.position.position, entity.c.orientation.direction, entity.c.size.size);
        }

        this.#computeInputHits();
    }

    // todo: To be extracted to the respective system(s)
    #computeInputHits() {
        const camera = this.world.getEntity(PlayerEntityId).c.camera.camera;
        const cameraPosition = camera.position;
        const cameraDirection = camera.direction;

        const start = new Vector3(cameraPosition);
        const end = start.plus(cameraDirection.mul(10));

        const mouseInputComponent = this.world.getEntity(MouseInputEntityId).c.mouse;
        const rayCastResult = this.#rayCastAll(start, end);
        if (!rayCastResult.length) return;

        const firstHit = rayCastResult[0];
        Debug.setPoint(`hit_${firstHit.body.name}`, firstHit.point);

        if (!firstHit.body.entityId || !mouseInputComponent.buttons.has(0)) return;

        this.world.getEntity(firstHit.body.entityId).addComponent({
            type: ImpulseComponent.name,
            position: new Vector3(firstHit.point),
            force: new Vector3(firstHit.point).sub(start).normalise().mul(1000 * this._frameInfo.deltaTime),
        });
    }

    // todo: To be extracted when physics component is split into physics and collision/sized components
    // todo: fix types
    #rayCastAll(from, to) {
        const hits = [];

        // Convert from/to raw arrays for convenience
        const fromArr = [from.x, from.y, from.z];
        const toArr   = [to.x,   to.y,   to.z];

        // For convenience, define ray direction and length
        const dirArr = vec3.create();
        vec3.sub(dirArr, toArr, fromArr); // dir = (to - from)
        const rayLength = vec3.len(dirArr);
        if (rayLength < 1e-8) {
            // Degenerate ray, return empty
            return hits;
        }
        vec3.scale(dirArr, dirArr, 1.0 / rayLength); // normalize direction

        // Loop over all bodies in the physics world
        for (let body = this._physicsWorld.rigidBodies; body != null; body = body.next) {
            // Each body can have multiple shapes
            for (let shape = body.shapes; shape != null; shape = shape.next) {
                // For example, handle only "box" shapes
                if (shape.type === 2 /* BOX */) {
                    const maybeHit = this.#intersectRayOimoBox(
                        fromArr,
                        dirArr,
                        rayLength,
                        body,
                        shape
                    );
                    if (maybeHit) {
                        hits.push(maybeHit);
                    }
                }
                // else if (shape.type === 1 /* SPHERE */) { ... sphere intersection ... }
            }
        }

        hits.sort((a, b) => a.distance - b.distance);
        return hits;
    }

    /**
     * Internal helper: intersects a world-space ray with an Oimo box shape.
     * Generated by ChatGPT
     * todo: fix types
     *
     * @param {number[]} fromArr - [x, y, z] - ray start
     * @param {number[]} dirArr  - [dx, dy, dz] - normalized ray direction
     * @param {number}   rayLength
     * @param {OIMO.RigidBody} body
     * @param {OIMO.Box}  shape - A box shape
     * @return {object|null}         - null if no hit; or { body, fraction, distance, point }
     */
    #intersectRayOimoBox(fromArr, dirArr, rayLength, body, shape) {
        // 1) Build a single matrix that converts from world-space → local-box-space.
        //    We do the inverse( bodyTransform * shapeLocalOffset ).
        //    In Oimo, body orientation is often in body.orientation or body.getQuaternion(),
        //    shape.position is a Vec3, shape.rotation is a Mat33.

        // Grab body position/orientation
        const bodyPos = body.getPosition();    // OIMO.Vec3
        const bodyRotQ = body.getQuaternion(); // OIMO.Quat (x, y, z, w)

        // Build mat4 from body transform
        const mBody = mat4.create();
        {
            mat4.identity(mBody);

            // Translate by body position
            mat4.translate(mBody, mBody, [bodyPos.x, bodyPos.y, bodyPos.z]);

            // Rotate by body quaternion
            const q = quat.fromValues(bodyRotQ.x, bodyRotQ.y, bodyRotQ.z, bodyRotQ.w);
            const rotMat = mat4.create();
            mat4.fromQuat(rotMat, q);
            mat4.multiply(mBody, mBody, rotMat);
        }

        // Build mat4 from shape’s local offset (position, rotation) - #todo need to look into this
        // const mShape = mat4.create();
        // {
        //     mat4.identity(mShape);
        //
        //     // shape.position is OIMO.Vec3
        //     mat4.translate(mShape, mShape, [shape.position.x, shape.position.y, shape.position.z]);
        //
        //     // shape.rotation is OIMO.Mat33 (3x3). We convert it to a 4x4:
        //     const r = shape.rotation.elements;
        //     const shapeRot4 = mat4.fromValues(
        //         r[0], r[1], r[2], 0,
        //         r[3], r[4], r[5], 0,
        //         r[6], r[7], r[8], 0,
        //         0, 0, 0, 1
        //     );
        //     mat4.multiply(mShape, mShape, shapeRot4);
        // }

        const worldTransform = mat4.create();
        mat4.identity(worldTransform);

        // Combine them: worldTransform = mBody * mShape - need to revisit this
        mat4.multiply(worldTransform, mBody, worldTransform);

        // Our worldToLocal is the inverse of that:
        const worldToLocal = mat4.create();
        mat4.invert(worldToLocal, worldTransform);

        // 2) Transform ray origin & direction into local space
        const localOrigin = vec3.fromValues(...fromArr);
        vec3.transformMat4(localOrigin, localOrigin, worldToLocal);

        // For direction, do the "point trick": transform (origin+dir) then subtract
        const tmpPoint = vec3.fromValues(
            fromArr[0] + dirArr[0],
            fromArr[1] + dirArr[1],
            fromArr[2] + dirArr[2]
        );
        vec3.transformMat4(tmpPoint, tmpPoint, worldToLocal);
        const localDir = vec3.create();
        vec3.sub(localDir, tmpPoint, localOrigin);
        vec3.normalize(localDir, localDir);

        // 3) Intersect with local AABB. The Oimo box shape is half-extents:
        const halfX = shape.halfWidth;
        const halfY = shape.halfHeight;
        const halfZ = shape.halfDepth;
        const tResult = this.#intersectRayAABB(localOrigin, localDir, halfX, halfY, halfZ);
        if (tResult === null || tResult < 0 || tResult > rayLength) {
            return null; // no valid intersection
        }

        // 4) The intersection distance 't' is the same param in local space vs. world space
        const distance = tResult;
        const fraction = distance / rayLength;

        // Intersection point in local coords
        const localHit = vec3.create();
        vec3.scaleAndAdd(localHit, localOrigin, localDir, tResult);

        // Convert that point back to world space:
        const worldHit = vec3.create();
        vec3.transformMat4(worldHit, localHit, worldTransform);

        return {
            body,
            fraction,
            distance,
            point: [worldHit[0], worldHit[1], worldHit[2]]
        };
    }

    /**
     * Intersect a *ray* with an axis-aligned box from [-hx,hx],[-hy,hy],[-hz,hz].
     * `localOrigin`, `localDir` must be in the box’s local space.
     * Returns param 't' (>= 0) if it hits, else null.
     */
    #intersectRayAABB(localOrigin, localDir, hx, hy, hz) {
        let tMin = 0.000001;
        let tMax = 1e9;

        const minB = [-hx, -hy, -hz];
        const maxB = [ hx,  hy,  hz];

        const oX = localOrigin[0], oY = localOrigin[1], oZ = localOrigin[2];
        const dX = localDir[0],    dY = localDir[1],    dZ = localDir[2];

        for (let i = 0; i < 3; i++) {
            const originI = (i===0 ? oX : i===1 ? oY : oZ);
            const dirI    = (i===0 ? dX : i===1 ? dY : dZ);
            const minI    = minB[i];
            const maxI    = maxB[i];

            if (Math.abs(dirI) < 1e-12) {
                // Ray is parallel to these planes
                if (originI < minI || originI > maxI) return null;
            } else {
                const t1 = (minI - originI) / dirI;
                const t2 = (maxI - originI) / dirI;
                const tNear = Math.min(t1, t2);
                const tFar  = Math.max(t1, t2);

                if (tNear > tMin) tMin = tNear;
                if (tFar < tMax)  tMax = tFar;
                if (tMin > tMax)  return null;
            }
        }

        return tMin >= 0 ? tMin : null;
    }
}