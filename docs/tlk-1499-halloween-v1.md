# TLK-1499 — Halloween 2026 interface v1

Related: TLK-1496 (parent), TLK-1500 (portal), TLK-1530 (Farm Game).

Status: source implementation for review. No deployment or activation has occurred.
The event starts disabled. Do not treat this document as an address/launch manifest.

## Contracts and canonical identities

Deploy `ride/events/halloween2026.ride` as a dedicated, single-campaign dApp and configure
`static_halloweenAddress` on the existing trusted oracle(s). All participating family
oracles must resolve to that same campaign dApp, items issuer, and canonical EGG asset.
The dApp's one-time `configure` pins its oracle and its 30-day calendar. Do not reuse/reset
this dApp for another campaign.

Halloween NFTs are issued by the **existing items contract**, quantity 1, decimals 0,
non-reissuable, with these exact names:

| Name | Meaning |
| --- | --- |
| ART-H26SOUL | Haunted Soul |
| ART-H26SWORD | Haunted Sword |
| ART-H26CAT | Haunted Cat |
| ART-H26ARMOR | Haunted Frost Armor |
| ART-H26FEED | Pumpkin Feed |

The campaign validates issuer AND name AND NFT properties. Asset names alone are not
proof of authenticity. Generic item issuance, store purchases, merger outputs and
item duplication reject these reserved names. Only the campaign may invoke
`items.issueHalloween(kind, receiver, nonce)`; no testnet authorization bypass is added.
Metadata/art and wearable-effect configuration must use these exact codes. No armor,
sword or cat gameplay multiplier is invented by this change; existing wearables must
receive the approved metadata/effect configuration before enabling their use.

## Bounded read interface

Read data entries from the configured trusted campaign dApp, using a server-controlled
node endpoint. Missing counters mean zero; missing booleans mean false. Verify campaign
and version before interpreting a configured address.

| Key | Type | Meaning |
| --- | --- | --- |
| h26_campaign | string | `halloween-2026` |
| h26_version | integer | 1 |
| h26_initialized | boolean | One-time configuration completed |
| h26_start / h26_end | integer | Epoch milliseconds; end is start + 30 days |
| h26_enabled | boolean | Admin acquisition/ritual availability toggle |
| h26_recipes | boolean | Separate manual recipe toggle |
| h26_settled | boolean | Contribution totals and top ten are permanently frozen |
| h26_settledAt | integer | On-chain block timestamp of settlement |
| h26_total | integer | Accepted Souls burned by ritual contributions |
| h26_sequence | integer | Number of accepted contribution transactions |
| h26_user_ADDRESS_total | integer | Personal contributed Soul count |
| h26_user_ADDRESS_sequence | integer | Sequence at which this latest score was reached |
| h26_milestone_N | boolean | N = 200,400,600,800,1000,1200; monotonic unlock |
| h26_top | string | Semicolon-separated addresses, ranked, at most ten |
| h26_user_ADDRESS_armor | boolean | Armor already claimed |
| h26_user_ADDRESS_feed | boolean | Pumpkin Feed already claimed |
| h26_receipt_TXID | string | `address;amount;sequence` |
| h26_receiptSeq_N | string | Transaction ID for ordered/paginated audit reads |
| h26_drop_HASH | boolean | Consumed source-contract + initial-transaction receipt |

Fetch the bounded `h26_top` plus at most ten per-user total/sequence keys to render the
leaderboard. Paginate receipts by sequence; do not scan all account data for the UI.
For stable off-chain reward evidence, perform reads at a consistent confirmed height
or refetch after confirmation. Do not grant rewards from unconfirmed transactions.

**Blackberry Bush:** eligibility is `h26_milestone_1000 == true` AND
`h26_user_ADDRESS_total >= 15`. Grant once with an atomic unique `(campaign,address)`
record. Eligibility is monotonic, so it is safe to grant before settlement; contributions
cannot be reversed via a campaign callable. Full storage leaves delivery pending. The
Farm Game backend grants one existing bush to storage and bypasses only the purchase
level gate. No client-supplied eligibility boolean is authoritative.

At the crossing transaction, ALL Souls in that batch count (maximum final total 1209).
That caller can qualify from the crossing batch. Later contributions are rejected.
Tie order is earliest sequence reaching the tied score; arriving at the same score later
never displaces an existing equal-score leader.

## Calls and exact payments

Transaction fee is separate from attached payments; ten NFTs use all ten payment slots.
All no-payment methods reject unexpected attached payments.

