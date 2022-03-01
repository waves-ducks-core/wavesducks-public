const wvs = 1e8
const RACE_ASSET_ID = '3RJGAV9xxTV2QbHYFPbGKeBRYvHwhhMNC6EDzmTNPCgk';
const RACE_DAPP_SEED = '' //;
const RACE_DAPP_ADDRESS = address(RACE_DAPP_SEED);
const EGG_ASSET_ID = '3v7zGkeHS6KrsvmTRzEzvCxm5cdzkCtM7z5cM6efcjCB';
const NODE_URL = 'https://wavesducks.wavesnodes.com'

describe('Init Metarace contract settings', () => {

    it('set static settings', async () => {

        const settings = [
            {
                key: 'static_incubatorAddress',
                type: 'string',
                value: '3P6TwNU39Ykkbeqhn5TE4a2736xsA1vXemM'
            },
            {
                key: 'static_breederAddress',
                type: 'string',
                value: '3P9REuLBnYBafDqtEu6hfzs2Rv2haSU158y'
            },
            {
                key: 'static_farmingAddress',
                type: 'string',
                value: '3PH75p2rmMKCV2nyW4TsAdFgFtmc61mJaqA'
            },
            {
                key: 'static_eggAssetId',
                type: 'string',
                value: EGG_ASSET_ID
            },
            {
                key: 'static_accessItemAssetId',
                type: 'string',
                value: EGG_ASSET_ID
            },
            {
                key: 'static_accessItemPrice',
                type: 'integer',
                value: 300 * 1e8
            },
            {
                key: 'static_minLockDuration',
                type: 'integer',
                value: 172800 * 1000,
            },
            {
                key: 'static_boosterBuyAssetId',
                type: 'string',
                value: RACE_ASSET_ID
            },
        ];

        for (let setting of settings) {
            const invokeTx = invokeScript({
                dApp: RACE_DAPP_ADDRESS,
                call: {
                    function: 'updateSetting',
                    args: [{
                        type: 'string',
                        value: setting.key
                    },
                    {
                        type: setting.type,
                        value: setting.value
                    }],
                }
            }, RACE_DAPP_SEED);
            await broadcast(invokeTx, NODE_URL);
            await waitForTx(invokeTx.id, { apiBase: NODE_URL });
            console.log('');
        }
    });

    it('set boosters and prices', async () => {


        const boosters = [
            {
                name: 'EGG_RIDER',
                price: 1
            },
            {
                name: 'BOOST',
                price: 2
            },
            {
                name: 'HOVERCRAFT',
                price: 3
            },
            {
                name: 'FIFTH_WHEEL',
                price: 4
            },
            {
                name: 'INVISIBILITY',
                price: 5
            },
            {
                name: 'JUMP',
                price: 6
            },
            {
                name: 'IMMOVABLE',
                price: 7
            },
            {
                name: 'MISSILE',
                price: 8
            },
            {
                name: 'BOMB',
                price: 9
            },
            {
                name: 'SHIELD',
                price: 10
            }
        ]

        for (let [index, booster] of boosters.entries()) {
            const invokeTx = invokeScript({
                dApp: RACE_DAPP_ADDRESS,
                call: {
                    function: 'updateSetting',
                    args: [{
                        type: 'string',
                        value: 'static_boosterPriceLevel_' + (index + 1)
                    },
                    {
                        type: 'integer',
                        value: booster.price * 1e8
                    }],
                }
            }, RACE_DAPP_SEED);
            await broadcast(invokeTx, NODE_URL);
            await waitForTx(invokeTx.id, { apiBase: NODE_URL });


            const invokeTx2 = invokeScript({
                dApp: RACE_DAPP_ADDRESS,
                call: {
                    function: 'updateSetting',
                    args: [{
                        type: 'string',
                        value: 'static_boosterName_' + (index + 1)
                    },
                    {
                        type: 'string',
                        value: booster.name
                    }],
                }
            }, RACE_DAPP_SEED);
            await broadcast(invokeTx2, NODE_URL);
            await waitForTx(invokeTx2.id, { apiBase: NODE_URL });
            console.log('Finished!');
        }
    });
})