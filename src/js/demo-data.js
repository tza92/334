function initializeDefaultGameDashboard(card) {
  if (!card.isDefaultGame || card.defaultDashboardSeeded) return;
  seedConnectionDemo(card);
  seedPlanningDemo(card, "goals", { title: "Reach 25,000 Steam wishlists by launch", metric: "Steam wishlists", target: "25000" });
  seedPlanningDemo(card, "milestones", { title: "Steam Next Fest demo submission" });
  card.defaultDashboardSeeded = true;
}

// Update only known sample copy; user-created records and edits remain intact.
function syncConnectionDemoContent(card) {
  for (const record of gameDashboardData(card).touchpoints) {
    if (!record.demo || record.demoContentVersion === 1) continue;
    if (record.title === 'Feature: "5 solo dev horror games to watch for in 2025"') {
      record.title = 'Feature: "5 solo dev horror games to watch for in 2026"';
    }
    if (record.platform?.toLowerCase() === "youtube" && record.icon === "megaphone") record.icon = "play";
    const relativeDays = { Yesterday: 1, "2d ago": 2, "3d ago": 3, "5d ago": 5, "1w ago": 7 }[record.relativeTime];
    if (relativeDays && record.date) {
      const date = new Date(`${record.date}T12:00:00`);
      date.setDate(date.getDate() - relativeDays);
      record.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    record.demoContentVersion = 1;
  }
}

function connectionRecordTime(record) {
  const days = Math.round((Date.parse(`${localDateKey()}T00:00:00Z`) - Date.parse(`${record.date}T00:00:00Z`)) / 86400000);
  if (days === 0) return /^(?:\d+[hm] ago)$/.test(record.relativeTime || "") ? record.relativeTime : "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days}d ago`;
  if (days >= 7 && days < 28) return `${Math.floor(days / 7)}w ago`;
  return dashboardDate(record.date);
}

// Populate the dashboard reference after the first simulated connection is configured.
function seedConnectionDemo(card) {
  const seeded = card.seededDemoPanels ??= new Set();
  if (seeded.has("connections")) {
    extendConnectionDemo(card);
    return;
  }
  seeded.add("connections");
  card.conversionMetrics = [
    { value: "412,000", detail: "Baseline — top of conversion" },
    { value: "48,900", detail: "11.9% click-through from impressions" },
    { value: "6,210", detail: "12.7% conversion from clicks" },
    { value: "186", detail: "3.0% paid conversion" },
    { value: "125", detail: "2.0% paid conversion" },
  ];
  const date = localDateKey();
  gameDashboardData(card).touchpoints.push(
    { title: '"When your save file corrupts"', type: "post", category: "SHORT-FORM", platform: "TIKTOK", summary: "48.2K views · 3.1K likes · +84 wishlists attributed", relativeTime: "2h ago", icon: "video", date, demo: true },
    { title: '"Demo Teaser"', type: "post", category: "SHORT-FORM", platform: "Instagram", summary: "$120 spent · 41K reach · +67 wishlists", relativeTime: "Yesterday", icon: "megaphone", date, demo: true },
    { title: 'Feature: "5 solo dev horror games to watch for in 2026"', type: "press", category: "PRESS", platform: "INDIE GAMES PLUS", summary: "~12K article reads · +221 wishlists attributed", relativeTime: "Yesterday", icon: "newspaper", date, demo: true },
    { title: "Updated screenshots + short trailer", type: "store", category: "STOREFRONT", platform: "STEAM", summary: "Visits → Wishlist rate +2.3% (14.1%)", relativeTime: "2d ago", icon: "storefront", date, demo: true },
  );
  extendConnectionDemo(card);
}

function extendConnectionDemo(card) {
  const records = gameDashboardData(card).touchpoints;
  if (!card.seededDemoPanels?.has("connections")) return;
  const date = localDateKey();
  const examples = [
    { title: "Devlog #13: building the corruption effect", type: "devlog", category: "DEVLOG", platform: "YOUTUBE", summary: "9.4K views · 610 likes · +58 wishlists attributed", relativeTime: "5d ago", icon: "megaphone", date, demo: true },
    { title: "Playtest sign-ups opened in #announcements", type: "community", category: "COMMUNITY", platform: "DISCORD", summary: "312 reactions · +46 members joined", relativeTime: "1w ago", icon: "link", date, demo: true },
  ];
  examples.forEach(example => {
    if (!records.some(record => record.title === example.title || record.demo && record.type === example.type && record.platform?.toLowerCase() === example.platform.toLowerCase())) records.push(example);
  });
}

// Reveal the example set once the first item is created in each panel.
function seedPlanningDemo(card, kind, submittedRecord) {
  const seeded = card.seededDemoPanels ??= new Set();
  const records = gameDashboardData(card)[kind];
  const wishlistDemo = kind === "goals" && submittedRecord
    && submittedRecord.title.trim().toLowerCase() === "reach 25,000 steam wishlists by launch"
    && submittedRecord.metric === "Steam wishlists" && Number(submittedRecord.target) === 25000;
  const milestoneDemo = kind === "milestones" && submittedRecord
    && submittedRecord.title.trim().toLowerCase() === "steam next fest demo submission";
  const referenceDemo = wishlistDemo || milestoneDemo;
  if (referenceDemo) {
    const index = records.indexOf(submittedRecord);
    if (index !== -1) records.splice(index, 1);
  }
  if (seeded.has(kind) || (!referenceDemo && records.length !== 1)) return;
  seeded.add(kind);

  function relativeDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const examples = kind === "goals" ? [
    { title: "Grow Discord to 5,000 members", metric: "Discord members", target: "5000", current: 3214, status: "on-track", date: "2026-09-01" },
    { title: "Secure 3 press features before PAX West", metric: "Press features", target: "3", current: 1, status: "behind", date: "2026-08-29" },
    { title: "Publish 12 short-form videos / month", metric: "Short-form videos", target: "12", current: 12, date: "2026-08-04", completedAt: "2026-08-04" },
    { title: "Reach 500 newsletter subscribers", metric: "Newsletter subscribers", target: "500", current: 412, status: "on-track", date: "2026-10-01" },
    { title: "Reach 10,000 Steam wishlists", metric: "Steam wishlists", target: "10000", current: 4500, date: relativeDate(35) },
    { title: "Welcome 250 Patreon members", metric: "Patreon members", target: "250", current: 90, date: relativeDate(42) },
    { title: "Publish 6 development updates", metric: "Short-form videos", target: "6", current: 2, date: relativeDate(21) },
    { title: "Secure 5 launch press features", metric: "Press features", target: "5", current: 0, date: relativeDate(56) },
    { title: "Grow the newsletter to 1,000 subscribers", metric: "Newsletter subscribers", target: "1000", current: 300, date: relativeDate(63) },
  ] : [
    { title: "Steam Next Fest demo submission", type: "Event", category: "Deliverable", channel: "Event", event: "Steam Next Fest", date: "2026-08-12", demoDaysUntil: 6, goals: [{ metric: "Steam wishlists", target: "15000" }, { metric: "Discord members", target: "4000" }, { metric: "Patreon members", target: "250" }] },
    { title: "Devlog #14 \u2014 combat overhaul reveal", type: "Content", category: "Content", channel: "YouTube + TikTok", date: "2026-08-20", demoDaysUntil: 14 },
    { title: "PAX West \u2014 booth 2184 setup", type: "Event", category: "Event", channel: "Showcase", event: "PAX West", date: "2026-08-29", demoDaysUntil: 23 },
    { title: "Press embargo lifts \u2014 IGN preview", type: "Press", category: "Press", channel: "Article", date: "2026-09-10", demoDaysUntil: 35 },
    { title: "Patreon early access tier opens", type: "Revenue", category: "Revenue", channel: "Patreon", date: "2026-09-24", demoDaysUntil: 49 },
    { title: "Launch trailer delivery", type: "Deliverable", date: "2026-10-01", demoDaysUntil: 56 },
    { title: "Community playtest", type: "Event", date: "2026-10-08", demoDaysUntil: 63 },
    { title: "Marketing fund deadline", type: "Fund", date: "2026-10-15", demoDaysUntil: 70 },
  ];
  const normalize = (title) => title.trim().toLowerCase();
  examples.forEach((example) => {
    if (!records.some((record) => normalize(record.title) === normalize(example.title))) {
      records.push({ ...example, demo: true });
    }
  });
}
