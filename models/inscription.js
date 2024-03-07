const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./counter');
const InscriptionSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        unique: true
    },
    owner: {
        type: String,
        require: true
    },

    protocol: {
        type: String,
        default: 'fil-20'
    },
    contentType: {
        type: String,
        default: 'text/plain'
    },
    content: {
        type: String
    },
    createdAt: Number,
    updatedAt: Number,
}, {
    timestamps: {
        currentTime: () => Math.floor(Date.now())
    }
});
InscriptionSchema.pre('save', function (next) {

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
module.exports = mongoose.model('Inscription', InscriptionSchema);
