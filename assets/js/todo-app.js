"use strict";

/**
 * تطبيق قائمة المهام مع حفظ البيانات في localStorage
 * Features:
 * - إضافة/حذف/تحديث المهام
 * - حفظ تلقائي في localStorage
 * - تصفية المهام (الكل، قيد الإنجاز، مكتملة)
 * - إحصائيات وتقدم
 * - تصدير البيانات
 */

const TODO_CONFIG = {
  storageKey: "todo-tasks",
  storageVersion: "1.0",
  maxTasks: 1000,
};

class TodoApp {
  constructor() {
    this.tasks = [];
    this.currentFilter = "all";
    this.init();
  }

  /**
   * تهيئة التطبيق
   */
  init() {
    // التحقق من توفر localStorage
    if (!this.isLocalStorageAvailable()) {
      console.warn("⚠️ localStorage غير متاح. سيتم حفظ البيانات في الذاكرة فقط.");
    }

    // تحميل المهام من localStorage
    this.loadTasks();

    // ربط الأحداث
    this.bindEvents();

    // عرض المهام
    this.render();
  }

  /**
   * التحقق من توفر localStorage
   */
  isLocalStorageAvailable() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * تحميل المهام من localStorage
   */
  loadTasks() {
    try {
      if (!this.isLocalStorageAvailable()) {
        this.tasks = [];
        return;
      }

      const stored = localStorage.getItem(TODO_CONFIG.storageKey);

      if (stored) {
        this.tasks = JSON.parse(stored);
        console.log(`✅ تم تحميل ${this.tasks.length} مهمة من localStorage`);
      } else {
        this.tasks = [];
      }
    } catch (error) {
      console.error("❌ خطأ في تحميل المهام:", error);
      this.tasks = [];
    }
  }

  /**
   * حفظ المهام في localStorage
   */
  saveTasks() {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.warn("⚠️ لا يمكن حفظ - localStorage غير متاح");
        return;
      }

