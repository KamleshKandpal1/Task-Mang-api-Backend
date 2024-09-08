import mongoose, { isValidObjectId } from "mongoose";
import { task } from "../Models/task.model.js";
import { User } from "../Models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// create task
const createTask = asyncHandler(async (req, res) => {
  // Get task data
  const { title, desc } = req.body;
  console.log("title:", title, "desc:", desc);

  // Check for empty fields
  if ([title, desc].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Create task entry in the database
  const newTask = await task.create({
    title,
    desc,
  });

  // Check if task creation was successful
  if (!newTask) {
    throw new ApiError(500, "Something went wrong while creating the task");
  }

  // Add the new task to the user's task array
  const userId = req.user._id; // Assuming req.user contains the authenticated user's information
  await User.findByIdAndUpdate(userId, { $push: { task: newTask._id } });

  // Return response
  return res.status(201).json(new ApiResponse(201, newTask, "Task is created"));
});

// get all tasks
const getAllTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId");

  // find data from User modal
  const userData = await User.findById(userId)
    .populate({
      path: "task",
      options: { sort: { createdAt: -1 } },
    })
    .select("-password -refreshToken");

  if (!userData) {
    throw new ApiError(400, "User not found");
  }

  const tasks = userData.task;

  if (!tasks) {
    throw new ApiError(404, "Tasks not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { userData }, "Task founded"));
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // Get the task id from the URL parameters
  const { id } = req.params;

  // Log the received task id for debugging
  // console.log("Task ID:", id);

  if (!id) {
    throw new ApiError(400, "Invalid Task Id");
  }

  // Get the user ID from the JWT payload
  const userId = req.user?._id;

  // Log the userId for debugging
  // console.log("User ID:", userId);

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  // Delete the task by its ID
  const deletedTask = await task.findByIdAndDelete(id);

  // Check if the task was found and deleted
  if (!deletedTask) {
    throw new ApiError(404, "Task not found");
  }

  // Remove the task ID from the user's task array
  await User.findByIdAndUpdate(userId, {
    $pull: { task: id },
  });
  console.log("newTaskArray:", User);

  // Return the response
  return res.status(200).json(new ApiResponse(200, null, "Task is deleted"));
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  // Extract task ID from the request parameters
  const { id } = req.params;

  // Log the task ID for debugging purposes
  // console.log("Task ID:", id);

  // Check if task ID is provided
  if (!id) {
    throw new ApiError(400, "Invalid Task Id");
  }

  // Extract title and description from the request body
  const { title, desc } = req.body;

  // Ensure that at least one of the fields is provided
  // if (!title && !desc) {
  //   throw new ApiError(400, "At least one field (title or desc) is required");
  // }

  // Update task if the ID matches
  const updatedTask = await task.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(title && { title }), // Only set if title is provided
        ...(desc && { desc }), // Only set if desc is provided
      },
    },
    { new: true } // Return the updated document
  );

  // Check if the task was found and updated
  if (!updatedTask) {
    throw new ApiError(404, "Task not found");
  }

  // Return the response with updated task data
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task details are updated"));
});

// update important task
const updateImpTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // console.log("id:", id);
  if (!id) {
    throw new ApiError(400, "Invalaid Id");
  }

  const newTask = await task.findById(id);
  // console.log("data:", newTask);

  if (!newTask) {
    throw new ApiError(401, "Task not found");
  }

  const impTask = newTask.important;

  const newImpTask = await task.findByIdAndUpdate(
    id,
    {
      $set: {
        important: !impTask,
      },
    },
    { new: true }
  );
  if (!newImpTask) {
    throw new ApiError(409, "Important task status not changed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newImpTask, "Important task status is changed"));
});

// update important task
const updateCompTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the task by ID
  const taskToUpdate = await task.findById(id);
  if (!taskToUpdate) {
    throw new ApiError(401, "Task not found");
  }

  // Toggle the complete status
  const updatedTask = await task.findByIdAndUpdate(
    id,
    { complete: !taskToUpdate.complete },
    { new: true } // Ensures the updated document is returned
  );

  if (!updatedTask) {
    throw new ApiError(409, "Task status could not be updated");
  }

  // Respond with the updated task
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTask, "Task completion status updated"));
});

// get all important tasks
const getImpTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId");

  // find data from User modal
  const userData = await User.findById(userId).populate({
    path: "task",
    match: { important: true },
    options: { sort: { createdAt: -1 } },
  });

  if (!userData) {
    throw new ApiError(400, "User not found");
  }

  const impTasks = userData.task;

  if (!impTasks) {
    throw new ApiError(404, "Important Tasks not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, impTasks, "Important Tasks founded"));
});

// get all complete tasks
const getCompleteTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId");

  // find data from User modal
  const userData = await User.findById(userId).populate({
    path: "task",
    match: { complete: true },
    options: { sort: { createdAt: -1 } },
  });

  if (!userData) {
    throw new ApiError(400, "User not found");
  }

  const impTasks = userData.task;

  if (!impTasks) {
    throw new ApiError(404, "Complete Tasks not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, impTasks, "Complete Tasks founded"));
});

// get all Incomplete tasks
const getIncompleteTask = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid UserId");

  // find data from User modal
  const userData = await User.findById(userId).populate({
    path: "task",
    match: { complete: false },
    options: { sort: { createdAt: -1 } },
  });

  if (!userData) {
    throw new ApiError(400, "User not found");
  }

  const impTasks = userData.task;

  if (!impTasks) {
    throw new ApiError(404, "Incomplete Tasks not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, impTasks, "Incomplete Tasks founded"));
});

export {
  createTask,
  getAllTask,
  deleteTask,
  updateTask,
  updateImpTask,
  updateCompTask,
  getImpTask,
  getCompleteTask,
  getIncompleteTask,
};
