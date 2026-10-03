 /*
 * ============================================
 * ANTI-FEATURES.JS - 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮
 * ☠️ NEON BUG MODULES ☠️
 * Created by: NEON BUG
 * Telegram: NEON BUG
 * ============================================
 */

const helpers = require('./helpers');
const { getOwnerConfig, resolveOwnerNumber } = require('./owner');
const chalk = require('chalk');

// ============================================
// NEON BUG BRANDING
// ============================================
const WHATSAPP_CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbBzT7rIXnllhwr5Ms2a';
const CATBOX_THUMBNAIL = 'https://files.catbox.moe/0jb1o3.jpg';

const getExternalAdReply = () => {
  return {
    externalAdReply: {
      title: "𓅓 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮 ",
      body: "ᴋɴᴏᴡ ᴛʜᴇ ᴘᴀɪɴ",
      thumbnailUrl: CATBOX_THUMBNAIL,
      sourceUrl: WHATSAPP_CHANNEL_LINK,
      showAdAttribution: false
    }
  };
};

const createFakeQuote = () => {
  return {
    key: {
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      fromMe: false
    },
    message: {
      conversation: "☠️ 𝑵𝑬𝑶𝑵 𝑩𝑼𝑮"
    }
  };
};

// ============================================
// ANTISPAM REPLY TEMPLATES
// ============================================
const ANTISPAM_REPLIES = [
  "sᴘᴀᴍ ᴅᴇᴛᴇᴄᴛᴇᴅ, ʏᴏᴜ sᴛᴜᴘɪᴅ ғᴜᴄᴋ! ʏᴏᴜʀ sᴘᴀᴍ ɢᴀᴍᴇ ɪs ᴡᴇᴀᴋᴇʀ ᴛʜᴀɴ ʏᴏᴜʀ ᴄʜᴀʀᴀᴄᴛᴇʀ. ᴋᴇᴇᴘ ᴛʜᴀᴛ sʜɪᴛ ᴛᴏ ʏᴏᴜʀsᴇʟғ ᴏʀ ɢᴇᴛ sᴡᴇᴘᴛ ɪɴᴛᴏ ᴛʜᴇ ᴛʀᴀsʜ ʙɪɴ.",
  "sᴛᴏᴘ ғʟᴏᴏᴅɪɴɢ ᴛʜᴇ ᴄʜᴀᴛ, ʏᴏᴜ ʙʀᴀɪɴ-ᴅᴇᴀᴅ ɪᴅɪᴏᴛ! ɴᴏʙᴏᴅʏ ᴡᴀɴᴛs ʏᴏᴜʀ ᴄᴏɴsᴛᴀɴᴛ ɴᴏɪsᴇ. sʜᴜᴛ ᴛʜᴇ ғᴜᴄᴋ ᴜᴘ.",
  "ᴛᴏᴏ ᴍᴜᴄʜ ɴᴏɪsᴇ, ʏᴏᴜ ᴇɴᴛɪᴛʟᴇᴅ ᴄʟᴏᴡɴ! ᴛʜᴇ ɴᴇᴏɴ ʙᴜɢ ᴅᴏɴ'ᴛ ᴛᴏʟᴇʀᴀᴛᴇ ʏᴏᴜʀ ᴄᴏɴsᴛᴀɴᴛ ʙᴜʟʟsʜɪᴛ."
];

const ANTISPAM_KICK_REPLIES = [
  "ʟᴇᴀʀɴ ᴛᴏ sʜᴜᴛ ᴛʜᴇ ғᴜᴄᴋ ᴜᴘ. ᴋɪᴄᴋᴇᴅ ʙʏ ɴᴇᴏɴ ʙᴜɢ.",
  "ᴀᴛᴛᴇɴᴛɪᴏɴ-sᴇᴇᴋɪɴɢ ɪᴅɪᴏᴛ ʀᴇᴍᴏᴠᴇᴅ ғᴏʀ ғʟᴏᴏᴅɪɴɢ. ɢᴏᴏᴅʙʏᴇ.",
  "ʏᴏᴜʀ ᴋᴇʏʙᴏᴀʀᴅ ᴍᴜsᴛ ʙᴇ ʙʀᴏᴋᴇɴ ʟɪᴋᴇ ʏᴏᴜʀ ʙʀᴀɪɴ. ᴋɪᴄᴋᴇᴅ."
];

// ============================================
// ANTIBOT REPLY TEMPLATES
// ============================================
const ANTIBOT_REPLIES = [
  "ʙᴏᴛ ᴜsᴀɢᴇ ᴅᴇᴛᴇᴄᴛᴇᴅ, ʏᴏᴜ ᴇɴᴛɪᴛʟᴇᴅ ᴛʀᴀsʜ! ɴᴏ ᴜɴᴀᴜᴛʜᴏʀɪᴢᴇᴅ ʙᴏᴛs ɪɴ ᴛʜᴇ ɴᴇᴏɴ ʙᴜɢ' ᴅᴏᴍᴀɪɴ.",
  "ᴏɴʟʏ ʜᴜᴍᴀɴs ᴀʟʟᴏᴡᴇᴅ, ʏᴏᴜ sᴄʀɪᴘᴛ-ʀᴜɴɴɪɴɢ ᴍᴜᴍᴜ! ɢᴇᴛ ʀᴇᴍᴏᴠᴇᴅ ᴀɴᴅ ʀᴇʙᴏᴏᴛ ʏᴏᴜʀ ᴡᴏʀᴛʜʟᴇss ᴠᴘs.",
  "ɴᴏ ʙᴏᴛs ᴘᴇʀᴍɪᴛᴛᴇᴅ ɪɴ ᴛʜᴇ ʀᴀɪᴅᴇʀs' ᴅᴏᴍᴀɪɴ!"
];

