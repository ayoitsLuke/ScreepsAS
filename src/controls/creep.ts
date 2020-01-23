/**
 * Creep recieve a task form its home room and do that task
 *
 * @param   {Creep}  creep  [creep description]
 */
function creepWork(creep: Creep) {
  if (DEBUG) console.log("[Creep]", creep.type, creep.name.slice(-3), "@", JSON.stringify(creep.pos));
  if (DEBUG && _.sum(creep.carry) > 0) console.log("carrying :", Object.keys(creep.carry));
  // look for task
  if (!creep.memory.task) {
    creep.memory.task = creep.getTask(); // FIXME seems like there's some task leak
  }
  let task = creep.memory.task;
  // do task
  if (task) {
    const errMsg = creep.doTask(task);
    creep.say(errMsg + task.action);
    if (DEBUG) console.log(task.action + ":", errMsg);
    switch (errMsg) {
      case OK:
        if (!task.processing) {
          task.processing = true;
          RoomObject.active(task.target).memory.taskSent = undefined;
        }
      case ERR_BUSY:
      case ERR_NOT_IN_RANGE:
      case ERR_TIRED:
        break;
      default:
        // ! TODO handle dead creep (by accident or by age)
        const target = RoomObject.active(task.target);
        task = undefined;
        try {
          if (target instanceof RoomObject) {
            target.memory.taskSent = undefined;
          } else {
            Memory.roomObjects[task.target.id].taskSent = undefined;
          }
        } catch (e) {}
        break;
    }
  }
}