| Callable | Arguments | Attached payments / authority |
| --- | --- | --- |
| configure | oracleAddress:string, start:int | Self-only, once, no payments; start in future; verifies EGG has 8 decimals |
| setEnabled | enabled:boolean | Self-only; cannot re-enable after end or change calendar |
| setRecipesEnabled | enabled:boolean | Self-only; independent of acquisition/settlement |
| buySoul | none | Exactly one payment: configured EGG, amount 100000000; 100% Burn |
| convertSoul | none | Exactly one canonical conversion NFT, amount 1; burned |
| contribute | none | 1–10 distinct ART-H26SOUL NFTs, amount 1 each; all burned |
| craft | kind:string | ART-H26SWORD: ten Souls OR Fire/Easter Sword plus one Soul; ART-H26CAT: two Souls plus ART-CAT |
| claimArmor | none | No payments; milestone800, personal>=10, once |
| claimPumpkinFeed | none | No payments; settled, final top10, once |
| settle | none | Anyone, no payments; only at/after day30, once |
| completion | receiver:string, initialTx:string, finishHeight:int | Only configured supported completion dApps; no payments; internal gameplay hook |

Sword unlocks at400, Cat at600. Canonical conversion types fixed in code are ART-BONE,
ART-SKELHEAD, ART-BBALL, ART-SNOWBALL, ART-CNDY (Candy), ART-GFTW (White Gift),
and ART-GFTR (Red Gift). The final three names are confirmed by the portal's
`shared/enums/items.ts` and `shared/constants/items.ts`. The complete list is fixed
in source, not a caller-selectable conversion mapping.

Typical contribution InvokeScript call:

```json
{
  "dApp": "<verified campaign address>",
  "call": {"function": "contribute", "args": []},
  "payment": [{"assetId": "<canonical Soul NFT ID>", "amount": 1}]
}
```

Do not attach an application fee to `craft`/`contribute`/`buySoul`. Client retries should
check transaction inclusion or claim flags before submitting a new transaction. The
chain makes a transaction atomic; a failed cross-dApp mint or unlock rolls back burns,
contribution state and all nested changes.

## Acquisition and probability matrix

| Family | Breeding completion | Rebirth completion |
| --- | --- | --- |
| Duck | breeder finishDuckHatch | ducks/rebirth finish |
| Turtle | turtle/breeder finish | turtle/rebirth finish |
| Canine | cani/breeder finish | cani/rebirth finish |
| Feline | feli/breeder finish | feli/rebirth finish |
| Eagle | eagl/breeder finish | eagl/rebirth finish |
| Bull | bulls/breeder finish | bulls/incubator rebirth finish |

No ordinary incubator hatching drop is introduced. Admin-finished breeding uses the
actual recorded owner, not the administrator, as the recipient. Source contracts keep
their existing completion-status checks. The campaign additionally binds its drop
receipt to source dApp and initial transaction ID. Entropy is fixed to the prescribed
finish block's predecessor VRF, with a campaign/source domain and normalized unsigned
modulo (40 of 100 outcomes). Delaying completion does not reroll it. Paused/expired
campaigns return no drop without blocking ordinary animal completion.

## Genes, jackpots and permanent unlocks

- At200 the campaign atomically calls `bulls/incubator.unlockHalloween()`. Its permanent
  `h26_genesisUnlocked` flag rotates current genes from B/C/D/E to C/D/E/F; historical
  A/B remain available in historical selection. Breeder old-gene selection also adds B.
- At1200 the campaign atomically calls `ducks/incubator.unlockHalloween()`. Its permanent
  `h26_darkPhoenixUnlocked` flag causes future Phoenix outcomes to issue
  `DUCK-WDARKPHX-JU` (Dark Phoenix). Existing `DUCK-WWWWWWWP-JU` NFTs are unchanged.
  The previously commented Phoenix issuance path is restored. Both unlock methods
  require the configured campaign as caller and accept no payment. There is no relock.
- Wizard Turtle: `TRTL-WWIZARDT-JU`, breeding only, max2.
- Zombie Bull display name **Moldy Mort**: `BULL-WMOLDYMT-JU`, breeding only, max2.
- Each corresponding breeder enforces its own immutable campaign issuance counter
  `h26_jackpot_issued < 2` in the exact outcome/Issue path. Incubator generic jackpot
  methods reject these reserved genes, including admin/rebirth calls.
