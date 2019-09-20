"use strict";
global.DEBUG = true;

global.sign = ["Make sign, not war", "Make love, not sign", "This is a sign", "This is/was my room", "Shouldn't you be working instead of playing this game?", "Still coding after work? Get a life", "What if we're the invaders?", 'So we massacre them, rob their resources, and call them "Invader"?', "Roses are red, violets are blue. My code is bad, yours better?", "Sign this, sign that, like the kiddo in the White House", "You just wasted 1 sec of your life reading this sign", "NO U wU", "Are you master of your creeps, or slave of this game?", "Playing this game === life--", "This game runs on Javascript? Ewww", "Debug your brain first, then your code", "The bug is in your brain, not your code","The owner of this room is too lazy to change his sign", ];

global.MY_USERNAME = Object.values(Game.rooms)
  .find(r => r.controller && r.controller.my)
  .controller.owner.username;
// General energy-per-tick (EPT) goal to aim for
global.SOURCE_GOAL_OWNED = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
global.SOURCE_GOAL_NEUTRAL = SOURCE_ENERGY_NEUTRAL_CAPACITY / ENERGY_REGEN_TIME;
global.SOURCE_GOAL_KEEPER = SOURCE_ENERGY_KEEPER_CAPACITY / ENERGY_REGEN_TIME;
// Optimal number of parts per source (but 1 to 3 more can lower cpu at a minor increase in creep cost)
global.SOURCE_HARVEST_PARTS = SOURCE_ENERGY_CAPACITY / HARVEST_POWER / ENERGY_REGEN_TIME;
global.SOURCE_HARVEST_PARTS_NEUTRAL = SOURCE_ENERGY_NEUTRAL_CAPACITY / HARVEST_POWER / ENERGY_REGEN_TIME;
global.SOURCE_HARVEST_PARTS_KEEPER = SOURCE_ENERGY_KEEPER_CAPACITY / HARVEST_POWER / ENERGY_REGEN_TIME;
// Timers
global.TIMER = {
  defconDowngrade: 50,
  gc: CREEP_LIFE_TIME,
  intel: POWER_BANK_DECAY / 2,
  productivity: 150,
  randomness: 0.05,
  scan: 10,
};
global.ROOM_EXPAND_FACTOR = [0, 1, 1, 1, 2, 2, 3, 4, 5];
global.MILITARY_ALPHABET = {
  A: "ALPHA",
  B: "BRAVO",
  C: "CHARLIE",
  D: "DELTA",
  E: "ECHO",
  F: "FOXTROT",
  G: "GOLF",
  H: "HOTEL",
  I: "INDIA",
  J: "JULIET",
  K: "KILO",
  L: "LIMA",
  M: "MIKE",
  N: "NOVEMBER",
  O: "OSCAR",
  P: "PAPA",
  Q: "QUEBEC",
  R: "ROMEO",
  S: "SIERRA",
  T: "TANGO",
  U: "UNIFORM",
  V: "VICTOR",
  W: "WHISKEY",
  X: "X-RAY",
  Y: "YANKEE",
  Z: "ZULU",
};
//
global.STRUCTURE_FULL_THRESHOLD = 0.9;
global.STRUCTURE_EMPTY_THRESHOLD = 1 - global.STRUCTURE_FULL_THRESHOLD;
//
global.CREEP_TASK2SAY = {
  build: "\u{1F6A7}",
  explore: "\u{1F30F}",
  harvest: "\u{26CF}",
  pickup: "\u{1F69A}",
  recharge: "\u{26A1}",
  recycle: "\u{267B}",
  refill: "\u{1F4E5}",
  renew: "\u{1F195}",
  repair: "\u{1F6E0}",
  upgrade: "\u{23EB}",
}
// Creep Task to Action
global.CREEP_TASK2ACTION = {
  build: "build",
  harvest: "harvest",
  pickup: "pickup",
  recharge: "withdraw",
  recycle: "recycleCreep",
  refill: "transfer",
  renew: "renewCreep",
  repair: "repair",
  upgrade: "upgradeController",
};
/**
 * enthalpy = final energy level - initial energy level
 */
global.CREEP_ACTION = {
  attack: {
    range: 1,
    enthalpy: 0,
    part: ATTACK,
  },
  attackController: {
    range: 1,
    enthalpy: 0,
    part: CLAIM,
  },
  build: {
    range: 3,
    enthalpy: -BUILD_POWER,
    part: WORK,
  },
  claimController: {
    range: 1,
    enthalpy: 0,
    part: CLAIM,
  },
  dismantle: {
    range: 1,
    enthalpy: DISMANTLE_POWER * DISMANTLE_COST,
    part: WORK,
  },
  drop: {
    range: 0,
    enthalpy: -1,
    part: CARRY,
  },
  generateSafeMode: {
    range: 1,
    enthalpy: 0,
    part: CARRY,
  },
  harvest: {
    range: 1,
    enthalpy: HARVEST_POWER,
    part: WORK,
  },
  heal: {
    range: 1,
    enthalpy: 0,
    part: HEAL,
  },
  moveTo: {
    range: 0,
    enthalpy: 0,
    part: MOVE,
  },
  pickup: {
    range: 1,
    enthalpy: 1,
    part: CARRY,
  },
  pull: {
    range: 1,
    enthalpy: 0,
    part: MOVE,
  },
  rangedAttack: {
    range: 3,
    enthalpy: 0,
    part: RANGED_ATTACK,
  },
  rangedHeal: {
    range: 3,
    enthalpy: 0,
    part: HEAL,
  },
  rangedMassAttack: {
    range: 3,
    enthalpy: 0,
    part: RANGED_ATTACK,
  },
  repair: {
    range: 3,
    enthalpy: -REPAIR_POWER * REPAIR_COST,
    part: WORK,
  },
  reserveController: {
    range: 1,
    enthalpy: 0,
    part: CLAIM,
  },
  signController: {
    range: 1,
    enthalpy: 0,
    part: /\w*/,
  },
  transfer: {
    range: 1,
    enthalpy: -1,
    part: CARRY,
  },
  upgradeController: {
    range: 3,
    enthalpy: -UPGRADE_CONTROLLER_POWER,
    part: WORK,
  },
  withdraw: {
    range: 1,
    enthalpy: 1,
    part: CARRY,
  },
  boostCreep: {
    range: 1,
    enthalpy: 0,
    part: /\w*/,
  },
  recycleCreep: {
    range: 1,
    enthalpy: 0,
    part: /\w*/,
  },
  renewCreep: {
    range: 1,
    enthalpy: 0,
    part: /\w*/,
  },
};
/**
 * The energy needed for spawning the given body
 * @deprecated
 * @global
 * @method CREEP_PARTS_COST
 * @param  {string[]} body An array describing creep's body
 * @see https://docs.screeps.com/api/#StructureSpawn.spawnCreep
 */
global.CREEP_PARTS_COST = (body) => _.sum(body, p => BODYPART_COST[p.part || p]);
/**
 * The build time of the given creep body
 *
 * @global
 * @method CREEP_PARTS_COST
 * @param  {string[]} body An array describing creep's body
 * @see https://docs.screeps.com/api/#StructureSpawn.spawnCreep
 */
global.CREEP_SPAWN_TIME = (creep) => CREEP_SPAWN_TIME * (creep.length || creep.body.length);
