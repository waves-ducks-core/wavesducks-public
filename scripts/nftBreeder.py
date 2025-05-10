import time
import pywaves as pw
import requests

pw.setNode("https://testnet.node.blackturtle.eu/", "testnet", "T")

feli_incubator = "3MwaAkx6seuusecHhgs3DU2tz7GUqPPA8dL"
cani_incubator = "3MtrXLq2YFHNLqTBXr488vaQVQpsHdmbg7C"
eagle_incubator = "3MrzBHoTCQZEyP5yUGbHw4n6mHz7TzJo49r"
eagle_breeder = "3N7oGx2296rxeSa5jtPvUVmeeQxQkWpz15A"
feline_breeder = "3N3E5DdENzNsTDLRTChV21RMKbtVJmoyJwe"
canine_breeder = "3MzBKfvEdHEdy5GmoTxAfLfM1mTafCbaNWv"

price = 50_0000_0000  # just do aribtrairy value
seed = "soft cinnamon diet primary analyst sort laundry army minor buzz stomach toddler garlic humor permit"
feli_asset_id = "CS4Md7Bub7fsVZft2cDbTmKeSi6UnYKQQLYnAukKzgST"
eagle_asset_id = "Cca5C1DNTnJaPCEJFViGxGFATXtaRsSAUNRtVcgSEuEt"
egg_asset_id = "Ag7HEcF5ewbQ84uczdJ2DBG2LA2riks2DtchM2A222vM"
acc = pw.Address(seed=seed)


def compose_url(address: str, dapp: str) -> str:
    return f"https://testnet.node.blackturtle.eu/addresses/data/{dapp}?matches={address}.%2A_status"


def incubate_x_amount_class(
    amount: int,
    incubator: str,
    asset_id: str,
    price: int = 50_0000_0000,
):
    for i in range(0, amount):
        acc.invokeScript(
            incubator,
            "startHatching",
            [{"type": "string", "value": ""}],
            [
                {"amount": 1, "assetId": None},
                {"amount": price, "assetId": asset_id},
            ],
        )


def claim_all_class(incubator: str):
    url = compose_url(acc.address, incubator)
    res = requests.get(url).json()
    for item in res:
        if item["value"] == "HATCHING_STARTED":
            acc.invokeScript(
                incubator,
                "finishHatching",
                [{"type": "string", "value": item["key"].split("_")[1]}],
                [{"amount": 1, "assetId": None}],
            )


def claim_all_breed_class(breeder: str = canine_breeder):
    url = compose_url(acc.address, breeder)
    res = requests.get(url).json()
    for item in res:
        if item["value"] == "BREEDING_STARTED":
            acc.invokeScript(
                breeder,
                "finishHatching",
                [{"type": "string", "value": item["key"].split("_")[1]}],
                [{"amount": 1, "assetId": None}],
            )


def breed_class(type="canine", breeder=canine_breeder, price=1_0000_0000):
    def get_cani_nft(address: str):
        url = f"https://staging.wavesducks.com/api/v2/addresses/{address}/{type}/locked?size=200000&unlocked=true"
        nfts = requests.get(url).json()["data"]["data"]
        canbreed = [e for e in nfts if e["canBreed"] == True]
        return [e for e in canbreed if "-O" not in e["genotype"] and e["locks"] == []]

    nfts = get_cani_nft(acc.address)
    gen_nft = [e for e in nfts if "-G" in e["genotype"]]
    non_gen_nft = [e for e in nfts if "-G" not in e["genotype"]]

    l1 = len(gen_nft)
    l2 = len(non_gen_nft)
    if l2 < 4:
        non_gen_nft = gen_nft[: len(gen_nft) // 2]
        gen_nft = gen_nft[len(gen_nft) // 2 :]
        l1 = len(gen_nft)
        l2 = len(non_gen_nft)

    for i in range(min(l1, l2)):
        acc.invokeScript(
            breeder,
            "startBreeding",
            [{"type": "string", "value": ""}],
            [
                {"amount": 1, "assetId": None},
                {"amount": 1, "assetId": gen_nft[i]["assetId"]},
                {"amount": 1, "assetId": non_gen_nft[i]["assetId"]},
                {"amount": price, "assetId": egg_asset_id},
            ],
        )


time.sleep(5)
incubate_x_amount_class(20, feli_incubator, feli_asset_id, price)
time.sleep(5)
incubate_x_amount_class(20, eagle_incubator, eagle_asset_id, price)
time.sleep(5)
#incubate_x_amount_class(20, cani_incubator, None, price)
#time.sleep(180)
claim_all_class(feli_incubator)
time.sleep(5)
claim_all_class(cani_incubator)
time.sleep(5)
claim_all_class(eagle_incubator)
time.sleep(5)
breed_class("canines", canine_breeder, 1_0000_0000)
time.sleep(5)
breed_class("felines", feline_breeder, 1)
time.sleep(5)
breed_class("eagles", eagle_breeder, 1_0000_0000)
time.sleep(180)
claim_all_breed_class(canine_breeder)
time.sleep(5)
claim_all_breed_class(feline_breeder)
time.sleep(5)
claim_all_breed_class(eagle_breeder)
