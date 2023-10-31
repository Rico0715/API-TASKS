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


beforeAll(async () => {
  await connectDB();
});


afterAll(async () => {
  await mongoose.connection.close();
});

test("Enregistrement mauvais mdp", async () => {
    const response = await request(appUrl).post("/register").send({
      name: "User",
      email: "exemple.email@gmail.com",
      password: "123", 
    });

    

    expect(response.status).toBe(400);
    expect(response.text).toBe(
      "Le mdp doit avoir 5 caractères différents et une majuscule"
    );
  });
//ECRIRE UN NOUVEAU USER POUR TEST
  test("Enregistrement d'un nouvel utilisateur", async () => {
      const response = await request(appUrl).post("/register").send({
        
          name: "USERTEST",
          email: "emaieal.eexemple@gmail.com",
          password: "WebStart123",
      });
      userId = response.body.userId || null;
  
      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.userId).toBeDefined();
    });

  test("Utilisateur déja existant", async () => {
    const response = await request(appUrl).post("/register").send({
      
      name: "USERTEST",
      email: "email.exemple@gmail.com",
      password: "WebStart123",
    });

    expect(response.status).toBe(400);
  });
  test("Login incorrect", async () => {

    const response = await request(appUrl).post("/login").send({
      email: "monmail.mail@gmail.com",
      password: "x2",
    });

    expect(response.status).toBe(400);

    

  });


  test("Login correct ", async () => {
    const response = await request(appUrl).post("/login").send({
      email: "regis@gmail.com",
      password: "AB12345CD",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.userId).toBeDefined();
  });


  test("Connexion avec un mail au mauvais format", async () => {
    const response = await request(appUrl).post("/login").send({
      email: "fdsijhqkol",
      password: "WebStart123",
    });

    expect(response.status).toBe(400);
    expect(response.text).toBe("Format d'email invalide");
  });
  describe("USER", () => {
    let userId;
    const testUser = {
      name: "testeur",
      email: "jetestletest@gmail.com",
      password: "AB12345CD",
    };
    const ModifNom = "Modification du nom de l'utilisateur ";
  
    
    beforeAll(async () => {
      const response = await request(appUrl).post("/register").send(testUser);
      userId = response.body.userId || null;
    });
  
    
    afterAll(async () => {
      if (userId) {
        await request(appUrl)
          .delete(`/user/${userId}`)
          .set("Admin-Key", adminKey)
          .send();
      }
    });
    test("Modification d'un user par l'admin", async () => {
      const response = await request(appUrl)
        .put(`/user/${userId}`)
        .set("Admin-Key", adminKey)
        .send({
          name: ModifNom,
        });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(ModifNom);
    });

    test("Modification d'un user par un non-admin", async () => {
      const response = await request(appUrl)
        .put(`/user/${userId}`)
        .set("Admin-Key", "invalidKey")
        .send({
          name: ModifNom,
        });
  
      expect(response.status).toBe(403); 
    });

    test("Modification d'un utilisateur inconnu", async () => {
      const response = await request(appUrl)
        .put(`/user/654805387df6de7e79c97bde`) 
        .set("Admin-Key", adminKey)
        .send({
          name: ModifNom,
        });
  
      expect(response.status).toBe(404); 
    });

    test("Supression d'un user par l'admin", async () => {
      const response = await request(appUrl)
        .delete(`/user/${userId}`)
        .set("Admin-Key", adminKey)
        .send();
      if (response.status === 200) {
        userId = null;
      }
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User deleted.");
    });
    
    test("Supression d'un user par un non-admin", async () => {
      const response = await request(appUrl)
        .delete(`/user/${userId}`)
        .set("Admin-Key", "invalidKey")
        .send();
  
      expect(response.status).toBe(403); 
    });
    test("Supression d'un utilisateur inconnu", async () => {
      const response = await request(appUrl)
        .delete(`/user/60f4da2b3842a92fa8888888`) 
        .set("Admin-Key", adminKey)
        .send();
  
      expect(response.status).toBe(404);
    });
  
  
 });
  
