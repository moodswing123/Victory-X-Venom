/*
 * ============================================
 * HELPERS.JS (UPDATED)
 * ============================================
 */

const fs = require('fs-extra');
const path = require('path');
const parseMs = require('parse-ms');
const os = require('os');
const owner = require('./owner');

// ============================================
// DATABASE FUNCTIONS
// ============================================
const loadDatabase = (file) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'database', file);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  } catch (e) {
    console.error(`⚠️ Error loading ${file}:`, e);
    return null;
  }
};

let verificationDataCache = null;
let verificationSaveTimer = null;

const getVerificationData = () => {
  if (!verificationDataCache) {
    verificationDataCache = loadDatabase('verification.json') || { groups: {}, pending: {} };
  }
  return verificationDataCache;
};

const persistVerificationData = () => {
  if (verificationDataCache) {
    const snapshot = JSON.parse(JSON.stringify(verificationDataCache));
    saveDatabase('verification.json', snapshot);
  }
};

const scheduleVerificationPersist = () => {
  if (verificationSaveTimer) clearTimeout(verificationSaveTimer);
  verificationSaveTimer = setTimeout(() => {
    persistVerificationData();
  }, 500);
};

const saveDatabase = (file, data) => {
  try {
    const filePath = path.join(__dirname, '..', '..', 'database', file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error(`⚠️ Error saving ${file}:`, e);
    return false;
  }
};

const addVerificationPending = (participant, verifyEntry) => {
  const data = getVerificationData();
  if (!data.pending) data.pending = {};
  data.pending[participant] = verifyEntry;
  scheduleVerificationPersist();
  return true;
};

const getVerificationPending = (participant) => {
  const data = getVerificationData();
  return data?.pending?.[participant] || null;
};

const deleteVerificationPending = (participant) => {
  const data = getVerificationData();
  if (data?.pending?.[participant]) {
    delete data.pending[participant];
    scheduleVerificationPersist();
    return true;
  }
  return false;
};

const updateVerificationPending = (participant, updates) => {
  const data = getVerificationData();
  if (data?.pending?.[participant]) {
    Object.assign(data.pending[participant], updates);
    scheduleVerificationPersist();
    return true;
  }
  return false;
};

const isVerificationEnabled = (groupId) => {
  const data = getVerificationData();
  return data?.groups?.[groupId]?.enabled || false;
};

const setVerificationEnabled = (groupId, enabled) => {
  const data = getVerificationData();
  if (!data.groups) data.groups = {};
  if (enabled) {
    data.groups[groupId] = { enabled: true };
  } else {
    delete data.groups[groupId];
  }
  scheduleVerificationPersist();
  return true;
};

// ============================================
// OWNER FUNCTIONS (from owner.js)
// ============================================
const normalizeNumber = owner.normalizeNumber;
const isOwner = (sender, groupMetadata = null) => owner.isOwner(sender, groupMetadata);
const isSudo = (sender, groupMetadata = null) => owner.isSudo(sender, groupMetadata);
const addOwner = owner.addOwner;
const removeOwner = owner.removeOwner;
const getOwnerNumbers = owner.getOwnerNumbers;
const isOwnerOfThisBot = owner.isOwnerOfThisBot;

const getOwnerConfig = owner.getOwnerConfig;
const setOwnerConfig = owner.setOwnerConfig;
const createOwnerConfig = owner.createOwnerConfig;
const removeOwnerConfig = owner.removeOwnerConfig;
const getOwnerMode = owner.getOwnerMode;
const getOwnerPrefix = owner.getOwnerPrefix;
const resolveOwnerNumber = owner.resolveOwnerNumber;
const getOwnerSudoUsers = owner.getOwnerSudoUsers;
const addOwnerSudoUser = owner.addOwnerSudoUser;
const removeOwnerSudoUser = owner.removeOwnerSudoUser;
const isOwnerSudoUser = owner.isOwnerSudoUser;
const canUseInSelfMode = owner.canUseInSelfMode;
const getMatchingOwnerNumber = owner.getMatchingOwnerNumber;

// ============================================
// ADMIN CHECK FUNCTIONS
// ============================================

// ── Shared JID cleaner: strips device suffix ──
// "2348xxx:15@s.whatsapp.net" → "2348xxx@s.whatsapp.net"
const cleanJid = (jid = '') => jid.replace(/:\d+@/, '@');

// ── Check if a specific user JID is admin in a group ──
// Checks both p.id AND p.jid to cover lid + phone formats
const isAdmin = async (sock, groupId, userId) => {
  try {
    const meta = await sock.groupMetadata(groupId);
    const cleanUser = cleanJid(userId);
    const participant = meta.participants.find(p => {
      const pId  = cleanJid(p.id);
      const pJid = cleanJid(p.jid || '');
      return pId === cleanUser || pJid === cleanUser;
    });
    return !!(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));
  } catch (e) {
    console.error('[isAdmin] Error:', e.message);
    return false;
  }
};

