// Compiled JS for runtime (generated from app.ts)
"use strict";
const API_BASE = "//localhost:8000";
let state = {
    page: 1,
    pageSize: 10,
    total: 0,
    sortBy: "updatedAt",
    sortDir: "desc",
    filters: { search: "", status: "", priority: "", assignee: "" }
};
async function apiGet(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
async function apiPut(path, body) {
    const res = await fetch(API_BASE + path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
function elt(q) { return document.querySelector(q); }
function bindUI() {
    elt("#searchBox").addEventListener("input", () => { state.filters.search = elt("#searchBox").value; state.page = 1; load(); });
    elt("#statusFilter").addEventListener("change", () => { state.filters.status = elt("#statusFilter").value; state.page = 1; load(); });
    elt("#priorityFilter").addEventListener("change", () => { state.filters.priority = elt("#priorityFilter").value; state.page = 1; load(); });
    elt("#assigneeFilter").addEventListener("change", () => { state.filters.assignee = elt("#assigneeFilter").value; state.page = 1; load(); });
    elt("#pageSizeSelect").addEventListener("change", () => { state.pageSize = parseInt(elt("#pageSizeSelect").value); state.page = 1; load(); });
    elt("#prevPage").addEventListener("click", () => { if (state.page > 1) { state.page--; load(); } });
    elt("#nextPage").addEventListener("click", () => { const max = Math.ceil(state.total / state.pageSize); if (state.page < max) { state.page++; load(); } });
    elt("#createBtn").addEventListener("click", () => openModal());
    elt("#cancelBtn").addEventListener("click", closeModal());
    elt("#closeDrawer").addEventListener("click", closeDrawer());
    elt("#saveBtn").addEventListener("click", saveModal);
    document.querySelectorAll("#issuesTable th[data-field]").forEach(h => {
        h.addEventListener("click", () => {
            const f = h.dataset.field;
            if (state.sortBy === f)
                state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
            else {
                state.sortBy = f;
                state.sortDir = "asc";
            }
            load();
        });
    });
}
async function load() {
    const qp = new URLSearchParams();
    if (state.filters.search)
        qp.set("search", state.filters.search);
    if (state.filters.status)
        qp.set("status", state.filters.status);
    if (state.filters.priority)
        qp.set("priority", state.filters.priority);
    if (state.filters.assignee)
        qp.set("assignee", state.filters.assignee);
    qp.set("page", String(state.page));
    qp.set("pageSize", String(state.pageSize));
    qp.set("sortBy", state.sortBy);
    qp.set("sortDir", state.sortDir);
    const data = await apiGet("/issues?" + qp.toString());
    state.total = data.total;
    renderTable(data.issues || []);
    elt("#pageInfo").textContent = `Page ${data.page} / ${Math.max(1, Math.ceil(data.total / state.pageSize))} — ${data.total} items`;
    populateAssigneeFilter(data.issues || []);
}
function renderTable(issues) {
    const tbody = document.querySelector("#issuesTable tbody");
    tbody.innerHTML = "";
    for (const it of issues) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${it.id}</td>
      <td>${escapeHtml(it.title)}</td>
      <td>${it.status}</td>
      <td>${it.priority}</td>
      <td>${it.assignee || ""}</td>
      <td>${new Date(it.updatedAt).toLocaleString()}</td>
      <td><button class="edit-btn" data-id="${it.id}">Edit</button></td>
    `;
        tr.addEventListener("click", (ev) => {
            if (ev.target.closest(".edit-btn"))
                return;
            openDrawer(it);
        });
        tr.querySelector(".edit-btn").addEventListener("click", async (ev) => {
            ev.stopPropagation();
            openModal(it);
        });
        tbody.appendChild(tr);
    }
}
function populateAssigneeFilter(issues) {
    const sel = elt("#assigneeFilter");
    const assignees = Array.from(new Set(issues.map(i => i.assignee).filter(Boolean)));
    const existing = Array.from(sel.options).map(o => o.value);
    sel.innerHTML = "<option value=''>All assignees</option>" + assignees.map(a => `<option>${a}</option>`).join("");
    if (existing.includes(state.filters.assignee))
        sel.value = state.filters.assignee;
}
function openDrawer(issue) {
    elt("#drawer").classList.remove("hidden");
    elt("#drawerContent").textContent = JSON.stringify(issue, null, 2);
}
function closeDrawer() { elt("#drawer").classList.add("hidden"); }
function openModal(issue) {
    elt("#modal").classList.remove("hidden");
    if (issue) {
        elt("#modalTitle").textContent = "Edit Issue";
        elt("#m_title").value = issue.title;
        elt("#m_description").value = issue.description || "";
        elt("#m_status").value = issue.status;
        elt("#m_priority").value = issue.priority;
        elt("#m_assignee").value = issue.assignee || "";
        elt("#saveBtn").dataset["id"] = String(issue.id);
    }
    else {
        elt("#modalTitle").textContent = "Create Issue";
        elt("#m_title").value = "";
        elt("#m_description").value = "";
        elt("#m_status").value = "open";
        elt("#m_priority").value = "medium";
        elt("#m_assignee").value = "";
        delete elt("#saveBtn").dataset["id"];
    }
}
function closeModal() { elt("#modal").classList.add("hidden"); }
async function saveModal() {
    const title = elt("#m_title").value.trim();
    if (!title) { alert("Title required"); return; }
    const body = {
        title,
        description: elt("#m_description").value.trim() || undefined,
        status: elt("#m_status").value,
        priority: elt("#m_priority").value,
        assignee: elt("#m_assignee").value.trim() || undefined
    };
    const id = elt("#saveBtn").dataset["id"];
    try {
        if (id) {
            await apiPut(`/issues/${id}`, body);
        }
        else {
            await apiPost("/issues", body);
        }
        closeModal();
        load();
    }
    catch (err) {
        alert("Error: " + err);
    }
}
function escapeHtml(unsafe) { return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
document.addEventListener("DOMContentLoaded", () => {
    bindUI();
    load();
});