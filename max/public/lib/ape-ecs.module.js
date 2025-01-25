/******/ var __webpack_modules__ = ({

  /***/ 316:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const System = __webpack_require__(495);

    class CleanupApeDestroySystem extends System {
      init() {
        this.destroyQuery = this.createQuery({ includeApeDestroy: true })
            .fromAll('ApeDestroy')
            .persist();
      }

      update() {
        const entities = this.destroyQuery.execute();
        for (const entity of entities) {
          entity.destroy();
        }
      }
    }

    function setupApeDestroy(world) {
      world.registerTags('ApeDestroy');
      world.registerSystem('ApeCleanup', CleanupApeDestroySystem);
    }

    module.exports = setupApeDestroy;


    /***/ }),

  /***/ 915:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const Util = __webpack_require__(94);
    const idGen = new Util.IdGenerator();

    class Component {
      constructor(world) {
        this.world = world;
        this._meta = {
          key: '',
          updated: 0,
          entityId: '',
          refs: new Set(),
          ready: false,
          values: {}
        };
      }

      preInit(initial) {
        return initial;
      }

      init(initial) {}

      get type() {
        return this.constructor.name;
      }

      get key() {
        return this._meta.key;
      }

      set key(value) {
        const old = this._meta.key;
        this._meta.key = value;
        if (old) {
          delete this.entity.c[old];
        }
        if (value) {
          this.entity.c[value] = this;
        }
      }

      destroy() {
        this.preDestroy();
        this._meta.values = {};
        for (const ref of this._meta.refs) {
          const [value, prop, sub] = ref.split('||');
          this.world._deleteRef(
              value,
              this._meta.entityId,
              this.id,
              prop,
              sub,
              this._meta.key,
              this.type
          );
        }
        this.world._sendChange({
          op: 'destroy',
          component: this.id,
          entity: this._meta.entityId,
          type: this.type
        });
        this.world.componentsById.delete(this.id);
        this.world.componentPool.get(this.type).release(this);
        this.postDestroy();
      }

      preDestroy() {}

      postDestroy() {}

      getObject(withIds = true) {
        const obj = {
          type: this.constructor.name
        };
        if (withIds) {
          obj.id = this.id;
          obj.entity = this.entity.id;
        }
        let fields = this.constructor.serializeFields || this.constructor.fields;
        if (Array.isArray(this.constructor.skipSerializeFields)) {
          fields = fields.filter((field, idx, arr) => {
            return this.constructor.skipSerializeFields.indexOf(field) === -1;
          });
        }
        for (const field of fields) {
          if (
              this[field] !== undefined &&
              this[field] !== null &&
              typeof this[field].getValue === 'function'
          ) {
            obj[field] = this[field].getValue();
          } else if (this._meta.values.hasOwnProperty(field)) {
            obj[field] = this._meta.values[field];
          } else {
            obj[field] = this[field];
          }
        }
        if (this._meta.key) {
          obj.key = this._meta.key;
        }
        return obj;
      }

      _setup(entity, initial) {
        this.entity = entity;
        this.id = initial.id || idGen.genId();
        this._meta.updated = this.world.currentTick;
        this._meta.entityId = entity.id;
        if (initial.key) {
          this.key = initial.key;
        }
        this._meta.values = {};
        this.world.componentsById.set(this.id, this);

        const fields = this.constructor.fields;
        const primitives = this.constructor.primitives;
        const factories = this.constructor.factories;
        // shallow copy of the property defaults
        initial = this.preInit(initial);
        const values = Object.assign({}, primitives, initial);
        for (const field of fields) {
          const value = values[field];
          if (factories.hasOwnProperty(field)) {
            const res = factories[field](this, value, field);
            if (res !== undefined) {
              this[field] = res;
            }
          } else {
            this[field] = value;
          }
        }
        this._meta.ready = true;
        Object.freeze();
        this.init(initial);
        this.world._sendChange({
          op: 'add',
          component: this.id,
          entity: this._meta.entityId,
          type: this.type
        });
      }

      _reset() {
        this._meta.key = '';
        this._meta.updated = 0;
        this._meta.entityId = 0;
        this._meta.ready = false;
        this._meta.refs.clear();
        this._meta.values = {};
      }

      update(values) {
        if (values) {
          delete values.type;
          Object.assign(this, values);
          if (this.constructor.changeEvents) {
            const change = {
              op: 'change',
              props: [],
              component: this.id,
              entity: this._meta.entityId,
              type: this.type
            };
            for (const prop in values) {
              change.props.push(prop);
            }
            this.world._sendChange(change);
          }
        }
        this._meta.updated = this.entity.updatedValues = this.world.currentTick;
      }

      _addRef(value, prop, sub) {
        this._meta.refs.add(`${value}||${prop}||${sub}`);
        this.world._addRef(
            value,
            this._meta.entityId,
            this.id,
            prop,
            sub,
            this._meta.key,
            this.type
        );
      }

      _deleteRef(value, prop, sub) {
        this._meta.refs.delete(`${value}||${prop}||${sub}`);
        this.world._deleteRef(
            value,
            this._meta.entityId,
            this.id,
            prop,
            sub,
            this._meta.key,
            this.type
        );
      }
    }

    Component.properties = {};
    Component.serialize = true;
    Component.serializeFields = null;
    Component.skipSerializeFields = null;
    Component.subbed = false;
    Component.registered = false;

    module.exports = Component;


    /***/ }),

  /***/ 485:
  /***/ ((module) => {

    class ComponentPool {
      constructor(world, type, spinup) {
        this.world = world;
        this.type = type;
        this.klass = this.world.componentTypes[this.type];
        this.pool = [];
        this.targetSize = spinup;
        this.active = 0;
        this.spinUp(spinup);
      }

      get(entity, initial) {
        let comp;
        if (this.pool.length === 0) {
          comp = new this.klass(this.world);
        } else {
          comp = this.pool.pop();
        }
        comp._setup(entity, initial);
        this.active++;
        return comp;
      }

      release(comp) {
        comp._reset();
        //comp._meta.entity = null;
        this.pool.push(comp);
        this.active--;
      }

      cleanup() {
        if (this.pool.length > this.targetSize * 2) {
          const diff = this.pool.length - this.targetSize;
          const chunk = Math.max(Math.min(20, diff), Math.floor(diff / 4));
          for (let i = 0; i < chunk; i++) {
            this.pool.pop();
          }
        }
      }

      spinUp(count) {
        for (let i = 0; i < count; i++) {
          const comp = new this.klass(this.world);
          this.pool.push(comp);
        }
        this.targetSize = Math.max(this.targetSize, this.pool.length);
      }
    }

    module.exports = ComponentPool;


    /***/ }),

  /***/ 425:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const BaseComponent = __webpack_require__(915);
    const IdGenerator = (__webpack_require__(94).IdGenerator);
    const idGen = new IdGenerator();

    class Entity {
      constructor() {
        this.types = {};
        this.c = {};
        this.id = '';
        this.tags = new Set();
        this.updatedComponents = 0;
        this.updatedValues = 0;
        this.destroyed = false;
        this.ready = false;
      }

      _setup(definition) {
        this.destroyed = false;
        if (definition.id) {
          this.id = definition.id;
        } else {
          this.id = idGen.genId();
        }
        this.world.entities.set(this.id, this);

        this.updatedComponents = this.world.currentTick;

        if (definition.tags) {
          for (const tag of definition.tags) {
            this.addTag(tag);
          }
        }

        if (definition.components) {
          for (const compdef of definition.components) {
            this.addComponent(compdef);
          }
        }

        if (definition.c) {
          const defs = definition.c;
          for (const key of Object.keys(defs)) {
            const comp = {
              ...defs[key],
              key
            };
            if (!comp.type) comp.type = key;
            this.addComponent(comp);
          }
        }
        this.ready = true;
        this.world._entityUpdated(this);
      }

      has(type) {
        if (typeof type !== 'string') {
          type = type.name;
        }
        return this.tags.has(type) || this.types.hasOwnProperty(type);
      }

      getOne(type) {
        if (typeof type !== 'string') {
          type = type.name;
        }
        let component;
        // istanbul ignore else
        if (this.types[type]) {
          component = [...this.types[type]][0];
        }
        return component;
      }

      getComponents(type) {
        if (typeof type !== 'string') {
          type = type.name;
        }
        return this.types[type] || new Set();
      }

      addTag(tag) {
        // istanbul ignore next
        if (!this.world.tags.has(tag)) {
          throw new Error(`addTag "${tag}" is not registered. Type-O?`);
        }
        this.tags.add(tag);
        this.updatedComponents = this.world.currentTick;
        this.world.entitiesByComponent[tag].add(this.id);
        if (this.ready) {
          this.world._entityUpdated(this);
        }
      }

      removeTag(tag) {
        this.tags.delete(tag);
        this.updatedComponents = this.world.currentTick;
        this.world.entitiesByComponent[tag].delete(this.id);
        this.world._entityUpdated(this);
      }

      addComponent(properties) {
        const type = properties.type;
        const pool = this.world.componentPool.get(type);
        if (pool === undefined) {
          throw new Error(`Component "${type}" has not been registered.`);
        }
        const comp = pool.get(this, properties);
        if (!this.types[type]) {
          this.types[type] = new Set();
        }
        this.types[type].add(comp);
        this.world._addEntityComponent(type, this);
        this.updatedComponents = this.world.currentTick;
        if (this.ready) {
          this.world._entityUpdated(this);
        }
        return comp;
      }

      removeComponent(component) {
        if (typeof component === 'string') {
          component = this.c[component];
        }
        if (component === undefined) {
          return false;
        }
        if (component.key) {
          delete this.c[component.key];
        }
        this.types[component.type].delete(component);

        if (this.types[component.type].size === 0) {
          delete this.types[component.type];
        }
        this.world._deleteEntityComponent(component);
        this.world._entityUpdated(this);
        component.destroy();
        return true;
      }

      getObject(componentIds = true) {
        const obj = {
          id: this.id,
          tags: [...this.tags],
          components: [],
          c: {}
        };
        for (const type of Object.keys(this.types)) {
          for (const comp of this.types[type]) {
            // $lab:coverage:off$
            if (!comp.constructor.serialize) {
              continue;
            }
            // $lab:coverage:on$
            if (comp.key) {
              obj.c[comp.key] = comp.getObject(componentIds);
            } else {
              obj.components.push(comp.getObject(componentIds));
            }
          }
        }
        return obj;
      }

      destroy() {

        if (this.destroyed) return;
        if (this.world.refs[this.id]) {
          for (const ref of this.world.refs[this.id]) {
            const [entityId, componentId, prop, sub] = ref.split('...');
            const entity = this.world.getEntity(entityId);
            // istanbul ignore next
            if (!entity) continue;
            const component = entity.world.componentsById.get(componentId);
            // istanbul ignore next
            if (!component) continue;
            const path = prop.split('.');

            let target = component;
            let parent = target;
            for (const prop of path) {
              parent = target;
              target = target[prop];
            }
            if (sub === '__set__') {
              target.delete(this);
            } else if (sub === '__obj__') {
              delete parent[path[1]];
            } else {
              parent[prop] = null;
            }
          }
        }
        for (const type of Object.keys(this.types)) {
          for (const component of this.types[type]) {
            this.removeComponent(component);
          }
        }
        this.tags.clear();
        this.world.entities.delete(this.id);
        delete this.world.entityReverse[this.id];
        this.destroyed = true;
        this.ready = false;
        this.world.entityPool.destroy(this);
        this.world._clearIndexes(this);
      }
    }

    module.exports = Entity;


    /***/ }),

  /***/ 347:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const Entity = __webpack_require__(425);

    class EntityPool {
      constructor(world, spinup) {
        this.world = world;
        this.pool = [];
        this.destroyed = [];
        this.worldEntity = class WorldEntity extends Entity {};
        this.worldEntity.prototype.world = this.world;
        this.spinUp(spinup);
        this.targetSize = spinup;
      }

      destroy(entity) {
        this.destroyed.push(entity);
      }

      get(definition, onlyComponents = false) {
        let entity;
        if (this.pool.length === 0) {
          entity = new this.worldEntity();
        } else {
          entity = this.pool.pop();
        }
        entity._setup(definition, onlyComponents);
        return entity;
      }

      release() {
        while (this.destroyed.length > 0) {
          const entity = this.destroyed.pop();
          this.pool.push(entity);
        }
      }

      cleanup() {
        if (this.pool.length > this.targetSize * 2) {
          const diff = this.pool.length - this.targetSize;
          const chunk = Math.max(Math.min(20, diff), Math.floor(diff / 4));
          for (let i = 0; i < chunk; i++) {
            this.pool.pop();
          }
        }
      }

      spinUp(count) {
        for (let i = 0; i < count; i++) {
          const entity = new this.worldEntity();
          this.pool.push(entity);
        }
        this.targetSize = Math.max(this.targetSize, this.pool.length);
      }
    }

    module.exports = EntityPool;


    /***/ }),

  /***/ 963:
  /***/ ((module) => {

    class EntitySet extends Set {
      constructor(component, object, field) {
        super();
        this.component = component;
        this.field = field;
        this.sub = '__set__';
        object = object.map((value) =>
            typeof value === 'string' ? value : value.id
        );
        this.dvalue = object;
        for (const item of object) {
          this.add(item);
        }
      }

      _reset() {
        this.clear();
        for (const item of this.dvalue) {
          this.add(item);
        }
      }

      add(value) {
        if (value.id) {
          value = value.id;
        }
        this.component._addRef(value, this.field, '__set__');
        super.add(value);
      }

      delete(value) {
        if (value.id) {
          value = value.id;
        }
        this.component._deleteRef(value, this.field, '__set__');
        const res = super.delete(value);
        return res;
      }

      has(value) {
        if (value.id) {
          value = value.id;
        }
        return super.has(value);
      }

      [Symbol.iterator]() {
        const that = this;
        const siterator = super[Symbol.iterator]();
        return {
          next() {
            const result = siterator.next();
            if (typeof result.value === 'string') {
              result.value = that.component.entity.world.getEntity(result.value);
            }
            return result;
          }
        };
      }

      getValue() {
        return [...this].map((entity) => entity.id);
      }
    }

    module.exports = {
      EntityRef(comp, dvalue, field) {
        dvalue = dvalue || null;
        if (!comp.hasOwnProperty(field)) {
          Object.defineProperty(comp, field, {
            get() {
              return comp.world.getEntity(comp._meta.values[field]);
            },
            set(value) {
              const old = comp._meta.values[field];
              value = value && typeof value !== 'string' ? value.id : value;
              if (old && old !== value) {
                comp._deleteRef(old, field, undefined);
              }
              if (value && value !== old) {
                comp._addRef(value, field, undefined);
              }
              comp._meta.values[field] = value;
            }
          });
        }
        comp[field] = dvalue;
        return;
      },

      EntityObject(comp, object, field) {
        comp._meta.values[field] = object || {};
        const values = comp._meta.values[field];
        const keys = Object.keys(values);
        for (const key of keys) {
          if (values[key] && values[key].id) {
            values[key] = values[key].id;
          }
        }
        return new Proxy(comp._meta.values[field], {
          get(obj, prop) {
            return comp.world.getEntity(obj[prop]);
          },
          set(obj, prop, value) {
            const old = obj[prop];
            if (value && value.id) {
              value = value.id;
            }
            obj[prop] = value;
            if (old && old !== value) {
              comp._deleteRef(old, `${field}.${prop}`, '__obj__');
            }
            if (value && value !== old) {
              comp._addRef(value, `${field}.${prop}`, '__obj__');
            }
            return true;
          },
          deleteProperty(obj, prop) {
            if (!obj.hasOwnProperty(prop)) return false;
            const old = obj[prop];
            delete obj[prop];
            comp._deleteRef(old, `${field}.${prop}`, '__obj__');
            return true;
          }
        });
      },

      EntitySet(component, object = [], field) {
        return new EntitySet(component, object, field);
      }
    };


    /***/ }),

  /***/ 676:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const Entity = __webpack_require__(425);
    const Util = __webpack_require__(94);

    class Query {
      constructor(world, system, init) {
        this.system = system;
        this.world = world;
        this.query = {
          froms: [],
          filters: []
        };

        this.hasStatic = false;
        this.persisted = false;
        this.results = new Set();
        this.executed = false;
        this.added = new Set();
        this.removed = new Set();

        if (this.world.config.useApeDestroy && !init) {
          this.not('ApeDestroy');
        }

        if (init) {
          this.trackAdded = init.trackAdded || false;
          this.trackRemoved = init.trackRemoved || false;
          // istanbul ignore if
          if ((this.trackAdded || this.trackRemoved) && !this.system) {
            throw new Error(
                'Queries cannot track added or removed when initialized outside of a system'
            );
          }
          if (this.world.config.useApeDestroy && !init.includeApeDestroy) {
            if (init.not) {
              init.not.push('ApeDestroy');
            } else {
              init.not = ['ApeDestroy'];
            }
          }
          if (init.from) {
            this.from(...init.from);
          }
          if (init.reverse) {
            this.fromReverse(init.reverse.entity, init.reverse.type);
          }
          if (init.all) {
            this.fromAll(...init.all);
          }
          if (init.any) {
            this.fromAny(...init.any);
          }
          if (init.not) {
            this.not(...init.not);
          }
          if (init.only) {
            this.only(...init.only);
          }
          if (init.persist) {
            this.persist();
          }
        }
      }

      from(...entities) {
        entities = entities.map((e) => (typeof e !== 'string' ? e.id : e));
        this.query.froms.push({
          from: 'from',
          entities
        });
        this.hasStatic = true;
        return this;
      }

      fromReverse(entity, componentName) {
        if (typeof entity === 'string') {
          entity = this.world.getEntity(entity);
        }
        if (typeof componentName === 'function') {
          componentName = componentName.name;
        }
        this.query.froms.push({
          from: 'reverse',
          entity,
          type: componentName
        });
        return this;
      }

      fromAll(...types) {
        const stringTypes = types.map((t) => (typeof t !== 'string' ? t.name : t));
        this.query.froms.push({
          from: 'all',
          types: stringTypes
        });
        return this;
      }

      fromAny(...types) {
        const stringTypes = types.map((t) => (typeof t !== 'string' ? t.name : t));
        this.query.froms.push({
          from: 'any',
          types: stringTypes
        });
        return this;
      }

      not(...types) {
        const stringTypes = types.map((t) => (typeof t !== 'string' ? t.name : t));
        this.query.filters.push({
          filter: 'not',
          types: stringTypes
        });
        return this;
      }

      only(...types) {
        const stringTypes = types.map((t) => (typeof t !== 'string' ? t.name : t));
        this.query.filters.push({
          filter: 'only',
          types: stringTypes
        });
        return this;
      }

      update(entity) {
        let inFrom = false;
        for (const source of this.query.froms) {
          if (source.from === 'all') {
            let found = true;
            for (const type of source.types) {
              if (!entity.has(type)) {
                found = false;
                break;
              }
            }
            if (found) {
              inFrom = true;
              break;
            }
          } else if (source.from === 'any') {
            const potential = [];
            let found = false;
            for (const type of source.types) {
              if (entity.has(type)) {
                found = true;
                break;
              }
            }
            if (found) {
              inFrom = true;
              break;
            }
          } /* istanbul ignore else */ else if (source.from === 'reverse') {
            // istanbul ignore else
            if (
                this.world.entityReverse.hasOwnProperty(source.entity.id) &&
                this.world.entityReverse[source.entity.id].hasOwnProperty(source.type)
            ) {
              const keys = new Set(
                  this.world.entityReverse[source.entity.id][source.type].keys()
              );
              if (
                  new Set(
                      this.world.entityReverse[source.entity.id][source.type].keys()
                  ).has(entity.id)
              ) {
                inFrom = true;
                break;
              }
            }
          }
        }
        if (inFrom) {
          this.results.add(entity);
          this._filter(entity);
          if (this.trackAdded) {
            this.added.add(entity);
          }
        } else {
          this._removeEntity(entity);
        }
      }

      _removeEntity(entity) {
        if (this.results.has(entity) && this.trackRemoved) {
          this.removed.add(entity);
        }
        this.results.delete(entity);
      }

      persist(trackAdded, trackRemoved) {
        // istanbul ignore if
        if (this.hasStatic) {
          throw new Error('Cannot persist query with static list of entities.');
        }
        // istanbul ignore if
        if (this.query.froms.length === 0) {
          throw new Error(
              'Cannot persist query without entity source (fromAll, fromAny, fromReverse).'
          );
        }

        this.world.queries.push(this);
        if (this.system !== null) {
          this.system.queries.push(this);
        }

        if (typeof trackAdded === 'boolean') {
          this.trackAdded = trackAdded;
        }
        if (typeof trackRemoved === 'boolean') {
          this.trackRemoved = trackRemoved;
        }
        this.persisted = true;
        return this;
      }

      clearChanges() {
        this.added.clear();
        this.removed.clear();
      }

      refresh() {
        //load in entities using from methods
        let results = new Set();
        for (const source of this.query.froms) {
          // instanbul ignore else
          if (source.from === 'from') {
            results = Util.setUnion(results, source.entities);
          } else if (source.from === 'all') {
            if (source.types.length === 1) {
              // istanbul ignore if
              if (!this.world.entitiesByComponent.hasOwnProperty(source.types[0])) {
                throw new Error(
                    `${source.types[0]} is not a registered Component/Tag`
                );
              }
              results = Util.setUnion(
                  results,
                  this.world.entitiesByComponent[source.types[0]]
              );
            } else {
              const comps = [];
              for (const type of source.types) {
                const entities = this.world.entitiesByComponent[type];
                // istanbul ignore if
                if (entities === undefined) {
                  throw new Error(`${type} is not a registered Component/Tag`);
                }
                comps.push(entities);
              }
              results = Util.setUnion(results, Util.setIntersection(...comps));
            }
          } else if (source.from === 'any') {
            const comps = [];
            for (const type of source.types) {
              const entities = this.world.entitiesByComponent[type];
              // istanbul ignore if
              if (entities === undefined) {
                throw new Error(`${type} is not a registered Component/Tag`);
              }
              comps.push(entities);
            }
            results = Util.setUnion(results, ...comps);
          } /* istanbul ignore else */ else if (source.from === 'reverse') {
            // istanbul ignore else
            if (
                this.world.entityReverse[source.entity.id] &&
                this.world.entityReverse[source.entity.id].hasOwnProperty(source.type)
            ) {
              results = Util.setUnion(
                  results,
                  new Set([
                    ...this.world.entityReverse[source.entity.id][source.type].keys()
                  ])
              );
            }
          }
        }

        this.results = new Set(
            [...results]
                .map((id) => this.world.getEntity(id))
                .filter((entity) => !!entity)
        );

        //filter results
        for (const entity of this.results) {
          this._filter(entity);
        }

        if (this.trackAdded) {
          this.added = new Set(this.results);
        }

        return this;
      }

      _filter(entity) {
        for (const filter of this.query.filters) {
          if (filter.filter === 'not') {
            for (const type of filter.types) {
              if (entity.has(type)) {
                this.results.delete(entity);
                break;
              }
            }
          } /* istanbul ignore else */ else if (filter.filter === 'only') {
            let found = false;
            for (const type of filter.types) {
              if (entity.has(type)) {
                found = true;
                break;
              }
            }
            if (!found) {
              this.results.delete(entity);
            }
          }
        }
      }

      execute(filter) {
        if (!this.executed) {
          this.refresh();
        }
        this.executed = true;
        // istanbul ignore next
        if (
            filter === undefined ||
            (!filter.hasOwnProperty('updatedComponents') &&
                !filter.hasOwnProperty('updatedValues'))
        ) {
          return this.results;
        }
        const output = [];
        for (const entity of this.results) {
          // istanbul ignore next
          if (
              !(
                  filter.updatedComponents &&
                  entity.updatedComponents < filter.updatedComponents
              ) &&
              !(filter.updatedValues && entity.updatedValues < filter.updatedValues)
          ) {
            output.push(entity);
          }
        }
        return new Set(output);
      }
    }

    module.exports = Query;


    /***/ }),

  /***/ 495:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    const Query = __webpack_require__(676);

    class System {
      constructor(world, ...initArgs) {
        this.world = world;
        this._stagedChanges = [];
        this.changes = [];
        this.queries = [];
        this.lastTick = this.world.currentTick;
        if (this.constructor.subscriptions) {
          for (const sub of this.constructor.subscriptions) {
            this.subscribe(sub);
          }
        }
        this.init(...initArgs);
      }

      init() {}

      update(tick) {}

      createQuery(init) {
        return new Query(this.world, this, init);
      }

      subscribe(type) {
        if (typeof type !== 'string') {
          type = type.name;
        }
        if (!this.world.subscriptions.has(type)) {
          this.world.componentTypes[type].subbed = true;
          this.world.subscriptions.set(type, new Set());
        }
        this.world.subscriptions.get(type).add(this);
      }

      _preUpdate() {
        this.changes = this._stagedChanges;
        this._stagedChanges = [];
        this.world.updateIndexes();
      }

      _postUpdate() {
        for (const query of this.queries) {
          query.clearChanges();
        }
      }

      _recvChange(change) {
        this._stagedChanges.push(change);
      }
    }

    module.exports = System;


    /***/ }),

  /***/ 94:
  /***/ ((module) => {

    class IdGenerator {
      constructor() {
        this.gen_num = 0;
        this.prefix = '';
        this.genPrefix();
      }

      genPrefix() {
        this.prefix = Date.now().toString(32);
      }

      genId() {
        this.gen_num++;
        // istanbul ignore if
        if (this.gen_num === 4294967295) {
          this.gen_num = 0;
          this.genPrefix();
        }
        return this.prefix + this.gen_num;
      }
    }

    function setIntersection() {
      let sets = Array.from(arguments),
          setSizes = sets.map((set) => set.size),
          smallestSetIndex = setSizes.indexOf(Math.min.apply(Math, setSizes)),
          smallestSet = sets[smallestSetIndex],
          result = new Set(smallestSet);

      sets.splice(smallestSetIndex, 1);

      smallestSet.forEach((value) => {
        for (let i = 0; i < sets.length; i += 1) {
          if (!sets[i].has(value)) {
            result.delete(value);
            break;
          }
        }
      });

      return result;
    }

    function setUnion() {
      let result = new Set();

      Array.from(arguments).forEach((set) => {
        set.forEach((value) => result.add(value));
      });

      return result;
    }

    module.exports = {
      IdGenerator,
      setIntersection,
      setUnion
    };


    /***/ }),

  /***/ 532:
  /***/ ((module, __unused_webpack_exports, __webpack_require__) => {

    /*
     * @module ecs/ECS
     * @type {class}
     */
    const Entity = __webpack_require__(425);
    const Query = __webpack_require__(676);
    const ComponentPool = __webpack_require__(485);
    const EntityPool = __webpack_require__(347);
    const setupApeDestroy = __webpack_require__(316);

    const componentReserved = new Set([
      'constructor',
      'init',
      'type',
      'key',
      'destroy',
      'preDestroy',
      'postDestroy',
      'getObject',
      '_setup',
      '_reset',
      'update',
      'clone',
      '_meta',
      '_addRef',
      '_deleteRef',
      'prototype'
    ]);

    /**
     * Main library class for registering Components, Systems, Queries,
     * and runnning Systems.
     * Create multiple World instances in order to have multiple collections.
     * @exports World
     */
    module.exports = class World {
      constructor(config) {
        this.config = Object.assign(
            {
              trackChanges: true,
              entityPool: 10,
              cleanupPools: true,
              useApeDestroy: false
            },
            config
        );
        this.currentTick = 0;
        this.entities = new Map();
        this.types = {};
        this.tags = new Set();
        this.entitiesByComponent = {};
        this.componentsById = new Map();
        this.entityReverse = {};
        this.updatedEntities = new Set();
        this.componentTypes = {};
        this.components = new Map();
        this.queries = [];
        this.subscriptions = new Map();
        this.systems = new Map();
        this.refs = {};
        this.componentPool = new Map();
        this._statCallback = null;
        this._statTicks = 0;
        this._nextStat = 0;
        this.entityPool = new EntityPool(this, this.config.entityPool);
        if (this.config.useApeDestroy) {
          setupApeDestroy(this);
        }
      }

      /**
       * Called in order to increment ecs.currentTick, update indexed queries, and update key.
       * @method module:ECS#tick
       */
      tick() {
        if (this.config.useApeDestroy) {
          this.runSystems('ApeCleanup');
        }
        this.currentTick++;
        this.updateIndexes();
        this.entityPool.release();
        // istanbul ignore else
        if (this.config.cleanupPools) {
          this.entityPool.cleanup();
          for (const [key, pool] of this.componentPool) {
            pool.cleanup();
          }
        }
        if (this._statCallback) {
          this._nextStat += 1;
          if (this._nextStat >= this._statTicks) {
            this._outputStats();
          }
        }
        return this.currentTick;
      }

      getStats() {
        const stats = {
          entity: {
            active: this.entities.size,
            pooled: this.entityPool.pool.length,
            target: this.entityPool.targetSize
          },
          components: {}
        };
        for (const [key, pool] of this.componentPool) {
          stats.components[key] = {
            active: pool.active,
            pooled: pool.pool.length,
            target: pool.targetSize
          };
        }
        return stats;
      }

      logStats(freq, callback) {
        // istanbul ignore next
        if (callback === undefined) {
          callback = console.log;
        }
        this._statCallback = callback;
        this._statTicks = freq;
        this._nextStat = 0;
      }

      _outputStats() {
        const stats = this.getStats();
        this._nextStat = 0;
        let output = `${this.currentTick}, Entities: ${stats.entity.active} active, ${stats.entity.pooled}/${stats.entity.target} pooled`;
        for (const key of Object.keys(stats.components)) {
          const cstat = stats.components[key];
          output += `\n${this.currentTick}, ${key}: ${cstat.active} active, ${cstat.pooled}/${cstat.target} pooled`;
        }
        this._statCallback(output);
      }

      _addRef(target, entity, component, prop, sub, key, type) {
        if (!this.refs[target]) {
          this.refs[target] = new Set();
        }
        const eInst = this.getEntity(target);
        if (!this.entityReverse.hasOwnProperty(target)) {
          this.entityReverse[target] = {};
        }
        if (!this.entityReverse[target].hasOwnProperty(key)) {
          this.entityReverse[target][key] = new Map();
        }
        const reverse = this.entityReverse[target][key];
        let count = reverse.get(entity);
        /* $lab:coverage:off$ */
        if (count === undefined) {
          count = 0;
        }
        /* $lab:coverage:on$ */
        reverse.set(entity, count + 1);
        this.refs[target].add([entity, component, prop, sub].join('...'));
        this._sendChange({
          op: 'addRef',
          component: component,
          type: type,
          property: prop,
          target,
          entity
        });
      }

      _deleteRef(target, entity, component, prop, sub, key, type) {
        const ref = this.entityReverse[target][key];
        let count = ref.get(entity);
        count--;
        // istanbul ignore else
        if (count < 1) {
          ref.delete(entity);
        } else {
          ref.set(entity, count);
        }
        if (ref.size === 0) {
          delete ref[key];
        }
        this.refs[target].delete([entity, component, prop, sub].join('...'));
        if (this.refs[target].size === 0) {
          delete this.refs[target];
        }
        this._sendChange({
          op: 'deleteRef',
          component,
          type: type,
          target,
          entity,
          property: prop
        });
      }

      /**
       * @typedef {Object} definition
       * @property {Object} properites
       * @property {function} init
       */

      /**
       * If you're going to use tags, you needs to let the ECS instance know.
       * @method module:ECS#registerTags
       * @param {string[]|string} tags - Array of tags to register, or a single tag.
       * @example
       * ecs.registerTags['Item', 'Blocked']);
       */
      registerTags(...tags) {
        for (const tag of tags) {
          // istanbul ignore if
          if (this.entitiesByComponent.hasOwnProperty(tag)) {
            throw new Error(`Cannot register tag "${tag}", name is already taken.`);
          }
          this.entitiesByComponent[tag] = new Set();
          this.tags.add(tag);
        }
      }

      registerComponent(klass, spinup = 1) {
        if (klass.typeName && klass.name !== klass.typeName) {
          Object.defineProperty(klass, 'name', { value: klass.typeName });
        }
        const name = klass.name;
        // istanbul ignore if
        if (this.tags.has(name)) {
          throw new Error(`registerComponent: Tag already defined for "${name}"`);
        } /* istanbul ignore if */ else if (
            this.componentTypes.hasOwnProperty(name)
        ) {
          throw new Error(
              `registerComponent: Component already defined for "${name}"`
          );
        }
        this.componentTypes[name] = klass;
        if (!klass.registered) {
          klass.registered = true;
          klass.fields = Object.keys(klass.properties);
          klass.primitives = {};
          klass.factories = {};
          for (const field of klass.fields) {
            // istanbul ignore if
            if (componentReserved.has(field)) {
              throw new Error(
                  `Error registering ${klass.name}: Reserved property name "${field}"`
              );
            }
            if (typeof klass.properties[field] === 'function') {
              klass.factories[field] = klass.properties[field];
            } else {
              klass.primitives[field] = klass.properties[field];
            }
          }
        }
        this.entitiesByComponent[name] = new Set();
        this.componentPool.set(name, new ComponentPool(this, name, spinup));
      }

      createEntity(definition) {
        return this.entityPool.get(definition);
      }

      getObject() {
        const obj = [];
        for (const kv of this.entities) {
          obj.push(kv[1].getObject());
        }
        return obj;
      }

      createEntities(definition) {
        for (const entityDef of definition) {
          this.createEntity(entityDef);
        }
      }

      copyTypes(world, types) {
        for (const name of types) {
          if (world.tags.has(name)) {
            this.registerTags(name);
          } else {
            const klass = world.componentTypes[name];
            this.componentTypes[name] = klass;
            this.entitiesByComponent[name] = new Set();
            this.componentPool.set(name, new ComponentPool(this, name, 1));
          }
        }
      }

      removeEntity(id) {
        let entity;
        if (id instanceof Entity) {
          entity = id;
          id = entity.id;
        } else {
          entity = this.getEntity(id);
        }
        entity.destroy();
      }

      getEntity(entityId) {
        return this.entities.get(entityId);
      }

      getEntities(type) {
        if (typeof type !== 'string') {
          type = type.name;
        }
        const results = [...this.entitiesByComponent[type]];
        return new Set(results.map((id) => this.getEntity(id)));
      }

      getComponent(id) {
        return this.componentsById.get(id);
      }

      createQuery(init) {
        return new Query(this, null, init);
      }

      _sendChange(operation) {
        if (this.componentTypes[operation.type].subbed) {
          const systems = this.subscriptions.get(operation.type);
          // istanbul ignore if
          if (!systems) {
            return;
          }
          for (const system of systems) {
            system._recvChange(operation);
          }
        }
      }

      registerSystem(group, system, initParams) {
        initParams = initParams || [];
        if (typeof system === 'function') {
          system = new system(this, ...initParams);
        }
        if (!this.systems.has(group)) {
          this.systems.set(group, new Set());
        }
        this.systems.get(group).add(system);
        return system;
      }

      runSystems(group) {
        const systems = this.systems.get(group);
        if (!systems) return;
        for (const system of systems) {
          system._preUpdate();
          system.update(this.currentTick);
          system._postUpdate();
          system.lastTick = this.currentTick;
          if (system.changes.length !== 0) {
            system.changes = [];
          }
        }
      }

      _entityUpdated(entity) {
        // istanbul ignore else
        if (this.config.trackChanges) {
          this.updatedEntities.add(entity);
        }
      }

      _addEntityComponent(name, entity) {
        this.entitiesByComponent[name].add(entity.id);
      }

      _deleteEntityComponent(component) {
        this.entitiesByComponent[component.type].delete(component._meta.entityId);
      }

      _clearIndexes(entity) {
        for (const query of this.queries) {
          query._removeEntity(entity);
        }
        this.updatedEntities.delete(entity);
      }

      updateIndexes() {
        for (const entity of this.updatedEntities) {
          this._updateIndexesEntity(entity);
        }
        this.updatedEntities.clear();
      }

      _updateIndexesEntity(entity) {
        for (const query of this.queries) {
          query.update(entity);
        }
      }
    };


    /***/ })

  /******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
  /******/ 	// Check if module is in cache
  /******/ 	var cachedModule = __webpack_module_cache__[moduleId];
  /******/ 	if (cachedModule !== undefined) {
    /******/ 		return cachedModule.exports;
    /******/ 	}
  /******/ 	// Create a new module (and put it into the cache)
  /******/ 	var module = __webpack_module_cache__[moduleId] = {
    /******/ 		// no module.id needed
    /******/ 		// no module.loaded needed
    /******/ 		exports: {}
    /******/ 	};
  /******/
  /******/ 	// Execute the module function
  /******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  /******/
  /******/ 	// Return the exports of the module
  /******/ 	return module.exports;
  /******/ }
