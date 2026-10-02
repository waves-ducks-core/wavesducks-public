// Execute the production Ride helper and completion bodies in the official REPL.
// Oracle/state/time, existing RNG and cross-dApp issuance are mocked. This suite
// verifies Ride behavior, not node invocation budgets or deployed integration.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ride = require('@waves/ride-js');
const crypto = require('@waves/ts-lib-crypto');
const owner = '3PEPftf2kWZDmAaWBjs6BUJa9957kiA2PkU';
const initialTx = '11111111111111111111111111111111';
const read = path => fs.readFileSync(path, 'utf8');
function fn(source, name) {
  const start = source.indexOf(`func ${name}(`);
  assert.ok(start >= 0, `Missing ${name}`);
  const next = source.slice(start + 5).search(/^(@Callable|@Verifier|func )/m);
  return (next < 0 ? source.slice(start) : source.slice(start, start + 5 + next)).trim();
}
async function replWith(source) {
  const repl = ride.repl({nodeUrl: 'http://127.0.0.1:1', chainId: 'W', address: owner});
  const loaded = await repl.evaluate(source);
  assert.equal(loaded.error, undefined, loaded.error);
  return repl;
}
function ok(result) {
  assert.equal(result.error, undefined, result.error);
  return result.result;
}
function value(result, key, expected) {
  assert.ok(ok(result).includes(`key = "${key}"\n\tvalue = ${JSON.stringify(expected)}`), result.result);
}
const helper = fn(read('ride/ducks/breeder.ride'), 'bonusItemOutput');
const producers = ['ducks', 'turtle', 'cani', 'feli', 'eagl', 'bulls'].flatMap(family => [
  [`ride/${family}/breeder.ride`, 'breed'],
  [`ride/${family}/incubator.ride`, 'hatch'],
  [`ride/${family}/${family === 'bulls' ? 'incubator' : 'rebirth'}.ride`, 'rebirth'],
]).concat([['ride/mutants/breeder.ride', 'breed']]);

test('all breeding, hatch, mutant and rebirth finishes share the direct helper', () => {
  for (const [path, action] of producers) {
    const source = read(path);
    assert.equal(fn(source, 'bonusItemOutput'), helper, path);
    assert.match(source, new RegExp(`bonusItemOutput\\("${action}",`), path);
    assert.doesNotMatch(source, /halloweenCompletion|halloweenDrop|halloweenBonus/, path);
  }
  assert.doesNotMatch(helper, /[Cc]oupons|completion/);
  assert.match(helper, /invoke\(getItemsAddress\(\), "issueArtefactIndex", \[item, owner, 2\], \[\]\)/);
});

