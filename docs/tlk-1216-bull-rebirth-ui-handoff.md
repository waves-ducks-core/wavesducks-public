# TLK-1216 Bull Rebirth UI Handoff

## Deployment

Testnet deployment completed on 2026-04-22.

- Shared oracle data `jsonData/oracle-dev.json`: `7SpRBRW1MxWXVwxBoSNzL8agEnL2J9gkuJpTan9qM1Bq`
- Bull oracle data `ride/bulls/oracle-dev.json`: `G4Kbg9xsR79ytgx815E65xLEErF8Veynm3gxetzRviyF`
- Bull breeder script: `44KMo6YCpvr9Es3hbKKxQeN2BPYWguaPZqKP2Z9P2J8s`
- Bull farming script: `Hn2yW8FVPJab66MGXwRajEN8wox4Ka4BkL4yahgeWyqA`
- Baby ducks script: `54AP67Jx1tMU2Uk5CJKqYt2xXwCW6sWZfAgsTXMEJ34w`
- Items script: `igLUguR1ZQhB6s1DFwjZX8VXnud4nE1TiTinqgRXiZW`
- Bull incubator/rebirth script: `EKarB7aijCp2xosoBwbnfciheVUkDA6WKPncSoJGMuyY`
- Bull incubator/rebirth script with `finishRebirthItem` / `finishRebirthDouble` support: `HiECYaU1RhaRqodRXu4KLUL6uskHDdHCE2qihjZCe1me`

## Testnet Addresses

- Shared oracle: `3MxZNnLG9EBcb4yExxNwcFq9vcyMb7DcGT9`
- Bull incubator and rebirth dApp: `3N9osDS2cP1cT1NxJm7gb16Qusff5zHh5BF`
- Bull breeder: `3N92kXgNnFmC8zQ4dkui6xLn6xXym1P6htV`
- Bull farming: `3MqBeXvwb1ZEiMjG4edw6uRBBTqGbyrLsqN`
- Items: `3N1ZfechNGoBTZyzvCAxGXPKchL4C6438dr`
- Baby ducks: `3MpLKSQezEyHJk8jn9ikzAaaGuRzy5STBLZ`
- TN asset: `DDbgwqvbAyiWTahPXcPECiYwAyw7wHy5FaK5Dg4PbDjN`

## Oracle Keys

Bull oracle keys:

- `static_bullAssetId`: TN asset id.
- `static_bullIncubatorAddress`: bull incubator and rebirth dApp address.
- `static_bullIncubationFee`: existing hatch fee.
- `static_bullRebirthPrice`: `99900000000`, meaning 999 TN with 8 decimals.
- `static_bullPerchFee`: existing bull ranch/perch fee.
- `static_bullFarmingAddress`: bull farming dApp.
- `static_bullBreederAddress`: bull breeder dApp.

Shared oracle keys used by rewards:

- `static_bullIncubatorAddress`: authorizes bull rebirth calls from the incubator.
- `static_itemsAddress`: item reward issuer.
- `static_babyDuckAddress`: baby duck reward issuer.
- `static_mutantFarmingAddress`: receives 1% of rebirth TN as top-up.
- `static_feeAggregator`: receives wave extra fee and 9% of rebirth TN.
- `static_extraFee`: required WAVES payment for every callable.

There is no separate `static_bullRebirthAddress`; use `static_bullIncubatorAddress`.

## UI Flow

Start a rebirth with `initRebirth()` on the bull incubator/rebirth dApp.

Payments, in exact order:

- Payment 0: the bull NFT, amount `1`.
- Payment 1: TN, amount from `static_bullRebirthPrice`, currently `99900000000`.
- Payment 2: WAVES, amount from shared/bull oracle `static_extraFee`, asset id omitted or `null`.

Finish a rebirth on the same dApp. The bull rebirth reuses the existing incubator contract and supports the same finish item flow as other rebirths.

Normal finish:

- Method: `finishRebirth(initTx: String)`
- Payment 0: WAVES, amount from `static_extraFee`, asset id omitted or `null`.

Double reward finish:

- Method: `finishRebirthDouble(initTx: String)`
- Payment 0: one `ART-GIFT_DOUBL` item NFT.
- Payment 1: WAVES, amount from `static_extraFee`, asset id omitted or `null`.

Item-assisted finish:

