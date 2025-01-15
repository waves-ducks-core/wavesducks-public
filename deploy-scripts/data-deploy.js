const dappSeeds = require('../seeds.json');
const transferFundsToWallets = require('./dapp-deploy-functions/transferFunds');
const deployData = require('./dapp-deploy-functions/deployData');
const deployTestEnv = require('./dapp-deploy-functions/deployTestEnv');
const setDappScripts = require('./dapp-deploy-functions/setDapps');

const { ORACLE_SEED, LOOT_BOXES_SEED } = dappSeeds;
const dataDapps = Object.entries({ ORACLE_SEED, LOOT_BOXES_SEED })

async function deployAllData() {
    for (const [dappKey, { seed, path, oraclePaths }] of dataDapps) {
        await transferFundsToWallets(seed, dappKey);
        await deployTestEnv(seed, dappKey);
        await deployData(seed, oraclePaths)
        await setDappScripts(path, seed, dappKey)
    }
}

deployAllData();