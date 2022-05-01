class DappUtils {
  deployedDapps = [];
  trustedContracts = "";
  eggAssetId = "";

  setTrustedContracts(trustedContracts) {
    this.trustedContracts = trustedContracts;
  }

  async issueTestAsset() {
    const iTx = issue(
      {
        name: "testEgg",
        description: "testEgg",
        decimals: 8,
        quantity: 10000000,
        reissuable: true,
      },
      accounts.oracle
    );
    await broadcast(iTx).catch((e) => console.log(e));
    await waitForTx(iTx.id);
    this.eggAssetId = iTx["id"];
  }

  async setupDapp(name) {
    console.log(name + " start setup!");
    const script = compile(file(name + ".ride"));
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
        throw `${dappName} is not defined`;
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
}

module.exports = DappUtils;