const ANTIBOT_KICK_REPLIES = [
  "ʏᴏᴜʀ ʙᴏᴛ ɪs sᴍᴀʀᴛᴇʀ ᴛʜᴀɴ ʏᴏᴜ ᴀɴᴅ ᴛʜᴀᴛ's sᴀᴅ. ᴋɪᴄᴋᴇᴅ.",
  "ᴏɴʟʏ ɴᴇᴏɴ ʙᴜɢ ᴄᴏɴᴛʀᴏʟ ʙᴏᴛs. ʏᴏᴜ'ʀᴇ ᴊᴜsᴛ ᴛʀᴀsʜ. ʀᴇᴍᴏᴠᴇᴅ.",
  "ᴜɴᴀᴜᴛʜᴏʀɪᴢᴇᴅ ʙᴏᴛ. ʏᴏᴜ'ʀᴇ ɴᴏᴛ sᴘᴇᴄɪᴀʟ ᴇɴᴏᴜɢʜ ᴛᴏ ʙᴇ ʜᴇʀᴇ."
];

// ============================================
// HELPER - RANDOM REPLY PICKER
// ============================================
const getRandomReply = (replyArray) => {
  return replyArray[Math.floor(Math.random() * replyArray.length)];
};

// ============================================
// BUG DETECTION PATTERNS
// ============================================
const BUG_PATTERNS = {
  INVISIBLE: /[\u200B-\u200D\uFEFF\u0000-\u001F\u2060-\u2069\u206A-\u206F\u180E\u17B4\u17B5\u2000-\u200F\u061C\u115F\u1160\u3164\uFFA0]/g,
  SPAM_CHARS: /(.)\1{50,}/g,
  CRASH_SYMBOLS: /[\u0E00-\u0E7F]{20,}|[\uD800-\uDFFF]{10,}|[\u0300-\u036F]{20,}/g,
  EMOJI_SPAM: /([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]){30,}/gu,
  RTL_ATTACK: /[\u202E\u202D\u200F\u200E]{3,}/g,
  FORMAT_ABUSE: /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{15,}/g,
};

// ============================================
// WARNING TRACKER
// ============================================
const getWarnings = () => {
  return helpers.loadDatabase('warnings.json') || {};
};

const saveWarnings = (warnings) => {
  helpers.saveDatabase('warnings.json', warnings);
};

const addWarning = (groupId, userId, featureType) => {
  const warnings = getWarnings();
  if (!warnings[groupId]) warnings[groupId] = {};
  if (!warnings[groupId][userId]) warnings[groupId][userId] = {};
  if (!warnings[groupId][userId][featureType]) warnings[groupId][userId][featureType] = [];
  warnings[groupId][userId][featureType].push({ timestamp: Date.now() });
  saveWarnings(warnings);
  return warnings[groupId][userId][featureType].length;
};

const getWarningCount = (groupId, userId, featureType) => {
  const warnings = getWarnings();
  return warnings[groupId]?.[userId]?.[featureType]?.length || 0;
};

const clearWarnings = (groupId, userId, featureType) => {
  const warnings = getWarnings();
  if (warnings[groupId]?.[userId]?.[featureType]) {
    delete warnings[groupId][userId][featureType];
    saveWarnings(warnings);
  }
};

