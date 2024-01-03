const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Room = require("./models/room.model");
const User = require("./models/user.model");
const userRoute = require("./routes/user.routes");

const { connectDb } = require("./config/database");

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const app = express();

app.use(cookieParser());

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/api/auth", userRoute);
app.use(express.static(__dirname + "/public"));

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

//settting the state

const usersState = {
  users: [],
  setUsers: function (newUserArray) {
    this.users = newUserArray;
  },
};

const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["http://192.168.1.18:8081"],
  },
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("enterRoom", async (data) => {
    const { name, room } = data;

    const prevRoom = await getUser(socket.id)?.room;

    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit(
        "message",
        buildMsg(ADMIN, `${name} has left the room`)
      );
    }
    console.log("before active user", name, room);
    const user = await activateUser(socket.id, name, room);

    // if (prevRoom) {
    //   io.to(prevRoom).emit("userList", {
    //     users: getUsersInRoom(prevRoom),
    //   });
    // }
    // join Room
    console.log(user);
    socket.join(user.room);

    //To user who joined

    socket.emit(
      "message",
      buildMsg(ADMIN, `you have joined the ${user.room} chat room`)
    );

    //to everyone else
    socket.broadcast
      .to(user.room)
      .emit(`message`, buildMsg(ADMIN, `${user.name} has joined the room`));

    //update the user list for room
    // io.to(user.room).emit("userList", {
    //   users: getUsersInRoom(user.room),
    // });

    //update the room list dfor everyone
    // io.emit("roomList", {
    //   rooms: getAllActiveRooms(),
    // });
  });

  socket.on("forcedisconnect", async () => {
    const user = await getUser(socket.id);
    await userLeavesApp(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        buildMsg(ADMIN, `${user.name} has left the room`)
      );

      socket.disconnect();
      console.log(`User ${socket.id} disconnected`);
    }
  });

  socket.on("message", async (data) => {
    console.log(data);

    console.log("im trogger");
    const { name, text } = data;
    try {
      const room = await getUser(socket.id);
      const roomValue = room != null ? room.room : undefined;
      console.log("the room value is", room != null ? room.room : undefined);

      if (roomValue) {
        io.to(roomValue).emit("message", buildMsg(name, text));
      } else {
        console.log("Room value is undefined");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  });

  socket.on("activity", async (name) => {
    // socket.broadcast.emit("activity", name);
    try {
      const room = await getUser(socket.id);

      const roomValue = room != null ? room.room : undefined;
      console.log("the room value is", room != null ? room.room : undefined);
      if (roomValue) {
        socket.broadcast.to(roomValue).emit("activity", name);
      }
    } catch (error) {
      console.log("fetching data issue");
    }
  });

  // Upon connection - only to user
  //   socket.emit("message", buildMsg(ADMIN, "Welcome to chat App!"));

  //   socket.on("enterRoom", (data) => {
  //     const { name, room } = data;
  //     console.log(name, room);
  //     //leave a previous romm
  //     const prevRoom = getUser(socket.id)?.room;

  //     if (prevRoom) {
  //       socket.leave(prevRoom);
  //       io.to(prevRoom).emit(
  //         "message",
  //         buildMsg(ADMIN, `${name} has left the room`)
  //       );
  //     }
  //     console.log("before active user", name, room);
  //     const user = activateUser(socket.id, name, room);

  //     if (prevRoom) {
  //       io.to(prevRoom).emit("userList", {
  //         users: getUsersInRoom(prevRoom),
  //       });
  //     }
  //     // join Room
  //     console.log(user);
  //     socket.join(user.room);

  //     //To user who joined

  //     socket.emit(
  //       "message",
  //       buildMsg(ADMIN, `you have joined the ${user.room} chat room`)
  //     );

  //     //to everyone else
  //     socket.broadcast
  //       .to(user.room)
  //       .emit(`message`, buildMsg(ADMIN, `${user.name} has joined the room`));

  //     //update the user list for room
  //     io.to(user.room).emit("userList", {
  //       users: getUsersInRoom(user.room),
  //     });

  //     //update the room list dfor everyone
  //     io.emit("roomList", {
  //       rooms: getAllActiveRooms(),
  //     });
  //   });

  //   // When user disconnects - to all others
  //   socket.on("disconnect", () => {
  //     const user = getUser(socket.id);
  //     userLeavesApp(socket.id);

  //     if (user) {
  //       io.to(user.room).emit(
  //         "message",
  //         buildMsg(ADMIN, `${user.name} has left the room`)
  //       );

  //       io.to(user.room).emit("userList", {
  //         users: getUsersInRoom(user.room),
  //       });

  //       io.emit("roomList", {
  //         rooms: getAllActiveRooms(),
  //       });
  //     }
  //     console.log(`User ${socket.id} disconnected`);
  //   });

  //   // Listening for a message event
  //   socket.on("message", (data) => {
  //     console.log("im trogger");
  //     const { name, text } = data;
  //     console.log(name, text);
  //     const room = getUser(socket.id)?.room;
  //     console.log(room);
  //     if (room) {
  //       io.to(room).emit("message", buildMsg(name, text));
  //     }
  //   });

  //   // Listen for activity
  //   socket.on("activity", (name) => {
  //     const room = getUser(socket.id)?.room;

  //     if (room) {
  //       socket.broadcast.to(room).emit("activity", name);
  //     }
  //   });
});

function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
}

//user Functions

async function activateUser(id, name, room) {
  const user = { id, name, room };
  console.log(id, name, room);
  try {
    const roomCreated = await Room.create({ id, name, room });
    return roomCreated.dataValues;
  } catch (error) {
    console.log(error);
  }
}

async function userLeavesApp(id) {
  const affectedRows = await Room.destroy({
    where: {
      id: id,
    },
  });

  if (affectedRows > 0) {
    console.log(`User with ID ${id} has been successfully removed.`);
  } else {
    console.log(`User with ID ${id} not found.`);
  }
  console.log(affectedRows);
  return affectedRows;
}

async function getUser(id) {
  console.log("userID", id);
  try {
    const user = await Room.findOne({
      where: {
        id: id,
      },
    });
    console.log("from the getuser", user != null ? user.dataValues : null);
    return user != null ? user.dataValues : null;
  } catch (error) {
    console.log(error);
  }
}

// function getUsersInRoom(room) {
//   return usersState.users.filter((user) => user.room === room);
// }

// function getAllActiveRooms() {
//   return Array.from(new Set(usersState.users.map((user) => user.room)));
// }
