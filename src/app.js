import {
  addTask,
  deleteTask,
  editTask,
  filterTasks,
  loadTasks,
  saveTasks,
  toggleTask
} from './todo.js';

const state = {
  tasks: [],
  filter: 'all',
  search: '',
  loading: true,
  error: '',
  lastSubmit: { title: '', at: 0 }
};

const elements = {
  form: document.querySelector('#task-form'),
  titleInput: document.querySelector('#task-title'),
  dueInput: document.querySelector('#task-due-date'),
  priorityInput: document.querySelector('#task-priority'),
  searchInput: document.querySelector('#task-search'),
  taskList: document.querySelector('#task-list'),
  filterButtons: document.querySelectorAll('[data-filter]'),
  emptyState: document.querySelector('#empty-state'),
  status: document.querySelector('#status-message'),
  loading: document.querySelector('#loading-state')
};

function setStatus(message = '') {
  state.error = message;
  elements.status.textContent = message;
}

function setLoading(loading) {
  state.loading = loading;
  elements.loading.hidden = !loading;
}

function persist() {
  saveTasks(localStorage, state.tasks);
}

function render() {
  const visibleTasks = filterTasks(state.tasks, state.filter, state.search);

  elements.taskList.innerHTML = '';

  visibleTasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item ${task.completed ? 'is-complete' : ''}`;
    item.dataset.id = task.id;

    item.innerHTML = `
      <label>
        <input type="checkbox" data-action="toggle" ${task.completed ? 'checked' : ''} aria-label="Mark task complete" />
        <span>${task.title}</span>
      </label>
      <div class="task-meta">
        ${task.due_date ? `<small>Due: ${task.due_date}</small>` : ''}
        <small>Priority: ${task.priority}</small>
      </div>
      <div class="task-actions">
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="delete">Delete</button>
      </div>
    `;

    elements.taskList.appendChild(item);
  });

  elements.emptyState.hidden = visibleTasks.length > 0 || state.loading;

  elements.filterButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === state.filter));
  });
}

function isDuplicateRapidSubmit(title) {
  const now = Date.now();
  const duplicate = state.lastSubmit.title === title && now - state.lastSubmit.at < 1000;
  state.lastSubmit = { title, at: now };
  return duplicate;
}

function handleCreate(event) {
  event.preventDefault();
  setStatus('');

  const title = elements.titleInput.value;
  const dueDate = elements.dueInput.value;
  const priority = elements.priorityInput.value;

  try {
    const normalizedTitle = title.trim().replace(/\s+/g, ' ');

    if (isDuplicateRapidSubmit(normalizedTitle)) {
      throw new Error('Duplicate task submission blocked. Please wait and try again.');
    }

    state.tasks = addTask(state.tasks, { title, dueDate, priority });
    persist();
    elements.form.reset();
    elements.priorityInput.value = 'medium';
    elements.titleInput.focus();
    render();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to add task.');
  }
}

function handleItemAction(event) {
  const button = event.target.closest('[data-action]');

  if (!button) {
    return;
  }

  const item = event.target.closest('.task-item');

  if (!item) {
    return;
  }

  const { id } = item.dataset;

  try {
    if (button.dataset.action === 'toggle') {
      state.tasks = toggleTask(state.tasks, id);
    } else if (button.dataset.action === 'delete') {
      state.tasks = deleteTask(state.tasks, id);
    } else if (button.dataset.action === 'edit') {
      const current = state.tasks.find((task) => task.id === id);
      const nextTitle = window.prompt('Edit task title', current?.title ?? '');

      if (nextTitle === null) {
        return;
      }

      state.tasks = editTask(state.tasks, id, { title: nextTitle });
    }

    persist();
    render();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to update task.');
  }
}

function handleFilter(event) {
  const button = event.target.closest('[data-filter]');

  if (!button) {
    return;
  }

  state.filter = button.dataset.filter;
  render();
}

function handleSearch() {
  state.search = elements.searchInput.value;
  render();
}

function init() {
  setLoading(true);
  state.tasks = loadTasks(localStorage);
  setLoading(false);
  render();

  elements.form.addEventListener('submit', handleCreate);
  elements.taskList.addEventListener('click', handleItemAction);
  elements.taskList.addEventListener('change', handleItemAction);
  document.querySelector('.filters').addEventListener('click', handleFilter);
  elements.searchInput.addEventListener('input', handleSearch);
  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      elements.searchInput.value = '';
      handleSearch();
    }
  });
}

init();
