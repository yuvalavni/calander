

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const EVENTS_FILE = path.join(__dirname, 'events.json');
let events = [];

// Load events from file on startup
function loadEvents() {
  try {
    const data = fs.readFileSync(EVENTS_FILE, 'utf8');
    events = JSON.parse(data);
  } catch (err) {
    events = [];
  }
}

// Save events to file
function saveEvents() {
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
}

loadEvents();


app.get('/api/events', (req, res) => {
  res.json(events);
});


app.post('/api/events', (req, res) => {
  const { title, start, end, color, note } = req.body;
  if (!title || !start || !end || !color) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  events.push({ title, start, end, color, note });
  saveEvents();
  res.status(201).json({ success: true });
});

// Edit event by index
app.patch('/api/events/:index', (req, res) => {
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= events.length) {
    return res.status(404).json({ error: 'Event not found' });
  }
  const { title, start, end, color, note } = req.body;
  if (!title || !start || !end || !color) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  events[idx] = { title, start, end, color, note };
  saveEvents();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
