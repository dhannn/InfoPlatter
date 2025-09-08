let isCapturing = false;
let dev = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
    console.log('InfoPlatter browser extension installed');

    // Check if user has granted consent to mine data locally
    // chrome.storage.local.get(['dataPerms'], (result) => {
    //     if (!result.dataPerms) {
    //         chrome.tabs.create({
    //             url: dev? 'http://localhost:3000/dashboard': 'https://infoplatter.vercel.app/dashboard'
    //         })
    //     }
    // })
});

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "tweet-tracker") {
        port.onMessage.addListener((message) => {
            if (message.type === "CAPTURE_DATA") {
                // process and persist the data            
                console.log("Got tweet data:", message.data);
                handleDataCapture(message.data);
                port.postMessage({ success: true });
            }
        });
    }
});


// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {    
    switch (message.type) {
        case 'CAPTURE_DATA':            
            handleDataCapture(message.data);
            sendResponse({ success: true });
            break;
      
        case 'GET_CAPTURE_STATUS':
            sendResponse({ isCapturing });
            break;
        
        case 'TOGGLE_CAPTURE':
            toggleCapture(message.enabled);
            sendResponse({ success: true });
            break;
            
      
        case 'GET_STORED_DATA':
            getStoredData().then(data => {
                sendResponse({ data });
            });
            return true;
            
        default:
            console.log('Unknown', message);
            
            sendResponse({ error: 'Unknown message type' });
            break;
    }
});

function handleDataCapture(data) {

    const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    if (!isCapturing) return;
    
    // Add timestamp and unique ID
    const enrichedData = {
        ...data,
        id: generateId(),
        timestamp: new Date().toISOString(),
        capturedBy: 'extension'
    };
    
    // Store in local storage
    storeData(enrichedData);
    
    console.log('Data captured:', enrichedData);
}

async function getArtifacts() {
    const result = await chrome.storage.local.get(['artifacts']);
    const existingData = result.artifacts || [];

    return existingData;
}

async function storeData(data) {
    try {
        const result = await chrome.storage.local.get(['artifacts']);
        const existingData = result.artifacts || [];
        
        existingData.push(data);
        
        // Keep only last 1000 items to prevent storage overflow
        const limitedData = existingData.slice(-1000);
        
        await chrome.storage.local.set({
            artifacts: limitedData
        });
        
    } catch (error) {
        console.error('Failed to store data:', error);
    }
}

function toggleCapture(enabled) {
    isCapturing = enabled;
    
    // Update icon to reflect status
    const iconPath = enabled ? 'icons/icon-active' : 'icons/icon';
    // chrome.action.setIcon({
    //     path: {
    //     "16": `${iconPath}16.png`,
    //     "48": `${iconPath}48.png`,
    //     "128": `${iconPath}128.png`
    //     }
    // });
    
    // Update badge
    chrome.action.setBadgeText({
        text: enabled ? 'ON' : 'OFF'
    });
    
    chrome.action.setBadgeBackgroundColor({
        color: enabled ? '#3BB273' : '#D62828'
    });
}


async function getStoredData() {
    try {
        const result = await chrome.storage.local.get(['artifacts']);
        console.log('Artifacts in storage:', result.artifacts); // Debugging log
        return result.artifacts || [];
    } catch (error) {
        console.error('Failed to get stored data:', error);
        return [];
    }
}

chrome.alarms.create("heartbeat", { periodInMinutes: 0.5 });
chrome.alarms.create("heartbeat2", { periodInMinutes: 0.5, delayInMinutes: 0.7});
(async function() {

    
    chrome.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === "heartbeat") {
            console.log("Service worker woke up");
        }
    });
})();
    
