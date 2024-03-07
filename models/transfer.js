const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./counter');
const TransferSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },
    tick: {
        type: String,
    },
    number: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        default: 0
    },
    method: {
        type: String,
        default: 'transfer'
    },
    from: {
        type: String,
        default: 'transfer'
    },
    to: {
        type: String,
        default: 'transfer'
    },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
TransferSchema.pre('save', function (next) {
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
module.exports = mongoose.model('Transfer', TransferSchema);
