const fs = require("fs");
const vm = require("vm");
const path = require("path");
const root = "D:/AI/Gwint中文网页版-20261123-进行中/site";
const ctx = { console };
vm.createContext(ctx);
for (const f of ["cards.js", "abilities.js", "factions.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx, { filename: f });
}
const card_dict = vm.runInContext("card_dict", ctx);

const byDeck = {};
for (const [k, c] of Object.entries(card_dict)) {
  const deck = (c.deck || "").split(" ")[0];
  (byDeck[deck] = byDeck[deck] || []).push({ k, name: c.name, ability: c.ability, row: c.row, str: c.strength });
}
const lines = [];
for (const deck of Object.keys(byDeck)) {
  lines.push(`=== ${deck} (${byDeck[deck].length}) ===`);
  for (const c of byDeck[deck]) {
    lines.push(`${c.k}\t${c.name}\t${c.ability}\t${c.row}\t${c.str}`);
  }
}
fs.writeFileSync(path.join(root, "tools", "cards-by-deck.txt"), lines.join("\n"), "utf8");
console.log("decks:", Object.keys(byDeck).length, "total:", Object.keys(card_dict).length, "lines:", lines.length);
