/**
 * @file AudioService.js
 * @description Web Audio API sound synthesizer producing clean micro-audio cues with zero external assets
 */

export class AudioService {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  /**
   * Initializes or resumes AudioContext upon user gesture
   * @private
   */
  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Sets whether sound effects are enabled
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Plays a pleasant harmonic chime
   * @private
   * @param {Array<number>} freqs - List of frequencies in Hz
   * @param {number} duration - Total length in seconds
   * @param {string} [type='sine']
   */
  _playToneSequence(freqs, duration = 0.25, type = 'sine') {
    if (!this.enabled) return;
    try {
      this._ensureContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const stepDuration = duration / freqs.length;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + idx * stepDuration);

        // Soft envelope to avoid clicks
        gain.gain.setValueAtTime(0.001, now + idx * stepDuration);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * stepDuration + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * stepDuration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * stepDuration);
        osc.stop(now + (idx + 1) * stepDuration);
      });
    } catch (e) {
      // Audio autoplay policy or device restrictions
    }
  }

  /**
   * Incoming chat message chime
   */
  playMessage() {
    this._playToneSequence([587.33, 880], 0.2, 'sine'); // D5 -> A5
  }

  /**
   * User arrival chime
   */
  playUserJoin() {
    this._playToneSequence([523.25, 659.25, 783.99], 0.3, 'triangle'); // C5 -> E5 -> G5
  }

  /**
   * Document checkpoint created sound
   */
  playCheckpoint() {
    this._playToneSequence([440, 554.37, 659.25, 880], 0.35, 'sine'); // A4 major chord
  }

  /**
   * Document revert / restore action sound
   */
  playRevert() {
    this._playToneSequence([523.25, 392], 0.25, 'triangle'); // C5 -> G4
  }
}
