const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Habit = require('./models/Habit');
const HabitLog = require('./models/HabitLog');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('❌ MongoDB connection error:', err));

app.get('/', (req, res) => res.send('Hello, MERN!'));

// Create a habit
app.post('/api/habits', async (req, res) => {
  try {
    const habit = new Habit(req.body);
    await habit.save();
    res.status(201).json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all habits
app.get('/api/habits', async (req, res) => {
  try {
    const habits = await Habit.find();
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a habit
app.delete('/api/habits/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a habit
app.put('/api/habits/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json(habit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Log a habit completion
app.post('/api/habitlogs', async (req, res) => {
  try {
    const { habitId, date, minutes = 0 } = req.body;

    // Prevent duplicates for same day
    const existing = await HabitLog.findOne({
      habitId,
      date: new Date(date).toDateString()
    });

    if (existing) {
      return res.status(409).json({ message: 'Log already exists for this date' });
    }

    const log = new HabitLog({
      habitId,
      date: new Date(date),
      minutes,
      status: true
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Weekly Habit Report (by weekday and/or tag)
app.get('/api/reports', async (req, res) => {
  const { tag, weekday } = req.query;

  try {
    const habitFilter = {};
    if (tag) habitFilter.tags = tag;
    if (weekday) habitFilter.daysOfWeek = weekday;

    const habits = await Habit.find(habitFilter);

    const results = await Promise.all(habits.map(async (habit) => {
      const logs = await HabitLog.find({ habitId: habit._id });
      const totalCompletions = logs.length;
      const avgMinutes = logs.length > 0
        ? logs.reduce((sum, log) => sum + (log.minutes || 0), 0) / logs.length
        : 0;

      return {
        _id: habit._id,
        title: habit.title,
        tags: habit.tags,
        daysOfWeek: habit.daysOfWeek,
        streak: habit.streak || 0,
        avgMinutes,
        totalCompletions
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));