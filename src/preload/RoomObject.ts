import { RoomPositionExtend } from "./RoomPosition";
export abstract class RoomObjectExtend extends RoomObject {
  /**
   * [description]
   *
   * @return  {RoomObject|Object}  [return description]
   */
  public static active = ({ id, pos }: { id?: string; pos: {x:number,y:number,roomName:string} }): RoomObject | { id?: string; pos: RoomPosition } =>
    Game.getObjectById(id) || { id, pos: RoomPositionExtend.fromObject(pos) };

  get memory(): Object {
    const id =
    if (!this.id) throw new Error("Object ID not existed");
    if (!Memory.roomObjects) {
      Memory.roomObjects = {};
    }
    if (!Memory.roomObjects[this.id]) {
      Memory.roomObjects[this.id] = {};
    }
    return Memory.roomObjects[this.id];
  }

  get global(): Object {
    if (!global.roomObjects) {
      global.roomObjects = {};
    }
    return global.roomObjects[this.id];
  }

  /**
   * Assign which OWNED room it belongs to
   * @example remote source/container
   * @return {Room} the home room this object belong to
   */
  get home(): Room {
    return this.room.home;
  }

  /**
   * Prepare an RoomObject by simplify it to {id, pos}
   * @return  {Object}  A simplified object
   */
  get simplify(): Object {
    return (({ id, pos, resourceType, structureType }) => ({
      id,
      pos,
      resourceType,
      structureType,
    }))(this);
  }
}
