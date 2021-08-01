const TodoService = require('../services/todoService');

module.exports = async ({
    title
}) => {
    return TodoService.addTodo(title);
};