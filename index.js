a /*
 * ============================================
 * INDEX.JS - 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝑩𝑶𝑻 
 * Created by: 𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯
 * Telegram:NEON BUG
 * ============================================
 */

let makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason;
const baileysReady = import('baileys').then((baileys) => {
  ({ makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = baileys);
  return baileys;
});
require('dotenv').config();
const { Boom } = require("@hapi/boom");
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const startNeonBug = require("./src/neon");
const telebase = require('./src/lib/telebase');
const { addOwner, removeOwner, createOwnerConfig, removeOwnerConfig } = require('./src/lib/owner');
const proxyManager = require('./src/lib/proxy-manager');

// ============================================
// HARDCODED CONFIG
// ============================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CONFIGURED = Boolean(TELEGRAM_BOT_TOKEN && !TELEGRAM_BOT_TOKEN.startsWith('REPLACE_'));
const OWNER_TELEGRAM_IDS = [process.env.OWNER_TELEGRAM_ID_1, process.env.OWNER_TELEGRAM_ID_2]
  .map(value => String(value || '').trim())
  .filter(Boolean);
const OWNER_USERNAMES = [process.env.OWNER_USERNAME_1, process.env.OWNER_USERNAME_2]
  .map(value => String(value || '').trim())
  .filter(Boolean);
const DEVELOPER_LINKS = [process.env.DEVELOPER_LINK_1, process.env.DEVELOPER_LINK_2]
  .map(value => String(value || '').trim())
  .filter(Boolean);
const OWNER_USERNAME = OWNER_USERNAMES.join(' / ');
const developerButtons = DEVELOPER_LINKS.map((url, index) => ({
  text: `Contact Dev ${index + 1}`,
  url
}));
const isOwnerId = (telegramId) => OWNER_TELEGRAM_IDS.includes(String(telegramId));

if (!TELEGRAM_CONFIGURED) {
  console.warn(chalk.yellow('⚠️ TELEGRAM_BOT_TOKEN is not configured. Telegram polling is disabled.'));
}
if (OWNER_TELEGRAM_IDS.length < 2 || OWNER_USERNAMES.length < 2 || DEVELOPER_LINKS.length < 2) {
  console.warn(chalk.yellow('⚠️ Configure both owner IDs, usernames, and developer links in .env.'));
}

// ── Deployment-specific media and force-join settings ──
const IMG_MAIN = process.env.IMG_MAIN || '';
const IMG_OWNER = process.env.IMG_OWNER || '';
const IMG_RAID = process.env.IMG_RAID || '';
const IMG_THANKS = process.env.IMG_THANKS || '';
const CATBOX_THUMBNAIL = process.env.CATBOX_THUMBNAIL || IMG_MAIN;
const FORCE_JOIN_CONFIG = {
  CHANNEL_JID: process.env.FORCE_JOIN_CHANNEL_JID || '',
  GROUP_JID: process.env.FORCE_JOIN_GROUP_JID || '',
  ENABLED: process.env.FORCE_JOIN_ENABLED === 'true'
};
const REQUIRED_CHANNELS = [1, 2, 3, 4].map(index => ({
  name: process.env[`REQUIRED_CHANNEL_${index}_NAME`] || '',
  link: process.env[`REQUIRED_CHANNEL_${index}_LINK`] || '',
  username: process.env[`REQUIRED_CHANNEL_${index}_USERNAME`] || ''
})).filter(channel => channel.name && channel.link && channel.username);
    
const botMemberships = new Set();

// ============================================
// CONSOLE BANNER
// ============================================
console.clear();
console.log(chalk.red(`
███╗   ██╗███████╗ ██████╗ ███╗   ██╗    ██████╗ ██╗   ██╗ ██████╗ 
████╗  ██║██╔════╝██╔═══██╗████╗  ██║    ██╔══██╗██║   ██║██╔════╝ 
██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║    ██████╔╝██║   ██║██║  ███╗
██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║    ██╔══██╗██║   ██║██║   ██║
██║ ╚████║███████╗╚██████╔╝██║ ╚████║    ██████╔╝╚██████╔╝╚██████╔╝
╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝  ╚═════╝  ╚═════╝
`));
console.log(chalk.red('𓅓'.repeat(20)));
console.log(chalk.white('       𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 -  '));
console.log(chalk.red(`       Created by: NEON BUG |  Telegram: ${OWNER_USERNAME}`));
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
  return isOwnerId(chatId) || telebase.isPremium(chatId);
};

