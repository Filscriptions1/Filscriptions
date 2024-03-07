
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CounterSchema = new Schema({
    _id: String,
    seq: { type: Number, default: 10000000 }
});


const Counter = mongoose.model('Counter', CounterSchema);


module.exports = Counter;
