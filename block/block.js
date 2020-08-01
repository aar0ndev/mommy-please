domainRegex = /(?:https:?\/\/)([^\/]*)/i

function clickhandler(e) {
    debugger;
    url = window.location.search.substr(1)
    domain = window.location.search.substr(1).match(domainRegex)[1]
    chrome.declarativeNetRequest.updateDynamicRules([5], [{
        id: 5,
        priority: 2,
        condition: {urlFilter: domain, resourceTypes: ["main_frame"]},
        action: {type: "allow"}
    }])
    window.location = url
}

document.querySelector('button').addEventListener('click', clickhandler);