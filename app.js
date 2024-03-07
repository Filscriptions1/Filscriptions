const mongoose = require('mongoose');
const config = require('config.json')
const mongoDBUrl = config.database;
const ethers = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://filfox.info/rpc/v1');

const Holder = require('./models/holder');
const Inscription = require('./models/inscription');
const Sync = require('./models/sync');
const Token = require('./models/token');
const Transfer = require('./models/transfer');
const Tx = require('./models/tx');
const Market = require('./models/market');


mongoose.connect(mongoDBUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB error:'));
db.once('open', function () {
    console.log("success!");
    setInterval(async () => {
        console.log('start')
        event()
    }, 1000 * 20);

});


async function event() {
    let blockInfo = await Sync.findOne({}).sort({ block: -1 });
    let block = blockInfo.block - 1
    let newBlock = await provider.getBlockNumber();
    if (newBlock - block < 2) return;
    let transactions;
    try {
        let res = await provider.getBlockWithTransactions(block);
        transactions = res.transactions;
    } catch (e) {
        let body = JSON.parse(e.body)
        if (body.error.message == 'requested epoch was a null round') {
            await Sync.updateOne({ _id: blockInfo._id }, { $inc: { block: 1 } });
        }


    }
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];

            let str;
            try {
                let data = element.data;
                let dataBytes = ethers.utils.arrayify(data);
                let dataUtf8 = ethers.utils.toUtf8String(dataBytes);
                str = dataUtf8;
            } catch (error) {
                continue
            }
            const regex = /^data:,\{"p":"fil-20","op":"[^"]+","(?:tick":"[^"]+","amt":"[^"]+"|tick":"[^"]+","max":"[^"]+","lim":"[^"]+")}$/;

            if (!regex.test(str)) continue
            await Tx.create([{
                _id: element.hash,
                blockNumber: element.blockNumber,
                transactionIndex: element.transactionIndex,
                from: element.from,
                to: element.to,
                data: element.data,
                dsc: str
            }], { session })
            let searchHash = await Inscription.findOne({ _id: element.hash }, null, { session });
            if (searchHash) {
                continue;
            }
            let obj = str.substring(6);
            obj = JSON.parse(obj);

            if (obj.p != 'fil-20') continue;
            if (obj.op != 'deploy' && obj.op != 'mint' && obj.op != 'transfer') continue;
            if (obj.op == 'deploy' && obj.lim && obj.max && obj.max - 0 > obj.lim - 0) {
                let token = await Token.findOne({ tick: obj.tick }, null, { session });
                if (!token) {
                    await Token.create([{
                        _id: element.hash,
                        tick: obj.tick,
                        max: obj.max,
                        limit: obj.lim,
                        minted: 0,
                        deployBy: element.from,
                        creator: element.from,
                        holders: 0,
                        trxs: 0,
                        content: JSON.stringify(obj),
                    }], { session });
                    await Inscription.create([{
                        _id: element.hash,
                        owner: element.from,
                        content: JSON.stringify(obj),
                    }], { session });
                    await Market.create([{ tick: obj.tick }], { session })
                }
                continue
            }
            let token = await Token.findOne({ tick: obj.tick }, null, { session });
            if (!token) continue
            // 判断amt 是正整数
            let judge = /^\d+$/.test(obj.amt);
            if (!judge) continue;
            obj.amt = obj.amt - 0;
            if (obj.op == 'mint') {
                if (obj.amt != token.limit) {
                    continue
                }
                let max = Math.floor(token.minted) + Math.floor(obj.amt);
                if (max <= token.max && obj.amt <= token.limit) {
                    let from = ethers.utils.getAddress(element.from);
                    let hoder = await Holder.findOne({ tick: obj.tick, address: from }, null, { session });
                    if (hoder) {
                        await Holder.updateOne({ tick: obj.tick, address: from }, { $inc: { amount: obj.amt, mints: 1 } }, { session })
                        await Token.updateOne({ tick: obj.tick }, { $inc: { trxs: 1, minted: obj.amt } }, { session });
                    } else {
                        await Holder.create([{
                            tick: obj.tick,
                            address: from,
                            amount: obj.amt,
                            value: 0,
                            mints: 1
                        }], { session });
                        await Token.updateOne({ tick: obj.tick }, { $inc: { holders: 1, trxs: 1, minted: obj.amt } }, { session });
                    }
                    await Inscription.create([{
                        _id: element.hash,
                        owner: from,
                        content: JSON.stringify(obj),
                    }], { session });
                }
                if (max == token.max) {
                    await Token.updateOne({ tick: obj.tick, completedAt: { $exists: false } }, { completedAt: new Date().getTime() }, { session })
                }
            }

            if (obj.op == 'transfer') {

                let from = ethers.utils.getAddress(element.from);
                let to = ethers.utils.getAddress(element.to);
                let hoder = await Holder.findOne({ tick: obj.tick, address: from }, null, { session });
                if (!hoder) continue;
                if (hoder.amount - obj.amt < 0) continue;
                let toHolder = await Holder.findOne({ tick: obj.tick, address: to }, null, { session });
                if (toHolder) {
                    await Holder.updateOne({ tick: obj.tick, address: to }, { $inc: { amount: obj.amt } }, { session });
                    await Token.updateOne({ tick: obj.tick }, { $inc: { trxs: 1 } }, { session });
                } else {
                    await Holder.create([{
                        tick: obj.tick,
                        address: to,
                        amount: obj.amt,
                        value: 0,
                    }], { session });
                    await Token.updateOne({ tick: obj.tick }, { $inc: { trxs: 1, holders: 1 } }, { session });
                }
                hoder.amount = hoder.amount - obj.amt;
                await hoder.save({ session })

                await Inscription.create([{
                    _id: element.hash,
                    owner: to,
                    content: JSON.stringify(obj),
                }], { session });
                await Transfer.create([{
                    _id: element.hash,
                    tick: obj.tick,
                    amount: obj.amt,
                    method: 'transfer',
                    from: from,
                    to: to,
                }], { session });
            }

        }
        await Sync.updateOne({ _id: blockInfo._id }, { $inc: { block: 1 } }, { session });
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
    } finally {
        session.endSession();

    }



}