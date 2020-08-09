input = document.querySelector('input');

function clickhandler(e) {
    document.querySelector('.confirm').style.display = 'block'
    input.focus()
}

function inputHandler(e) {
    url = window.location.hash.substr(1)
    chrome.runtime.sendMessage({type: 'unblock', code: e.target.value, url, hours: 24}, function(result) {
        console.log(e.target.value, result.result)
        if (result.result === true) {
            window.location.replace(url)
        }
    })
}

document.querySelector('input').addEventListener('input', inputHandler);
document.querySelector('button').addEventListener('click', clickhandler);
