"use strict";
StructureLink.prototype.work = function (avgEnergy) {
    if (this.belonging === "source" && this.energy >= this.energyCapacity) {
        let anotherLink = this.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LINK && s.belonging !== "source" && s.energy < s.energyCapacity * (1 - LINK_LOSS_RATIO),
            min: s => s.energy,
            claim: true
        })[0];
        this.transferEnergy(anotherLink);
    }
};
