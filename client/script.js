import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
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
  `;
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  chatContainer.insertAdjacentHTML('beforeend', chatStripe(false, data.get('prompt')));

  form.reset();

  const uniqueId = generateUniqueId();
  chatContainer.insertAdjacentHTML('beforeend', chatStripe(true, ' ', uniqueId));

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  let retries = 5; // Number of retries
  let delay = 500; // Delay in milliseconds

  const sendRequest = async () => {
    try {
      const response = await fetch('https://codex-wxtj.onrender.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data.get('prompt'),
        }),
      });

      if (response.status === 429 && retries > 0) {
        // If too many requests, wait for a bit before trying again
        setTimeout(sendRequest, delay);
        retries -= 1; // Decrease the number of retries
        delay *= 2; // Double the delay
      } else if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      } else {
        clearInterval(loadInterval);
        messageDiv.innerHTML = ' ';
        const responseData = await response.json();
        const parsedData = responseData.bot.trim();
        typeText(messageDiv, parsedData);
      }
    } catch (error) {
      const errorMessage = `Something went wrong: ${error.message}`;
      messageDiv.innerHTML = 'Something went wrong';
      alert(errorMessage);
    }
  };

  // Initiate the request
  sendRequest();
};

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
