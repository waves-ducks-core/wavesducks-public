const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ride=require('@waves/ride-js');
const source=fs.readFileSync('ride/artefacts/items.ride','utf8');
const config=JSON.parse(fs.readFileSync('ride/artefacts/items-halloween2026.json','utf8')).data;
const address='3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
function fn(name){const start=source.indexOf(`func ${name}(`);assert.ok(start>=0,name);const next=source.slice(start+5).search(/^(@Callable|@Verifier|func )/m);return next<0?source.slice(start):source.slice(start,start+5+next);}
const names=['halloweenItem','issueItem','itemMerger','getBaseItem','getAmountBaseItem','getSecondaryItem','getAmountSecondaryItem','getGenValue','getDucklingsPercent','getEndItem','getPrice','getInstant','getAsset',...['price','maxSales','sale','priceAsset','growPercentage','burn','sold','lastPrice','startTs','endTs'].map(s=>`key_${s}Cosmetic`),'tryGetCosmeticItemPrice','checkAdditionalPayment','instanMergeItem','directBuyItem','directBuyItemMultiple'];
let methods=names.map(fn).join('\n').replace('getIntegerValue(getOracle(),staticKey_extraFee())','100').replace(/\bthis\b/g,'fixture').replace(/lastBlock.timestamp/g,'now').replace(/\binvoke\(/g,'mockInvoke(').replace(/\bassetInfo\(/g,'mockAsset(').replace(/\bgetIntegerValue\(/g,'mockIntegerValue(').replace(/\bgetStringValue\(/g,'mockStringValue(').replace(/\bgetBooleanValue\(/g,'mockBooleanValue(').replace(/\bgetInteger\(/g,'mockInteger(');
// The offline REPL cannot calculate issued IDs without a transaction environment.
methods=methods.replace(/artefact\.calculateAssetId\(\)/g,"base58'AB'");
const ids=['dEf','xyz','2','3','4','5','6','7','8','9'];
async function run(call,opts={}){
 const data=Object.fromEntries(config.map(e=>[e.key,e.value]));
 Object.assign(data,{h26_enabled:true,h26_start:100,h26_end:1000,h26_recipes:true,h26_milestone_400:true,h26_milestone_600:true},opts.data);
 const entries=Object.entries(data).map(([k,v])=>`${typeof v==='boolean'?'Boolean':typeof v==='number'?'Integer':'String'}Entry(${JSON.stringify(k)},${JSON.stringify(v)})`).join(',');
 const assets=opts.assets??[];
 const payments=opts.payments??assets.map((a,j)=>[ids[j],1]);
 const p=payments.map(([id,n])=>`AttachedPayment(${id===null?'unit':`base58'${id}'`},${n})`).join(',');
 const assetName=assets.map((a,j)=>`if id==base58'${ids[j]}' then ${JSON.stringify(a)} else `).join('')+'"unknown"';
 const mocks=`let fixture=addressFromStringValue("${address}")
let now=${opts.now??500}
let data=[${entries}]
let i=Invocation([${p}],fixture,base58'abc',base58'dEf',0,unit,fixture,base58'abc')
let Generations=["G"]
func getOracle()=fixture
func getCouponsAddress()=fixture
func getEggAssetId()=base58'abc'
func getPeteAssetId()=base58'AB'
func getFeeAggregator()=fixture
func getBurnAddress()=fixture
func getBreederAddress()=Address(base58'AB')
func getBabyduckAddress()=Address(base58'AB')
func tryGetString(k:String)=getString(data,k).valueOrElse("")
func tryGetInteger(k:String)=getInteger(data,k).valueOrElse(0)
func tryGetBoolean(k:String)=getBoolean(data,k).valueOrElse(false)
func tryGetBooleanExternal(a:Address,k:String)=tryGetBoolean(k)
func tryGetIntegerExternal(a:Address,k:String)=tryGetInteger(k)
func mockIntegerValue(k:String)=getInteger(data,k).value()
func mockStringValue(k:String)=getString(data,k).value()
func mockBooleanValue(k:String)=getBoolean(data,k).value()
func mockInteger(a:Address,k:String)=getInteger(data,k)
func mockAsset(id:ByteVector)=Asset(id,${opts.quantity??1},0,${opts.counterfeit?"Address(base58'AB')":'fixture'},base58'abc',false,false,unit,${assetName},"")
func mockInvoke(a:Address,method:String,args:List[String],p:List[AttachedPayment])=if method=="checkArtefactDetails" then mockAsset(args[0].fromBase58String()).name else if method=="burnAttachedPayments" then (if size(p)!=1 || p[0].amount!=${opts.expectedBurn??100000000} || p[0].assetId!=base58'abc' then throw("unexpected burn amount") else "burned") else "ok"
`;
 const repl=ride.repl({nodeUrl:'http://127.0.0.1:1',chainId:'W',address});
 const loaded=await repl.evaluate(mocks+methods);assert.equal(loaded.error,undefined,loaded.error);
 return repl.evaluate(call);
}
function ok(r){assert.equal(r.error,undefined,r.error);return r.result;}
async function fails(call,opts){assert.ok((await run(call,opts)).error,call);}
test('existing direct stores purchase Souls and burn full EGG per NFT',async()=>{
 for(const [call,count] of [['directBuyItem("ART-H26SOUL")',1],['directBuyItemMultiple("ART-H26SOUL",2)',2]]){
  const result=ok(await run(call,{payments:[[null,100],['abc',100000000*count]],expectedBurn:100000000*count}));
  assert.equal((result.match(/Issue\(/g)||[]).length,count);
  // Only the normal WAVES service fee is transferred, all EGG goes to burnAttachedPayments.
  assert.ok(!result.includes('amount = 5000000'));
 }
});
test('existing stores reject closed acquisition, bad economics and reward-item purchases',async()=>{
 for(const call of ['directBuyItem("ART-H26SOUL")','directBuyItemMultiple("ART-H26SOUL",1)']){
  const payments=[[null,100],['abc',100000000]];
  for(const opts of [{now:99},{now:1000},{data:{h26_enabled:false}},{data:{'direct_cosmetic_ART-H26SOUL_burnPercent':95}},{payments:[[null,100],['abc',99999999]]}])await fails(call,{payments,...opts});
 }
 for(const item of ['ART-H26SWORD','ART-H26CAT','ART-H26ARMOR','ART-H26FEED'])await fails(`directBuyItem("${item}")`,{data:{[`direct_cosmetic_${item}_sale`]:true},payments:[[null,100],['abc',0]]});
 await fails('directBuyItemMultiple("ART-H26SOUL",0)',{payments:[[null,100],['abc',0]]});
});
test('all seven configured conversions execute through instanMergeItem',async()=>{
 for(const item of ['ART-BONE','ART-SKELHEAD','ART-BBALL','ART-SNOWBALL','ART-CNDY','ART-GFTW','ART-GFTR']){
  const result=ok(await run(`instanMergeItem("H26-SOUL-${item}")`,{assets:[item]}));
  assert.ok(result.includes('ART-H26SOUL'));assert.equal((result.match(/Burn\(/g)||[]).length,1);
 }
 await fails('instanMergeItem("H26-SOUL-ART-BONE")',{assets:['ART-CAT']});
 await fails('instanMergeItem("H26-SOUL-ART-BONE")',{assets:['ART-BONE'],data:{h26_enabled:false}});
});
test('existing merger handles ten-Soul sword, both upgrades and Cat with exact NFT inputs',async()=>{
 for(const [recipe,assets,out] of [['ART-H26SWORD',Array(10).fill('ART-H26SOUL'),'ART-H26SWORD'],['H26-SWORD-FIRE',['ART-H26SOUL','ART-FIRE_SWORD'],'ART-H26SWORD'],['H26-SWORD-EASTER',['ART-H26SOUL','ART-EAST_SWORD'],'ART-H26SWORD'],['ART-H26CAT',['ART-H26SOUL','ART-H26SOUL','ART-CAT'],'ART-H26CAT']]){
  const result=ok(await run(`instanMergeItem("${recipe}")`,{assets,data:{h26_enabled:false},now:2000}));
  assert.ok(result.includes(out));assert.equal((result.match(/Burn\(/g)||[]).length,assets.length);
  await fails(`instanMergeItem("${recipe}")`,{assets,data:{h26_recipes:false}});
  await fails(`instanMergeItem("${recipe}")`,{assets,data:{h26_milestone_400:false,h26_milestone_600:false}});
  await fails(`instanMergeItem("${recipe}")`,{assets,counterfeit:true});
  await fails(`instanMergeItem("${recipe}")`,{assets,quantity:2});
 }
 await fails('instanMergeItem("ART-H26CAT")',{assets:['ART-H26SOUL','ART-H26SOUL','ART-CAT','ART-BONE']});
 await fails('instanMergeItem("ART-H26SWORD")',{assets:Array(9).fill('ART-H26SOUL')});
});
test('legacy store still uses 95 percent burn unless configured otherwise',async()=>{
 const data={'direct_cosmetic_ART-CAT':100000000,'direct_cosmetic_ART-CAT_sale':true,'direct_cosmetic_ART-CAT_burn':true};
 ok(await run('directBuyItem("ART-CAT")',{data,payments:[[null,100],['abc',100000000]],expectedBurn:95000000}));
});
