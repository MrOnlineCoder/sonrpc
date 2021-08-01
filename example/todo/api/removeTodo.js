const TodoService = require('../services/todoService');

module.exports = async ({
    id
}) => {
    const todo = TodoService.findTodoById(id);

    if (!todo) throw new Error('Todo not found');

    TodoService.removeTodo(id);

    return true;
};