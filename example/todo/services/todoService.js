let todos = [];

const crypto = require('crypto');

const generateTodoId = () => crypto.randomBytes(8).toString('hex');

function addTodo(title) {
    const newTodo = {
        title,
        id: generateTodoId(),
        createdAt: new Date()
    };

    todos.push(newTodo);

    return newTodo;
}

function getTodos() {
    return todos;
}

function removeTodo(id) {
    todos = todos.filter(t => t.id != id);
}

function findTodoById(id) {
    return todos.find(t => t.id == id);
}

module.exports = {
    addTodo,
    getTodos,
    removeTodo,
    findTodoById
}