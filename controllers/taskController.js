const Task = require('../models/task');
const mongoose = require("mongoose");


// Create Task - Track history
const createTask = async (req, res) => {
    try {
        const { name, description, dueDate, status, category, file } = req.body;

        const newTask = new Task({
            name,
            description: description || "No description provided",
            dueDate,
            status,
            category,
            file: file || "",
            history: [
                {
                    action: "created",
                    timestamp: new Date(),
                    status_details: `You created task with status '${status}'`,
                    file_details: file ? `File uploaded: ${file}` : "No file uploaded",
                    general_details: `Task '${name}' initialized`,
                },
            ],
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: "Error creating task", error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { name, description, dueDate, status, category, file } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        let statusDetails = null;
        let fileDetails = null;

        // Track status change
        if (status && task.status !== status) {
            statusDetails = `You changed status from '${task.status}' to '${status}'`;
        }

        // Track file change
        if (file && task.file !== file) {
            fileDetails = `File updated from '${task.file}' to '${file}'`;
        }

        // Log history
        task.history.push({
            action: "updated",
            timestamp: new Date(),
            status_details: statusDetails,
            file_details: fileDetails,
            general_details: `Task '${task.name}' updated`,
        });

        // Update fields
        task.name = name || task.name;
        task.description = description !== undefined ? description : task.description;
        task.dueDate = dueDate || task.dueDate;
        task.status = status || task.status;
        task.category = category || task.category;
        task.file = file || task.file;

        await task.save();

        // ✅ Send grouped tasks after updating
        const allTasks = await Task.find(); // Fetch all tasks
        const groupedTasks = {
            todo: allTasks.filter((t) => t.status === "todo"),
            inprogress: allTasks.filter((t) => t.status === "inprogress"),
            completed: allTasks.filter((t) => t.status === "completed"),
        };

        res.status(200).json(groupedTasks);
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error: error.message });
    }
};



// Delete Task - Track history
const deleteTask = async (req, res) => {
    const { taskId } = req.params;

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Log before deletion
        await Task.findByIdAndUpdate(taskId, {
            $push: { history: { action: "deleted", timestamp: new Date(), details: `Task '${task.name}' deleted` } }
        });

        await Task.findByIdAndDelete(taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting task", error: err.message });
    }
};

const deleteTasksBatch = async (req, res) => {
    try {
        const { taskIds } = req.body; // Extract task IDs from request body

        if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: "Invalid task IDs provided" });
        }

        // Delete all tasks matching the provided IDs
        const result = await Task.deleteMany({ _id: { $in: taskIds } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No tasks found to delete" });
        }

        res.status(200).json({
            message: `${result.deletedCount} task(s) deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ message: "Error deleting tasks", error: error.message });
    }
};


// Get Task with History
const getTaskWithHistory = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        res.status(200).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Tasks
const getAllTasks = async (req, res) => {
    try {
        const searchQuery = req.query.search || ""; // Get search query from frontend

        let filter = {}; // Default: no filter

        // If searchQuery exists, apply regex search on name & description
        if (searchQuery) {
            filter = {
                $or: [
                    { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search
                    { description: { $regex: searchQuery, $options: "i" } }
                ]
            };
        }

        let tasks = await Task.find(filter); // Fetch filtered tasks

        // Categorize tasks by status
        const formattedTasks = {
            "todo": tasks.filter(task => task.status === "todo"),
            "inprogress": tasks.filter(task => task.status === "inprogress"),
            "completed": tasks.filter(task => task.status === "completed"),
        };

        res.status(200).json(formattedTasks);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving tasks", error: error.message });
    }
};

const batchMarkComplete = async (req, res) => {
    try {
        const { taskIds } = req.body;

        // Check if taskIds is an array
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ message: "Invalid taskIds array" });
        }

        // Update tasks
        await Task.updateMany(
            { _id: { $in: taskIds.map(id => new mongoose.Types.ObjectId(id)) } }, // Convert to ObjectId
            { $set: { status: "completed", updatedAt: new Date() } }
        );

        res.status(200).json({ message: "Tasks updated successfully", taskIds });
    } catch (error) {
        console.error("Batch update error:", error); // ✅ Debugging
        res.status(500).json({ message: "Error updating tasks", error: error.message });
    }
};



module.exports = { createTask, updateTask, deleteTask, getTaskWithHistory, getAllTasks,deleteTasksBatch, batchMarkComplete };
