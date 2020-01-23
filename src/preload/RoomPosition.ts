import {Map} from "preload/Map";
export abstract class RoomPositionExtend extends RoomPosition {
  /**
   * [fromObject description]
   * @param   {Object}
   * @return  {RoomPosition}  [return description]
   */
  public static fromObject = ({
    x,
    y,
    roomName,
  }: {
    x: number;
    y: number;
    roomName: string;
  }): RoomPosition => new RoomPosition(x, y, roomName);
  public isEqualToXY(x: number, y: number): boolean {
    return x === this.x && y === this.y;
  }
  public isEqualToPos(obj: any): boolean {
    return (
      obj.x === this.x && obj.y === this.y && obj.roomName === this.roomName
    );
  }
  public isEqualToRoomObject(obj: any): boolean {
    return (
      obj.pos.x == this.x &&
      obj.pos.y == this.y &&
      obj.pos.roomName == this.roomName
    );
  }
  public inRangeToXY(x: number, y: number, range: number): boolean {
    return (
      (x - this.x < 0 ? this.x - x : x - this.x) <= range &&
      (y - this.y < 0 ? this.y - y : y - this.y) <= range
    );
  }
  public inRangeToPos(obj: any, range: number): boolean {
    return (
      (obj.x - this.x < 0 ? this.x - obj.x : obj.x - this.x) <= range &&
      (obj.y - this.y < 0 ? this.y - obj.y : obj.y - this.y) <= range &&
      obj.roomName === this.roomName
    );
  }
  public inRangeToRoomObject(obj: any, range: number): boolean {
    return (
      (obj.pos.x - this.x < 0 ? this.x - obj.pos.x : obj.pos.x - this.x) <=
        range &&
      (obj.pos.y - this.y < 0 ? this.y - obj.pos.y : obj.pos.y - this.y) <=
        range &&
      obj.pos.roomName === this.roomName
    );
  }
  public isNearToXY(x: number, y: number): boolean {
    return (
      (x - this.x < 0 ? this.x - x : x - this.x) <= 1 &&
      (y - this.y < 0 ? this.y - y : y - this.y) <= 1
    );
  }
  public isNearToPos(obj: any): boolean {
    return (
      (obj.x - this.x < 0 ? this.x - obj.x : obj.x - this.x) <= 1 &&
      (obj.y - this.y < 0 ? this.y - obj.y : obj.y - this.y) <= 1 &&
      obj.roomName === this.roomName
    );
  }
  public isNearToRoomObject(obj: any): boolean {
    return (
      (obj.pos.x - this.x < 0 ? this.x - obj.pos.x : obj.pos.x - this.x) <= 1 &&
      (obj.pos.y - this.y < 0 ? this.y - obj.pos.y : obj.pos.y - this.y) <= 1 &&
      obj.pos.roomName === this.roomName
    );
  }

  /**
   * [getTaxicabDistance description]
   *
   * @param   {{pos:{x,y,roomName}}|RoomPosition|number}  firstArg  [firstArg description]
   * @param   {number}  [secondArg]  [secondArg description]
   *
   * @return  {number}  The number of square to the given position in [taxicab metric]{@link http://mathworld.wolfram.com/TaxicabMetric.html}
   */
  public getTaxicabDistanceTo(firstArg: any, secondArg?: any): number {
    if (firstArg.pos) firstArg = firstArg.pos;
    if (!Number.isNaN(firstArg) || firstArg.roomName === this.roomName) {
      return Math.abs(this.x - firstArg + this.y - secondArg);
    } else {
      const [xO, yO] = Map.roomNameToXY(this.roomName);
      const [xD, yD] = Map.roomNameToXY(firstArg.roomName);
      const dx = 50 * (xD - xO) + firstArg.x - this.x;
      const dy = 50 * (yD - yO) + firstArg.y - this.y;
      return Math.abs(dx) + Math.abs(dy);
    }
  }

  /**
   * [getRangeTo description]
   * @override
   * @see     https://docs.screeps.com/api/#RoomPosition.getRangeTo
   * @param   {RoomObject|RoomPosition|number}  firstArg
   * @param   {number}  [secondArg]  [secondArg description]
   *
   * @return  {number}             [return description]
   */
  public getRangeTo(firstArg: any, secondArg?: any): number {
    if (firstArg.pos) firstArg = firstArg.pos;
    if (!Number.isNaN(firstArg) || firstArg.roomName === this.roomName) {
      return Math.max(
        Math.abs(this.x - firstArg),
        Math.abs(this.y - secondArg),
      );
    } else {
      const [xO, yO] = Map.roomNameToXY(this.roomName);
      const [xD, yD] = Map.roomNameToXY(firstArg.roomName);
      const dx = 50 * (xD - xO) + firstArg.x - this.x;
      const dy = 50 * (yD - yO) + firstArg.y - this.y;
      return Math.max(Math.abs(dx), Math.abs(dy));
    }
  }
}
