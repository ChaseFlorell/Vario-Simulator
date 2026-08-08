"use strict";
/* ═══════════════════════════════════════════════════════════════
   Shared vario audio engine.

   Both the beeper and the thermal coach speak with exactly this
   voice, so there is one place — and only one — to change how a
   vario sounds.

   Usage:
     const v = new VarioAudio({ liftThr: 0.1, sinkThr: -2.5 });
     v.start();          // MUST be called from a user gesture
     v.setValue(1.8);    // current climb rate, m/s
   ═══════════════════════════════════════════════════════════════ */
(function (global) {

  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));

  /* Pitch rises about an octave per 6 m/s; cadence and duty cycle climb
     with it until strong lift is nearly a continuous note. */
  function beepFreq(v) { return clamp(600 * Math.pow(2, v / 6), 380, 2100); }
  function beepRate(v) { return clamp(1.3 + 1.55 * v, 1.3, 13); }

  class VarioAudio {
    constructor(opts) {
      opts = opts || {};
      this.liftThr = opts.liftThr !== undefined ? opts.liftThr : 0.1;
      this.sinkThr = opts.sinkThr !== undefined ? opts.sinkThr : -2.5;
      this.volume  = opts.volume  !== undefined ? opts.volume  : 0.55;
      this.onBeep  = opts.onBeep || null;   // called with the beep's lead time, seconds

      this.value = 0;
      this.enabled = true;
      this.ready = false;
      this._next = 0;
      this._timer = null;
    }

    /* Browsers will not start audio outside a user gesture, so call this
       from a click or tap. Safe to call more than once. */
    start() {
      if (this.ready) return true;
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return false;

      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = this.volume;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 3800;
      filt.connect(master);
      master.connect(ctx.destination);

      // The sink growl runs continuously and is gated by its gain.
      const so = ctx.createOscillator();
      so.type = 'sawtooth';
      so.frequency.value = 260;
      const sf = ctx.createBiquadFilter();
      sf.type = 'lowpass';
      sf.frequency.value = 700;
      const sg = ctx.createGain();
      sg.gain.value = 0;
      so.connect(sf); sf.connect(sg); sg.connect(master);
      so.start();

      this.ctx = ctx; this.master = master; this.filt = filt;
      this.sinkOsc = so; this.sinkGain = sg;
      this._next = ctx.currentTime;
      this.ready = true;
      this._timer = setInterval(() => this._schedule(), 30);
      return true;
    }

    setValue(v)      { this.value = v; }
    setEnabled(on)   { this.enabled = !!on; }
    setThresholds(lift, sink) {
      if (lift !== null && lift !== undefined) this.liftThr = lift;
      if (sink !== null && sink !== undefined) this.sinkThr = sink;
    }
    setVolume(v) {
      this.volume = v;
      if (this.ready) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }

    /* Schedule a little ahead of the clock so beep timing stays even
       regardless of how busy the main thread is. */
    _schedule() {
      if (!this.ready) return;
      const ctx = this.ctx, now = ctx.currentTime;
      if (this._next < now) this._next = now;

      const v = this.value;
      const live = this.enabled;

      const wantSink = live && v <= this.sinkThr;
      this.sinkGain.gain.setTargetAtTime(wantSink ? 0.20 : 0, now, 0.06);
      if (wantSink) {
        this.sinkOsc.frequency.setTargetAtTime(
          clamp(300 * Math.pow(2, (v - this.sinkThr) / 7), 85, 380), now, 0.1);
      }

      while (this._next < now + 0.12) {
        if (live && v >= this.liftThr) {
          const period = 1 / beepRate(v);
          const dur = clamp(period * (0.34 + 0.045 * v), 0.028, period * 0.86);
          this._beep(this._next, beepFreq(v), dur, clamp(0.16 + 0.03 * v, 0.16, 0.30));
          if (this.onBeep) this.onBeep(this._next - now);
          this._next += period;
        } else {
          this._next += 0.05;      // idle poll
        }
      }
    }

    _beep(t, f, dur, amp) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.006);
      g.gain.setValueAtTime(amp, t + Math.max(0.01, dur - 0.012));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(this.filt);
      o.start(t); o.stop(t + dur + 0.03);
    }
  }

  VarioAudio.beepFreq = beepFreq;
  VarioAudio.beepRate = beepRate;
  global.VarioAudio = VarioAudio;

})(window);
