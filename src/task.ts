/**
 * Create a new task for structure/creep communication
 */
class Task {
  processedBy?: Id<Creep>; // The id of the creep which works on current task
  creepType?: string; // The creep type. eg. hauler, worker, etc.
  action: ActionConstant;
  resource: {type: ResourceConstant; amount?: number};
  target: {id?: Id<RoomObject>; pos: RoomPosition};
  constructor(
    action: ActionConstant,
    target: {
      id?: Id<RoomObject>;
      pos: RoomPosition;
    },
    resource: {type: ResourceConstant; amount?: number},
  ) {
    this.action = action;
    this.target = target;
    this.resource = resource;
  }
}
