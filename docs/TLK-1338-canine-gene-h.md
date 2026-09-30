# TLK-1338 — canine H release

Base: refreshed origin/main2 (this repository has no master branch).
Normal incubation now selects E/F/G/H. The complete pool remains A–H, and
extinct-gene artefacts now select A/B/C/D. Rarity keys retain the established
8H-G format. This matches the preceding feline gene-release pattern.

Both modified contracts compile with Surfboard. Run
`node scripts/test-canine-h.cjs` with @waves/ride-js available to verify the
current/retired pools, evaluate the actual Ride selection function for all
four colors, and require every callable/payment/authority/asset-flow line
to remain identical to origin/main2 outside the two gene-pool helpers.
For the event branch, pass its pre-gene-change baseline explicitly:
`node scripts/test-canine-h.cjs dd867ce`. This preserves the same parity check
without treating the existing Halloween completion logic as a gene change.

Callable review (no callable changes):
- Incubator configureOracle/setDiscount: self only. increaseRarity and
  issueJackpot: self/rebirth. reduceRarity: self/rebirth/coupons. issueFree:
  approved canine/duck/eagle rebirth contracts. startHatching/finishHatching:
  public, existing fees and caller-bound status/finish-height checks.
- Breeder createSpecialGenes/configureOracle: self only. Rarity changes:
  self/rebirth (also coupons for reduction). validateAndGetChildren and
  getGenFromName: public reads. copyNFT/startBreeding/finishHatching/fixedGene/
  freeGene: existing public payment, artefact, ownership and status checks.
- freeGene still validates ART-FREEGENE before selecting a retired gene,
  completes only the caller's pending process and burns the artefact.
- Missing indexed payments still fail evaluation; existing unguarded index
  access and incubator fee-validation TODOs remain unchanged. No new payment
  fallback, invoke target, role, transfer, replay path or production ID.

Testnet deployment must preserve already-deployed Halloween breeder logic:
merge this branch into feature/TLK-1499-halloween-contracts and deploy its
breeder plus incubator. Verify fixed per-dApp signers, TESTENV, oracle mapping,
complete before-images and live-script drift before SetScript. Retain the
rollback scripts and typed account state outside this repository.
