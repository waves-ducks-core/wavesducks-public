// Compile the full sibling families and fail on RIDE deployment limits.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const ride = require('@waves/ride-js');
const families = ['ducks','turtle','cani','feli','eagl','bulls'];
const files = ['ride/coupons.ride','ride/artefacts/items.ride','ride/artefacts/accBooster.ride',
  ...families.flatMap(f=>fs.readdirSync(`ride/${f}`).filter(p=>p.endsWith('.ride')).map(p=>`ride/${f}/${p}`))];
const surfboard = path.resolve(require.resolve('@waves/surfboard/package.json'), '../bin/run');
let failed = false;
for (const file of files) {
  // Repository-required normal surfboard compile. Some surfboard versions return 0 on compiler errors.
  const result = spawnSync(process.execPath,[surfboard,'compile',file],{encoding:'utf8',env:{...process.env,NO_UPDATE_NOTIFIER:'1'}});
  if (result.status || /was not compiled|Error message:/.test(result.stdout+result.stderr)) {
    console.error(file,result.stdout,result.stderr);failed=true;continue;
  }
  // Deploy compaction is mandatory for large existing legacy dApps.
  const compiled = ride.compile(fs.readFileSync(file,'utf8'),3,true,true);
  if (compiled.error || compiled.result.size > 32768) {
    console.error(file,compiled.error || `compiled size ${compiled.result.size} exceeds 32768`);failed=true;continue;
  }
  console.log(`${file}: surfboard OK; compact bytes=${compiled.result.size}, complexity=${compiled.result.complexity}`);
}
if(failed) process.exitCode=1;