// Expose fixture values as arguments so exhaustive probability checks can reuse
// one REPL. Preserve every branch, selector and returned data entry in Ride.
function parameterizedHelper() {
  let source = helper.replace('finishHeight: Int) = {', 'finishHeight: Int, configItems: String, configChance: Int, timeStart: Int, timeEnd: Int, now: Int, rawRandom: Int, mintAllowed: Boolean) = {');
  source = source.replace('this.toString()', '"contract"').replace('this.bytes', "base16'001122'");
  source = source.replace('tryGetStringExternal(getOracle(), key)', 'configItems');
  source = source.replace('getInteger(getOracle(), key + "_chance").valueOrElse(0)', 'configChance');
  source = source.replace('getIntegerValue(getOracle(), key + "_start")', '(if timeStart == -1 then throw("UNEXPECTED_SCHEDULE_READ") else timeStart)');
  source = source.replace('getIntegerValue(getOracle(), key + "_end")', '(if timeEnd == -1 then throw("UNEXPECTED_SCHEDULE_READ") else timeEnd)');
  source = source.replaceAll('lastBlock.timestamp', 'now');
  source = source.replace('getRandomNumber(200, seed, finishHeight, 0)', 'mockRandomNumber(200, seed, finishHeight, 0, rawRandom)');
  source = source.replace('invoke(getItemsAddress(), "issueArtefactIndex", [item, owner, 2], []).exactAs[String]', 'mockIssue(item, owner, 2, mintAllowed)');
  return `
func mockRandomNumber(variants: Int, input: ByteVector, finishHeight: Int, offset: Int, raw: Int) = {
  if variants != 200 || finishHeight != 10 || offset != 0 then throw("BAD_RNG_ARGS") else
  if input != toBytes("bonus|breed") + base16'001122' + base58'${initialTx}' then throw("BAD_RNG_SEED") else
  if raw < -199 || raw > 199 then throw("UNEXPECTED_RANDOM_READ") else raw
}
func mockIssue(item: String, owner: String, nonce: Int, allowed: Boolean) = {
  if !allowed then throw("UNEXPECTED_MINT") else
  if owner != "owner" || nonce != 2 then throw("BAD_ISSUE_ARGS") else
  if !item.contains("ART-") then throw("INVALID_ITEM") else "minted-" + item
}
` + source;
}
test('direct bonus boundaries, zero chance and invalid configuration execute in Ride', async () => {
  const repl = await replWith(parameterizedHelper());
  async function check(options) {
    const t = {items: 'ART-GFTR,ART-GFTW', chance: 60, start: 100, end: 200, now: 150, raw: 0, mint: true, ...options};
    const result = await repl.evaluate(`bonusItemOutput("breed", "owner", "${initialTx}", 10, ${JSON.stringify(t.items)}, ${t.chance}, ${t.start}, ${t.end}, ${t.now}, ${t.raw}, ${t.mint})`);
    if (t.mode === 'error') {assert.ok(result.error, t.name); return;}
    const output = ok(result);
    if (t.mode === 'empty') {assert.match(output, /= \[\]$/, t.name); return;}
    value(result, `address_owner_initTx_${initialTx}_bonusRandom`, ((t.raw + 200) % 200) % 100);
    if (t.mode === 'none') assert.ok(!output.includes('_bonusItem'), t.name);
    else value(result, `address_owner_initTx_${initialTx}_bonusItem`, 'minted-' + t.mode);
  }
  const cases = [
    {name: 'empty config skips schedule, randomness and issuance', items: '', start: -1, end: -1, raw: 1000, mint: false, mode: 'empty'},
    {name: 'zero chance skips schedule, randomness and issuance', chance: 0, start: -1, end: -1, raw: 1000, mint: false, mode: 'empty'},
    {name: 'before start', now: 99, raw: 1000, mint: false, mode: 'empty'},
    {name: 'start inclusive', now: 100, mode: 'ART-GFTR'},
    {name: 'end minus one', now: 199, mode: 'ART-GFTR'},
    {name: 'end exclusive', now: 200, raw: 1000, mint: false, mode: 'empty'},
    {name: 'after end', now: 201, raw: 1000, mint: false, mode: 'empty'},
    {name: 'negative chance', chance: -1, mode: 'error'},
    {name: 'over 100 percent', chance: 101, mode: 'error'},
    {name: 'empty schedule', start: 200, raw: 1000, mint: false, mode: 'empty'},
    {name: 'reversed schedule', start: 201, raw: 1000, mint: false, mode: 'empty'},
    {name: 'three item types', items: 'ART-GFTR,ART-GFTW,ART-BBALL', mode: 'error'},
    {name: 'issuer rejects invalid selected item', items: 'BAD', mode: 'error'},
    {name: 'issuer rejects empty selected item', items: 'ART-GFTR,', raw: 100, mode: 'error'},
    {name: 'one item receives the full chance', items: 'ART-SNOWBALL', raw: 159, mode: 'ART-SNOWBALL'},
    {name: 'one item miss', items: 'ART-SNOWBALL', raw: 160, mint: false, mode: 'none'},
    {name: 'negative remainder selects second half', chance: 100, raw: -1, mode: 'ART-GFTW'},
    {name: 'minimum remainder selects first half', chance: 100, raw: -199, mode: 'ART-GFTR'},
  ];
  for (const entry of cases) await check(entry);
  // All 200 slots, including odd percentages: each color gets exactly half of
  // the total drop probability. A miss never invokes the issuer.
  for (const chance of [1, 3, 60, 99, 100]) {
    const counts = {none: 0, 'ART-GFTR': 0, 'ART-GFTW': 0};
    for (let random = 0; random < 200; random++) {
      const mode = random % 100 < chance ? (random < 100 ? 'ART-GFTR' : 'ART-GFTW') : 'none';
      await check({name: `${chance}% slot ${random}`, chance, raw: random, mint: mode !== 'none', mode});
      counts[mode]++;
    }
    assert.deepEqual(counts, {none: 200 - 2 * chance, 'ART-GFTR': chance, 'ART-GFTW': chance});
  }
});

