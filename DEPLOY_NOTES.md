# Deploy Notes

## Testnet Overrides

- For any `testnet` deploy, always override prod addresses and prod asset IDs in a temp payload.
- Never deploy prod IDs/addresses from git files directly to testnet.
- Keep prod values in git unless explicitly asked to change tracked files.

## SetScript Safety

- Never use an alternate seed for `setScript` unless the target dApp address is derived from that exact seed and is explicitly the intended target.
- Before every `setScript` deploy, verify:
  - target dApp address
  - sender address derived from the signing seed
  - `senderPublicKey`
- If they do not match the intended target account, do not broadcast.

## Dual-Signed SetScript

When a dApp verifier requires an extra admin signature for `SetScriptTransaction`:

1. Build the `SetScriptTransaction` from the target dApp seed first.
   - This defines the correct sender account and `senderPublicKey`.
2. Clear proofs on that tx object.
3. Sign the same tx with the admin/extra seed first so it lands in `proofs[0]`.
4. Sign the same tx again with the dApp seed so the dApp proof lands in `proofs[1]`.
5. Broadcast that dual-signed tx.

Do not re-create the `setScript` tx from the admin seed. That deploys to the admin seed address instead of the intended dApp.
