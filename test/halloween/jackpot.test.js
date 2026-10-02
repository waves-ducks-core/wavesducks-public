// Execute the production Ride selectors, parsers and completion bodies. State,
// block time and cross-dApp calls are fixtures; this is not a node budget test.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ride = require('@waves/ride-js');
const crypto = require('@waves/ts-lib-crypto');
const nodeCrypto = require('node:crypto');
const owner = '3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
const initialTx = '11111111111111111111111111111111';
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
function fn(source, name) {
  const start = source.indexOf(`func ${name}(`);
  assert.ok(start >= 0, name);
  const next = source.slice(start + 5).search(/^(@Callable|@Verifier|func )/m);
  return (next < 0 ? source.slice(start) : source.slice(start, start + 5 + next)).trim();
}
async function execute(source, expression) {
  const repl = ride.repl({ nodeUrl: 'http://127.0.0.1:1', chainId: 'W', address: owner });
  const loaded = await repl.evaluate(source);
  assert.equal(loaded.error, undefined, loaded.error);
  return repl.evaluate(expression);
}
function ok(result) {
  assert.equal(result.error, undefined, result.error);
  return result.result;
}
function entry(result, key, expected) {
  assert.ok(ok(result).includes(`key = "${key}"\n\tvalue = ${JSON.stringify(expected)}`), result.result);
}
const runtime = `let fixture=Address(base58'abc')
let oracle=Address(base58'xyz')
func getOracle()=oracle
`;
function selectorSource(source) {
  return (fn(source, 'getStatsKey') + '\n' + fn(source, 'getJackpot'))
    .replace(/\bthis\b/g, 'fixture').replace(/lastBlock.timestamp/g, 'now')
    .replace(/\bgetInteger\(/g, 'mockInteger(').replace(/\bgetIntegerValue\(/g, 'mockIntegerValue(');
}
function selectorState(options) {
  const t = { name: 'BULL-WMOLDYMT-JU', odds: 200, count: 0, max: 2, start: 100, end: 200, now: 150, raw: 0, reads: true, rng: true, ...options };
  return runtime + `let now=${t.now}
func tryGetStringExternal(a:Address,k:String)=if a==oracle && k=="jackpot_abc" then ${JSON.stringify(t.name)} else throw("WRONG_NAME_KEY")
func mockInteger(a:Address,k:String)=if a==oracle && k=="jackpot_abc_odds" then ${t.odds} else throw("WRONG_ODDS_KEY")
func mockIntegerValue(a:Address,k:String)=if !${t.reads} then throw("UNEXPECTED_CONFIG_READ") else
  if a!=oracle then throw("WRONG_ORACLE") else
  if k=="jackpot_abc_max" then ${t.max} else if k=="jackpot_abc_start" then ${t.start} else if k=="jackpot_abc_end" then ${t.end} else throw("WRONG_CONFIG_KEY")
func tryGetInteger(k:String)=if !${t.reads} then throw("UNEXPECTED_COUNT_READ") else if k==${JSON.stringify('stats_' + t.name + '_amount')} then ${t.count} else throw("WRONG_COUNT_KEY")
func getRandomNumber(n:Int,t:ByteVector,h:Int,o:Int)=if !${t.rng} then throw("UNEXPECTED_RANDOM_READ") else
  if n!=${t.odds === 'unit' ? 0 : t.odds} || t!=base58'${initialTx}' || h!=10 || o!=2 then throw("WRONG_RANDOM_ARGS") else ${t.raw}
`;
}
for (const [family, name] of [['bulls', 'BULL-WMOLDYMT-JU'], ['turtle', 'TRTL-WWIZARDT-JU']]) {
  const source = read(`ride/${family}/breeder.ride`);
  test(`${family} jackpot configuration controls disablement, odds, count and timestamps`, async () => {
    for (const t of [
      { name: '', odds: 'throw("UNEXPECTED_ODDS_READ")', reads: false, rng: false },
      { odds: 'unit', reads: false, rng: false },
      { odds: 0, reads: false, rng: false },
      { odds: -1, reads: false, rng: false, error: 'JACKPOT_ODDS' },
      { now: 99, rng: false },
      { now: 100, winner: true },
      { now: 199, winner: true },
      { now: 200, rng: false },
      { start: 200, end: 200, rng: false },
      { start: 201, end: 200, rng: false },
      { count: 1, winner: true },
      { count: 2, rng: false },
      { count: 3, rng: false },
      { max: 0, rng: false },
      { odds: 1, winner: true },
      { odds: 2, raw: 1 },
      { odds: 2, raw: -1 },
      { odds: '9223372036854775807', raw: '9223372036854775806' },
      { odds: '9223372036854775807', raw: '-9223372036854775806' },
      { name: family === 'bulls' ? 'BULL-WCABBULL-JU' : 'TRTL-WTGINGER-JU', odds: 3, max: 4, count: 3, winner: true },
    ]) {
      const options = { name, ...t };
      const result = await execute(selectorState(options) + selectorSource(source), `getJackpot(base58'${initialTx}',10)`);
      if (t.error) assert.ok(result.error?.includes(t.error), JSON.stringify(options));
      else assert.ok(ok(result).endsWith(`= ${JSON.stringify(t.winner ? options.name : '')}`), result.result);
    }
  });
  test(`${family} jackpot reuses its existing block VRF RNG at offset two`, async () => {
    const odds = family === 'bulls' ? 1000 : 200;
    let winner;
    let loser;
    for (let k = 1; k < 30000 && (!winner || !loser); k++) {
      const tx = Buffer.alloc(32);
      tx.writeUInt32BE(k, 28);
      const hash = nodeCrypto.createHash('sha256').update(Buffer.concat([tx, Buffer.from(crypto.base58Decode('abc'))])).digest();
      const remainder = hash.readBigInt64BE(2) % BigInt(odds);
      if (remainder === 0n) winner = crypto.base58Encode(tx);
      else loser = crypto.base58Encode(tx);
    }
    assert.ok(winner && loser);
    const state = selectorState({ name, odds }).replace(/func getRandomNumber\([\s\S]*$/, '');
    const random = fn(source, 'getRandomNumber').replace(/blockInfoByHeight\(/g, 'mockBlock(');
    const block = `func mockBlock(h:Int)=if h!=9 then throw("WRONG_BLOCK") else BlockInfo(500,h,1,base58'abc',fixture,base58'abc',base58'abc',[])\n`;
    for (const [tx, expected] of [[winner, name], [loser, '']]) {
      const result = await execute(state + block + random + '\n' + selectorSource(source), `getJackpot(base58'${tx}',10)`);
      assert.ok(ok(result).endsWith(`= ${JSON.stringify(expected)}`), result.result);
    }
  });
  test(`${family} farm-gen override is independent of event enablement and preserves parser fallback`, async () => {
    const body = fn(source, 'getGenFromName');
    const helpers = [...new Set(body.match(/isSymbol[A-Z]/g))].map(n => fn(source, n)).join('\n') + '\n' + fn(source, 'getAmountOrClear');
    const prefix = family === 'bulls' ? 'BULL' : 'TRTL';
    for (const [assetName, override, expected] of [
      [name, '8W-J', '8W-J'],
      [name, '2A6W-J', '2A6W-J'],
      [`${prefix}-ABCDABCD-HR`, '', family === 'bulls' ? '2A2B2C2D-H' : '2A2B2C2D'],
      [family === 'bulls' ? 'BULL-WCABBULL-JU' : 'TRTL-WXMSTREE-JU', '', family === 'bulls' ? '1A2B1C-J' : '2E'],
    ]) {
      const mocks = runtime + `func tryGetStringExternal(a:Address,k:String)=if a==oracle && k==${JSON.stringify('farm_gen_' + assetName)} then ${JSON.stringify(override)} else throw("UNEXPECTED_LOOKUP")\n`;
      const result = await execute(mocks + helpers + '\n' + body, `getGenFromName(${JSON.stringify(assetName)})`);
      assert.ok(ok(result).includes(`_2 = "${expected}"`), result.result);
    }
  });
  test(`${family} actual completion issues the configured jackpot and uses ordinary genotype counters`, async () => {
    const finishName = family === 'bulls' ? 'finishHatchingInternal' : 'finishTRTLHatchingInternal';
    const idName = family === 'bulls' ? 'getIdKey' : 'getTRTLIdKey';
    const parentName = family === 'bulls' ? 'getParentKey' : 'getTRTLParentKey';
    const normal = family === 'bulls' ? 'BULL-AAAAAAAA-HR' : 'TRTL-AAAAAAAA-HR';
    const keys = ['getProcessStatusKey', 'getProcessFinishHeightKey', idName, parentName, 'getStatsKey'].map(n => fn(source, n)).join('\n');
    const finish = fn(source, finishName).replace(/asset\.calculateAssetId\(\)/g, "base58'AB'");
    for (const [count, expected] of [[0, name], [1, name], [2, normal]]) {
      const state = runtime + `let now=150
let testHeight=1000
let HatchingFinished="BREEDING_FINISHED"
let i=Invocation([],Address(base58'${owner}'),base58'abc',base58'dEf',0,unit,fixture,base58'abc')
func tryGetStringExternal(a:Address,k:String)=if a==oracle && k=="jackpot_abc" then "${name}" else throw("WRONG_NAME_KEY")
func mockInteger(a:Address,k:String)=if a==oracle && k=="jackpot_abc_odds" then 200 else throw("WRONG_ODDS_KEY")
func mockIntegerValue(a:Address,k:String)=if a==fixture && k==getProcessFinishHeightKey("${owner}",base58'${initialTx}') then 10 else
  if a!=oracle then throw("WRONG_ORACLE") else if k=="jackpot_abc_max" then 2 else if k=="jackpot_abc_start" then 100 else if k=="jackpot_abc_end" then 200 else throw("WRONG_INTEGER_KEY")
func mockStringValue(a:Address,k:String)=if a==fixture && k==getProcessStatusKey("${owner}",base58'${initialTx}') then "BREEDING_STARTED" else throw("WRONG_STATUS_KEY")
func tryGetInteger(k:String)=if k=="stats_${name}_amount" then ${count} else 0
func tryGetString(k:String)="abc"
func getRandomNumber(n:Int,t:ByteVector,h:Int,o:Int)=if n==200 && t==base58'${initialTx}' && h==10 && o==2 then 0 else throw("WRONG_RANDOM_ARGS")
func generate(t:ByteVector,h:Int,a:Int,b:Int,c:String,d:Int)="${normal}"
func generateTRTL(t:ByteVector,h:Int,a:Int,b:Int,c:String,d:Int)=("${normal}",0)
func getCouponsAddress()=oracle
func mockInvoke(a:Address,f:String,args:List[String],p:List[AttachedPayment])=if a==fixture && f=="getGenFromName" && args==["${expected}"] then "${expected === name ? '8W-J' : '8A-H'}" else if a==oracle && f=="recordAction" && args==["BREEDTURTLE"] then "recorded" else throw("UNEXPECTED_INVOKE")
func bonusItemOutput(action:String,who:String,tx:String,h:Int)=if action=="breed" && who=="${owner}" && tx=="${initialTx}" && h==10 then [] else throw("WRONG_BONUS_ARGS")
`;
      const methods = (fn(source, 'getJackpot') + '\n' + finish)
        .replace(/\bthis\b/g, 'fixture').replace(/lastBlock.timestamp/g, 'now').replace(/\bheight\b/g, 'testHeight')
        .replace(/\bgetInteger\(/g, 'mockInteger(').replace(/\bgetIntegerValue\(/g, 'mockIntegerValue(')
        .replace(/\bgetStringValue\(/g, 'mockStringValue(').replace(/\binvoke\(/g, 'mockInvoke(');
      const result = await execute(keys + '\n' + state + methods, `${finishName}("${initialTx}",i,0,0,"",0)`);
      assert.ok(ok(result).includes(`name = "${expected}"`), result.result);
      entry(result, `stats_${expected}_amount`, expected === name ? count + 1 : 1);
      entry(result, `stats_${expected === name ? '8W-J' : '8A-H'}_quantity`, 1);
      entry(result, `${owner}_${initialTx}_status`, 'BREEDING_FINISHED');
      assert.ok(!result.result.includes('h26_jackpot_issued'));
    }
  });
}
