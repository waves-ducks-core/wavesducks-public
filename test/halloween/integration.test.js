const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ride=require('@waves/ride-js');
const issuer='3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
const read=p=>fs.readFileSync(p,'utf8');
function fn(source,name){const start=source.indexOf(`func ${name}(`);assert.ok(start>=0,name);const next=source.slice(start+5).search(/^(@Callable|@Verifier|func )/m);return next<0?source.slice(start):source.slice(start,start+5+next);}
async function exec(source,expression){const repl=ride.repl({nodeUrl:'http://127.0.0.1:1',chainId:'W',address:issuer});const loaded=await repl.evaluate(source.replace(/\bheight\b/g,"testHeight"));assert.equal(loaded.error,undefined,loaded.error);return repl.evaluate(expression);}
function value(r,key,v){assert.equal(r.error,undefined,r.error);assert.ok(r.result.includes(`key = "${key}"\n\tvalue = ${JSON.stringify(v)}`),r.result);}
const runtime=`let fixture = Address(base58'abc')\nlet height = 1000\n`;
test('public duck rebirth reads the configured Phoenix gene only after permanent unlock',async()=>{
  const source=read('ride/ducks/rebirth.ride');
  const branch=source.match(/\}else if \(win == "phoenix"\) then \{\s*(let dark = [\s\S]*?let gene = [^\n]+)/);
  assert.ok(branch,'The reward must remain inside the selected Phoenix outcome.');
  assert.match(fn(source,'getRandomWin'),/phoenixRandom == 1/);
  assert.match(fn(source,'finishRebirthInternal'),/\[address, txId, gene\]/);
  for(const [unlocked,configured,expected] of [[false,'WDARKPHX','WWWWWWWP'],[true,'WDARKPHX','WDARKPHX'],[true,'WNEWGENE','WNEWGENE'],[true,null,'WWWWWWWP']]){
    const defs=runtime+`func getOracle()=fixture
func getIncubatorAddress()=fixture
func mockBoolean(a:Address,k:String)=if a==fixture && k=="h26_darkPhoenixUnlocked" then ${unlocked} else throw("wrong unlock source")
func mockString(a:Address,k:String)=if !${unlocked} then throw("unlocked gene must not be read early") else if a==fixture && k=="phoenix_gen_abc" then ${configured===null?'unit':JSON.stringify(configured)} else throw("wrong gene key")
func selectedGene()={
${branch[1].replace(/getBoolean\(/g,'mockBoolean(').replace(/getString\(/g,'mockString(').replace(/\bthis\b/g,'fixture')}
gene
}
`;
    const result=await exec(defs,'selectedGene()');assert.equal(result.error,undefined,result.error);
    assert.ok(result.result.endsWith(`= "${expected}"`),result.result);
  }
});

test('duck gene parsing accepts data overrides and retains historical fallback without a J-wide rule',async()=>{
  const source=read('ride/ducks/breeder.ride'),parser=fn(source,'getGenFromName');
  assert.doesNotMatch(parser,/DUCK-WDARKPHX|DUCK-WWWWWWWP/);
  const helpers=[...new Set(parser.match(/isSymbol[A-Z]/g))].map(n=>fn(source,n)).join('\n')+fn(source,'getAmountOrClear');
  const defs=runtime+`func getOracle()=fixture
func tryGetStringExternal(a:Address,k:String)=if a!=fixture then throw("wrong oracle") else if k=="farm_gen_DUCK-WWWWWWWP-JU" || k=="farm_gen_DUCK-WDARKPHX-JU" then "8W-J" else if k=="farm_gen_DUCK-ZCUSTOM8-JU" then "CUSTOM-J" else ""
`+helpers+parser;
  for(const [name,expected] of [['DUCK-WWWWWWWP-JU','8W-J'],['DUCK-WDARKPHX-JU','8W-J'],['DUCK-ZCUSTOM8-JU','CUSTOM-J'],['DUCK-AAAAAAAA-GA','8A-G'],['DUCK-WPBRDUCK-JU','1B1C1D1K1P-J']]){
    const result=await exec(defs,`getGenFromName("${name}")`);assert.equal(result.error,undefined,result.error);assert.ok(result.result.includes(`"${expected}"`),result.result);
  }
});

