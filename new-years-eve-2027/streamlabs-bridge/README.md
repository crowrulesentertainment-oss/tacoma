# CrowRules Tacoma Streamlabs Desktop Bridge

This is a separate local adapter for **Streamlabs Desktop**. It uses Streamlabs' own Remote Control API (SockJS + JSON-RPC), then polls the existing authenticated Tacoma producer command service over outbound HTTPS. It is not an OBS WebSocket client.

## Requirements

- Streamlabs Desktop installed and running on the production computer
- Node.js 20.11 or newer
- A Hub administrator to pair this computer in the Broadcast Studio
- Streamlabs Remote Control enabled

## 1. Enable Streamlabs Remote Control

1. Open Streamlabs Desktop.
2. Open **Settings → Remote Control**.
3. Enable third-party / remote connections if the option is shown.
4. Open the QR code, choose **Show details**, and copy the API token.
5. Note the port shown there (normally **59650**). Keep it available only on the local production network.
6. Do not port-forward this port or expose it to the public internet.

Streamlabs documents the local RPC API, SockJS connection and token authentication in its [Desktop API reference](https://streamlabs.github.io/streamlabs-desktop-api-docs/docs/index.html).

## 2. Pair the computer

1. Open the restricted [Broadcast Studio](https://crowrulesentertainment-oss.github.io/tacoma/new-years-eve-2027/broadcast-studio.html).
2. Sign in as a Tacoma Community Hub administrator.
3. Choose **Pair Streamlabs Desktop** and name the production computer.
4. Copy the one-time Tacoma bridge credential. It is separate from the Streamlabs API token.
5. Download this `streamlabs-bridge` folder onto the computer running Streamlabs Desktop.

## 3. Configure and run

Copy `.env.example` to `.env`. Fill in both credentials locally:

- `STREAMLABS_BRIDGE_TOKEN`: the one-time token from Broadcast Studio.
- `STREAMLABS_API_TOKEN`: the token from Streamlabs Settings → Remote Control.

Leave the local API URL at `http://127.0.0.1:59650/api` unless Streamlabs shows a different local port. Never upload or commit `.env`.

Then run:

```bash
npm install
npm start
```

On Windows, `start-bridge.bat` launches the bridge after configuration.

## 4. Test

1. Confirm the bridge terminal reports **Authenticated** and lists the Streamlabs scenes.
2. Keep Streamlabs Desktop open and leave the bridge running. The bridge polls telemetry every 2 seconds by default.
3. Create or rename the event scenes to match the approved 24 Hours of Tacoma names.
4. In Broadcast Studio, refresh status and select the Streamlabs production computer.
5. Check the LIVE/OFFLINE and RECORDING/STOPPED indicators against Streamlabs Desktop. Confirm FPS/CPU/drop data when Streamlabs returns them.
6. Queue a harmless test scene change and verify Streamlabs changes scenes.
7. Revoke the device from Broadcast Studio to disable its Tacoma bridge credential.

## Scope and safety

- Supports approved scene switching and producer host-cue logging.
- Does not start/stop the stream or recording; use Streamlabs locally for those safety-critical actions.
- The adapter reads Streamlabs `StreamingService.getModel()` for live/starting/reconnecting/offline and recording states, and `PerformanceService.getModel()` for CPU, frame rate, bandwidth, dropped-frame count and dropped-frame percentage. The Broadcast Studio displays only values returned by Streamlabs; unavailable values remain unavailable.
- Scene switching is restricted to the approved 18-scene allowlist and requires the target scene to exist in the current Streamlabs collection.
- The Streamlabs API token and Tacoma bridge token remain on the production computer. Neither belongs in GitHub, browser storage, chat or the public website.
- Keep a local operator at the encoder. If the dashboard, network or bridge fails, use Streamlabs locally.
- The existing OBS Studio bridge remains unchanged and can be used independently. Only one encoder should send the active program to YouTube at a time.
