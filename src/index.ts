import {type} from "os";

// `global` extension
declare namespace NodeJS {
  interface Global {
    roomObjects: {[id: string]: number};
    DEBUG: boolean;
    SCRIPT_VERSION: number;
    TIMER: {[key: string]: number};
    creeps?: {[name: string]: any[]};
    flags?: {[name: string]: any[]};
    powerCreeps?: {[name: string]: any[]};
    rooms?: {[roomName: string]: any[]};
    spawns?: {[name: string]: any[]};
    log: any;
    _: any;
  }
}
interface Creep {
  work: void;
  pulled: boolean;
}
interface Room {
  global: {[key: string]: any};
  home: Room;
  type: string;
  work: void;
}

interface RoomObject {
  active: RoomObject | {id: Id<RoomObject>; pos: RoomPosition};
  id: Id<RoomObject>;
  room: Room;
  home: Room;
  memory: {[key: string]: any};
  global: {[key: string]: any};
  simplify: {
    id?: Id<RoomObject>;
    pos: RoomPosition;
    resourceType?: ResourceConstant;
    structureType?: StructureConstant;
  };
}

interface Task {
  action: ActionConstant;
  target: {
    id?: Id<RoomObject>;
    pos: RoomPosition;
  };
  resource: {type: ResourceConstant; amount?: number};
  status: {creationTime: number; creepId: Id<Creep>};
}

// memory extension
interface CreepMemory {
  task?: Task;
  _pulled: boolean;
  pullerRequested: number;
  home: Room;
  role: string;
  room: string;
  working: boolean;
}

interface RoomMemory {
  /**  */
  defcon: {level: 1 | 2 | 3 | 4 | 5; issuedTime: number};
  intel: any; // see src/lib/RenderIntelMap
  homeName: string;
  distanceToHome: number;
  type: string;
  tasks?: Task[];
}

interface Memory {
  lastGC: number;
  SCRIPT_VERSION: any;
  roomObjects: any;
  id: number;
  log: any;
}

//Constants
type ActionConstant =
  | ACTION_ATTACK
  | ACTION_ATTACKCONTROLLER
  | ACTION_BUILD
  | ACTION_CLAIMCONTROLLER
  | ACTION_DISMANTLE
  | ACTION_DROP
  | ACTION_GENERATESAFEMODE
  | ACTION_HARVEST
  | ACTION_HEAL
  | ACTION_MOVE
  | ACTION_MOVETO
  | ACTION_PICKUP
  | ACTION_PULL
  | ACTION_RANGEDATTACK
  | ACTION_RANGEDHEAL
  | ACTION_RANGEDMASSATTACK
  | ACTION_REPAIR
  | ACTION_RESERVECONTROLLER
  | ACTION_RESERVECONTROLLER
  | ACTION_SIGNCONTROLLER
  | ACTION_SUICIDE
  | ACTION_TRANSFER
  | ACTION_UPDRADECONTROLLER
  | ACTION_WITHDRAW
  | ACTION_BOOSTCREEP
  | ACTION_UNBOOSTCREEP
  | ACTION_RECYCLECREEP
  | ACTION_RENEWCREEP;

type ACTION_ATTACK = "attack";
type ACTION_ATTACKCONTROLLER = "attackController";
type ACTION_BUILD = "build";
type ACTION_CLAIMCONTROLLER = "claimController";
type ACTION_DISMANTLE = "dismantle";
type ACTION_DROP = "drop";
type ACTION_GENERATESAFEMODE = "generateSafeMode";
type ACTION_HARVEST = "harvest";
type ACTION_HEAL = "heal";
type ACTION_MOVE = "move";
type ACTION_MOVEBYPATH = "moveByPath";
type ACTION_MOVETO = "moveTo";
type ACTION_NOTIFYWHENATTACKED = "notifyWhenAttacked";
type ACTION_PICKUP = "pickup";
type ACTION_PULL = "pull";
type ACTION_RANGEDATTACK = "rangedAttack";
type ACTION_RANGEDHEAL = "rangedHeal";
type ACTION_RANGEDMASSATTACK = "rangedMassAttack";
type ACTION_REPAIR = "repair";
type ACTION_RESERVECONTROLLER = "reserveController";
type ACTION_SAY = "say";
type ACTION_SIGNCONTROLLER = "signController";
type ACTION_SUICIDE = "suicide";
type ACTION_TRANSFER = "transfer";
type ACTION_UPDRADECONTROLLER = "upgradeController";
type ACTION_WITHDRAW = "withdraw";
type ACTION_BOOSTCREEP = "boostCreep";
type ACTION_UNBOOSTCREEP = "unboostCreep";
type ACTION_RECYCLECREEP = "recycleCreep";
type ACTION_RENEWCREEP = "renewCreep";

// Creep roles
type CreepRole = CREEP_CIVILIAN | CREEP_MILITARY;

type CREEP_CIVILIAN =
  | ROLE_LOGISTICIAN
  | ROLE_CONSTRUCTOR_STA_lowCAP
  | ROLE_CONSTRUCTOR_STA_highCAP
  | ROLE_CONSTRUCTOR_MOB_lowCAP
  | ROLE_CONSTRUCTOR_MOB_highCAP
  | ROLE_SCIENTIST
  | ROLE_RESERVER
  | ROLE_HAULER
  | ROLE_MILITIA;
type CREEP_MILITARY =
  | ROLE_RIFLEMAN
  | ROLE_MEDIC
  | ROLE_SNIPER
  | ROLE_SUPPLIER
  | ROLE_COMBAT_ENGINEER;

type ROLE_LOGISTICIAN = "civ_m_c";
type ROLE_CONSTRUCTOR_STA_lowCAP = "civ_w";
type ROLE_CONSTRUCTOR_STA_highCAP = "civ_w_c";
type ROLE_CONSTRUCTOR_MOB_lowCAP = "civ_m_c";
type ROLE_CONSTRUCTOR_MOB_highCAP = "civ_m_w_c";
type ROLE_SCIENTIST = "civ_c";
type ROLE_RESERVER = "civ_m_C";
type ROLE_HAULER = "civ_m";
type ROLE_MILITIA = "civ_m_a_ra";

type ROLE_RIFLEMAN = "mil_m_a";
type ROLE_MEDIC = "mil_m_h";
type ROLE_SNIPER = "mil_m_ra";
type ROLE_SUPPLIER = "mil_h";
type ROLE_COMBAT_ENGINEER = "mil_m_w";
type ROLE_stub = "";
