const $ = document.querySelector.bind(document);

const log = (style, ...params) => (
  console.log(...params.reduce((acc, param) => {
    if (typeof param === 'string') {
      acc.push(`%c${param}`, style);
    } else {
      acc.push(param);
    }
    return acc;
  }, []))
);

log.info = (...params) => log('color: yellow', ...params);
log.success = (...params) => log('color: lime', ...params);

const messageContainer = $('[aria-label="Messages in "]');
const scrollContainer = messageContainer.parentElement.parentElement;
const messages = [];

function run({ beautify = false, delay = 100 } = {}) {
  const scrollInterval = setInterval(() => {
    const { scrollTop } = scrollContainer;
    log.info('SCROLLING TO FIRST MESSAGE...');
    scrollContainer.scrollTo(0, 0);
    if (!scrollTop) {
      log.success('REACHED FIRST MESSAGE!');
      clearInterval(scrollInterval);
      extractMessages({ beautify, delay });
    }
  }, 500);
}

async function extractMessages({ beautify = false, delay = 100 } = {}) {
  log.info('EXTRACTING MESSAGES...');
  const elements = Array(...messageContainer.children);
  let currentElement = elements.find((element) => isMessage(element));

  return new Promise((resolve) => {
    const intervalID = setInterval(() => {
      currentElement.scrollIntoView({ behavior: 'smooth' });

      if (isDivider(currentElement)) {
        currentElement = currentElement.nextElementSibling;
        return;
      }

      if (!isMessage(currentElement)) {
        clearInterval(intervalID);
        resolve(messages);
        log.success('ADDED ALL MESSAGES!');
        log.success('DOWNLOADING...');
        downloadJSON(messages, 'messages.json', beautify);
        return;
      }

      const length = messages.push(getMessage(currentElement));
      currentElement = currentElement.nextElementSibling;

      if (!(length % 10)) {
        log.info('MESSAGES ADDED: ', length);
      }
    }, delay);
  });
}

function getMessage(element) {
  return {
    date: getMessageDate(element),
    image: element.querySelector('img')?.src || last(messages)?.image,
    text: getMessageText(element),
    username: getMessageUsername(element),
  };
}

function getMessageDate(element) {
  const container = element.querySelector('h2 time') || element.querySelector('span time');
  return container?.dateTime ? new Date(container.dateTime) : last(messages)?.date;
}

function getMessageText(element) {
  const container = element.querySelector('h2 + div') || element.querySelector('span + div');
  return container?.innerText;
}

function getMessageUsername(element) {
  const container = element.querySelector('h2');
  return container?.children?.[0]?.innerText || last(messages)?.username;
}

function last(list) {
  return list[list.length - 1];
}

function isMessage(element) {
  return includesClass(element, 'cozyMessage');
}

function isDivider(element) {
  return includesClass(element, 'divider');
}

function includesClass(element, className) {
  return element ? Array(...element.classList).some((currentClass) => currentClass.includes(className)) : false;
}

const downloadJSON = (data, filename, beautify) => {
  const json = JSON.stringify(data, ...(beautify ? [null, 2] : []));
  const blob = new Blob([json], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove()
};
