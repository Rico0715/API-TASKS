const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/taches");
require("dotenv").config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

// Middleware pour vérifier le JWT
router.use((req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).send("Access refusé.");

  const token = authHeader.replace("Bearer ", "");

  
  if (!token) return res.status(401).send("Access denied.");

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;
    next();
  } catch {
    res.status(400).send("token invalide");
  }
});

// Obtenir toutes les tâches de l'utilisateur
router.get("/", async (req, res) => {
  const tasks = await Task.find({ user_id: req.user.id }).sort({
    created_at: -1,
  });
  res.send(tasks);
});

// taches complétées 
router.get("/completed", async (req, res) => {
  try {
    const tasks = await Task.find({
      user_id: req.user.id,
      completed: true,
    }).sort({ created_at: -1 });
    res.send(tasks);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Récupérer les tâches en attente de l'utilisateur
router.get("/pending", async (req, res) => {
  try {
    const tasks = await Task.find({
      user_id: req.user.id,
      completed: false,
    }).sort({ created_at: -1 });
    res.send(tasks);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Ajouter une tâche
router.post("/", async (req, res) => {
  const task = new Task({
    ...req.body,
    user_id: req.user.id,
  });
  await task.save();
  res.send(task);
});

// Obtenir une seule tâche par son ID
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    res.send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Modifier une tâche
router.put("/:id", async (req, res) => {
  try {
    const updatedFields = { ...req.body, updated_at: Date.now() };

    const task = await Task.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true, 
      runValidators: true, 
    });

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    res.send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Supprimer une tâche
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).send("Task not found.");

    if (task.user_id.toString() !== req.user.id)
      return res.status(403).send("Access denied.");

    await Task.findByIdAndDelete(req.params.id);
    res.send({ message: "Task deleted." });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;
