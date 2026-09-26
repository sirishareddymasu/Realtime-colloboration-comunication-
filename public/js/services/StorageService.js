/**
 * @file StorageService.js
 * @description LocalStorage wrapper for client preferences and identity persistence
 */

const STORAGE_KEYS = {
  USER_PROFILE: 'nexus_user_profile',
  SOUND_ENABLED: 'nexus_sound_enabled',
};

export class StorageService {
  /**
   * Loads saved user profile or generates a default random persona
   * @param {Array<string>} colorPalette
   * @returns {Object}
   */
  static getProfile(colorPalette) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('StorageService: Failed to read profile from localStorage', e);
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    const defaultProfile = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: `Collab-${randomSuffix}`,
      color: randomColor,
      status: 'active',
    };

    StorageService.saveProfile(defaultProfile);
    return defaultProfile;
  }

  /**
   * Save user profile
   * @param {Object} profile
   */
  static saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('StorageService: Failed to save profile to localStorage', e);
    }
  }

  /**
   * Get sound toggle setting
   * @returns {boolean}
   */
  static getSoundEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return val !== null ? val === 'true' : true;
    } catch (e) {
      return true;
    }
  }

  /**
   * Save sound toggle setting
   * @param {boolean} enabled
   */
  static setSoundEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
    } catch (e) {
      console.warn('StorageService: Failed to save sound setting', e);
    }
  }
}
