# CrowRules Tacoma OBS Bridge

This is the local connector between the secure Tacoma producer control service and OBS Studio. It runs on the same Windows/Mac/Linux computer as OBS and connects to OBS only through loopback. Remote producers never connect to OBS WebSocket directly.

## Requirements

- OBS Studio 28 or newer (built-in obs-websocket 5.x)
- Node.js 20.11 or newer
- A signed-in Hub administrator to pair the computer in the restricted Broadcast Studio

## 1. Configure OBS

1. Open OBS Studio → Tools → WebSocket Server Settings.
2. Enable the WebSocket server.
3. Keep the default port **4455**.
4. Enable authentication and set a unique strong password.
5. Do not port-forward port 4455, add it to public firewall rules, or share its password.
6. Create the 18 approved scenes listed in the Producer Studio. Scene names must match exactly.

## 2. Pair the production computer

1. Open the restricted [Broadcast Studio](https://crowrulesentertainment-oss.github.io/tacoma/new-years-eve-2027/broadcast-studio.html) and sign in with a Hub administrator account.
2. In **OBS producer control**, click **Pair this OBS computer**.
3. Copy the one-time bridge token. It is not stored in browser storage and cannot be displayed again.
4. Download/clone this folder onto the OBS production computer.
5. Copy `.env.example` to `.env`. Paste the one-time token into `OBS_BRIDGE_TOKEN`, and your OBS WebSocket password into `OBS_WS_PASSWORD`.
6. Keep `.env` private. Do not email it, upload it, commit it, or paste it into chat.

## 3. Install and run

Open a terminal in this folder:

```bash
npm install
npm start
```

The bridge should report an OBS connection and then heartbeat to the control service. Leave the terminal running during rehearsals and the broadcast. On Windows, you can use `start-bridge.bat`.

## 4. Verify remote control

1. Confirm the dashboard shows **BRIDGE ONLINE** and current OBS scene, stream/recording state and performance telemetry.
2. Queue a harmless test scene switch (for example, 02 MAIN STUDIO).
3. Confirm OBS changes scenes and the producer command log reports success.
4. Try a host cue; it should appear in the command log and terminal. Host cues are producer notes only and do not transmit audio/video or message a guest.
5. Revoke the bridge in the dashboard and confirm it stops accepting commands. Pair again to restore access.

## Security model

- The bridge initiates outbound HTTPS requests; no inbound port is opened on the production computer.
- OBS WebSocket is hard-restricted in code to `127.0.0.1`, `localhost` or IPv6 loopback.
- The cloud service stores only a SHA-256 hash of the bridge credential. The raw token is shown once during pairing.
- Commands are allowlisted, event-scoped and expire after 30 seconds. The bridge independently checks the scene allowlist and confirms that the target scene exists in OBS.
- Browser users require a verified Supabase session and the `hub_admins.role = admin` permission.
- The dashboard cannot start/stop the YouTube stream, shut down OBS, execute shell commands or alter stream keys.
- Keep a local operator at the production PC. If the website/cloud service fails, use OBS locally.
- Host cues are operational log entries only. Remote guest video/audio requires a separate WebRTC/guest-room integration.

## Troubleshooting

- **Bridge authentication failed:** revoke the old device in the dashboard and pair again; replace the token in the local `.env`.
- **OBS connection refused:** open OBS, check Tools → WebSocket Server Settings, and confirm port 4455.
- **Authentication failed:** confirm `OBS_WS_PASSWORD` matches the OBS password exactly.
- **Scene not found:** create or rename the OBS scene to match the approved scene name exactly.
- **Bridge offline:** keep the bridge terminal open, check outbound HTTPS access, and restart `npm start`.
- **No FPS/encoder metrics:** update OBS and confirm the bridge can call GetStats and GetStreamStatus.

The bridge never stores or receives a YouTube stream key.
