require("dotenv").config();
const request = require("supertest");
const express = require("express");
const app = express();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/database");
const adminKey = process.env.ADMIN_KEY;
const appUrl = process.env.APP_URL || "http://localhost:6001";

// connecter à la base de données avant d'exécuter les tests.
beforeAll(async () => {
  await connectDB();
});

// connexion à la base de données après l'exécution de tous les tests.
afterAll(async () => {
  await mongoose.connection.close();
});


describe("Tasks routes", () => {
    let token1, token2, taskId, taskId2, userId1, userId2;
  
    beforeAll(async () => {
    
      const res1 = await request(appUrl).post("/register").send({
        name: "TasksTest3",
        email: "taskstest3@gmail.com",
        password: "AB12345CD",
      });
      token1 = res1.body.token;
      userId1 = res1.body.userId;
  
    
      const res2 = await request(appUrl).post("/register").send({
        name: "TasksTest4",
        email: "taskstest4@gmail.com",
        password: "AB12345CD",
      });
      token2 = res2.body.token;
      userId2 = res2.body.userId;
  
     
      const taskRes = await request(appUrl)
        .post("/tasks")
        .set("Authorization", `Bearer ${token2}`)
        .send({ body: "Task by user2", completed: true });
      taskId2 = taskRes.body._id; 
    }, 10000);
  
    afterAll(async () => {
      
      await request(appUrl)
        .delete(`/tasks/${taskId2}`)
        .set("Authorization", `Bearer ${token2}`)
        .send();
      await request(appUrl)
        .delete(`/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token1}`)
        .send();
  
      
      await request(appUrl)
        .delete(`/user/${userId1}`)
        .set("Admin-Key", adminKey)
        .send();
     
      await request(appUrl)
        .delete(`/user/${userId2}`)
        .set("Admin-Key", adminKey)
        .send();
      
    }, 10000);
  

  
    test("Enregistrement d'une nouvelle tache", async () => {
      
      const response = await request(appUrl)
        .post("/tasks")
        .set("Authorization", `Bearer ${token1}`)
        .send({ body: "Sample task" });
  
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id"); 
      expect(response.body).toHaveProperty("body", "Sample task");
      taskId = response.body._id; 
    });

    test("Taches par utilisateur", async () => {
    
    const response = await request(appUrl)
      .get("/tasks")
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
  
  test("Taches pas encore complétées", async () => {
    const response = await request(appUrl)
      .get("/tasks/pending")
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty("completed", false); 
  });

  test("Récupération d'une tache par son id", async () => {
    
    const response = await request(appUrl)
      .get(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("_id", taskId);
  });
  test("Tache non existante", async () => {
    
    const faketask = new mongoose.Types.ObjectId();
    const response = await request(appUrl)
      .get(`/tasks/${faketask}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(404);
  });

  test("Tache avec un ID invalide", async () => {
    const fakeIDobject = "fakeid";
    const response = await request(appUrl)
      .get(`/tasks/${fakeIDobject}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(400);
    
  });

  test("Récupérer une tache par un user non-autorisé", async () => {
    
    const response = await request(appUrl)
      .get(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(403);
    
  });
  test("Suppression d'une tache d'un autre user", async () => {
    
    const response = await request(appUrl)
      .delete(`/tasks/${taskId2}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(403);
  
  });
  test("Supression d'une tache", async () => {
    
    const response = await request(appUrl)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send();

    expect(response.status).toBe(200);
    
  });
  });