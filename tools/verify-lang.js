const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ctx = { console, window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);

for (const f of ["cards.js", "decks.js", "abilities.js", "factions.js", "lang/zh-cn.js"]) {
  const code = fs.readFileSync(path.join(root, f), "utf8");
  vm.runInContext(code, ctx, { filename: f });
}

const ev = (expr) => vm.runInContext(expr, ctx);
const out = [];
const g = ctx.window.GWENT_ZH;
out.push("applied=" + JSON.stringify(g.applied));
out.push("cards_total=" + Object.keys(ev("card_dict")).length);
out.push("abilities_total=" + Object.keys(ev("ability_dict")).length);
out.push("factions_total=" + Object.keys(ev("factions")).length);
out.push("decks_total=" + ev("default_decks").length);

out.push("");
out.push("--- 阵营 ---");
for (const k of Object.keys(ev("factions"))) {
  const f = ev(`factions[${JSON.stringify(k)}]`);
  out.push(k + " | " + f.name + " | " + String(f.description).slice(0, 40));
}

out.push("");
out.push("--- 抽样卡牌 ---");
const sampleKeys = ["nr_foltest_lord", "nr_geralt", "nr_ciri", "nr_roach", "spe_decoy", "spe_horn", "spe_clear", "spe_frost", "mo_eredin_bringer_of_death", "sc_francesca_daisy"];
for (const k of sampleKeys) {
  const c = ev(`card_dict[${JSON.stringify(k)}]`);
  if (!c) { out.push(k + " | <missing>"); continue; }
  out.push(k + " | " + c.name + " | str=" + c.strength + " | ability=" + c.ability + " | quote=" + String(c.quote || "").slice(0, 30));
}

out.push("");
out.push("--- 技能抽样 ---");
for (const k of ["clear", "frost", "decoy", "horn", "scorch", "muster", "spy", "medic", "bond", "morale"]) {
  const a = ev(`ability_dict[${JSON.stringify(k)}]`);
  out.push(k + " | " + (a ? a.name : "<missing>") + " | " + (a ? String(a.description).slice(0, 40) : ""));
}

out.push("");
out.push("--- 预制卡组抽样 ---");
for (const i of [0, 4, 7, 26]) {
  const d = ev(`default_decks[${i}]`);
  if (d) out.push(i + " | " + d.title + " | " + d.description);
}

const report = out.join("\n");
fs.writeFileSync(path.join(__dirname, "verify-report.txt"), report, "utf8");
console.log("OK, wrote verify-report.txt, lines=" + out.length);
