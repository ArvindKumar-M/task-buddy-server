const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');


// Route to create a task
router.post("/tasks", taskController.createTask);

// Route to delete a task
router.delete('/tasks/:taskId', taskController.deleteTask);

// Route to get a task with its history
router.get('/tasks/:taskId', taskController.getTaskWithHistory);

// Route to get all tasks categorized by status
router.get('/tasks', taskController.getAllTasks);

//Route to delete multiple tasks
router.post("/tasks/batch-delete", taskController.deleteTasksBatch);

// Route to mark multiple tasks as completed in batch
router.put('/tasks/batch-complete', taskController.batchMarkComplete);

// Route to update a task
router.put("/tasks/:taskId", taskController.updateTask);


module.exports = router;
