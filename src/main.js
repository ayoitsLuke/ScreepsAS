"use strict";
// initial Memroy
console.log("\n\n-----Global Reset-----");
require("version");
if (!Memory.SCRIPT_VERSION) Memory.SCRIPT_VERSION = global.SCRIPT_VERSION;
if (!Memory.rooms) Memory.rooms = {};
if (!Memory.creeps) Memory.creeps = {};
if (!Memory.roomObjects) Memory.roomObjects = {};
require("require")

/** @var profiler  modules that you use that modify the game 's prototypes should be require"d before you require the profiler. */
const profiler = require("lib_Profiler");
profiler.enable();

/** Main loop */
exports.loop = () => {
  profiler.wrap(() => {
    console.log("\n-----Tick:" + Game.time + "-----");

    if ((Memory.lastGC || 0) < Game.time - TIMER.gc) {
      Memory.lastGC = Game.time;
      garbageCollection();
    };
    // if (Memory.SCRIPT_VERSION !== SCRIPT_VERSION) return respawn();
    const creepsByHome = _.groupBy(Game.creeps, "home.name");

    Object.values(Game.rooms)
      .forEach(room => roomWork(room, creepsByHome[room.name])); // ? do I need a RoomManager

    Object.values(Game.creeps)
      .forEach(creep => {
        // try {
        creepWork(creep);
        // } catch (e) {
        //   console.log(e)
        // }
      });
    market();
    console.log("CPU used: " + Game.cpu.getUsed() + " In-game time: " + Game.time);
    if ((Memory.lastGC || 0) < Game.time - TIMER.gc) {
      Memory.lastGC = Game.time;
      garbageCollection();
    };


    /**
     * [roomWork description]
     *
     * @param   {Room}  room  [room description]
     * @param   {Creep[]}  [creeps]  all the creeps belong to this room
     */
    function roomWork(room, creeps) {
      creeps = creeps || Object.values(Game.creeps)
        .filter(c => c.home.name === room.home.name);


      room.find(FIND_TOMBSTONES)
        .forEach(t => {
          const task = t.creep.memory.task;
          if (!task) return;
          const target = Game.getObjectById(_.get(task, "target.id"));
          if (target) {
            target.memory.taskSent = undefined;
          } else {
            Memory.roomObjects[target.id].taskSent = undefined;
          }
        })


      if (DEBUG) console.log("[Room]", room.name);

      if (room.memory.type === "archive") return room.archive(); // TODO

      if (!room.memory.lastUpdate) room.memory.lastUpdate = {};

      // layout planning
      if (!room.memory.lastUpdate.init && room.type === "my") {
        room.memory.lastUpdate.init = Game.time;
        room.init();
      }

      // update intel
      if (DEBUG || (room.memory.lastUpdate.intel || 0) < Game.time - TIMER.intel) {
        room.memory.lastUpdate.intel = Game.time;
        room.intel();
      }

      // scan room
      if (DEBUG || (room.memory.lastUpdate.scan || 0) < Game.time - TIMER.scan) {
        room.memory.lastUpdate.scan = Game.time;

        // only scan room within expansion factor
        if (room.home.distance < ROOM_EXPAND_FACTOR[room.home.rcl]) {

          /*
          if (!room.home.memory.nearbySources) room.home.memory.nearbySources = [];
          room.find(FIND_SOURCES)
            .forEach(source => {
              if (!room.home.memory.nearbySources.some(ns => ns.id === source.id)) room.home.memory.nearbySources.push(source.simplify);
            });
          */

          // check defcon & warn home room if needed
          if (room.updateDefcon()
            .level < room.home.memory.defcon.level) {
            room.home.memory.defcon = room.memory.defcon;
          };



          // Get tasks from structures, sources, mineral
          if (room.type !== "hostile") {

            if (!room.home.memory.tasks) room.home.memory.tasks = {};

            let newTasks = room.gatherRequests(room.home.memory.tasks);
            if (DEBUG) console.log('newRequests', JSON.stringify(newTasks));

            const tasksGroup = _.groupBy(newTasks, t => t.creepType);
            for (const creepType in tasksGroup) {
              if (DEBUG) console.log("tasksGroup", creepType, JSON.stringify(_.countBy(tasksGroup[creepType], t => t.action)));
              if (!room.home.memory.tasks[creepType]) {
                room.home.memory.tasks[creepType] = [];
              }
              room.home.memory.tasks[creepType].push(...tasksGroup[creepType]);
            }

          }

          // ? TODO use room to assign task so creeps don't need to iterate task multiple time.


          // set spawn Queue
          if (room.spawns.length) {
            if (!room.memory.spawnQueue) room.memory.spawnQueue = [];


            const nextCreep = room.memory.spawnQueue[0];
            if (nextCreep) {
              // emergency spawns
              if (!creeps.some(c => c.type === nextCreep.creepType)) {
                nextCreep.urgent = true;
              }
            } else {
              if (room.memory.defcon.level < 4) {
                // room.memory.spawnQueue.unshift(...room.getMilitaryQueue(room.memory.defcon))
              } else {
                // TODO restructure, output {logisitan: -1, constructor_s_hc: 0, etc}
                room.memory.spawnQueue.push(...room.getCivilianQueue(room.memory.tasks, creeps));
              }
            }
            if (DEBUG) console.log("spawnQueue: ", room.memory.spawnQueue.map(q => q.type));
          }
        }
      }
      _.invoke(room.find(FIND_MY_STRUCTURES), "work");

      // visualize
      room.hud(room, creeps);
    }

    /**
     * Creep recieve a task form its home room and do that task
     *
     * @param   {Creep}  creep  [creep description]
     */
    function creepWork(creep) {
      if (DEBUG) console.log("[Creep]", creep.type, creep.name.slice(-3), "@", JSON.stringify(creep.pos));
      if (DEBUG && _.sum(creep.carry) > 0) console.log('carrying :', Object.keys(creep.carry));


      // look for task
      if (!creep.memory.task) {
        creep.memory.task = creep.getTask(); // FIXME seems like there's some task leak
      }

      let task = creep.memory.task;

      // do task
      if (task) {
        const errMsg = creep.doTask(task);
        creep.say(errMsg + task.action);
        if (DEBUG) console.log(task.action + ":", errMsg)
        switch (errMsg) {
          case OK:
            if (!task.processing) {
              task.processing = true;
              RoomObject.active(task.target)
                .memory.taskSent = undefined;
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
     * TODO
     * Check market order, check terminal/storage/lab status, & trading
     *
     * @return  {[type]}  [return description]
     */
    function market() {
      const orders = Game.market.getAllOrders();

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
        if (Game.structures[name].memory.taskSent === true) {}
      }
    }
  });
}

/* SAMPLE CODE
require("room");
require("room.commands");
require("room.properties.misc");
require("room.properties.creeps");
require("room.properties.structures");
require("room.task.process");
require("room.visual");
require("link");
require("terminal");
require("spawn");
require("spawn.strategy.body");
require("spawn.strategy.creep");
require("creep");
require("creep.role");


const market = require("market");
const utils = require("utils");
const profiler = require("profiler");

if (!Memory.intel) Memory.intel = {};
if (!Memory.stats) Memory.stats = {};
if (!Memory.stats.history) Memory.stats.history = [];
if (!Memory.market) Memory.market = {};
if (!Memory.market.sellPriceLimits) Memory.market.sellPriceLimits = {};
if (!Memory.market.buyPriceLimits) Memory.market.buyPriceLimits = {};
if (!Memory.glob) Memory.glob = {};

console.log("Reloaded");
profiler.enable();
module.exports.loop = () => {
    profiler.wrap(() => {
        utils.gc();
        utils.init();
        Object.values(Game.rooms).forEach(room => room.work());
        Object.values(Game.spawns).forEach(spawn => spawn.work());
        Object.values(Game.creeps).forEach(creep => creep.work());
        market.checkOrders();
        utils.status();
    });
}
*/
