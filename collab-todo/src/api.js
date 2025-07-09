// src/api.js

const BASE_URL = 'http://localhost:5000/api'; // adjust if different

export async function loginUser(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || 'Login failed');
  }

  const data = await res.json();
  return data.token;
}

export async function registerUser(username, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || 'Registration failed');
  }

  return await res.json();
}


// ✅ Fetch all tasks
export async function getTasks() {
  const res = await fetch(`${BASE_URL}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return await res.json();
}

// ✅ Move/update task (drag-drop change)
export async function moveTask(taskId, updatedFields) {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields),
  });

  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function deleteTask(taskId, token) {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return await res.json();
}

export async function getUsers() {
  const res = await fetch(`${BASE_URL}/tasks/users`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  console.log(res);
  
  
  if (!res.ok) throw new Error('Failed to fetch users');
  return await res.json();
}

export async function assignTask(taskId, assignedToId, token) {
  const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ assignedTo: assignedToId }),
  });

  if (!res.ok) throw new Error('Failed to assign task');
  return await res.json();
}

export async function updateTask(taskId, taskData, token) {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (res.status === 409) {
    const data = await res.json();
    const error = new Error('Conflict detected');
    error.status = 409;
    error.serverVersion = data.serverVersion;
    throw error;
  }

  if (!res.ok) throw new Error('Update failed');
  return await res.json();
}
