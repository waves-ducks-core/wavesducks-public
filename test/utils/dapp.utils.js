class DappUtils {
  WAVES_ASSET_ID = "WAVES";
  deployedDapps = [];
  trustedContracts = "";
  eggAssetId = "";

  setTrustedContracts(trustedContracts) {
    this.trustedContracts = trustedContracts;
  }

  /**
   * Generate 10 million of 'testEgg' asset.
   * @param  {string} oracleAccount
   * An oracle account for storing the generated asset. (Ideally keep this oracle as a separete account because of separation of testing purposes).
   */
  async issueTestAsset(oracleAccount) {
    const iTx = issue(
      {
        name: "testEgg",
        description: "testEgg",
        decimals: 8,
        quantity: 1_000_000_000_000_000,
        reissuable: true,
      },
      oracleAccount
    );
    await broadcast(iTx).catch((e) => console.log(e));
    await waitForTx(iTx.id);
    this.eggAssetId = iTx["id"];
  }

  /**
   * Set up a Dapp with its own dedicated functionality.
   * @param  {string} name
   * The name of an account that has been set up (The account name must match with an existing smart contract).
   * In case the name has a unique hash appended with #, the hash gets ignored.
   */
  async setupDapp(name) {
    name = this.getPureDappName(name);
    console.log(name + " start setup!");
    console.log(address(accounts[name]));

    // https://wavesplatform.github.io/js-test-env/globals.html#compile
    const script = compile(file(name + ".ride"));
    // https://wavesplatform.github.io/js-test-env/globals.html#setscript
    const ssTx = setScript({ script }, accounts[name]);
    await broadcast(ssTx);

    this.deployedDapps.push(name);
    console.log(name + " configured!");
    await waitForTx(ssTx.id);
  }

  async setupArtefactDapp(name) {
    const script = compile(file("artefacts/" + name + ".ride"));
    const ssTx = setScript({ script }, accounts[name]);
    await broadcast(ssTx);
    this.deployedDapps.push(name);
    await waitForTx(ssTx.id);
  }

  async setupDuckHouseDapp(account, type) {
    const script = compile(file("artefacts/duck-house.ride"));
    const ssTx = setScript({ script }, accounts[account]);
    await broadcast(ssTx);
    await waitForTx(ssTx.id);
    await this.initDuckHouseDapp(accounts[account], type);
  }

  async setupOracle() {
    const dataTx = data(
      {
        additionalFee: 400000,
        data: [
          {
            key: "static_eggAssetId",
            type: "string",
            value: this.eggAssetId,
          },
          {
            key: "static_cfMasterAddress",
            type: "string",
            value: "",
          },
          {
            key: "static_gameDappAddress",
            type: "string",
            value: "",
          },
          {
            key: "static_metaRaceAddress",
            type: "string",
            value: "",
          },
          {
            key: "static_trustedContracts",
            type: "string",
            value: this.trustedContracts,
          },
          ...this.deployedDapps.map((dappName) => ({
            key: "static_" + dappName + "Address",
            type: "string",
            value: address(accounts[dappName]),
          })),
        ],
      },
      accounts["oracle"]
    );

    await broadcast(dataTx).catch((e) => console.log(e));
    await waitForTx(dataTx.id);

    await this.initDappsWithOracle();
  }

  async initDappsWithOracle() {
    for (const dappName of this.deployedDapps) {
      const dappAddress = accounts[dappName];

      if (dappAddress) {
        await this.initDapp(accounts[dappName]);
      } else {
        throw new Error(`${dappName} is not defined`);
      }
    }
  }

  async initDapp(dapp) {
    const tx = invokeScript(
      {
        version: 1,
        dApp: address(dapp),
        call: {
          function: "configureOracle",
          args: [{ type: "string", value: address(accounts.oracle) }],
        },
        payment: null,
      },
      dapp
    );

    await broadcast(tx).catch((e) => console.log(e));
    await waitForTx(tx.id).catch((e) => console.log(e, dapp));
  }

  async initDuckHouseDapp(dapp, type) {
    const tx = invokeScript(
      {
        version: 1,
        dApp: address(dapp),
        call: {
          function: "configureOracle",
          args: [
            { type: "string", value: address(accounts.oracle) },
            { type: "string", value: type },
          ],
        },
        payment: null,
      },
      dapp
    );

    await broadcast(tx).catch((e) => console.log(e));
    await waitForTx(tx.id).catch((e) => console.log(e, dapp));
  }

  getPureDappName(name) {
    return name.split("#")[0];
  }

  /**
   * Generate data needed for the 'initCollectiveFarm' call, uses default values if left blank.
   * @param  {string} name
   * @param  {number} minimumThreshold
   * @param  {boolean} migration
   * @param  {number} totalFarmingReward
   * @param  {number} totalLiquidity
   * @param  {number} totalFarmToken
   */
  generateCollectiveFarmInitData(
    name,
    minimumThreshold,
    migration,
    totalFarmingReward,
    totalLiquidity,
    totalFarmToken
  ) {
    return [
      { type: "string", value: name ? name : "cf-test" },
      { type: "integer", value: minimumThreshold ? minimumThreshold : 0 },
      { type: "boolean", value: migration ? migration : false },
      { type: "integer", value: totalFarmingReward ? totalFarmingReward : 0 },
      { type: "integer", value: totalLiquidity ? totalLiquidity : 0 },
      { type: "integer", value: totalFarmToken ? totalFarmToken : 0 },
    ];
  }

  /**
   * Send a transaction in a broadcast.
   * @param  {string} transaction
   * @Returns  {Promise}
   * A Promise object containing transaction info.
   */
  async broadcastAndWaitForResponse(transaction) {
    const promises = await Promise.all([
      broadcast(transaction),
      waitForTx(transaction.id, { timeout: 60_000 }),
    ]);

    // Return value can be ignored when not needed.
    return promises[1];
  }

  /**
   * Send a transaction in a broadcast and expect to get an error in response.
   * @param  {string} transaction
   * A transaction
   * @param  {string} errorMessage
   * An error message
   * @param  {boolean} customMessage
   * A boolean deciding to include the default error message prefix.
   */
  async broadcastAndRejected(transaction, errorMessage, customMessage) {
    if (!customMessage) {
      await expect(broadcast(transaction)).rejectedWith(
        "Error while executing account-script: " + errorMessage
      );
    } else {
      await expect(broadcast(transaction)).rejectedWith(errorMessage);
    }
  }

  /**
   * Build an invocation object.
   * @param  {string} dAppToCallSeed
   * Required
   * @param  {string} functionToCall
   * Required
   * @param  {string} callSeed
   * Required
   * @param  {string} functionArgsAsArray
   * Optional
   * @param  {string} additionalFeeValue
   * Optional
   * @param  {string} paymentObjectsAsArray
   * Optional
   * @Returns  {invokeScript}
   */
  buildInvokeScript(
    dAppToCallSeed,
    functionToCall,
    callSeed,
    functionArgsAsArray,
    additionalFeeValue,
    paymentObjectsAsArray
  ) {
    return invokeScript(
      {
        version: 1,
        dApp: address(dAppToCallSeed),
        payment: paymentObjectsAsArray ? paymentObjectsAsArray : [],
        call: {
          function: functionToCall,
          args: functionArgsAsArray ? functionArgsAsArray : [],
        },
        additionalFee: additionalFeeValue ? additionalFeeValue : 0,
      },
      callSeed
    );
  }

  /**
   * Build an invocation object with wrong function arguments.
   * Only use this when no arguments are expected, otherwise provide correct argument types with wrong values
   * Reason: type checking happens on chain -> not our concern
   * @param  {string} dAppToCallSeed
   * Required
   * @param  {string} functionToCall
   * Required
   * @param  {string} callSeed
   * Required
   * @param  {string} additionalFeeValue
   * Optional
   * @param  {string} paymentObjectsAsArray
   * Optional
   * @Returns  {invokeScript}
   */
  buildInvokeScriptWithWrongFunctionArgs(
    dAppToCallSeed,
    functionToCall,
    callSeed,
    additionalFeeValue,
    paymentObjectsAsArray
  ) {
    const functionArgs = [
      {
        type: "string",
        value: "This is wrong",
      },
    ];

    return this.buildInvokeScript(
      dAppToCallSeed,
      functionToCall,
      callSeed,
      functionArgs,
      additionalFeeValue,
      paymentObjectsAsArray
    );
  }

  /**
   * Build an invocation object with a wrong payment.
   * @param  {string} dAppToCallSeed
   * Required
   * @param  {string} functionToCall
   * Required
   * @param  {string} callSeed
   * Required
   * @param  {string} functionArgsAsArray
   * Optional
   * @param  {string} additionalFeeValue
   * Optional
   * @Returns  {invokeScript}
   */
  buildInvokeScriptWithWrongPaymentObjects(
    dAppToCallSeed,
    functionToCall,
    callSeed,
    functionArgsAsArray,
    additionalFeeValue
  ) {
    const paymentObjects = [
      {
        assetId: this.WAVES_ASSET_ID,
        amount: 1,
      },
    ];

    return this.buildInvokeScript(
      dAppToCallSeed,
      functionToCall,
      callSeed,
      functionArgsAsArray,
      additionalFeeValue,
      paymentObjects
    );
  }

  /**
   * Verify a transaction via the response.
   * @param  {string} txResponse
   * A transaction response.
   * Required
   * @param  {string} dAppToCallSeed
   * Required
   * @param  {string} functionToCall
   * Required
   * @param  {string} callSeed
   * Required
   * @param  {string} functionArgsAsArray
   * Optional
   * @param  {string} additionalFeeValue
   * Optional
   * @param  {string} paymentObjectsAsArray
   * Optional
   */
  verifyTxResponse(
    txResponse,
    dAppToCallSeed,
    functionToCall,
    callSeed,
    functionArgsAsArray,
    additionalFeeValue,
    paymentObjectsAsArray
  ) {
    const DEFAULT_FEE = 500_000;

    expect(txResponse["dApp"]).to.equal(address(dAppToCallSeed));
    expect(txResponse["call"]["function"]).to.equal(functionToCall);
    expect(txResponse["call"]["args"]).to.eql(
      functionArgsAsArray ? functionArgsAsArray : []
    );
    expect(txResponse["sender"]).to.equal(address(callSeed));
    expect(txResponse["fee"]).to.equal(
      DEFAULT_FEE + (additionalFeeValue ? additionalFeeValue : 0)
    );
    expect(txResponse["payment"]).to.eql(
      paymentObjectsAsArray ? paymentObjectsAsArray : []
    );
  }

  // TODO: optionally use this function in future
  async buildSendVerifyTx(
    dAppToCallSeed,
    functionToCall,
    callSeed,
    functionArgsAsArray,
    additionalFeeValue,
    paymentObjectsAsArray
  ) {
    const invoke = buildInvokeScript(
      dAppToCallSeed,
      functionToCall,
      callSeed,
      functionArgsAsArray,
      additionalFeeValue,
      paymentObjectsAsArray
    );
    const txResponse = await broadcastAndWaitForResponse(invoke);

    this.verifyTxResponse(
      txResponse,
      dAppToCallSeed,
      functionToCall,
      callSeed,
      functionArgsAsArray,
      additionalFeeValue,
      paymentObjectsAsArray
    );
  }
}

module.exports = DappUtils;
