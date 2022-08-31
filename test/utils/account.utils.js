class AccountUtils {
  /**
  * Define multiple accounts at once with the correct Waves decimal count.
  * @param  {Record<string, number>} accounts 
  * A record of accounts existing of 'name' and 'amount of Waves' like { accountName: amountOfWaves }.
  * All accounts get stored in the preserved variable 'accounts'.
  */
  async defineAccounts(accounts) {
    const wavesDecimal = 1e8;

    for (const account in accounts) {
      accounts[account] = parseInt(accounts[account] * wavesDecimal);
    }

    // https://wavesplatform.github.io/js-test-env/globals.html#setupaccounts
    await setupAccounts(accounts);
  }
}

module.exports = AccountUtils;
