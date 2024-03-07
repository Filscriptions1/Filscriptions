const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SyncSchema = new Schema({

    block: { type: Number },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
module.exports = mongoose.model('Sync', SyncSchema);