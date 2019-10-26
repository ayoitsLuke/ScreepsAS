import { ErrorMapper } from "./utils/ErrorMapper";
import { Utils } from "./utils/loadPrototype";

// initial Memory
console.log("\n\n####Global Reset####");
require("version");
if (!Memory.SCRIPT_VERSION) Memory.SCRIPT_VERSION = global.SCRIPT_VERSION;
if (!Memory.rooms) Memory.rooms = {};
if (!Memory.creeps) Memory.creeps = {};
if (!Memory.roomObjects) Memory.roomObjects = {};

import "./lib/index";
import "./prototype/index";

/** @var profiler  modules that you use that modify the game 's prototypes should be required before you require the profiler. */
// global.Profiler = Profiler.init();

/** Main loop */
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`\n####Tick: ${Game.time}####`);
  if ((Memory.lastGC || 0) < Game.time - global.TIMER.gc) {
    Memory.lastGC = Game.time;
    garbageCollection();
  }
  // if (Memory.SCRIPT_VERSION !== SCRIPT_VERSION) return respawn();
  const creepsByHome = _.groupBy(Game.creeps, "home.name");
  Object.values(Game.creeps).forEach(creep => {
    try {
      creep.work();
    } catch (e) {
      console.log(e);
    }
  });
  Object.values(Game.rooms).forEach(room => {
    room.assignTasks();
    room.work();
  }); // ? do I need a RoomManager
  Market.run();
});

/**
 * TODO
 * Check market order, check terminal/storage/lab status, & trading
 *
 * @return  {[type]}  [return description]
 */
function market() {
  const orders = Game.market.getAllOrders();
}
/**
 * Creep recieve a task form its home room and do that task
 *
 * @param   {Creep}  creep  [creep description]
 */
function creepWork(creep: Creep) {
  if (DEBUG) console.log("[Creep]", creep.type, creep.name.slice(-3), "@", JSON.stringify(creep.pos));
  if (DEBUG && _.sum(creep.carry) > 0) console.log("carrying :", Object.keys(creep.carry));
  // look for task
  if (!creep.memory.task) {
    creep.memory.task = creep.getTask(); // FIXME seems like there's some task leak
  }
  let task = creep.memory.task;
  // do task
  if (task) {
    const errMsg = creep.doTask(task);
    creep.say(errMsg + task.action);
    if (DEBUG) console.log(task.action + ":", errMsg);
    switch (errMsg) {
      case OK:
        if (!task.processing) {
          task.processing = true;
          RoomObject.active(task.target).memory.taskSent = undefined;
        }
      case ERR_BUSY:
      case ERR_NOT_IN_RANGE:
      case ERR_TIRED:
        break;
      default:
        // ! TODO handle dead creep (by accident or by age)
        const target = RoomObject.active(task.target);
        task = undefined;
        try {
          if (target instanceof RoomObject) {
            target.memory.taskSent = undefined;
          } else {
            Memory.roomObjects[task.target.id].taskSent = undefined;
          }
        } catch (e) {}
        break;
    }
  }
}
/**
 * Delete non-existing entitires in memory
 */
function garbageCollection() {
  console.log("Garbage Collecting");
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      Memory.creeps[name] = undefined;
      console.log("Clearing non-existing creep memory: ", name);
    }
  }
  for (const id in Memory.roomObjects) {
    if (!Game.getObjectById(id)) {
      if (Game.rooms(_.get(Memory.roomObjects[id], "pos.roomName"))) {
        // remove non-existing room objects in room with vision
        Memory.roomObjects[id] = undefined;
      }
      if ((Memory.roomObjects[id].taskSent || 0) < Game.time - CREEP_LIFE_TIME) {
        // remove old task in each room
        Memory.roomObjects[id].taskSent = undefined;
      }
      console.log("Clearing non-existing room object memory: ", id);
    }
  }
  for (const name in Memory.rooms) {
    if (Game.rooms[name] === undefined) {
      // RoomManager.expireRoom(name);
    }
  }
  for (const name in Game.structures) {
    if (Game.structures[name].memory.taskSent === true) {
    }
  }
}
