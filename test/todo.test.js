import test from 'node:test';
import assert from 'node:assert/strict';

import {
  addTask,
  deleteTask,
  deserializeTasks,
  editTask,
  filterTasks,
  loadTasks,
  saveTasks,
  toggleTask
} from '../src/todo.js';

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    }
  };
}

test('addTask creates a task with expected defaults', () => {
  const tasks = addTask([], { title: 'Buy milk' }, new Date('2025-01-01T10:00:00.000Z'));

  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, 'Buy milk');
  assert.equal(tasks[0].completed, false);
  assert.equal(tasks[0].created_at, '2025-01-01T10:00:00.000Z');
  assert.equal(tasks[0].priority, 'medium');
});

test('toggleTask flips completion state', () => {
  const [task] = addTask([], { title: 'Task A' });
  const toggled = toggleTask([task], task.id);
  assert.equal(toggled[0].completed, true);
});

test('editTask updates title', () => {
  const [task] = addTask([], { title: 'Task A' });
  const updated = editTask([task], task.id, { title: 'Task B' });
  assert.equal(updated[0].title, 'Task B');
});

test('deleteTask removes the requested task', () => {
  const [taskA] = addTask([], { title: 'Task A' });
  const [taskB] = addTask([], { title: 'Task B' });
  const list = [taskA, taskB];

  const reduced = deleteTask(list, taskA.id);

  assert.equal(reduced.length, 1);
  assert.equal(reduced[0].title, 'Task B');
});

test('filterTasks returns active and completed subsets', () => {
  const [taskA] = addTask([], { title: 'Task A' });
  const [taskB] = addTask([], { title: 'Task B' });
  const completed = toggleTask([taskA], taskA.id)[0];

  const tasks = [completed, taskB];

  assert.equal(filterTasks(tasks, 'active').length, 1);
  assert.equal(filterTasks(tasks, 'completed').length, 1);
  assert.equal(filterTasks(tasks, 'all', 'task a').length, 1);
});

test('saveTasks and loadTasks persist data via storage', () => {
  const storage = createMockStorage();
  const tasks = addTask([], { title: 'Persist me' });

  saveTasks(storage, tasks);
  const loaded = loadTasks(storage);

  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].title, 'Persist me');
});

test('deserializeTasks returns empty for invalid payloads', () => {
  assert.deepEqual(deserializeTasks('{bad json'), []);
  assert.deepEqual(deserializeTasks('{"not":"array"}'), []);
});
