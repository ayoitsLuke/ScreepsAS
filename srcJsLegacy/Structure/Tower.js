StructureTower.prototype.work = function() {
  if (this.room.memory.defcon < 5 && this.pos.findInRange(FIND_HOSTILE_CREEPS, 20)
    .length) {
    const isolated = this.room.find(FIND_HOSTILE_CREEPS, {
      filter: c => c.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
        .reduce((hCount, c) => hCount + c.getActiveBodyparts(HEAL), 0) < 25
    }); // FIXME make better approximation
    if (this.attack(isolated) === OK) return;
    if (OK === this.attack(this.room.find(FIND_HOSTILE_CREEPS, {
        filter: c => c.getActiveBodyparts(HEAL)
      })[0])) return;
    if (OK === this.attack(this.room.find(FIND_HOSTILE_CREEPS, {
        filter: c => c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK)
      })[0])) return;
  }
  this.heal(this.room.find(FIND_MY_CREEPS, {
    filter: c => c.hits < c.hitsMax,
    random: true
  })[0]);
  if (this.energy > this.energyCapacity / Math.sqrt(this.room.memory.defcon) && !this.room.find(FIND_MY_CREEPS, {
      filter: c => c.memory.role === "repairer"
    })
    .length) {
    this.repair(this.room.find(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax - 800 && s.hits < 250000,
      cache: true,
      min: s => s && s.hits
    })[0]);
  }
};
