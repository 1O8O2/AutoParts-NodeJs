// admin-chat.js - Handles admin-side Socket.IO connections for chat with customers
document.addEventListener('DOMContentLoaded', function() {
    // Get chat room ID and admin email from the page
    const chatRoomId = document.getElementById('chatRoomId')?.value;
    const adminEmail = document.getElementById('adminEmail')?.value;
    
    if (!chatRoomId || !adminEmail) {
        console.error('Missing chat room ID or admin email');
        return;
    }

    // Connect to Socket.IO server
    const socket = io();

    // Join the chat room
    socket.emit('join_room', chatRoomId);

    // Elements
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('messages-container');
    const customerEmail = document.getElementById('customerEmail')?.value;

    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);

    // Send message when Enter key is pressed
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Function to send message
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (!messageText) return;

        // Clear input
        messageInput.value = '';

        // Send message to server
        fetch('/AutoParts/admin/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                customerEmail: customerEmail,
                message: messageText 
            }),
        })
        .then(response => response.json())
        .catch(error => {
            console.error('Error sending message:', error);
        });
    }

    // Listen for incoming messages
    socket.on('receive_message', function(data) {
        // Add message to the chat
        appendMessage(data);
        
        // Scroll to bottom
        scrollToBottom();
    });

    // Append message to the chat
    function appendMessage(message) {
        const messageElement = document.createElement('div');
        
        // Set classes based on sender type
        if (message.senderType === 'employee' && message.userEmail === adminEmail) {
            messageElement.className = 'message message-outgoing';
        } else {
            messageElement.className = 'message message-incoming';
        }

        // Format timestamp
        const timestamp = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Set message content
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(message.content)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        // Add to messages container
        messagesContainer.appendChild(messageElement);
    }

    // Helper function to escape HTML entities to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Scroll to bottom of messages container
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Initial scroll to bottom
    scrollToBottom();

    // Periodically check for new messages as a fallback in case socket connection fails
    function fetchMessages() {
        fetch(`/AutoParts/admin/chat/messages/${customerEmail}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.messages) {
                    // Clear messages container before adding updated messages
                    messagesContainer.innerHTML = '';
                    
                    // Add all messages
                    data.messages.forEach(message => {
                        appendMessage(message);
                    });
                    
                    // Scroll to bottom
                    scrollToBottom();
                }
            })
            .catch(error => {
                console.error('Error fetching messages:', error);
            });
    }

    // Initial fetch
    fetchMessages();
    
    // Fetch messages every 30 seconds as a fallback
    setInterval(fetchMessages, 30000);
    
    // Check for new messages from other customers
    function checkNewCustomerMessages() {
        fetch('/AutoParts/admin/chat/check-new-messages')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.hasNewMessages) {
                    // Update unread message count indicator
                    const unreadBadge = document.getElementById('unread-message-count');
                    if (unreadBadge) {
                        unreadBadge.textContent = data.count;
                        unreadBadge.style.display = 'inline-block';
                    }
                }
            })
            .catch(error => {
                console.error('Error checking for new messages:', error);
            });
    }
    
    // Check for new messages from other customers periodically
    setInterval(checkNewCustomerMessages, 60000); // Every minute
});