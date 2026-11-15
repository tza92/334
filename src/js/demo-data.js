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
    { title: "Steam Next Fest demo submission", type: "Event", category: "Deliverable", channel: "Event", event: "Steam Next Fest", date: "2026-08-12", demoDaysUntil: 6, goals: [{ metric: "Steam wishlists", target: "15000" }, { metric: "Discord members", target: "4000" }] },
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