/******/
/************************************************************************/
/******/ /* webpack/runtime/create fake namespace object */
/******/ (() => {
  /******/ 	var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
  /******/ 	var leafPrototypes;
  /******/ 	// create a fake namespace object
  /******/ 	// mode & 1: value is a module id, require it
  /******/ 	// mode & 2: merge all properties of value into the ns
  /******/ 	// mode & 4: return value when already ns object
  /******/ 	// mode & 16: return value when it's Promise-like
  /******/ 	// mode & 8|1: behave like require
  /******/ 	__webpack_require__.t = function(value, mode) {
    /******/ 		if(mode & 1) value = this(value);
    /******/ 		if(mode & 8) return value;
    /******/ 		if(typeof value === 'object' && value) {
      /******/ 			if((mode & 4) && value.__esModule) return value;
      /******/ 			if((mode & 16) && typeof value.then === 'function') return value;
      /******/ 		}
    /******/ 		var ns = Object.create(null);
    /******/ 		__webpack_require__.r(ns);
    /******/ 		var def = {};
    /******/ 		leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
    /******/ 		for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
      /******/ 			Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
      /******/ 		}
    /******/ 		def['default'] = () => (value);
    /******/ 		__webpack_require__.d(ns, def);
    /******/ 		return ns;
    /******/ 	};
  /******/ })();
