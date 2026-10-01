const fs = require('fs-extra');
const path = require('path');

// Paths to telebase files
const TELEBASE_DIR = path.join(__dirname, '..', '..', 'telebase');
const USERS_FILE = path.join(TELEBASE_DIR, 'users.json');
const PREMIUM_FILE = path.join(TELEBASE_DIR, 'premium.json');
const BANNED_FILE = path.join(TELEBASE_DIR, 'banned.json');
const VERIFIED_FILE = path.join(TELEBASE_DIR, 'verified.json');
const STATS_FILE = path.join(TELEBASE_DIR, 'stats.json');
const PHONE_MAP_FILE = path.join(TELEBASE_DIR, 'phone_map.json');

// Ensure telebase directory exists
fs.ensureDirSync(TELEBASE_DIR);

// Helper to read JSON file
function readJSON(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper to write JSON file
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// ========== USER MANAGEMENT ==========

/**
 * Save or update user data
 */
function saveUser(chatId, username, firstName) {
  const users = readJSON(USERS_FILE, {});
  
  if (!users[chatId]) {
    users[chatId] = {
      chatId,
      username,
      firstName,
      joinedAt: Date.now(),
      activeBots: 0
    };
  } else {
    // Update existing user
    users[chatId].username = username;
    users[chatId].firstName = firstName;
  }
  
  writeJSON(USERS_FILE, users);
  updateStats();
  return users[chatId];
}

/**
 * Get user data
 */
function getUser(chatId) {
  const users = readJSON(USERS_FILE, {});
  return users[chatId] || null;
}

/**
 * Get all user IDs
 */
function getAllUsers() {
  const users = readJSON(USERS_FILE, {});
  return Object.keys(users);
}

/**
 * Get all users data (for admin listing)
 */
function getAllUsersData() {
  const users = readJSON(USERS_FILE, {});
  return Object.values(users);
}

/**
 * Increment user's active bots count
 */
function incrementUserBots(chatId) {
  const users = readJSON(USERS_FILE, {});
  if (users[chatId]) {
    users[chatId].activeBots = (users[chatId].activeBots || 0) + 1;
    writeJSON(USERS_FILE, users);
  }
}

/**
 * Decrement user's active bots count
 */
function decrementUserBots(chatId) {
  const users = readJSON(USERS_FILE, {});
  if (users[chatId]) {
    users[chatId].activeBots = Math.max(0, (users[chatId].activeBots || 0) - 1);
    writeJSON(USERS_FILE, users);
  }
}

// ========== PREMIUM MANAGEMENT ==========

/**
 * Add premium to user
 */
function addPremium(chatId, days) {
  const premium = readJSON(PREMIUM_FILE, {});
  
  const expiryDate = Date.now() + (days * 24 * 60 * 60 * 1000);
  
  premium[chatId] = {
    expiryDate,
    addedAt: Date.now(),
    days
  };
  
  writeJSON(PREMIUM_FILE, premium);
  updateStats();
  return premium[chatId];
}

/**
 * Remove premium from user
 */
function removePremium(chatId) {
  const premium = readJSON(PREMIUM_FILE, {});
  
  if (premium[chatId]) {
    delete premium[chatId];
    writeJSON(PREMIUM_FILE, premium);
    updateStats();
    return true;
  }
  
  return false;
}

/**
 * Check if user is premium
 */
function isPremium(chatId) {
  const premium = readJSON(PREMIUM_FILE, {});
  
  if (!premium[chatId]) return false;
  
  // Check if expired
  if (Date.now() > premium[chatId].expiryDate) {
    // Auto-remove expired premium
    delete premium[chatId];
    writeJSON(PREMIUM_FILE, premium);
    updateStats();
    return false;
  }
  
  return true;
}

/**
 * Get premium data for user
 */
function getPremiumData(chatId) {
  const premium = readJSON(PREMIUM_FILE, {});
  
  if (!premium[chatId]) return null;
  
  // Check if expired
  if (Date.now() > premium[chatId].expiryDate) {
    delete premium[chatId];
    writeJSON(PREMIUM_FILE, premium);
    updateStats();
    return null;
  }
  
  return premium[chatId];
}

// ========== BAN MANAGEMENT ==========

/**
 * Ban user
 */
function banUser(chatId) {
  const banned = readJSON(BANNED_FILE, {});
  
  banned[chatId] = {
    bannedAt: Date.now()
  };
  
  writeJSON(BANNED_FILE, banned);
  updateStats();
  return true;
}

/**
 * Unban user
 */
function unbanUser(chatId) {
  const banned = readJSON(BANNED_FILE, {});
  
  if (banned[chatId]) {
    delete banned[chatId];
    writeJSON(BANNED_FILE, banned);
    updateStats();
    return true;
  }
  
  return false;
}

/**
 * Check if user is banned
 */
function isBanned(chatId) {
  const banned = readJSON(BANNED_FILE, {});
  return !!banned[chatId];
}

// ========== VERIFICATION MANAGEMENT ==========

/**
 * Mark user as verified (joined channel)
 */
function verifyUser(chatId) {
  const verified = readJSON(VERIFIED_FILE, {});
  
  verified[chatId] = {
    verifiedAt: Date.now()
  };
  
  writeJSON(VERIFIED_FILE, verified);
  updateStats();
  return true;
}

/**
 * Check if user is verified
 */
function isVerified(chatId) {
  const verified = readJSON(VERIFIED_FILE, {});
  return !!verified[chatId];
}

// ========== PHONE-TO-OWNER MAPPING ==========

/**
 * Map phone number to owner's Telegram chat ID
 */
function mapPhoneToOwner(phoneNumber, chatId) {
  const phoneMap = readJSON(PHONE_MAP_FILE, {});
  phoneMap[phoneNumber] = {
    chatId,
    mappedAt: Date.now()
  };
  writeJSON(PHONE_MAP_FILE, phoneMap);
  return true;
}

/**
 * Get owner chat ID for a phone number
 */
function getOwnerByPhone(phoneNumber) {
  const phoneMap = readJSON(PHONE_MAP_FILE, {});
  return phoneMap[phoneNumber]?.chatId || null;
}

/**
 * Remove phone-to-owner mapping
 */
function removePhoneMapping(phoneNumber) {
  const phoneMap = readJSON(PHONE_MAP_FILE, {});
  if (phoneMap[phoneNumber]) {
    delete phoneMap[phoneNumber];
    writeJSON(PHONE_MAP_FILE, phoneMap);
    return true;
  }
  return false;
}

/**
 * Check if phone's owner is premium
 */
function isPhonePremium(phoneNumber) {
  const ownerChatId = getOwnerByPhone(phoneNumber);
  if (!ownerChatId) return false;
  return isPremium(ownerChatId);
}

/**
 * Get owner's Telegram ID and premium status for phone
 */
function getPhoneOwnerInfo(phoneNumber) {
  const ownerChatId = getOwnerByPhone(phoneNumber);
  if (!ownerChatId) return null;
  
  return {
    chatId: ownerChatId,
    isPremium: isPremium(ownerChatId),
    premiumData: getPremiumData(ownerChatId)
  };
}

// ========== STATS MANAGEMENT ==========

/**
 * Update stats file
 */
function updateStats() {
  const users = readJSON(USERS_FILE, {});
  const premium = readJSON(PREMIUM_FILE, {});
  const banned = readJSON(BANNED_FILE, {});
  const verified = readJSON(VERIFIED_FILE, {});
  
  const stats = {
    totalUsers: Object.keys(users).length,
    premiumUsers: Object.keys(premium).length,
    bannedUsers: Object.keys(banned).length,
    verifiedUsers: Object.keys(verified).length,
    lastUpdated: Date.now()
  };
  
  writeJSON(STATS_FILE, stats);
  return stats;
}

/**
 * Get current stats
 */
function getStats() {
  let stats = readJSON(STATS_FILE, null);
  
  if (!stats) {
    stats = updateStats();
  }
  
  return stats;
}

// ========== EXPORTS ==========

module.exports = {
  // User management
  saveUser,
  getUser,
  getAllUsers,
  getAllUsersData,
  incrementUserBots,
  decrementUserBots,
  
  // Premium management
  addPremium,
  removePremium,
  isPremium,
  getPremiumData,
  
  // Ban management
  banUser,
  unbanUser,
  isBanned,
  
  // Verification management
  verifyUser,
  isVerified,
  
  // Phone-to-owner mapping
  mapPhoneToOwner,
  getOwnerByPhone,
  removePhoneMapping,
  isPhonePremium,
  getPhoneOwnerInfo,
  
  // Stats
  updateStats,
  getStats
};