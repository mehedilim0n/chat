const orderList = document.getElementById("order-list");
const form = document.getElementById("order-form");
const refreshButton = document.getElementById("refresh-button");
const statusMessage = document.getElementById("status-message");
const openCount = document.getElementById("open-count");
const inProgressCount = document.getElementById("in-progress-count");
const readyCount = document.getElementById("ready-count");

const STATUS_LABELS = {
  new: "New",
  "in-progress": "In Progress",
  ready: "Ready",
  completed: "Completed",
};

const fetchOrders = async () => {
  const response = await fetch("/api/orders");
  const data = await response.json();
  renderOrders(data.orders || []);
};

const renderOrders = (orders) => {
  orderList.innerHTML = "";
  updateCounts(orders);

  if (orders.length === 0) {
    const empty = document.createElement("li");
    empty.className = "order-card";
    empty.textContent = "No orders yet. Add a walk-in order to get started.";
    orderList.appendChild(empty);
    return;
  }

  orders.forEach((order) => {
    const card = document.createElement("li");
    card.className = "order-card";

    const meta = document.createElement("div");
    meta.className = "order-meta";

    const title = document.createElement("strong");
    title.textContent = `Table ${order.table_number}`;

    const id = document.createElement("span");
    id.textContent = `Order #${order.id} • ${order.placed_at}`;

    const items = document.createElement("span");
    items.textContent = order.items;

    meta.appendChild(title);
    meta.appendChild(id);
    meta.appendChild(items);

    const tag = document.createElement("button");
    tag.className = `status-pill status-${order.status}`;
    tag.textContent = STATUS_LABELS[order.status] ?? order.status;
    tag.type = "button";
    tag.title = "Cycle status";

    tag.addEventListener("click", () => toggleStatus(order));

    card.appendChild(meta);
    card.appendChild(tag);
    orderList.appendChild(card);
  });
};

const setStatusMessage = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#c62828" : "";
};

const statusFlow = ["new", "in-progress", "ready", "completed"];

const getNextStatus = (current) => {
  const index = statusFlow.indexOf(current);
  return statusFlow[(index + 1) % statusFlow.length];
};

const updateCounts = (orders) => {
  const counts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    { new: 0, "in-progress": 0, ready: 0 }
  );
  openCount.textContent = counts.new;
  inProgressCount.textContent = counts["in-progress"];
  readyCount.textContent = counts.ready;
};

const toggleStatus = async (order) => {
  const nextStatus = getNextStatus(order.status);
  const response = await fetch(`/api/orders/${order.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!response.ok) {
    setStatusMessage("Unable to update order status.", true);
    return;
  }

  await fetchOrders();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const tableNumber = formData.get("table_number");
  const items = formData.get("items");
  const placedAt = formData.get("placed_at");

  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      table_number: tableNumber,
      items,
      placed_at: placedAt,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    setStatusMessage(data.error || "Unable to create order.", true);
    return;
  }

  form.reset();
  setStatusMessage("Order added! Tap a status pill to update.");
  await fetchOrders();
});

refreshButton.addEventListener("click", fetchOrders);

fetchOrders();
