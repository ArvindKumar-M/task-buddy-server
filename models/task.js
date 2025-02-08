const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: {
      type: String,
      required: false,
      default: "No description provided",
    },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["todo", "inprogress", "completed"],
      required: true,
    },
    category: { type: String, enum: ["personal", "work"], required: true },
    file: { type: String, required: false, default: "" },

    history: {
      type: [
        {
          action: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
          status_details: { type: String, default: null },
          file_details: { type: String, default: null },
          general_details: { type: String, default: null }
        },
      ],
      default: function () {
        return [
          {
            action: "created",
            timestamp: new Date(),
            status_details: "Task created",
            file_details: "No file uploaded",
            general_details: "Task initialized",
          },
        ];
      },
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
