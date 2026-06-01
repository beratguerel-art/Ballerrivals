const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket"]
});

const db = new sqlite3.Database("./ballerrivals.db");

db.run(`
CREATE TABLE IF NOT EXISTS users(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT UNIQUE,
 password TEXT,
 spins INTEGER DEFAULT 100,
 pity INTEGER DEFAULT 0,
 style TEXT DEFAULT 'MÜLLER'
)
`);

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users(username,password) VALUES(?,?)",
    [username, hash],
    err => {
      if (err) {
        return res.status(400).json({
          error: "Username existiert bereits"
        });
      }

      res.json({
        success: true
      });
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=?",
    [username],
    async (err, user) => {
      if (!user) {
        return res.status(404).json({
          error: "Account nicht gefunden"
        });
      }

      const ok = await bcrypt.compare(
        password,
        user.password
      );

      if (!ok) {
        return res.status(401).json({
          error: "Passwort falsch"
        });
      }

      res.json({
        username: user.username,
        spins: user.spins,
        pity: user.pity,
        style: user.style
      });
    }
  );
});

app.post("/savePlayer", (req, res) => {
  const {
    username,
    spins,
    pity,
    style
  } = req.body;

  db.run(
    "UPDATE users SET spins=?, pity=?, style=? WHERE username=?",
    [spins, pity, style, username],
    () => {
      res.json({
        saved: true
      });
    }
  );
});

const rooms = {};

io.on("connection", socket => {

  console.log(`Spieler verbunden: ${socket.id}`);

  socket.on("createRoom", roomCode => {
    rooms[roomCode] = {
      players: [socket.id]
    };

    socket.join(roomCode);

    console.log(`Lobby ${roomCode} erstellt`);
  });

  socket.on("playerMove", data => {
    socket.to(data.roomCode).emit(
      "enemyMove",
      {
        x: data.x,
        z: data.z
      }
    );
  });

  socket.on("disconnect", () => {
    console.log(
      `Spieler getrennt: ${socket.id}`
    );
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(
    `Server läuft auf Port ${PORT}`
  );
});
