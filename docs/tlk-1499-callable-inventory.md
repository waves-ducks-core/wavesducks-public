# TLK-1499 callable inventory

Generated from the reviewed source. Existing methods retain their prior authority unless marked in the security note. The gate excerpt is the actual beginning of the implementation, not inferred policy.

## ride/artefacts/accBooster.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry(staticKey_oracleAddress(),oracle) ]` |
| stakeItem | `if size(i.payments) != 2 then throw("error") else let validPayment = checkAdditionalPayment(i.payments[1]) if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value()` |
| unstakeItem | `if size(i.payments) != 1 then throw("error") else let validPayment = checkAdditionalPayment(i.payments[0]) if ! containsElement(stakeable, artefactName) then throw("error") else let invoker = i.caller.toString()` |
| oneTimeUseFeed | `let validPayment = checkAdditionalPayment(i.payments[1]) if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict artefactName = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String]` |
| addFeedLimit | `if i.caller != getMutantFarmingAddress() && i.caller != getScriptMasterAddress() then throw("error") else [ IntegerEntry(keyFeedLimit(address), tryGetInteger(keyFeedLimit(address))+amount) ]` |

## ride/artefacts/items.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| startShakeItBaby | `let itemPayment = i.payments[0].value() let validPayment = checkAdditionalPayment(i.payments[1]) let itemAssetId = itemPayment.assetId.value().toBase58String() if itemPayment.amount != 1 then throw("error") else` |
| finishShakeItBaby | `finishShakeItBabyInternal(initTx, i.caller.toString(),i.payments[0]) }` |
| instanMergeItem | `if tryGetString("merge_"+receiptName+"_endItem") ==  "" then throw("error") else if receiptName == "ART-FTCAST" && !tryGetBooleanExternal(getCouponsAddress(), "summer_unlocked") then throw("error") else let params = (getAmountBaseItem(receiptName),getEndItem(receiptName),getPrice(receiptName), get` |
| directBuyItemMultiple | `let array = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14, 15,16,17,18,19,20,21,22,23,24,25,26,27,28,29] let basePrice = tryGetCosmeticItemPrice(itemName) let grow = tryGetInteger(key_growPercentageCosmetic(itemName))` |
| directBuyItem | `let basePrice = tryGetCosmeticItemPrice(itemName) let grow = tryGetInteger(key_growPercentageCosmetic(itemName)) let startTs = tryGetInteger(key_startTsCosmetic(itemName)) let endTs = tryGetInteger(key_endTsCosmetic(itemName))` |
| manipulateBoost | `let allowedContracts = getTrustedContracts() let allowedContractsList = allowedContracts.split(";") let dappToCall = i.caller.toString() if allowedContractsList.indexOf(dappToCall) == unit then throw("error") else` |
| manipulateBoostAccount | `let allowedContracts = getTrustedContracts() let allowedContractsList = allowedContracts.split(";") let dappToCall = i.caller.toString() if allowedContractsList.indexOf(dappToCall) == unit then throw("error") else` |
| manipulateBoostAccountEagle | `let allowedContracts = getTrustedContracts() let allowedContractsList = allowedContracts.split(";") let dappToCall = i.caller.toString() if allowedContractsList.indexOf(dappToCall) == unit then throw("error") else` |
| manipulateBoostAccountTurtle | `let allowedContracts = getTrustedContracts() let allowedContractsList = allowedContracts.split(";") let dappToCall = i.caller.toString() if allowedContractsList.indexOf(dappToCall) == unit then throw("error") else` |
| checkArtefactDetails | `let asset = assetInfo(assetId.fromBase58String()).value() let assetName = asset.name.value() if (halloweenItem(assetName) &#124;&#124; containsElement(allArtefact, assetName) &#124;&#124; isDefined(tryGetCosmeticItemPrice(assetName))) && asset.issuer == this then` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry(staticKey_oracleAddress(),oracle) ]` |
| calculateFarmingPowerBoost | `let externalBoostDuck = tryGetInteger(key_externalBoostDuck(duckId)) let externalBoostAddress = tryGetInteger(key_externalBoostAddress(address)) let totalBoost = externalBoostDuck+externalBoostAddress (` |
| calculateFarmingPowerBoostEagle | `let externalBoostAddress = tryGetInteger(key_externalBoostAddressEagle(address)) ( [ ],` |
| calculateFarmingPowerBoostTurtle | `let externalBoostAddress = tryGetInteger(key_externalBoostAddressTurtle(address)) ( [ ],` |
| calculateFarmingPowerBoostNft | `let externalBoostDuck = tryGetInteger(key_externalBoostDuck(duckId)) ( [ ],` |
| itemDuplicator | `if size(i.payments) != 4 then throw("error") else let duplicatorPayment = i.payments[0].value() let itemPayment = i.payments[1].value() let eggPayment = i.payments[2].value()` |
| copyDuck | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() let validPayment = checkAdditionalPayment(i.payments[2]) let firstAssetId = firstPayment.assetId.value().toBase58String()` |
| addArteFactToDuck | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() let validPayment = checkAdditionalPayment(i.payments[2]) let firstAssetId = firstPayment.assetId.value().toBase58String()` |
| issueHalloween | `if size(i.payments) != 0 &#124;&#124; !halloweenItem(kind) then throw("error") else if i.caller.toString() != getStringValue(getOracle(), "static_halloweenAddress") then throw("error") else let asset = Issue(kind, "Halloween 2026 Waves Ducks artefact", 1, 0, false, unit, nonce) let id = asset.calculateAssetId()` |
| issueArtefact | `if (!type.contains("ART-")) then throw("error") else if (i.caller != this && i.caller != getRebirthAddress() && i.caller != getTurtleRebirthAddress() && i.caller != getCanineRebirthAddress() && i.caller != getCouponsAddress() && i.caller != getHuntDistroAddress()&& i.callerPublicKey != getWarsPKey() &&  !isTestEnv()) then throw("I` |
| issueArtefactIndex | `if (!type.contains("ART-")) then throw("error") else if (i.caller != this && i.caller != getRebirthAddress() && i.caller != getTurtleRebirthAddress() && i.caller != getMutantIncubatorAddress() && i.caller != getEagleRebirthAddress() && i.caller != getDuckBreederAddress()` |
| setLock | `if (i.caller == this) then { [ IntegerEntry("global_locked", n) ]` |
| addItemToStore | `if i.caller != addressFromStringValue(tryGetStringExternal(getOracle(),staticKey_pipelineUser())) then throw("error") else [ IntegerEntry(key_priceCosmetic(item),price), IntegerEntry(key_maxSalesCosmetic(item),maxSales),` |

## ride/bulls/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getBullIncubator() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getBullIncubator() && i.caller != this) then { throw("error") } else {` |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| startBreeding | `if size(i.payments) != 4  && size(i.payments) != 3 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) let firstPayment = i.payments[1].value() let secondPayment = i.payments[2].value()` |
| finishHatching | `if size(i.payments) != 1 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) finishHatchingInternal(txIdStr,i,0,0,"",0)++feeValidate }` |
| fixedGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstPayment.assetId.value().toBase58String()],[]).exactAs[String]` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |

## ride/bulls/farming.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| calculateFarmPower | `if !(assetInfo(assetId.fromBase58String()).value().issuer == getBreederAddress() &#124;&#124;assetInfo(assetId.fromBase58String()).value().issuer == getIncubatorAddress()) then throw("error") else if tryGetBooleanExternal(getBreederAddress(),assetId+"_blacklisted") &#124;&#124; tryGetBooleanExternal(getIncubatorAddress(),asset` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry(staticKey_oracleAddress(),oracle) ]` |
| buyPerch | `strict validPayment = checkAdditionalPayment(i.payments[0]) let color = if colorI == "U" then "B" else colorI if (["A", "B", "C", "D"].indexOf(color).value() < 0) then { throw("error")` |
| addFreePerch | `if (["A", "B", "C", "D"].indexOf(color).value() < 0) then { throw("error") } else if (i.caller != getRebirthAddress() && i.caller != getEagleRebirthAddress() && i.caller != this && i.caller != getCouponsAddress() ) then { throw("error")` |
| stakeNFT | `strict validPayment = checkAdditionalPayment(i.payments[0]) let pmt = i.payments[1].value() let assetId = pmt.assetId.value() let assetName = assetInfo(assetId).value().name.value()` |
| unstakeNFT | `let address = i.caller.toString() if tryGetString(asset+"_owner") != i.caller.toString() then throw("error") else strict result = claimStakingResult(address,asset,false,address, i.originCaller.toString()) strict validPayment = checkAdditionalPayment(i.payments[0])` |

## ride/bulls/incubator.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| unlockHalloween | `if size(i.payments) != 0 &#124;&#124; i.caller.toString() != getStringValue(getOracle(), "static_halloweenAddress") then throw("error") else ([BooleanEntry("h26_genesisUnlocked", true)], true) }` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle), IntegerEntry("discountCoefficient",10)` |
| issueJackpot | `if gen == "WMOLDYMT" then throw("error") else if (i.caller != getRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| issueFree | `if (i.caller != getRebirthAddress() && i.caller != getEagleRebirthAddress()) then { throw("error") } else { let txId = fromBase58String(txIdStr)` |
| setDiscount | `if (i.caller != this) then { throw("error") } else { [IntegerEntry("discountCoefficient", val)]` |
| startHatching | `strict feeValidate = checkAdditionalPayment(i.payments[0]) if (isLocked() > 0) then { throw("error") } else {` |
| finishHatching | `strict feeValidate = checkAdditionalPayment(i.payments[0]) let txId = fromBase58String(txIdStr) let hatchingStatusKey = getHatchingStatusKey(i.caller.toString(), txId) let finishHeightKey = getHatchingFinishHeightKey(i.caller.toString(), txId)` |
| initRebirth | `if (size(i.payments) != 3) then throw("error") else let bullPayment = i.payments[0] let tnPayment = i.payments[1] strict feeValidate = checkAdditionalPayment(i.payments[2])` |
| finishRebirth | `if (size(i.payments) != 1) then throw("error") else finishRebirthInternal(initTx, i.caller.toString(), i.payments[0], false, "", false, i.transactionId.toBase58String()) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount == 1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(), "checkArtefactDetails", [assetId.toBase58String()], []).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then {` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount == 1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(), "checkArtefactDetails", [assetId.toBase58String()], []).exactAs[String] if boosterType == "ART-HWERASE" then {` |

## ride/cani/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| createSpecialGenes | `if (i.caller != this) then throw("error") else let txId = i.transactionId let description = "{\"genotype\": \"" + duckGen + "\", \"crossbreeding\": true}" let asset = Issue(duckGen, description, 1, 0, false)` |
| validateAndGetChildren | `if (!checkAssetInIncubator(assetId)) then throw("You need to attach a valid NFT-Eagle. "+assetId+" is invalid!") else let children = tryGetInteger("asset_" + assetId + "_children") ( []` |
| copyNFT | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() let validPayment = checkAdditionalPayment(i.payments[2]) let firstAssetId = firstPayment.assetId.value().toBase58String()` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getCaniRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getCaniRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| startBreeding | `if size(i.payments) != 4  && size(i.payments) != 3 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) let firstPayment = i.payments[1].value() let secondPayment = i.payments[2].value()` |
| finishHatching | `if size(i.payments) != 1 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) finishHatchingInternal(txIdStr,i,0,0,"",0)++feeValidate }` |
| fixedGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstPayment.assetId.value().toBase58String()],[]).exactAs[String]` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |

## ride/cani/rebirth.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| initRebirth | `let pmtCanine = i.payments[0] let pmtWaves = i.payments[1] let assetId = pmtCanine.assetId.value() let initTx = i.transactionId.toBase58String()` |
| finishRebirth | `finishRebirthInternal(initTx, i.caller.toString(),i.payments[0], false,"",false) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount==1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-HWERASE" then` |

## ride/ducks/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| putChildren | `if i.caller != getIncubatorAddress() then throw("error") else [ IntegerEntry("asset_" + assetId + "_children", tryGetInteger("asset_" + oldAssetId + "_children")) ]` |
| mintAndReplaceDuck | `if i.caller != addressFromStringValue("3PEgzEYXMbAHU4ZuAPrd6HanY4LW4Ee5J6F") then throw("error") else let duckIdKey = getStringValue(assetId) let details = assetInfo(assetId.fromBase58String()).value() let name = details.name` |
| generateDuck | `if i.caller != this then throw("error") else let colorRandom = getRandomNumber(4, txId, hatchingFinishHeight, 11) let color = if (colorRandom == 0) then "Y" else if (colorRandom == 1) then "G"` |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| validateAndGetChildren | `if (!checkAssetInIncubator(assetId)) then throw("You need to attach a valid NFT-duck. "+assetId+" is invalid!") else let children = tryGetInteger("asset_" + assetId + "_children") ( []` |
| createDuckSpecialGenes | `if (i.caller != getItemsAddress() && i.caller != this) then throw("error") else let txId = i.transactionId let description = "{\"genotype\": \"" + duckGen + "\", \"crossbreeding\": true}" let asset = Issue(duckGen, description, 1, 0, false)` |
| startDuckBreeding | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() strict validPayment = checkAdditionalPayment(i.payments[2]) strict instantPaid = if size(i.payments) >= 4 && i.payments[3].assetId == getSpiceAssetId() then true else false` |
| finishDuckHatching | `let owner = i.caller.toString() let instantPaid = tryGetBoolean("instantPaid_"+txIdStr) let ducklingLinked = tryGetString(getDucklingKey(owner, txIdStr.fromBase58String())) if instantPaid then` |
| finishDuckHatchingAdmin | `if i.caller != this then throw("error") else finishDuckHatch(txIdStr, owner, "") }` |
| fixedGene | `if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() let firstAssetId = firstPayment.assetId.value().toBase58String() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `let firstPayment = i.payments[0].value() let firstAssetId = firstPayment.assetId.value().toBase58String() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstAssetId],[]).exactAs[String]` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getItemsAddress() && i.caller != getRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |

## ride/ducks/incubator.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| unlockHalloween | `if size(i.payments) != 0 &#124;&#124; i.caller.toString() != getStringValue(getOracle(), "static_halloweenAddress") then throw("error") else ([BooleanEntry("h26_darkPhoenixUnlocked", true)], true) }` |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| setDiscount | `if (i.caller != this) then { throw("error") } else { [IntegerEntry("discountCoefficient", val)]` |
| setSale | `if (i.caller != this) then { throw("error") } else { [IntegerEntry("saleCoefficient", val)]` |
| startDuckHatching | `if getBabyDuckAddress() != i.caller then throw("error") else if (isLocked() > 0) then { throw("error") } else {` |
| startDuckHatchingForAddress | `if (isLocked() > 0) then throw("error") else if (i.caller!= this) then throw("error") else { let totalDucksAmount = tryGetInteger("ducks_amount")` |
| finishDuckHatching | `let owner = i.originCaller.toString() finishHatchingInternal(txIdStr,owner) }` |
| issueFreeDuck | `if (i.caller != getRebirthAddress()) then { throw("error") } else { let txId = fromBase58String(txIdStr)` |
| issueFreeDuckDefinedGenes | `if (i.caller != this && i.caller != getTurtleRebirthAddress()) then { throw("error") } else { let txId = fromBase58String(txIdStr)` |
| issueJackpot | `let darkPhoenixUnlocked = getBoolean(this, "h26_darkPhoenixUnlocked").valueOrElse(false) if gen == "WDARKPHX" && (!darkPhoenixUnlocked &#124;&#124; i.caller != getRebirthAddress()) then throw("error") else if (i.caller != getRebirthAddress() && i.caller != this) then { throw("error")` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |
| finishDuckHatchingAdmin | `if i.caller != this then throw("error") else finishHatchingInternal(txIdStr, owner) }` |

## ride/ducks/rebirth.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| initRebirth | `let pmt = i.payments[0] let assetId = pmt.assetId.value() let initTx = i.transactionId.toBase58String() let address = i.caller.toString()` |
| finishRebirth | `finishRebirthInternal(initTx, i.caller.toString(),i.payments[0], false,"",false) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount==1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-HWERASE" then` |

## ride/eagl/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getEaglRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| createSpecialGenes | `if (i.caller != this) then throw("error") else let txId = i.transactionId let description = "{\"genotype\": \"" + duckGen + "\", \"crossbreeding\": true}" let asset = Issue(duckGen, description, 1, 0, false)` |
| validateAndGetChildren | `if (!checkAssetInIncubator(assetId)) then throw("You need to attach a valid NFT-Eagle. "+assetId+" is invalid!") else let children = tryGetInteger("asset_" + assetId + "_children") ( []` |
| copyNFT | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() let validPayment = checkAdditionalPayment(i.payments[2]) let firstAssetId = firstPayment.assetId.value().toBase58String()` |
| startBreeding | `if size(i.payments) != 4  && size(i.payments) != 3 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) let firstPayment = i.payments[1].value() let secondPayment = i.payments[2].value()` |
| fixedGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstPayment.assetId.value().toBase58String()],[]).exactAs[String]` |
| finishHatching | `if size(i.payments) != 1 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) finishHatchingInternal(txIdStr,i,0,0,"",0)++feeValidate }` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getEaglRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |

## ride/eagl/rebirth.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| initRebirth | `let pmtEagle = i.payments[0] let pmtPzl = i.payments[1] strict extra = checkAdditionalPayment(i.payments[2]) let assetId = pmtEagle.assetId.value()` |
| finishRebirth | `finishRebirthInternal(initTx, i.caller.toString(),i.payments[0], false,"",false) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount==1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-HWERASE" then` |

## ride/feli/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| increaseRarity | `let asset = assetId.fromBase58String() if (i.caller != getFeliRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| createSpecialGenes | `if (i.caller != this) then throw("error") else let txId = i.transactionId let description = "{\"genotype\": \"" + duckGen + "\", \"crossbreeding\": true}" let asset = Issue(duckGen, description, 1, 0, false)` |
| validateAndGetChildren | `if (!checkAssetInIncubator(assetId)) then throw("You need to attach a valid NFT-feline. "+assetId+" is invalid!") else let children = tryGetInteger("asset_" + assetId + "_children") ( []` |
| copyNFT | `let firstPayment = i.payments[0].value() let secondPayment = i.payments[1].value() let validPayment = checkAdditionalPayment(i.payments[2]) let firstAssetId = firstPayment.assetId.value().toBase58String()` |
| startBreeding | `if size(i.payments) != 4  && size(i.payments) != 3 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) let firstPayment = i.payments[1].value() let secondPayment = i.payments[2].value()` |
| fixedGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstPayment.assetId.value().toBase58String()],[]).exactAs[String]` |
| finishHatching | `if size(i.payments) != 1 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) finishHatchingInternal(txIdStr,i,0,0,"",0)++feeValidate }` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| reduceRarity | `let asset = assetId.fromBase58String() if (i.caller != getFeliRebirthAddress() && i.caller != getCouponsAddress() && i.caller != this) then { throw("error") } else {` |

## ride/feli/rebirth.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| initRebirth | `let pmtCanine = i.payments[0] let pmtPete = i.payments[1] strict extra = checkAdditionalPayment(i.payments[2]) let assetId = pmtCanine.assetId.value()` |
| finishRebirth | `finishRebirthInternal(initTx, i.caller.toString(),i.payments[0], false, "", false) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount==1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-HWERASE" then` |

## ride/turtle/breeder.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| getGenFromName | `let genotype = assetName.drop(5).dropRight(3).split("") let generation = assetName.split("")[14] let gen = getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolA)) + "A") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolB)) + "B") + getAmountOrClear(toString(FOLD<8>(genotype, 0, isSymbolC)) + "C") + getAmountOrClear(toString(FOLD<8>(genotype, 0, is` |
| startTRTLBreeding | `if size(i.payments) != 4 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) let firstPayment = i.payments[1].value() let secondPayment = i.payments[2].value()` |
| fixedGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) if parentFixedGene != 1 && parentFixedGene != 2 then throw("error") else let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else` |
| freeGene | `strict feeValidate = checkAdditionalPayment(i.payments[1]) let firstPayment = i.payments[0].value() if firstPayment.amount != 1 then throw("error") else strict artefact = invoke(getItemsAddress(),"checkArtefactDetails",[firstPayment.assetId.value().toBase58String()],[]).exactAs[String]` |
| finishTRTLHatching | `if size(i.payments) != 1 then throw("error") else strict feeValidate = checkAdditionalPayment(i.payments[0]) finishTRTLHatchingInternal(txIdStr,i,0,0,"",0)++feeValidate }` |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |

## ride/turtle/incubator.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| issueJackpot | `if gen == "WWIZARDT" then throw("error") else if (i.caller != getTurtleRebirthAddress() && i.caller != this) then { throw("error") } else {` |
| issueFreeTurtle | `if (i.caller != getTurtleRebirthAddress() && i.caller != getCanisRebirthAddress() && i.caller != getFelineRebirthAddress()&& i.caller != getDuckRebirthAddress()) then { throw("error") } else { let txId = fromBase58String(txIdStr)` |
| setDiscount | `if (i.caller != this) then { throw("error") } else { [IntegerEntry("discountCoefficient", val)]` |
| startTRTLHatching | `strict feeValidate = checkAdditionalPayment(i.payments[0]) if (isLocked() > 0) then { throw("error") } else {` |
| finishTRTLHatching | `strict feeValidate = checkAdditionalPayment(i.payments[0]) let txId = fromBase58String(txIdStr) let hatchingStatusKey = getHatchingStatusKey(i.caller.toString(), txId) let finishHeightKey = getHatchingFinishHeightKey(i.caller.toString(), txId)` |

## ride/turtle/rebirth.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configureOracle | `if i.caller != this then throw("error") else [ StringEntry("static_oracleAddress",oracle) ]` |
| initRebirth | `let pmtTurtle = i.payments[0] let pmtWaves = i.payments[1] let pmtSpice = i.payments[2] let assetId = pmtTurtle.assetId.value()` |
| finishRebirth | `finishRebirthInternal(initTx, i.caller.toString(),i.payments[0], false, "", false) }` |
| finishRebirthDouble | `if !(size(i.payments) == 2 && i.payments[0].amount==1) then throw("error") else let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-GIFT_DOUBL" then` |
| finishRebirthItem | `if (size(i.payments) == 2 && i.payments[0].amount==1) then let assetId = i.payments[0].assetId.value() strict boosterType = invoke(getItemsAddress(),"checkArtefactDetails",[assetId.toBase58String()],[]).exactAs[String] if boosterType == "ART-HWERASE" then` |

## ride/events/halloween2026.ride

| Callable | Entry/gate excerpt |
| --- | --- |
| configure | `strict payments = noPayments(i.payments) if i.caller != this &#124;&#124; b("h26_initialized") then throw("error") else if start < lastBlock.timestamp &#124;&#124; start > lastBlock.timestamp + 366*86400000 then throw("error") else let o = addressFromStringValue(oracleAddress)` |
| setEnabled | `strict payments = noPayments(i.payments) if i.caller != this &#124;&#124; !b("h26_initialized") then throw("error") else if enabled && lastBlock.timestamp >= n("h26_end") then throw("error") else [BooleanEntry("h26_enabled", enabled)]` |
| setRecipesEnabled | `strict payments = noPayments(i.payments) if i.caller != this then throw("error") else [BooleanEntry("h26_recipes", enabled)] }` |
| buySoul | `if !active() then throw("error") else if size(i.payments) != 1 then throw("error") else let egg = getStringValue(oracle(), "static_eggAssetId").fromBase58String() if i.payments[0].assetId != egg &#124;&#124; i.payments[0].amount != 100000000 then throw("error") else` |
| convertSoul | `if !active() then throw("error") else if size(i.payments) != 1 then throw("error") else let kind = canonical(i.payments[0]) if !containsElement(s("h26_conversions").split(";"), kind) then throw("error") else` |
| contribute | `if !active() &#124;&#124; b("h26_settled") then throw("error") else if size(i.payments) < 1 &#124;&#124; size(i.payments) > 10 then throw("error") else let receipt = "h26_receipt_" + i.transactionId.toBase58String() if s(receipt) != "" then throw("error") else` |
| settle | `strict payments = noPayments(i.payments) if !b("h26_initialized") &#124;&#124; lastBlock.timestamp < n("h26_end") &#124;&#124; b("h26_settled") then throw("error") else [BooleanEntry("h26_settled", true), IntegerEntry("h26_settledAt", lastBlock.timestamp)] }` |
| claimArmor | `strict payments = noPayments(i.payments) let key = user(i.caller.toString()) + "_armor" if !milestone(800) &#124;&#124; n(user(i.caller.toString())+"_total") < 10 &#124;&#124; b(key) then throw("error") else strict id = mint("ART-H26ARMOR", i.caller, 0)` |
| claimPumpkinFeed | `strict payments = noPayments(i.payments) let key = user(i.caller.toString()) + "_feed" if !b("h26_settled") &#124;&#124; !containsElement(top(), i.caller.toString()) &#124;&#124; b(key) then throw("error") else strict id = mint("ART-H26FEED", i.caller, 0)` |
| craft | `if !b("h26_recipes") then throw("error") else let count = size(i.payments) if count < 1 &#124;&#124; count > 10 then throw("error") else func names(acc: List[String], p: AttachedPayment) = acc :+ canonical(p)` |
| completion | `strict payments = noPayments(i.payments) let sources = ["static_breederAddress", "static_turtleBreederAddress", "static_canineBreederAddress", "static_felineBreederAddress", "static_eagleBreederAddress", "static_bullBreederAddress", "static_rebirthAddress", "static_turtleRebirthAddress", "static_canineRebirthAddress", "static_felineRebirthAddress", "static_e` |

