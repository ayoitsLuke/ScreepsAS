"use strict";
const utils = require("lib_EngineUtils");
/**
 * Check spawnQueue and spawn creeps
 *
 * @method
 * @return {[type]} [description]
 */
StructureSpawn.prototype.work = function() {
  if (this.spawning) {
    this.room.visual.text("\u{1F423}" + this.spawning.name.slice(0, this.spawning.name.indexOf(/\s/)), this.pos.x + 1, this.pos.y, {
      align: "left",
      opacity: 0.5,
    });
    return;
  }
  // NOTE: Room.memory.spawnQueue is an Object[]. eg. [{type: "Constructor_s_hc", target: {some target}}, {}, {}]
  const egg = this.room.memory.spawnQueue[0];
  if (!egg) return;
  const body = this.getBodyFor(egg.type, egg.urgent);
  const type = egg.type;
  if (!egg.type.length || (!body[0] && !egg.urgent)) {
    this.room.memory.spawnQueue.shift();
    console.log("[" + this.name + "] skipped " + egg);
    return;
  }
  const name = type + Game.shard.name.replace("shard", "\n") + Object.keys(Game.spawns)
    .indexOf(this.name) + this.room.name + Game.time % CREEP_LIFE_TIME;
  const memory = {
    ...egg,
    pob: this.room.name
  };
  const energyStructures = [...this.room.extensions, ...this.room.spawns];
  const errMsg = this.spawnCreep(body, name, {
    energyStructures,
    memory,
  });
  if (errMsg === OK) {
    this.room.memory.spawnQueue.shift();
    this.room.energyAvailable -= body.reduce((t, p) => t + BODYPART_COST[p], 0);
  }
}

/**
 * [description]
 *
 * @param  {string} type The type of the spawining creep
 * @param  {boolean} [urgent=false] Return body parts based on, if true, energy currently stored, otherwise max capacity
 *
 * @return {string[]} An array describing the new creep�??s body
 */
StructureSpawn.prototype.getBodyFor = function(type, urgent) {
  //use BODYPART_COST
  let budget = urgent ? this.room.energyAvailable > SPAWN_ENERGY_CAPACITY ? this.room.energyAvailable : SPAWN_ENERGY_CAPACITY : this.room.energyCapacityAvailable;
  const [base, dlc] = components4(type);
  return fullBodyFrom(utils.calcCreepCost(base) > budget ? [CARRY, WORK, MOVE] : base, dlc, budget);
};
/**
 * TODO
 * Generate two basic components of a creep as [base, dlc]
 *
 * @param   {string}  type  the type name of a creep
 * @return  {string[]}  [base, dlc]
 */
function components4(type) {
  let base, dlc;
  switch (type) {
    /**
     * "Constructor" = creep has a lot of WORK
     * "s" = creep CANNOT move 1 tile/ tick on road when empty
     * "c" = high capacity
     */
    // Civilian
    case "Constructor_s": // Constructor (stationary, low capacity)
      // ! Need hauler
      base = [CARRY, MOVE];
      dlc = [WORK];
      break;
    case "Constructor_s_c": // Constructor (stationary, high capacity)
      // ! Need hauler
      base = [CARRY, CARRY, WORK, WORK, MOVE];
      dlc = [CARRY, WORK, WORK];
      break;
    case "Constructor": // Constructor (mobile, low capacity)
      // harvester, high RCL upgrader (RCL >= 5)
      base = [CARRY, WORK, MOVE];
      dlc = [WORK, WORK, MOVE];
      break;
    case "Constructor_c": // Constructor (mobile, high capacity)
      // ? maybe this is not effecient? pair a stationary constructor and logistician might be better?
      // repairer, builder, low RCL upgrader
      base = dlc = [CARRY, CARRY, WORK, WORK, MOVE];
      break;
    case "Logistician_c":
      base = [CARRY, WORK, MOVE];
      dlc = [CARRY, CARRY, MOVE];
      break;
      // High RCL creep
    case "Creep_of_Science":
      base = [CARRY, WORK, MOVE];
      dlc = [CARRY];
      break;
    case "Reserver":
      base = dlc = [CLAIM, CLAIM, MOVE]; // 1250 energy
      break;
    case "Hauler": // find creep need help (creep.memory.haulRequested) & pull
      base = dlc = [MOVE];
      break;
    case "Defender":
      base = [HEAL, ATTACK, MOVE];
      dlc = [ATTACK, RANGED_ATTACK, MOVE];
      break;

      // Military
    case "Rifleman":
      base = [RANGED_ATTACK, MOVE, HEAL, MOVE];
      dlc = [ATTACK, MOVE]; // 190 energy
      break;
    case "Medic":
      base = [RANGED_ATTACK, MOVE]; // 200 energy
      dlc = [HEAL, MOVE]; // 300 energy
      break;
      // Specialist
    case "Sniper":
      base = [HEAL, MOVE];
      dlc = [RANGED_ATTACK, MOVE];
    case "Distractor_s":
      // ! Need hauler
      base = [RANGED_ATTACK, MOVE];
      dlc = [TOUGH, HEAL];
      break;
    case "Combat_Engineer":
      base = [HEAL, MOVE]; // 200 energy
      dlc = [WORK, MOVE]; // 210 energy
      break;
    default:
      base = dlc = [CARRY, WORK, MOVE];
      break;
  }
  return [base, dlc];
};
/**
 * Assemble two components into a full body parts base on budget
 *
 * @param  {string[]}  base    The base array, only show once in the full body parts
 * @param  {string[]}  dlc     The dlc array, will be repeat as much as possible
 * @param  {number}    [budget=300]  The upper energy limit to spend of this creep
 * @return {string[]}          An array of all body part based on the given parts
 */
function fullBodyFrom(base, dlc, budget = 300) {
  let parts = [];
  const baseCost = utils.calcCreepCost(base)
  const dlcCost = utils.calcCreepCost(dlc);
  if (baseCost > budget) return [];
  //console.log("base=" + base + " dlc=" + dlc)
  //console.log("budget=" + budget + " baseCost=" + baseCost + " dlcCost=" + dlcCost);
  let dlcCount = ~~Math.min((MAX_CREEP_SIZE - base.length) / dlc.length, (budget - baseCost) / dlcCost);
  //console.log(dlcCount);
  while (dlcCount--) {
    parts.push(...dlc);
  }
  parts.push(...base);

  // sort
  const order = [TOUGH, CARRY, CLAIM, WORK, ATTACK, RANGED_ATTACK, HEAL, MOVE];

  // TODO preformance test
  let partsHolder = parts.map(e => order.indexOf(e));
  partsHolder.sort((a, b) => a - b);
  return partsHolder.map(e => order[e]);

  return parts.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}
