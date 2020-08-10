input = document.querySelector('input.password');
duration = document.querySelector('select.duration')
errorContainer = document.querySelector('p.error')

function showError(msg) {
    errorContainer.innerText = msg
}

function clearError() {
    errorContainer.innerText = ''
}

function unblockResponseCallback(response) {
    if (response.result === true) {
        window.location.replace(response.url)
    } else if (response.error) {
        showError(response.error)
    }
}

function askMommyHandler(e) {
    document.querySelector('.confirm').style.display = 'block'
    // todo: send unblock request to server
    input.focus()
}

function unblockHandler(e) {
    e.preventDefault()
    clearError()
    url = window.location.hash.substr(1)
    hours = duration.value
    code = input.value
    chrome.runtime.sendMessage({type: 'unblock', code, url, hours}, unblockResponseCallback)
}

document.querySelector('button.ask-mommy').addEventListener('click', askMommyHandler);
document.querySelector('button.unblock').addEventListener('click', unblockHandler);
