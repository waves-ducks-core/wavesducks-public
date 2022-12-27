import pywaves as pw

countSeed = ""


oracle = pw.Oracle(seed=countSeed)
dataList= oracle.getData(regex="user_.*_identifier_Approve dip DIP7.1_vote")

print(dataList)

countAddress = pw.Address(seed=countSeed)

yesVoters={}
noVoters={}
totalYes=0
totalNo=0

params=""
count=0
for item in dataList:
    wallet = item['key'].split("_")[1]
    vote = oracle.getData(key="user_"+wallet+"_identifier_Approve dip DIP7.1_vote")
    power = oracle.getData(key="user_"+wallet+"_vote-power")
    print(wallet)
    params+=wallet+";"
    count+=1

    if vote == "true":
        yesVoters[wallet] = float(power)/100000000
        totalYes+=float(power)/100000000
    else:
        noVoters[wallet] = float(power)/100000000
        totalNo+=float(power)/100000000

    if count == 10:
        #print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","calculateVotes",[{ "type": "string", "value": params[:-1] }],[]))
        count =0
        params=""
    

#if params != "":
    #print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","calculateVotes",[{ "type": "string", "value": params[:-1] }],[]))

print(countAddress.invokeScript("3P38c43ME7gAtDWoM9NqA6juRMzjF2Uxz3b","finalizeVote",[],[]))



print("--------------------")
print("NO")
print(len(noVoters))
print({k: v for k, v in sorted(noVoters.items(), key=lambda item: item[1])})
print(totalNo)

print("YES")
print(len(yesVoters))
print({k: v for k, v in sorted(yesVoters.items(), key=lambda item: item[1])})
print(totalYes)