const domainRegex = /^(?:https?:?\/\/)([^\/?]*)/i
const baseUrl = chrome.runtime.getURL('/');
const MAX_DATE = 8640000000000000
const whitelist = {};

function isValidCode(code) {
    return code === '1234'
}

function unblock({url, code, timestamp}) {
    if (checkWhitelist({url})) return true;
    if (isValidCode(code)) {
        console.log('unblocking...')
        return whitelistUrl({url, timestamp})
    }
}

function whitelistUrl({url, timestamp}) {
    var match = url.match(domainRegex)
    if (match && match.length) {
        console.log('whitelisting ' + match[1] + '...')
        whitelist[match[1]] = timestamp;
        chrome.storage.local.set({whitelist})
        return true
    }   
    return false
}

function checkWhitelist({url}) {
    var domainMatch = url.match(domainRegex);
    var domain = null;
    if (domainMatch && domainMatch.length) {
        domain = domainMatch[1];
    }

    if (domain != null && whitelist[domain] > Date.now()) {
        return true;
    }
    return false;
}

function navigate({url, replace}) {
    if (replace === 'shenanigans') {
        chrome.tabs.executeScript({code: `window.location.replace('${url}')`})
    } else {
        chrome.tabs.update({url})
    }
}

chrome.runtime.onInstalled.addListener(function() {


    chrome.storage.local.get(['whitelist'], function(result) {
        console.log('whitelist is ' + result.whitelist)
        if (!result.whitelist) return;
        for(k of Object.keys(result.whitelist)) {
            whitelist[k] = result.whitelist[k]
        }
    })

    function onMessageCallback(msg, sender, sendResponse) {
        if (msg && msg.type) {
            if (msg.type === 'whitelist') {
                return sendResponse({result: whitelistUrl({url: msg.url, timestamp: Date.now() + 15*1000})})
            }
            if (msg.type === 'unblock') {
                var timestamp = Date.now() + 1000;
                if (msg.hours !== undefined) {
                    timestamp += Math.round(msg.hours * 3600 * 1000)
                }
                if (unblock({url: msg.url, code: msg.code, timestamp})) {
                    return sendResponse({result: true})
                }
            }
        }
        sendResponse({result: false})
    }

    function onBeforeRequestCallback(details) {
        if (details.url.startsWith(baseUrl)) {
            return;
        }

        if (details.type != 'main_frame') {
            return; 
        }

        // fix for google common search?
        // if (details.initiator && !details.initiator.startsWith(baseUrl)) {
        //     return {cancel: true}
        // }

        if (!checkWhitelist({url: details.url})) {
            chrome.tabs.update({url: chrome.runtime.getURL('/block/index.html#' + details.url)})
        }
    }
    filter = {urls: ["<all_urls>"]};
    opt_extraInfoSpec = ["blocking"];

    chrome.runtime.onMessage.addListener(onMessageCallback);
    chrome.webRequest.onBeforeRequest.addListener( onBeforeRequestCallback, filter, opt_extraInfoSpec );
  });

