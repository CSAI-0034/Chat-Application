const socket = io();
const userId = Math.random().toString(36).substring(2, 15);

document.querySelector('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.querySelector('#username').value.trim();
    const message = document.querySelector('#input').value.trim();

    if (username && message) {
        socket.emit('chat message', { username, message });
        document.querySelector('#input').value = '';
    }
});

socket.on('previous messages', (messages) => {
    messages.forEach((msg) => addMessageToUI(msg));
});

socket.on('chat message', function({ _id, username, message, userId }) {
    const item = document.createElement('li');
    item.textContent = `${username}: ${message}`;
    item.dataset.id = _id; // Add message ID as a data attribute

    // Add delete button only for messages sent by the current user
    if (userId === socket.id) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
            socket.emit('delete message', _id); // Send the message ID to the server
        };
        item.appendChild(deleteButton);
    }

    document.querySelector('#messages').appendChild(item);
});

socket.on('message deleted', function(messageId) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
});

