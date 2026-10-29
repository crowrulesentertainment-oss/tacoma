import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const page = (title: string, message: string) => new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Tacoma Community Hub</title><body style="margin:0;background:#081522;color:#eef7ff;font:16px system-ui;display:grid;min-height:100vh;place-items:center"><main style="max-width:560px;margin:24px;padding:28px;border:1px solid #244253;border-radius:18px;background:#102536"><h1>${title}</h1><p>${message}</p><a style="color:#43d9ef" href="https://crowrulesentertainment-oss.github.io/tacoma/member.html">Return to member dashboard</a></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const token = new URL(req.url).searchParams.get("token") || (req.method === "POST" ? (await req.formData().catch(() => new FormData())).get("token")?.toString() : null);
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return page("Link not valid", "This unsubscribe link is missing or invalid. You can turn email notifications off from your member dashboard.");
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return page("Temporarily unavailable", "We could not process this request right now. Please turn email notifications off in your member dashboard.");
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("hub_member_email_preferences").update({ email_enabled: false, unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("unsubscribe_token", token).select("user_id").maybeSingle();
  if (error) return page("Temporarily unavailable", "We could not process this request right now. Please try again later.");
  if (!data) return page("Link already used or invalid", "This link may already have been used. You can manage email preferences from your member dashboard.");
  return page("You’re unsubscribed", "Email notifications from Tacoma Community Hub have been turned off. You can still use your account and change preferences later.");
});