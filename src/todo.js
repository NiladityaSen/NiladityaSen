export const MAX_TITLE_LENGTH = 200;
const STORAGE_KEY = 'todo-app-tasks';

const PRIORITIES = new Set(['low', 'medium', 'high']);

function toSafeString(value) {
  return typeof value === 'string' ? value : '';
}

export function normalizeTitle(value) {
  return toSafeString(value).trim().replace(/\s+/g, ' ');
}

function normalizePriority(value) {
  return PRIORITIES.has(value) ? value : 'medium';
}

function normalizeDueDate(value) {
  const date = toSafeString(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

export function validateTitle(value) {
  const title = normalizeTitle(value);

  if (!title) {
    return { valid: false, title, error: 'Task title cannot be empty.' };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      title,
      error: `Task title must be ${MAX_TITLE_LENGTH} characters or fewer.`
    };
  }

  return { valid: true, title, error: '' };
}

export function createTask({ title, dueDate = '', priority = 'medium' }, now = new Date()) {
  const result = validateTitle(title);

  if (!result.valid) {
    throw new Error(result.error);
  }

  const timestamp = now instanceof Date ? now.toISOString() : new Date().toISOString();

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: result.title,
    completed: false,
    created_at: timestamp,
    due_date: normalizeDueDate(dueDate),
    priority: normalizePriority(priority)
  };
}

export function addTask(tasks, input, now = new Date()) {
  const nextTask = createTask(input, now);
  return [...tasks, nextTask];
}

export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
}

export function editTask(tasks, id, updates) {
  return tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }

    const titleValidation =
      updates.title === undefined ? { valid: true, title: task.title } : validateTitle(updates.title);

    if (!titleValidation.valid) {
      throw new Error(titleValidation.error);
    }

    return {
      ...task,
      title: titleValidation.title,
      due_date: updates.dueDate === undefined ? task.due_date : normalizeDueDate(updates.dueDate),
      priority: updates.priority === undefined ? task.priority : normalizePriority(updates.priority)
    };
  });
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function filterTasks(tasks, filter = 'all', search = '') {
  const query = toSafeString(search).trim().toLowerCase();

  return tasks.filter((task) => {
    if (filter === 'active' && task.completed) {
      return false;
    }

    if (filter === 'completed' && !task.completed) {
      return false;
    }

    if (!query) {
      return true;
    }

    return task.title.toLowerCase().includes(query);
  });
}

function isTaskLike(task) {
  return task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean';
}

export function deserializeTasks(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isTaskLike).map((task) => ({
      id: task.id,
      title: normalizeTitle(task.title),
      completed: Boolean(task.completed),
      created_at: toSafeString(task.created_at) || new Date().toISOString(),
      due_date: normalizeDueDate(task.due_date),
      priority: normalizePriority(task.priority)
    }));
  } catch {
    return [];
  }
}

export function serializeTasks(tasks) {
  return JSON.stringify(tasks);
}

export function loadTasks(storage, key = STORAGE_KEY) {
  return deserializeTasks(storage.getItem(key));
}

export function saveTasks(storage, tasks, key = STORAGE_KEY) {
  storage.setItem(key, serializeTasks(tasks));
}
