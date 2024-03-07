const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TokenSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    tick: {
        type: String,
        maxlength: 4
    },
    max: {
        type: Number,
        min: 1
    },
    minted: {
        type: Number,
        default: 0,
        default: 0
    },
    limit: {
        type: Number,
        min: 0,
        require: true
    },
    precision: {
        type: Number,
        min: 0,
        default: 0
    },
    deployBy: {
        type: String,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    holders: {
        type: Number,
        min: 0
    },
    trxs: {
        type: Number,
        min: 0
    },
    content: {
        type: Schema.Types.Mixed,
    },
    completedAt: Number,
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
module.exports = mongoose.model('Token', TokenSchema);
