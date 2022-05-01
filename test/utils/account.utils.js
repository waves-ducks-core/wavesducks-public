const defineAccounts = async (accounts) => {
  const wavesDecimal = 10 ** 8;

  for (const account in accounts) {
    accounts[account] = accounts[account] * wavesDecimal;
  }

  await setupAccounts(accounts);
};
module.exports = { defineAccounts };
