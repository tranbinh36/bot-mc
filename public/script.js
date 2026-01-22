// BASE_URL sẽ tự động là URL của Replit khi bạn chạy ứng dụng
// Vì cả frontend (index.html) và backend (index.js) đều được phục vụ từ cùng một địa chỉ
const BASE_URL = window.location.origin; 

const LINK_CLICK_DELAY = 1500; // Thời gian chờ để kích hoạt nút "Mở khóa Bot" (1.5 giây)

// Elements for the main dashboard
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const startButton = document.getElementById('startButton');
const reconnectButton = document.getElementById('reconnectButton');
const stopButton = document.getElementById('stopButton');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');
const logsContainer = document.getElementById('logs');
const botStatusSpan = document.getElementById('botStatus');
const mainDashboardWrapper = document.getElementById('mainDashboardWrapper');

const statusElements = {
    botStatus: document.getElementById('botStatus'),
    botUsername: document.getElementById('botUsername'),
    botHealth: document.getElementById('botHealth'),
    botFood: document.getElementById('botFood'),
    botPosition: document.getElementById('botPosition'),
    botPlayers: document.getElementById('botPlayers'),
    botUptime: document.getElementById('botUptime'),
};

// Elements for the subscription modal
const subscriptionModalOverlay = document.getElementById('subscriptionModalOverlay');
const modalYoutubeLink = document.getElementById('modalYoutubeLink');
const modalUnlockButton = document.getElementById('modalUnlockButton');

// Elements for the custom message box
const messageBoxOverlay = document.getElementById('messageBoxOverlay');
const messageBox = document.getElementById('messageBox');
const messageBoxText = document.getElementById('messageBoxText');
const messageBoxCloseButton = document.getElementById('messageBoxCloseButton');

// Hàm hiển thị hộp thoại thông báo tùy chỉnh
function showMessage(message, type = 'info', duration = 3000) {
    messageBoxText.textContent = message;
    messageBox.className = ''; // Reset classes
    messageBox.classList.add(type); // Add type class for styling (success, error, info)
    messageBoxOverlay.classList.add('show');

    // Tự động ẩn sau duration
    setTimeout(() => {
        messageBoxOverlay.classList.remove('show');
    }, duration);
}

// Đóng hộp thoại khi click nút Đóng
messageBoxCloseButton.addEventListener('click', () => {
    messageBoxOverlay.classList.remove('show');
});

// --- Logic cho Tabs ---
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Remove active class from all buttons and content
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and its content
        button.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// --- Logic cho Modal Đăng ký Kênh ---
function checkSubscriptionStatusAndShowModal() {
    // Luôn hiển thị modal, không kiểm tra localStorage nữa
    subscriptionModalOverlay.classList.remove('hidden');
    mainDashboardWrapper.style.display = 'none'; // Ẩn dashboard
    modalUnlockButton.disabled = true; // Đảm bảo nút mở khóa bị vô hiệu hóa
    logsContainer.innerHTML = '<div class="log-entry info">Vui lòng hoàn thành bước xác nhận để sử dụng bot.</div>';
}

modalYoutubeLink.addEventListener('click', function() {
    console.log('Nút Đăng ký kênh (Modal) đã được click. Đang chờ kích hoạt nút "Mở khóa Bot"...');
    showMessage('Vui lòng chờ một chút để kích hoạt nút "Mở khóa Bot"...', 'info', LINK_CLICK_DELAY + 500);
    setTimeout(() => {
        modalUnlockButton.disabled = false;
        modalUnlockButton.textContent = 'Tôi đã đăng ký kênh!';
        console.log('Nút "Mở khóa Bot" đã được kích hoạt.');
    }, LINK_CLICK_DELAY);
});

modalUnlockButton.addEventListener('click', function() {
    if (!modalUnlockButton.disabled) {
        showMessage('Cảm ơn bạn đã ủng hộ! Bot đang khởi động.', 'success');
        // KHÔNG LƯU VÀO LOCAL STORAGE NỮA
        subscriptionModalOverlay.classList.add('hidden'); // Ẩn modal
        mainDashboardWrapper.style.display = 'flex'; // Hiển thị dashboard
        // Gửi lệnh khởi động bot
        sendCommand('start'); 
        logsContainer.innerHTML = '<div class="log-entry info">Tuyệt vời! Bot đang khởi động...</div>';
        console.log('Đã mở khóa bot.');
    }
});
// --- End Logic cho Modal Đăng ký Kênh ---

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

