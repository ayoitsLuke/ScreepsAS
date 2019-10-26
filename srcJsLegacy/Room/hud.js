"use strict";
const renderIntelMap = require("lib_RenderIntelMap_RenderIntelMap");

Room.prototype.hud = function(room, creeps) {
  try {
    // Top Left
    this.visual.text("Room: " + this.name + " \n Spawn queue: " + this.memory.spawnQueue.map(o => o.type), 0, 0, {
      align: "left",
      opacity: 0.5
    });
    this.visual.text("Room task: " + this.memory.tasks.map(t => t.action), 0, 1, {
      align: "left",
      opacity: 0.5
    });
    this.visual.text("RCL: " + this.controller.level + " \n Progress: " + ~~(100 * this.controller.progress / this.controller.progressTotal) + "%", 0, 2, {
      align: "left",
      opacity: 0.5
    })
    this.visual.text("energy/tick: " + ~~this.productionPerTick + " \n productivity: " + ~~(100 * this.productivity) + "% \n DEFCON: " + this.memory.defcon, 0, 3, {
      align: "left",
      opacity: 0.5,
      color: renderIntelMap.hsv2rgb(120 * this.productivity, 1, 1)
    });
    this.visual.text("refillSpeed" + this.refillSpeed, 0, 4, {
      align: "left",
      opacity: 0.5
    });
    // Should remove this to save CPU
    let i = 5;
    for (let creep in creeps) {
      this.visual.text(creep + ": ", 0, i++, {
        align: "left",
        opacity: 0.5
      });
    }
    // Top right
    const allCreepsByRole = _.groupBy(Game.creeps, 'memory.role');
    this.visual.text("-Total creeps count:", 49, 0, {
      align: "right",
      opacity: 0.5
    })
    let j = 1;
    for (let creep in allCreepsByRole) {
      new RoomVisual(this.name)
        .text(creep + ": " + allCreepsByRole[creep].length, 49, j++, {
          align: "right",
          opacity: 0.5
        });
    }
    // On each source
    let sources = this.find(FIND_SOURCES);
    for (let source of sources) {
      this.visual.text(~~source.productionPerTick + " energy/tick " + ~~(100 * source.productivity) + "% ", source.pos, {
        align: "left",
        color: renderIntelMap.hsv2rgb(Math.min(120, 120 * source.productivity), 1, 1),
        opacity: 0.5
      });
    }
  } catch (e) {
    console.log("[HUD]", e)
  }
}
