const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./counter');
const HolderSchema = new Schema({
    address: {
        type: String,
        required: true,
    },
    tick: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0
    },
    number: {
        type: Number,
        default: 0
    },
    mints: {
        type: Number,
        default: 0
    },
    value: {
        type: Number,
        default: 0
    },
    nonce: {
        type: String
    },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
HolderSchema.pre('save', function (next) {
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
const Holder = mongoose.model('Holder', HolderSchema);
module.exports = Holder;
