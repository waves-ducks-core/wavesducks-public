// Execute production Ride callable bodies using the official Ride REPL.
// Only blockchain I/O is replaced: state/asset/block reads and cross-dApp mint.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ride = require('@waves/ride-js');
const fullSource = fs.readFileSync('ride/coupons.ride', 'utf8');
function helper(name) {
 const start=fullSource.indexOf(`func ${name}(`);
 const next=fullSource.slice(start+5).search(/^(@Callable|@Verifier|func )/m);
 return fullSource.slice(start,start+5+next);
}
const source = ['tryGetStringExternal','tryGetString','tryGetInteger','tryGetBoolean','getOracle','staticKey_itemsAddress','getItemsAddress'].map(helper).join('\n') + fullSource.split('# Halloween 2026 ritual. Keep campaign keys when redeploying coupons.')[1].split('# End Halloween 2026 ritual.')[0];
const issuer = '3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
let executable = source.replace('getBoolean(key)', 'getBoolean(this, key)').split('@Verifier')[0].replace(/^\{-#.*\n/gm, '').replace(/^@Callable\(i\)\n/gm, '');
executable = executable.replace(/func mint\([^\n]+\n/, 'func mint(kind: String, receiver: Address, nonce: Int) = kind\n');
executable = executable.replace(/func unlockPersistent\([^\n]+\n/, 'func unlockPersistent(oracleKey: String) = true\n');
for (const name of ['getInteger','getBoolean','getString','getStringValue','assetInfo','blockInfoByHeight']) {
  executable = executable.replace(new RegExp('\\b'+name+'\\(', 'g'), 'mock'+name+'(');
}
executable = executable.replace(/\bthis\b/g,'testThis').replace(/lastBlock.timestamp/g,'testNow').replace(/\bheight\b/g,'testHeight');
function entries(data) {
  return Object.entries(data).map(([k,v]) => `${typeof v === 'boolean' ? 'Boolean' : typeof v === 'number' ? 'Integer' : 'String'}Entry(${JSON.stringify(k)},${JSON.stringify(v)})`).join(',');
}
async function evaluate(call, opts = {}) {
  const data = { h26_start:100, h26_end:1000, h26_enabled:true, h26_initialized:true, h26_recipes:true,
    static_oracleAddress:issuer, static_itemsAddress:issuer, static_eggAssetId:'abc', ...opts.data };
  const payments = opts.payments || [];
  const assets = opts.assets || ['ART-H26SOUL'];
  const p = payments.map(([id,amount])=>`AttachedPayment(${id === null ? 'unit' : `base58'${id}'`},${amount})`).join(',');
  const fixture = `let testThis = Address(base58'dEf')
let testNow = ${opts.now ?? 500}
let testHeight = 20
let data = [${entries(data)}]
let i = Invocation([${p}],Address(base58'${opts.caller || 'abc'}'),base58'abc',base58'${opts.tx || 'abc'}',0,unit,Address(base58'abc'),base58'abc')
func mockgetInteger(a: Address,k: String) = getInteger(data,k)
func mockgetString(a: Address,k: String) = getString(data,k)
func mockgetStringValue(a: Address,k: String) = getString(data,k).value()
func mockgetBoolean(a: Address,k: String) = getBoolean(data,k)
func mockassetInfo(id: ByteVector) = Asset(id,${opts.quantity ?? 1},${opts.decimals ?? 0},${opts.counterfeit ? "Address(base58'xyz')" : `addressFromStringValue("${issuer}")`},base58'abc',${opts.reissuable ?? false},false,unit,${assets.length === 1 ? JSON.stringify(assets[0]) : assets.map((n,j)=>`if id == base58'${['abc','dEf','xyz'][j]}' then ${JSON.stringify(n)} else `).join('')+'"unknown"'},"")
func mockblockInfoByHeight(h: Int) = BlockInfo(500,h,1,base58'abc',testThis,base58'abc',base58'abc',[])
`;
  const repl = ride.repl({nodeUrl:'http://127.0.0.1:1',chainId:'W',address:issuer});
  const loaded = await repl.evaluate(fixture+executable);
  assert.equal(loaded.error, undefined, loaded.error);
  return repl.evaluate(call);
}
function value(result, key, expected) {
  assert.equal(result.error, undefined, result.error);
  assert.ok(result.result.includes(`key = "${key}"\n\tvalue = ${JSON.stringify(expected)}`), result.result);
}
async function rejects(call, opts, message) {
  const result = await evaluate(call, opts);
  assert.ok(result.error?.includes(message), JSON.stringify(result));
}
const souls = (n) => Array.from({length:n},(_,j)=>[['abc','dEf','xyz','2','3','4','5','6','7','8','9'][j],1]);
test('contribution burns exact quantity, records ordered receipt and totals', async()=>{
  const result=await evaluate('contribute()', {payments:souls(3)});
  value(result,'h26_total',3);value(result,'h26_user_abc_total',3);value(result,'h26_sequence',1);
  value(result,'h26_receipt_abc','abc;3;1');assert.equal((result.result.match(/Burn\(/g)||[]).length,3);
});
for (const boundary of [200,400,600,800,1000,1200]) {
  test(`milestone ${boundary} activates on boundary, never below`, async()=>{
    const before=await evaluate('contribute()', {payments:souls(1),data:{h26_total:boundary-2}});
    assert.ok(!before.result.includes(`h26_milestone_${boundary}`));
    const after=await evaluate('contribute()', {payments:souls(1),data:{h26_total:boundary-1}});
    value(after,`h26_milestone_${boundary}`,true);
  });
}
test('crossing batch fully counts and settles atomically',async()=>{
  const r=await evaluate('contribute()', {payments:souls(10),data:{h26_total:1199}});
  value(r,'h26_total',1209);value(r,'h26_settled',true);value(r,'h26_user_abc_total',10);
});
for(const [name,opts,message] of [
  ['paused',{data:{h26_enabled:false}},'closed'],['settled',{data:{h26_settled:true}},'closed'],
  ['before start',{now:99},'closed'],['at end',{now:1000},'closed'],
  ['empty',{payments:[]},'1..10'],['too many',{payments:souls(11)},'1..10'],
  ['wrong asset',{assets:['ART-CAT']},'Souls only'],['counterfeit',{counterfeit:true},'invalid item'],
  ['fungible',{quantity:2},'invalid item'],['reissuable',{reissuable:true},'invalid item'],
  ['wrong decimals',{decimals:1},'invalid item'],['wrong amount',{payments:[['abc',2]]},'individual'],
  ['WAVES',{payments:[[null,1]]},'individual'],['duplicate NFT',{payments:[['abc',1],['abc',1]]},'duplicate NFT'],['replay',{data:{h26_receipt_abc:'old'}},'duplicate']
]) test(`contribute rejects ${name}`,()=>rejects('contribute()',{payments:souls(1),...opts},message));
test('start is inclusive',async()=>value(await evaluate('contribute()',{now:100,payments:souls(1)}),'h26_total',1));
test('tie preserves earlier scorer, increase reorders and removes prior entry',async()=>{
  const data={h26_top:'dEf;abc',h26_user_dEf_total:10,h26_user_abc_total:9};
  value(await evaluate('contribute()',{data,payments:souls(1)}),'h26_top','dEf;abc');
  value(await evaluate('contribute()',{data,payments:souls(2)}),'h26_top','abc;dEf');
});
test('new equal scorer cannot displace existing tenth place',async()=>{
  const names=['a','b','c','d','e','f','g','h','i','j'];const data={h26_top:names.join(';')};
  names.forEach(n=>data[`h26_user_${n}_total`]=1);
  value(await evaluate('contribute()',{data,payments:souls(1)}),'h26_top',names.join(';'));
});
test('settlement at day30 works even paused, earlier/repeated settlement rejected',async()=>{
  await rejects('settle()',{},'not ready');
  value(await evaluate('settle()',{now:1000,data:{h26_enabled:false}}),'h26_settled',true);
  await rejects('settle()',{now:1000,data:{h26_settled:true}},'not ready');
});
test('armor claim remains after closure, enforces personal/milestone/once',async()=>{
  const data={h26_milestone_800:true,h26_user_abc_total:10,h26_enabled:false,h26_settled:true};
  value(await evaluate('claimArmor()',{data,now:2000}),'h26_user_abc_armor',true);
  for(const change of [{h26_user_abc_total:9},{h26_milestone_800:false},{h26_user_abc_armor:true}]) await rejects('claimArmor()',{data:{...data,...change}},'unavailable');
});
test('feed claim needs settled top10, remains once after closure',async()=>{
  const data={h26_settled:true,h26_top:'abc',h26_enabled:false};
  value(await evaluate('claimPumpkinFeed()',{data,now:2000}),'h26_user_abc_feed',true);
  for(const change of [{h26_settled:false},{h26_top:'dEf'},{h26_user_abc_feed:true}]) await rejects('claimPumpkinFeed()',{data:{...data,...change}},'unavailable');
});
test('admin operations reject arbitrary callers and attached payments',async()=>{
  await rejects('setEnabled(false)',{},'admin only');
  await rejects('setRecipesEnabled(false)',{},'admin only');
  await rejects('setEnabled(false)',{caller:'dEf',payments:souls(1)},'no payments');
  value(await evaluate('setEnabled(false)',{caller:'dEf'}),'h26_enabled',false);
  await rejects('setEnabled(true)',{caller:'dEf',now:1000},'ended');
});
test('completion relay rejects untrusted caller, invalid finish and replay',async()=>{
  await rejects(`completion("${issuer}","abc",10)`,{},'unauthorized');
  const data={static_breederAddress:'abc'};
  await rejects(`completion("${issuer}","abc",21)`,{data},'premature');
  const result=await evaluate(`completion("${issuer}","abc",10)`,{data});assert.equal(result.error,undefined,result.error);
  const key=result.result.match(/key = "(h26_drop_[^"]+)"/)[1];
  await rejects(`completion("${issuer}","abc",10)`,{data:{...data,[key]:true}},'duplicate');
});
test('ordered interleaved wallets preserve accounting and deterministic top10',async()=>{
  const state={};const totals=new Map();const reached=new Map();let expectedTotal=0;
  const wallets=['abc','dEf','xyz','2','3','4','5','6','7','8','9','A'];
  for(let seq=1;seq<=36;seq++){
    const caller=wallets[(seq*7)%wallets.length];const amount=(seq*3)%10+1;
    // Model serialized chain execution by applying only the returned Ride data actions.
    const tx=wallets[Math.floor(seq/12)]+wallets[seq%12];
    const result=await evaluate('contribute()',{caller,tx,payments:souls(amount),data:state});
    assert.equal(result.error,undefined,result.error);
    for(const match of result.result.matchAll(/key = "([^"]+)"\n\tvalue = ("[^"]*"|true|false|\d+)/g)) state[match[1]]=JSON.parse(match[2]);
    expectedTotal+=amount;totals.set(caller,(totals.get(caller)||0)+amount);reached.set(caller,seq);
    assert.equal(state.h26_total,expectedTotal);
    assert.equal(state.h26_sequence,seq);
    assert.equal([...totals.values()].reduce((a,b)=>a+b,0),state.h26_total);
    for(const [wallet,total] of totals) assert.equal(state[`h26_user_${wallet}_total`],total);
    const expected=[...totals.keys()].sort((a,b)=>totals.get(b)-totals.get(a)||reached.get(a)-reached.get(b)).slice(0,10);
    assert.equal(state.h26_top,expected.join(';'));
  }
});
test('configuration is self-only once, fixes30 days, starts disabled and pins canonical mappings',async()=>{
  const call=`configureHalloween(600)`;
  const opts={caller:'dEf',decimals:8,data:{h26_initialized:false}};
  const result=await evaluate(call,opts);value(result,'h26_end',600+30*86400000);value(result,'h26_enabled',false);value(result,'h26_version',1);
  await rejects(call,{...opts,caller:'abc'},'self-only');
  await rejects(call,{...opts,data:{h26_initialized:true}},'self-only');
  await rejects(`configureHalloween(499)`,opts,'invalid start');
  await rejects(call,{...opts,decimals:6},'eight decimals');
});
test('actual completion rolls39 and40 enforce exact40% boundary without rerolling',async()=>{
  const crypto=require('@waves/ts-lib-crypto');const nodeCrypto=require('node:crypto');
  const rolls=new Map();
  for(let k=1;rolls.size<2&&k<10000;k++){
    const tx=Buffer.alloc(8);tx.writeBigInt64BE(BigInt(k));
    const digest=nodeCrypto.createHash('sha256').update(Buffer.concat([Buffer.from('halloween-2026'),Buffer.from(crypto.base58Decode('abc')),tx,Buffer.from(crypto.base58Decode('abc'))])).digest();
    const roll=Number((digest.readBigInt64BE()%100n+100n)%100n);
    if(roll===39||roll===40)rolls.set(roll,crypto.base58Encode(tx));
  }
  assert.equal(rolls.size,2);
  for(const [roll,tx] of rolls){
    const call=`completion("${issuer}","${tx}",10)`;
    const early=await evaluate(call,{data:{static_breederAddress:'abc'},now:200});
    const late=await evaluate(call,{data:{static_breederAddress:'abc'},now:900});
    assert.equal(early.error,undefined,early.error);assert.equal(late.error,undefined,late.error);
    assert.equal(early.result,late.result);
    assert.equal(early.result.includes('ART-H26SOUL'),roll===39);
  }
});