/// ============================================
// HANDLE ANTIBUG
// Protects owner DMs from bug/crash attacks
// ============================================
const handleNeonAntibug = async (sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber) => {
  try {
    if (isGroupMsg) return false;
    if (msg.key.fromMe) return false;

    const ownerNumber = botPhoneNumber ? resolveOwnerNumber(botPhoneNumber, null) : null;
    if (!ownerNumber) return false;

    const ownerConfig = getOwnerConfig(ownerNumber);
    if (!ownerConfig?.antibug) return false;

    const message = msg.message || {};
    const chatId = msg.key.remoteJid;
    const fakeQuote = createFakeQuote();

    let bugDetected = null;

    // 1. newsletterAdminInviteMessage overflow
    const newsletterMsg = message.newsletterAdminInviteMessage;
    if (newsletterMsg) {
      const nameLen = (newsletterMsg.newsletterName || '').length;
      const captionLen = (newsletterMsg.caption || '').length;
      if (nameLen > 1000 || captionLen > 500) {
        bugDetected = { type: 'NEWSLETTER_OVERFLOW', severity: 'CRITICAL', detail: `Name: ${nameLen} chars, Caption: ${captionLen} chars` };
      }
    }

    // 2. interactiveResponseMessage exploit
    if (!bugDetected) {
      const interactiveMsg = message.interactiveResponseMessage;
      if (interactiveMsg) {
        const paramsJson = interactiveMsg.nativeFlowResponseMessage?.paramsJson || '';
        const bodyText = interactiveMsg.body?.text || '';
        const hasNullBytes = paramsJson.includes('\u0000') || bodyText.includes('\u0000');
        const isOversized = paramsJson.length > 10000;
        const mentionedJids = interactiveMsg.contextInfo?.mentionedJid || [];
        const massiveMentions = mentionedJids.length > 100;
        if (hasNullBytes || isOversized || massiveMentions) {
          bugDetected = { type: 'INTERACTIVE_EXPLOIT', severity: 'CRITICAL', detail: `NullBytes: ${hasNullBytes}, ParamsLen: ${paramsJson.length}, Mentions: ${mentionedJids.length}` };
        }
      }
    }

    // 3. Crash sticker
    if (!bugDetected) {
      const stickerMsg = message.stickerMessage;
      if (stickerMsg) {
        const contextInfo = stickerMsg.contextInfo || {};
        const quotedSticker = contextInfo.quotedMessage?.stickerMessage || {};
        const packNameLen = (quotedSticker.packName || '').length;
        const packIdLen = (quotedSticker.packId || '').length;
        const publisherLen = (quotedSticker.packPublisher || '').length;
        const newsletterNameLen = (contextInfo.forwardedNewsletterMessageInfo?.newsletterName || '').length;
        const dimOverflow = (stickerMsg.height > 10000 || stickerMsg.width > 10000);
        if (packNameLen > 1000 || packIdLen > 1000 || publisherLen > 1000 || newsletterNameLen > 1000 || dimOverflow) {
          bugDetected = { type: 'CRASH_STICKER', severity: 'CRITICAL', detail: `PackName: ${packNameLen}, PackId: ${packIdLen}` };
        }
      }
    }

    // 4. groupStatusMessageV2 abuse
    if (!bugDetected) {
      const groupStatusMsg = message.groupStatusMessageV2;
      if (groupStatusMsg) {
        const innerMsg = groupStatusMsg.message || {};
        const interactiveInner = innerMsg.interactiveResponseMessage;
        if (interactiveInner) {
          const paramsLen = (interactiveInner.nativeFlowResponseMessage?.paramsJson || '').length;
          const statusText = (interactiveInner.contextInfo?.groupStatusV2?.status || '').length;
          if (paramsLen > 5000 || statusText > 1000) {
            bugDetected = { type: 'GROUP_STATUS_EXPLOIT', severity: 'CRITICAL', detail: `ParamsLen: ${paramsLen}, StatusText: ${statusText}` };
          }
        }
      }
    }

    // 5. sendPaymentMessage exploit
    if (!bugDetected) {
      const paymentMsg = message.sendPaymentMessage;
      if (paymentMsg) {
        const quotedText = (paymentMsg.contextInfo?.quotedMessage?.extendedTextMessage?.text || '').length;
        const newsletterName = (paymentMsg.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || '').length;
        if (quotedText > 1000 || newsletterName > 1000) {
          bugDetected = { type: 'PAYMENT_EXPLOIT', severity: 'CRITICAL', detail: `QuotedText: ${quotedText}, NewsletterName: ${newsletterName}` };
        }
      }
    }

    // 6. extendedTextMessage newsletter overflow
    if (!bugDetected) {
      const extMsg = message.extendedTextMessage;
      if (extMsg) {
        const newsletterName = (extMsg.contextInfo?.forwardedNewsletterMessageInfo?.newsletterName || '').length;
        const textLen = (extMsg.text || '').length;
        const titleLen = (extMsg.title || '').length;
        const descLen = (extMsg.description || '').length;
        const matchedLen = (extMsg.matchedText || '').length;
        const mentionCount = (extMsg.contextInfo?.mentionedJid || []).length;
        // paymentLinkMetadata crash (cr4shUI style)
        const btnDisplay = (extMsg.paymentLinkMetadata?.button?.displayText || '').length;
        const btnId = (extMsg.paymentLinkMetadata?.button?.buttonId || '').length;
        const providerParams = (extMsg.paymentLinkMetadata?.provider?.paramsJson || '').length;
        if (
          newsletterName > 1000 ||
          textLen > 10000 ||
          titleLen > 1000 ||
          descLen > 1000 ||
          matchedLen > 5000 ||
          mentionCount > 100 ||
          btnDisplay > 1000 ||
          btnId > 1000 ||
          providerParams > 1000
        ) {
          bugDetected = { type: 'EXTENDED_TEXT_EXPLOIT', severity: 'CRITICAL', detail: `NewsletterName: ${newsletterName}, TextLen: ${textLen}, BtnDisplay: ${btnDisplay}, BtnId: ${btnId}` };
        }
      }
    }

    // 7. Carousel / viewOnce interactiveMessage overflow
    if (!bugDetected) {
      const viewOnceMsg = message.viewOnceMessage?.message || message.viewOnceMessageV2?.message;
      if (viewOnceMsg) {
        const interactiveMsg = viewOnceMsg.interactiveMessage;
        if (interactiveMsg) {
          const cards = interactiveMsg.carouselMessage?.cards || [];
          const bodyText = (interactiveMsg.body?.text || '').length;
          const buttons = interactiveMsg.nativeFlowMessage?.buttons || [];
          const buttonParamsOverflow = buttons.some(b => (b.buttonParamsJson || '').length > 5000);
          const mentionCount = (interactiveMsg.contextInfo?.mentionedJid || []).length;
          if (cards.length > 100 || bodyText > 10000 || buttonParamsOverflow || mentionCount > 100) {
            bugDetected = { type: 'VIEWONCE_INTERACTIVE_EXPLOIT', severity: 'CRITICAL', detail: `Cards: ${cards.length}, BodyLen: ${bodyText}, BtnOverflow: ${buttonParamsOverflow}, Mentions: ${mentionCount}` };
          }
        }
      }
    }

    // 8. Null byte / invisible char flood
    if (!bugDetected && text) {
      const nullByteCount = (text.match(/\u0000/g) || []).length;
      const invisibleCount = (text.match(/[\u200B-\u200D\uFEFF\u2060-\u206F]/g) || []).length;
      if (nullByteCount > 5) {
        bugDetected = { type: 'NULL_BYTE_ATTACK', severity: 'HIGH', detail: `NullBytes: ${nullByteCount}` };
      } else if (invisibleCount > 50) {
        bugDetected = { type: 'INVISIBLE_CHAR_FLOOD', severity: 'HIGH', detail: `InvisibleChars: ${invisibleCount}` };
      }
    }

    // 9. Crash unicode patterns
    if (!bugDetected && text) {
      const crashUnicodeCount = (text.match(/[\u{11720}-\u{11721}]/gu) || []).length;
      const javaneseCrash = (text.match(/[\uA9BE\uA9BF\uA9BD]/g) || []).length;
      if (crashUnicodeCount > 100 || javaneseCrash > 100) {
        bugDetected = { type: 'CRASH_UNICODE_FLOOD', severity: 'CRITICAL', detail: `CrashChars: ${crashUnicodeCount + javaneseCrash}` };
      }
    }

    // 10. contactsArrayMessage OOM
    if (!bugDetected) {
      const contactsMsg = message.contactsArrayMessage;
      if (contactsMsg) {
        const contacts = contactsMsg.contacts || [];
        const displayNameLen = (contactsMsg.displayName || '').length;
        const firstVcardLen = (contacts[0]?.vcard || '').length;
        if (contacts.length > 20 || displayNameLen > 500 || firstVcardLen > 500) {
          bugDetected = { type: 'CONTACTS_BOMB', severity: 'CRITICAL', detail: `Count: ${contacts.length}, DisplayName: ${displayNameLen}, VcardLen: ${firstVcardLen}` };
        }
      }
    }

    // 11. pollCreationMessage overflow
    if (!bugDetected) {
      const pollMsg = message.pollCreationMessage;
      if (pollMsg) {
        const nameLen = (pollMsg.name || '').length;
        const options = pollMsg.options || [];
        const optOverflow = options.some(o => (o.optionName || '').length > 500);
        const selectableCount = pollMsg.selectableOptionsCount || 0;
        if (nameLen > 1000 || options.length > 20 || optOverflow || selectableCount > 255) {
          bugDetected = { type: 'POLL_OVERFLOW', severity: 'HIGH', detail: `Name: ${nameLen}, Options: ${options.length}, Selectable: ${selectableCount}` };
        }
      }
    }

    // 12. Media fileLength overflow (image/video/document/audio)
    if (!bugDetected) {
      const mediaMsg =
        message.imageMessage ||
        message.videoMessage ||
        message.documentMessage ||
        message.audioMessage;
      if (mediaMsg) {
        const fileLength = mediaMsg.fileLength || 0;
        const width = mediaMsg.width || 0;
        const height = mediaMsg.height || 0;
        if (fileLength > 2147483647 || width > 10000 || height > 10000) {
          bugDetected = { type: 'MEDIA_OVERFLOW', severity: 'CRITICAL', detail: `FileLength: ${fileLength}, Dims: ${width}x${height}` };
        }
      }
    }

    // 13. requestPaymentMessage exploit
    if (!bugDetected) {
      const reqPayment = message.requestPaymentMessage;
      if (reqPayment) {
        const amount = reqPayment.amount?.value || 0;
        const expiryTimestamp = reqPayment.expiryTimestamp || 0;
        const noteLen = (reqPayment.noteMessage?.extendedTextMessage?.text || '').length;
        if (amount < 0 || expiryTimestamp < 0 || noteLen > 1000) {
          bugDetected = { type: 'REQUEST_PAYMENT_EXPLOIT', severity: 'HIGH', detail: `Amount: ${amount}, Expiry: ${expiryTimestamp}, NoteLen: ${noteLen}` };
        }
      }
    }

    // 14. Deeply nested quotedMessage recursion bomb
    if (!bugDetected) {
      const checkNestingDepth = (obj, depth = 0) => {
        if (depth > 6) return true;
        const quoted = obj?.contextInfo?.quotedMessage;
        if (!quoted) return false;
        const inner = quoted.extendedTextMessage || quoted.conversation;
        if (!inner) return false;
        return checkNestingDepth(typeof inner === 'object' ? inner : {}, depth + 1);
      };
      const extMsg = message.extendedTextMessage;
      if (extMsg && checkNestingDepth(extMsg)) {
        bugDetected = { type: 'RECURSIVE_QUOTE_BOMB', severity: 'CRITICAL', detail: 'Nested quoted depth > 6' };
      }
    }

    // 15. ephemeralMessage wrapping paymentInviteMessage (cr4shUI pattern)
    if (!bugDetected) {
      const checkEphemeralPayment = (obj) => {
        const ephemeral = obj?.contextInfo?.quotedMessage?.ephemeralMessage?.message;
        if (!ephemeral) return false;
        return !!ephemeral.paymentInviteMessage;
      };
      const extMsg = message.extendedTextMessage;
      const newsletterAdminMsg = message.newsletterAdminInviteMessage;
      if (
        (extMsg && checkEphemeralPayment(extMsg)) ||
        (newsletterAdminMsg && checkEphemeralPayment(newsletterAdminMsg))
      ) {
        bugDetected = { type: 'EPHEMERAL_PAYMENT_EXPLOIT', severity: 'CRITICAL', detail: 'ephemeralMessage wrapping paymentInviteMessage detected' };
      }
    }

    if (!bugDetected) return false;

    console.log(chalk.red(`[NEON-ANTIBUG] ☠️ ${bugDetected.type} detected from ${sender} - BLOCKING`));

    const attackerNumber = sender.split('@')[0];
    const ownerJid = ownerNumber + '@s.whatsapp.net';
    const timestamp = new Date().toLocaleString();

    // Block attacker
    try {
      await sock.updateBlockStatus(sender, 'block');
      console.log(chalk.green(`[NEON-ANTIBUG] ✅ Blocked attacker: ${attackerNumber}`));
    } catch (blockErr) {
      console.error(chalk.red(`[NEON-ANTIBUG] Failed to block: ${blockErr.message}`));
    }

    // Delete bug message
    try {
      await sock.sendMessage(chatId, { delete: msg.key });
      console.log(chalk.green(`[NEON-ANTIBUG] ✅ Deleted bug message`));
    } catch (delErr) {
      console.error(chalk.red(`[NEON-ANTIBUG] Failed to delete message: ${delErr.message}`));
    }

    // Clear chat
    try {
      const clearMsg = await sock.sendMessage(chatId, { text: '.' });
      if (clearMsg?.key) await sock.sendMessage(chatId, { delete: clearMsg.key });
    } catch (clearErr) { /* non-critical */ }

    // Alert owner
    try {
      const alertText = `╔═══════════════════════════════════════════╗
║   𓅓 NEON BUG ANTI BUG ☠️
╚═══════════════════════════════════════════╝

╔═══════════════════════════════════════════╗
║  🛡️ 𝗔𝗧𝗧𝗔𝗖𝗞 𝗕𝗟𝗢𝗖𝗞𝗘𝗗
╠═══════════════════════════════════════════╣
║                                           
║  🔴 𝚃𝚈𝙿𝙴: ${bugDetected.type}
║  💀 𝚂𝙴𝚅𝙴𝚁𝙸𝚃𝚈: ${bugDetected.severity}
║  📋 𝙳𝙴𝚃𝙰𝙸𝙻: ${bugDetected.detail}
║  📱 𝙰𝚃𝚃𝙰𝙲𝙺𝙴𝚁: +${attackerNumber}
║  🕐 𝚃𝙸𝙼𝙴: ${timestamp}
║                                           
╚═══════════════════════════════════════════╝

╔═══════════════════════════════════════════╗
║  ✅ 𝗔𝗖𝗧𝗜𝗢𝗡𝗦 𝗧𝗔𝗞𝗘𝗡
╠═══════════════════════════════════════════╣
║  • 𝙰𝚝𝚝𝚊𝚌𝚔𝚎𝚛 𝚋𝚕𝚘𝚌𝚔𝚎𝚍 𝚒𝚗𝚜𝚝𝚊𝚗𝚝𝚕𝚢
║  • 𝙱𝚞𝚐 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚍𝚎𝚕𝚎𝚝𝚎𝚍
║  • 𝙲𝚑𝚊𝚝 𝚌𝚕𝚎𝚊𝚛𝚎𝚍
║                                           
╚═══════════════════════════════════════════╝

    👿 "𝙽𝚘 𝚋𝚞𝚐 𝚌𝚊𝚗 𝚝𝚘𝚞𝚌𝚑 𝚝𝚑𝚎 𝙽𝚒𝚐𝚑𝚝 𝚁𝚊𝚒𝚍𝚎𝚛𝚜" ☠️`;

      await sock.sendMessage(ownerJid, { text: alertText }, { quoted: fakeQuote });
      console.log(chalk.green(`[NEON-ANTIBUG] ✅ Owner alerted`));
    } catch (alertErr) {
      console.error(chalk.red(`[NEON-ANTIBUG] Failed to alert owner: ${alertErr.message}`));
    }

    return true;

  } catch (err) {
    console.error(chalk.red('[NEON-ANTIBUG] Error in handleNeonAntibug:'), err);
    return false;
  }
};

