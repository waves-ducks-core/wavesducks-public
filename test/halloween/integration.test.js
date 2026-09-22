const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ride=require('@waves/ride-js');const crypto=require('@waves/ts-lib-crypto');const nodeCrypto=require('node:crypto');
const issuer='3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
const read=p=>fs.readFileSync(p,'utf8');
function fn(source,name){const start=source.indexOf(`func ${name}(`);assert.ok(start>=0,name);const next=source.slice(start+5).search(/^(@Callable|@Verifier|func )/m);return next<0?source.slice(start):source.slice(start,start+5+next);}
async function exec(source,expression){const repl=ride.repl({nodeUrl:'http://127.0.0.1:1',chainId:'W',address:issuer});const loaded=await repl.evaluate(source.replace(/\bheight\b/g,"testHeight"));assert.equal(loaded.error,undefined,loaded.error);return repl.evaluate(expression);}
function value(r,key,v){assert.equal(r.error,undefined,r.error);assert.ok(r.result.includes(`key = "${key}"\n\tvalue = ${JSON.stringify(v)}`),r.result);}
const runtime=`let fixture = Address(base58'abc')\nlet height = 1000\n`;
for(const [family,denominator] of [['turtle',200],['bulls',1000]]) test(`${family} real Ride jackpot selector: historical probability, cap2, calendar and pause`,async()=>{
  const source=read(`ride/${family}/breeder.ride`);
  let callable=fn(source,'halloweenJackpot').replace(/getString\(/g,'mockString(').replace(/getBoolean\(/g,'mockBoolean(').replace(/getInteger\(/g,'mockInteger(').replace(/blockInfoByHeight\(/g,'mockBlock(').replace(/lastBlock.timestamp/g,'now').replace(/\bthis\b/g,'fixture');
  // Find a winning initial ID against the exact campaign-domain + block VRF formula.
  let winner;
  for(let k=1;k<20000;k++){const tx=Buffer.alloc(8);tx.writeBigInt64BE(BigInt(k));const digest=nodeCrypto.createHash('sha256').update(Buffer.concat([Buffer.from('h26-jackpot'),tx,Buffer.from(crypto.base58Decode('abc'))])).digest();if((digest.readBigInt64BE()%BigInt(denominator)+BigInt(denominator))%BigInt(denominator)===1n){winner=crypto.base58Encode(tx);break;}}
  assert.ok(winner);
  for(const [count,enabled,now,expected] of [[0,true,500,true],[1,true,500,true],[2,true,500,false],[0,false,500,false],[0,true,99,false],[0,true,1000,false]]){
    const mocks=`let now=${now}
func getOracle()=fixture
func mockString(a:Address,k:String)="${issuer}"
func mockBoolean(a:Address,k:String)=${enabled}
func mockInteger(a:Address,k:String)=if k=="h26_start" then 100 else if k=="h26_end" then 1000 else ${count}
func mockBlock(h:Int)=BlockInfo(500,h,1,base58'abc',fixture,base58'abc',base58'abc',[])
`;
    const result=await exec(runtime+mocks+callable,`halloweenJackpot(base58'${winner}',10)`);assert.equal(result.error,undefined,result.error);assert.ok(result.result.endsWith(`= ${expected}`),result.result);
  }
  assert.match(source,/IntegerEntry\("h26_jackpot_issued", getInteger\(this,"h26_jackpot_issued"\)\.valueOrElse\(0\)\+1\)/);
});
test('bull genesis rotation retains exactly four current genes and all old genes',async()=>{
  let select=fn(read('ride/bulls/incubator.ride'),'select').replace(/getBoolean\(/g,'mockBoolean(').replace(/\bthis\b/g,'fixture');
  for(const unlocked of [false,true]){
    const defs=runtime+`func mockBoolean(a:Address,k:String)=${unlocked}\n`+select;
    const result=await exec(defs,'select("A")');assert.equal(result.error,undefined,result.error);
    const expected=unlocked?'BULL-FFFFFFFF-GA':'BULL-BBBBBBBB-GA';assert.ok(result.result.includes(expected));
    const count=await exec(defs,'size(select("A")._2)');assert.ok(count.result.endsWith('= 4'));
    const old=await exec(defs,'size(select("A")._1)');assert.ok(old.result.endsWith(unlocked?'= 6':'= 5'));
  }
});
test('incubator unlocks are campaign-only, payment-free and monotonic',async()=>{
  for(const family of ['bulls','ducks']){
    let unlock=fn(read(`ride/${family}/incubator.ride`),'unlockHalloween').replace(/getStringValue\(/g,'mockStringValue(');
    for(const [caller,payments,allowed] of [['abc','[]',true],['xyz','[]',false],['abc',"[AttachedPayment(unit,1)]",false]]){
      const defs=runtime+`let i=Invocation(${payments},Address(base58'${caller}'),base58'abc',base58'abc',0,unit,fixture,base58'abc')\nfunc getOracle()=fixture\nfunc mockStringValue(a:Address,k:String)="abc"\n`+unlock;
      const result=await exec(defs,'unlockHalloween()');if(allowed)value(result,family==='bulls'?'h26_genesisUnlocked':'h26_darkPhoenixUnlocked',true);else assert.ok(result.error?.includes('campaign only'));
    }
  }
});
const booster=read('ride/artefacts/accBooster.ride');
async function boosterCall(call,options={}){
  const payments=options.payments??(call.startsWith('stake')?"[AttachedPayment(base58'abc',1),AttachedPayment(unit,100)]":"[AttachedPayment(unit,100)]");
  let functions=['itemIsInCoolDown','checkAdditionalPayment','stakeItem','unstakeItem'].map(n=>fn(booster,n)).join('\n').replace(/\binvoke\(/g,'mockInvoke(').replace(/getIntegerValue\(/g,'mockIntegerValue(');
  const mocks=`let i=Invocation(${payments},fixture,base58'abc',base58'xyz',0,unit,fixture,base58'abc')
let stakeable=["ART-H26FEED","ART-LAKE","ART-FTCAST","ART-XSOCK"]
func getOracle()=fixture
func getItemsAddress()=fixture
func getFeeAggregator()=fixture
func staticKey_extraFee()="fee"
func mockIntegerValue(a:Address,k:String)=100
func tryGetInteger(k:String)=0
func tryGetString(k:String)=${JSON.stringify(options.staked??'')}
func bullStakedPower(a:String)=${options.bulls??0}
func getTurtleStakedPower(a:String)=0
func keyUnstakeHeight(kind:String,id:String)=kind+id
func keyArtefactOwner(kind:String,owner:String)=kind+"_"+owner+"_owner"
func mockInvoke(a:Address,method:String,args:List[String|Int],p:List[AttachedPayment])="ART-H26FEED"
`;
  return exec(runtime+mocks+functions,call);
}
test('Pumpkin Feed escrow rejects duplicate, wrong payments and open bull positions',async()=>{
  value(await boosterCall('stakeItem()'),'ART-H26FEED_abc_owner','abc');
  for(const options of [{staked:'xyz'},{bulls:1},{payments:'[]'},{payments:"[AttachedPayment(base58'abc',2),AttachedPayment(unit,100)]"},{payments:"[AttachedPayment(base58'abc',1),AttachedPayment(unit,99)]"}]) assert.ok((await boosterCall('stakeItem()',options)).error);
});
test('Pumpkin Feed cannot leave escrow with direct or proxy bull positions',async()=>{
  const result=await boosterCall('unstakeItem("ART-H26FEED")',{staked:'xyz'});assert.equal(result.error,undefined,result.error);assert.ok(result.result.includes('ScriptTransfer('));assert.ok(result.result.includes('DeleteEntry('));
  assert.ok((await boosterCall('unstakeItem("ART-H26FEED")',{staked:'xyz',bulls:1})).error?.includes('Unstake bulls'));
  assert.ok((await boosterCall('unstakeItem("ART-H26FEED")',{staked:''})).error);
});
test('all supported families call completion inside successful finish paths',()=>{
  for(const family of ['ducks','turtle','cani','feli','eagl','bulls']){
    assert.match(read(`ride/${family}/breeder.ride`),/strict halloweenDrop = halloweenCompletion\(/);
    const rebirth=read(`ride/${family}/${family==='bulls'?'incubator':'rebirth'}.ride`);
    assert.match(rebirth,/strict halloweenDrop = halloweenCompletion\(address, initTx, finishBlock\)/);
  }
  assert.match(read('ride/ducks/breeder.ride'),/halloweenCompletion\(owner, txIdStr, processFinishHeight\)/);
});
test('reserved breeding jackpots preserve canonical rarity stats for later burn/deposit',async()=>{
  for(const [family,gene] of [['bulls','BULL-WMOLDYMT-JU'],['turtle','TRTL-WWIZARDT-JU']]){
    const source=read(`ride/${family}/breeder.ride`);const body=fn(source,'getGenFromName');
    const helpers=[...new Set(body.match(/isSymbol[A-Z]/g))].map(name=>fn(source,name)).join('\n')+fn(source,'getAmountOrClear');
    const result=await exec(helpers+body,`getGenFromName("${gene}")`);assert.equal(result.error,undefined,result.error);assert.ok(result.result.includes('"8W-J"'));
  }
});
