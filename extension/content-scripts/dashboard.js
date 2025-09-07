(async function() {
    console.log('Twitter content script loaded');
    
    let isInitialized = false;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        loadArtifacts();

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

            switch (request.type) {

                case 'ADD_ARTIFACT':
                    break;
            
                default:
                    break;
            }
        });
    }

    async function loadArtifacts () {
        // Fetch data from extension's local storage
        chrome.storage.local.get(['artifacts'], (result) => {
            if (result.artifacts) {
                // Transfer data to the dashboard website's local storage
                localStorage.setItem('artifacts', JSON.stringify(result.artifacts));
                console.log('Artifacts transferred to dashboard local storage:', result.artifacts);
            } else {
                console.log('No artifacts found in extension storage.');
            }
        });
    }
    
})();
