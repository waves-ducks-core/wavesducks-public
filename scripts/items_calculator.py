import pywaves as pw
import requests
address = pw.Address(address="3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR")
oracle = pw.Oracle(oracleAddress="3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR")
marketOracle = pw.Oracle(oracleAddress="3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG")
dataList= oracle.getData(regex=".*_artefactId")
print(dataList)
height = pw.height()-1
owners = {}
for item in dataList:
    richListUrl = "https://node.turtlenetwork.eu/assets/"+item['value']+"/distribution/"+str(height)+"/limit/100"
    output = requests.get(richListUrl).json()
    owner = ""
    for i in output['items']:
        print(i)
        owner = i

    if "3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG" in output['items']:
        #print("auction_"+item['value']+"_last")
        output2= marketOracle.getData(regex="auction_"+item['value']+"_last")
        auction= output2[0]['value']
        auction_owner = marketOracle.getData(regex="auction_"+auction+"_owner")
        print(auction_owner[0]['value'])
        owner = auction_owner[0]['value']

    if owner not in owners:
        owners[owner] = 1
    else:
        owners[owner] = owners[owner] + 1


print(owners)
sum=0
for item in owners:
    sum += owners[item]
print(sum)