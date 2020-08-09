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

function validatePins(inputs) {
    var pin1 = inputs[0].value
    var pin2 = inputs[1].value
    if (pin1.length != 4 || pin2.length != 4) {
        showError('Pins must be 4 digits', inputs)
    } else if (pin1 != pin2) {
        showError('Pins do not match', inputs)
    } else {
        return true;
    }
    return false;
}

function tryUpdatePin(input1, input2, sectionEl) {
    if (validatePins([input1, input2])) {
        updatePin(input1.value)
        sectionEl.style.display = 'None'
        messageEl.innerText = 'Success!'
        messageEl.style.color = 'black'
    }
}

btnSetPin.addEventListener('click', (evt) => {
    evt.preventDefault()
    tryUpdatePin(setPin1, setPin2, setPinSection)
})

btnUpdatePin.addEventListener('click', (evt) => {
    evt.preventDefault()
    getPin(function (oldPin) {
        if (oldPin !== updatePin0.value) {
            showError("Current pin not correct", [updatePin0])
        } else {
            tryUpdatePin(updatePin1, updatePin2, updatePinSection)
        }
    })
})

// functions that probably belong in background...
function updatePin(pin) {
    //chrome.runtime.storage.set('pin', pin)...
}

function getPin(callback) {
    callback('')
    // return chrome.storage.local.get(['pin'], function (result) {
    //     callback(!!result.pin)
    // })
}

// update class to show update form if needed
getPin(function (pin) {
    if (!!pin) {
        titleEl.innerText = "Update Pin"
        document.body.className = 'hasPin'
    }
})