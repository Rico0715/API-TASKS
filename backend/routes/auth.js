const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;
const router = express.Router();
const mongoose = require("mongoose");

const adminKey = process.env.ADMIN_KEY;
function isValidEmail(email) {
 
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d).{5,}$/;
  return regex.test(password);
}
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function checkAdminKey(req, res, next) {
  const providedKey = req.header("Admin-Key");
  if (providedKey !== adminKey) {
    return res.status(403).send("WRONG ADMINKEY");
  }
  next();
}
// Inscription
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  // Email and Password Validation
  if (!isValidEmail(email)) {
    return res.status(400).send("Invalid email format.");
  }

  if (!isValidPassword(password)) {
    return res
      .status(400)
      .send(
        "Le mdp doit avoir 5 caractères différents et une majuscule"
      );
  }

  // Vérification si l'utilisateur existe déjà
  let user = await User.findOne({ email });
  if (user) return res.status(400).send("Email already exists.");
  
  user = new User({ name, email, password });


  await user.save();

  // Génération du token JWT

  const token = jwt.sign({ id: user.id }, jwtSecret, {
    expiresIn: "365d",
  });
  res.send({ token, userId: user.id });
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email)) {
      return res.status(400).send("Format d'email invalide");
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password.");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send("Invalid email or password.");

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: "365d",
    });
    res.send({ token, userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "erreur lors de la récupération des utilisateurs" });
  }
});
// Creation utilisateur
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
  }
});

// Récupère un user spécifique par son ID
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
  }
});
// Update user
router.put("/user/:id", checkAdminKey, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send("Invalid user ID.");
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    // Mettre à jour les champs s'ils sont fournis
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) {
      const hashedPassword = bcrypt.hashSync(req.body.password, 12);
      user.password = hashedPassword;
    }

    await user.save();
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

// Delete user
router.delete("/user/:id", checkAdminKey, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send("Invalid user ID.");
    }
    const user = await User.findByIdAndRemove(id);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.send({ message: "User deleted." });
  } catch (error) {
    console.error("Error detail:", error.message); 
    res.status(500).send("Server error.");
  }
});

module.exports = router;