for(const gene of ['WWWWWWWP','WDARKPHX'])test(`${gene}: configured mint, parse, rebirth and rescue share 8W-J while preserving name counts`,async()=>{
  const incubator=read('ride/ducks/incubator.ride'),breeder=read('ride/ducks/breeder.ride'),rebirth=read('ride/ducks/rebirth.ride');
  const parser=fn(breeder,'getGenFromName');
  const parserHelpers=[...new Set(parser.match(/isSymbol[A-Z]/g))].map(n=>fn(breeder,n)).join('\n')+fn(breeder,'getAmountOrClear');
  const keys=['getHatchingStatusKey','getHatchingFinishHeightKey','getDuckIdKey','getDuckStatsKey'].map(n=>fn(incubator,n)).join('\n');
  const mutations=['issueJackpot','reduceRarity','increaseRarity'].map(n=>fn(incubator,n)).join('\n');
  const readers=['getAssetOrigin','getAssetRarity','getAssetFarmingPower'].map(n=>fn(rebirth,n)).join('\n');
  const other=gene==='WWWWWWWP'?'WDARKPHX':'WWWWWWWP';
  const state={'stats_8W-J_quantity':7,[`stats_DUCK-${other}-JU_amount`]:2,'stats_DUCK-WPBRDUCK-JU_amount':5,'stats_1B1C1D1K1P1R1U1W-J_quantity':1};
  const replace=s=>s.replace(/\bthis\b/g,'fixture').replace(/\bgetString\(/g,'mockString(').replace(/\bgetIntegerValue\(/g,'mockIntegerValue(').replace(/\bassetInfo\(/g,'mockAsset(').replace(/\binvoke\(/g,'mockInvoke(').replace(/asset\.calculateAssetId\(\)/g,"base58'AB'");
  async function call(expression){
    const entries=Object.entries(state).map(([k,v])=>`${typeof v==='number'?'Integer':'String'}Entry(${JSON.stringify(k)},${JSON.stringify(v)})`).join(',');
    const defs=runtime+`let data=[${entries}]
let oracleData=[StringEntry("farm_gen_DUCK-WWWWWWWP-JU","8W-J"),StringEntry("farm_gen_DUCK-WDARKPHX-JU","8W-J")]
let i=Invocation([],Address(base58'xyz'),base58'abc',base58'dEf',0,unit,fixture,base58'abc')
let HatchingFinished="finish"
func getOracle()=fixture
func getRebirthAddress()=Address(base58'xyz')
func getCouponsAddress()=Address(base58'2')
func getIncubatorAddress()=fixture
func getBreederAddress()=Address(base58'3')
func countEggsNeededAmount(n:Int)=100000000
func tryGetInteger(k:String)=getInteger(data,k).valueOrElse(0)
func tryGetString(k:String)=getString(data,k).valueOrElse("")
func mockString(a:Address,k:String)=if a!=fixture then throw("wrong oracle") else getString(oracleData,k)
func tryGetStringExternal(a:Address,k:String)=mockString(a,k).valueOrElse("")
func mockIntegerValue(a:Address,k:String)=if a!=fixture then throw("wrong rarity contract") else getInteger(data,k).value()
func mockAsset(id:ByteVector)=Asset(id,1,0,fixture,base58'abc',false,false,unit,"DUCK-${gene}-JU","")
`+replace(parserHelpers+parser)+`
func mockInvoke(a:Address,m:String,args:List[String],p:List[AttachedPayment])=if a==getBreederAddress() && m=="getGenFromName" then getGenFromName(args[0])._2 else throw("unexpected invoke")
`+replace(keys+mutations+readers);
    return exec(defs,expression);
  }
  function apply(result){assert.equal(result.error,undefined,result.error);for(const match of result.result.matchAll(/key = "([^"]+)"\n\tvalue = ("[^"]*"|-?\d+)/g))state[match[1]]=JSON.parse(match[2]);}
  function untouched(){assert.equal(state[`stats_DUCK-${other}-JU_amount`],2);assert.equal(state['stats_DUCK-WPBRDUCK-JU_amount'],5);assert.equal(state['stats_1B1C1D1K1P1R1U1W-J_quantity'],1);assert.equal(state['stats_WDARKPHX-J_quantity'],undefined);}
  apply(await call(`issueJackpot("${issuer}","abc","${gene}")`));assert.equal(state['stats_8W-J_quantity'],8);assert.equal(state[`stats_DUCK-${gene}-JU_amount`],1);untouched();
  const parsed=await call(`getGenFromName("DUCK-${gene}-JU")`);assert.equal(parsed.error,undefined,parsed.error);assert.ok(parsed.result.includes('"8W-J"'));
  const power=await call('getAssetFarmingPower("AB".fromBase58String())');assert.equal(power.error,undefined,power.error);assert.ok(power.result.includes('"8W-J"'));
  apply(await call('reduceRarity("AB","8W-J")'));assert.equal(state['stats_8W-J_quantity'],7);assert.equal(state[`stats_DUCK-${gene}-JU_amount`],0);untouched();
  apply(await call('increaseRarity("AB","8W-J")'));assert.equal(state['stats_8W-J_quantity'],8);assert.equal(state[`stats_DUCK-${gene}-JU_amount`],1);untouched();
});

test('duck issuer and rarity decrement preserve old fallbacks and accept arbitrary configured buckets',async()=>{
  const source=read('ride/ducks/incubator.ride');
  const keys=['getHatchingStatusKey','getHatchingFinishHeightKey','getDuckIdKey','getDuckStatsKey'].map(n=>fn(source,n)).join('\n');
  const methods=(keys+fn(source,'issueJackpot')+fn(source,'reduceRarity')).replace(/\bthis\b/g,'fixture').replace(/\bgetString\(/g,'mockString(').replace(/\bassetInfo\(/g,'mockAsset(').replace(/asset\.calculateAssetId\(\)/g,"base58'AB'");
  for(const [gene,mapping,mintBucket,burnBucket] of [['WPBRDUCK',null,'8W-J','8W-G'],['ZCUSTOM8','CUSTOM-J','CUSTOM-J','CUSTOM-J']]){
    const defs=runtime+`let i=Invocation([],Address(base58'xyz'),base58'abc',base58'dEf',0,unit,fixture,base58'abc')
let HatchingFinished="finish"
func getOracle()=fixture
func getRebirthAddress()=Address(base58'xyz')
func getCouponsAddress()=Address(base58'2')
func countEggsNeededAmount(n:Int)=100000000
func tryGetInteger(k:String)=10
func tryGetString(k:String)=""
func mockString(a:Address,k:String)=if a==fixture && k=="farm_gen_DUCK-${gene}-JU" then ${mapping===null?'unit':JSON.stringify(mapping)} else throw("wrong map key")
func mockAsset(id:ByteVector)=Asset(id,1,0,fixture,base58'abc',false,false,unit,"DUCK-${gene}-JU","")
`+methods;
    value(await exec(defs,`issueJackpot("${issuer}","abc","${gene}")`),`stats_${mintBucket}_quantity`,11);
    value(await exec(defs,`reduceRarity("AB","unused")`),`stats_${burnBucket}_quantity`,9);
  }
});
for(const [family,gene,prefix,idKey,statsKey,rarity] of [
  ['ducks','WDARKPHX','DUCK','getDuckIdKey','getDuckStatsKey','8W-J'],
  ['turtle','WWIZARDT','TRTL','getTRTLIdKey','getStatsKey','8W-J'],
  ['bulls','WMOLDYMT','BULL','getIdKey','getStatsKey','8W-J'],
])test(`${family} generic jackpot preserves self/rebirth authority and rejects replay`,async()=>{
  const source=read(`ride/${family}/incubator.ride`);
  const methods=['getHatchingStatusKey','getHatchingFinishHeightKey',idKey,statsKey,'issueJackpot'].map(name=>fn(source,name)).join('\n')
    .replace(/\bthis\b/g,'fixture').replace(/asset\.calculateAssetId\(\)/g,"base58'AB'").replace(/\bgetString\(/g,'mockString(');
  for(const caller of ['abc','xyz','2']){
    const state={};
    async function invoke(){
      const entries=Object.entries(state).map(([key,value])=>`${typeof value==='number'?'Integer':'String'}Entry(${JSON.stringify(key)},${JSON.stringify(value)})`).join(',');
      const mocks=runtime+`let data=[${entries}]
let i=Invocation([],Address(base58'${caller}'),base58'abc',base58'dEf',0,unit,fixture,base58'abc')
let HatchingFinished="finish"
let multiplier=1000000
func getRebirthAddress()=Address(base58'xyz')
func getTurtleRebirthAddress()=Address(base58'xyz')
func countEggsNeededAmount(amount:Int)=100000000
func getOracle()=fixture
func mockString(a:Address,k:String)=unit
func tryGetInteger(key:String)=getInteger(data,key).valueOrElse(0)
func tryGetString(key:String)=getString(data,key).valueOrElse("")
`;
      return exec(mocks+methods,`issueJackpot("${issuer}","abc","${gene}")`);
    }
    const minted=await invoke();
    if(caller==='2'){assert.ok(minted.error?.includes('admin or rebirth only'),minted.error);continue;}
    assert.equal(minted.error,undefined,minted.error);
    assert.ok(minted.result.includes(`name = "${prefix}-${gene}-JU"`),minted.result);
    value(minted,`stats_${prefix}-${gene}-JU_amount`,1);
    value(minted,`stats_${rarity}_quantity`,1);
    for(const match of minted.result.matchAll(/key = "([^"]+)"\n\tvalue = ("[^"]*"|-?\d+)/g))state[match[1]]=JSON.parse(match[2]);
    const replay=await invoke();
    assert.ok(replay.error?.includes('override following duckId'),replay.error);
  }
});

test('Dark Phoenix unlock is campaign-only, payment-free and monotonic',async()=>{
  for(const family of ['ducks']){
    let unlock=fn(read(`ride/${family}/incubator.ride`),'unlockHalloween').replace(/getStringValue\(/g,'mockStringValue(');
    for(const [caller,payments,allowed] of [['abc','[]',true],['xyz','[]',false],['abc',"[AttachedPayment(unit,1)]",false]]){
      const defs=runtime+`let i=Invocation(${payments},Address(base58'${caller}'),base58'abc',base58'abc',0,unit,fixture,base58'abc')\nfunc getOracle()=fixture\nfunc mockStringValue(a:Address,k:String)="abc"\n`+unlock;
      const result=await exec(defs,'unlockHalloween()');if(allowed)value(result,'h26_darkPhoenixUnlocked',true);else assert.ok(result.error?.includes('campaign only'));
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
func getTurtleStakedPower(a:String)=0
func keyUnstakeHeight(kind:String,id:String)=kind+id
func keyArtefactOwner(kind:String,owner:String)=kind+"_"+owner+"_owner"
func mockInvoke(a:Address,method:String,args:List[String|Int],p:List[AttachedPayment])=if method=="checkArtefactDetails" then "ART-H26FEED" else if method=="manipulateBoostAccountBull" && args[0].exactAs[Int]==${call.startsWith('stake')?3:-3} then "boost applied" else throw("unexpected boost target or amount")
`;
  return exec(runtime+mocks+functions,call);
}
test('Pumpkin Feed escrow updates bull boost and rejects duplicate/wrong payments',async()=>{
  value(await boosterCall('stakeItem()'),'ART-H26FEED_abc_owner','abc');
  for(const options of [{staked:'xyz'},{payments:'[]'},{payments:"[AttachedPayment(base58'abc',2),AttachedPayment(unit,100)]"},{payments:"[AttachedPayment(base58'abc',1),AttachedPayment(unit,99)]"}]) assert.ok((await boosterCall('stakeItem()',options)).error);
});
test('Pumpkin Feed removal follows Lake without a bull-position guard',async()=>{
  const result=await boosterCall('unstakeItem("ART-H26FEED")',{staked:'xyz'});assert.equal(result.error,undefined,result.error);assert.ok(result.result.includes('ScriptTransfer('));assert.ok(result.result.includes('DeleteEntry('));
  assert.doesNotMatch(booster,/bullStakedPower|Unstake bulls/);
  assert.ok((await boosterCall('unstakeItem("ART-H26FEED")',{staked:''})).error);
});

test('bull-only boost helper enforces trusted callers and cannot underflow',async()=>{
  const source=read('ride/artefacts/items.ride');
  const methods=['key_externalBoostAddressBull','manipulateBoostAccountBull','calculateFarmingPowerBoostBull'].map(n=>fn(source,n)).join('\n');
  for(const [trusted,current,delta,allowed] of [[true,0,3,true],[true,3,-3,true],[true,0,-3,false],[false,0,3,false]]){
    const defs=runtime+`let i=Invocation([],fixture,base58'abc',base58'xyz',0,unit,fixture,base58'abc')
func getTrustedContracts()="${trusted?'abc':'xyz'}"
func tryGetInteger(k:String)=if k=="abc_user_external_boost_bull" then ${current} else throw("wrong species key")
`+methods;
    const result=await exec(defs,`manipulateBoostAccountBull(${delta},"abc")`);
    if(allowed)value(result,'abc_user_external_boost_bull',current+delta);else assert.ok(result.error);
    const readback=await exec(defs,'calculateFarmingPowerBoostBull("abc")');assert.equal(readback.error,undefined,readback.error);assert.ok(readback.result.includes(`_2 = ${current}`),readback.result);
  }
});


test('Halloween wearable registrations have slots and boost values with public sales disabled',()=>{
  const items=JSON.parse(read('ride/artefacts/items-halloween2026.json')).data;
  const boosts=JSON.parse(read('ride/artefacts/wearables-halloween2026.json')).data;
  const get=(entries,key)=>entries.find(e=>e.key===key)?.value;
  for(const [name,slot,boost] of [['ART-H26SWORD','RIGHT_WING',30],['ART-H26CAT','PET',5],['ART-H26ARMOR','TOP',30]]){
    assert.equal(typeof get(items,`direct_cosmetic_${name}`),'number');
    assert.equal(get(items,`direct_cosmetic_${name}_sale`),false);
    assert.equal(get(items,`type_cosmetic_${name}`),slot);
    assert.equal(get(boosts,`boost_${name}`),boost);
  }
  assert.equal(new Set(items.map(e=>e.key)).size,items.length);
});

test('bull farming adds only the bull-specific boost and preserves existing boost components',async()=>{
  const source=read('ride/bulls/farming.ride');
  const calculate=fn(source,'calculateFarmPower').replace(/assetInfo\(/g,'mockAssetInfo(').replace(/\binvoke\(/g,'mockInvoke(');
  for(const bull of [0,3]){
    const defs=runtime+`func getBreederAddress()=fixture
func getIncubatorAddress()=fixture
func getItemsAddress()=fixture
func getWearablesAddress()=fixture
func tryGetBooleanExternal(a:Address,k:String)=false
func isTestEnv()=false
func getAssetRarityComplete(j:Boolean,name:String)=100
func tryGetInteger(k:String)=100
func mockAssetInfo(id:ByteVector)=Asset(id,1,0,fixture,base58'abc',false,false,unit,"BULL-AAAAAAAA-GA","")
func mockInvoke(a:Address,method:String,args:List[String],payments:List[AttachedPayment])=if method=="calculateFarmingPowerBoost" then 5 else if method=="calculateWearblesBoost" then 30 else if method=="calculateFarmingPowerBoostBull" && args[0]=="owner" then ${bull} else throw("unexpected boost invocation")
`+calculate;
    const result=await exec(defs,'calculateFarmPower("abc","owner")');assert.equal(result.error,undefined,result.error);assert.ok(result.result.includes(`_1 = ${108+bull}`),result.result);
  }
  for(const family of ['ducks','cani','feli','eagl'])assert.doesNotMatch(read(`ride/${family}/farming${family==='ducks'?'V2':''}.ride`),/calculateFarmingPowerBoostBull/);
  assert.doesNotMatch(source,/registerPumpkinPosition|h26_origin_/);
});


test('coupons claims reuse issueArtefactIndex with the intended recipient and nonce',async()=>{
  const mint=fn(read('ride/coupons.ride'),'mint').replace(/\binvoke\(/g,'mockInvoke(');
  const defs=runtime+`func getItemsAddress()=fixture
func mockInvoke(a:Address,method:String,args:List[String|Int],p:List[AttachedPayment])=if method=="issueArtefactIndex" && args==["ART-H26SOUL","abc",0] && size(p)==0 then "issued" else throw("wrong issuance route")
`+mint;
  const result=await exec(defs,'mint("ART-H26SOUL",fixture,0)');assert.equal(result.error,undefined,result.error);assert.ok(result.result.endsWith('= "issued"'));
});
