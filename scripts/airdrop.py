import pywaves
import requests

oldCF = ""
newCF = ""



masterSeed = ""

assetIdKey = "SHARE_ASSET_ID"

oldCFOracle = pywaves.Oracle(oldCF)
oldCFAssetId = oldCFOracle.getData(assetIdKey)

newCFOracle = pywaves.Oracle(newCF)
newCFAssetId = newCFOracle.getData(assetIdKey)


masterAcc = pywaves.Address(seed=masterSeed)

print(masterAcc)


height = pywaves.height()-1
print(oldCFAssetId,newCFAssetId)
asset = pywaves.Asset(newCFAssetId)

richListUrl = "https://node.turtlenetwork.eu/assets/"+oldCFAssetId+"/distribution/"+str(height)+"/limit/100"
output = requests.get(richListUrl).json()

hasNext = output['hasNext']
list = []

for item in output['items']:
    list.append({
        "recipient":item,
        "amount": output['items'][item]
        })

print(list)

masterAcc.massTransferAssets(list,asset)


while hasNext:
    lastItem = output['lastItem']
    list = []
    richListUrl = "https://node.turtlenetwork.eu/assets/"+oldCFAssetId+"/distribution/"+str(height)+"/limit/100?after="+lastItem
    output = requests.get(richListUrl).json()

    hasNext = output['hasNext']

    for item in output['items']:
        list.append({
            "recipient":item,
            "amount": output['items'][item]
            })

    print(list)

    masterAcc.massTransferAssets(list,asset)