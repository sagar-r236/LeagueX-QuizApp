const express = require("express");
const sqllite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");

const db = new sqllite3.Database("./database.db");
const app = express();
const server = http.Server(app);
var cookie = require("cookie");
const { type } = require("os");

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:1234",
    methods: "*",
    allowedHeaders: "*",
    credentials: true,
  },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Middleware for cookies
app.use(cookieParser());

// Middleware to initialize session

//Cors
app.use(
  cors({
    origin: "http://localhost:1234", // Allow requests from this origin
    methods: "*", // Allow only specified methods
    allowedHeaders: "*", // Allow only specified headers
    credentials: true,
  })
);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS room_count (
      room_created_till_now INTEGER DEFAULT 2
    )
    `);

  db.run(
    `
    INSERT INTO room_count values (2);
    `
  );

  db.run(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id TEXT PRIMARY KEY,
        is_in_room  BOOLEAN DEFAULT FALSE
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        room_name TEXT PRIMARY KEY,
        slots_available INTEGER
      )
  `),
    (err) => {
      console.log(err);
    };

  db.run(`
    CREATE TABLE IF NOT EXISTS gameplay (
      client_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      status INTEGER,
      current_question INTEGER,
      number_of_answer_correct INTEGER,
      FOREIGN KEY (client_id) REFERENCES users(client_id) ON DELETE CASCADE,
      FOREIGn KEY (room_name) REFERENCES room_name(room_name) ON DELETE CASCADE
 
    )
  `),
    (err) => console.log(err);

  db.run(
    `
    CREATE table IF NOT EXISTS questions (
      question_number INTEGER,
      question TEXT,
      option1 TEXT,
      option2 TEXT,
      option3 TEXT,
      option4 TEXT,
      correct_answer TEXT
    );
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    INSERT into questions VALUES (
      1,
      'Which country did India score their lowest total against in the history of the ODI World Cup',
      'West Indies',
      'New Zealand',
      'Australia',
      'England',
      'Australia'
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into questions VALUES (
      2,
      'Who was the wicket-keeper of the Indian Cricket Team during the World Cup 2003 tournament',
      'MS Dhoni',
      'Parthiv Patel',
      'Rahul Dravid',
      'Nayan Mongia',
      'Rahul Dravid'
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into questions VALUES (
      3,
      'How many runs did India make in its historic World Cup win over West Indies in 1983',
      '183',
      '175',
      '233',
      '179',
      '183'
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into questions VALUES (
      4,
      'Who was the highest wicket-taker for India at the 2015 ODI World Cup',
      'Umesh Yadav',
      'Mohit Sharma',
      'Md Shami',
      'Ravindra Jadeja',
      'Umesh Yadav'
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into questions VALUES (
      5,
      'Who won 2023 ICC Mens World Cup',
      'India',
      'Australia',
      'New Zealand',
      'South Africa',
      'Australia'
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into rooms values ('room1', 2);
      )
    `
  ),
    (err) => console.log(err);

  db.run(
    `
    insert into rooms values ('room2', 2);
      )
    `
  ),
    (err) => console.log(err);
});

app.get("/lobby-data", (req, res) => {
  db.all("SELECT room_name, slots_available FROM room", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(rows);
    res.json({ rooms: rows }); // Send the room data as JSON response
  });
});

