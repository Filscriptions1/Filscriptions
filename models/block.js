const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BlockSchema = new Schema({

    block: { type: Number, unique: true },
    state: {
        type: Boolean,
        default: false
    },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
module.exports = mongoose.model('Block', BlockSchema);