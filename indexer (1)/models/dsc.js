const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DscSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },
    blockNumber: {
        type: Number,
    },
    transactionIndex: {
        type: Number,
        default: 0
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    data: {
        type: String
    },
    dsc: {
        type: String
    },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
const Dsc = mongoose.model('Dsc', DscSchema);
module.exports = Dsc;
