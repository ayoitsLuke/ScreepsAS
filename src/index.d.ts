// `global` extension
declare namespace NodeJS {
  interface Global {
    DEBUG: boolean;
    SCRIPT_VERSION: number;
    TIMER: { [name: string]: number };
    creeps?: { [name: string]: {} };
    flags?: { [name: string]: {} };
    powerCreeps?: { [name: string]: {} };
    rooms?: { [name: string]: {} };
    spawns?: { [name: string]: {} };
  }
}

interface Memory {
  lastGC: number;
}

interface CreepMemory {
  task?: Task;
  home: Room;
}

interface RoomMemory {
  type: string;
  lastUpdate: number;
}

interface Task {
  action: string;
  target: {
    id: number;
    pos: {
      x: number;
      y: number;
      roomName: string;
    };
  };
}
// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  role: string;
  room: string;
  working: boolean;
}

interface Memory {
  SCRIPT_VERSION: any;
  roomObjects: any;
  uuid: number;
  log: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
