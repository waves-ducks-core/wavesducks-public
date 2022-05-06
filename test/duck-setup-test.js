const DappUtils = require("./utils/dapp.utils");
const dappUtils = new DappUtils();
const accountUtils = require("./utils/account.utils");

describe("ducks - setup smart contracts", () => {
  before(async function () {
    this.timeout(0);
    await accountUtils.defineAccounts({
      oracle: 2,
      babyDuck: 0.1,
      breeder: 0.1,
      duckWars: 0.1,
      farming: 0.1,
      incubator: 0.1,
      marketplaceProxy: 0.1,
      marketplace: 0.1,
      rebirth: 0.01,
      refContract: 0.1,
      items: 0.1,
      accBooster: 0.1,
      wearables: 0.1,
      house: 0.1,
      bigHouse: 0.1,
    });

    await dappUtils.issueTestAsset();
    await dappUtils.setupDapp("babyDuck");
    //await dappUtils.setupDapp("breeder");
    await dappUtils.setupDapp("duckWars");
    await dappUtils.setupDapp("farming");
    await dappUtils.setupDapp("incubator");
    await dappUtils.setupDapp("marketplaceProxy");
    await dappUtils.setupDapp("marketplace");
    await dappUtils.setupDapp("rebirth");
    await dappUtils.setupDapp("refContract");
    await dappUtils.setupArtefactDapp("items");
    await dappUtils.setupArtefactDapp("accBooster");
    await dappUtils.setupArtefactDapp("wearables");
    await dappUtils.setupDuckhouseDapp("house", "ART-HOUSE");
    await dappUtils.setupDuckhouseDapp("bigHouse", "ART-BIGHOUSE");

    accBoosterAddress = address(accounts.accBooster);
    wearablesAddress = address(accounts.wearables);
    houseAddress = address(accounts.house);
    bigHouseAddress = address(accounts.bigHouse);

    await dappUtils.setTrustedContract(
      accBoosterAddress +
        ";" +
        wearablesAddress +
        ";" +
        houseAddress +
        ";" +
        bigHouseAddress +
        ";"
    );

    await dappUtils.setupOracle();
  });
  describe("Hatch ducks", () => {
    it("First user", async function () {
      true;
    });
  });
});
