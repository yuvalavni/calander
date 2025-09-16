document.addEventListener('DOMContentLoaded', () => {
  const calendar = document.getElementById('calendar');
  const calendarHeader = document.getElementById('calendar-header');
  const viewSwitcher = document.getElementById('view-switcher');
  const modal = document.getElementById('event-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalForm = document.getElementById('modal-event-form');
  const prevBtn = document.getElementById('prev-period');
  const nextBtn = document.getElementById('next-period');
  const periodLabel = document.getElementById('current-period-label');
  let currentView = 'month';
  let allEvents = [];
  let modalCellDate = null;
let editingEventIndex = null;
  let currentDate = new Date();
  let selectedDay = null;

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

  function showModal(dateOrEvent, editIndex = null) {
      modal.style.display = 'flex';
      editingEventIndex = null;
      if (typeof dateOrEvent === 'object' && dateOrEvent && dateOrEvent.title) {
        // Editing existing event
        const ev = dateOrEvent;
        document.getElementById('modal-title').value = ev.title;
        document.getElementById('modal-note').value = ev.note || '';
        document.getElementById('modal-color').value = ev.color;
        document.getElementById('modal-start').value = ev.start.slice(0, 16);
        document.getElementById('modal-end').value = ev.end.slice(0, 16);
        editingEventIndex = editIndex;
      } else {
        // Creating new event
        modalCellDate = dateOrEvent;
        document.getElementById('modal-title').value = '';
        document.getElementById('modal-note').value = '';
        document.getElementById('modal-color').value = '#2196f3';
        if (dateOrEvent) {
          const iso = dateOrEvent.toISOString().slice(0, 16);
          document.getElementById('modal-start').value = iso;
          document.getElementById('modal-end').value = iso;
        } else {
          document.getElementById('modal-start').value = '';
          document.getElementById('modal-end').value = '';
        }
      }
  }

  function hideModal() {
      modal.style.display = 'none';
      modalCellDate = null;
      editingEventIndex = null;
    }

  function renderDayEventsList(date, events) {
    const listDiv = document.getElementById('day-events-list');
    if (currentView !== 'month') {
      listDiv.innerHTML = '';
      listDiv.style.display = 'none';
      return;
    }
    listDiv.style.display = '';
    listDiv.innerHTML = '';
    if (!date) return;
    const dayEvents = events.filter(e => {
      const d = new Date(e.start);
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });
    if (dayEvents.length === 0) {
      listDiv.innerHTML = '<div style="color:#888;text-align:center;margin:16px 0;">No events for this day.</div>';
      return;
    }
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '16px 0';
    dayEvents.forEach(ev => {
      const li = document.createElement('li');
      li.style.marginBottom = '8px';
      li.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${ev.color};margin-right:8px;vertical-align:middle;"></span><strong>${ev.title}</strong> <span style=\"color:#888;font-size:0.95em;\">(${new Date(ev.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${new Date(ev.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})})</span>` + (ev.note ? `<div style='color:#444;font-size:0.97em;margin-top:2px;'>${ev.note}</div>` : '');
      // Add edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.marginLeft = '10px';
      editBtn.style.fontSize = '0.9em';
      editBtn.style.padding = '2px 8px';
      editBtn.style.borderRadius = '4px';
      editBtn.style.border = '1px solid #2196f3';
      editBtn.style.background = '#fff';
      editBtn.style.color = '#2196f3';
      editBtn.style.cursor = 'pointer';
      editBtn.addEventListener('click', () => {
        showModal(ev, events.indexOf(ev));
      });
      li.appendChild(editBtn);
      ul.appendChild(li);
    });
    listDiv.appendChild(ul);
  }

  function renderCalendarGrid(events) {
    calendar.innerHTML = '';
    calendarHeader.innerHTML = '';
    let now = new Date(currentDate);
    // Set period label
    // Always hide the day events list unless in month view
    const listDiv = document.getElementById('day-events-list');
    if (listDiv) {
      if (currentView !== 'month') {
        listDiv.innerHTML = '';
        listDiv.style.display = 'none';
      }
    }
    if (currentView === 'month') {
      periodLabel.textContent = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    } else if (currentView === 'week') {
      const startOfWeek = getStartOfWeek(now);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      periodLabel.textContent = `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
    } else {
      periodLabel.textContent = now.toLocaleDateString();
    }
    if (currentView === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = new Date(year, month, 1).getDay();
      const startDay = (firstDay + 6) % 7; // Monday as first column
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      weekDays.forEach(day => {
        const h = document.createElement('div');
        h.textContent = day;
        calendarHeader.appendChild(h);
      });
      // Calculate number of rows needed (5 or 6)
      const totalCells = daysInMonth + startDay;
      const numRows = Math.ceil(totalCells / 7);
      calendar.innerHTML = '';
      calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';
      let dayEventsListInserted = false;
      for (let row = 0; row < numRows; row++) {
        let hasDate = false;
        const rowCells = [];
        for (let col = 0; col < 7; col++) {
          const cell = document.createElement('div');
          cell.className = 'calendar-cell';
          const cellIndex = row * 7 + col;
          const dateNum = cellIndex - startDay + 1;
          if (dateNum > 0 && dateNum <= daysInMonth) {
            hasDate = true;
            const cellDate = new Date(year, month, dateNum);
            cell.innerHTML = `<div class="cell-date">${dateNum}</div>`;
            if (cellDate.toDateString() === (new Date()).toDateString()) {
              cell.classList.add('today');
            }
            if (selectedDay && cellDate.toDateString() === selectedDay.toDateString()) {
              cell.style.outline = '2px solid #2196f3';
            }
            events.filter(e => {
              const start = new Date(e.start);
              return start.getDate() === dateNum && start.getMonth() === month && start.getFullYear() === year;
            }).forEach(event => {
              const ev = document.createElement('div');
              ev.className = 'event';
              ev.style.background = event.color;
              ev.textContent = event.title.length > 20 ? event.title.slice(0, 20) + '…' : event.title;
              ev.style.cursor = 'pointer';
              ev.addEventListener('click', (eClick) => {
                eClick.stopPropagation();
                showModal(event, events.indexOf(event));
              });
              cell.appendChild(ev);
            });
            cell.addEventListener('click', () => {
              selectedDay = cellDate;
              renderCalendarGrid(allEvents);
              renderDayEventsList(cellDate, allEvents);
            });
            cell.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              showModal(cellDate);
            });
          }
          rowCells.push(cell);
        }
        // Only append the row if it contains at least one valid date
        if (hasDate) {
          rowCells.forEach(cell => calendar.appendChild(cell));
          // After the last row with dates, insert the day events list
          if (row === numRows - 1 && !dayEventsListInserted) {
            renderDayEventsList(selectedDay, allEvents);
            dayEventsListInserted = true;
          }
        }
      }
    } else if (currentView === 'week') {
      // ...existing code for week view...
      calendarHeader.innerHTML = '';
      calendarHeader.style.gridTemplateColumns = '60px repeat(7, 1fr)';
      const hourHeader = document.createElement('div');
      hourHeader.textContent = '';
      calendarHeader.appendChild(hourHeader);
      const weekDays = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(2023, 0, i); // 2023-01-01 is a Sunday
        weekDays.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
      }
      weekDays.forEach(day => {
        const h = document.createElement('div');
        h.textContent = day;
        calendarHeader.appendChild(h);
      });
      calendar.style.gridTemplateRows = 'repeat(24, 1fr)';
      calendar.style.gridTemplateColumns = '60px repeat(7, 1fr)';
      const startOfWeek = getStartOfWeek(now);
      for (let hour = 0; hour < 24; hour++) {
        for (let d = -1; d < 7; d++) {
          if (d === -1) {
            const hourCell = document.createElement('div');
            hourCell.className = 'calendar-cell hour-label';
            hourCell.textContent = `${hour}:00`;
            calendar.appendChild(hourCell);
          } else {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (hour === 0) {
              const cellDate = new Date(startOfWeek);
              cellDate.setDate(cellDate.getDate() + d);
              if (cellDate.toDateString() === (new Date()).toDateString()) {
                cell.classList.add('today');
              }
            }
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
      }
    } else if (currentView === 'day') {
      calendarHeader.innerHTML = '';
      calendarHeader.appendChild(document.createElement('div')).textContent = now.toLocaleDateString();
      calendar.style.gridTemplateColumns = '1fr';
      calendar.style.gridTemplateRows = 'repeat(24, 1fr)';
      for (let hour = 0; hour < 24; hour++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.innerHTML = `<div class=\"cell-date\">${hour}:00</div>`;
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
    const note = document.getElementById('modal-note').value;
    const start = document.getElementById('modal-start').value;
    const end = document.getElementById('modal-end').value;
    let color = document.getElementById('modal-color').value;
    if (editingEventIndex !== null) {
      // Edit existing event
      fetch(`/api/events/${editingEventIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, note, start, end, color })
      })
        .then(res => res.json())
        .then(() => {
          hideModal();
          fetchEvents();
        });
    } else {
      // Create new event
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, note, start, end, color })
      })
        .then(res => res.json())
        .then(() => {
          hideModal();
          fetchEvents();
        });
    }
  });

  closeModalBtn.addEventListener('click', hideModal);
  window.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  viewSwitcher.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      currentView = e.target.dataset.view;
      setActiveViewButton(currentView);
      // Reset currentDate to today and clear selectedDay on view change
      currentDate = new Date();
      selectedDay = null;
      renderCalendarGrid(allEvents);
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentView === 'month') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (currentView === 'week') {
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    selectedDay = null;
    renderCalendarGrid(allEvents);
  });

  nextBtn.addEventListener('click', () => {
    if (currentView === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (currentView === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    selectedDay = null;
    renderCalendarGrid(allEvents);
  });

  setActiveViewButton(currentView);
  renderCalendarGrid(allEvents);
  fetchEvents();
});
