// Wallet.ride deploy script. To run execute `surfboard run path/to/script`

// wrap out script with async function to use fancy async/await syntax
(async () => {
  // Functions, available in tests, also available here
  let [path, ...rest] = process.env.FILE.split("_");
  rest = rest.join("");
  const script = compile(file(path + "/" + rest + ".ride"));

  const dappSeed = process.env.SEED; // Or use seed phrase from surfboard.config.json
  const ssTx = setScript(
    {
      script,
      additionalFee: 400000,
    },
    dappSeed
  );
  await broadcast(ssTx).catch((e) => {
    console.log(e);
    throw e;
  });
  await waitForTx(ssTx.id).catch((e) => {
    console.log(e);
    throw e;
  });
  console.log(ssTx.id);
})();
