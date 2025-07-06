const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io'); 
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server); 

mongoose.connect('mongodb+srv://Anubhav:Kanhadham1@cluster0.owbdz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('MongoDB connection error:', err));

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => { 
    const userId = socket.id; 
    socket.userId = userId;

    console.log('A user connected:', socket.id);

    socket.userId = socket.id;

    Message.find().sort({ timestamp: 1 }).then((messages) => {
        socket.emit('previous messages', messages);
    }); 
    socket.on('chat message', async (data) => {
        const { username, message } = data;
        try {
            const newMessage = new Message({
                userId: socket.id,
                username,
                message
            });
            await newMessage.save();
            io.emit('chat message', newMessage); 
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    

    // Handle delete message event
    socket.on('delete message', async (messageId) => {
        try {
            const message = await Message.findById(messageId);
            if (message && message.userId === socket.userId) {
                await Message.findByIdAndDelete(messageId);
                io.emit('message deleted', messageId); 
            } else {
                console.error('Unauthorized deletion attempt');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running at http://<Localhost>:3000');
});
