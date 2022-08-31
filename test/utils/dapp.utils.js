class DappUtils {
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
            key: "static_swopPromoAddress",
            type: "string",
            value: "",
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
    return name.split('#')[0];
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
  generateCollectiveFarmInitData(name, minimumThreshold, migration, totalFarmingReward, totalLiquidity, totalFarmToken) {
    return [
      { type: "string", value: name ? name : 'cf-test' },
      { type: "integer", value: minimumThreshold ? minimumThreshold : 0 },
      { type: "boolean", value: migration ? migration : false },
      { type: "integer", value: totalFarmingReward ? totalFarmingReward : 0 },
      { type: "integer", value: totalLiquidity ? totalLiquidity : 0 },
      { type: "integer", value: totalFarmToken ? totalFarmToken : 0 }
    ];
  }
}

module.exports = DappUtils;
