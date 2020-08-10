function getEl(queryString) { return document.querySelector(queryString) }

var titleEl = getEl('#title')
var messageEl = getEl('#message')

var setPinSection = getEl('#setPinSection')
var setPin1 = getEl('#setPin1')
var setPin2 = getEl('#setPin2')
var btnSetPin = getEl('#btnSetPin')

var updatePinSection = getEl('#updatePinSection')
var updatePin0 = getEl('#updatePin0')
var updatePin1 = getEl('#updatePin1')
var updatePin2 = getEl('#updatePin2')
var btnUpdatePin = getEl('#btnUpdatePin')

function showError(msg, inputs) {
    messageEl.innerText = msg
    messageEl.className = 'error'
    for (var el of inputs) {
        el.className = 'error'
    }
}

function validateNewPin(inputs) {
    var pin1 = inputs[0].value
    var pin2 = inputs[1].value
    if (pin1.length != 4 || pin2.length != 4) {
        showError('New pins must be 4 digits', inputs)
    } else if (pin1 != pin2) {
        showError('New pins do not match', inputs)
    } else {
        return true;
    }
    return false;
}

function tryUpdatePin({oldInput, newInputs, section}) {
    if (validateNewPin(newInputs)) {
        var oldPin = oldInput && oldInput.value
        var newPin = newInputs[0].value
        chrome.runtime.sendMessage({type: 'update-pin', oldPin, newPin }, function(response) {
            if (response.result) {
                section.style.display = 'None'
                messageEl.innerText = 'Success!'
                messageEl.style.color = 'black'
            } else if (response.error){
                showError(response.error, [oldInput])
            }
        })
    }
}

btnSetPin.addEventListener('click', (evt) => {
    evt.preventDefault()
    tryUpdatePin({newInputs: [setPin1, setPin2], section: setPinSection})
})

btnUpdatePin.addEventListener('click', (evt) => {
    evt.preventDefault()
    tryUpdatePin({oldInput: updatePin0, newInputs: [updatePin1, updatePin2], section: updatePinSection})
})

// fixme: probably should just check for existence of pin, perhaps from background...
chrome.runtime.sendMessage({type: 'check-status'}, function(response) {
    
    document.querySelector('body').style.opacity = 1
    if (!response.result) return;
    if (response.pinSet) {
        titleEl.innerText = "Update Pin"
        document.body.className = 'hasPin'
    }
})