      localStorage.setItem(TODO_CONFIG.storageKey, JSON.stringify(this.tasks));
      console.log(`✅ تم حفظ ${this.tasks.length} مهمة`);
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("❌ localStorage ممتلئة - تم تجاوز الحد الأقصى");
        alert("المساحة المتاحة ممتلئة. يرجى حذف بعض المهام.");
      } else {
        console.error("❌ خطأ في حفظ المهام:", error);
      }
    }
  }

  /**
   * ربط الأحداث
   */
  bindEvents() {
    const taskInput = document.getElementById("taskInput");
    const addBtn = document.getElementById("addBtn");
    const clearBtn = document.getElementById("clearBtn");
    const resetBtn = document.getElementById("resetBtn");
    const exportBtn = document.getElementById("exportBtn");
    const filterBtns = document.querySelectorAll(".filter-btn");

    // إضافة مهمة
    addBtn.addEventListener("click", () => this.addTask());
    taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask();
    });

    // التصفية
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });

    // الأزرار الأخرى
    clearBtn.addEventListener("click", () => this.clearCompleted());
    resetBtn.addEventListener("click", () => this.resetAll());
    exportBtn.addEventListener("click", () => this.exportTasks());
  }

  /**
   * إضافة مهمة جديدة
   */
  addTask() {
    const taskInput = document.getElementById("taskInput");
    const taskText = taskInput.value.trim();

    if (!taskText) {
      alert("⚠️ يرجى إدخال مهمة");
      taskInput.focus();
      return;
    }

    if (this.tasks.length >= TODO_CONFIG.maxTasks) {
      alert(`❌ تم الوصول للحد الأقصى من المهام (${TODO_CONFIG.maxTasks})`);
      return;
    }

    const task = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
      priority: "medium",
    };

    this.tasks.unshift(task);
    this.saveTasks();
    taskInput.value = "";
    taskInput.focus();
    this.render();
    this.showNotification("✅ تمت إضافة المهمة");
  }

  /**
   * تحديث حالة المهمة (مكتملة/غير مكتملة)
   */
  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  }

  /**
   * حذف مهمة
   */
  deleteTask(id) {
    if (confirm("هل تريد حذف هذه المهمة؟")) {
      this.tasks = this.tasks.filter((t) => t.id !== id);
      this.saveTasks();
      this.render();
      this.showNotification("🗑️ تم حذف المهمة");
    }
  }

  /**
   * حذف جميع المهام المكتملة
   */
  clearCompleted() {
    const completedCount = this.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) {
      alert("✅ لا توجد مهام مكتملة");
      return;
    }

    if (confirm(`هل تريد حذف ${completedCount} مهمة مكتملة؟`)) {
      this.tasks = this.tasks.filter((t) => !t.completed);
      this.saveTasks();
      this.render();
      this.showNotification(`🗑️ تم حذف ${completedCount} مهمة`);
    }
  }

  /**
   * إعادة تعيين جميع المهام
   */
  resetAll() {
    if (this.tasks.length === 0) {
      alert("✅ قائمة المهام فارغة بالفعل");
      return;
    }

    if (confirm("⚠️ هل تريد حذف جميع المهام؟ لا يمكن التراجع عن هذا العمل!")) {
      this.tasks = [];
      this.saveTasks();
      this.render();
      this.showNotification("🔄 تم إعادة تعيين قائمة المهام");
    }
  }

  /**
   * تصدير المهام
   */
  exportTasks() {
    if (this.tasks.length === 0) {
      alert("✅ لا توجد مهام للتصدير");
      return;
    }

    const data = {
      exportedAt: new Date().toISOString(),
      version: TODO_CONFIG.storageVersion,
      tasks: this.tasks,
      stats: this.getStats(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todo-tasks-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showNotification("📥 تم تصدير المهام");
  }

  /**
   * الحصول على إحصائيات
   */
  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, active, percent };
  }

  /**
   * الحصول على المهام المصفاة
   */
  getFilteredTasks() {
    switch (this.currentFilter) {
      case "active":
        return this.tasks.filter((t) => !t.completed);
      case "completed":
        return this.tasks.filter((t) => t.completed);
      default:
        return this.tasks;
    }
  }

  /**
   * تنسيق التاريخ
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;

    return date.toLocaleDateString("ar-EG");
  }

  /**
   * عرض إشعار
   */
  showNotification(message) {
    // في التطبيقات الحقيقية، يمكن استخدام مكتبة تنبيهات
    console.log(message);
  }

  /**
   * تحديث العداد
   */
  updateCounts() {
    const stats = this.getStats();
    document.getElementById("total-tasks").textContent = stats.total;
    document.getElementById("completed-tasks").textContent = stats.completed;
    document.getElementById("progress-percent").textContent = stats.percent + "%";

    // تحديث عدادات الفلاتر
    document.getElementById("count-all").textContent = this.tasks.length;
    document.getElementById("count-active").textContent = this.tasks.filter(
      (t) => !t.completed
    ).length;
    document.getElementById("count-completed").textContent = this.tasks.filter(
      (t) => t.completed
    ).length;
  }

  /**
   * رسم/تحديث الواجهة
   */
  render() {
    const tasksList = document.getElementById("tasksList");
    const emptyState = document.getElementById("emptyState");
    const filteredTasks = this.getFilteredTasks();

    // مسح القائمة
    tasksList.innerHTML = "";

    if (filteredTasks.length === 0) {
      emptyState.style.display = "flex";
      tasksList.style.display = "none";
    } else {
      emptyState.style.display = "none";
      tasksList.style.display = "flex";

      filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = `task-item ${task.completed ? "completed" : ""}`;
        li.innerHTML = `
          <input
            type="checkbox"
            class="task-checkbox"
            ${task.completed ? "checked" : ""}
            aria-label="تحديد المهمة"
          />
          <span class="task-text">${this.escapeHtml(task.text)}</span>
          <div class="task-meta">
            <span class="task-date">${this.formatDate(task.createdAt)}</span>
            <span class="task-priority ${task.priority}">${this.getPriorityLabel(
              task.priority
            )}</span>
          </div>
          <div class="task-actions">
            <button class="task-btn delete" aria-label="حذف المهمة">🗑️</button>
          </div>
        `;

        // ربط أحداث المهمة
        const checkbox = li.querySelector(".task-checkbox");
        const deleteBtn = li.querySelector(".task-btn.delete");

        checkbox.addEventListener("change", () => this.toggleTask(task.id));
        deleteBtn.addEventListener("click", () => this.deleteTask(task.id));

        tasksList.appendChild(li);
      });
    }

    this.updateCounts();
  }

  /**
   * تنظيف HTML من الأحرف الخاصة
   */
  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * الحصول على تسمية الأولوية
   */
  getPriorityLabel(priority) {
    const labels = {
      high: "🔴 عالية",
      medium: "🟡 متوسطة",
      low: "🟢 منخفضة",
    };
    return labels[priority] || labels.medium;
  }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  window.todoApp = new TodoApp();
  console.log("✅ تم تحميل تطبيق قائمة المهام");
});

// منع فقدان البيانات عند إغلاق الصفحة
window.addEventListener("beforeunload", () => {
  if (window.todoApp) {
    window.todoApp.saveTasks();
  }
});