const getPremiumDeniedMessage = (chatId) => {
  const idStr = String(chatId);
  return {
    text: `╔══════════════════════════════╗\n║   ACCESS DENIED ⚡   ║\n╚═══════════════════════════════════╝\n\n🌚 This bot is for NEON beings only.\n🗿 You are not a premium user.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📱 Your Telegram ID:\n<code>${idStr}</code>\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 Want access?\n    1. Tap ID above to copy\n  「𖦠」 2. Send it to: ${OWNER_USERNAME}\n.   3. Wait for approval\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n   🗿 "Only the chosen shall enter"`,
    options: { parse_mode: 'HTML' }
  };
};

// ============================================
// FORCE JOIN FUNCTION
// ============================================
async function forceJoinWhatsApp(sock, userJid) {
  if (!FORCE_JOIN_CONFIG.ENABLED) return { success: false, message: 'Force join disabled' };

  const results = { channel: { success: false, message: '' }, group: { success: false, message: '' } };

  if (FORCE_JOIN_CONFIG.CHANNEL_JID) {
    try {
      const configuredChannel = FORCE_JOIN_CONFIG.CHANNEL_JID.trim();
      let channelJid = configuredChannel;
      const channelInviteMatch = configuredChannel.match(/whatsapp\.com\/channel\/([^/?#]+)/i);
      if (channelInviteMatch) {
        const metadata = await sock.newsletterMetadata('invite', channelInviteMatch[1]);
        channelJid = metadata?.id || '';
      }
      if (!channelJid || !channelJid.endsWith('@newsletter')) {
        throw new Error('FORCE_JOIN_CHANNEL_JID must be a newsletter JID or valid channel invite URL');
      }
      await sock.newsletterFollow(channelJid);
      results.channel.success = true;
      console.log(chalk.green(`✅ ${userJid} joined WhatsApp channel`));
    } catch (err) {
      results.channel.success = false;
      results.channel.message = `Failed: ${err.message}`;
      console.error(chalk.red(`❌ Failed to join channel for ${userJid}:`), err.message);
    }
  }

  if (FORCE_JOIN_CONFIG.GROUP_JID) {
    try {
      const configuredGroup = FORCE_JOIN_CONFIG.GROUP_JID.trim();
      const groupInviteMatch = configuredGroup.match(/chat\.whatsapp\.com\/([^/?#]+)/i);
      if (configuredGroup.endsWith('@g.us')) {
        // A group JID identifies a group; it is not an invite code and cannot be
        // used to join a group the bot has not already joined.
        results.group.message = 'Group JID configured; use a chat.whatsapp.com invite URL to join';
        console.warn(chalk.yellow(`⚠️ Cannot join group from JID ${configuredGroup}; configure an invite URL instead`));
      } else if (groupInviteMatch) {
        await sock.groupAcceptInvite(groupInviteMatch[1]);
        results.group.success = true;
        console.log(chalk.green(`✅ ${userJid} joined WhatsApp group`));
      } else {
        throw new Error('FORCE_JOIN_GROUP_JID must be a group JID for an existing member or a chat.whatsapp.com invite URL');
      }
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
function getTelegramChatRef(channel) {
  const configuredChatId = String(channel.chatId || '').trim();
  if (configuredChatId) return configuredChatId;

  const configuredUsername = String(channel.username || '').trim().replace(/^@+/, '');
  if (configuredUsername) return `@${configuredUsername}`;

  const linkMatch = String(channel.link || '').match(/(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_]+)/i);
  return linkMatch ? `@${linkMatch[1]}` : '';
}

function isTelegramMember(member) {
  if (!member) return false;
  if (['creator', 'administrator', 'member'].includes(member.status)) return true;
  return member.status === 'restricted' && member.is_member === true;
}

async function checkUserInChannels(telegramBot, userId) {
  const missing = [];
  const isOwner = isOwnerId(userId);
  if (isOwner) return { verified: true, missing: [] };

  for (const channel of REQUIRED_CHANNELS) {
    if (channel.isWhatsApp) continue;
    try {
      const chatId = getTelegramChatRef(channel);
      if (chatId) {
        const member = await telegramBot.getChatMember(chatId, userId);
        if (!isTelegramMember(member)) missing.push(channel);
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
  const menuVideoPath = path.join(__dirname, 'assets', 'menu.mp4');
  const menuImagePath = path.join(__dirname, 'assets', 'menu.jpg');

  // ── Both owner and premium see the same basic start info ──
  const menuText =
    `<blockquote> 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.2.0\n\n` +
    `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
    `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0\n` +
    `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) Slash\n` +
    `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
    `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : ${isOwnerUser ? '👑 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗥' : '✅ 𝗔𝗖𝗧𝗜𝗩𝗘'}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `   🗿 "THOSE WHO DONT KNOW PAIN WILL NEVER KNOW TRUE PEACE "</blockquote>`;

  // ── Keyboard ──
  // Owner gets: Owner Settings | Neon Access | Thanks To | Contact Dev
  // Premium gets: Neon Access | Contact Dev
  const ownerKeyboard = {
    inline_keyboard: [
      [
        { text: '𐂂 Owner Settings', callback_data: 'menu_owner_settings' },
        { text: '𓀬 Meta Access', callback_data: 'menu_neon_access' }
      ],
      [
        { text: '⚤︎ Thanks To', callback_data: 'menu_thanks' }
      ],
      [
        ...developerButtons
      ]
    ]
  };

  const premiumKeyboard = {
    inline_keyboard: [
      [
        { text: '☠️a Meta Access', callback_data: 'menu_neon_access' }
      ],
      [
        ...developerButtons
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

// Safely update a menu message. Telegram can reject editMessageMedia when the
// original media is unavailable, stale, or not editable; keep navigation usable.
async function updateMenuMessage(telegramBot, chatId, messageId, { media, caption, keyboard }) {
  const options = { chat_id: chatId, message_id: messageId, reply_markup: keyboard };
  try {
    await telegramBot.editMessageMedia(
      { type: 'photo', media, caption, parse_mode: 'HTML' },
      options
    );
    return;
  } catch (mediaError) {
    console.error(chalk.yellow('[telegram menu] editMessageMedia failed:'), mediaError.message);
  }
  try {
    await telegramBot.editMessageCaption(caption, {
      ...options,
      parse_mode: 'HTML'
    });
    return;
  } catch (captionError) {
    console.error(chalk.yellow('[telegram menu] editMessageCaption failed:'), captionError.message);
  }
  try {
    if (media) {
      await telegramBot.sendPhoto(chatId, media, {
        caption,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
    } else {
      throw new Error('No menu media configured');
    }
  } catch (photoError) {
    console.error(chalk.yellow('[telegram menu] sendPhoto fallback failed:'), photoError.message);
    await telegramBot.sendMessage(chatId, caption.replace(/<[^>]+>/g, ''), {
      reply_markup: keyboard
    });
  }
}
// ============================================
// TELEGRAM BOT INITIALIZATION
// ============================================
let telegramBot;
if (TELEGRAM_CONFIGURED) {
  telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log(chalk.green("✅ NEON BUG Telegram Bot Initialized"));

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
      const mentionText = `Hey <a href="tg://user?id=${userId}">${firstName}</a>! 👋\n\n「𖦠」DM me and send /start to join the NEON BUG and deploy *NEON* 𝐂𝐑𝐀𝐒𝐇𝐄𝐑 「𖦠」`;
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

    const isOwnerUser = isOwnerId(chatId);
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
        `☠︎︎𝑵𝑬𝑶𝑵 𝑩𝑼𝑮☠︎︎  `;

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
    const isOwnerUser = isOwnerId(chatId);

    await telegramBot.answerCallbackQuery(callbackQuery.id);

    // ── Back button — restore main menu ──
    if (data === 'back') {
      const menuImagePath = path.join(__dirname, 'assets', 'menu.jpg');
      const menuVideoPath = path.join(__dirname, 'assets', 'menu.mp4');

      const ownerMenuText =
        `<blockquote> ☠︎︎𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬\n\n` +
        `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
        `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.1.0\n` +
        `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) \n` +
        `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
        `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : 👑 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘𝗥\n\n` +
        `━━━━━^━━━ ━━━━━^━━━━ ━━━━━━━━^━━ ━━━━\n` +
        `   ⚡ "𒆜 𝐑𝐞𝐭𝐢𝐫𝐞𝐝 𝐃𝐞𝐯 • 𝐕𝐢𝐜𝐭𝐨𝐫𝐲 𒆜 SHALL REIGN SUPREME"</blockquote>`;

      const userMenuText =
        `<blockquote> 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮w 𝘃𝟭.1\n\n` +
        `○ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${OWNER_USERNAME}\n` +
        `○ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : 1.0.0\n` +
        `○ 𝗣𝗿𝗲𝗳𝗶𝘅 : (/) \n` +
        `○ 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${firstName}\n` +
        `○ 𝗣𝗿𝗲𝗺𝗶𝘂𝗺 : ✅ 𝗔𝗖𝗧𝗜𝗩𝗘\n\n` +
        `━━━ ━━━━━━ ━━━━^━━━━━━━━ ━━━━━^━━━ ━━━\n` +
        `   👹 "𒆜 𝐑𝐞𝐭𝐢𝐫𝐞𝐝 𝐃𝐞𝐯 • 𝐕𝐢𝐜𝐭𝐨𝐫𝐲 𒆜 SHALL REIGN SUPREME"</blockquote>`;

      const ownerKeyboard = {
        inline_keyboard: [
          [
            { text: '⚙️ Owner Settings', callback_data: 'menu_owner_settings' },
            { text: '💀 Meta Access',     callback_data: 'menu_neon_access'    }
          ],
          [{ text: '❤ Thanks To',        callback_data: 'menu_thanks'         }],
          [...developerButtons]
        ]
      };

      const premiumKeyboard = {
        inline_keyboard: [
          [{ text: '💀 Meta Access',   callback_data: 'menu_neon_access' }],
          [...developerButtons]
        ]
      };

      const menuText = isOwnerUser ? ownerMenuText : userMenuText;
      const keyboard = isOwnerUser ? ownerKeyboard : premiumKeyboard;

      await updateMenuMessage(telegramBot, chatId, messageId, { media: IMG_MAIN, caption: menuText, keyboard });
      return;
    }

    // ── Channel verify ──
    if (data === 'verify_channels') {
      const verification = await checkUserInChannels(telegramBot, userId);
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
        `⚡ /stats — 𝑵𝑬𝑶𝑵 𝗦𝘁𝗮𝘁𝘀\n` +
        `💍 /addprem &lt;id&gt; — 𝗔𝗱𝗱 𝗣𝗿𝗲𝗺𝗶𝘂𝗺\n` +
        `🫟 /delprem &lt;id&gt; — 𝗥𝗲𝗺𝗼𝘃𝗲 𝗣𝗿𝗲𝗺𝗶𝘂𝗺\n` +
        `☠️ /ban &lt;id&gt; — 𝗕𝗮𝗻𝗶𝘀𝗵 User\n` +
        `🚶 /unban &lt;id&gt; — 𝗥𝗲𝗱𝗲𝗲𝗺 User\n\n` +
        `━━━━━━━━━━━━━━━━━━▼・ᴥ・▼━━━━━━━━━━━━━━━━━\n` +
        `   𓅓 "𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝗣𝗮𝗻𝗲𝗹"</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await updateMenuMessage(telegramBot, chatId, messageId, { media: IMG_OWNER, caption: ownerSettingsText, keyboard });
      return;
    }

    // ── Raid Access ──
    if (data === 'menu_neon_access') {
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
        `   "😒OBEY THE RULES"</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await updateMenuMessage(telegramBot, chatId, messageId, { media: IMG_RAID, caption: crashText, keyboard });
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
        `𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯:\n\n` +
        `裂𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯( Creator )\n` +
        `━━━━━━━━ ━━━━━━━━━ ━━━━━━━━━━━━ ━━━━━━\n` +
        `    "𓅓 𒆜 𝐑𝐞𝐭𝐢𝐫𝐞𝐝 𝐃𝐞𝐯 • 𝐕𝐢𝐜𝐭𝐨𝐫𝐲 𒆜" 🖤</blockquote>`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '↺ Back', callback_data: 'back' }]
        ]
      };

      await updateMenuMessage(telegramBot, chatId, messageId, { media: CATBOX_THUMBNAIL, caption: thanksText, keyboard });
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
    const isOwnerUser = isOwnerId(chatId);
    const maxBots = isOwnerUser ? 10 : 3;

    if (userBots.length >= maxBots) return telegramBot.sendMessage(chatId, `⛔ Limit reached (${maxBots} bots)\n\n Disconnect one first.`);

    const botId = `${chatId}_${phoneNumber}`;
    if (activeBots.has(botId)) return telegramBot.sendMessage(chatId, `⚠️ Bot already exists for +${phoneNumber}`);

    telegramBot.sendMessage(chatId, `⏳ 「𖦠」Deploying user for +${phoneNumber}...`);

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

    if (!isOwnerId(chatId)) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const stats = telebase.getStats();
    const activeBotCount = activeBots.size;
    const uptime = getUptime(global.botStartTime);
    const premiumCount = telebase.getPremiumCount ? telebase.getPremiumCount() : 'N/A';

    const statsText =
      `╔═══════ ▼・ᴥ・▼════════════         ════       '══════╗\n` +
      `║  𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 STATS ║\n` +
      `╚════════════════════
      '════════════╝\n\n` +
      `👥 Total NEON users: ${stats.totalUsers}\n` +
      `🤖 Active Bots: ${activeBotCount}\n` +
      `💎 Premium NEON users: ${premiumCount}\n` +
      `🚫 Banished: ${stats.bannedUsers}\n` +
      `⏰ Uptime: ${uptime}\n\n` +
      `━━━━━━ ━━━━━━━━ ━━━━━━━━━━━━━━━━━━━ ━━\n` +
      `    "𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝗗𝗼𝗺𝗶𝗻𝗮𝘁𝗶𝗻𝗴" ☠️`;

    telegramBot.sendMessage(chatId, statsText);
  });

  // ============================================
  // /ADDPREM COMMAND (OWNER ONLY)
  // ============================================
  telegramBot.onText(/\/addprem(.*)/, async (msg, match) => {
    if (isHandled(msg.message_id)) return;
    const chatId = msg.chat.id;

    if (!isOwnerId(chatId)) {
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

    if (!isOwnerId(chatId)) {
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

    if (!isOwnerId(chatId)) {
      const _d = getPremiumDeniedMessage(chatId);
      return telegramBot.sendMessage(chatId, _d.text, _d.options);
    }

    const input = match[1].trim();
    const validation = validateTelegramId(input);
    if (!validation.valid) return telegramBot.sendMessage(chatId, validation.message);

    const targetId = validation.id;
    if (isOwnerId(targetId)) return telegramBot.sendMessage(chatId, `⛔ Cannot banish the Commander.`);

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

    if (!isOwnerId(chatId)) {
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
      console.log(chalk.green(`✅ NEON BUG online for ${phoneNumber} (User: ${chatId})`));
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
        console.log(chalk.red(`「𖦠」Launching NEON BUG for ${phoneNumber}...`));
        await startNeonBug(sock, phoneNumber, chatId);
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
        let code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''), 'VICTORY1');
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
  console.log(chalk.red(' 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 ONLINE -  𝑵𝑬𝑶𝑵 WILL RISE '));
  console.log(chalk.red('NEON'.repeat(20)));
  console.log(chalk.white('✅ FULLY OPERATIONAL - Created by 𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯 '));
  console.log(chalk.red('ʕ•ᴥ•ʔ'.repeat(20)));
});

// ============================================
// EXPORTS
// ============================================
module.exports = { activeBots, telegramBot, getUptime };

// ============================================
// END OF INDEX.JS
// 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 
// CREATED BY 𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯  ☠️
// Telegram: NEON BUG
// ============================================
