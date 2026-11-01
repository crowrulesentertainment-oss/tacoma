# CrowRules 24 Hours of Tacoma — OBS Production Setup

Version 1.1. Event: December 31, 2026 noon through January 1, 2027 noon Pacific.

## Chosen decisions
- YouTube Live destination.
- Hybrid physical studio plus remote hosts.
- Overnight rotation of live check-ins and approved prerecorded programming.
- Web-based producer headquarters with a secure local OBS bridge.
- Continuous local recording for the full 24 hours.

## Current implementation status
The restricted Broadcast Headquarters now includes a secure producer command interface. The Supabase command service and bridge pairing API are deployed, and the local Node.js OBS Bridge is included in the repository. Actual OBS control becomes active only after an administrator pairs the production computer, installs the bridge, enters its one-time credential and starts it. Remote guest admission and video transport remain separate integrations.

## Target architecture
1. GitHub Pages production headquarters: authenticated producer UI; no stream key or OBS password.
2. Supabase Auth and server-side authorization: verify identity and role using Edge Functions and database policies.
3. Secure command service: validate role, event, command allowlist, expiry, unique command ID and audit metadata.
4. Local production bridge: service on the OBS PC; initiates outbound authenticated polling or private channel; calls OBS WebSocket only on loopback.
5. OBS Studio: scenes, transitions, encoder and local recording; sends program to YouTube using a key stored only in OBS.

The Broadcast Studio includes an embedded public YouTube channel monitor so producers can watch the viewer-facing output from event headquarters.

### Streamlabs Desktop compatibility
The current `obs-bridge` package is for OBS Studio only. Streamlabs Desktop has a distinct Remote Control API (Settings → Remote Control) and needs a separately implemented adapter. Do not configure Streamlabs as if it were an OBS WebSocket v5 server, and do not share its Remote Control token with the OBS bridge. Until that adapter is deployed and tested, run Streamlabs locally and use the embedded YouTube player plus Streamlabs' own local status/preview for monitoring. Either encoder may be selected as the active YouTube source, but only one should be the active program encoder at a time.

## Security requirements
- Never port-forward OBS WebSocket port 4455.
- Never place OBS password, YouTube stream key, Supabase service-role key or bridge secret in GitHub, HTML, JavaScript, browser storage or chat.
- Use TLS for remote communication and a separate revocable bridge credential stored on the production computer.
- Enforce roles server-side for every command; deny by default.
- Allow only named scenes and transitions. Do not expose arbitrary OBS RPC, shell execution or file access.
- Commands must be short-lived, single-use, event-scoped and audited.
- Require explicit producer confirmation for on-air changes and a second confirmation for stream stop/shutdown.
- Keep local OBS controls available if the website or cloud service fails.

## Secure OBS Bridge setup\n\nThe bridge lives in `new-years-eve-2027/obs-bridge/`. Follow its [README](obs-bridge/README.md). Pair the production computer from the restricted Broadcast Studio, copy the one-time token into the local `.env`, add the OBS WebSocket password locally, run `npm install` and `npm start`, then verify BRIDGE ONLINE and a successful test scene switch. The bridge polls the secure Supabase Edge Function over outbound HTTPS, reports OBS scene/stream/recording/performance telemetry, and acknowledges commands. Credentials are hashed server-side and can be revoked from the Producer Studio. Host cues are audit-log notes only, not remote guest messaging.\n\n## OBS setup
1. Install a current supported OBS Studio release on the production PC.
2. Create profile CR-24H-TACOMA-2027 and scene collection CR-24H-TACOMA-2027.
3. Initial target: 1920×1080 at 30 fps. Test actual encoder, upload and YouTube ingest before finalizing.
4. Open Tools → WebSocket Server Settings. Enable the WebSocket server and set a unique strong password. Default local port is 4455.
5. Keep the socket local. The future bridge should connect to ws://127.0.0.1:4455. Do not expose it publicly or share its password with hosts.
6. Create the scheduled YouTube Live event. Enter the stream key directly in OBS; never put it into this website.
7. Configure wired Ethernet, UPS, disable sleep and automatic restarts, and prepare tested backup internet.

