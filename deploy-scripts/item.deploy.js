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
    ENDTS
  );
  const dapp = PROD
    ? "3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR"
    : "3PAi1ePLQrYrY3jj9omBtT6isMkZsapbmks";

  const signerSeed = process.env.SEED; // Or use seed phrase from surfboard.config.json
  const tx = invokeScript(
    {
      version: 1,
      dApp: address(dapp),
      call: {
        function: "addItemToStore",
        args: [
          { type: "integer", value: STARTPRICE },
          { type: "string", value: NAME },
          { type: "integer", value: MAXSALES },
          { type: "boolean", value: SALE },
          { type: "string", value: MAXSALES },
          { type: "integer", value: GROWINGPERCENTAGE },
          { type: "integer", value: STARTTS },
          { type: "integer", value: ENDTS },
        ],
      },
      payment: null,
    },
    signerSeed
  );
  console.log(tx);
  await broadcast(tx).catch((e) => {
    console.log(e);
    throw e;
  });
  await waitForTx(tx.id).catch((e) => {
    console.log(e);
    throw e;
  });
  console.log(ssTx.id);
})();
