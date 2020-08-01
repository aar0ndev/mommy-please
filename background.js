chrome.runtime.onInstalled.addListener(function() {
    // chrome.contextMenus.create({
    //   "id": "sampleContextMenu",
    //   "title": "Sample Context Menu",
    //   "contexts": ["selection"]
    // });

    chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
        function (info) {
            console.log(info.rule);
            if (info.rule.ruleId == 1) {
                //debugger;
            }
        }
    );

    // chrome.webRequest.onBeforeRedirect.addListener(
    //     function (details) {
    //         debugger;
    //         if (details.redirectUrl.startsWith('mommy-please://')) {
    //             console.log(details)
    //         }
    //     }
    // );

  });