## Recommended scene collection
01 OPENING; 02 MAIN STUDIO; 03 TWO HOSTS; 04 REMOTE HOST; 05 REMOTE INTERVIEW; 06 COMMUNITY SPOTLIGHT; 07 TACOMA SHOWCASE; 08 FULL SCREEN VIDEO; 09 PERFORMANCE; 10 COMMUNITY MESSAGES; 11 HOURLY UPDATE; 12 COUNTDOWN; 13 WELCOME 2027; 14 OVERNIGHT LOOP; 15 NEW YEAR MORNING; 16 EMERGENCY HOLD; 17 AUDIO ONLY HOLD; 18 CLOSING.

Use reusable nested scenes for logo, clock, lower thirds and background. Keep guest sources separate from program scenes.

## YouTube and recording
- Create the event in the intended CrowRules YouTube channel and confirm title, thumbnail, description, audience, visibility and moderation.
- Enter the stream key directly in OBS. Keep the same encoder session during host changes; switch scenes, not YouTube streams.
- Record the full program locally. Prefer MKV for crash resilience and remux to MP4 afterward if needed.
- Use a dedicated fast drive. Record a one-hour test at final settings, multiply measured storage by 24, and add at least 25% free-space headroom. Verify playback and audio sync.
- Do not assume recording is safe until sustained-write and recovery tests pass.

## Hybrid remote-host relay
1. Use a dedicated browser-based guest room or WebRTC service. Never let guests connect directly to OBS WebSocket.
2. Issue private, expiring guest links; do not post them publicly.
3. Incoming host checks in 20–30 minutes early, uses headphones, and confirms camera, mic, lighting, network and display name.
4. Producer admits host backstage. Host remains muted/off-air until cued.
5. Producer checks audio, framing, name key and segment rundown.
6. Outgoing host introduces incoming host. Producer switches OBS to the prepared scene.
7. Confirm incoming host is on program and audio is clean before outgoing host disconnects.
8. If source fails, switch to emergency hold or backup content and reconnect off-air.
9. Hosts never receive stream keys, OBS passwords, bridge credentials or admin accounts.

## Shift plan
- Shift A: Dec 31 noon–6 PM; check-in 11:30 AM.
- Shift B: Dec 31 6 PM–midnight; check-in 5:30 PM.
- Shift C: Jan 1 midnight–6 AM; check-in 11:30 PM.
- Shift D: Jan 1 6 AM–noon; check-in 5:30 AM.
Maintain at least 30 minutes overlap between outgoing and incoming production operators. Assign a dedicated stream-health/recording monitor. Overnight blocks alternate scheduled live check-ins and cleared prerecorded content.

## Rehearsal gates
- Private/unlisted YouTube test stream.
- 60-minute local recording and playback verification.
- Test all scenes, transitions and emergency slates.
- Remote guest check-in and handoff rehearsal.
- Simulate remote source failure, internet interruption and OBS reconnect.
- Verify storage estimate, disk headroom and alternate encoder recovery.
- Complete a full-duration rehearsal if practical.

## Incident runbook
- Guest drops: switch to hold/backup content; reconnect guest off-air.
- Camera fails: switch to alternate camera or full-screen segment.
- Audio fails: mute faulty source; use backup microphone or holding scene.
- OBS crashes: local operator restarts OBS and follows the recovery plan; a separate backup encoder is needed for continuity.
- Internet fails: switch to tested backup connection; activate alternate encoder if required.
- Disk nearly full: alert operator and verify alternate recording before stopping any capture.
- Dashboard unavailable: continue with local OBS controls and printed rundown.

## Go-live release criteria
Do not declare ready until secure bridge deployment, server-side role enforcement, command expiry and audit, loopback-only OBS socket, YouTube rehearsal, full recording verification, remote host relay and recovery rehearsal are complete.
