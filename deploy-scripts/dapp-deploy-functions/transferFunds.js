require('dotenv').config();
const senderSeed = process.env.SENDER;

async function transferFundsToWallets(dappSeed, dappKey) {
    try {
        const transferTx = transfer({
            amount: 5_000_0000,
            assetId: null,
            recipient: address(dappSeed),
        }, senderSeed);

        await broadcast(transferTx);
        await waitForTx(transferTx.id);

        console.log(`${dappKey}: ${transferTx.recipient}`)
    } catch (e) {
        console.error(`TRANSFER FUNDS ERROR. [${dappKey}: ${address(dappSeed)}]`);
        console.error(e.message);
        throw e;
    }
};

module.exports = transferFundsToWallets;