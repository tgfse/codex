import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')

let loadInterval
let requestQueue = []
const requestInterval = 1000; // adjust this according to your API's rate limit

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        element.textContent += '.';

        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 20)
}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? bot : user} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

const processQueue = async () => {
    if (requestQueue.length > 0) {
        const { data, uniqueId, messageDiv } = requestQueue.shift();

        loader(messageDiv)

        const response = await fetch('https://codex-wxtj.onrender.com/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: data.get('prompt')
            })
        })

        clearInterval(loadInterval)
        messageDiv.innerHTML = " "

        if (response.ok) {
            const responseData = await response.json();
            const parsedData = responseData.bot.trim()

            typeText(messageDiv, parsedData)
        } else {
            const err = await response.text()

            messageDiv.innerHTML = "Something went wrong"
            alert(err)
        }
    }
}

const handleSubmit = (e) => {
    e.preventDefault()

    const data = new FormData(form)

    chatContainer.insertAdjacentHTML('beforeend', chatStripe(false, data.get('prompt')));

    form.reset()

    const uniqueId = generateUniqueId()
    chatContainer.insertAdjacentHTML('beforeend', chatStripe(true, " ", uniqueId));

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId)

    requestQueue.push({ data, uniqueId, messageDiv });
}

form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        e.preventDefault();
        handleSubmit(e)
    }
})

setInterval(processQueue, requestInterval);
