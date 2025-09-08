// Popup script for the browser extension
const loadingDiv = document.getElementById('loading');
const contentDiv = document.getElementById('content');
const statusDiv = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');
const totalItemsSpan = document.getElementById('totalItems');
const sessionItemsSpan = document.getElementById('sessionItems');
const lastUpdateSpan = document.getElementById('lastUpdate');
const exportBtn = document.getElementById('exportBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
let isCapturing;
let sessionStartTime = Date.now();

document.addEventListener('DOMContentLoaded', async () => {
    
    isCapturing = false;

    try {
        // Initialize popup
        await loadStatus();
        await loadStats();
        
        // Hide loading, show content
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
        // Set up event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Failed to initialize popup:', error);
        loadingDiv.textContent = 'Failed to load';
    }
});

async function loadStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' }, (response) => {
            console.log(response);
            isCapturing = response.isCapturing;
            updateStatusDisplay();
            resolve();
        });
    });
}

async function loadStats() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' }, async (response) => {
            console.log('Response received:', response); // Debugging log
            const data = response.data || [];
        
            // Total items
            totalItemsSpan.textContent = data.length;
            
            // Session items (items captured since session start)
            const sessionData = data.filter(item => 
                new Date(item.timestamp) >= new Date(sessionStartTime)
            );
            
            sessionItemsSpan.textContent = sessionData.length;
            
            // Last update
            if (data.length > 0) {
                const lastItem = data[data.length - 1];
                const lastTime = new Date(lastItem.timestamp);
                lastUpdateSpan.textContent = formatRelativeTime(lastTime);
            }
            
            resolve();
        });
    });
}

function updateStatusDisplay() {

  const statusText = statusDiv.querySelector('.status-text');
  
  if (isCapturing) {
    statusDiv.className = 'status active';
    statusText.textContent = 'Collecting Data';
    toggleBtn.className = 'toggle-btn active';
    toggleBtn.textContent = 'Stop';
  } else {
    statusDiv.className = 'status inactive';
    statusText.textContent = 'Collection Paused';
    toggleBtn.className = 'toggle-btn inactive';
    toggleBtn.textContent = 'Start';
  }
}

function setupEventListeners() {
    
    toggleBtn.addEventListener('click', () => {
        const newStatus = !isCapturing;
        
        chrome.runtime.sendMessage({
            type: 'TOGGLE_CAPTURE',
            enabled: newStatus
        }, (response) => {
            if (response.success) {
                isCapturing = newStatus;
                updateStatusDisplay();

                if (isCapturing) {
                    sessionStartTime = Date.now()
                }
            }
        });
    });
  
    // Export button
    exportBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'GET_STORED_DATA' }, (response) => {
        const data = response.data || [];
        
        if (data.length === 0) {
            alert('No data to export');
            return;
        }
        
        // Create and download JSON file
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `social-media-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        });
    });
  
    // Dashboard button
    dashboardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://localhost:3000' });
        window.close();
    });
}

function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Update stats periodically
setInterval(loadStats, 30000); // Update every 30 seconds
