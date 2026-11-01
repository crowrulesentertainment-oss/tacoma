import "dotenv/config";
import OBSWebSocket from "obs-websocket-js";

const EDGE_URL = process.env.OBS_CONTROL_URL || "https://cevylpnoexugwgygvtgu.supabase.co/functions/v1/tacoma-obs-control";
const BRIDGE_TOKEN = process.env.OBS_BRIDGE_TOKEN || "";
const OBS_WS_URL = process.env.OBS_WS_URL || "ws://127.0.0.1:4455";
const OBS_WS_PASSWORD = process.env.OBS_WS_PASSWORD || "";
const DEVICE_NAME = process.env.OBS_DEVICE_NAME || "OBS Production PC";
const POLL_MS = Math.max(700, Number(process.env.POLL_INTERVAL_MS || 1200));
const approvedScenes = new Set([
  "01 OPENING","02 MAIN STUDIO","03 TWO HOSTS","04 REMOTE HOST","05 REMOTE INTERVIEW",
  "06 COMMUNITY SPOTLIGHT","07 TACOMA SHOWCASE","08 FULL SCREEN VIDEO","09 PERFORMANCE",
  "10 COMMUNITY MESSAGES","11 HOURLY UPDATE","12 COUNTDOWN","13 WELCOME 2027",
  "14 OVERNIGHT LOOP","15 NEW YEAR MORNING","16 EMERGENCY HOLD","17 AUDIO ONLY HOLD","18 CLOSING"
]);
const obs = new OBSWebSocket();
let connected = false;
let version = {};
let lastError = "";
let lastSceneList = [];

function sleep(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }
function validateConfig(){
  if(!BRIDGE_TOKEN || BRIDGE_TOKEN.length < 30) throw new Error("Set OBS_BRIDGE_TOKEN in this computer's .env file.");
  if(!OBS_WS_PASSWORD) throw new Error("Set OBS_WS_PASSWORD in this computer's .env file.");
  const u = new URL(OBS_WS_URL);
  if(u.protocol !== "ws:" || !["127.0.0.1","localhost","[::1]","::1"].includes(u.hostname))
    throw new Error("Security check: OBS_WS_URL must use ws://127.0.0.1:4455 (loopback only).");
}
async function obsConnect(){
  if(connected) return;
  await obs.connect(OBS_WS_URL, OBS_WS_PASSWORD);
  connected = true;
  version = await obs.call("GetVersion");
  lastError = "";
  console.log(`[OBS] Connected: ${version.obsVersion} / obs-websocket ${version.obsWebSocketVersion}`);
}
async function getTelemetry(){
  if(!connected) return {lastError:lastError||"OBS is not connected."};
  try{
    const [scene,stream,record,stats,scenes] = await Promise.all([
      obs.call("GetCurrentProgramScene"),
      obs.call("GetStreamStatus"),
      obs.call("GetRecordStatus"),
      obs.call("GetStats"),
      obs.call("GetSceneList")
    ]);
    lastSceneList = (scenes.scenes||[]).map(s=>s.sceneName);
    return {
      obsVersion:version.obsVersion||"",
      websocketVersion:version.obsWebSocketVersion||"",
      currentScene:scene.currentProgramSceneName||"",
      streaming:!!stream.outputActive,
      recording:!!record.outputActive,
      activeFps:Number(stats.activeFps||0),
      cpuUsage:Number(stats.cpuUsage||0),
      memoryUsage:Number(stats.memoryUsage||0),
      renderSkippedFrames:Number(stats.renderSkippedFrames||0),
      outputSkippedFrames:Number(stats.outputSkippedFrames||stream.outputSkippedFrames||0),
      outputCongestion:Number(stream.outputCongestion||0),
      streamReconnecting:!!stream.outputReconnecting,
      lastError:""
    };
  }catch(error){
    lastError=error.message||String(error);
    try{await obs.disconnect();}catch{}
    connected=false;
    return {lastError};
  }
}
async function api(body){
  const response=await fetch(EDGE_URL,{
    method:"POST",
    headers:{"content-type":"application/json","x-bridge-token":BRIDGE_TOKEN},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(12000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.error) throw new Error(data.error||`Control service returned HTTP ${response.status}`);
  return data;
}
async function runCommand(command){
  if(!command?.id) return;
  let status="succeeded", message="Acknowledged.";
  try{
    if(command.command_type==="scene.switch"){
      const name=String(command.payload?.sceneName||"");
      if(!approvedScenes.has(name)) throw new Error("Rejected: scene is not in the local allowlist.");
      if(!lastSceneList.includes(name)) throw new Error(`Scene is not present in this OBS collection: ${name}`);
      await obs.call("SetCurrentProgramScene",{sceneName:name});
      message=`Program scene changed to ${name}`;
      console.log("[PRODUCER] "+message);
    }else if(command.command_type==="host.cue"){
      const cue=String(command.payload?.cue||"");
      const host=String(command.payload?.hostName||"");
      message=`Host cue recorded: ${cue}${host?" · "+host:""} (producer coordination only)`;
      console.log("[HOST CUE] "+message);
    }else{
      throw new Error("Unsupported command type.");
    }
  }catch(error){
    status="failed";
    message=error.message||String(error);
    console.error("[COMMAND FAILED]",message);
  }
  try{ await api({action:"bridge_ack",commandId:command.id,status,message}); }
  catch(error){ console.error("[ACK ERROR]",error.message); }
}
async function main(){
  validateConfig();
  console.log("CrowRules Tacoma OBS Bridge");
  console.log("OBS endpoint:",OBS_WS_URL);
  console.log("Device:",DEVICE_NAME);
  console.log("The OBS WebSocket is restricted to this computer. Press Ctrl+C to stop.");
  while(true){
    try{
      if(!connected) await obsConnect();
      const telemetry=await getTelemetry();
      const result=await api({action:"bridge_poll",telemetry});
      if(result.command) await runCommand(result.command);
    }catch(error){
      lastError=error.message||String(error);
      console.error("[BRIDGE]",lastError);
      if(connected){ try{await obs.disconnect();}catch{} connected=false; }
    }
    await sleep(POLL_MS);
  }
}
process.on("SIGINT",async()=>{console.log("\nStopping bridge…");try{await obs.disconnect();}catch{}process.exit(0);});
process.on("SIGTERM",async()=>{try{await obs.disconnect();}catch{}process.exit(0);});
main().catch(error=>{console.error(error.message);process.exit(1);});
