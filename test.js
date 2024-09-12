const TOKEN = '7499228143:AAGwQq-cLs0nq6UoeQMY2rfxHtbXwPqVN4o';
const ADMIN_ID = '5002209911';  // Replace with your actual admin Telegram ID
const TARGET_CHANNEL_ID = '@pu_incognito_channel';  // Target channel where messages are sent
const ADMIN_CHANNEL_ID = '-1002150738938';  // Admin channel where messages with user info are sent



let replyStore = new Map();
let blockedUsers = new Set();

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === 'POST') {
    const update = await request.json();

    if (update.message) {
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;
      const messageText = update.message.text;  

      if (blockedUsers.has(userId)) {
        await sendMessage(chatId, "You are blocked.");
        return new Response('User blocked', { status: 200 });
      }

      if (messageText && messageText.startsWith('/')) {
        await handleCommand(update);
        return new Response('Command processed', { status: 200 });
      }

      // Check if this is a reply step
      if (replyStore.has(userId)) {
        const { step, originalMessageLink } = replyStore.get(userId);
        
        if (step === 1) {
          // User sent the link of the original message
          replyStore.set(userId, { step: 2, originalMessageLink: messageText });
          await sendMessage(chatId, "Please send the reply message.");
        } else if (step === 2) {
          // User is sending the actual reply
          await replyToMessage(originalMessageLink, messageText);
          await sendMessage(chatId, "Your reply has been sent to the channel.");
          replyStore.delete(userId);
        }
        return new Response('Reply processed', { status: 200 });
      }
    }

    return new Response('Invalid update', { status: 400 });
  }

  return new Response('OK', { status: 200 });
}
async function handleCommand(update) {
  const chatId = update.message.chat.id;
  const userId = update.message.from.id;
  const messageText = update.message.text;

  if (userId == ADMIN_ID) {
    if (messageText.startsWith('/block')) {
      const userIdToBlock = messageText.split(' ')[1];
      blockedUsers.add(userIdToBlock);
      await sendMessage(chatId, `User ${userIdToBlock} has been blocked.`);
    } else if (messageText.startsWith('/unblock')) {
      const userIdToUnblock = messageText.split(' ')[1];
      
      if (blockedUsers.has(userIdToUnblock)) {
        blockedUsers.delete(userIdToUnblock);
        await sendMessage(chatId, `User ${userIdToUnblock} has been unblocked.`);
      } else {
        await sendMessage(chatId, `User ${userIdToUnblock} was not blocked.`);
      }
    } else {
      await sendMessage(chatId, "Unknown admin command.");
    }
  } else if (messageText.startsWith('/reply')) {
    // Start the reply process
    replyStore.set(userId, { step: 1 });
    await sendMessage(chatId, "Please send the link of the message you want to reply to.");
  } else {
    await sendMessage(chatId, "You are not authorized to use this command.");
  }
}

async function replyToMessage(originalMessageLink, replyText) {
  // Extract chat ID and message ID from the link
  const [chatId, messageId] = parseLink(originalMessageLink);

  // Send the reply
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: replyText,
      reply_to_message_id: messageId
    })
  });

  return await response.json();
}

function parseLink(link) {
  // Assuming the link is in the format https://t.me/channel/1234
  const parts = link.split('/');
  const messageId = parts.pop();
  const chatId = '@' + parts.pop(); // Assuming the chatId is the second last part

  return [chatId, messageId];
}

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });

  return await response.json();
}
