"use strict";
const utils = require("lib_EngineUtils");
// Room only list task as [withdraw, contianer],[], creep check task
Object.defineProperties(Creep.prototype, {
  type: {
    configurable: true,
    get: function() {
      if (!this.memory.type) {
        this.memory.type = this.name.slice(0, this.name.indexOf("\n"));
      }
      return this.memory.type;
    },
    set: function(value) {
      this.memory.type = value;
    },
  },
});
/**
 * Creep get task from Room.memory.task
 * If there's no to quest but from, send from to storage or terminals
 *
 * @return  {Object[]}  A list of tasks
 * @example {action: withdraw, target: {id: "someID", pos: {new RoomPosition()}}}
 */
Creep.prototype.getTask = function(homeTasks) {
  /*
    * if it's immboile, request pull.

    if (full) get task that need it's carried content
    if (empty) find tombstone/dropped energy

    special cases:
    empty harvester
    military
    */
  let task;
  const home = this.home;
  if (!homeTasks)
    homeTasks = [
      ...(home.memory.tasks[this.type] || []),
      ...(home.memory.tasks[""] || []),
    ];
  if (DEBUG) console.log(JSON.stringify(homeTasks));
  if (this.ticksToLive < 0.1 * CREEP_LIFE_TIME && !_.sum(this.carry)) {
    // recycle old creep
    return {
      action:
        /* Game.rooms[creep.memory.pob].rcl > creep.home.rcl ? "renewCreep" : */ "recycleCreep",
      target: this.home.spawns[0].simplify,
      resource: {},
    };
  }
  // ? TODO dedicate upgrader/harvester?
  /*
    if (this.memory.role) {
      return this.workByRole(this.memory.role)
    }
    */
  const carry = _.sum(this.carry);
  if (carry >= this.carryCapacity) {
    this.memory.carrying = true;
  } else if (carry <= 0) {
    this.memory.carrying = false;
  }
  if (DEBUG) console.log("creep.memory.carrying :", this.memory.carrying);
  /*
    if (this.memory.role) {
      task = this.workByRole(this.memory.role);
      if (task) return task;
    }
    */
  // ? TODO task system only work with output, input should be found by creep itself
  if (this.memory.carrying) {
    // carrying
    // try to find a "to" task which output resources
    for (const i in homeTasks) {
      if (
        /* this.type.includes(homeTasks[i].creepType) && */ CREEP_ACTION[
          homeTasks[i].action
        ].enthalpy < 0
      ) {
        if (homeTasks[i].urgent) {
          // break loop if it's an urgent task
          task = homeTasks.splice(i, 1)[0];
          break;
        }
        if (!task) {
          // save first task
          task = homeTasks.splice(i, 1)[0];
        }
      }
    }
    if (task) {
      // task exist
      if (DEBUG) console.log(JSON.stringify(task));
      return task;
    }
    // store to storage/terminal
    if (
      home.storage &&
      _.sum(home.storage.store) < home.storage.storeCapacity
    ) {
      return {
        action: "transfer",
        target: home.storage.simplify,
        resource: {
          resourceType: _.findLastKey(this.carry),
          amount: this.carry[_.findLastKey(this.carry)],
        },
      };
    }
    if (
      home.terminal &&
      _.sum(home.terminal.store) < home.terminal.storeCapacity
    ) {
      return {
        action: "transfer",
        target: home.terminal.simplify,
        resource: {
          resourceType: _.findLastKey(this.carry),
          amount: this.carry[_.findLastKey(this.carry)],
        },
      };
    } else {
      if (/_s/.test(this.type)) {
        return {
          action: "drop",
          /*   target: this.pos.findClosestByRange(FIND_STRUCTURES, {
                         find: s => s.hits < s.hitsMax
                       }), */
          resource: {
            resourceType: Object.keys(this.carry)[0],
          },
        };
      }
    }
  } else {
    // not carrying
    // TODO
    // try to find a "from" task which input resources
    // find closest task
    let minDistance = Infinity;
    let task;
    for (const t of homeTasks) {
      if (
        /* (this.type.includes(t.creepType) || this.rcl === 1) && */ CREEP_ACTION[
          t.action
        ].enthalpy >= 0
      ) {
        if (t.urgent) {
          // break loop if it's an urgent task
          task = t;
          break;
        }
        const d = RoomPosition.fromObject(t.target.pos).getRangeTo(this.pos);
        if (d < minDistance) {
          task = t;
          minDistance = d;
        }
      }
    }
    if (task) {
      // task exist
      if (DEBUG) console.log(JSON.stringify(task));
      // when input less than carry, remove task from room.memory
      if (task.resource.amount > this.carryCapacity - _.sum(this.carry)) {
        // task.resource.amount -= (this.carryCapacity - _.sum(this.carry));
        _.remove(home.memory.tasks[this.type], task);
        _.remove(home.memory.tasks[""], task);
      } else {
        _.remove(home.memory.tasks[this.type], task);
        _.remove(home.memory.tasks[""], task);
      }
      return task;
    }
    // store to storage/terminal
    if (home.storage && home.storage.store.energy) {
      return {
        action: "withdraw",
        target: home.storage.simplify,
        resource: {
          resourceType: RESOURCE_ENERGY,
        },
      };
    }
    if (home.terminal && home.terminal.store.energy) {
      return {
        action: "withdraw",
        target: home.terminal.simplify,
        resource: {
          resourceType: RESOURCE_ENERGY,
        },
      };
    }
    this.say("\u{1F634}");
  }
  return task;
};
/**
 * Execute the task passed in
 *
 * @param   {Task}  task  The task you want to execute
 * @param   {string}  task.action  Any [Creep.action()]{@link https://docs.screeps.com/api/#Creep} method
 * @param   {Object}  task.target  A simplified RoomObject
 * @param   {string}  task.target.id  Target's ID
 * @param   {Object}  task.target.pos  Same format as any RoomPosition Object. But since it was prase from JSON, it is not an instace of RoomPosition
 * @return  {ERR_*}  One of the ERR_* constants
 */