// ── Check if the bot owner number is admin in a group ──
const isOwnerAdmin = async (sock, groupId) => {
  try {
    const ownerData = loadDatabase('owner.json');
    if (!ownerData || !ownerData.owner) return false;
    const meta = await sock.groupMetadata(groupId);
    const cleanOwner = cleanJid(normalizeNumber(ownerData.owner) + '@s.whatsapp.net');
    const participant = meta.participants.find(p => {
      const pId  = cleanJid(p.id);
      const pJid = cleanJid(p.jid || '');
      return pId === cleanOwner || pJid === cleanOwner;
    });
    return !!(participant && (participant.admin === 'admin' || participant.admin === 'superadmin'));
  } catch (e) {
    console.error('[isOwnerAdmin] Error:', e.message);
    return false;
  }
};

// ── Check if the bot itself is admin in a group ──
// Handles @lid format, device suffix, and creds.me.lid fallback
const isBotAdmin = async (sock, groupId) => {
  try {
    const rawBotId = sock?.user?.id;
    if (!rawBotId) {
      console.log('[isBotAdmin] No bot ID found');
      return false;
    }

    // Clean the bot's own JID — strip device suffix
    const botJid = cleanJid(rawBotId);

    // Also grab the bot's lid from creds (paired number lid)
    const rawLid = sock?.authState?.creds?.me?.lid;
    const botLid = rawLid ? cleanJid(rawLid) : null;

    console.log(`[isBotAdmin] botJid: ${botJid} | botLid: ${botLid || 'none'}`);

    const meta = await sock.groupMetadata(groupId);

    const participant = meta.participants.find(p => {
      const pId  = cleanJid(p.id);
      const pJid = cleanJid(p.jid || '');

      const matchesJid = pId === botJid || pJid === botJid;
      const matchesLid = botLid && (pId === botLid || pJid === botLid);

      return matchesJid || matchesLid;
    });

    if (!participant) {
      console.log('[isBotAdmin] Bot not found in group participants');
      return false;
    }

    const result = participant.admin === 'admin' || participant.admin === 'superadmin';
    console.log(`[isBotAdmin] Found: ${participant.id} | Admin: ${result}`);
    return result;

  } catch (e) {
    console.error('[isBotAdmin] Error:', e.message);
    return false;
  }
};

