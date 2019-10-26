"use strict";
Object.defineProperties(Mineral.prototype, {
    freeSpace: {
        // enumerable: false,
        configurable: true,
        get: function () {
            if (!this.global.freeSpace) {
                if (!this.memory.freeSpace) {
                    let freeSpace = 0;
                    const roomTerrain = Game.map.getRoomTerrain(this.room.name);
                    [this.pos.x - 1, this.pos.x, this.pos.x + 1].forEach(x => {
                        [this.pos.y - 1, this.pos.y, this.pos.y + 1].forEach(y => {
                            if (roomTerrain.get(x, y) !== TERRAIN_MASK_WALL)
                                freeSpace++;
                        }, this);
                    }, this);
                    this.memory.freeSpace = freeSpace;
                }
                this.global.freeSpace = this.memory.freeSpace;
            }
            return this.global.freeSpace;
        }
    },
    productionPerTick: {
        // enumerable: false,
        configurable: true,
        get: function () {
            if (!this.global.productionPerTick) {
                this._productionPerTick = (this.density - this.mineralAmount) / (MINERAL_REGEN_TIME - (this.ticksToRegeneration ? this.ticksToRegeneration : 0));
            }
            return this.global.productionPerTick;
        }
    },
    productivity: {
        // enumerable: false,
        configurable: true,
        get: function () {
            if (!this.global.productivity) {
                this.global.productivity = this.productionPerTick / (this.density / MINERAL_REGEN_TIME);
            }
            return this.global.productivity;
        }
    },
    container: {
        configurable: true,
        get: function () {
            if (!this.global.container) {
                const container = this.pos.findInRange(FIND_STRUCTURES, 1, {
                    filter: s => s.structureType === STRUCTURE_CONTAINER
                })[0] || this.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                    filter: c => c.structureType === STRUCTURE_CONTAINER
                })[0];
                if (container) {
                    this.global.container = container.simplify;
                }
                else {
                    const pos = this.pos.findPathTo(this.home.controller, {
                        range: 3,
                        ignoreCreeps: true,
                        ignoreDestructibleStructures: true,
                        ignoreRoads: true
                    })[0];
                    if (pos)
                        this.room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                    return;
                }
            }
            return RoomObject.active(this.global.container);
        }
    },
    warehouse: {
        configurable: true,
        get: function () {
            return this.container;
            const link = this.link;
            const container = this.container;
            return (link instanceof Structure && link.energy < link.energyCapacity) ? link : (container instanceof Structure) ? container : undefined;
        }
    }
});
