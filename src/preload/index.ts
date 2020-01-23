/* export all files
https://stackoverflow.com/questions/44594082/const script-can-i-import-a-folder-without-having-to-write-an-index-ts-file?noredirect=1&lq=1
*/
import {Helper} from "utils/Tools";
import {RoomExtend} from "./Room";
import {CreepExtend} from "./Creep";
import {SourceExtend} from "./Source";
import {MineralExtend} from "./Mineral";
import {RoomPositionExtend} from "./RoomPosition";
export function preload() {
  const ROLE_LOGISTICIAN = "civ_m_c";
  const ROLE_CONSTRUCTOR_STA_lowCAP = "civ_w";
  const ROLE_CONSTRUCTOR_STA_highCAP = "civ_w_c";
  const ROLE_CONSTRUCTOR_MOB_lowCAP = "civ_m_c";
  const ROLE_CONSTRUCTOR_MOB_highCAP = "civ_m_w_c";
  const ROLE_SCIENTIST = "civ_c";
  const ROLE_RESERVER = "civ_m_C";
  const ROLE_HAULER = "civ_m";
  const ROLE_MILITIA = "civ_m_a_ra";
  const ROLE_RIFLEMAN = "mil_m_a";
  const ROLE_MEDIC = "mil_m_h";
  const ROLE_SNIPER = "mil_m_ra";
  const ROLE_SUPPLIER = "mil_h";
  const ROLE_COMBAT_ENGINEER = "mil_m_w";
  const ROLE_stub = "";
  Helper.define(Creep, CreepExtend);
  Helper.define(Room, RoomExtend);
  Helper.define(Source, SourceExtend);
  Helper.define(Mineral, MineralExtend);
  Helper.define(RoomPosition, RoomPositionExtend);
}
