const express = require('express');
const http = require('http'); //Allows Express to create an HTTP server, required for integrating socket.io.
const { Server } = require('socket.io'); //The class from socket.io for managing WebSocket connections.
const mongoose = require('mongoose');
const path = require('path');
const Message = require('./Models/message')
// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server); //The Socket.IO server object, managing WebSocket connections

// Connect to MongoDB
mongoose.connect('mongodb+srv://Anubhav:Kanhadham1@cluster0.owbdz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected!'))
    .catch(err => console.log('MongoDB connection error:', err));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle socket connections
//socket: Represents the connection for a specific client.
io.on('connection', (socket) => { //Listens for new WebSocket connections.
    const userId = socket.id; 
    socket.userId = userId;

    console.log('A user connected:', socket.id);

    // Assign a unique user ID to the socket
    socket.userId = socket.id;

    // Send previous messages to the connected user
    Message.find().sort({ timestamp: 1 }).then((messages) => {
        socket.emit('previous messages', messages);
    }); //Fetches and sorts all previous messages by timestamp.
    // Sends them to the newly connected client using the previous messages event.

    // Handle chat message event
    socket.on('chat message', async (data) => {
        const { username, message } = data;
        try {
            const newMessage = new Message({
                userId: socket.id, // Associate the message with the current user's socket ID
                username,
                message
            });
            await newMessage.save();
            io.emit('chat message', newMessage); //Broadcasts the saved message to all connected clients using io.emit.
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
                io.emit('message deleted', messageId); // Notify all clients to remove the message
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

// Start server
server.listen(3000, () => {
    console.log('Server running at http://<Localhost>:3000');
});
