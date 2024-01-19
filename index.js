const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const Room = require("./models/room.model");
const User = require("./models/user.model");
const userRoute = require("./routes/user.routes");
const MessageRouter = require("./routes/message.routes");
const roomIdRoute = require("./routes/roomIds.routes");
const ChatLists = require("./models/chatlist.model");
const Roomlist = require("./models/roomlist.model");

const Messages = require("./models/message.models");

const RoomList = require("./models/roomlist.model");
const RoomIds = require("./models/roomId.model");
const ActiveUsers = require("./models/activeusers.model");

const { connectDb } = require("./config/database");

const PORT = process.env.PORT || 3500;
const ADMIN = "Admin";

const app = express();

app.use(cookieParser());

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use("/api/auth", userRoute);
app.use("/api/room", roomIdRoute);
app.use("/api/msg", MessageRouter);
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

const userSocketMap = [];

const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? false
        : ["http://192.168.1.26:8081"],
  },
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("enterRoom", async (data) => {
    const { name, room, id } = data;

    let prevRoom = await getUser(id);
    console.log("previouse room", prevRoom);
    if (prevRoom.room) {
      socket.leave(prevRoom.room);
      io.to(prevRoom).emit(
        "message",
        buildMsg(ADMIN, `${name} has left the room`)
      );
    }
    console.log("before active user", name, room);
    const user = await activateUser(id, name, room);
    console.log("activate", user);
    // try {
    //   const roomlistadded = await addRoomNameToList(name, room);
    //   console.log(roomlistadded);
    // } catch (error) {
    //   console.log(error);
    // }

    // if (prevRoom) {
    //   io.to(prevRoom).emit("userList", {
    //     users: getUsersInRoom(prevRoom),
    //   });
    // }
    // join Room
    console.log("user of the user", user);

    socket.join(user.room);
    userSocketMap[user._id] = { socket_id: socket.id, room: user.room };

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
      socket.leave();
      // socket.disconnect();
      console.log(`User ${socket.id} disconnected`);
    }
  });

  socket.on("message", async (data) => {
    console.log(data);

    console.log("im trogger");
    const { name, text, id, room, reciever } = data;

    console.log(name, text, id, room, reciever);
    try {
      const rooms = await getUser(id);
      const receiverroom = await getUser(reciever);
      console.log(rooms);
      console.log(receiverroom.room);

      const sendeRoomname = rooms.name;
      const recieverRoomname = receiverroom.name;
      const roomValue = rooms != null ? rooms.room : undefined;
      console.log("the room value is of the user", roomValue);
      console.log("the room value he is in", room);

      if (receiverroom.room == room) {
        io.to(roomValue).emit("message", buildMsg(name, text));
        await addDataToRoomlist({
          chatID: room,
          senderid: id,
          recieverID: reciever,
          Roomname: sendeRoomname,
        });

        await addDataToRoomlist({
          chatID: room,
          senderid: reciever,
          recieverID: id,
          Roomname: recieverRoomname,
        });

        await addMessageToDB({
          chatID: room,
          userId: id,
          Messages: [
            {
              message: text,
              sender: id,
              reciever: reciever,
              read: recieverRoomname == room ? true : false,
            },
          ],
        });
        console.log("the room value he is in the get room list", room);
        // socket.emit("getRoomList", {
        //   senderId: reciever,
        //   room: room,
        // });
        // socket.emit("getRoomList", {
        //   senderId: reciever,
        // });
      } else if (receiverroom.room != room) {
        io.to(roomValue).emit("message", buildMsg(name, text));
        await addDataToRoomlist({
          chatID: room,
          senderid: id,
          recieverID: reciever,
          Roomname: sendeRoomname,
        });

        await addDataToRoomlist({
          chatID: room,
          senderid: reciever,
          recieverID: id,
          Roomname: recieverRoomname,
        });
        await addMessageToDB({
          chatID: room,
          userId: id,
          Messages: [
            {
              message: text,
              sender: id,
              reciever: reciever,
              read: false,
            },
          ],
        });

        console.log("message send to the reciever");
        console.log(reciever, room);
        // socket.emit("getRoomList", {
        //   senderId: reciever,
        //   room: room,
        // });
      } else {
        console.log("Room value is undefined");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  });

  socket.on("getRoomList", async (data) => {
    console.log("my name is ", data);
    const { senderId, room } = data;
    console.log("hello im hte rommName", room);
    console.log("hello im hte rommName", data.room);
    try {
      console.log("getRoom list is called");

      const connectedSocketsMap = io.of("/").sockets;

      console.log(connectedSocketsMap);

      const roomSocketIds = Array.from(
        io.sockets.adapter.rooms.get(room) || []
      );
      console.log(io.sockets.adapter.rooms);
      console.log("roomIDs", roomSocketIds);
      console.log(connectedSocketsMap.keys());
      const usersNotInRoom = Array.from(connectedSocketsMap.keys()).filter(
        (socketId) => !roomSocketIds.includes(socketId)
      );
      // const RoomList = await getRoomList(name);
      if (roomSocketIds.length <= 1) {
        const data = {
          id: roomSocketIds,
        };
        const userNotinRoom = await getSocketIdOfuserNotinRoom(data);
        console.log(userNotinRoom, "it is the value who is not in the room");
        io.to(userNotinRoom).emit("getRoomList", "Your message here");
      }
      console.log(userSocketMap);
      console.log(usersNotInRoom);
      // roomSocketIds.forEach((socketId) => {
      //   io.to(userNotinRoom).emit("getRoomList", "Your message here");
      // });

      // io.to(name).emit("getRoomList", RoomList);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("activity", async (data) => {
    // socket.broadcast.emit("activity", name);
    try {
      const { name, id } = data;
      console.log(name, id, "my value while typing!!");
      console.log("my value ", name, id);
      const room = await getUser(id);

      const roomValue = room != null ? room.room : undefined;
      console.log("the room value is", room != null ? room.room : undefined);
      if (roomValue) {
        socket.broadcast.to(roomValue).emit("activity", name);
      }
    } catch (error) {
      console.log("fetching data issue");
    }
  });

  socket.on("roolistEvent", async () => {
    console.log("you are not in the room!!!");
  });

  socket.on("addSocketId", async (data) => {
    console.log("enter room data", data);
    const { id } = data;
    const socket_id = socket.id;
    try {
      const body = {
        id: id,
        socketid: socket_id,
      };
      console.log(body);
      const response = await addSocketId(body);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("leaveRoom", (data) => {
    console.log(data);
    const { id, room } = data;
    if (id) {
      socket.leave(room);
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

//while sending the message the message
/**
 * The message needs to be addded to the room list of the 
    of the both user and reciever and room name should be dynamic
 
 * The message needs to be added to the message list for the both of them
    with their id and chat id with the object
 */

async function getSocketIdOfuserNotinRoom(data) {
  console.log("data from getSocketIdOfuserNotinRoom", data.id[0]);

  /**
   * find the user room using the socket id
   * there  will be 2 users using the room
   * need to send message only to the user who is not in the
   * whose list is
   */
  const getRoomname = await User.findAll({
    where: {
      socketId: data.id[0],
    },
    returning: true,
    plain: true,
  });

  console.log("userRoom from the based on the socket id", getRoomname);
  if (getRoomname) {
    // Access the "room" value
    const roomValue = getRoomname.dataValues.room;
    console.log("Room Value:", roomValue);
    const getUsersofRoom = await RoomList.findAll({
      where: {
        chatID: roomValue,
      },
      returning: true,
      plain: true,
    });
    console.log(
      "getUsersofRoom from the based on the socket id",
      getUsersofRoom.dataValues
    );
    const userinRoom = getRoomname.dataValues._id;
    const { senderid, recieverID } = getUsersofRoom.dataValues;
    console.log(userinRoom, senderid, recieverID);
    if (userinRoom == senderid) {
      const getSocketid = await User.findAll({
        where: {
          _id: recieverID,
        },
        returning: true,
        plain: true,
      });
      return getSocketid.dataValues.socketId;
    } else {
      const getSocketid = await User.findAll({
        where: {
          _id: senderid,
        },
        returning: true,
        plain: true,
      });
      return getSocketid.dataValues.socketId;
    }
  } else {
    console.log("User not found");
  }
}

async function addDataToRoomlist(data) {
  //need chatid,uuid,recieverid,roomname to add to the table
  /**
   * Roomname is determined by the user id given
   */
  console.log(data);

  const isDataAlreadyPresent = await Roomlist.findAll({
    where: {
      chatID: data.chatID,
    },
  });

  console.log(isDataAlreadyPresent.length, "my datas hello");

  if (isDataAlreadyPresent.length < 2) {
    try {
      const response = await Roomlist.create(data);
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
    }
  }
  if (isDataAlreadyPresent.length == 2) {
    try {
      await Roomlist.update(
        { updatedAt: new Date() },
        { where: { chatID: data.chatID } }
      );

      console.log("Timestamp updated successfully.");
    } catch (error) {
      console.error("Error updating timestamp:", error);
    }
  }
}

//Send Messagae to the user and reciever

/**
 * when user hit the send button it the message should be stored
   in the database chatId userId Message 
 */

async function addMessageToDB(data) {
  console.log("message to ", data);
  const isMessageRowCreated = await Messages.findAll({
    where: {
      chatID: data.chatID,
      userId: data.userId,
    },
  });
  console.log(data);
  console.log(isMessageRowCreated.length);
  if (isMessageRowCreated.length < 1) {
    try {
      const response = await Messages.create({
        chatID: data.chatID,
        userId: data.userId,
        Messages: data.messages,
      });
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  } else if (isMessageRowCreated.length == 1) {
    try {
      console.log(data.Messages);
      const result = await Messages.update(
        {
          messages: Sequelize.fn(
            "array_append",
            Sequelize.literal(
              'COALESCE("Messages"."Messages", \'{}\'::jsonb[])'
            ),
            Sequelize.literal(`'${JSON.stringify(data.Messages)}'::jsonb`)
          ),
        },
        {
          where: {
            chatID: data.chatID,
            userId: data.userId,
          },
          returning: true,
          plain: true,
        }
      );

      console.log("Message added to the array:", result[0]);
    } catch (error) {
      console.error("Error adding message to the array:", error);
    }
  }
}

//Room functions
async function addRoomList(data) {
  console.log(data);
}

//Room functions

async function addRoomNameToList(name, room) {
  try {
    // Check if a record with the given name exists
    console.log(name, room);
    const existingRoomList = await RoomList.findOne({ where: { name } });
    console.log(existingRoomList);
    if (existingRoomList) {
      // If the record exists, update the roomname array by adding the new room value
      const updatedRoomList = await existingRoomList.update({
        room: [...existingRoomList.room, room],
      });

      console.log(updatedRoomList);
    } else {
      // If the record doesn't exist, create a new one with the given name and room
      console.log("the value is null so im here", name, room);
      // const newRoomList = await RoomList.create({ name, room: [room] });
      // console.log(newRoomList);
    }
  } catch (error) {
    console.error(error);
  }
}

//Remove the user room from the userID

async function removeUserRoomname(data) {
  console.log(data);
  await User.update(
    { room: null }, // Set the column value to null or any other desired value
    { where: { _id: data.id } } // Replace 'id' with the primary key of your table
  )
    .then((result) => {
      console.log(`${result[0]} row(s) updated.`);
    })
    .catch((error) => {
      console.error("Error updating row:", error);
    });
}

//add avtive users

async function addUsernameToRooms(name, room) {
  try {
    // Check if a record with the given name exists
    const existingRoomList = await ActiveUsers.findOne({ where: { room } });

    if (existingRoomList) {
      // If the record exists, update the roomname array by adding the new room value
      const updatedRoomList = await ActiveUsers.update({
        activeUsers: [...existingRoomList.activeUsers, name],
      });

      console.log(updatedRoomList);
    } else {
      // If the record doesn't exist, create a new one with the given name and room
      const newRoomList = await ActiveUsers.create({
        room,
        activeUsers: [name],
      });
      console.log(newRoomList);
    }
  } catch (error) {
    console.error(error);
  }
}

//getRoomlist
// async function getRoomList(name) {
//   console.log(name);
//   try {
//     const RoomLists = await RoomList.findAll({
//       where: {
//         senderid: name.senderId,
//       },
//     });
//     console.log(RoomLists);
//     return RoomLists;
//   } catch (error) {
//     console.log(error);
//   }
// }

//getActiveusers

async function getUserList(room) {
  try {
    const activeUsers = await ActiveUsers.findAll({ where: { room } });
    console.log(activeUsers);
  } catch (error) {
    console.log(error);
  }
}

//add sockets
async function addSocketId(data) {
  const { id, socketid } = data;
  try {
    const [numberOfAffectedRows, updatedRows] = await User.update(
      { socketId: socketid },
      { where: { _id: id }, returning: true }
    );

    const response = await User.update(
      { socketId: socketid },
      { where: { _id: id } }
    );

    console.log("respose from updatui", response);

    if (numberOfAffectedRows > 0) {
      console.log(`Room updated successfully for user with ID ${id}`);
      const updatedUser = updatedRows[0].dataValues;
      console.log(updatedUser);
      return updatedUser; // Returns the updated user data
    } else {
      console.log(`User with ID ${id} not found`);
      return null; // Indicates that the user was not found
    }
  } catch (error) {
    console.log(error);
  }
}

//user Functions

async function activateUser(id, name, room) {
  // const user = { id, name, room };
  // console.log(id, name, room);
  // try {
  //   const roomCreated = await Room.create({ id, name, room });
  //   return roomCreated.dataValues;
  // } catch (error) {
  //   console.log(error);
  // }

  try {
    const [numberOfAffectedRows, updatedRows] = await User.update(
      { room: room },
      { where: { _id: id }, returning: true }
    );

    const response = await User.update({ room: room }, { where: { _id: id } });

    console.log("respose from updatui", response);

    if (numberOfAffectedRows > 0) {
      console.log(`Room updated successfully for user with ID ${id}`);
      const updatedUser = updatedRows[0].dataValues;
      console.log(updatedUser);
      return updatedUser; // Returns the updated user data
    } else {
      console.log(`User with ID ${id} not found`);
      return null; // Indicates that the user was not found
    }
  } catch (error) {
    console.error(error);
    // Handle the error appropriately
  }
}

async function getTheList(data) {
  const { senderId, roomname } = data;
  return data;
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
    const user = await User.findOne({
      where: {
        _id: id,
      },
    });
    console.log("from the getuser", user != null ? user.dataValues : null);
    return user != null ? user.dataValues : null;
  } catch (error) {
    console.log(error);
  }
}
