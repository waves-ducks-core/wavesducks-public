// Wallet.ride deploy script. To run execute `surfboard run path/to/script`

// wrap out script with async function to use fancy async/await syntax
(async () => {
  // Functions, available in tests, also available here
  // const script = compile(file(process.env.FILE.replaceAll("_", "") + ".ride"));
  const NAME = process.env.NAME;
  const PRICEASSET = process.env.PRICEASSET;
  const MAXSALES = process.env.MAXSALES;
  const SALE = process.env.SALE;
  const GROWINGPERCENTAGE = process.env.GROWINGPERCENTAGE;
  const STARTTS = process.env.STARTTS;
  const ENDTS = process.env.ENDTS;
  const STARTPRICE = process.env.STARTPRICE;
  const PROD = process.env.PROD;
  console.log(
    NAME,
    PRICEASSET,
    MAXSALES,
    SALE,
    GROWINGPERCENTAGE,
    STARTTS,
    ENDTS,
    PROD
  );
  const dapp =
    PROD == "true"
      ? "3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR"
      : "3PAi1ePLQrYrY3jj9omBtT6isMkZsapbmks";

  const signerSeed = process.env.SEED; // Or use seed phrase from surfboard.config.json
  const tx = invokeScript(
    {
      version: 1,
      dApp: dapp,
      call: {
        function: "addItemToStore",
        args: [
          { type: "integer", value: Number(STARTPRICE) },
          { type: "string", value: NAME },
          { type: "integer", value: Number(MAXSALES) },
          { type: "boolean", value: SALE == "true" },
          { type: "string", value: PRICEASSET },
          { type: "integer", value: Number(GROWINGPERCENTAGE) },
          { type: "integer", value: Number(STARTTS) },
          { type: "integer", value: Number(ENDTS) },
        ],
      },
      payment: null,
    },
    signerSeed
  );
  console.log(JSON.stringify(tx));
  await broadcast(tx).catch((e) => {
    console.log(e);
    throw e;
  });
  await waitForTx(tx.id).catch((e) => {
    console.log(e);
    throw e;
  });
  console.log("https://wavesexplorer.com/transactions/" + tx.id);
})();
