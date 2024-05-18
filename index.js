// Importación de dependencias
require('dotenv').config();
const express = require("express");
const path = require('path');
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const agentes = require('./data/agentes.js');

const app = express();
const secretKey =  "yep";
const port = 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

// Conexión a servidor
app.listen(port, () => {
  console.log(`Servidor inicializado en puerto ${port}`);
});

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para Inicio de sesión
app.get("/SignIn", (req, res) => {
  const { email, password } = req.query;
  const user = agentes.results.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 120, // Expira en 2 minutos
        data: user,
      },
      secretKey
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agente Autenticado</title>
      </head>
      <body>
        <h1>Bienvenido, ${email}</h1>
        <p>Tu token ha sido guardado en SessionStorage y expira en 2 minutos.</p>
        <a href="/Secret?token=${token}"> <p>Ruta Restringida</p> </a>
        <script>
          sessionStorage.setItem('token', "${token}");
        </script>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error de Autenticación</title>
      </head>
      <body>
        <p>Usuario o clave incorrecta.</p>
        <a href="/"> <p>Ir a la página de Inicio</p> </a>
      </body>
      </html>
    `);
  }
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return res.status(401).send({
      error: "401 No Autorizado",
      message: "No se proporcionó un token"
    });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        error: "401 No Autorizado",
        message: "Token inválido o expirado"
      });
    }

    req.user = decoded.data;
    next();
  });
};

// Ruta restringida a usuarios registrados
app.get("/Secret", authenticateToken, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ruta Restringida</title>
    </head>
    <body>
      <h1>Bienvenido a la ruta restringida, ${req.user.email}</h1>
      <a href="/"> <p>Volver al Inicio</p> </a>
    </body>
    </html>
  `);
});