/******/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
  /******/ 	// define getter functions for harmony exports
  /******/ 	__webpack_require__.d = (exports, definition) => {
    /******/ 		for(var key in definition) {
      /******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
        /******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
        /******/ 			}
      /******/ 		}
    /******/ 	};
  /******/ })();
/******/
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
  /******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
  /******/ })();
/******/
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
  /******/ 	// define __esModule on exports
  /******/ 	__webpack_require__.r = (exports) => {
    /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
      /******/ 		}
    /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 	};
  /******/ })();
/******/
/************************************************************************/
var __webpack_exports__ = {};
var _entityrefs_js__WEBPACK_IMPORTED_MODULE_1___namespace_cache;
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
  /* harmony export */   HK: () => (/* reexport default export from named module */ _world_js__WEBPACK_IMPORTED_MODULE_0__),
  /* harmony export */   Hu: () => (/* reexport fake namespace object from non-harmony */ _entityrefs_js__WEBPACK_IMPORTED_MODULE_1___namespace_cache || (_entityrefs_js__WEBPACK_IMPORTED_MODULE_1___namespace_cache = __webpack_require__.t(_entityrefs_js__WEBPACK_IMPORTED_MODULE_1__, 2))),
  /* harmony export */   iQ: () => (/* reexport default export from named module */ _system_js__WEBPACK_IMPORTED_MODULE_2__),
  /* harmony export */   uA: () => (/* reexport default export from named module */ _component_js__WEBPACK_IMPORTED_MODULE_3__),
  /* harmony export */   wC: () => (/* reexport default export from named module */ _entity_js__WEBPACK_IMPORTED_MODULE_4__)
  /* harmony export */ });
/* harmony import */ var _world_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(532);
/* harmony import */ var _entityrefs_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(963);
/* harmony import */ var _system_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(495);
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(915);
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(425);







var __webpack_exports__Component = __webpack_exports__.uA;
var __webpack_exports__Entity = __webpack_exports__.wC;
var __webpack_exports__EntityRef = __webpack_exports__.Hu;
var __webpack_exports__System = __webpack_exports__.iQ;
var __webpack_exports__World = __webpack_exports__.HK;
export { __webpack_exports__Component as Component, __webpack_exports__Entity as Entity, __webpack_exports__EntityRef as EntityRef, __webpack_exports__System as System, __webpack_exports__World as World };

//# sourceMappingURL=ape-ecs.module.js.map