import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"


const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

//settting the state

const usersState = {
    users:[],
    setUsers: function(newUserArray){
        this.users = newUserArray
    }
}




const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    // Upon connection - only to user 
    socket.emit('message', buildMsg(ADMIN,"Welcome to chat App!"))

    socket.on('enterRoom',(data)=>{
        const {name,room} = data
        console.log(name,room)
            //leave a previous romm
            const prevRoom = getUser(socket.id)?.room

            if(prevRoom){
                socket.leave(prevRoom)
                io.to(prevRoom).emit('message',buildMsg(ADMIN,`${name} has left the room`))
            }
            console.log("before active user",name,room)
            const user = activateUser(socket.id,name,room)

            if(prevRoom){
                io.to(prevRoom).emit('userList',{
                    users:getUsersInRoom(prevRoom)
                })
            }
            // join Room
            console.log(user)
            socket.join(user.room)

            //To user who joined

            socket.emit('message',buildMsg(ADMIN,`you have joined the ${user.room} chat room`))

            //to everyone else
            socket.broadcast.to(user.room).emit(`message`,buildMsg(ADMIN,`${user.name} has joined the room`))

            //update the user list for room
            io.to(user.room).emit('userList',{
                users:getUsersInRoom(user.room)
            })

            //update the room list dfor everyone
            io.emit('roomList',{
                rooms:getAllActiveRooms()
            })
    })


        // When user disconnects - to all others 
        socket.on('disconnect', () => {
            const user = getUser(socket.id)
            userLeavesApp(socket.id)

            if(user){
                io.to(user.room).emit("message",buildMsg(ADMIN,`${user.name} has left the room`))

                io.to(user.room).emit('userList',{
                    users:getUsersInRoom(user.room)
                })

                io.emit('roomList',{
                    rooms:getAllActiveRooms()
                })
            }
            console.log(`User ${socket.id} disconnected`)
        })
    
    

    // Listening for a message event 
    socket.on('message', (data) => {
        console.log("im trogger")
        const {name,text} = data
        console.log(name,text)
        const room = getUser(socket.id)?.room
        console.log(room)
        if(room){
                io.to(room).emit('message',buildMsg(name,text))
        }
    })



    // Listen for activity 
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room

        if(room){
            socket.broadcast.to(room).emit('activity',name)
        }
    })
})



function buildMsg(name,text){
    return{
        name,
        text,
        time:new Intl.DateTimeFormat('default',{
            hour:'numeric',
            minute:'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}


//user Functions

function activateUser(id,name,room){
    const user = {id,name,room}
    console.log(id,name,room)
    usersState.setUsers([
        ...usersState.users.filter(user => user.id !== id),
        user
    ])
    console.log("user is " ,user)
    return user
}


function userLeavesApp (id){
    usersState.setUsers(
        usersState.users.filter(user => user.id !== id)
    )
}

function getUser(id){
    console.log("userID",id)
    return usersState.users.find(user => user.id == id)
}

function getUsersInRoom(room){
    return usersState.users.filter(user => user.room === room)
}


function getAllActiveRooms(){
    return Array.from(new Set(usersState.users.map(user => user.room)))
}