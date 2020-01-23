import { RoomExtend } from "../preload/Room";
class spawnControl extends Room {
  getCivilianQueue(tasks: Task[], creeps?: Creep[]) {
    tasks = tasks || this.home.memory.tasks;
    creeps = creeps || Object.values(Game.creeps).filter(c => c.home.name === this.name);
    let re = [];
    Object.keys(tasks).forEach(t =>
      re.push({
        type: t,
      }),
    );
    return re;
    // normal spawns
    // ! TODO come up with a proper spawning system & handle speicial case where all creep die but queue full
    /*
    this.memory.creepCount = {constructor: 2, logistian: 3, etc...}
    if (task(older than 25 ticks).creepType.length) memory[creepType]++
    if (creep.idle || natural decade ? ) memory[creepType]--
    if (current creep count < memory) spawn more
    */
  }
}
/**
 * A standard fireteam (2 rifleman, 2 medic) and one extra role
 *
 * @param   {string}  role
 * @return  {Object[]}
 */
function fireTeam(role) {
  let draft = role
    ? [
        {
          role,
        },
      ]
    : [];
  draft.push(
    {
      role: "Rifleman",
    },
    {
      role: "Medic",
    },
    {
      role: "Rifleman",
    },
    {
      role: "Medic",
    },
  );
  return draft;
}
/**
 * 2 fireTeam w / shield total of 10 creeps
 *
 * @param {Object[]} number
 * @return {Object[]}
 */
function squad(number) {
  return [...fireTeam("shield"), ...fireTeam("shield")];
}
/**
 * TODO
 * 1 full squad + combat engineer.
 *
 * @param   {[type]}  number  [number description]
 * @return  {[type]}          [return description]
 */
function platoon(number) {
  this.memory.spawnQueue = [];
}
