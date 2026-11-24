'use strict';

const STORAGE_KEY = 'organizae_tasks_v1';
const form = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const titleInput = document.getElementById('title');
const subjectInput = document.getElementById('subject');
const dueDateInput = document.getElementById('dueDate');
const descriptionInput = document.getElementById('description');
const statusInput = document.getElementById('status');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const cancelEdit = document.getElementById('cancelEdit');
const saveButton = document.getElementById('saveButton');
const formTitle = document.getElementById('formTitle');
const toast = document.getElementById('toast');

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Não foi possível carregar as tarefas:', error);
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2300);
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDate(dateString) {
  if (!dateString) return 'Sem data';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function updateStats() {
  document.getElementById('totalCount').textContent = tasks.length;
  document.getElementById('pendingCount').textContent = tasks.filter(task => task.status !== 'Concluída').length;
  document.getElementById('doneCount').textContent = tasks.filter(task => task.status === 'Concluída').length;
}

function renderTasks() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase('pt-BR');
  const selectedStatus = filterStatus.value;
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = `${task.title} ${task.subject}`.toLocaleLowerCase('pt-BR').includes(searchTerm);
    const matchesStatus = selectedStatus === 'Todas' || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  taskList.innerHTML = filteredTasks.map(task => {
    const statusClass = task.status === 'Concluída' ? 'concluida' : task.status === 'Em andamento' ? 'andamento' : 'pendente';
    return `<article class="task-item">
      <div class="task-main">
        <p class="task-title">${escapeHTML(task.title)}</p>
        <div class="task-meta"><span>${escapeHTML(task.subject || 'Sem matéria')}</span><span>Entrega: ${formatDate(task.dueDate)}</span></div>
        ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
      </div>
      <div class="task-side">
        <span class="status status-${statusClass}">${escapeHTML(task.status)}</span>
        <div class="task-actions">
          <button class="icon-btn" type="button" data-action="edit" data-id="${task.id}" aria-label="Editar ${escapeHTML(task.title)}">Editar</button>
          <button class="icon-btn" type="button" data-action="delete" data-id="${task.id}" aria-label="Excluir ${escapeHTML(task.title)}">Excluir</button>
        </div>
      </div>
    </article>`;
  }).join('');

  emptyState.classList.toggle('hidden', filteredTasks.length > 0);
  taskList.classList.toggle('hidden', filteredTasks.length === 0);
  document.getElementById('visibleCount').textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'tarefa' : 'tarefas'}`;
  updateStats();
}

function resetForm() {
  form.reset();
  taskIdInput.value = '';
  formTitle.textContent = 'Adicionar tarefa';
  saveButton.textContent = 'Salvar tarefa';
  cancelEdit.classList.add('hidden');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const taskData = {
    title: titleInput.value.trim(),
    subject: subjectInput.value.trim(),
    dueDate: dueDateInput.value,
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };

  if (!taskData.title || !taskData.dueDate) {
    showToast('Preencha os campos obrigatórios.');
    return;
  }

  const editingId = taskIdInput.value;
  if (editingId) {
    tasks = tasks.map(task => task.id === editingId ? { ...task, ...taskData } : task);
    showToast('Tarefa atualizada com sucesso!');
  } else {
    tasks.push({ id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()), ...taskData });
    showToast('Tarefa cadastrada com sucesso!');
  }

  saveTasks();
  resetForm();
  renderTasks();
});

taskList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const task = tasks.find(item => item.id === button.dataset.id);
  if (!task) return;

  if (button.dataset.action === 'edit') {
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    subjectInput.value = task.subject;
    dueDateInput.value = task.dueDate;
    descriptionInput.value = task.description;
    statusInput.value = task.status;
    formTitle.textContent = 'Editar tarefa';
    saveButton.textContent = 'Salvar alterações';
    cancelEdit.classList.remove('hidden');
    titleInput.focus();
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm(`Deseja realmente excluir "${task.title}"?`);
    if (!confirmed) return;
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
    showToast('Tarefa excluída.');
  }
});

cancelEdit.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderTasks);
filterStatus.addEventListener('change', renderTasks);

renderTasks();
