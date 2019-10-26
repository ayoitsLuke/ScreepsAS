"use strict";
/**
 * Create a list of tasks by checking each structures & constructure sites {@link src/RoomObject/Structure/structure.js}
 *
 * @param  {Object[]}  homeTasks current task, repeat push task prevention
 * @return  {Object[]}  A list of tasks
 */
const utils = require("lib_EngineUtils");
Room.prototype.gatherRequests = function(homeTasks) {
  let tasks = [];
  // find tombstone
  this.find(FIND_TOMBSTONES)
    .forEach(tombstone => {
      // TODO remove tasks in tombstone
      if (tombstone.memory.taskSent) return;
      Object.keys(tombstone.store)
        .forEach(r => tasks.push({
          action: "withdraw",
          target: tombstone.simplify,
          resource: {
            resourceType: r,
            amount: tombstone.store[r],
          },
          target: tombstone.simplify,
          urgent: true,
        }));
      tombstone.memory.taskSent = Game.time;
    });

  // Find dropped resources
  this.find(FIND_DROPPED_RESOURCES)
    .forEach(resource => {
      if (resource.memory.taskSent /* || resource.amount < 50 */ ) return;
      tasks.push({
        action: "pickup",
        resource: {
          resourceType: resource.resourceType,
          amount: r.amount
        },
        target: resource.simplify,
        urgent: true,
      });
      resource.memory.taskSent = Game.time;
    });

  // Find each structures & generate a "transfer" request
  this.find(FIND_STRUCTURES) // FIXME task leak
    .forEach(structure => {

      if (structure.memory.taskSent) return;
      const request = structure.generateRequests();
      if (request.length) {
        tasks.push(...request);
        structure.memory.taskSent = Game.time;
      }
    });

  // Find each sources & generate a "harvest" request
  this.find(FIND_SOURCES_ACTIVE)
    .forEach(source => {

      if (source.memory.taskSent) return;
      const creeps = source.pos.findInRange(FIND_MY_CREEPS, 1);
      // const creepCount = creeps.length;
      // const workCount = creeps.reduce((t, c) => t + c.getActiveBodyparts(WORK), 0);
      if (creeps.length < source.freeSpace && creeps.reduce((t, c) => t + utils.calcBodyEffectiveness(c.body, WORK, "harvest", HARVEST_POWER), 0) < source.energy / (source.ticksToRegeneration || ENERGY_REGEN_TIME)) { // FIXME use util.calcEffectiveness here
        tasks.push({
          action: "harvest",
          resource: {
            resourceType: RESOURCE_ENERGY,
            // amount: s.energy
          },
          target: source.simplify,
          time: Game.time,
          urgent: (this.rcl && !creeps.length)
        });
        source.memory.taskSent = Game.time;
      }
    });

  //Find each construction site & generate a "build" request
  if (this.home.rcl > 1) {
    this.find(FIND_MY_CONSTRUCTION_SITES)
      .forEach(site => {
        if (site.memory.taskSent) return;
        tasks.push({
          action: "build",
          resource: {
            resourceType: RESOURCE_ENERGY,
            // amount: site.progressTotal - site.progress
          },
          target: site.simplify,
          time: Game.time,
          urgent: [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER].some(c => c === site.structureType)
        });
        site.memory.taskSent = Game.time;
      });
  }

  for (let t of tasks) {
    if (!t.creepType) t.creepType = this.home.task2CreepType(t);
  }

  return tasks;
};
/**
 *
 *
 * @return  {[type]}  [return description]
 */
function selfDestruct() {
  if (!this.find(FIND_MY_SPAWNS)
    .length) {
    Memory.BURN = this.name + Game.time;
    this.terminal.destroy();
    this.storage.destroy();
    this.find(FIND_MY_CREEPS)
      .forEach(c => c.say("Congrates! U win!"))
  }
}
