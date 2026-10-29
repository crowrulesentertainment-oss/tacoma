import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Headers": "content-type, x-hub-cron-secret", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const secret = Deno.env.get("HUB_EMAIL_CRON_SECRET");
  if (!secret || req.headers.get("x-hub-cron-secret") !== secret) return new Response("Unauthorized", { status: 401, headers: cors });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return Response.json({ error: "Server configuration missing." }, { status: 503, headers: cors });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const dayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [profilesRes, listingsRes, favoritesRes] = await Promise.all([
    db.from("hub_member_profiles").select("user_id,interests").limit(5000),
    db.from("hub_listings").select("id,kind,title,summary,category,neighborhood,start_at,created_at,updated_at,status").eq("status", "approved").gte("created_at", since).limit(2000),
    db.from("hub_member_favorites").select("user_id,listing_id,created_at,hub_listings(id,kind,title,start_at,updated_at,status)").limit(10000)
  ]);
  if (profilesRes.error || listingsRes.error || favoritesRes.error) {
    return Response.json({ error: "Could not read member activity sources. Check table names and columns in Supabase logs." }, { status: 500, headers: cors });
  }

  const profiles = profilesRes.data || [];
  const listings = (listingsRes.data || []).filter((item: any) => item.status === "approved");
  const favorites = (favoritesRes.data || []).filter((item: any) => item.hub_listings && item.hub_listings.status === "approved");
  const queue: any[] = [];

  for (const profile of profiles) {
    const interests = Array.isArray(profile.interests) ? profile.interests.map((x: any) => String(x).trim().toLowerCase()).filter((x: string) => x.length >= 3) : [];
    for (const listing of listings) {
      if (!interests.length) continue;
      const searchable = [listing.kind, listing.title, listing.summary, listing.category, listing.neighborhood].join(" ").toLowerCase();
      const matched = interests.filter((interest: string) => searchable.includes(interest));
      if (matched.length) queue.push({
        user_id: profile.user_id,
        activity_type: "interest_match",
        listing_id: listing.id,
        title: "A new listing matches your interests",
        message: String(listing.title || "New community listing") + " · Matches " + matched.slice(0, 2).join(", "),
        dedupe_key: "interest:" + listing.id
      });
    }
  }

  for (const favorite of favorites) {
    const listing = favorite.hub_listings;
    if (listing.kind === "event" && listing.start_at) {
      const starts = new Date(listing.start_at);
      if (starts >= now && starts <= dayAhead) queue.push({
        user_id: favorite.user_id,
        activity_type: "event_reminder",
        listing_id: listing.id,
        title: "Saved event coming up soon",
        message: String(listing.title || "Saved event") + " · " + starts.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
        dedupe_key: "event:" + listing.id + ":" + listing.start_at
      });
    }
    if (listing.updated_at && new Date(listing.updated_at).getTime() > new Date(favorite.created_at).getTime() + 60000) queue.push({
      user_id: favorite.user_id,
      activity_type: "saved_listing_update",
      listing_id: listing.id,
      title: "A saved listing has changed",
      message: String(listing.title || "A saved listing") + " was updated after you saved it.",
      dedupe_key: "update:" + listing.id + ":" + listing.updated_at
    });
  }

  let inserted = 0;
  for (let i = 0; i < queue.length; i += 500) {
    const batch = queue.slice(i, i + 500);
    const { error } = await db.from("hub_member_activity").upsert(batch, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true });
    if (error) return Response.json({ error: "Failed to queue activity notifications." }, { status: 500, headers: cors });
    inserted += batch.length;
  }
  return Response.json({ sourceListings: listings.length, membersChecked: profiles.length, favoritesChecked: favorites.length, notificationsEvaluated: queue.length, notificationsUpserted: inserted }, { headers: { ...cors, "Content-Type": "application/json" } });
});