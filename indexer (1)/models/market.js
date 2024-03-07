const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./counter');
const MarketSchema = new Schema({
    tick: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    floorPrice: {
        type: Number,
        default: 0
    },
    avgPrice: {
        type: Number,
        default: 0
    },
    listed: {
        type: Number,
        default: 0
    },
    marketCap: {
        type: Number,
        default: 1
    },
    salesDay: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    volumeDay: {
        type: Number,
        default: 0
    },
    totalVolume: {
        type: Number,
        default: 0
    },
    verified: {
        type: Number,
        default: 1
    },
    isShow: {
        type: Number,
        default: 1,
        enum: [0, 1]
    },
    number: {
        type: Number,
        default: 0
    },

    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
MarketSchema.pre('save', function (next) {
    const doc = this;
    Counter.findByIdAndUpdate(
        { _id: 'entityId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    ).then(counter => {
        doc.number = counter.seq;
        next();
    }).catch(error => {
        next(error);
    });
});
const Market = mongoose.model('Market', MarketSchema);
module.exports = Market;
