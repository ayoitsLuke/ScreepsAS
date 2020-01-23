export abstract class Map {
  /**
   *
   *
   * @static
   * @param {string} roomName
   * @returns {{ x: any; y: any }}
   * @memberof Map
   */
  public static roomNameToXY(roomName: string): [any, any] {
    const chars = roomName.toUpperCase().split(/(\d+)/); // "W99N99" -> ["W", "99", "N", "99", ""]
    return [chars[0] === "W" ? -chars[1] - 1 : chars[1], chars[2] === "N" ? -chars[3] - 1 : chars[3]];
  }

  /**
   *
   *
   * @static
   * @memberof Map
   */
  public static roomNameFromXY = (x: number, y: number): string =>
    "" + (x < 0 ? "W" + (-x - 1) : "E" + x) + (y < 0 ? "N" + (-y - 1) : "S" + y);
}
