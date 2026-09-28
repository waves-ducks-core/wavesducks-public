const fs=require('fs'),assert=require('assert/strict'),cp=require('child_process');
const inc=fs.readFileSync('ride/cani/incubator.ride','utf8'),breed=fs.readFileSync('ride/cani/breeder.ride','utf8');
const old=inc.match(/let oldGenes = (.*)/)[1],current=inc.match(/let newGenes = ([\s\S]*?)\n    \(/)[1];
assert.deepEqual([...old.matchAll(/CANI-([A-Z]{8})/g)].map(m=>m[1]),['AAAAAAAA','BBBBBBBB','CCCCCCCC','DDDDDDDD']);
assert.deepEqual([...current.matchAll(/CANI-([A-Z]{8})/g)].map(m=>m[1]),['EEEEEEEE','FFFFFFFF','GGGGGGGG','HHHHHHHH']);
assert.deepEqual(JSON.parse(breed.match(/let freeGenes = (.*)/)[1]),['A','B','C','D']);
// No callable, payment, authority or asset movement code may change in this release.
for(const[file,src]of [['incubator',inc],['breeder',breed]]){
 const base=cp.execFileSync('git',['show','origin/main2:ride/cani/'+file+'.ride'],{encoding:'utf8'});
 const normalize=s=>s.replace(/func select\(color: String\)=\{[\s\S]*?\n\}/,'GENE_POOL').replace(/let freeGenes = .*/,'RETIRED_GENES');
 assert.equal(normalize(src),normalize(base));
}
console.log('Current/retired pools and unchanged callable authorization/payment/asset-flow checks passed');
const ride = require('@waves/ride-js');
(async () => {
    const repl = ride.repl();
    const select = inc.match(/func select\(color: String\)=\{[\s\S]*?\n\}/)[0];
    await repl.evaluate(select);
    for (const color of ['A', 'B', 'C', 'D']) {
        const result = await repl.evaluate(`select("${color}")`);
        assert.ok(!result.error, JSON.stringify(result));
        const text = JSON.stringify(result);
        assert.ok(text.includes('CANI-HHHHHHHH-G' + color));
        assert.ok(text.includes('8H-G'));
    }
    console.log('Ride select evaluation passed for all four colors');
})().catch(e => { console.error(e); process.exitCode = 1; });
