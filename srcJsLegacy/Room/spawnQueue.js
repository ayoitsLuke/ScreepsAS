"use strict";
Room.prototype.getMilitaryQueue = function(defcon) {
  defcon = defcon || this.memory.defcon;
};
/**
 * [setSpawnQueue description]
 *
 * @param   {[type]}  tasks   [tasks description]
 * @param   {[type]}  creeps  [creeps description]
 *
 * @return  {[type]}          [return description]
 */
Room.prototype.getCivilianQueue = function(tasks, creeps) {
  tasks = tasks || this.home.memory.tasks;
  creeps = creeps || Object.values(Game.creeps)
    .filter(c => c.home.name === this.name);

  let re = [];
  Object.keys(tasks)
    .forEach(t => re.push({
      type: t
    }))

  return re;
  // normal spawns
  // ! TODO come up with a proper spawning system & handle speicial case where all creep die but queue full
  /*
  this.memory.creepCount = {constructor: 2, logistian: 3, etc...}
  if (task(older than 25 ticks).creepType.length) memory[creepType]++
  if (creep.idle || natural decade ? ) memory[creepType]--
  if (current creep count < memory) spawn more
  */

  /** @var {Object} idle  @example {"Constructor_s_hc": 3, "logistian": 2, etc...} */
  const idle = _.countBy(creeps, ({
    task,
    type
  }) => {
    if (!task) return type;
  })


  const cutoff = Game.time // - TIMER.scan;
  /** @const {Object} needed @example {"Constructor_s_hc": 1, "logistian": 3, etc...} */
  const needed = _.countBy(tasks, ({
    time,
    creepType
  }) => {
    if (time < cutoff) return creepType;
  });

  console.log("creep i/n", JSON.stringify(idle), JSON.stringify(needed));
  // TODO save creep counts to room.memory.creepCount & output spawn by comparing these two

  let creepCount = this.memory.creepCount || {};
  for (const t in idle) {
    if (creepCount[t] === undefined || creepCount[t] < 0) creepCount[t] = 0;
    if (idle[t] > 1) {
      creepCount[t]--;
    }
  }
  for (const t in needed) {
    if (creepCount[t] === undefined || creepCount[t] < 0) creepCount[t] = 0;
    if (needed[t] > 1) {
      creepCount[t]++;
    }
  }
  this.memory.creepCount = creepCount;

  let returnValue = [];
  Object.keys(needed)
    .forEach(type => {
      if ((needed[type]) && type !== "undefined" && creeps.reduce((t, c) => t + (c.type === type), 0) < 5) {
        returnValue.push({
          type
        });
      }
    });
  return returnValue.sort((a, b) => b.type.includes("s") ? -1 : 0);


  /*
  const sourcesCount = this.find(FIND_SOURCES)
    .length;
  // Scavenger
  const carryPartsNeeded = _.sum(this.find(FIND_DROPPED_RESOURCES), r => ~~(r.amount / 50)); // how many CARRY part needed to pick up all drpped resource
  const maxCarryEachCreep = this.find(FIND_MY_SPAWNS, {
      cache: "deep"
    })[0].getBodyFor("scavenger", false)
    .reduce((carryCount, p) => carryCount + (p === CARRY), 0); //the max amount of CARRY one scavenger can have.
  let scavengerNeeded = ~~(carryPartsNeeded / maxCarryEachCreep);
  if (scavengerNeeded > 2 * sourcesCount) scavengerNeeded = 2 * sourcesCount + 1;
  // Harvester
  let workCount = 0;
  if (creepsByRole["staticHarvester"]) creepsByRole["staticHarvester"].forEach(c => workCount += c.getActiveBodyparts(WORK));
  const totalWorkParts = creepsByRole["staticHarvester"] ? creepsByRole["staticHarvester"].reduce((carryCount, c) => carryCount + c.getActiveBodyparts(WORK), 0) : 0;

  // Upgrader

  // Builder

  // Repairer
  */

};

/**
 * A standard fireteam (2 rifleman, 2 medic) and one extra role
 *
 * @param   {string}  role
 * @return  {Object[]}
 */
function fireTeam(role) {
  let draft = role ? [{
    role
  }] : [];
  draft.push({
    role: "Rifleman"
  }, {
    role: "Medic"
  }, {
    role: "Rifleman"
  }, {
    role: "Medic"
  });
  return draft;
}
/**
 * 2 fireTeam w / shield total of 10 creeps
 *
 * @param {Object[]} number
 * @return {Object[]}
 */
function squad(number) {
  return [...fireTeam("shield"), ...fireTeam("shield")]
}
/**
 * TODO
 * 1 full squad + combat engineer.
 *
 * @param   {[type]}  number  [number description]
 * @return  {[type]}          [return description]
 */
function platoon(number) { // 1 full squad + combat engineer.
  this.memory.spawnQueue = [];
}
