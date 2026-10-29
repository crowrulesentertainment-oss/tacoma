import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-hub-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));
Deno.serve(async (req: Request) => {
 if (req.method === "OPTIONS") return new Response(null, { headers: cors });
 if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
 const cronSecret = Deno.env.get("HUB_EMAIL_CRON_SECRET");
 if (!cronSecret || req.headers.get("x-hub-cron-secret") !== cronSecret) return new Response("Unauthorized", { status: 401, headers: cors });
 const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), brevoKey = Deno.env.get("BREVO_API_KEY"), fromEmail = Deno.env.get("HUB_EMAIL_FROM");
 if (!url || !serviceKey || !brevoKey || !fromEmail) return Response.json({ error: "Email delivery is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY, HUB_EMAIL_FROM, and HUB_EMAIL_CRON_SECRET." }, { status: 503, headers: cors });
 const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
 const { data: pending, error } = await db.from("hub_member_activity").select("id,user_id,activity_type,title,message,created_at,hub_member_email_preferences!inner(email_enabled,event_reminders,interest_matches,saved_listing_updates,unsubscribe_token)").is("email_sent_at", null).is("dismissed_at", null).gte("created_at", new Date(Date.now()-30*86400000).toISOString()).order("created_at",{ascending:true}).limit(100);
 if (error) return Response.json({ error: "Could not load pending notifications." }, { status: 500, headers: cors });
 let sent=0, skipped=0, failed=0;
 for (const item of pending || []) {
  const pref = Array.isArray(item.hub_member_email_preferences) ? item.hub_member_email_preferences[0] : item.hub_member_email_preferences;
  if (!pref?.email_enabled || (item.activity_type==="event_reminder"&&!pref.event_reminders) || (item.activity_type==="interest_match"&&!pref.interest_matches) || (item.activity_type==="saved_listing_update"&&!pref.saved_listing_updates)) { skipped++; continue; }
  const { data: account, error: accountError } = await db.auth.admin.getUserById(item.user_id);
  const email = account?.user?.email;
  if (accountError || !email) { failed++; await db.from("hub_member_activity").update({email_error:"No account email available"}).eq("id",item.id); continue; }
  const unsubscribe = url + "/functions/v1/member-email-unsubscribe?token=" + encodeURIComponent(pref.unsubscribe_token);
  const subject = "Tacoma Community Hub: " + item.title;
  const textBody = item.title + "\n\n" + item.message + "\n\nManage your member settings: https://crowrulesentertainment-oss.github.io/tacoma/member.html\nUnsubscribe from email notifications: " + unsubscribe;
  const htmlBody = '<!doctype html><html lang="en"><meta charset="utf-8"><body style="margin:0;background:#081522;color:#eef7ff;font:16px Arial,sans-serif;padding:24px"><main style="max-width:600px;margin:auto;background:#102536;padding:28px;border-radius:16px"><p style="color:#43d9ef;font-size:12px;letter-spacing:2px">TACOMA COMMUNITY HUB</p><h1 style="font-size:24px">'+esc(item.title)+'</h1><p>'+esc(item.message)+'</p><p><a style="color:#43d9ef" href="https://crowrulesentertainment-oss.github.io/tacoma/member.html">Open your member dashboard</a></p><hr style="border-color:#244253"><p style="font-size:12px;color:#b7cbd8">You received this because you enabled email notifications. <a style="color:#43d9ef" href="'+esc(unsubscribe)+'">Unsubscribe from all email notifications</a>.</p></main></body></html>';
  const response = await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"api-key":brevoKey,"accept":"application/json","content-type":"application/json"},body:JSON.stringify({sender:{email:fromEmail,name:"Tacoma Community Hub"},to:[{email}],subject,textContent:textBody,htmlContent:htmlBody,headers:{"List-Unsubscribe":"<"+unsubscribe+">","List-Unsubscribe-Post":"List-Unsubscribe=One-Click"}})});
  if(response.ok){await db.from("hub_member_activity").update({email_sent_at:new Date().toISOString(),email_error:null}).eq("id",item.id);sent++;}
  else {const body=(await response.text()).slice(0,450);await db.from("hub_member_activity").update({email_error:"Brevo send failed ("+response.status+"): "+body}).eq("id",item.id);failed++;}
 }
 return Response.json({processed:(pending||[]).length,sent,skipped,failed,note:"Call periodically with a scheduler to process notifications."},{headers:cors});
});