const api = {
  async list() {
    const r = await fetch("/api/todos");
    if (!r.ok) throw new Error("Failed to load");
    return await r.json();
  },
  async create(text) {
    const r = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error("Failed to create");
    return await r.json();
  },
  async patch(id, data) {
    const r = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Failed to update");
    return await r.json();
  },
  async remove(id) {
    const r = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!r.ok && r.status !== 204) throw new Error("Failed to delete");
  },
};

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") el.className = v;
    else if (k === "checked") el.checked = !!v;   // ✅ новое: правильная установка галочки
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
    });
  });
  for (const c of children) {
    if (Array.isArray(c)) el.append(...c);
    else if (c instanceof Node) el.appendChild(c);
    else if (c != null) el.appendChild(document.createTextNode(String(c)));
  }
  return el;
}

function renderItem(item) {
  const checkbox = h("input", {
  type: "checkbox",
  checked: item.done,   // ✅ теперь передаём чистое булево
  onchange: async () => {
    const updated = await api.patch(item.id, { done: !item.done });
    li.replaceWith(renderItem(updated));
  },
});


  const text = h("span", { class: item.done ? "done" : "" }, item.text);

  const editBtn = h("button", { class: "ghost", onclick: async () => {
    const next = prompt("Изменить текст:", item.text);
    if (next == null) return;
    const updated = await api.patch(item.id, { text: next });
    li.replaceWith(renderItem(updated));
  } }, "✏️");

  const delBtn = h("button", { class: "danger", onclick: async () => {
    await api.remove(item.id);
    li.remove();
  } }, "🗑");

  const li = h("li", { class: "todo" },
    checkbox,
    text,
    h("div", { class: "spacer" }),
    editBtn,
    delBtn,
  );
  return li;
}

async function renderList() {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";
  const items = await api.list();
  list.append(...items.map(renderItem));
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("new-form");
  const input = document.getElementById("new-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const created = await api.create(text);
    document.getElementById("todo-list").prepend(renderItem(created));
    input.value = "";
    input.focus();
  });

  renderList();
});