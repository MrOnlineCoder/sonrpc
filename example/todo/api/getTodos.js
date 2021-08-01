const TodoService = require('../services/todoService');

module.exports = async () => {
    return TodoService.getTodos();
};