// Solicitar permiso de notificación
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission().then(permission => {
    if (permission !== "granted") {
      alert("⚠️ No se activaron las notificaciones. Permitilas en el navegador.");
    }
  });
}

function mostrarNotificacion(tarea) {
  if (Notification.permission === "granted") {
    new Notification("⏰ Recordatorio de tarea", {
      body: `Es hora de: ${tarea.text}`,
      icon: "https://cdn-icons-png.flaticon.com/512/2919/2919600.png"
    });
  } else {
    alert(`⏰ ¡Es hora de: ${tarea.text}!`);
  }
}

function programarAlerta(tarea) {
  const fechaHora = new Date(`${tarea.deadline}T${tarea.hora}`);
  const ahora = new Date();
  const diferencia = fechaHora - ahora;

  if (diferencia > 0) {
    setTimeout(() => {
      mostrarNotificacion(tarea);
    }, diferencia);
  }
}

function exportarTareaComoEvento(tarea) {
  const fechaInicio = new Date(`${tarea.deadline}T${tarea.hora}`);
  const fechaFin = new Date(fechaInicio.getTime() + 60 * 60 * 1000);

  const eventoICS = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${tarea.text}
DESCRIPTION:Tarea programada desde Gestor de Tareas Pro
DTSTART:${formatearFechaICS(fechaInicio)}
DTEND:${formatearFechaICS(fechaFin)}
PRIORITY:${tarea.priority === "alta" ? 1 : tarea.priority === "media" ? 5 : 9}
END:VEVENT
END:VCALENDAR
  `.trim();

  const blob = new Blob([eventoICS], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${tarea.text.replace(/\s/g, '_')}.ics`;
  link.click();
}

function formatearFechaICS(fecha) {
  return fecha.toISOString().replace(/[-:]/g, "").split(".")[0];
}

// DOM
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const deadlineInput = document.getElementById('deadlineInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filters button');
const searchInput = document.getElementById('searchInput');
const timeInput = document.getElementById('timeInput');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';
  const searchTerm = searchInput.value.toLowerCase();

  tasks.forEach((task, index) => {
    if (currentFilter === 'completed' && !task.completed) return;
    if (currentFilter === 'pending' && task.completed) return;
    if (!task.text.toLowerCase().includes(searchTerm)) return;

    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('task-info');
    infoDiv.innerHTML = `
      <strong>${task.text}</strong>
      <span class="task-meta">${getPriorityLabel(task.priority)} • Fecha límite: ${task.deadline} ${task.hora}</span>
    `;

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');

    const completeBtn = document.createElement('button');
    completeBtn.textContent = '✅';
    completeBtn.onclick = () => toggleComplete(index);

    const editBtn = document.createElement('button');
    editBtn.textContent = '✏️';
    editBtn.onclick = () => editTask(index);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.onclick = () => deleteTask(index);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '🗓️';
    exportBtn.title = 'Agregar al calendario';
    exportBtn.onclick = () => exportarTareaComoEvento(task);

    actionsDiv.appendChild(completeBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    actionsDiv.appendChild(exportBtn);

    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    taskList.appendChild(li);
  });
}

function getPriorityLabel(priority) {
  switch (priority) {
    case 'alta': return '🔴 Alta';
    case 'media': return '🟡 Media';
    case 'baja': return '🟢 Baja';
    default: return '';
  }
}

function addTask() {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;
  const deadline = deadlineInput.value;
  const hora = timeInput.value;

  if (!text || !deadline || !hora) return alert('Completá todos los campos.');

  const newTask = {
    text,
    priority,
    deadline,
    hora,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  programarAlerta(newTask);
  taskInput.value = '';
  deadlineInput.value = '';
  timeInput.value = '';
  renderTasks();
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

function editTask(index) {
  const newText = prompt('Editar tarea:', tasks[index].text);
  if (newText !== null && newText.trim() !== '') {
    tasks[index].text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(index) {
  if (confirm('¿Eliminar esta tarea?')) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

searchInput.addEventListener('input', renderTasks);
addTaskBtn.addEventListener('click', addTask);
window.addEventListener('load', renderTasks);