// ── Check owner/bot admin status with optional pre-fetched metadata ──
const checkOwnerAdminStatus = async (sock, groupId, botPhoneNumber, groupMetadata = null) => {
  try {
    const meta = groupMetadata || await sock.groupMetadata(groupId);
    const cleanOwner = cleanJid(normalizeNumber(botPhoneNumber) + '@s.whatsapp.net');

    // Also get bot lid for fallback
    const rawLid = sock?.authState?.creds?.me?.lid;
    const botLid = rawLid ? cleanJid(rawLid) : null;

    const participant = meta.participants.find(p => {
      const pId  = cleanJid(p.id);
      const pJid = cleanJid(p.jid || '');
      const matchesOwner = pId === cleanOwner || pJid === cleanOwner;
      const matchesLid   = botLid && (pId === botLid || pJid === botLid);
      return matchesOwner || matchesLid;
    });

    if (!participant) {
      return { found: false, isAdmin: false };
    }

    const isAdminStatus = participant.admin === 'admin' || participant.admin === 'superadmin';
    return { found: true, isAdmin: isAdminStatus };
  } catch (e) {
    console.error('Error checking owner admin status:', e);
    return { found: false, isAdmin: false };
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatUptime = (uptime) => {
  const time = parseMs(uptime);
  return `${time.days}ᴅ ${time.hours}ʜ ${time.minutes}ᴍ ${time.seconds}ꜱ`;
};

const getRAMUsage = () => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const total = os.totalmem() / 1024 / 1024 / 1024;
  return {
    used: used.toFixed(2),
    total: total.toFixed(2)
  };
};

const getPrefix = () => {
  return '.';
};

const getMode = () => {
  return 'self';
};

const isGroup = (jid) => {
  return jid.endsWith('@g.us');
};

const extractNumber = (text) => {
  const match = text.match(/\d+/g);
  return match ? match.join('') : null;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ensureAdmin = async (sock, groupId, sender) => {
  try {
    if (isOwner(sender)) return true;
    if (isSudo(sender)) return true;
    const senderAdmin = await isAdmin(sock, groupId, sender);
    if (senderAdmin) return true;
    return false;
  } catch (e) {
    console.error('⚠️ Error checking admin permissions:', e);
    return false;
  }
};

const accessDeniedMessage = () => {
  return `✘ ${toBoldItalic('ACCESS DENIED you')} ${toBoldItalic(randomCuss())}! ${demonEmoji()}

${toBoldItalic('Only admins/owner can use this command')} 🔥`;
};

const botNeedsAdminMessage = (action = 'perform this action') => {
  return `✘ ${toBoldItalic('Bot needs admin to')} ${toBoldItalic(action)} ${randomCuss()}! ${demonEmoji()}`;
};

const getTarget = (msg) => {
  try {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (mentioned.length > 0) {
      return mentioned;
    }
    
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
    if (quotedMsg?.participant) {
      return [quotedMsg.participant];
    } else if (quotedMsg?.remoteJid && !quotedMsg.remoteJid.endsWith('@g.us')) {
      return [quotedMsg.remoteJid];
    }
    
    return [];
  } catch (e) {
    console.error('⚠️ Error extracting target:', e);
    return [];
  }
};

// ============================================
// TEXT STYLING FUNCTIONS
// ============================================
const toSmallCaps = (text) => {
  const smallCapsMap = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ',
    'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
    'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
    'y': 'ʏ', 'z': 'ᴢ',
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ',
    'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ',
    'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x',
    'Y': 'ʏ', 'Z': 'ᴢ'
  };
  
  return text.split('').map(char => smallCapsMap[char] || char).join('');
};

// ADDED: toMonospace function for anti-features
const toMonospace = (text) => {
  const monospaceMap = {
    'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷',
    'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿',
    'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇',
    'Y': '𝚈', 'Z': '𝚉',
    'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑',
    'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙',
    'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡',
    'y': '𝚢', 'z': '𝚣',
    '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽',
    '8': '𝟾', '9': '𝟿'
  };
  return text.split('').map(char => monospaceMap[char] || char).join('');
};

// ============================================
// DEMON BOT STYLING - Mathematical Bold Italic + Dark Theme
// ============================================
const toBoldItalic = (text) => {
  const boldItalicMap = {
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
  return text.split('').map(char => boldItalicMap[char] || char).join('');
};

// Demon emojis for dark theme
const DEMON_EMOJIS = ['👿', '👹', '👺', '☠️', '💀', '🔥', '⚰️', '🩸', '😈', '🦇'];

// Random demon emoji picker
const demonEmoji = () => DEMON_EMOJIS[Math.floor(Math.random() * DEMON_EMOJIS.length)];

// Random cuss insults for wrong command usage
const CUSS_INSULTS = [
  "dumbass", "idiot", "moron", "fool", "stupid ass", "brainless mf",
  "dense mf", "clown", "dummy", "wasted sperm", "empty vessel", "blockhead",
  "foolish kid", "bonehead", "airhead", "goofy kid", "smooth brain"
];

const randomCuss = () => CUSS_INSULTS[Math.floor(Math.random() * CUSS_INSULTS.length)];

// Demon validation message generator
const demonReply = (title, description, usage = null, options = null) => {
  const de = demonEmoji();
  let msg = `${de} ${toBoldItalic(title.toUpperCase())} ${de}\n\n`;
  msg += `${toBoldItalic(description)}\n`;
  
  if (usage) {
    msg += `\n🔥 ${toBoldItalic('Usage')}: ${toBoldItalic(usage)}`;
  }
  
  if (options) {
    msg += `\n\n⛧ ${toBoldItalic('Options')}:\n${options}`;
  }
  
  return msg;
};

// Demon error message for wrong usage
const demonError = (command, correctUsage, hint = null) => {
  const de = demonEmoji();
  const cuss = randomCuss();
  let msg = `${de} ${toBoldItalic('WRONG USAGE YOU')} ${toBoldItalic(cuss.toUpperCase())}! ${de}\n\n`;
  msg += `🔥 ${toBoldItalic('Correct')}: ${toBoldItalic(correctUsage)}\n`;
  
  if (hint) {
    msg += `\n☠️ ${toBoldItalic(hint)}`;
  }
  
  return msg;
};

// Demon success message
const demonSuccess = (message) => {
  return `✓ ${toBoldItalic(message)}`;
};

// Demon fail message  
const demonFail = (message) => {
  return `✘ ${toBoldItalic(message)}`;
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  loadDatabase,
  saveDatabase,
  getVerificationData,
  addVerificationPending,
  getVerificationPending,
  deleteVerificationPending,
  updateVerificationPending,
  isVerificationEnabled,
  setVerificationEnabled,
  persistVerificationData,
  isOwner,
  isSudo,
  addOwner,
  removeOwner,
  getOwnerNumbers,
  isOwnerOfThisBot,
  getOwnerConfig,
  setOwnerConfig,
  createOwnerConfig,
  removeOwnerConfig,
  getOwnerMode,
  getOwnerPrefix,
  resolveOwnerNumber,
  getOwnerSudoUsers,
  addOwnerSudoUser,
  removeOwnerSudoUser,
  isOwnerSudoUser,
  canUseInSelfMode,
  getMatchingOwnerNumber,
  isAdmin,
  isOwnerAdmin,
  isBotAdmin,
  checkOwnerAdminStatus,
  cleanJid,
  formatUptime,
  getRAMUsage,
  getPrefix,
  getMode,
  isGroup,
  extractNumber,
  sleep,
  getTarget,
  toSmallCaps,
  toMonospace,
  toBoldItalic,
  demonEmoji,
  randomCuss,
  demonReply,
  demonError,
  demonSuccess,
  demonFail,
  DEMON_EMOJIS,
  ensureAdmin,
  accessDeniedMessage,
  botNeedsAdminMessage
};

// ============================================
// END OF HELPERS.JS
// 👿 UPDATED BY ᴍʏsᴛɪᴄ 
// ============================================