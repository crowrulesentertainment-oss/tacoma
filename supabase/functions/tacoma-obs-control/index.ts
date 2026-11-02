import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminDb = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const scenes = [
  "01 OPENING","02 MAIN STUDIO","03 TWO HOSTS","04 REMOTE HOST","05 REMOTE INTERVIEW",
  "06 COMMUNITY SPOTLIGHT","07 TACOMA SHOWCASE","08 FULL SCREEN VIDEO","09 PERFORMANCE",
  "10 COMMUNITY MESSAGES","11 HOURLY UPDATE","12 COUNTDOWN","13 WELCOME 2027",
  "14 OVERNIGHT LOOP","15 NEW YEAR MORNING","16 EMERGENCY HOLD","17 AUDIO ONLY HOLD","18 CLOSING"
];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-bridge-token",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });
const sha = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,"0")).join("");
};
const numberOrNull = (value: unknown) => value === null || value === undefined || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
};
async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) throw new Error("Sign in with an administrator account.");
  const jwt = auth.slice(7);
  const userDb = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await userDb.auth.getUser(jwt);
  if (error || !user) throw new Error("Your session could not be verified. Sign in again.");
  const { data: role, error: roleError } = await adminDb.from("hub_admins").select("role").eq("user_id", user.id).maybeSingle();
  if (roleError || String(role?.role || "").toLowerCase() !== "admin") throw new Error("Hub administrator permission is required.");
  return user;
}
async function requireBridge(req: Request) {
  const token = req.headers.get("x-bridge-token") || "";
  if (token.length < 30) throw new Error("Bridge authentication required.");
  const tokenHash = await sha(token);
  const { data: device, error } = await adminDb.from("tacoma_obs_bridge_devices")
    .select("id,event_key,revoked_at").eq("token_hash", tokenHash).maybeSingle();
  if (error || !device || device.revoked_at) throw new Error("Bridge credential is invalid or revoked.");
  return device;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required." }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    if (action === "bridge_poll") {
      const device = await requireBridge(req);
      const t = body.telemetry && typeof body.telemetry === "object" ? body.telemetry : {};
      const { error: updateError } = await adminDb.from("tacoma_obs_bridge_devices").update({
        last_seen: new Date().toISOString(),
        obs_version: String(t.obsVersion || "").slice(0,80) || null,
        websocket_version: String(t.websocketVersion || "").slice(0,80) || null,
        current_scene: String(t.currentScene || "").slice(0,100) || null,
        streaming: Boolean(t.streaming), recording: Boolean(t.recording),
        active_fps: numberOrNull(t.activeFps),
        cpu_usage: numberOrNull(t.cpuUsage),
        memory_usage: numberOrNull(t.memoryUsage),
        render_skipped_frames: numberOrNull(t.renderSkippedFrames),
        output_skipped_frames: numberOrNull(t.outputSkippedFrames),
        output_congestion: numberOrNull(t.outputCongestion),
        last_error: String(t.lastError || "").slice(0,500) || null,
        telemetry: t
      }).eq("id", device.id);
      if (updateError) throw updateError;
      const { data: commands, error: claimError } = await adminDb.rpc("tacoma_claim_obs_command", { p_device_id: device.id });
      if (claimError) throw claimError;
      return reply({ ok: true, command: commands?.[0] || null, serverTime: new Date().toISOString() });
    }
    if (action === "bridge_ack") {
      const device = await requireBridge(req);
      const commandId = String(body.commandId || "");
      const status = body.status === "failed" ? "failed" : "succeeded";
      if (!/^[0-9a-f-]{36}$/i.test(commandId)) return reply({ error: "Invalid command ID." }, 400);
      const { data, error } = await adminDb.from("tacoma_obs_commands").update({
        status, completed_at: new Date().toISOString(),
        result: { message: String(body.message || "").slice(0,500) }
      }).eq("id", commandId).eq("device_id", device.id).eq("status", "claimed").select("id,status").maybeSingle();
      if (error) throw error;
      return reply({ ok: true, acknowledged: Boolean(data) });
    }
    const user = await requireAdmin(req);
    if (action === "replay_feed") {
      let response: Response;
      try {
        response = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=UCOSm_4z9LIQUWHOc8yzPgkw", {
          headers: {
            "Accept": "application/atom+xml,application/xml,text/xml",
            "User-Agent": "Mozilla/5.0 (compatible; CrowRulesReplayLibrary/1.0)"
          },
          signal: AbortSignal.timeout(12000)
        });
      } catch (feedError) {
        const detail = feedError instanceof Error ? feedError.message : "Network request failed";
        console.error("replay_feed upstream fetch failed:", detail);
        return reply({ ok:false, error:"YouTube could not be reached from the replay service: " + detail, videos:[] });
      }
      if (!response.ok) {
        console.error("replay_feed YouTube HTTP status:", response.status);
        return reply({ ok:false, error:"YouTube channel feed returned HTTP " + response.status, videos:[] });
      }
      const xml = await response.text();
      const decode = (s:string) => s.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">");
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      const videos = entries.slice(0,40).map((entry) => {
        const field = (tag:string) => decode(entry.match(new RegExp("<"+tag+"[^>]*>([\\s\\S]*?)<\\/"+tag+">"))?.[1] || "");
        const id = field("yt:videoId");
        const title = field("title");
        const published = field("published");
        const thumbnail = decode(entry.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] || "");
        return {id,title,published,thumbnail};
      }).filter(v => /^[A-Za-z0-9_-]{11}$/.test(v.id) && v.title);
      return reply({ok:true,videos});
    }
    if (action === "replay.set") {
      const videoId = body.videoId == null || body.videoId === "" ? null : String(body.videoId);
      if (videoId && !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return reply({error:"Invalid YouTube video ID."},400);
      const title = String(body.title || "").slice(0,200);
      const {error} = await adminDb.from("tacoma_replay_state").upsert({
        event_key:"nye_2026_2027", video_id:videoId, video_title:videoId?title:"", updated_at:new Date().toISOString()
      },{onConflict:"event_key"});
      if (error) throw error;
      return reply({ok:true,videoId,title:videoId?title:""});
    }

    if (action === "status") {
      const [{ data: devices, error: de }, { data: commands, error: ce }] = await Promise.all([
        adminDb.from("tacoma_obs_bridge_devices").select("id,event_key,device_name,created_at,last_seen,revoked_at,obs_version,websocket_version,current_scene,streaming,recording,active_fps,cpu_usage,memory_usage,render_skipped_frames,output_skipped_frames,output_congestion,last_error,telemetry").eq("event_key","nye_2026_2027").order("created_at",{ascending:false}),
        adminDb.from("tacoma_obs_commands").select("id,command_type,payload,status,created_at,expires_at,completed_at,result").eq("event_key","nye_2026_2027").order("created_at",{ascending:false}).limit(20)
      ]);
      if (de || ce) throw de || ce;
      return reply({ ok: true, scenes, devices: devices || [], commands: commands || [] });
    }
    if (action === "pair") {
      const token = randomToken();
      const tokenHash = await sha(token);
      const name = String(body.deviceName || "OBS Production PC").trim().slice(0,80) || "OBS Production PC";
      const { data, error } = await adminDb.from("tacoma_obs_bridge_devices").insert({
        event_key:"nye_2026_2027", device_name:name, token_hash:tokenHash, created_by:user.id
      }).select("id,device_name,created_at").single();
      if (error) throw error;
      return reply({ ok:true, device:data, bridgeToken:token, warning:"Copy this credential now. It is shown only once." });
    }
    if (action === "revoke") {
      const id = String(body.deviceId || "");
      const { error } = await adminDb.from("tacoma_obs_bridge_devices").update({ revoked_at:new Date().toISOString() }).eq("id",id).eq("event_key","nye_2026_2027");
      if (error) throw error;
      return reply({ ok:true });
    }
    if (action === "command") {
      const deviceId = String(body.deviceId || "");
      const type = String(body.commandType || "");
      let payload: Record<string,unknown> = {};
      if (type === "scene.switch") {
        const sceneName = String(body.sceneName || "");
        if (!scenes.includes(sceneName)) return reply({ error:"Scene is not on the approved 24 Hours of Tacoma list." },400);
        payload = { sceneName };
      } else if (type === "host.cue") {
        const cue = String(body.cue || "");
        if (!["standby","ready","on-air","release","hold"].includes(cue)) return reply({error:"Unsupported host cue."},400);
        payload = { cue, hostName:String(body.hostName || "").slice(0,80) };
      } else return reply({error:"Unsupported producer command."},400);
      const { data: device, error: deviceError } = await adminDb.from("tacoma_obs_bridge_devices").select("id")
        .eq("id",deviceId).eq("event_key","nye_2026_2027").is("revoked_at",null).maybeSingle();
      if (deviceError || !device) return reply({error:"Select an active paired OBS bridge first."},409);
      const { data, error } = await adminDb.from("tacoma_obs_commands").insert({
        event_key:"nye_2026_2027",device_id:deviceId,command_type:type,payload,requested_by:user.id,
        expires_at:new Date(Date.now()+30000).toISOString()
      }).select("id,command_type,payload,status,created_at").single();
      if (error) throw error;
      return reply({ok:true,command:data});
    }
    return reply({error:"Unknown action."},400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    const status = /administrator|session|sign in|permission/i.test(message) ? 403 : /bridge credential|bridge authentication/i.test(message) ? 401 : 500;
    return reply({error:message},status);
  }
});
