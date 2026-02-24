// DOM Elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');

// Local storage key
const STORAGE_KEY = 'todoTasks';

// Initialize the app
function init() {
    loadTasks();
    addEventListeners();
}

// Add event listeners
function addEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
}

// Add a new task
function addTask() {
    const taskText = taskInput.value.trim();

    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false
    };

    // Create task element
    createTaskElement(task);

    // Save to storage
    saveTasks();

    // Clear input
    taskInput.value = '';
    taskInput.focus();

    // Update stats
    updateStats();
}

// Create task element in DOM
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-actions">
            <button class="edit-btn" aria-label="Edit task">✏️ Edit</button>
            <button class="delete-btn" aria-label="Delete task">🗑️ Delete</button>
        </div>
    `;

    // Add event listeners
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
        toggleTask(task.id);
    });

    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        startEditTask(li, task.id);
    });

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        deleteTask(task.id);
    });

    taskList.appendChild(li);
}

// Toggle task completion status
function toggleTask(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        task.completed = !task.completed;
        saveTasks();

        // Update UI
        const taskElement = document.querySelector(`[data-id="${taskId}"]`);
        taskElement.classList.toggle('completed');

        updateStats();
    }
}

// Delete a task
function deleteTask(taskId) {
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    
    // Add fade out animation
    taskElement.style.animation = 'none';
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        taskElement.remove();
        
        // Remove from storage
        let tasks = getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        
        updateStats();

        // Show empty state if no tasks
        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one to get started!</div>';
        }
    }, 300);
}

// Get tasks from storage
function getTasks() {
    const tasksJson = localStorage.getItem(STORAGE_KEY);
    return tasksJson ? JSON.parse(tasksJson) : [];
}

// Save tasks to storage
function saveTasks() {
    const tasks = getTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Load tasks from storage
function loadTasks() {
    const tasks = getTasks();

    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">No tasks yet. Add one to get started!</div>';
        updateStats();
        return;
    }

    taskList.innerHTML = '';
    tasks.forEach(task => {
        createTaskElement(task);
    });

    updateStats();
}

// Update task statistics
function updateStats() {
    const tasks = getTasks();
    const completedCount = tasks.filter(t => t.completed).length;

    totalTasksSpan.textContent = tasks.length;
    completedTasksSpan.textContent = completedCount;
}

// Start editing a task
function startEditTask(taskElement, taskId) {
    const taskText = taskElement.querySelector('.task-text');
    const taskActions = taskElement.querySelector('.task-actions');
    const currentText = taskText.textContent;

    // Create edit input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = currentText;

    // Create save and cancel buttons
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-btn';
    saveBtn.textContent = '💾 Save';
    saveBtn.addEventListener('click', () => {
        saveEditTask(taskElement, taskId, editInput.value);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        cancelEditTask(taskElement, currentText);
    });

    // Handle Enter key to save
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEditTask(taskElement, taskId, editInput.value);
        }
    });

    // Handle Escape key to cancel
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelEditTask(taskElement, currentText);
        }
    });

    // Hide original text and buttons
    taskText.style.display = 'none';
    taskActions.style.display = 'none';

    // Insert edit controls
    taskElement.insertBefore(editInput, taskActions);
    const newActionsDiv = document.createElement('div');
    newActionsDiv.className = 'task-actions';
    newActionsDiv.appendChild(saveBtn);
    newActionsDiv.appendChild(cancelBtn);
    taskElement.appendChild(newActionsDiv);

    // Focus the input
    editInput.focus();
    editInput.select();
}

// Save edited task
function saveEditTask(taskElement, taskId, newText) {
    const trimmedText = newText.trim();

    if (trimmedText === '') {
        alert('Task cannot be empty!');
        return;
    }

    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (task) {
        task.text = trimmedText;
        saveTasks();

        // Update UI
        const taskText = taskElement.querySelector('.task-text');
        taskText.textContent = trimmedText;
        taskText.style.display = 'block';

        const editInput = taskElement.querySelector('.task-edit-input');
        editInput.remove();

        const taskActions = taskElement.querySelectorAll('.task-actions');
        taskActions[1].remove();
        taskActions[0].style.display = 'flex';
    }
}

// Cancel editing a task
function cancelEditTask(taskElement, originalText) {
    const taskText = taskElement.querySelector('.task-text');
    taskText.style.display = 'block';

    const editInput = taskElement.querySelector('.task-edit-input');
    editInput.remove();

    const taskActions = taskElement.querySelectorAll('.task-actions');
    taskActions[1].remove();
    taskActions[0].style.display = 'flex';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initial render
renderTodos();
