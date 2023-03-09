// Wallet.ride deploy script. To run execute `surfboard run path/to/script`

// wrap out script with async function to use fancy async/await syntax
(async () => {
  // Functions, available in tests, also available here
  const script = compile(file(process.env.FILE.replaceAll("_", "") + ".ride"));

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
