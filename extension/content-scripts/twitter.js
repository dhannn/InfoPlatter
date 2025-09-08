(function() {
    console.log('[InfoPlatter] Twitter script loaded');

    let isInitialized = false;
    let mutationObserver = null;
    let intersectionObserver = null;
    let tweetElements = new Set();
    let tweets = [];
    
    const parent = document.querySelector("body")
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        // Start observing for DOM changes
        startObserver();   
    }

    function startObserver() {

        intersectionObserver = new IntersectionObserver(tweets => {
            tweets.forEach(tweet => {
                if (tweet.isIntersecting) {
                    processEntry(tweet.target);
                } else {
                    processExit(tweet.target);
                    tweetElements.delete(tweet.target);
                }
            })
        }, {
            threshold: 1
        })

        mutationObserver = new MutationObserver(entries => {
            
            entries.forEach(entry => {
                
                entry.addedNodes.forEach(node => {

                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const tweets = node.querySelectorAll? node.querySelectorAll('[data-testid="tweet"]'): [];
                        
                        if (tweets.length > 0) {                            
                            tweets.forEach(tweet => {
                                tweetElements.add(tweet);
                                tweet.newlyAdded = true;
                            });
                        }
                        
                    }
                })
            
            });

            tweetElements.forEach(element => {
                intersectionObserver.observe(element);
            });
        });

        mutationObserver.observe(parent, {
            childList: true,
            subtree: true
        });
    }

    function processEntry(tweetElement) {
        if (tweetElement.newlyAdded) {
            tweetElement.newlyAdded = false;
        }

        tweetElement.entryTime = new Date();
        tweetElement.exitTime = undefined;
    }

    async function processExit(tweetElement) {
        if (tweetElement.newlyAdded) return;

        tweetElement.exitTime = new Date();
        tweetElement.timeSpent = (tweetElement.exitTime - tweetElement.entryTime) / 1_000;
        
        const tweetData = extractTweetData(tweetElement);
        
        if (tweetData) {
            await chrome.runtime.sendMessage({
                type: 'CAPTURE_DATA',
                data: tweetData
            });
        }
    }
  
    function extractTweetData(tweetElement) {
        try {
            // Extract text content
            const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
            const text = textElement ? textElement.innerText.trim() : '';
            
            // Extract user info
            const userElement = tweetElement.querySelector('[data-testid="User-Names"] a');
            const username = userElement ? userElement.href.split('/').pop() : '';
            
            // Extract engagement metrics
            const replyBtn = tweetElement.querySelector('[data-testid="reply"]');
            const retweetBtn = tweetElement.querySelector('[data-testid="retweet"]');
            const likeBtn = tweetElement.querySelector('[data-testid="like"]');
            
            const replies = extractNumber(replyBtn?.getAttribute('aria-label') || '0');
            const retweets = extractNumber(retweetBtn?.getAttribute('aria-label') || '0');
            const likes = extractNumber(likeBtn?.getAttribute('aria-label') || '0');
            
            // Extract timestamp
            const timeElement = tweetElement.querySelector('time');
            const timestamp = timeElement ? timeElement.getAttribute('datetime'): new Date().toISOString();
            
            // Extract tweet link
            let tweetLink = '';
            if (timeElement && timeElement.parentElement && timeElement.parentElement.tagName === 'A') {
                tweetLink = timeElement.parentElement.href;
            }

            // Extract media info and links
            const imageNodes = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] img');
            const videoNodes = tweetElement.querySelectorAll('video');
            const images = Array.from(imageNodes).map(img => img.src || tweetLink);
            const videos = Array.from(videoNodes).map(video => video.src || tweetLink);
            const hasMedia = images.length > 0 || videos.length > 0;

            // Determine tweet type
            const isRetweet = tweetElement.querySelector('[data-testid="socialContext"]')?.innerText.includes('Retweeted');
            const isReply = tweetElement.querySelector('[data-testid="tweetText"]')?.innerText.startsWith('@');

            // Get time read
            const timeSpent = tweetElement.timeSpent

            let tweetType = 'tweet';
            if (isRetweet) tweetType = 'retweet';
            else if (isReply) tweetType = 'reply';
            else if (hasMedia) tweetType = 'media_tweet';
            
            const data = {
                type: tweetType,
                content: text,
                username: username,
                timestamp: timestamp,
                likes: likes,
                shares: retweets,
                comments: replies,
                hasMedia: hasMedia,
                mediaCount: images.length + videos.length,
                mediaLinks: images.concat(videos),
                tweetLink: tweetLink,
                url: window.location.href,
                timeSpent: timeSpent
            };      

            tweets.push(data);
            console.log(tweets);
            
            return data;
        
        } catch (error) {
       
            console.error('Error extracting tweet data:', error);
            return null;
        }
    }
  
    function extractNumber(text) {
        const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)/);
        if (!match) return 0;
        
        const numStr = match[1];
        let num = parseFloat(numStr.replace(/,/g, ''));
        
        if (numStr.includes('K')) num *= 1000;
        else if (numStr.includes('M')) num *= 1000000;
        else if (numStr.includes('B')) num *= 1000000000;
        
        return Math.round(num);
    }

    window.addEventListener('beforeunload', () => {
        if (mutationObserver) {
            mutationObserver.disconnect();
        }

        if (intersectionObserver) {
            intersectionObserver.disconnect();
        }
    });
})()