// ============================================
// IN-MEMORY SPAM TRACKER
// ============================================
if (!global.spamTracker) global.spamTracker = {};

// ============================================
// ANTISPAM - 3 WARNING SYSTEM
// ============================================
const handleAntiSpam = async (sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber) => {
  if (!isGroupMsg) return false;
  if (msg.key.fromMe) return false;

  const ownerNumber = botPhoneNumber ? resolveOwnerNumber(botPhoneNumber, null) : null;
  const ownerConfig = ownerNumber ? getOwnerConfig(ownerNumber) : {};

  if (!ownerConfig?.antispam) ownerConfig.antispam = {};
  const antispamEnabled = ownerConfig.antispam[groupId];
  if (!antispamEnabled) return false;

  const senderNum = sender.split('@')[0].replace(/\D/g, '').replace(/^0+/, '');
  const cleanOwner = ownerNumber?.replace(/\D/g, '').replace(/^0+/, '');
  if (senderNum === cleanOwner) return false;
  if (ownerConfig?.sudoUsers?.some(sudo =>
    sudo.replace(/\D/g, '').replace(/^0+/, '') === senderNum
  )) return false;

  if (!global.spamTracker[groupId]) global.spamTracker[groupId] = {};
  if (!global.spamTracker[groupId][sender]) {
    global.spamTracker[groupId][sender] = { messages: [], identical: {} };
  }

  const tracker = global.spamTracker[groupId][sender];
  const now = Date.now();
  const fakeQuote = createFakeQuote();

  // CHECK 1: Identical message spam (5 same messages in 60s)
  const messageContent = (text || '').toLowerCase().trim();
  if (messageContent) {
    if (!tracker.identical[messageContent]) tracker.identical[messageContent] = [];
    tracker.identical[messageContent] = tracker.identical[messageContent].filter(t => now - t < 60000);
    tracker.identical[messageContent].push(now);

    if (tracker.identical[messageContent].length >= 5) {
      console.log(chalk.yellow(`[ANTISPAM] Identical spam from ${sender.split('@')[0]}`));

      try { await sock.sendMessage(groupId, { delete: msg.key }); } catch (e) {}

      const warningCount = addWarning(groupId, sender, 'antispam');

      if (warningCount >= 3) {
        const kickMsg = getRandomReply(ANTISPAM_KICK_REPLIES);
        await sock.sendMessage(groupId, {
          text: `🚨 @${sender.split('@')[0]} ʀᴇᴀᴄʜᴇᴅ 3 ᴡᴀʀɴɪɴɢs!\n\n💀 ʀᴇᴀsᴏɴ: ɪᴅᴇɴᴛɪᴄᴀʟ ᴍᴇssᴀɢᴇ sᴘᴀᴍ\n\n${kickMsg}`,
          mentions: [sender],
          contextInfo: getExternalAdReply()
        }, { quoted: fakeQuote });

        try {
          await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
        } catch (kickErr) {
          await sock.sendMessage(groupId, { text: `⚠️ Cannot kick — make bot admin first!`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
        }

        delete global.spamTracker[groupId][sender];
        clearWarnings(groupId, sender, 'antispam');
      } else {
        const warnMsg = getRandomReply(ANTISPAM_REPLIES);
        await sock.sendMessage(groupId, {
          text: `⚠️ @${sender.split('@')[0]} - 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 ${warningCount}/3\n\n${warnMsg}\n\n💀 ʀᴇᴀsᴏɴ: ɪᴅᴇɴᴛɪᴄᴀʟ ᴍᴇssᴀɢᴇ sᴘᴀᴍ\n⚡ ${3 - warningCount} ᴡᴀʀɴɪɴɢs ʟᴇғᴛ ʙᴇғᴏʀᴇ ᴋɪᴄᴋ`,
          mentions: [sender],
          contextInfo: getExternalAdReply()
        }, { quoted: fakeQuote });
      }
      return true;
    }
  }

  // CHECK 2: Rapid flood (8+ messages in 10s)
  tracker.messages = tracker.messages.filter(t => now - t < 10000);
  tracker.messages.push(now);

  if (tracker.messages.length > 8) {
    console.log(chalk.yellow(`[ANTISPAM] Rapid flood from ${sender.split('@')[0]}`));

    try { await sock.sendMessage(groupId, { delete: msg.key }); } catch (e) {}

    const warningCount = addWarning(groupId, sender, 'antispam');

    if (warningCount >= 3) {
      const kickMsg = getRandomReply(ANTISPAM_KICK_REPLIES);
      await sock.sendMessage(groupId, {
        text: `🚨 @${sender.split('@')[0]} ʀᴇᴀᴄʜᴇᴅ 3 ᴡᴀʀɴɪɴɢs!\n\n💀 ʀᴇᴀsᴏɴ: ʀᴀᴘɪᴅ ᴍᴇssᴀɢᴇ ғʟᴏᴏᴅ\n\n${kickMsg}`,
        mentions: [sender],
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });

      try {
        await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
      } catch (kickErr) {
        await sock.sendMessage(groupId, { text: `⚠️ Cannot kick — make bot admin first!`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
      }

      delete global.spamTracker[groupId][sender];
      clearWarnings(groupId, sender, 'antispam');
    } else {
      const warnMsg = getRandomReply(ANTISPAM_REPLIES);
      await sock.sendMessage(groupId, {
        text: `⚠️ @${sender.split('@')[0]} - 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 ${warningCount}/3\n\n${warnMsg}\n\n💀 ʀᴇᴀsᴏɴ: ʀᴀᴘɪᴅ ᴍᴇssᴀɢᴇ ғʟᴏᴏᴅ\n⚡ ${3 - warningCount} ᴡᴀʀɴɪɴɢs ʟᴇғᴛ ʙᴇғᴏʀᴇ ᴋɪᴄᴋ`,
        mentions: [sender],
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
    }
    return true;
  }

  return false;
};

// ============================================
// SPAM TRACKER MEMORY CLEANUP (every 10 min)
// ============================================
setInterval(() => {
  if (!global.spamTracker) return;
  const now = Date.now();
  for (const groupId in global.spamTracker) {
    for (const sender in global.spamTracker[groupId]) {
      const tracker = global.spamTracker[groupId][sender];
      tracker.messages = tracker.messages.filter(t => now - t < 10000);
      for (const content in tracker.identical) {
        tracker.identical[content] = tracker.identical[content].filter(t => now - t < 60000);
        if (tracker.identical[content].length === 0) delete tracker.identical[content];
      }
      if (tracker.messages.length === 0 && Object.keys(tracker.identical).length === 0) {
        delete global.spamTracker[groupId][sender];
      }
    }
    if (Object.keys(global.spamTracker[groupId]).length === 0) delete global.spamTracker[groupId];
  }
}, 10 * 60 * 1000);

// ============================================
// ANTIBOT - 3 WARNING SYSTEM
// ============================================
const handleAntiBot = async (sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber) => {
  if (!isGroupMsg) return false;
  if (msg.key.fromMe) return false;

  const ownerNumber = botPhoneNumber ? resolveOwnerNumber(botPhoneNumber, null) : null;
  const ownerConfig = ownerNumber ? getOwnerConfig(ownerNumber) : {};

  if (!ownerConfig?.antibot) ownerConfig.antibot = {};
  const antibotEnabled = ownerConfig.antibot[groupId];
  if (!antibotEnabled) return false;

  const senderNum = sender.split('@')[0].replace(/\D/g, '').replace(/^0+/, '');
  const cleanOwner = ownerNumber?.replace(/\D/g, '').replace(/^0+/, '');
  if (senderNum === cleanOwner) return false;
  if (ownerConfig?.sudoUsers?.some(sudo =>
    sudo.replace(/\D/g, '').replace(/^0+/, '') === senderNum
  )) return false;

  const message = msg.message || {};
  let botDetected = false;
  let detectionReason = '';
  const fakeQuote = createFakeQuote();

  const rawJid = msg.key.participant || msg.key.remoteJid || '';
  if (rawJid.includes(':') && rawJid.includes('@s.whatsapp.net')) {
    botDetected = true;
    detectionReason = 'BOT JID PATTERN';
  }

  if (!botDetected) {
    const hasLegacyBotFeatures =
      message?.buttonsMessage ||
      message?.listMessage ||
      message?.templateMessage ||
      message?.interactiveMessage;
    if (hasLegacyBotFeatures) {
      botDetected = true;
      detectionReason = 'LEGACY BOT MESSAGE TYPE';
    }
  }

  if (!botDetected && message?.interactiveResponseMessage) {
    botDetected = true;
    detectionReason = 'INTERACTIVE RESPONSE';
  }

  if (!botDetected) {
    const voMsg = message?.viewOnceMessage?.message || message?.viewOnceMessageV2?.message;
    if (voMsg?.interactiveMessage || voMsg?.buttonsMessage || voMsg?.listMessage) {
      botDetected = true;
      detectionReason = 'VIEW ONCE BOT ABUSE';
    }
  }

  if (!botDetected && message?.newsletterAdminInviteMessage) {
    botDetected = true;
    detectionReason = 'NEWSLETTER INVITE ABUSE';
  }

  if (!botDetected && message?.sendPaymentMessage) {
    botDetected = true;
    detectionReason = 'FAKE PAYMENT MESSAGE';
  }

  if (!botDetected && message?.groupStatusMessageV2) {
    botDetected = true;
    detectionReason = 'GROUP STATUS MESSAGE ABUSE';
  }

  if (!botDetected && text) {
    const trimmedText = text.trim();
    const botPrefixes = ['.', '!', '/', '#', '$', '+', '-', '?', '^', '&', '*'];
    const { getOwnerPrefix } = require('./owner');
    const ownPrefix = getOwnerPrefix(ownerNumber) || '.';
    const firstChar = trimmedText[0];
    if (botPrefixes.includes(firstChar) && firstChar !== ownPrefix && trimmedText.length > 1) {
      botDetected = true;
      detectionReason = 'BOT PREFIX DETECTED';
    }
  }

  if (!botDetected) return false;

  console.log(chalk.yellow(`[ANTIBOT] ${detectionReason} from ${sender.split('@')[0]}`));

  try { await sock.sendMessage(groupId, { delete: msg.key }); } catch (e) {}

  const warningCount = addWarning(groupId, sender, 'antibot');

  if (warningCount >= 3) {
    const kickMsg = getRandomReply(ANTIBOT_KICK_REPLIES);
    await sock.sendMessage(groupId, {
      text: `🤖 @${sender.split('@')[0]} ʀᴇᴀᴄʜᴇᴅ 3 ᴡᴀʀɴɪɴɢs!\n\n💀 ʀᴇᴀsᴏɴ: ${detectionReason}\n\n${kickMsg}`,
      mentions: [sender],
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

    try {
      await sock.groupParticipantsUpdate(groupId, [sender], 'remove');
    } catch (kickErr) {
      await sock.sendMessage(groupId, { text: `⚠️ Cannot kick — make bot admin first!`, contextInfo: getExternalAdReply() }, { quoted: fakeQuote });
    }

    clearWarnings(groupId, sender, 'antibot');
  } else {
    const warnMsg = getRandomReply(ANTIBOT_REPLIES);
    await sock.sendMessage(groupId, {
      text: `⚠️ @${sender.split('@')[0]} - 𝗪𝗔𝗥𝗡𝗜𝗡𝗚 ${warningCount}/3\n\n${warnMsg}\n\n💀 ʀᴇᴀsᴏɴ: ${detectionReason}\n⚡ ${3 - warningCount} ᴡᴀʀɴɪɴɢs ʟᴇғᴛ ʙᴇғᴏʀᴇ ᴋɪᴄᴋ`,
      mentions: [sender],
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });
  }

  return true;
};

// ============================================
// MAIN ANTI-FEATURES HANDLER
// ============================================
const handleAntiFeatures = async (sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber = null) => {
  try {
    const ownerNumber = botPhoneNumber ? resolveOwnerNumber(botPhoneNumber, null) : null;
    const ownerConfig = ownerNumber ? getOwnerConfig(ownerNumber) : {};
    const cleanSender = sender.split('@')[0].replace(/\D/g, '').replace(/^0+/, '');

    // Skip owner and sudo users
    if (ownerNumber && cleanSender === ownerNumber.replace(/\D/g, '').replace(/^0+/, '')) return false;
    if (ownerConfig?.sudoUsers?.some(sudo =>
      sudo.replace(/\D/g, '').replace(/^0+/, '') === cleanSender
    )) return false;

    // AntiBug (DM protection only)
    const bugBlocked = await handleNeonAntibug(sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber);
    if (bugBlocked) return true;

    // Group-only anti-features
    if (isGroupMsg) {
      const botBlocked = await handleAntiBot(sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber);
      if (botBlocked) return true;

      const spamBlocked = await handleAntiSpam(sock, msg, sender, text, isGroupMsg, groupId, botPhoneNumber);
      if (spamBlocked) return true;
    }

    return false;
  } catch (err) {
    console.error(chalk.red("⚠️ Error in handleAntiFeatures:"), err);
    return false;
  }
};

// ============================================
// NEON GROUP GUARD
// ============================================
const handleNeonGroupGuard = async (sock, groupId, participants, botPhoneNumber = null) => {
  try {
    const ownerNumber = botPhoneNumber ? resolveOwnerNumber(botPhoneNumber, null) : null;
    const ownerConfig = ownerNumber ? getOwnerConfig(ownerNumber) : {};

    if (!ownerConfig?.antiraid) ownerConfig.antiraid = {};
    const antiraidEnabled = ownerConfig.antiraid[groupId];
    if (!antiraidEnabled) return;

    const raidTracker = helpers.loadDatabase('raid-tracker.json') || {};
    if (!raidTracker[groupId]) raidTracker[groupId] = [];

    const now = Date.now();
    raidTracker[groupId] = raidTracker[groupId].filter(t => now - t.time < 60000);

    participants.forEach(participant => {
      raidTracker[groupId].push({ jid: participant, time: now });
    });

    const joinCount = raidTracker[groupId].length;
    const fakeQuote = createFakeQuote();

    if (joinCount >= 5) {
      for (const entry of raidTracker[groupId]) {
        try {
          await sock.groupParticipantsUpdate(groupId, [entry.jid], 'remove');
        } catch (e) {
          console.error('Failed to remove raid participant:', e);
        }
      }

      await sock.sendMessage(groupId, {
        text: `🚨 𝗥𝗔𝗜𝗗 𝗗𝗘𝗧𝗘𝗖𝗧𝗘𝗗 🚨\n\n💀 ${joinCount} ɪɴᴛʀᴜᴅᴇʀs ʀᴇᴍᴏᴠᴇᴅ!\n\n    👿 "ɴᴏ ᴏɴᴇ ʀᴀɪᴅs ᴛʜᴇ ɴᴇᴏɴ ʙᴜɢ" ⚡`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });

      raidTracker[groupId] = [];
      helpers.saveDatabase('raid-tracker.json', raidTracker);
    } else {
      helpers.saveDatabase('raid-tracker.json', raidTracker);
    }
  } catch (err) {
    console.error(chalk.red("⚠️ Error in handleNeonGroupGuard:"), err);
  }
};

// ============================================
// HIJACK GROUP FUNCTION
// ============================================
async function hijackGroup(sock, chatId, sender, groupMetadata, fakeQuote, isOwner, isSudo) {
  try {
    if (!sock || !sock.user) throw new Error('Bot not connected');

    if (!isOwner && !isSudo) {
      const botIsAdmin = await helpers.isBotAdmin(sock, chatId.split('@')[0]);
      if (!botIsAdmin) {
        await sock.sendMessage(chatId, {
          text: `ɪ ɴᴇᴇᴅ ᴀᴅᴍɪɴ ᴘᴏᴡᴇʀs ᴛᴏ ʜɪᴊᴀᴄᴋ ᴛʜɪs ɢʀᴏᴜᴘ ☠️`,
          contextInfo: getExternalAdReply()
        }, { quoted: fakeQuote });
        return;
      }
    }

    const participants = groupMetadata.participants;
    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const ownerJid = sender;
    const ownerNumber = ownerJid.split('@')[0].split(':')[0];

    const admins = participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => p.id);

    if (admins.length === 0) {
      await sock.sendMessage(chatId, {
        text: `ɴᴏ ᴀᴅᴍɪɴs ᴛᴏ ʜɪᴊᴀᴄᴋ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    const toDemote = admins.filter(jid => {
      const jidNumber = jid.split('@')[0].split(':')[0];
      const botNumber = botJid.split('@')[0].split(':')[0];
      if (jid === botJid || jidNumber === botNumber) return false;
      if (jid === ownerJid || jidNumber === ownerNumber) return false;
      if (jidNumber.endsWith(ownerNumber) || ownerNumber.endsWith(jidNumber)) return false;
      return true;
    });

    if (toDemote.length === 0) {
      await sock.sendMessage(chatId, {
        text: `ɴᴏ ᴏᴛʜᴇʀ ᴀᴅᴍɪɴs ᴛᴏ ᴅᴇᴍᴏᴛᴇ ☠️`,
        contextInfo: getExternalAdReply()
      }, { quoted: fakeQuote });
      return;
    }

    // Promote sender if not already admin
    const ownerParticipant = participants.find(p => {
      const pNumber = p.id.split('@')[0].split(':')[0];
      return p.id === ownerJid || pNumber === ownerNumber ||
        pNumber.endsWith(ownerNumber) || ownerNumber.endsWith(pNumber);
    });

    if (!ownerParticipant || !ownerParticipant.admin) {
      try {
        await sock.groupParticipantsUpdate(chatId, [ownerJid], 'promote');
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        await sock.sendMessage(chatId, {
          text: `ғᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴍᴏᴛᴇ ʏᴏᴜ ғɪʀsᴛ ☠️`,
          contextInfo: getExternalAdReply()
        }, { quoted: fakeQuote });
        return;
      }
    }

    await sock.sendMessage(chatId, {
      text: `⏳ ᴅᴇᴍᴏᴛɪɴɢ ${toDemote.length} ᴀᴅᴍɪɴs... ☠️`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

    let demoted = 0;
    for (const target of toDemote) {
      try {
        await sock.groupParticipantsUpdate(chatId, [target], 'demote');
        demoted++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.warn(chalk.yellow(`Demotion failed for ${target}`));
      }
    }

    try {
      await sock.groupUpdateSubject(chatId, '𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 𝐁𝐘 NEON BUG 【☠︎】💀');
      await new Promise(r => setTimeout(r, 300));
      await sock.groupUpdateDescription(chatId, '🔱 𝐆𝐑𝐎𝐔𝐏 𝐇𝐈𝐉𝐀𝐂𝐊𝐄𝐃 🔱\n⚠️ ᴛʜɪs ɢʀᴏᴜᴘ ʜᴀs ʙᴇᴇɴ ᴄᴏɴǫᴜᴇʀᴇᴅ ʙʏ ᴛʜᴇ unknown clan☠️\n\n💀 ʏᴏᴜʀ ᴀᴅᴍɪɴs ʜᴀᴠᴇ ғᴀʟʟᴇɴ\n🗡️ ʏᴏᴜʀ ᴅᴇғᴇɴsᴇs ʜᴀᴠᴇ ᴄʀᴜᴍʙʟᴇᴅ\n⚔️ ɢʀᴏᴜᴘ ᴄᴏɴᴛʀᴏʟ: ᴅᴏᴍɪɴᴀᴛᴇᴅ\n🔮 ʀᴇsɪsᴛᴀɴᴄᴇ: ғᴜᴛɪʟᴇ\n\n☠️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ NEON BUG\n👿 ᴄʀᴇᴀᴛᴇᴅ ʙʏ NEON BUG \n\n🌑 ɴᴏ ᴇsᴄᴀᴘᴇ. ɴᴏ ᴍᴇʀᴄʏ. ɴᴏ ʜᴏᴘᴇ. 🌑\n\n© 𝐔𝐍𝐊𝐍𝐎𝐖𝐍 𝐂𝐋𝐀𝐍');
      await new Promise(r => setTimeout(r, 300));
      await sock.groupSettingUpdate(chatId, 'announcement');
      await new Promise(r => setTimeout(r, 300));
      await sock.groupSettingUpdate(chatId, 'locked');
    } catch (e) {
      console.warn(chalk.yellow('Group settings update failed'));
    }

    await sock.sendMessage(chatId, {
      text: `✓ ɢʀᴏᴜᴘ ʜɪᴊᴀᴄᴋᴇᴅ · ᴅᴇᴍᴏᴛᴇᴅ ${demoted} ᴀᴅᴍɪɴs ☠️\n\n    👿 "ᴛʜᴇ ɴᴇᴏɴ ʙᴜɢ ʜᴀᴠᴇ ᴄᴏɴǫᴜᴇʀᴇᴅ" 🖤`,
      mentions: [ownerJid],
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });

  } catch (err) {
    console.error(chalk.red('❌ Error in hijackGroup:'), err);
    await sock.sendMessage(chatId, {
      text: `ʜɪᴊᴀᴄᴋ ғᴀɪʟᴇᴅ ☠️`,
      contextInfo: getExternalAdReply()
    }, { quoted: fakeQuote });
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  handleAntiFeatures,
  handleNeonGroupGuard,
  hijackGroup,
  getWarnings,
  saveWarnings,
  addWarning,
  getWarningCount,
  clearWarnings,
  getExternalAdReply,
  createFakeQuote
};

// ============================================
// END OF ANTI-FEATURES.JS
// ☠️ NEON BUG
// CREATED BY NEON BUG
// ============================================ 