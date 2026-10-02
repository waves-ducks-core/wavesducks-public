// Compile the full sibling families and fail on RIDE deployment limits.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const ride = require('@waves/ride-js');
// Feature #17 raises every dApp limit to 163840 bytes, including Ride V5.
// https://docs.waves.tech/en/blockchain/binary-format/transaction-binary-format/set-script-transaction-binary-format
// Deployment also verifies activation on the target network before using this limit.
const maxDAppSize = 160 * 1024;
const families = ['ducks','turtle','cani','feli','eagl','bulls'];
const files = ['ride/coupons.ride','ride/artefacts/items.ride','ride/artefacts/accBooster.ride','ride/mutants/breeder.ride',
  ...families.flatMap(f=>fs.readdirSync(`ride/${f}`).filter(p=>p.endsWith('.ride')).map(p=>`ride/${f}/${p}`))];
const surfboard = path.resolve(require.resolve('@waves/surfboard/package.json'), '../bin/run');
function callableNames(source) {
  return [...source.matchAll(/^\s*@Callable\s*\([^)]*\)\s*func\s+(\w+)\s*\(([^)]*)\)/gm)]
    .map(([, name, args]) => [name, args.split(',').map(arg => arg.trim().split(':')[0].trim()).filter(Boolean)]);
}
let failed = false;
for (const file of files) {
  // Repository-required normal surfboard compile. Some surfboard versions return 0 on compiler errors.
  const result = spawnSync(process.execPath,[surfboard,'compile',file],{encoding:'utf8',env:{...process.env,NO_UPDATE_NOTIFIER:'1'}});
  if (result.status || /was not compiled|Error message:/.test(result.stdout+result.stderr)) {
    console.error(file,result.stdout,result.stderr);failed=true;continue;
  }
  // Preserve original function, argument, and variable names; remove unused declarations only.
  const source = fs.readFileSync(file,'utf8');
  const compiled = ride.compile(source,3,false,true);
  if (compiled.error || compiled.result.size > maxDAppSize) {
    console.error(file,compiled.error || `compiled size ${compiled.result.size} exceeds ${maxDAppSize}`);failed=true;continue;
  }
  const decompiled = ride.decompile(compiled.result.base64);
  if (decompiled.error || JSON.stringify(callableNames(source)) !== JSON.stringify(callableNames(decompiled.result))) {
    console.error(file, decompiled.error || 'Callable method/argument names changed');failed=true;continue;
  }
  console.log(`${file}: surfboard and callable names OK; name-preserving bytes=${compiled.result.size}, complexity=${compiled.result.complexity}`);
}
if(failed) process.exitCode=1;