- Method: `finishRebirthItem(initTx: String, itemCode: String)`
- Without booster: one WAVES payment, same as normal finish.
- With booster: Payment 0 is one booster item NFT, Payment 1 is the WAVES extra fee.
- `ART-HWERASE`: burns the booster and blacklists `itemCode` from the reward selection.
- `ART-HWRESCUE`: burns the booster and adds a 50% chance to return the rebirthed bull NFT, restoring its rarity/stat counters.
- `ART-GIFT_DOUBL`: burns the booster and returns a double reward.

Arguments:

- `initTx`: the transaction id returned by `initRebirth`.
- `itemCode`: only used by `ART-HWERASE`; pass the full reward code to blacklist, for example `item!ART-FEED5`, `bull_ranch_A`, `duckling_10`, or `bull_genesis`.

Timing:

- Rebirth uses `delayForHatching = 2`, so finish is allowed at `initHeight + 2`.
- If called too early, the contract throws `BRF: you cannot finish rebirth yet`.

## Data Keys

For caller address `address` and init transaction id `initTx`:

- Status: `address_${address}_initTx_${initTx}_status`
- Finish height: `address_${address}_initTx_${initTx}_finishBlock`
- Rebirth asset: `address_${address}_initTx_${initTx}_assetId`
- Reward code after finish: `address_${address}_initTx_${initTx}_win`
- Reward code for the second reward when doubled: `address_${address}_initTx_${initTx}_win1`
- Issued reward asset/result id: `address_${address}_initTx_${initTx}_result`
- Second issued reward asset/result id when applicable: `address_${address}_initTx_${initTx}_result1`
- Random roll: `address_${address}_initTx_${initTx}_random`

Status values:

- `REBIRTH_STARTED`
- `REBIRTH_FINISHED`

The UI should store the init transaction id locally or derive active rebirths by querying dApp data keys for the connected address.

## Rewards

Random is based on the init tx id and finish block. Thresholds are out of 1000.

- 10.0% `item!ART-FEED5`
- 13.5% `item!ART-FEED10`
- 10.5% `item!ART-FEED15`
- 8.0% `item!ART-FEED20`
- 6.0% `item!ART-FEED25`
- 5.0% `bull_ranch_A`
- 5.0% `bull_ranch_B`
- 5.0% `bull_ranch_C`
- 5.0% `bull_ranch_D`
- 5.5% `duckling_10`
- 3.5% `duckling_20`
- 2.0% `duckling_40`
- 3.0% `item!ART-KATANA`
- 3.0% `item!ART-BUILTBODY`
- 5.0% `item!ART-CANCPN`
- 1.0% `item!ART-TOPHAT`
- 1.0% `item!ART-ICECREAM`
- 1.0% `item!ART-ORB`
- 1.0% `item!ART-SCEPTER`
- 1.0% `item!ART-SHOPBAG`
- 0.7% `item!ART-FEED50`
- 0.3% `item!ART-FEED100`
- 0.4% `item!ART-POTION`
- 0.4% `item!ART-ENEST`
- 0.5% `item!ART-ROBODUCK`
- 0.7% `bull_genesis`
- 1.2% `item!ART-FIXGENE`
- 0.8% `item!ART-FREEGENE`

Reward result handling:

- `item!CODE`: calls items `issueArtefactIndex(CODE, address, 0)`.
- `bull_ranch_X`: calls bull farming `addFreePerch(address, X, 1)`.
- `duckling_10`, `duckling_20`, `duckling_40`: calls baby ducks `issueFreeDuckling(address, initTx, level)`.
- `bull_genesis`: calls bull incubator `issueFree(address, initTx)`.

Double reward handling:

- Item rewards issue two item NFTs with indexes `0` and `1`.
- Ranch rewards add two free perches.
- Duckling rewards issue one duckling with doubled level.
- `bull_genesis` issues two free bulls, using `initTx` and the finish transaction id as separate entropy inputs.

## Payment Split

On `initRebirth`, the 999 TN payment is split in-contract:

- 90% burned.
- 1% sent to mutant farming through `topUpReward("TN", 0)`.
- 9% transferred to `static_feeAggregator`.

Both `initRebirth` and `finishRebirth` also require `static_extraFee` in WAVES.

## Valid Bull Inputs

The bull NFT may be issued by:

- Bull incubator/rebirth dApp.
- Bull breeder dApp.

If the bull came from the breeder, rebirth invokes breeder `reduceRarity(assetId, gen)`.

## Current PR

GitHub PR: https://github.com/waves-ducks-core/wavesducks-public/pull/25

Branch: `feature/TLK-1216-bull-rebirth`