- Historical reference: turtle winter jackpot in `ride/turtle/incubator.ride` / rebirth
  uses `getRandomNumber(200, ..., 1) == 1` (1/200). Bull summer implementation at
  commit `e131b7d` uses `getRandomNumber(1000, ..., 2) == 1` (1/1000). These denominators
  are reused with normalized deterministic VRF selection, replacing the ordinary
  breeding outcome. Review the turtle historical selection before activation if
  product intended the most recent cross-species summer rate instead.
- Jackpot availability follows the30-day active window, independently of ritual1200.

## Pumpkin Feed staking/accounting

Use existing `accBooster.stakeItem()` / `unstakeItem("ART-H26FEED")` with their normal
configured WAVES fee. One escrowed feed per wallet, no burn/expiry, existing240-block
restake cooldown. Bull farming reads that escrow and adds3% of base rarity-adjusted
power; other species receive no Pumpkin boost.

Stake and unstake changes are blocked while the wallet has bull farming power OR
tracked original-caller positions. Bull farming maintains `h26_origin_ADDRESS_count`
and `h26_ASSET_origin` on stake/recalculation/unstake, including proxy/house positions.
This prevents removing a booster while housed bulls keep stale boosted power. Existing
unregistered positions gain tracking on the first recalculation that can apply the
boost. Original-caller attribution persists across subsequent claim callers. The user
must remove their bulls before changing the feed, then restake them.

## Calendar, admin and cleanup

Backend event controls must prepare/submit an authorized on-chain operation and wait
for confirmation before declaring the chain active. A Farm Game database toggle cannot
sign for this dApp. `setEnabled(false)` is a reversible pause only before day30; it never
changes start/end, milestone state, receipts, leaderboard or claims. Re-enabling after
ritual settlement only reopens acquisition within the original calendar; contributions
remain closed. Recipes have their own manual toggle and earned claims stay available.

At day30 contributions/acquisition close by block timestamp even if no bot runs.
**Reviewable fallback:** anyone can call settle after expiry to freeze final top10 when
1200 was not reached; only reached milestones unlock, top10 can claim feed. This
unreached-target fallback was a planning recommendation and should be explicitly
reviewed before launch. Farm Game may continue its entire30-day period after early
ritual settlement.

Never erase claim flags, receipts, earned entitlements, NFT metadata, jackpot counters
or permanent incubator flags in routine cleanup. Before replacing any deployed script,
oracle entry or non-versioned configuration, capture and verify a complete recovery
before-image outside the live target, including types/identifiers and rollback steps.
Admin-managed oracle addresses remain a trust boundary inherited from the game.

## Deployment/rehearsal gates and order

1. Review exact launch timestamp, art/wearables metadata,
   historical turtle rate, and the day30 fallback. Produce one explicit testnet mapping;
   preserve tracked production IDs. Establish the new campaign's approved fixed testnet
   signer/address and matching `seeds.json` entry using the repository policy.
2. Capture and verify scripts and full configuration/state before-images for every
   existing dApp/oracle that will change, with deterministic rollback manifest.
3. Compile via `npm run compile:halloween` (normal surfboard for each family contract,
   plus compacted estimator3 check). Legacy large dApps require compaction and unused
   function removal to fit32768 bytes. Use the verified exact bytes for deployment.
4. Deploy items, booster, bull farming, duck/bull incubators and completion families,
   then the campaign. Keep static_halloweenAddress absent until every target supports
   its new authenticated interface. Configure the campaign once, still disabled.
5. Populate consistent oracle mappings only after all scripts are installed. Verify
   addresses, network, counterpart issuer identities and EGG decimals. Activation is
   last, via authorized self-invoke. Never use the surfboard default/mainnet seed.
6. Testnet rehearsal must exercise real NFT transfer/burn/issue, nested invocation
   limits/fees, all twelve completion paths, both jackpots/caps, all milestones,
   pending-storage delivery and direct/house/proxy farming stake/claim/unstake. Record
   transaction IDs and balance/state assertions. Offline tests do not replace this.
7. Rollback/disable: pause campaign and disable recipes first; preserve earned claims
   and permanent unlocks. Restore scripts/config from verified before-images only after
   assessing minted/staked event assets; an old script may not support their unstaking.
   Never blindly roll back booster/farming after live Pumpkin staking.

No testnet or production transaction has been signed/broadcast for this implementation.
The applicable waves-testnet-overrides skill requires explicit transaction approval,
matching fixed signer/address mappings, and reviewed testnet-only payloads.