// Preserve oracle lookup and defaults here, unlike the parameterized test.
test('missing item or chance keys disable bonus without schedule, RNG or issuer access', async () => {
  const source = helper.replaceAll('this.toString()', 'fixture.toString()').replaceAll('this.bytes', 'fixture.bytes')
    .replaceAll('lastBlock.timestamp', '500').replace('getInteger(getOracle(),', 'mockInteger(getOracle(),')
    .replaceAll('getIntegerValue(getOracle(),', 'mockIntegerValue(getOracle(),').replaceAll('invoke(', 'mockInvoke(');
  for (const [items, chance] of [['', 'unit'], ['ART-GFTR', 'unit'], ['ART-GFTR', '0']]) {
    const mocks = `let fixture=Address(base58'abc')
func getOracle()=fixture
func tryGetStringExternal(a:Address,k:String)=if k=="bonus_item_abc_breed" then ${JSON.stringify(items)} else throw("WRONG_CONFIG_KEY")
func mockInteger(a:Address,k:String)=if k=="bonus_item_abc_breed_chance" then ${chance} else throw("WRONG_CHANCE_KEY")
func mockIntegerValue(a:Address,k:String)=throw("UNEXPECTED_SCHEDULE_READ")
func getRandomNumber(n:Int,t:ByteVector,h:Int,o:Int)=throw("UNEXPECTED_RANDOM_READ")
func getItemsAddress()=throw("UNEXPECTED_ITEMS_READ")
func mockInvoke(a:Address,f:String,args:List[String|Int],p:List[AttachedPayment])=throw("UNEXPECTED_INVOKE")
`;
    const repl = await replWith(mocks + source);
    assert.match(ok(await repl.evaluate('bonusItemOutput("breed","owner","not-base58!",-1)')), /= \[\]$/);
  }
});

