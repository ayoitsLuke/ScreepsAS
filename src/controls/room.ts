/**
 * [roomWork description]
 *
 * @param   {Room}  room  [room description]
 * @param   {Creep[]}  [creeps]  all the creeps belong to this room
 */
Room.prototype.work = function(creeps: Creep[]): void {
  const room: Room = this;
  creeps =
    creeps ||
    Object.values(Game.creeps).filter(c => c.home.name === room.home.name);
  room.find(FIND_TOMBSTONES).forEach(t => {
    const task = t.creep.memory.task;
    if (!task) return;
    const target = Game.getObjectById(task.target?.id);
    if (target) {
      target.memory.taskSent = undefined;
    } else {
      Memory.roomObjects[target.id].taskSent = undefined;
    }
  });
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
      if (room.updateDefcon().level < room.home.memory.defcon.level) {
        room.home.memory.defcon = room.memory.defcon;
      }
      // Get tasks from structures, sources, mineral
      if (room.type !== "hostile") {
        if (!room.home.memory.tasks) room.home.memory.tasks = {};
        let newTasks = room.gatherRequests(room.home.memory.tasks);
        if (DEBUG) console.log("newRequests", JSON.stringify(newTasks));
        const tasksGroup = _.groupBy(newTasks, t => t.creepType);
        for (const creepType in tasksGroup) {
          if (DEBUG)
            console.log(
              "tasksGroup",
              creepType,
              JSON.stringify(_.countBy(tasksGroup[creepType], t => t.action)),
            );
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
            room.memory.spawnQueue.push(
              ...room.getCivilianQueue(room.memory.tasks, creeps),
            );
          }
        }
        if (DEBUG)
          console.log(
            "spawnQueue: ",
            room.memory.spawnQueue.map(q => q.type),
          );
      }
    }
  }
  _.invoke(room.find(FIND_MY_STRUCTURES), "work");
  // visualize
  room.hud(room, creeps);
};