io.on("connection", (socket) => {
  console.log("New connection established to socket");
  console.log(socket.id);


  socket.on('isin-room', () => {
    console.log('enterd isin-room socket');
    db.all(`select is_in_room as isInRoom from clients where client_id = ? `, [socket.id], (err, rows) => {
      if (err) {
        console.log(err);
      }
      else {
        let {isInRoom} = rows[0];
        if (isInRoom == 0) {
          isInRoom = false;
        } else {
          isInRoom = true
        }
        io.to(socket.id).emit('isin-room-server', isInRoom)
      }
    })
  })

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("get-result", () => {
    console.log("entering get-result function");
    db.all(
      "SELECT room_name as roomName, number_of_answer_correct as answersCorrect FROM gameplay where client_id = ?",
      [socket.id],
      (err, rows) => {
        if (err) {
          console.log(err);
        } else {
          let { roomName, answersCorrect } = rows[0];
          console.log("fetching result of the openent");
          db.all(
            "SELECT number_of_answer_correct as openentCorrectAnswer FROM gameplay where client_id != ? and room_name = ?",
            [socket.id, roomName],
            (err, rows) => {
              if (err) {
                console.log(err);
              } else {
                let { openentCorrectAnswer } = rows[0];
                if (answersCorrect > openentCorrectAnswer) {
                  console.log(answersCorrect, openentCorrectAnswer, 225);
                  console.log("sending answers 223");
                  let data = {
                    result: "You Won !",
                    numberOfAnswerCorrect: answersCorrect,
                  };
                  console.log(data);
                  io.to(socket.id).emit("results", data);
                  console.log('deleting the room');
                  db.run('delete from rooms where room_name=?', [roomName]);
                } else if (answersCorrect == openentCorrectAnswer) {
                  console.log(answersCorrect, openentCorrectAnswer, 225);
                  let data = {
                    result: "Match draw!",
                    numberOfAnswerCorrect: answersCorrect,
                  };
                  console.log(data, 230);
                  io.to(socket.id).emit("results", data);
                  console.log('deleting the room');
                  db.run('delete from rooms where room_name=?', [roomName]);
                } else {
                  console.log(answersCorrect, openentCorrectAnswer, 225);
                  let data = {
                    result: "You lost :(",
                    numberOfAnswerCorrect: answersCorrect,
                  };
                  io.to(socket.id).emit("results", data);
                  console.log('deleting the room');
                  db.run('delete from rooms where room_name=?', [roomName]);
                }
              }
            }
          );

        }
      }
    );
  });

  socket.on("selected-answer", (questionNumber, answer) => {
    console.log("entered selected answer");

    db.all(
      "SELECT correct_answer as correct_answer from questions where question_number = ?",
      [questionNumber],
      (err, rows) => {
        console.log("Entered to check correct answer");
        if (err) {
          console.log(err);
        } else {
          let { correct_answer } = rows[0];
          if (answer == correct_answer) {
            db.all(
              "SELECT number_of_answer_correct as number_of_answer_correct from gameplay where client_id = ?",
              [socket.id],
              (err, rows) => {
                console.log("incrementing count if the answer is correct");
                let { number_of_answer_correct } = rows[0];
                number_of_answer_correct += 1;
                db.run(
                  "UPDATE gameplay set number_of_answer_correct=? where client_id=? ",
                  [number_of_answer_correct, socket.id],
                  (err) => console.log(err)
                );
              }
            );
          }
        }
      }
    );
  });

  db.run(`INSERT INTO clients (client_id) VALUES (?)`, [socket.id], (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Socket ID saved to the database");
    }
  });

  function lobbyData() {
    console.log("entered into requestLobbyData function");

    db.all(
      "SELECT SUM(slots_available) as slotsAvailable  from rooms",
      [],
      (err, rows) => {
        if (err) {
          console.log(err);
        } else {
          let { slotsAvailable } = rows[0];
          if (slotsAvailable < 2) {
            db.all(
              "SELECT room_created_till_now as roomCreatedTillNow from room_count",
              [],
              (err, rows) => {
                if (err) {
                  console.log(err);
                } else {
                  let { roomCreatedTillNow } = rows[0];
                  db.run(
                    "INSERT INTO rooms values (?,?)",
                    ["room" + (roomCreatedTillNow + 1), 2],
                    (err) => console.log(err)
                  );
                  db.run("UPDATE room_count SET room_created_till_now = ?", [
                    roomCreatedTillNow + 2,
                  ]);

                  db.all(
                    "SELECT room_name, slots_available FROM rooms",
                    [],
                    (err, rows) => {
                      if (err) {
                        socket.emit("lobbyDataError", { error: err.message });
                      }
                      socket.emit("lobbyData", { rooms: rows }); // Send the room data as JSON response
                    }
                  );
                  console.log("exiting requestLobbyData function");
                }
              }
            );
          } else {
            db.all(
              "SELECT room_name, slots_available FROM rooms",
              [],
              (err, rows) => {
                if (err) {
                  socket.emit("lobbyDataError", { error: err.message });
                }
                socket.emit("lobbyData", { rooms: rows }); // Send the room data as JSON response
              }
            );
            console.log("exiting requestLobbyData function");
          }
        }
      }
    );

    // db.all("SELECT room_name, slots_available FROM rooms", [], (err, rows) => {
    //   if (err) {
    //     socket.emit("lobbyDataError", { error: err.message });
    //   }
    //   socket.emit("lobbyData", { rooms: rows }); // Send the room data as JSON response
    // });
    // console.log("exiting requestLobbyData function");
  }

  socket.on("requestLobbyData", lobbyData);

  socket.on("get-question", (questionNumber) => {
    //entering get-qeustion in socket
    console.log("entering get-question");

    //find the room which the socket is in
    db.all(
      `SELECT room_name as room_name FROM gameplay where client_id = ?`,
      [socket.id],
      (err, rows) => {
        console.log("entering to find the client room name");
        if (err) {
          console.log(err);
        } else {
          console.log(rows);
          db.all(
            `SELECT * FROM questions where question_number=?`,
            [questionNumber],
            (err, rows) => {
              console.log("entering to emit the question");
              if (err) {
                console.log(err);
              } else {
                console.log(rows, 236);
                io.to(socket.id).emit("take-question", { question: rows[0] });
              }
            }
          );
        }
      }
    );
  });

  socket.on("join-room", (id) => {
    console.log("entered join-room");

    //decrement the slot to minus 1
    console.log("decrement the slot to minus one room table");
    db.all(`SELECT * FROM rooms where room_name=?`, [id], (err, rows) => {
      if (err) {
        console.log(err);
      } else {
        let { room_name, slots_available } = rows[0];
        slots_available -= 1;

        //update the slots in the room
        console.log("update the slots_available in rooms");
        db.run(
          `UPDATE rooms SET slots_available=? where room_name=?`,
          [slots_available, room_name],
          (err, rows) => {
            if (err) {
              console.log(err);
            } else {
              db.all(
                "SELECT room_name, slots_available FROM rooms",
                [],
                (err, rows) => {
                  if (err) {
                    console.log(err);
                  } else {
                    io.emit("broadcast-lobby-data-after-update", {
                      rooms: rows,
                    });
                  }
                }
              );
            }
          }
        );

        //update client room is_in_room to true
        console.log("update the client is_in_room to true");
        db.run(`UPDATE clients SET is_in_room=TRUE WHERE client_id=?`, [
          socket.id,
        ]);

        //insert the new joined client to the gameplay
        console.log("insert the new joined client to the gameplay");
        db.run(
          `INSERT INTO gameplay (client_id, room_name, status, current_question, number_of_answer_correct) values (?,?,?,?,?)`,
          [socket.id, id, 0, 0, 0],
          (err) => {
            console.log(err);
          }
        );

        //socket joining the room
        console.log("socket joined the room");
        socket.join(id);

        //select statment
        console.log("entering function to send status");
        db.all(
          `SELECT count(*) as room_count FROM gameplay where room_name=?`,
          [id],
          (err, rows) => {
            if (err) {
              console.log(err);
            } else {
              let { room_count } = rows[0];
              if (room_count < 2) {
                console.log(room_count);
                io.to(id).emit("room-status", `Waiting for other to join`);
              } else {
                io.to(id).emit("room-status", `Game begins in`);
              }
            }
          }
        );
      }
    });

    console.log("exiting join-room");
  });
});

server.listen(3000, () => console.log("Server started"));
