const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    description: String,
    daysOfWeek: [String],
    tags: [String],
    minutes: Number,
    streak: { type: Number, default: 0 }
  });  


module.exports = mongoose.model('Habit', habitSchema);

habitSchema.index({ tags: 1 });
habitSchema.index({ daysOfWeek: 1 });

module.exports = mongoose.model('Habit', habitSchema);
