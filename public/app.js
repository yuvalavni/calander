document.addEventListener('DOMContentLoaded', () => {
  const calendar = document.getElementById('calendar');
  const calendarHeader = document.getElementById('calendar-header');
  const viewSwitcher = document.getElementById('view-switcher');
  const modal = document.getElementById('event-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalForm = document.getElementById('modal-event-form');
  let currentView = 'month';
  let allEvents = [];
  let modalCellDate = null;

  function setActiveViewButton(view) {
    Array.from(viewSwitcher.querySelectorAll('button')).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
    return new Date(d.setDate(diff));
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function showModal(date) {
    modal.style.display = 'flex';
    modalCellDate = date;
    // Pre-fill modal fields
    document.getElementById('modal-title').value = '';
    document.getElementById('modal-color').value = '#2196f3';
    if (date) {
      // Default start and end to the clicked date
      const iso = date.toISOString().slice(0, 16);
      document.getElementById('modal-start').value = iso;
      document.getElementById('modal-end').value = iso;
    } else {
      document.getElementById('modal-start').value = '';
      document.getElementById('modal-end').value = '';
    }
  }

  function hideModal() {
    modal.style.display = 'none';
    modalCellDate = null;
  }

  function renderCalendarGrid(events) {
    calendar.innerHTML = '';
    calendarHeader.innerHTML = '';
    const now = new Date();
    if (currentView === 'month') {
      // Month view: 7 columns (days), 5-6 rows (weeks)
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = new Date(year, month, 1).getDay();
      const startDay = (firstDay + 6) % 7; // Monday as first column
      // Header
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      weekDays.forEach(day => {
        const h = document.createElement('div');
        h.textContent = day;
        calendarHeader.appendChild(h);
      });
      // Grid
      const totalCells = Math.ceil((daysInMonth + startDay) / 7) * 7;
      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        const dateNum = i - startDay + 1;
        if (dateNum > 0 && dateNum <= daysInMonth) {
          const cellDate = new Date(year, month, dateNum);
          cell.innerHTML = `<div class=\"cell-date\">${dateNum}</div>`;
          if (cellDate.toDateString() === now.toDateString()) {
            cell.classList.add('today');
          }
          // Events for this day
          events.filter(e => {
            const start = new Date(e.start);
            return start.getDate() === dateNum && start.getMonth() === month && start.getFullYear() === year;
          }).forEach(event => {
            const ev = document.createElement('div');
            ev.className = 'event';
            ev.style.background = event.color;
            ev.textContent = event.title;
            cell.appendChild(ev);
          });
          // Right-click to add event
          cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showModal(cellDate);
          });
        }
        calendar.appendChild(cell);
      }
    } else if (currentView === 'week') {
      // Week view: 7 columns (days), 1 row, 24 rows (hours)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      weekDays.forEach(day => {
        const h = document.createElement('div');
        h.textContent = day;
        calendarHeader.appendChild(h);
      });
      calendar.style.gridTemplateRows = 'repeat(24, 1fr)';
      calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';
      const startOfWeek = getStartOfWeek(now);
      for (let hour = 0; hour < 24; hour++) {
        for (let d = 0; d < 7; d++) {
          const cell = document.createElement('div');
          cell.className = 'calendar-cell';
          if (hour === 0) {
            const cellDate = new Date(startOfWeek);
            cellDate.setDate(cellDate.getDate() + d);
            if (cellDate.toDateString() === now.toDateString()) {
              cell.classList.add('today');
            }
          }
          // Events for this hour
          events.filter(e => {
            const start = new Date(e.start);
            return start.getHours() === hour && start.getDay() === ((d + 1) % 7);
          }).forEach(event => {
            const ev = document.createElement('div');
            ev.className = 'event';
            ev.style.background = event.color;
            ev.textContent = event.title;
            cell.appendChild(ev);
          });
          // Right-click to add event
          const cellDate = new Date(startOfWeek);
          cellDate.setDate(cellDate.getDate() + d);
          cellDate.setHours(hour, 0, 0, 0);
          cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showModal(cellDate);
          });
          calendar.appendChild(cell);
        }
      }
    } else if (currentView === 'day') {
      // Day view: 1 column, 24 rows (hours)
      calendarHeader.appendChild(document.createElement('div')).textContent = now.toLocaleDateString();
      calendar.style.gridTemplateColumns = '1fr';
      calendar.style.gridTemplateRows = 'repeat(24, 1fr)';
      for (let hour = 0; hour < 24; hour++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.innerHTML = `<div class=\"cell-date\">${hour}:00</div>`;
        // Events for this hour
        events.filter(e => {
          const start = new Date(e.start);
          return start.getHours() === hour && start.toDateString() === now.toDateString();
        }).forEach(event => {
          const ev = document.createElement('div');
          ev.className = 'event';
          ev.style.background = event.color;
          ev.textContent = event.title;
          cell.appendChild(ev);
        });
        // Right-click to add event
        const cellDate = new Date(now);
        cellDate.setHours(hour, 0, 0, 0);
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showModal(cellDate);
        });
        calendar.appendChild(cell);
      }
    }
  }

  function fetchEvents() {
    fetch('/api/events')
      .then(res => res.json())
      .then(events => {
        allEvents = events;
        renderCalendarGrid(allEvents);
      });
  }

  // Modal event form logic
  modalForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('modal-title').value;
    const start = document.getElementById('modal-start').value;
    const end = document.getElementById('modal-end').value;
    const color = document.getElementById('modal-color').value;
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start, end, color })
    })
      .then(res => res.json())
      .then(() => {
        hideModal();
        fetchEvents();
      });
  });

  closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  viewSwitcher.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      currentView = e.target.dataset.view;
      setActiveViewButton(currentView);
      renderCalendarGrid(allEvents);
    }
  });

  setActiveViewButton(currentView);
  fetchEvents();
});
