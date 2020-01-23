import {ErrorMapper} from "utils/ErrorMapper";

// initial Memory
console.log(`\n\n#####Global Reset#####`);
require("version");
if (!Memory.SCRIPT_VERSION) Memory.SCRIPT_VERSION = global.SCRIPT_VERSION;
if (!Memory.rooms) Memory.rooms = {};
if (!Memory.creeps) Memory.creeps = {};
if (!Memory.roomObjects) Memory.roomObjects = {};

import "./lib/index";
import "./preload/index";

/** @var profiler  modules that you use that modify the game 's prototypes should be required before you require the profiler. */
// global.Profiler = Profiler.init();

/** Main loop */
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`\n#####Tick: ${Game.time}#####`);
  if ((Memory.lastGC || 0) < Game.time - global.TIMER.gc) {
    Memory.lastGC = Game.time;
    garbageCollection();
  }
  // if (Memory.SCRIPT_VERSION !== SCRIPT_VERSION) return respawn();
  const creepsByHome = _.groupBy(Game.creeps, "home.name");
  Object.values(Game.rooms).forEach(room => {
    room.assignTasks(creepsByHome);
    room.work();
  }); // ? do I need a RoomManager
  try {
    Object.values(Game.creeps).forEach(creep => {
      creep.work();
    });
    Market.work();
  } catch (e) {
    console.log(e);
  }
});
/**
 * Delete non-existing entities in memory
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
      if (Game.rooms(Memory.roomObjects[id].pos.roomName)) {
        // remove non-existing room objects in room with vision
        Memory.roomObjects[id] = undefined;
      }
      if (
        (Memory.roomObjects[id].taskSent || 0) <
        Game.time - CREEP_LIFE_TIME
      ) {
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
