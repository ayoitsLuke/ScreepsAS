import {Helper} from "../utils/Tools";
export class CreepExtend extends Creep {
  doTask(task = this.memory.task): ScreepsReturnCode {
    if (!task) return ERR_INVALID_ARGS;
    const {action, target, resource} = task;
    // request hauler if this creep is immobile
    if (
      this.memory.task &&
      !this.memory.pullerRequested &&
      Helper.calcBodyEffectiveness(this.body, MOVE, "fatigue", 1) * 5 <
        this.body.length
    ) {
      // ! TODO set up a speed property for creep
      this.home.memory.tasks.push({
        action: "pull",
        creepType: "Hauler",
        resource: {},
        target: this.simplify,
      });
      this.memory.pullerRequested = Game.time;
    }
    if (DEBUG)
      console.log(
        "doTask :",
        action,
        resource ? resource.type : undefined,
        JSON.stringify(target.pos),
      );
    return action && target
      ? this.go_(action, target, resource)
      : ERR_INVALID_ARGS;
  }
  /**
   * [description]
   *
   * @param   {string}  action  Any [Creep.action()]{@link https://docs.screeps.com/api/#Creep} method
   * @param   {RoomObject||Object}  target  Any object formatted as {id: {string}, pos: {x: {number}, y:{number}, roomName: {string}}}
   * @param   {Object}  [resource={}]
   * @param   {RESOURCE_*}  [resource.resourceType=Object.keys(this.carry)[0]]  When using "withdraw", "transfer", or "drop", use this to specify the resource
   * @param   {number}  [resource.amount]
   * @return  {ERR_*}  [description]
   */
  go_(
    action: ActionConstant,
    target = this,
    resource = {
      resourceType: _.findLastKey(this.carry),
    },
  ): ScreepsReturnCode {
    // block other action if being pulled
    if (this.memory._pulled) {
      this.memory._pulled = false;
      return ERR_TIRED;
    }
    target = RoomObject.active(target);
    const range = CREEP_ACTION[action].range;
    if (this.pos.roomName === target.pos.roomName && !target.room) {
      return ERR_INVALID_TARGET;
    }
    if (!this.pos.inRangeToPos(target.pos, range)) {
      // move to target if not in range
      return (
        this.moveTo(target.pos, {
          range,
          visualizePathStyle: {
            stroke: RES_COLORS[_.findKey(this.carry, (k: number) => k > 0)],
          },
        }) || ERR_NOT_IN_RANGE
      );
    } else {
      // preform action if in range
      if (action === "pull") {
        // special case (pull): addition action
        const targetTask = target.memory.task;
        if (!targetTask) return ERR_INVALID_ARGS;
        target.pulled = true;
        target.cancelOrder(MOVE);
        target.move(this);
        const targetActionRange = CREEP_ACTION[targetTask.action].range;
        return this.pos.inRangeToRoomObject(
          targetTask.target,
          targetActionRange,
        )
          ? ERR_NO_PATH
          : this.moveTo(
              RoomObject.active(targetTask.target),
              targetActionRange,
            ) || ERR_NOT_IN_RANGE;
      }
      if (action.endsWith("Creep")) {
        // special case (boostCreep/recycleCreep/renewCreep): reverse target
        // TODO handle when creep is carrying mineral
        this.transfer(target, RESOURCE_ENERGY);
        return target[action](this);
      }
      if (action === "drop") {
        // special case (drop): no target param
        return this[action](resource.resourceType, resource.amount);
      }
      const errMsg = this[action](
        target,
        resource.resourceType /* , resource.amount */,
      ); // FIXME resource.amount is the target's amout not the amount creep can carry
      if (
        (action === "repair" || action === "heal") &&
        target.hits >= target.hitsMax
      ) {
        // special case (repair/heal): prevent overflow
        return ERR_FULL;
      }
      if (action === "upgradeController") {
        const l = target.link;
        if (l) {
          if (
            !this.carry.energy &&
            ERR_NOT_IN_RANGE === this.withdraw(l, RESOURCE_ENERGY)
          ) {
            return this.moveTo(l);
          }
          if (this.carry.energy >= this.carryCapacity && l.progressTotal) {
            this.build(l);
          }
        }
        return errMsg;
      }
      if (action === "harvest") {
        // special case (harvest): build local container
        const {container, link, mineralType} = target;
        if (
          mineralType &&
          Helper.calcBodyEffectiveness(
            this.body,
            WORK,
            "harvest",
            HARVEST_MINERAL_POWER,
          ) +
            _.sum(this.carry) >
            this.carryCapacity
        ) {
          // harvest mineral
          return this.transfer(c, mineralType);
        }
        // TODO handle all action
        if (link && this.carry.energy >= this.carryCapacity) {
          this.transfer(link, RESOURCE_ENERGY);
        }
        if (
          container &&
          !this.pos.isEqualToPos(container.pos) &&
          ERR_NO_PATH ===
            this.moveTo(container.pos, {
              range: 0,
            })
        ) {
          this.transfer(container, RESOURCE_ENERGY);
        }
        if (!this.memory.urgent && this.carry.energy >= this.carryCapacity) {
          if (this.room.rcl) {
            if (
              this.build(link) &&
              container &&
              container.hitsMax - container.hits >
                Helper.calcBodyEffectiveness(
                  this.body,
                  WORK,
                  "repair",
                  REPAIR_POWER,
                )
            ) {
              this.repair(container);
            }
          } else {
            this.build(container);
          }
        }
      }
      return errMsg;
    }
  }
}