async function updateStatus() {
    try {
        const response = await fetch(`${BASE_URL}/status`);
        const data = await response.json();

        statusElements.botUsername.textContent = data.username;
        statusElements.botHealth.textContent = `${data.health} / 20`;
        statusElements.botFood.textContent = `${data.food} / 20`;
        statusElements.botPosition.textContent = `X: ${data.position.x} Y: ${data.position.y} Z: ${data.position.z}`;
        statusElements.botPlayers.textContent = data.players;
        statusElements.botUptime.textContent = formatUptime(data.uptime);

        if (data.online) {
            botStatusSpan.textContent = 'Online';
            botStatusSpan.className = 'status-online';
            startButton.disabled = true;
            reconnectButton.disabled = false;
            stopButton.disabled = false;
            chatInput.disabled = false;
            sendChatButton.disabled = false;
        } else {
            botStatusSpan.textContent = data.statusMessage || 'Offline';
            botStatusSpan.className = 'status-offline';

            // Nút Start chỉ được kích hoạt nếu modal đã ẩn (người dùng đã nhấn mở khóa)
            startButton.disabled = subscriptionModalOverlay.classList.contains('hidden') ? false : true;
            reconnectButton.disabled = true;
            stopButton.disabled = true;
            chatInput.disabled = true;
            sendChatButton.disabled = true;
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        botStatusSpan.textContent = 'Lỗi kết nối';
        botStatusSpan.className = 'status-offline';

        // Nút Start chỉ được kích hoạt nếu modal đã ẩn
        startButton.disabled = subscriptionModalOverlay.classList.contains('hidden') ? false : true;
        reconnectButton.disabled = true;
        stopButton.disabled = true;
        chatInput.disabled = true;
        sendChatButton.disabled = true;
    }
}

async function sendCommand(action) {
    try {
        const response = await fetch(`${BASE_URL}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        const data = await response.json();
        console.log(`Lệnh "${action}" phản hồi:`, data.message);
        showMessage(data.message, data.success ? 'success' : 'error');
        // Cập nhật trạng thái sau khi gửi lệnh để phản ánh ngay lập tức
        setTimeout(updateStatus, 1000); 
    } catch (error) {
        console.error(`Lỗi khi gửi lệnh "${action}":`, error);
        showMessage(`Lỗi khi gửi lệnh "${action}": ${error.message}`, 'error');
    }
}

async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) {
        showMessage('Tin nhắn không được để trống.', 'warn');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        console.log(`Tin nhắn gửi phản hồi:`, data.message);
        showMessage(data.message, data.success ? 'success' : 'error');
        if (data.success) {
            chatInput.value = '';
        }
    } catch (error) {
        console.error('Lỗi khi gửi tin nhắn chat:', error);
        showMessage(`Lỗi khi gửi tin nhắn chat: ${error.message}`, 'error');
    }
}

startButton.addEventListener('click', () => sendCommand('start'));
reconnectButton.addEventListener('click', () => sendCommand('reconnect'));
stopButton.addEventListener('click', () => sendCommand('stop'));
sendChatButton.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

async function fetchLogs() {
    try {
        const response = await fetch(`${BASE_URL}/logs`);
        const logs = await response.json();
        logsContainer.innerHTML = '';
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.level.toLowerCase()}`;
            logEntry.textContent = `[${log.timestamp}] ${log.emoji} ${log.level.toUpperCase()}: ${log.message}`;
            logsContainer.appendChild(logEntry);
        });
        logsContainer.scrollTop = logsContainer.scrollHeight;
    } catch (error) {
        console.error('Error fetching logs:', error);
        const errorLog = document.createElement('div');
        errorLog.className = 'log-entry error';
        errorLog.textContent = `[${new Date().toISOString()}] ❌ ERROR: Lỗi khi tải nhật ký: ${error.message}`;
        logsContainer.appendChild(errorLog);
    }
}

// Initial checks and updates
checkSubscriptionStatusAndShowModal(); // Gọi hàm này khi tải trang để luôn hiển thị modal
updateStatus();
fetchLogs();

// Set intervals for continuous updates
setInterval(updateStatus, 3000); // Cập nhật trạng thái mỗi 3 giây
setInterval(fetchLogs, 2000);   // Cập nhật nhật ký mỗi 2 giây
