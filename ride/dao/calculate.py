import pywaves as pw

countSeed = ""


oracle = pw.Oracle(seed=countSeed)
dataList= oracle.getData(regex="user_.*_identifier_TAKE-VEGG-CHEATERS-WARS_vote")

print(dataList)

countAddress = pw.Address(seed=countSeed)

params=""
count=0
for item in dataList:
    wallet = item['key'].split("_")[1]
    print(wallet)
    params+=wallet+";"
    count+=1

    if count == 10:
        print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","calculateVotes",[{ "type": "string", "value": params[:-1] }],[]))
        count =0
        params=""
    

if params != "":
    print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","calculateVotes",[{ "type": "string", "value": params[:-1] }],[]))

print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","finalizeVote",[],[]))


