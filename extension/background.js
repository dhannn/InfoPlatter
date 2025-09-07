let isCapturing = true;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('InfoPlatter browser extension installed');

    // Check if user has granted consent to mine data locally
    chrome.storage.local.get(['dataPerms'], (result) => {
        if (!result.dataPerms) {
            chrome.tabs.create({
                url: 'http://localhost:3000/dashboard'
            })
        }
    })
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 'CAPTURE_DATA':            
            handleDataCapture(message.data);
            sendResponse({ success: true });
            break;
        
        default:
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
