import { RoomObjectExtend } from "./RoomObject";
export class MineralExtend extends Mineral {
  _productionPerTick: number | undefined;

  global = RoomObjectExtend.global;
  get freeSpace(): number {
    global;
    if (!this.global.freeSpace) {
      if (!this.memory.freeSpace) {
        let freeSpace = 0;
        const roomTerrain = Game.map.getRoomTerrain(this.room.name);
        [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
          [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
            if (roomTerrain.get(x, y) !== TERRAIN_MASK_WALL) freeSpace++;
          }, this);
        }, this);
        this.memory.freeSpace = freeSpace;
      }
      this.global.freeSpace = this.memory.freeSpace;
    }
    return this.global.freeSpace;
  }

  get productionPerTick(): number {
    if (!this.global.productionPerTick) {
      this._productionPerTick =
        (this.density - this.mineralAmount) / (MINERAL_REGEN_TIME - (this.ticksToRegeneration | 0));
    }
    return this.global.productionPerTick;
  }

  get productivity(): number {
    // enumerable: false,

    if (!this.global.productivity) {
      this.global.productivity = this.productionPerTick / (this.density / MINERAL_REGEN_TIME);
    }
    return this.global.productivity;
  }
  get container(): StructureContainer {
    if (!this.global.container) {
      const container =
        this.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: s => s.structureType === STRUCTURE_CONTAINER,
        })[0] ||
        this.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
          filter: c => c.structureType === STRUCTURE_CONTAINER,
        })[0];
      if (container) {
        this.global.container = container.simplify;
      } else {
        const pos = this.pos.findPathTo(this.home.controller, {
          range: 3,
          ignoreCreeps: true,
          ignoreDestructibleStructures: true,
          ignoreRoads: true,
        })[0];
        if (pos) this.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
        return;
      }
    }
    return RoomObject.active(this.global.container);
  }

  get warehouse(): StructureContainer {
    return this.container;
  }
}
