const fs = require('fs');
let lines = fs.readFileSync('mappings.js', 'utf8').split('\n');

const missingLines = `        2536: "REVAMP",
        2537: "CRM",
        2538: "PICKLING",
        2539: "CGL",
        2540: "ELECTRICAL",
        2541: "ELECTRICAL",
        2542: "ELECTRICAL",
        2622: "ELECTRICAL",
        2543: "SPARE",
        2544: "REWINDING",
        2545: "REVAMP",
        2546: "SPARE",
        2547: "SPARE",
        2548: "CRM",`;

let idx = lines.findIndex(l => l.includes('2535: "SPARE"'));
if (idx !== -1) {
    lines.splice(idx + 1, 0, missingLines);
    fs.writeFileSync('mappings.js', lines.join('\n'));
    console.log("Fixed mappings.js");
} else {
    console.log("Could not find line");
}
