import { Router } from "express";
import {
  createTask,
  deleteTask,
  getAllTask,
  getCompleteTask,
  getImpTask,
  getIncompleteTask,
  updateCompTask,
  updateImpTask,
  updateTask,
} from "../controller/task.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
// post
router.route("/createtask").post(verifyJWT, createTask);
// get
router.route("/getAllTask/:c").get(verifyJWT, getAllTask);
router.route("/get-imp-task/:c").get(verifyJWT, getImpTask);
router.route("/get-comp-task/:c").get(verifyJWT, getCompleteTask);
router.route("/get-incomp-task/:c").get(verifyJWT, getIncompleteTask);
// delete
router.route("/deleteTask/:id").delete(verifyJWT, deleteTask);
// put
router.route("/updateTask/:id").put(verifyJWT, updateTask);
router.route("/update-imp-task/:id").put(verifyJWT, updateImpTask);
router.route("/update-complete-task/:id").put(verifyJWT, updateCompTask);
export default router;
