const taskList = document.getElementById("task-list");
const form = document.getElementById("task-form");
const refreshButton = document.getElementById("refresh-button");
const statusMessage = document.getElementById("status-message");

const STATUS_LABELS = {
  open: "Open",
  done: "Done",
};

const fetchTasks = async () => {
  const response = await fetch("/api/tasks");
  const data = await response.json();
  renderTasks(data.tasks || []);
};

const renderTasks = (tasks) => {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "task-card";
    empty.textContent = "No tasks yet. Add your first task above.";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement("li");
    card.className = "task-card";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const title = document.createElement("strong");
    title.textContent = task.title;

    const id = document.createElement("span");
    id.textContent = `Task #${task.id}`;

    meta.appendChild(title);
    meta.appendChild(id);

    const tag = document.createElement("span");
    tag.className = `tag ${task.status === "done" ? "done" : ""}`;
    tag.textContent = STATUS_LABELS[task.status] ?? task.status;
    tag.role = "button";
    tag.tabIndex = 0;
    tag.title = "Toggle status";

    tag.addEventListener("click", () => toggleStatus(task));
    tag.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        toggleStatus(task);
      }
    });

    card.appendChild(meta);
    card.appendChild(tag);
    taskList.appendChild(card);
  });
};

const setStatusMessage = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#c62828" : "";
};

const toggleStatus = async (task) => {
  const nextStatus = task.status === "done" ? "open" : "done";
  const response = await fetch(`/api/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!response.ok) {
    setStatusMessage("Unable to update task status.", true);
    return;
  }

  await fetchTasks();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const title = formData.get("title");

  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const data = await response.json();
    setStatusMessage(data.error || "Unable to create task.", true);
    return;
  }

  form.reset();
  setStatusMessage("Task added! Select the status pill to mark it done.");
  await fetchTasks();
});

refreshButton.addEventListener("click", fetchTasks);

fetchTasks();
