# Smart Contract Security Workflow

Use this checklist for every smart-contract change before pushing or deploying.
The goal is to catch public callable abuse vectors, especially access-check and
branching mistakes.

## Required Before Push

1. Compile every changed contract.
   - Run the normal `surfboard compile` command for each changed `.ride` file.
   - Do not push if a changed contract only works because an unused path avoided compilation.
   - If one contract imports/copies logic from another family, compile the whole family.

2. Build a public method inventory.
   - List every `@Callable` method in the changed contract.
   - For each method, write who is allowed to call it: anyone, contract itself, oracle, admin, another dApp, or a specific role.
   - If the caller is not "anyone", verify the code checks `i.caller`, `i.originCaller`, signatures, or another explicit authority source.

3. Review every `if` / `else` branch in public methods.
   - Confirm the fallback branch is safe, not a cheap/default success path.
   - Check optional-payment branches carefully: invalid optional boosters, coupons, artefacts, or assets must either throw or charge the normal amount.
   - Search for suspicious low constants in payment logic, for example `else 1`, `else 100`, `else 100000`, or hard-coded discounts.

4. Validate all attached payments.
   - Check `size(i.payments)` before indexing into `i.payments[n]`.
   - Verify each required payment asset ID and exact or minimum amount.
   - Verify optional payments are either fully validated and consumed or ignored safely.
   - Confirm refunds cannot be triggered with the wrong asset or by underpaying.

5. Verify all external invokes.
   - Confirm the target address comes from the expected static key or hard-coded trusted address.
   - Confirm public methods cannot redirect target dApps through user-controlled oracle/config values.
   - Check that invoked methods are safe to call from this contract and cannot mint, transfer, or credit arbitrary values unexpectedly.

6. Check asset movement and accounting.
   - For every `ScriptTransfer`, `Burn`, `Issue`, and external reward/top-up call, confirm who benefits and what balance funds it.
   - Ensure caller-supplied `address`, `assetId`, `amount`, and list arguments cannot drain contract balances or credit arbitrary users.
   - Confirm counters and status keys are updated in the same path as asset movement.

7. Check replay and uniqueness.
   - For signatures, verify the signed payload binds the caller, chain, contract, function, parameters, amount, and nonce or transaction ID.
   - For finish/claim methods, verify a status key prevents double claim.
   - For user-supplied transaction IDs, verify they are tied to the caller and expected start transaction.

8. Check admin/config functions.
   - Every method that changes oracle, prices, static addresses, whitelists, metadata, or role state must be admin-gated.
   - Public initialization methods must only work once and must not let a random caller set oracle/admin addresses.
   - Testnet-only gates must not weaken mainnet verification.

9. Compare sibling contracts.
   - When editing `cani`, `feli`, `eagl`, `bulls`, `ducks`, or similar families, diff the equivalent function in sibling contracts.
   - Differences must be intentional and documented in the PR or commit message.
   - If code was copied, verify helper functions, constants, static keys, and event/status values were copied too.

10. Run targeted abuse searches.
    - Search changed contracts with:
      - `rg -n "@Callable|i\\.caller|i\\.originCaller|i\\.payments|ScriptTransfer|Issue\\(|Burn\\(|invoke\\(" ride`
      - `rg -n "else +[0-9]+|== this|!= this|configure|init\\(|oracle|static_|assetId|amount" ride`
    - Investigate every hit in changed files that affects authorization, price, or asset flow.

11. Test the exact abuse cases.
    - For public methods, test unauthorized caller attempts.
    - For payment methods, test missing payment, wrong asset, underpayment, overpayment/refund, and invalid optional booster/coupon.
    - For claim/finish methods, test double claim and wrong caller.
    - Use testnet calls when local simulation is not enough.

12. Record deployment safety.
    - For testnet deploys, use testnet overrides and never commit prod-to-testnet mutations.
    - Before `setScript`, verify target dApp address, signer-derived address, and intended network.
    - Record deployed tx IDs in the work note or PR.

## Minimum Push Gate

Do not push a smart-contract change unless these are true:

- All changed contracts compile.
- Every changed public method has an explicit caller/payment/asset-flow review.
- Every optional branch either throws, validates fully, or falls back to the normal safe path.
- Sibling contracts were compared when the same pattern exists elsewhere.
- Testnet or local abuse checks were run for the method being changed.
- Known residual risks are written down.

## Incident Response Shortcut

When there is suspected live abuse:

1. Freeze or deploy the smallest safe patch first.
2. Search sibling contracts for the exact same pattern.
3. Compile and deploy only the affected contracts.
4. After containment, run the full checklist above and open follow-up issues for broader risks.
