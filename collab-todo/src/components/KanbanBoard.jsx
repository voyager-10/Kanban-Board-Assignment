import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import io from "socket.io-client";
import {
  getTasks,
  moveTask,
  createTask,
  deleteTask,
  assignTask,
  getUsers,
} from "../api";
import "../styles/KanbanBoard.css";

const socket = io("http://localhost:5000"); // Replace with backend URL if hosted
let draggedTask = null;

export default function KanbanBoard() {
  const [conflict, setConflict] = useState(null);

  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const refresh = async () => {
    setLoading(true);
    const data = await getTasks();
    setTasks(data);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    const fetch = async () => {
      const data = await getTasks();
      setTasks(data);
    };
    fetch();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const data = await getTasks();
      setTasks(data);
    };

    socket.on("task-updated", refresh);
    socket.on("task-created", refresh);
    socket.on("task-deleted", refresh); // if you emit this on deletion

    return () => {
      socket.off("task-updated", refresh);
      socket.off("task-created", refresh);
      socket.off("task-deleted", refresh);
    };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) return;

    try {
      await moveTask(draggedTask._id, { status: newStatus });
      // No need to update manually – real-time socket will auto-update state
    } catch (err) {
      console.error("Failed to move task:", err);
    } finally {
      draggedTask = null;
    }
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask({
        title: newTitle,
        description: "",
        assignedTo: user.id,
        status: "Todo",
        priority: "Low",
      });
      setNewTitle("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId, localStorage.getItem("token"));
      setTasks((prev) => prev.filter((task) => task._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="board">
      <div style={{ marginBottom: "1rem" }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New Task Title"
        />
        <button onClick={handleCreateTask}>Add Task</button>
      </div>

      {["Todo", "In Progress", "Done"].map((status) => (
        <div
          className="column"
          key={status}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, status)}
        >
          <h3>{status}</h3>
          {tasks
            .filter((task) => task.status === status)
            .map((task) => (
              <div
                key={task._id}
                className={`card ${
                  task.assignedTo?._id !== user.id ? "disabled" : ""
                }`}
                draggable={task.assignedTo?._id === user.id}
                onDragStart={() => {
                  if (task.assignedTo?._id === user.id) {
                    draggedTask = task;
                  }
                }}
              >
                <p>{task.title}</p>
                <small>Assigned: {task.assignedTo?.username}</small>
                {task.assignedTo?._id === user.id && (
                  <select
                    defaultValue=""
                    onChange={(e) =>
                      assignTask(
                        task._id,
                        e.target.value,
                        localStorage.getItem("token")
                      )
                    }
                  >
                    <option value="" disabled>
                      Assign to
                    </option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                )}

                {task.assignedTo?._id === user.id && (
                  <button onClick={() => handleDeleteTask(task._id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
