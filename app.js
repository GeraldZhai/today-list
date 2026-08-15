const STORAGE_KEY = "today-list-tasks-v1";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const priorityInput = document.querySelector("#task-priority");
const categoryInput = document.querySelector("#task-category");
const dueDateInput = document.querySelector("#task-due-date");
const noteInput = document.querySelector("#task-note");
const taskList = document.querySelector("#task-list");
const template = document.querySelector("#task-template");
const formMessage = document.querySelector("#form-message");
const filterButtons = [...document.querySelectorAll(".filter-button")];

let activeFilter = "all";
let tasks = loadTasks();

const CATEGORY_LABELS = {
  study: "学习",
  work: "工作",
  life: "生活",
};

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return "未设置截止日期";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date(year, month - 1, day));
}

function priorityLabel(priority) {
  return { high: "高优先级", medium: "中优先级", low: "低优先级" }[priority];
}

function getCategory(category) {
  return Object.hasOwn(CATEGORY_LABELS, category) ? { code: category, label: CATEGORY_LABELS[category] } : null;
}

function getVisibleTasks() {
  const today = getLocalDateString();
  if (activeFilter === "open") return tasks.filter((task) => !task.completed);
  if (activeFilter === "today") return tasks.filter((task) => task.dueDate === today && !task.completed);
  if (activeFilter === "done") return tasks.filter((task) => task.completed);
  return tasks;
}

function renderStats() {
  const today = getLocalDateString();
  const completed = tasks.filter((task) => task.completed).length;
  const open = tasks.length - completed;
  const dueToday = tasks.filter((task) => task.dueDate === today && !task.completed).length;

  document.querySelector("#all-count").textContent = tasks.length;
  document.querySelector("#open-count").textContent = open;
  document.querySelector("#today-count").textContent = dueToday;
  document.querySelector("#progress-number").textContent = completed;
  document.querySelector("#list-summary").textContent = open ? `还有 ${open} 项待完成` : "今天的任务已清空";
}

function renderTasks() {
  taskList.innerHTML = "";
  const visibleTasks = getVisibleTasks();

  if (!visibleTasks.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = activeFilter === "all" ? "从上方添加第一项任务吧。" : "这个筛选条件下没有任务。";
    taskList.append(empty);
    return;
  }

  visibleTasks
    .sort((a, b) => Number(a.completed) - Number(b.completed) || b.createdAt.localeCompare(a.createdAt))
    .forEach((task) => {
      const item = template.content.firstElementChild.cloneNode(true);
      const checkbox = item.querySelector(".task-checkbox");
      const taskName = item.querySelector(".task-name");
      const taskMeta = item.querySelector(".task-meta");
      const taskNote = item.querySelector(".task-note");
      const deleteButton = item.querySelector(".delete-button");
      const category = getCategory(task.category);

      item.dataset.id = task.id;
      item.classList.toggle("is-complete", task.completed);
      checkbox.checked = task.completed;
      checkbox.setAttribute("aria-label", `标记“${task.title}”完成`);
      taskName.textContent = task.title;
      taskMeta.innerHTML = `<span class="priority priority-${task.priority}">${priorityLabel(task.priority)}</span>${category ? `<span class="category category-${category.code}">${category.label}</span>` : ""}${formatDate(task.dueDate)}`;
      taskNote.textContent = task.note || "";
      deleteButton.setAttribute("aria-label", `删除“${task.title}”`);

      checkbox.addEventListener("change", () => toggleTask(task.id));
      deleteButton.addEventListener("click", () => deleteTask(task.id));
      taskList.append(item);
    });
}

function render() {
  renderStats();
  renderTasks();
}

function addTask(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const note = noteInput.value.trim();

  if (!title) {
    formMessage.textContent = "请先填写任务名称。";
    titleInput.focus();
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority: priorityInput.value,
    category: getCategory(categoryInput.value)?.code || "",
    dueDate: dueDateInput.value,
    note,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  saveTasks();
  form.reset();
  formMessage.textContent = "任务已添加。";
  render();
  titleInput.focus();
}

function toggleTask(id) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
  saveTasks();
  render();
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task || !window.confirm(`确定删除“${task.title}”吗？`)) return;
  tasks = tasks.filter((item) => item.id !== id);
  saveTasks();
  render();
}

function setFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });
  renderTasks();
}

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

form.addEventListener("submit", addTask);
filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
render();
