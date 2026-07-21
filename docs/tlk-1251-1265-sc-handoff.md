# TLK-1251 / TLK-1265 smart-contract handoff

Both farm-game entry points are implemented on the coupons dApp.

## TLK-1251: retire a bull into the farm game

Invoke `depositNftIntoGame()` with exactly one attached bull NFT (`amount = 1`). The call must be made directly by the user.

Accepted issuers:

- `static_bullIncubatorAddress` for Genesis bulls
- `static_bullBreederAddress` for bred bulls

The contract validates the NFT invariant, the `BULL-` name prefix, the issuer, and the canonical bull generation. It calls `reduceRarity(assetId, farmGen)` on the actual issuer and permanently burns the NFT in the same transaction.

Generation is stored as a 1-based tier:

| Generation | Tier |
| --- | ---: |
| G | 1 |
| H | 2 |
| I | 3 |
| K | 4 |
| L | 5 |
| M | 6 |
| N | 7 |
| O | 8 |

The coupons dApp writes:

- `GAME_NFT_DEPOSIT_<assetId>_CLASS` = `BULL`
- `GAME_NFT_DEPOSIT_<assetId>_TIER` = numeric tier
- `GAME_NFT_DEPOSIT_<assetId>_OWNER` = sender address
- `GAME_NFT_DEPOSIT_<assetId>_TX` = conversion transaction ID
- `GAME_NFT_DEPOSIT_<assetId>_TIMESTAMP` = block timestamp
- `GAME_NFT_DEPOSIT_TX_<txId>` = `<assetId>;BULL;<tier>`
- per-user and global conversion totals

The backend should only credit a farm bull after the confirmed transaction contains the expected burn and these entries, and the recorded owner matches the farm owner.

## TLK-1265: withdraw SPICE from the farm game

Invoke:

```text
withdrawSpiceFromGame(backendSignature, amount, userNonce, expiresAt)
```

No payment is attached. `amount` is in SPICE atomic units. `userNonce` starts at `1` and must increase by exactly one for each address. `expiresAt` is a Unix timestamp in milliseconds.

The backend signs these UTF-8 bytes with the private key corresponding to the oracle's `static_backendPubKey`:

```text
withdrawSpiceFromGame;<couponsDAppAddress>;<amount>;<userNonce>;<expiresAt>;<userAddress>
```

The method is caller-bound, dApp-bound, amount-bound, nonce-protected, and time-limited. After validation it transfers SPICE to the caller and writes:

- `GAME_SPICE_WITHDRAW_<userAddress>_NONCE`
- `GAME_SPICE_WITHDRAW_<userAddress>_TOTAL`
- `GAME_SPICE_WITHDRAW_TOTAL`
- `GAME_SPICE_WITHDRAW_TX_<txId>` = `<userAddress>;<amount>;<userNonce>;<expiresAt>`

The backend can safely release an unconfirmed reservation after `expiresAt`; the old authorization can no longer be submitted successfully.
