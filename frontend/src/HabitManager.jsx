import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HabitManager = () => {
  const [habits, setHabits] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    daysOfWeek: [],
    tags: '',
    minutes: '',
  });
  const [editId, setEditId] = useState(null);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [reportWeekday, setReportWeekday] = useState('');
  const [reportTag, setReportTag] = useState('');
  const [weekdayReportResults, setWeekdayReportResults] = useState([]);
  const allTags = [...new Set(habits.flatMap(h => h.tags || []))];

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/habits');
      setHabits(res.data);
    } catch (err) {
      console.error('Error fetching habits:', err);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDaysChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
    if (selected.includes('Every Day')) {
      setForm({ ...form, daysOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] });
    } else {
      setForm({ ...form, daysOfWeek: selected });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagsArray = form.tags.split(',').map(tag => tag.trim());
    try {
      if (editId) {
        await axios.put(`http://localhost:5001/api/habits/${editId}`, {
          ...form,
          tags: tagsArray,
          minutes: parseInt(form.minutes)
        });
        setEditId(null);
      } else {
        await axios.post('http://localhost:5001/api/habits', {
          ...form,
          tags: tagsArray,
          minutes: parseInt(form.minutes),
          streak: 0
        });
      }
      setForm({ title: '', description: '', daysOfWeek: [], tags: '', minutes: '' });
      fetchHabits();
    } catch (err) {
      console.error('Error saving habit:', err);
    }
  };

  const handleEdit = (habit) => {
    setForm({
      title: habit.title,
      description: habit.description,
      daysOfWeek: habit.daysOfWeek || [],
      tags: habit.tags?.join(', ') || '',
      minutes: habit.minutes || ''
    });
    setEditId(habit._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/habits/${id}`);
      fetchHabits();
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  const incrementStreak = async (id) => {
    try {
      const habit = habits.find(h => h._id === id);
      const newStreak = (habit.streak || 0) + 1;
      await axios.put(`http://localhost:5001/api/habits/${id}`, { streak: newStreak });
      fetchHabits();
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  const fetchWeekdayReport = async () => {
    try {
      const params = {};
      if (reportWeekday) params.weekday = reportWeekday;
      if (reportTag) params.tag = reportTag;

      const res = await axios.get('http://localhost:5001/api/reports', { params });
      setWeekdayReportResults(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Habit Tracker</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleInputChange} required /><br />
        <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleInputChange} required /><br />
        <label>Days of the Week:</label>
        <br />
        <select multiple value={form.daysOfWeek} onChange={handleDaysChange}>
          <option value="Every Day">Every Day</option>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select><br />
        <input type="text" name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={handleInputChange} /><br />
        <input type="number" name="minutes" placeholder="Estimated minutes" value={form.minutes} onChange={handleInputChange} /><br />
        <button type="submit">{editId ? 'Update Habit' : 'Add Habit'}</button>
      </form>

      <h3>My Habits</h3>
      <ul>
        {habits
          .filter(h => !selectedTag || h.tags?.includes(selectedTag))
          .map((habit) => (
            <li key={habit._id}>
              <strong>{habit.title}</strong>: {habit.description}<br />
              <em>Days: {habit.daysOfWeek?.join(', ') || 'N/A'} | Tags: {habit.tags?.join(', ') || 'None'} | Est. Time: {habit.minutes} min | Streak: {habit.streak || 0}</em><br />
              <button onClick={() => handleEdit(habit)}>Edit</button>
              <button onClick={() => handleDelete(habit._id)}>Delete</button>
              <button onClick={() => incrementStreak(habit._id)}>+1 Day Streak</button>
            </li>
          ))}
      </ul>

      <hr />
      <h2>Weekly Habit Report</h2>
      <label>Filter by Day: </label>
      <select value={reportWeekday} onChange={e => setReportWeekday(e.target.value)}>
        <option value="">All</option>
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
          <option key={day} value={day}>{day}</option>
        ))}
      </select>
      <br />
      <label>Filter by Tag: </label>
      <select value={reportTag} onChange={e => setReportTag(e.target.value)}>
        <option value="">All</option>
        {allTags.map((tag, index) => (
          <option key={index} value={tag}>{tag}</option>
        ))}
      </select>
      <br />
      <button onClick={fetchWeekdayReport}>Generate Report</button>

      <h3>Report Results</h3>
      {weekdayReportResults.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th>Days</th>
              <th>Avg Minutes</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {weekdayReportResults.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td>{r.tags?.join(', ')}</td>
                <td>{r.daysOfWeek?.join(', ')}</td>
                <td>{r.avgMinutes?.toFixed(1) || 0}</td>
                <td>{r.streak || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HabitManager;
