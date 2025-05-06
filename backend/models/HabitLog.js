const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema({
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    date: { type: Date, required: true },
    minutes: { type: Number, default: 0 },
    status: { type: Boolean, default: true }
});

module.exports = mongoose.model('HabitLog', habitLogSchema);

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('HabitLog', habitLogSchema);
