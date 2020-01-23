interface RoomMemory {
  intel: {
    avoid?: boolean;
    tracks: {[key: string]: RoomPosition[]};
    intelExpirationTime: number;
    owner: {username: string; level: number};
    sources: Source[];
    mineral: Mineral[];
    structures: BuildableStructureConstant[];
  };
}
