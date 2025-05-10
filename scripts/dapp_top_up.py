import pywaves as pw

pw.setNode("https://testnet.node.blackturtle.eu/", "testnet", "T")
pete_asset_id = "CS4Md7Bub7fsVZft2cDbTmKeSi6UnYKQQLYnAukKzgST"
puzzle_asset_id = "Cca5C1DNTnJaPCEJFViGxGFATXtaRsSAUNRtVcgSEuEt"
egg_asset_id = "Ag7HEcF5ewbQ84uczdJ2DBG2LA2riks2DtchM2A222vM"
spice_asset_id = "HU8e8oyixyYTD93kjmBfBejhNbRE2qacTzgEyjjTogk7"
seed = "soft cinnamon diet primary analyst sort laundry army minor buzz stomach toddler garlic humor permit"
acc = pw.Address(seed=seed)


# Top up Feline with 10 PETE
print(
    acc.invokeScript(
        "3N5ZQQQtXgjvyN5iYK8kxZsS8eUYrnhcb3T",
        "topUpReward",
        [],
        [{"amount": 10_0000_0000, "assetId": pete_asset_id}],
    )
)

# Top up Eagle with 10 PUZZLE
print(
    acc.invokeScript(
        "3Mqa6zGAReUUwsty7AzdVc62A8ZGtHMFeoi",
        "topUpReward",
        [],
        [{"amount": 10_0000_0000, "assetId": puzzle_asset_id}],
    )
)

# Top up ducks with 10 EGG
print(
    acc.invokeScript(
        "3N33m3JMhEN5QxhDKujcsbpFHo3UcHE4Jwt",
        "topUpReward",
        [],
        [{"amount": 10_0000_0000, "assetId": egg_asset_id}],
    )
)

# Top up dogs with 0.1 Waves
print(
    acc.invokeScript(
        "3NAN9Bp8r6PqgX6VJhNFyoKjHEH8N7bGvBQ",
        "topUpReward",
        [],
        [{"amount": 1000_0000, "assetId": None}],
    )
)

# Top up turtles with 10 SPICE
print(
    acc.invokeScript(
        "3MvqNgAQonu6nSGGh71ohTyBPhzdJxPK7QA",
        "topUpReward",
        [],
        [{"amount": 10_0000_0000, "assetId": spice_asset_id}],
    )
)