Creep.prototype.doTask = function(task = this.memory.task): boolean {
  if ((this.ticksToLive | 0) < 10) return ERR_INVALID_ARGS;
  const {action, target, resource} = task;
  // request hauler if this creep is immobile
  if (
    this.memory.task &&
    !this.memory.taskSent &&
    utils.calcBodyEffectiveness(this.body, MOVE, "fatigue", 1) * 5 <
      this.body.length
  ) {
    // ! TODO set up a speed property for creep
    this.home.memory.tasks.Hauler.push({
      action: "pull",
      creepType: "Hauler",
      resource: {},
      target: this.simplify,
    });
    this.memory.taskSent = Game.time;
  }
  // if (DEBUG) console.log('doTask :', action, resource ? resource.resourceType : undefined, JSON.stringify(target.pos));
  return action && target
    ? this.go_(action, target, resource)
    : ERR_INVALID_ARGS;
};

Creep.prototype.go_ = function(
  action,
  target = this,
  resource = {
    resourceType: _.findLastKey(this.carry),
  },
) {
  // block other action if being pulled
  if (this.pulled) {
    this.pulled = false;
    return ERR_TIRED;
  }
  target = RoomObject.active(target);
  const range = CREEP_ACTION[action].range;
  if (this.pos.roomName === target.pos.roomName && !target.room) {
    return ERR_INVALID_TARGET;
  }
  if (!this.pos.inRangeToPos(target.pos, range)) {
    // move to target if not in range
    return (
      this.moveTo(target.pos, {
        range,
        visualizePathStyle: {
          stroke: RES_COLORS[_.findKey(this.carry, k => k > 0)],
        },
      }) || ERR_NOT_IN_RANGE
    );
  } else {
    // preform action if in range
    if (action === "pull") {
      // special case (pull): addition action
      const targetTask = target.memory.task;
      if (!targetTask) return ERR_INVALID_ARGS;
      target.pulled = true;
      // target.cancelOrder(MOVE); // DEBUG
      target.move(this);
      const targetActionRange = CREEP_ACTION[targetTask.action].range;
      return this.pos.inRangeToRoomObject(targetTask.target, targetActionRange)
        ? ERR_NO_PATH
        : this.moveTo(
            RoomObject.active(targetTask.target),
            targetActionRange,
          ) || ERR_NOT_IN_RANGE;
    }
    if (action.endsWith("Creep")) {
      // special case (boostCreep/recycleCreep/renewCreep): reverse target
      // TODO handle when creep is carrying mineral
      this.transfer(target, RESOURCE_ENERGY);
      return target[action](this);
    }
    if (action === "drop") {
      // special case (drop): no target param
      return this[action](resource.resourceType, resource.amount);
    }
    const errMsg = this[action](
      target,
      resource.resourceType /* , resource.amount */,
    ); // FIXME resource.amount is the target's amout not the amount creep can carry
    if (
      (action === "repair" || action === "heal") &&
      target.hits >= target.hitsMax
    ) {
      // special case (repair/heal): prevent overflow
      return ERR_FULL;
    }
    if (action === "upgradeController") {
      const l = target.link;
      if (l) {
        if (
          !this.carry.energy &&
          ERR_NOT_IN_RANGE === this.withdraw(l, RESOURCE_ENERGY)
        ) {
          return this.moveTo(l);
        }
        if (this.carry.energy >= this.carryCapacity && l.progressTotal) {
          this.build(l);
        }
      }
      return errMsg;
    }
    if (action === "harvest") {
      // special case (harvest): build local container
      const {container, link, mineralType} = target;
      if (
        mineralType &&
        utils.calcBodyEffectiveness(
          this.body,
          WORK,
          "harvest",
          HARVEST_MINERAL_POWER,
        ) +
          _.sum(this.carry) >
          this.carryCapacity
      ) {
        // harvest mineral
        return this.transfer(c, mineralType);
      }
      // TODO handle all action
      if (link && this.carry.energy >= this.carryCapacity) {
        this.transfer(link, RESOURCE_ENERGY);
      }
      if (
        container &&
        !this.pos.isEqualToPos(container.pos) &&
        ERR_NO_PATH ===
          this.moveTo(container.pos, {
            range: 0,
          })
      ) {
        this.transfer(container, RESOURCE_ENERGY);
      }
      if (!this.memory.urgent && this.carry.energy >= this.carryCapacity) {
        if (this.room.rcl) {
          if (
            this.build(link) &&
            container &&
            container.hitsMax - container.hits >
              utils.calcBodyEffectiveness(
                this.body,
                WORK,
                "repair",
                REPAIR_POWER,
              )
          ) {
            this.repair(container);
          }
        } else {
          this.build(container);
        }
      }
    }
    return errMsg;
  }
};
