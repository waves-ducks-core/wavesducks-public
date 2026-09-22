# TLK-1499 security review and validation

Scope: dedicated Halloween2026 dApp; existing items/booster; six breeding and rebirth
families; bull farming/genesis; duck Phoenix issuance. No live data/script mutation.
See `tlk-1499-callable-inventory.md` for the full public-method inventory of changed
contracts, including unchanged legacy methods.

## Authority and asset-flow review

| Surface | Allowed caller | Payment / state / asset rule |
| --- | --- | --- |
| configure | Campaign itself, once | No payment; explicit oracle, future fixed30-day calendar; no reset |
| setEnabled / setRecipesEnabled | Campaign itself | No payment; enable cannot extend past end; no state deletion |
| buySoul | Anyone | One exact 1EGG payment; atomic full Burn and canonical mint |
| convertSoul | Anyone | One exact NFT, existing items issuer and configured canonical name; burned |
| contribute | Anyone during active unsettled window | 1–10 distinct canonical Soul NFTs; burn and ledger/milestones/rank/settlement atomic |
| craft | Anyone with unlocked recipe | Exact ingredients/counts; all canonical; all burned; no optional fee |
| claimArmor | Eligible address itself | No payment; milestone800 and personal>=10; permanent claim flag |
| claimPumpkinFeed | Final top10 address itself | No payment; settled; permanent claim flag |
| settle | Anyone after end | No payment; no early finalization; irreversible once |
| completion | Exact configured breeding/rebirth dApps | No payment; fixed finish-block entropy, source+initialTx receipt, no caller-selected roll |
| items.issueHalloween | Exact oracle-configured campaign | No payment; closed five-name output set; canonical issuer |
| incubator.unlockHalloween | Exact oracle-configured campaign | No payment; only writes permanent true flag, returns true |
| incubator.issueJackpot | Existing self/rebirth authority | Reserved breeding genes rejected universally; new Dark Phoenix also needs local unlock and duck rebirth caller |
| accBooster.stakeItem | Anyone | Exact2 payments checked before indexing; fee validated; canonical item; one feed; cooldown; no outstanding bull positions |
| accBooster.unstakeItem | Escrow owner | Exact1 validated fee payment; no outstanding bull positions; returned NFT matches escrow; cooldown recorded |
| bull farming stake/claim/unstake | Existing owner/origin-caller rules | Original-caller position tracking blocks stale boost escape via houses/proxies; unstake releases stored power and count |
| breeding finish paths | Existing caller/recorded-owner/admin finish rules | Existing initial transaction status and finish-height checks; jackpot capped in same Issue action list; replay remains rejected |
| rebirth finish paths | Existing caller/recorded-owner/admin finish rules | Existing pending status/height/payment checks; bonus dropped only within successful completion |
| existing generic item output paths | Existing authorities unchanged | Central issueItem and direct store/duplicator outputs reject all five reserved campaign types |

There are no user-supplied target-dApp addresses in gameplay calls. Trusted addresses
come from the established oracle. Only self-signed one-time configuration selects the
new campaign's oracle. The new verifier uses the campaign account's own signature;
production custody/multisig setup is a deployment decision, not a permissive test flag.

Canonical NFT validation checks issuer, quantity1, decimals0, non-reissuability, name,
amount1 and non-WAVES asset ID. Contribution/crafting explicitly reject duplicate NFT
IDs. Receipt keys fit Waves data-key bounds; leaderboard remains10 addresses. Receipt
pages are bounded by caller-selected sequence ranges off-chain. At most10 Souls enter
a contribution, so a1199 total can end at1209; no funds are silently truncated/refunded.

New state-changing callables reject extraneous attached payments. Existing booster
entry points now check count before indexing. No low-cost optional-payment fallback is
introduced. Failed issuance, burn, unlock or source completion reverts all nested changes.
The five NFT names cannot be reached through generic issuance, store, merger, or
item duplication. Counterparty items has no arbitrary receiver callback/reentrancy hook.

## Sibling comparison and deliberate differences

All six breeding families and all six rebirth completion families call the same optional
oracle-resolved completion relay. Duck breeder passes the recorded `owner` because its
shared finish function serves admin completions. Other breeder helpers receive their
existing Invocation. Bull rebirth lives in its incubator; ordinary incubator hatching
is intentionally excluded. Wizard Turtle and Moldy Mort affect only the two respective
breeders; normal animal completion continues after the cap is exhausted. The permanent
genesis and Phoenix unlocks are local incubator flags and do not depend on event pause
or the event oracle entry surviving cleanup.

Pumpkin changes apply only to bull power. Existing Lake/Floating Castle/Xmas effects
retain their existing species paths. The feed changes no duck-wide shared item boost.
Origin-position accounting covers direct and proxy/house stake, recalculation and
unstake; it records the original owner so a later intermediary cannot change attribution.

## Tests and compile evidence

- `npm run test:halloween`: 46 passing tests. The official Ride REPL executes production function bodies with
  blockchain reads and cross-contract writes mocked at the I/O boundary. Tests include
  canonical/counterfeit assets; amount/decimal/reissuable rejection; payment limits and
  duplicates; all milestone boundaries; crossing-batch settlement; monotonic claims;
  pause/end/start bounds; exact EGG burn; all7 conversions; recipes; leaderboard ties
  and36 interleaved contribution transactions; historical jackpot denominators/cap2;
  genesis rotation; permanent-unlock authority; booster escrow/stake/unstake guards.
- `npm run compile:halloween`: runs normal surfboard compile for all32 sibling-family
  contracts plus a deployment-size check with estimator3, compaction and unused-code
  removal. Existing legacy large dApps need compaction to fit32768 bytes.
- `git diff --check` and targeted authorization/payment/invoke/Issue/Burn searches.

The REPL harness preserves production callable logic but does not simulate the entire
Waves transaction engine. It does NOT validate cross-contract execution budgets, smart
asset scripts, network fees, real ownership transfers or end-to-end house transactions.
No testnet deployment or real reward mint has been performed. These remain explicit
pre-activation gates; see the interface document for deployment/rollback order.

## Residual risks and launch gates

1. Existing source has legacy generic authority/configuration methods and test flags.
   Their historical behavior is not redesigned here; new campaign outputs are explicitly
   blocked from those generic methods. Production oracle custody is trusted.
2. Launch timestamp, fixed campaign signer/address, art/metadata/wearable effects, and the historical turtle-rate choice need a reviewed
   launch manifest. Do not activate placeholders.
3. Day30 settlement below1200 is a documented proposed fallback, not an already-confirmed
   product decision. It awards final top10 feed and leaves only reached milestones active.
4. Restoring an old booster/farming script after feed staking can strand positions or
   break accounting. Pause first and assess/migrate outstanding positions only with a
   verified complete rollback artifact and explicit operational plan.
5. The testnet safety skill requires explicit approval before signing/broadcast; matching
   fixed seeds.json entries and complete verified before-images are also prerequisites.
   No signer material is committed and no production identifiers are overwritten.
