// filepath: c:\Users\hung\Documents\GitHub\AutoParts-NodeJs\public\js\admin-chat-notification.js
document.addEventListener('DOMContentLoaded', function() {    // Connect to Socket.IO server to receive real-time notifications
    const socket = io();
    
    // Join all customer chat rooms for real-time notifications
    console.log('Admin requesting to join all customer rooms...');
    socket.emit('join_admin_rooms');
    
    // Listen for confirmation that rooms were joined
    socket.on('admin_rooms_joined', function(data) {
        if (data.error) {
            console.error('Error joining admin rooms:', data.error);
        } else {
            console.log(`Successfully joined ${data.roomCount} customer rooms`);
        }
    });
      // Listen for new messages from any customer
    socket.on('receive_message', function(data) {
        console.log('Admin notification received message:', data);
        if (data.senderType === 'customer') {
            // Show notification for new customer message
            showNotification(1);
            
            // Update chat icon if it exists
            const chatIcon = document.querySelector('.chat-notification-icon');
            if (chatIcon) {
                chatIcon.style.display = 'inline-block';
                const currentCount = parseInt(chatIcon.textContent) || 0;
                chatIcon.textContent = currentCount + 1;
            }
        }
    });

    // Listen for general new customer message events
    socket.on('new_customer_message', function(data) {
        console.log('New customer message notification:', data);
        showNotification(data.messageCount);
        
        // Update chat icon if it exists
        const chatIcon = document.querySelector('.chat-notification-icon');
        if (chatIcon) {
            chatIcon.style.display = 'inline-block';
            const currentCount = parseInt(chatIcon.textContent) || 0;
            chatIcon.textContent = currentCount + data.messageCount;
        }
    });

    // Check for new messages every 60 seconds
    function checkForNewMessages() {
        fetch('/AutoParts/admin/chat/check-new-messages')
            .then(response => response.json())
            .then(data => {
                if (data.hasNewMessages) {
                    // Display notification
                    showNotification(data.count);
                    
                    // Update chat icon if it exists
                    const chatIcon = document.querySelector('.chat-notification-icon');
                    if (chatIcon) {
                        chatIcon.style.display = 'inline-block';
                        chatIcon.textContent = data.count;
                    }
                }
            })
            .catch(error => {
                console.error('Error checking for new messages:', error);
            });
    }
    
    // Display notification
    function showNotification(count) {
        // Check if notification already exists
        if (document.querySelector('.chat-notification-toast')) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = 'chat-notification-toast';
        notification.innerHTML = `
            <div class="toast-header">
                <strong class="mr-auto"><i class="fas fa-comments"></i> Tin nhắn mới</strong>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Đóng">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">
                Bạn có ${count} tin nhắn mới từ khách hàng.
                <a href="/AutoParts/admin/chat" class="btn btn-primary btn-sm mt-2">Xem ngay</a>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .chat-notification-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #fff;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                z-index: 9999;
                max-width: 350px;
                overflow: hidden;
                animation: slideIn 0.3s ease-out forwards;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            .chat-notification-toast .toast-header {
                background-color: #4e73df;
                color: white;
                padding: 10px 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .chat-notification-toast .toast-body {
                padding: 15px;
            }
            
            .chat-notification-icon {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #e74a3b;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        
        document.head.appendChild(style);
        
        // Add close functionality
        const closeButton = notification.querySelector('.close');
        closeButton.addEventListener('click', function() {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Auto close after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 10000);
    }
    
    // Add slide out animation
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); }
            to { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(slideOutStyle);
    
    // Check for new messages right away
    checkForNewMessages();
    
    // Then check periodically
    setInterval(checkForNewMessages, 60000); // Every 60 seconds
});