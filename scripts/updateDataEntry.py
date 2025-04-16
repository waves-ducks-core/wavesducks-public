import requests
import json


stringToGrep = "C1iWsKGqLwjHUndiQ7iXpdmPum9PeCDFfyXBdJJosDRS"
newString = "59muEkmqg3qLUkrwSD7L7ZYhVuoDuqkeono4FvDFHv84"
dapp = "3P3zkxHhAzRzV9PBLB14JXG4ZEEPv4LtDyQ"
data = requests.get(f"https://node.turtlenetwork.eu/addresses/data/{dapp}").json()

editItems = []
deleteItems = []
for item in data:
    if stringToGrep in item["key"] and "reveneu" not in item["key"] and "volume" not in item["key"]:
        item1 = {
            "key": item["key"].replace(stringToGrep, newString),
            "value": item["value"],
            "type": item["type"]
        }
        deleteItems.append(item1)
        item2   = {
            "key": item["key"],
            "value": None
        }
        deleteItems.append(item2)
    if stringToGrep in str(item["value"]):
        item = {
            "key": item["key"],
            "value": item["value"].replace(stringToGrep, newString),
            "type": item["type"]
        }
        editItems.append(item)
        
print(len(editItems))
print(len(deleteItems))

combined = editItems + deleteItems

print(len(combined))
tmpList = []
for item in combined:
    tmpList.append(item)
    if len(tmpList) == 100:
        body = {
            "data":              tmpList
            ,
            "fee": 1500000,
            "chainId": 87,
            "senderPublicKey": "2MS1Ry6BW6AJQXW3XqHpcqxaasZiGRogAcXm8aiAKtwK",
            "type": 12,
            "version": 2,
            "feeAssetId": None
            }
        print(json.dumps(body))
        tmpList = []
    
body = {
            "data":              tmpList
            ,
            "fee": 1500000,
            "chainId": 87,
            "senderPublicKey": "2MS1Ry6BW6AJQXW3XqHpcqxaasZiGRogAcXm8aiAKtwK",
            "type": 12,
            "version": 2,
            "feeAssetId": None
            }
print(json.dumps(body))