test('real duck breeding completion preserves owner, maturity, replay and reward metadata', async () => {
  const source = read('ride/ducks/breeder.ride');
  const keys = ['getProcessStatusKey', 'getDuckIdKey', 'getProcessFinishHeightKey'].map(name => fn(source, name)).join('\n');
  const finish = fn(source, 'finishDuckHatch').replace(/asset\.calculateAssetId\(\)/g, "base58'abc'");
  for (const t of [
    {name: 'winner', status: 'BREEDING_STARTED', maturity: 10, roll: 0},
    {name: 'miss', status: 'BREEDING_STARTED', maturity: 10, roll: 60},
    {name: 'already completed', status: 'BREEDING_FINISHED', maturity: 10, error: 'claimed already'},
    {name: 'immature', status: 'BREEDING_STARTED', maturity: 1001, error: 'not finished yet'},
    {name: 'wrong owner', status: 'BREEDING_STARTED', maturity: 10, receiver: '3P3H1W7X5vjLRVKkGGNzHdppECUTMbfpiSS', error: 'WRONG_OWNER'},
  ]) {
    const data = `let fixture=Address(base58'abc')
let testHeight=1000
let HatchingFinished="BREEDING_FINISHED"
func getOracle()=fixture
func getItemsAddress()=Address(base58'xyz')
func mockStringValue(a:Address,k:String)=if k==getProcessStatusKey("${owner}",base58'${initialTx}') then "${t.status}" else if k==getDuckIdKey("${owner}",base58'${initialTx}') then "old-nft" else throw("WRONG_OWNER")
func mockIntegerValue(a:Address,k:String)=if k==getProcessFinishHeightKey("${owner}",base58'${initialTx}') then ${t.maturity} else if k=="bonus_item_abc_breed_start" then 100 else if k=="bonus_item_abc_breed_end" then 1000 else throw("WRONG_INTEGER_KEY")
func tryGetStringExternal(a:Address,k:String)=if k=="bonus_item_abc_breed" then "ART-GFTR" else throw("WRONG_CONFIG_KEY")
func mockInteger(a:Address,k:String)=if k=="bonus_item_abc_breed_chance" then 60 else throw("WRONG_CHANCE_KEY")
func getRandomNumber(n:Int,t:ByteVector,h:Int,o:Int)=if n==200 && t==toBytes("bonus|breed")+fixture.bytes+base58'${initialTx}' && h==10 && o==0 then ${t.roll ?? 'throw("UNEXPECTED_RANDOM_READ")'} else throw("WRONG_RANDOM_ARGS")
func mockInvoke(a:Address,f:String,args:List[ByteVector|Int|String],p:List[AttachedPayment])=if a==getItemsAddress() && f=="issueArtefactIndex" && args==["ART-GFTR","${owner}",2] && size(p)==0 then "bonus-nft" else throw("UNEXPECTED_INVOKE")
func getParentKey(t:ByteVector,n:Int)="parent"
func tryGetString(k:String)="abc"
func tryGetBoolean(k:String)=false
func composeGenericData(g:String,k:String,id:ByteVector,a:Issue)=[a]
`;
    const executable = (keys + '\n' + data + '\n' + helper + '\n' + finish)
      .replace(/\bthis\b/g, 'fixture').replace(/lastBlock.timestamp/g, '500').replace(/\bheight\b/g, 'testHeight')
      .replace(/\binvoke\(/g, 'mockInvoke(').replace(/\bgetStringValue\(/g, 'mockStringValue(')
      .replace(/\bgetIntegerValue\(/g, 'mockIntegerValue(').replace(/\bgetInteger\(/g, 'mockInteger(');
    const repl = await replWith(executable);
    const result = await repl.evaluate(`finishDuckHatch("${initialTx}","${t.receiver || owner}","DUCK-AAAAAAAA-GA")`);
    if (t.error) {assert.ok(result.error?.includes(t.error), t.name + ': ' + JSON.stringify(result)); continue;}
    value(result, `${owner}_${initialTx}_status`, 'BREEDING_FINISHED');
    assert.match(ok(result), /Issue\(/);
    assert.match(result.result, /ScriptTransfer\(/);
    value(result, `address_${owner}_initTx_${initialTx}_bonusRandom`, t.roll);
    if (t.roll === 0) value(result, `address_${owner}_initTx_${initialTx}_bonusItem`, 'bonus-nft');
    else assert.doesNotMatch(result.result, /_bonusItem/);
  }
});

test('generic item issuers preserve trusted callers and distributor restrictions for campaign rewards', async () => {
  const source = read('ride/artefacts/items.ride');
  const allowedGetters = ['getRebirthAddress','getTurtleRebirthAddress','getCanineRebirthAddress','getFelineeRebirthAddress','getEagleRebirthAddress','getBullIncubatorAddress','getDuckBreederAddress','getTurtleBreederAddress','getCanineBreederAddress','getFelineBreederAddress','getEagleBreederAddress','getBullBreederAddress'];
  allowedGetters.push('getMutantIncubatorAddress');
  const incubatorKeys = ['static_incubatorAddress','static_turtleIncubatorAddress','static_canineIncubatorAddress','static_felineIncubatorAddress','static_eagleIncubatorAddress'];
  const incubators = Object.fromEntries(incubatorKeys.map((key, index) => [key, crypto.base58Encode(Uint8Array.from([101 + index]))]));
  const names = [...new Set((fn(source, 'issueArtefact') + fn(source, 'issueArtefactIndex')).match(/\bget[A-Z]\w*(?=\()/g))].filter(name => name !== 'getString');
  const addresses = Object.fromEntries(names.map((name, index) => [name, crypto.base58Encode(Uint8Array.from([index + 1]))]));
  const methods = ['halloweenItem','issueItem','issueArtefact','issueArtefactIndex'].map(name => fn(source, name)).join('\n')
    .replace(/\bthis\b/g, 'fixture').replace(/\bheight\b/g, 'testHeight').replace(/artefact\.calculateAssetId\(\)/g, "base58'AB'")
    .replace(/\bgetString\(/g, 'mockString(');
  const getters = names.map(name => `func ${name}()=${name === 'getWarsPKey' ? `base58'${addresses[name]}'` : `Address(base58'${addresses[name]}')`}`).join('\n');
  async function run(caller, kind, nonce = 2, paid = false, indexed = true, whitelisted = false, wars = false) {
    const env = `let fixture=Address(base58'abc')
let testHeight=1000
let i=Invocation(${paid ? '[AttachedPayment(unit,1)]' : '[]'},Address(base58'${caller}'),base58'${wars ? addresses.getWarsPKey : 'xyz'}',base58'dEf',0,unit,fixture,base58'abc')
let oracleData=[${Object.entries(incubators).map(([key, address]) => `StringEntry("${key}","${address}")`).join(',')}]
func mockString(a:Address,k:String)=getString(oracleData,k)
func tryGetStringExternal(a:Address,k:String)=mockString(a,k).valueOrElse("")
func tryGetInteger(k:String)=0
func tryGetBoolean(k:String)=${whitelisted} && k==${JSON.stringify(kind + "_issue")}
func isTestEnv()=false
func last_height_key()="last_height"
func last_height_key_receiver(a:String)="last_height_"+a
`;
    const repl = await replWith(env + getters + '\n' + methods);
    return repl.evaluate(indexed ? `issueArtefactIndex("${kind}","${owner}",${nonce})` : `issueArtefact("${kind}","${owner}")`);
  }
  const campaignItems = ['ART-H26SOUL','ART-H26SWORD','ART-H26CAT','ART-H26ARMOR','ART-H26FEED'];
  const gameplayCallers = [...allowedGetters.map(getter => [getter, addresses[getter]]), ...Object.entries(incubators)];
  for (const [name, caller] of [...gameplayCallers, ['coupons', addresses.getCouponsAddress], ['self', 'abc']]) {
    for (const kind of [...campaignItems, 'ART-GFTR']) {
      assert.match(ok(await run(caller, kind)), /Issue\(/, `${name}: ${kind}`);
    }
  }
  // Generic minting keeps its established nonce/payment interface. The bonus
  // helper independently selects nonce 2 and sends no payment.
  for (const nonce of [0, 1, 26]) {
    const result = await run(addresses.getRebirthAddress, 'ART-H26SOUL', nonce, true);
    assert.match(ok(result), new RegExp(`nonce = ${nonce}`));
  }
  const nonindexedCallers = new Set(['getRebirthAddress', 'getTurtleRebirthAddress', 'getCanineRebirthAddress']);
  for (const [name, caller] of gameplayCallers) {
    const result = await run(caller, 'ART-H26ARMOR', 0, false, false);
    if (nonindexedCallers.has(name)) assert.match(ok(result), /Issue\(/, name);
    else assert.ok(result.error?.includes('admin only'), name);
  }
  for (const caller of [addresses.getCouponsAddress, 'abc']) {
    for (const kind of campaignItems) {
      assert.match(ok(await run(caller, kind, 0, true, false)), /Issue\(/);
    }
  }
  for (const indexed of [true, false]) {
    for (const kind of [...campaignItems, 'ART-GFTR']) {
      assert.ok((await run('xyz', kind, 2, false, indexed)).error?.includes('admin only'));
      assert.ok((await run(addresses.getHuntDistroAddress, kind, 2, false, indexed)).error?.includes('WHITELIST'));
      assert.match(ok(await run(addresses.getHuntDistroAddress, kind, 2, false, indexed, true)), /Issue\(/);
      const wars = await run('xyz', kind, 2, false, indexed, false, true);
      if (indexed) assert.ok(wars.error?.includes('WHITELIST'));
      else assert.match(ok(wars), /Issue\(/); // The historical nonindexed Wars authority is unrestricted.
      assert.match(ok(await run('xyz', kind, 2, false, indexed, true, true)), /Issue\(/);
    }
    for (const [caller, wars] of [[addresses.getHuntDistroAddress, false], ['xyz', true]]) {
      assert.match(ok(await run(caller, 'ART-FIRE_SHIELD', 2, false, indexed, false, wars)), /Issue\(/);
    }
  }
});

test('failed mutant completion burns the failed NFT, preserves parent outcomes and awards its bonus once', async () => {
  const source = read('ride/mutants/breeder.ride');
  const keys = ['hatchingFinished', 'getStatsKey_amount', 'getStatsKey', 'getParentKey', 'getProcessStatusKey', 'getProcessFinishHeightKey', 'getIdKey'].map(name => fn(source, name)).join('\n');
  const names = ['isSymbol', 'getAmountOrClear', 'charList', 'getRarityFromName', 'nrOfTypeGenes', 'validateIfMutantFailed', 'checkAdditionalPayment', 'bonusItemOutput', 'finishHatchingInternal', 'finishMutantHatching'];
  const methods = names.map(name => fn(source, name)).join('\n')
    .replace(/\bthis\b/g, 'fixture').replace(/\bheight\b/g, 'testHeight').replace(/lastBlock.timestamp/g, '500')
    .replace(/\binvoke\(/g, 'mockInvoke(').replace(/\bgetStringValue\(/g, 'mockStringValue(')
    .replace(/\bgetIntegerValue\(/g, 'mockIntegerValue(').replace(/\bgetInteger\(/g, 'mockInteger(')
    .replace(/asset\.calculateAssetId\(\)/g, "base58'AB'");
  for (const t of [
    {name: 'failed offspring still receives bonus', roll: 0},
    {name: 'failed offspring with missed bonus', roll: 60},
    {name: 'replay', status: 'BREEDING_FINISHED', error: 'claimed already'},
    {name: 'immature', maturity: 1001, error: 'not finished yet'},
    {name: 'wrong origin owner', origin: '3P3H1W7X5vjLRVKkGGNzHdppECUTMbfpiSS', error: 'WRONG_OWNER'},
    {name: 'missing fee', payments: '[]', error: 'Wrong amount of payments'},
  ]) {
    const mocks = `let fixture=Address(base58'abc')
let testHeight=1000
let i=Invocation(${t.payments || '[AttachedPayment(unit,1)]'},Address(base58'xyz'),base58'abc',base58'dEf',0,unit,Address(base58'${t.origin || owner}'),base58'abc')
func getOracle()=fixture
func getItemsAddress()=Address(base58'xyz')
func getCouponsAddress()=Address(base58'456')
func getFeeAggregator()=Address(base58'789')
func staticKey_extraFee()="fee"
func mockStringValue(a:Address,k:String)=if a!=fixture then throw("WRONG_STATE_ACCOUNT") else
  if k==getProcessStatusKey("${owner}","${initialTx}") then "${t.status || 'BREEDING_STARTED'}" else
  if k==getIdKey("${owner}","${initialTx}") then "AB" else throw("WRONG_OWNER")
func mockIntegerValue(a:Address,k:String)=if a!=fixture then throw("WRONG_STATE_ACCOUNT") else
  if k==getProcessFinishHeightKey("${owner}","${initialTx}") then ${t.maturity || 10} else
  if k=="fee" then 1 else if k=="bonus_item_abc_breed_start" then 100 else if k=="bonus_item_abc_breed_end" then 1000 else throw("WRONG_INTEGER_KEY")
func tryGetString(k:String)=if k==getParentKey(base58'${initialTx}',1) then "DEF" else if k==getParentKey(base58'${initialTx}',2) then "GHJ" else throw("WRONG_PARENT_KEY")
func tryGetInteger(k:String)=if k=="stats_amount" then 7 else 0
func tryGetStringExternal(a:Address,k:String)=if a==fixture && k=="bonus_item_abc_breed" then "ART-SNOWBALL" else throw("WRONG_CONFIG_KEY")
func mockInteger(a:Address,k:String)=if a==fixture && k=="bonus_item_abc_breed_chance" then 60 else throw("WRONG_CHANCE_KEY")
func generate(tx:ByteVector,h:Int,p1:ByteVector,p2:ByteVector)=if tx==base58'${initialTx}' && h==10 && p1==base58'DEF' && p2==base58'GHJ' then ("MTNT-DADADADADADADADA-GA",0) else throw("WRONG_GENERATION_ARGS")
func getRandomNumber(n:Int,tx:ByteVector,h:Int,o:Int)=if h!=10 then throw("WRONG_RANDOM_HEIGHT") else
  if n==10 && tx==base58'${initialTx}' then (if o==2 then 5 else if o==3 then 0 else throw("WRONG_PARENT_OFFSET")) else
  if n==200 && tx==toBytes("bonus|breed")+fixture.bytes+base58'${initialTx}' && o==0 then ${t.roll ?? 'throw("UNEXPECTED_BONUS")'} else throw("WRONG_RANDOM_ARGS")
func mockInvoke(a:Address,f:String,args:List[String|Int],p:List[AttachedPayment])=if size(p)!=0 then throw("UNEXPECTED_PAYMENT") else
  if a==getCouponsAddress() && f=="recordAction" && args==["FINISHMUTANT"] then true else
  if a==getItemsAddress() && f=="issueArtefactIndex" && args==["ART-SNOWBALL","${owner}",2] then "mutant-bonus" else throw("UNEXPECTED_INVOKE")
`;
    const repl = await replWith(keys + '\n' + mocks + methods);
    const result = await repl.evaluate(`finishMutantHatching("${initialTx}")`);
    if (t.error) {assert.ok(result.error?.includes(t.error), t.name + ': ' + JSON.stringify(result)); continue;}
    const output = ok(result);
    value(result, `${owner}_${initialTx}_status`, 'BREEDING_FINISHED');
    value(result, `${owner}_${initialTx}_di`, 'AB');
    value(result, 'stats_amount', 8);
    value(result, 'stats_MTNT-DADADADADADADADA-GA_amount', 1);
    value(result, 'stats_D:8A__quantity', 1);
    value(result, 'stats_8A-A_rarity', 1);
    value(result, 'asset_DEF_children', 1);
    value(result, 'asset_GHJ_children', 1);
    assert.equal((output.match(/Issue\(/g) || []).length, 1, output);
    assert.equal((output.match(/Burn\(/g) || []).length, 2, output);
    assert.equal((output.match(/ScriptTransfer\(/g) || []).length, 2, output);
    assert.match(output, /Burn\(\n\tassetId = base58'AB'\n\tquantity = 1/);
    assert.match(output, /Burn\(\n\tassetId = base58'DEF'\n\tquantity = 1/);
    assert.match(output, new RegExp(`ScriptTransfer\\(\\n\\trecipient = Address\\(\\n\\t\\tbytes = base58'${owner}'[\\s\\S]*?asset = base58'GHJ'`));
    value(result, `address_${owner}_initTx_${initialTx}_bonusRandom`, t.roll);
    if (t.roll === 0) {
      value(result, `address_${owner}_initTx_${initialTx}_bonusItem`, 'mutant-bonus');
      assert.equal((output.match(/_bonusItem"/g) || []).length, 1);
    } else assert.doesNotMatch(output, /_bonusItem/);
  }
});

test('double item rebirth uses nonces zero, one and two through the actual indexed issuer', async () => {
  const source = read('ride/ducks/rebirth.ride');
  const items = read('ride/artefacts/items.ride');
  const methods = ['checkAdditionalPayment', 'getRandomWin', 'getRandomReturn', 'bonusItemOutput', 'finishRebirthInternal', 'finishRebirthDouble'].map(name => fn(source, name)).join('\n')
    .replace(/\bthis\b/g, 'fixture').replace(/\bheight\b/g, 'testHeight').replace(/lastBlock.timestamp/g, '500')
    .replace(/\binvoke\(/g, 'mockInvoke(').replace(/\bgetIntegerValue\(/g, 'mockIntegerValue(')
    .replace(/\bgetInteger\(/g, 'mockInteger(').replace(/\bgetStringValue\(/g, 'mockStringValue(')
    .replace(/\bassetInfo\(/g, 'mockAssetInfo(');
  // The REPL has no containing transaction for calculateAssetId. Preserve the
  // production Issue nonce and derive a deterministic fixture ID from it.
  const issuer = (fn(items, 'issueItem') + '\n' + fn(items, 'issueArtefactIndex'))
    .replace('nonce: Int) = {', 'nonce: Int, issuerCaller: Address) = {\nlet issuerInvocation=Invocation([],issuerCaller,base58\'abc\',base58\'dEf\',0,unit,Address(base58\'' + owner + '\'),base58\'abc\')')
    .replace(/\bi\./g, 'issuerInvocation.').replace(/\bthis\b/g, 'itemsFixture').replace(/\bheight\b/g, 'testHeight')
    .replace(/artefact\.calculateAssetId\(\)/g, 'sha256(toBytes(artefact.name)+toBytes(artefact.nonce))');
  const getterNames = [...new Set((methods + issuer).match(/\bget[A-Z]\w*(?=\()/g))].filter(name => !['getRandomNumber','getRandomWin','getRandomReturn','getInteger','getBoolean','getString','getOracle','getItemsAddress','getCouponsAddress','getFeeAggregator','getRebirthAddress','getMedhouseIssuedAmount'].includes(name));
  const getters = getterNames.map(name => `func ${name}()=${name === 'getWarsPKey' ? "base58'999'" : "Address(base58'999')"}`).join('\n');
  const resultKey = `address_${owner}_initTx_${initialTx}`;
  for (const t of [
    {name: 'three equal item types receive distinct nonces'},
    {name: 'wrong item issuer caller', issuerCaller: "Address(base58'xyz')", error: 'admin only'},
    {name: 'wrong rebirth owner', caller: '3P3H1W7X5vjLRVKkGGNzHdppECUTMbfpiSS', error: 'WRONG_OWNER'},
    {name: 'replay', status: 'finish', error: 'not open'},
    {name: 'immature', maturity: 1001, error: 'cannot finish rebirth'},
    {name: 'invalid double booster', booster: 'ART-GFTR', error: 'Wrong item'},
  ]) {
    const mocks = `let fixture=Address(base58'abc')
let itemsFixture=Address(base58'456')
let testHeight=1000
let i=Invocation([AttachedPayment(base58'DUBL',1),AttachedPayment(unit,1)],Address(base58'${t.caller || owner}'),base58'abc',base58'dEf',0,unit,Address(base58'${owner}'),base58'abc')
func getOracle()=fixture
func getItemsAddress()=itemsFixture
func getCouponsAddress()=Address(base58'789')
func getFeeAggregator()=Address(base58'ABC')
func getRebirthAddress()=fixture
func getMedhouseIssuedAmount()=0
func staticKey_extraFee()="fee"
func last_height_key()="last_height"
func last_height_key_receiver(a:String)="last_height_"+a
func tryGetBoolean(k:String)=false
func tryGetInteger(k:String)=if k=="${resultKey}_finishBlock" then ${t.maturity || 10} else if k=="${resultKey}_assetRarity" then 10 else if k=="last_height" || k=="last_height_${owner}" then 0 else throw("WRONG_OWNER")
func tryGetString(k:String)=if k=="${resultKey}_status" then "${t.status || 'open'}" else throw("WRONG_OWNER")
func tryGetStringExternal(a:Address,k:String)=if a==fixture && k=="bonus_item_abc_rebirth" then "ART-FREEGENE" else ""
func mockIntegerValue(a:Address,k:String)=if a!=fixture then throw("WRONG_ORACLE") else if k=="fee" then 1 else if k=="bonus_item_abc_rebirth_start" then 100 else if k=="bonus_item_abc_rebirth_end" then 1000 else throw("WRONG_INTEGER_KEY")
func mockInteger(a:Address,k:String)=if a==fixture && k=="bonus_item_abc_rebirth_chance" then 100 else throw("WRONG_CHANCE_KEY")
func mockStringValue(k:String)=throw("UNEXPECTED_RESCUE")
func mockAssetInfo(id:ByteVector)=Asset(id,1,0,fixture,base58'abc',false,false,unit,"unused","unused")
func checkReal(id:ByteVector)=throw("UNEXPECTED_RESCUE")
func getRandomNumber(n:Int,tx:ByteVector,h:Int,o:Int)=if h!=10 then throw("WRONG_RANDOM_HEIGHT") else
  if tx==base58'${initialTx}' then (if n==1000 && o==0 then 10 else if o==1 || o==2 then 0 else throw("WRONG_BASE_RANDOM")) else
  if tx==toBytes("bonus|rebirth")+fixture.bytes+base58'${initialTx}' && n==200 && o==0 then 0 else throw("WRONG_BONUS_RANDOM")
`;
    const invoke = `func mockInvoke(a:Address,f:String,args:List[String|Int],p:List[AttachedPayment])={
  if size(p)!=0 then throw("UNEXPECTED_PAYMENT") else
  if a==getCouponsAddress() && f=="recordAction" && args==["REBIRTH"] then true else
  if a==itemsFixture && f=="checkArtefactDetails" && args==["DUBL"] then "${t.booster || 'ART-GIFT_DOUBL'}" else
  if a==itemsFixture && f=="issueArtefactIndex" then {
    let kind=args[0].exactAs[String]
    let receiver=args[1].exactAs[String]
    let nonce=args[2].exactAs[Int]
    if kind!="ART-FREEGENE" || receiver!="${owner}" || nonce<0 || nonce>2 then throw("WRONG_ISSUE_ARGS") else
    let issued=issueArtefactIndex(kind,receiver,nonce,${t.issuerCaller || 'fixture'})
    let nft=issued._1[0].exactAs[Issue]
    let metadata=issued._1[1].exactAs[StringEntry]
    let transfer=issued._1[2].exactAs[ScriptTransfer]
    if nft.nonce!=nonce || nft.name!=kind || nft.quantity!=1 || nft.decimals!=0 || nft.isReissuable then throw("WRONG_ISSUE") else
    if issued._1[3]!=IntegerEntry("last_height",1000) || issued._1[4]!=IntegerEntry("last_height_${owner}",1000) then throw("WRONG_ISSUER_STATE") else
    if metadata.key!="artefact_"+issued._2+"_type" || metadata.value!=kind || transfer.recipient!=Address(base58'${owner}') || transfer.amount!=1 || transfer.asset!=issued._2.fromBase58String() then throw("WRONG_ITEM_METADATA") else issued._2
  } else throw("UNEXPECTED_INVOKE")
}
`;
    const repl = await replWith(mocks + getters + '\n' + issuer + '\n' + invoke + methods);
    const result = await repl.evaluate(`finishRebirthDouble("${initialTx}")`);
    if (t.error) {assert.ok(result.error?.includes(t.error), t.name + ': ' + JSON.stringify(result)); continue;}
    const output = ok(result);
    const ids = [];
    for (const nonce of [0, 1, 2]) {
      const minted = await repl.evaluate(`issueArtefactIndex("ART-FREEGENE","${owner}",${nonce},fixture)`);
      assert.match(ok(minted), new RegExp(`nonce = ${nonce}`));
      const id = minted.result.match(/key = "artefact_([^"\n]+)_type"/)[1];
      ids.push(id);
      value(result, resultKey + (nonce === 2 ? '_bonusItem' : '_result'), id);
    }
    assert.equal(new Set(ids).size, 3);
    assert.equal((output.match(/_result"/g) || []).length, 2); // Historical duplicate result key is preserved.
    assert.equal((output.match(/_bonusItem"/g) || []).length, 1);
    value(result, resultKey + '_win', 'item!ART-FREEGENE');
    value(result, resultKey + '_win1', 'item!ART-FREEGENE');
    value(result, resultKey + '_status', 'finish');
    value(result, resultKey + '_random', 10);
    value(result, resultKey + '_bonusRandom', 0);
    assert.match(output, /Burn\(\n\tassetId = base58'DUBL'\n\tquantity = 1/);
  }
});
