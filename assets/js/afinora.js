/*
 * Afinora — the drawn app mockups.
 *
 * Every animated piece on the page runs off ONE requestAnimationFrame loop
 * writing a single elapsed-beats value. Six timers would drift apart from each
 * other and cost six times as much on a phone; one clock keeps the metronome,
 * the note highway and the tuner reading as the same instrument.
 *
 * Each mockup builds its DOM once and then only writes the handful of values
 * that actually change per frame. Rebuilding the tree every frame is what makes
 * pages like this stutter.
 *
 * Strings come from window.AFINORA_I18N, injected per language by build.mjs.
 * Colours come from the app's own palette — see site.css for the sources.
 */
(function () {
  'use strict';

  var T = (window.AFINORA_I18N || {});
  var t = function (key, fallback) {
    return Object.prototype.hasOwnProperty.call(T, key) ? T[key] : fallback;
  };

  var BPM = 96;                 // the clock's own tempo
  var LANES = 6;
  var CURSOR = 26;              // % from the left where the highway cursor sits
  var PCT_PER_BEAT = 8.5;
  var TOTAL = 40;               // notes in the highway loop

  var NECK = ['#2e2013', '#27190e', '#20140b', '#1a1009', '#140c06'];
  var FINGER = ['#efe3cb', '#ffc247', '#8fbf5a', '#4db6c4', '#a682d8'];
  var LANE_INK = ['#e0554a', '#f08a3c', '#ffc247', '#8fbf5a', '#4db6c4', '#a682d8'];
  var VERDICT = ['#5ee7f0', '#8fbf5a', '#e0554a'];
  var PATTERN = [0, 1, 2, 3, 3, 2, 1, 0];
  var VERDICTS = [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 0];

  /** metronomePattern.ts TEMPO_MARKINGS — the vocabulary printed scores use. */
  var TEMPO_MARKINGS = [
    [39, 'Grave'], [47, 'Largo'], [55, 'Lento'], [65, 'Adagio'], [75, 'Andante'],
    [97, 'Moderato'], [119, 'Allegretto'], [155, 'Allegro'], [175, 'Vivace'],
    [199, 'Presto'], [300, 'Prestissimo']
  ];
  function tempoMarking(bpm) {
    for (var i = 0; i < TEMPO_MARKINGS.length; i++) {
      if (bpm <= TEMPO_MARKINGS[i][0]) return TEMPO_MARKINGS[i][1];
    }
    return 'Prestissimo';
  }

  var SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8', '12/8'];
  var SUBDIVISIONS = ['♩', '♪', '♪³', '♫'];
  var CLICK_SOUNDS = ['Wood', 'Click', 'Beep', 'Rimshot'];

  var MONO = "'IBM Plex Mono', ui-monospace, monospace";
  var DISPLAY = "'Space Grotesk', system-ui, sans-serif";
  var SANS = "'IBM Plex Sans', system-ui, sans-serif";

  // ------------------------------------------------------------- helpers

  function el(tag, style, text) {
    var node = document.createElement(tag);
    if (style) node.setAttribute('style', style);
    if (text != null) node.textContent = text;
    return node;
  }
  function add(parent, child) { parent.appendChild(child); return child; }

  var reduced = !!(window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // -------------------------------------------------- shared app chrome

  /** The app's bottom tab bar — RootNavigator.tsx's glyphs, order and labels. */
  function tabBar(active) {
    var TABS = [
      ['Tuner', '◉', t('tabTune', 'Tune')],
      ['Metronome', '◷', t('tabMetronome', 'Metronome')],
      ['ChordsAndScales', '≡', t('tabScales', 'Scales')],
      ['Training', '♪', t('tabTraining', 'Training')],
      ['Studio', '●', t('tabStudio', 'Studio')]
    ];
    var bar = el('div', 'margin-top:auto;display:flex;background:#101114;'
      + 'border-top:1px solid #1c1d22;margin:auto -16px -12px;padding-bottom:10px');
    TABS.forEach(function (tab) {
      var on = tab[0] === active;
      var cell = add(bar, el('div', 'flex:1 1 0;min-width:0;display:flex;'
        + 'flex-direction:column;align-items:center;gap:4px;padding:9px 0 3px;'
        + 'color:' + (on ? '#2dd4bf' : '#a8a29e')));
      add(cell, el('span', 'font:12px/1 sans-serif', tab[1]));
      add(cell, el('span', 'font:400 9px/1 ' + MONO + ';letter-spacing:.02em;'
        + 'white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis', tab[2]));
    });
    return bar;
  }

  function screenHead(title, sub) {
    var head = el('div', 'display:flex;align-items:flex-start;'
      + 'justify-content:space-between;gap:10px');
    var left = add(head, el('div', 'display:flex;flex-direction:column;gap:2px'));
    add(left, el('div', 'font:700 20px/1 ' + DISPLAY + ';letter-spacing:-.01em;color:#fafaf9', title));
    if (sub) add(left, el('div', 'font:600 12px/1 ' + SANS + ';color:#a8a29e', sub));
    add(head, el('div', 'width:30px;height:30px;border-radius:9px;background:#101114;'
      + 'border:1px solid #1c1d22;display:flex;align-items:center;justify-content:center;'
      + 'color:#2dd4bf;font:600 13px/1 ' + MONO, '≡'));
    return head;
  }

  // ------------------------------------------------------------- mockups
  //
  // Each builder returns { node, frame(t, beat) }. The builder runs once; frame
  // runs per tick and touches only what moves.

  /**
   * The tuner: one string being wound into tune, then the next one picked.
   *
   * Thresholds and zone colours are the app's own (tunerDisplaySmoothing.ts:
   * 4.5 cents reads as in tune, 19 as close). The residual wobble is what makes
   * it read as a live measurement rather than a slider — wide when the string is
   * far out, calm once it settles.
   */
  function buildTuner(kind) {
    var INSTRUMENTS = {
      guitar: {
        label: t('instGuitar', 'Guitar'), tuning: 'EADGBE',
        strings: [
          { name: 'E', hz: 82.41, oct: 2 }, { name: 'A', hz: 110.0, oct: 2 },
          { name: 'D', hz: 146.83, oct: 3 }, { name: 'G', hz: 196.0, oct: 3 },
          { name: 'B', hz: 246.94, oct: 3 }, { name: 'E', hz: 329.63, oct: 4 }
        ]
      },
      violin: {
        label: t('instViolin', 'Violin'), tuning: 'GDAE',
        strings: [
          { name: 'G', hz: 196.0, oct: 3 }, { name: 'D', hz: 293.66, oct: 4 },
          { name: 'A', hz: 440.0, oct: 4 }, { name: 'E', hz: 659.25, oct: 5 }
        ]
      }
    };
    var inst = INSTRUMENTS[kind] || INSTRUMENTS.guitar;
    var STRINGS = inst.strings;
    var CYCLE = 5.2;

    var root = el('div', 'position:relative;background:#0a0a0a;padding:18px 16px 12px;'
      + 'display:flex;flex-direction:column;gap:14px;height:100%;box-sizing:border-box');

    // Header
    var head = add(root, el('div', 'display:flex;align-items:flex-start;'
      + 'justify-content:space-between;gap:10px'));
    var hl = add(head, el('div', 'display:flex;flex-direction:column;gap:2px'));
    add(hl, el('div', 'font:700 21px/1 ' + DISPLAY + ';letter-spacing:-.01em;color:#fafaf9', 'Afinora'));
    add(hl, el('div', 'font:600 12px/1 ' + SANS + ';color:#a8a29e', inst.label));
    var hr = add(head, el('div', 'display:flex;align-items:center;gap:8px'));
    add(hr, el('span', 'font:600 12px/1 ' + MONO + ';color:#fbbf24', 'Pro'));
    add(hr, el('div', 'width:30px;height:30px;border-radius:9px;background:#101114;'
      + 'border:1px solid #1c1d22;display:flex;align-items:center;justify-content:center;'
      + 'color:#2dd4bf;font:600 13px/1 ' + MONO, '≡'));

    // Tuning selector
    var sel = add(root, el('div', 'background:#0e0f12;border:1px solid #1c1d22;'
      + 'border-radius:10px;padding:9px 12px;display:flex;align-items:center;'
      + 'justify-content:space-between;gap:10px'));
    var sl = add(sel, el('div', 'display:flex;flex-direction:column;gap:4px'));
    add(sl, el('div', 'font:500 9px/1 ' + MONO + ';letter-spacing:.14em;'
      + 'text-transform:uppercase;color:#a8a29e', t('tunerStandard', 'Standard')));
    add(sl, el('div', 'font:600 14px/1 ' + MONO + ';letter-spacing:.22em;color:#fafaf9', inst.tuning));
    add(sel, el('span', 'color:#a8a29e;font:400 14px/1 ' + MONO, '›'));

    // The note, in a disc tinted by the state
    var discWrap = add(root, el('div', 'display:flex;justify-content:center'));
    var disc = add(discWrap, el('div', 'width:min(150px,52%);aspect-ratio:1;border-radius:50%;'
      + 'background:#0c2018;transition:background .35s linear;display:flex;'
      + 'flex-direction:column;align-items:center;justify-content:center;gap:2px'));
    var status = add(disc, el('div', 'font:500 10px/1 ' + MONO + ';letter-spacing:.2em;'
      + 'text-transform:uppercase;color:#34d399'));
    var noteRow = add(disc, el('div', 'display:flex;align-items:flex-start'));
    var noteName = add(noteRow, el('span', 'font:700 58px/.9 ' + DISPLAY
      + ';letter-spacing:-.03em;color:#fafaf9'));
    var noteOct = add(noteRow, el('span', 'font:700 26px/1 ' + DISPLAY
      + ';color:#34d399;margin-top:2px'));

    // Flat / cents / sharp
    var row = add(root, el('div', 'display:flex;align-items:center;'
      + 'justify-content:space-between;gap:8px'));
    add(row, el('span', 'font:600 10px/1 ' + MONO + ';letter-spacing:.12em;'
      + 'text-transform:uppercase;color:#a8a29e', '♭ ' + t('tunerFlat', 'Flat')));
    var centsPill = add(row, el('span', 'font:500 12px/1 ' + MONO
      + ';color:#34d399;border:1px solid #34d399;border-radius:99px;padding:5px 12px'));
    add(row, el('span', 'font:600 10px/1 ' + MONO + ';letter-spacing:.12em;'
      + 'text-transform:uppercase;color:#a8a29e', t('tunerSharp', 'Sharp') + ' ♯'));

    // Meter: five zones and one needle
    var meter = add(root, el('div', 'position:relative;height:10px'));
    var zones = add(meter, el('div', 'position:absolute;inset:0;display:flex;'
      + 'border-radius:5px;overflow:hidden'));
    ['#2a1418', '#2a2416', '#0f2a1e', '#2a2416', '#2a1418'].forEach(function (c, i) {
      add(zones, el('span', 'flex:' + (i === 2 ? '1.2' : '1') + ';background:' + c));
    });
    var needle = add(meter, el('div', 'position:absolute;top:-5px;height:20px;width:3px;'
      + 'border-radius:2px;background:#34d399;box-shadow:0 0 10px #34d399;left:calc(50% - 1.5px)'));

    var scale = add(root, el('div', 'display:flex;align-items:center;justify-content:space-between'));
    add(scale, el('span', 'font:400 10px/1 ' + MONO + ';color:#a8a29e', '–50'));
    var centered = add(scale, el('span', 'font:500 10px/1 ' + MONO + ';letter-spacing:.16em;'
      + 'text-transform:uppercase;color:#a8a29e'));
    add(scale, el('span', 'font:400 10px/1 ' + MONO + ';color:#a8a29e', '+50'));

    // Readouts
    var boxes = add(root, el('div', 'display:flex;gap:8px'));
    function readout(caption) {
      var b = add(boxes, el('div', 'flex:1 1 0;min-width:0;background:#0e0f12;'
        + 'border:1px solid #1c1d22;border-radius:8px;padding:8px 9px;display:flex;'
        + 'flex-direction:column;gap:5px'));
      add(b, el('div', 'font:500 9px/1 ' + MONO + ';letter-spacing:.14em;'
        + 'text-transform:uppercase;color:#a8a29e;white-space:nowrap;overflow:hidden;'
        + 'text-overflow:ellipsis', caption));
      return add(b, el('div', 'font:500 14px/1 ' + MONO + ';color:#fafaf9;white-space:nowrap'));
    }
    var outDetected = readout(t('tunerDetected', 'Detected'));
    var outTarget = readout(t('tunerTarget', 'Target'));
    var outCents = readout(t('tunerCents', 'Cents'));

    // The strings, the live one ringed
    var strip = add(root, el('div', 'display:flex;gap:6px'));
    var cells = STRINGS.map(function (st) {
      var c = add(strip, el('div', 'flex:1 1 0;min-width:0;border-radius:9px;padding:8px 2px;'
        + 'text-align:center;background:#0e0f12;border:1px solid #1c1d22;display:flex;'
        + 'flex-direction:column;gap:3px'));
      var n = add(c, el('div', 'font:700 15px/1 ' + DISPLAY + ';color:#fafaf9', st.name));
      add(c, el('div', 'font:400 9px/1 ' + MONO + ';color:#a8a29e', String(Math.round(st.hz))));
      return { box: c, name: n };
    });

    add(root, tabBar('Tuner'));

    function frame(secs) {
      var idx = Math.floor(secs / CYCLE + (kind === 'violin' ? 2.4 : 0)) % STRINGS.length;
      var p = (secs % CYCLE) / CYCLE;
      var s = STRINGS[idx];

      var ease = p < 0.62 ? 1 - Math.pow(1 - p / 0.62, 2.4) : 1;
      var cents = -38 * (1 - ease) + Math.sin(secs * 7.5) * (1.6 + 5 * (1 - ease));
      if (p > 0.9) cents = cents * (1 - (p - 0.9) / 0.1) - 41 * ((p - 0.9) / 0.1);
      var abs = Math.abs(cents);

      var zone = abs <= 4.5 ? 0 : abs <= 19 ? 1 : 2;
      var TONE = ['#34d399', '#fbbf24', '#fb7185'][zone];
      var SURFACE = ['#0c2018', '#241c07', '#2a1418'][zone];
      var label = zone === 0 ? t('tunerInTune', 'In tune')
        : cents < 0 ? t('tunerFlat', 'Flat') : t('tunerSharp', 'Sharp');
      var detected = s.hz * Math.pow(2, cents / 1200);
      var signed = (cents > 0 ? '+' : '') + cents.toFixed(0);

      disc.style.background = SURFACE;
      status.textContent = label;
      status.style.color = TONE;
      noteName.textContent = s.name;
      noteOct.textContent = String(s.oct);
      noteOct.style.color = TONE;

      centsPill.textContent = signed;
      centsPill.style.color = TONE;
      centsPill.style.borderColor = TONE;

      needle.style.background = TONE;
      needle.style.boxShadow = '0 0 10px ' + TONE;
      needle.style.left = 'calc(' + Math.max(2, Math.min(98, 50 + cents)) + '% - 1.5px)';

      centered.textContent = zone === 0 ? t('tunerCentered', 'Centered') : '·';
      centered.style.color = zone === 0 ? TONE : '#a8a29e';

      outDetected.textContent = detected.toFixed(1) + ' Hz';
      outTarget.textContent = s.hz.toFixed(1) + ' Hz';
      outCents.textContent = signed;
      outCents.style.color = TONE;

      cells.forEach(function (c, i) {
        var on = i === idx;
        c.box.style.borderColor = on ? '#2dd4bf' : '#1c1d22';
        c.name.style.color = on ? '#2dd4bf' : '#fafaf9';
      });
    }

    return { node: root, frame: frame };
  }

  /**
   * The metronome: four beats of 4/4 at 100 BPM.
   *
   * The geometry is TempoDial.tsx's, expressed as ratios of its 278px wrapper —
   * the dial ring at 87.8%, the readout core at 69.1%, and the beat dots
   * orbiting at 44.2%, which is on the ring itself and clear of the tempo name
   * inside. Eyeballing these is what makes a reproduction look almost right.
   */
  function buildMetronome() {
    var beats = 4;
    var DIAL_R = 44.2;
    var DOT = 10.1;

    var root = el('div', 'position:relative;background:#0a0a0a;padding:18px 16px 12px;'
      + 'display:flex;flex-direction:column;gap:16px;height:100%;box-sizing:border-box');
    add(root, screenHead(t('screenMetronome', 'Metronome')));

    // The dial must be the flexible child: sized by width instead, every child
    // is intrinsic and the column overflows the frame.
    var dialWrap = add(root, el('div', 'flex:1 1 0;min-height:104px;display:flex;'
      + 'align-items:center;justify-content:center'));
    var dial = add(dialWrap, el('div', 'position:relative;height:100%;max-width:96%;aspect-ratio:1'));
    add(dial, el('div', 'position:absolute;inset:6.1%;border-radius:50%;background:#0e0f12'));
    var core = add(dial, el('div', 'position:absolute;inset:15.5%;border-radius:50%;'
      + 'background:#101114;display:flex;flex-direction:column;align-items:center;'
      + 'justify-content:center;gap:1px;overflow:hidden'));
    add(core, el('div', 'font:500 8px/1 ' + MONO + ';letter-spacing:.16em;color:#a8a29e;'
      + 'white-space:nowrap', tempoMarking(100).toUpperCase()));
    add(core, el('div', 'font:700 36px/1 ' + DISPLAY + ';letter-spacing:-.03em;color:#fafaf9', '100'));
    add(core, el('div', 'font:400 8px/1 ' + MONO + ';letter-spacing:.06em;color:#a8a29e;'
      + 'white-space:nowrap', 'BPM · ♪ = 100'));

    var dots = [];
    for (var i = 0; i < beats; i++) {
      var a = ((i * 360) / beats - 180 / beats) * (Math.PI / 180);
      var dot = add(dial, el('div', 'position:absolute;width:' + DOT + '%;height:' + DOT + '%;'
        + 'left:' + (50 + DIAL_R * Math.sin(a)) + '%;top:' + (50 - DIAL_R * Math.cos(a)) + '%;'
        + 'border-radius:50%;display:flex;align-items:center;justify-content:center;'
        + 'font:700 12px/1 ' + DISPLAY + ';transform:translate(-50%,-50%)', String(i + 1)));
      dots.push(dot);
    }

    add(root, el('div', 'font:400 9.5px/1.4 ' + MONO + ';letter-spacing:.14em;'
      + 'text-transform:uppercase;color:#a8a29e;text-align:center',
      t('metroHint', 'Tap a beat to accent or silence it')));

    var steps = add(root, el('div', 'display:flex;gap:6px'));
    [['−5', false], ['−1', false], ['TAP', true], ['+1', false], ['+5', false]]
      .forEach(function (s) {
        add(steps, el('div', 'flex:1 1 0;min-width:0;border-radius:9px;padding:9px 2px;'
          + 'text-align:center;background:' + (s[1] ? '#0c2018' : '#0e0f12')
          + ';border:1px solid ' + (s[1] ? '#2dd4bf' : '#1c1d22')
          + ';color:' + (s[1] ? '#2dd4bf' : '#fafaf9') + ';font:500 12px/1 ' + MONO, s[0]));
      });

    var play = add(root, el('div', 'display:flex;justify-content:center'));
    // It is running, so it shows pause.
    var transport = add(play, el('div', 'width:52px;height:52px;border-radius:50%;'
      + 'background:#2dd4bf;display:flex;align-items:center;justify-content:center;gap:4px'));
    add(transport, el('span', 'width:5px;height:18px;border-radius:2px;background:#04211d'));
    add(transport, el('span', 'width:5px;height:18px;border-radius:2px;background:#04211d'));

    var panel = add(root, el('div', 'background:#0e0f12;border:1px solid #1c1d22;'
      + 'border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:7px'));
    var sigRow = add(panel, el('div', 'display:flex;gap:3px'));
    SIGNATURES.forEach(function (s) {
      var on = s === '4/4';
      add(sigRow, el('div', 'flex:1 1 0;min-width:0;text-align:center;border-radius:7px;'
        + 'padding:7px 0;font:600 11px/1 ' + DISPLAY + ';background:' + (on ? '#0c2018' : 'transparent')
        + ';border:1px solid ' + (on ? '#2dd4bf' : 'transparent')
        + ';color:' + (on ? '#2dd4bf' : '#a8a29e'), s));
    });
    // Row labels sit above their chips: a side label steals enough width that
    // the last chip gets clipped.
    function labelledRow(caption, items, font) {
      var group = add(panel, el('div', 'display:flex;flex-direction:column;gap:4px'));
      add(group, el('span', 'font:400 8px/1 ' + MONO + ';letter-spacing:.14em;'
        + 'text-transform:uppercase;color:#a8a29e', caption));
      var r = add(group, el('div', 'display:flex;gap:4px'));
      items.forEach(function (s, i) {
        var on = i === 0;
        add(r, el('div', 'flex:1 1 0;min-width:0;text-align:center;border-radius:7px;'
          + 'padding:6px 0;font:' + font + ';background:' + (on ? '#0c2018' : 'transparent')
          + ';border:1px solid ' + (on ? '#2dd4bf' : '#1c1d22')
          + ';color:' + (on ? '#2dd4bf' : '#a8a29e') + ';white-space:nowrap', s));
      });
    }
    labelledRow(t('metroSubdivision', 'Subdivision'), SUBDIVISIONS, '13px/1 serif');
    labelledRow(t('metroSound', 'Sound'), CLICK_SOUNDS, '600 10px/1 ' + DISPLAY);

    add(root, tabBar('Metronome'));

    function frame(secs) {
      var bTime = secs * (100 / 60);          // the screen runs at 100 BPM
      var active = Math.floor(bTime) % beats;
      var pulse = 1 - (bTime % 1);            // 1 on the click, 0 just before the next

      core.style.boxShadow = '0 0 ' + (10 + pulse * 26) + 'px rgba(45,212,191,'
        + (0.05 + pulse * 0.18) + ')';
      core.style.transform = 'scale(' + (1 + pulse * 0.018) + ')';
      transport.style.boxShadow = '0 0 ' + (14 + pulse * 22) + 'px rgba(45,212,191,'
        + (0.4 + pulse * 0.4) + ')';

      dots.forEach(function (dot, i) {
        var on = i === active;
        var accent = i === 0;               // beat one is the accented one
        dot.style.background = on && accent ? '#2dd4bf' : '#101114';
        dot.style.color = on && accent ? '#04211d' : on ? '#2dd4bf' : '#fafaf9';
        dot.style.border = '1.5px solid ' + (on ? '#2dd4bf' : accent ? '#245447' : '#1c1d22');
        dot.style.transform = 'translate(-50%,-50%) scale(' + (on ? 1 + pulse * 0.12 : 1) + ')';
        dot.style.boxShadow = on ? '0 0 16px rgba(45,212,191,.5)' : 'none';
      });
    }

    return { node: root, frame: frame };
  }

  /**
   * Chords and scales: C Phrygian walked up the neck.
   *
   * Every note takes the colour of its string from the app's laneInkColors
   * ramp. A player learns that ramp once, so it has to mean the same thing here
   * as it does in the app.
   */
  function buildFretboard() {
    var ROWS = [
      { lane: 5, notes: [[1, 'F'], [3, 'G'], [4, 'A♭'], [6, 'B♭']] },
      { lane: 4, notes: [[1, 'C'], [2, 'D♭'], [4, 'E♭'], [6, 'F']] },
      { lane: 3, notes: [[0, 'G'], [1, 'A♭'], [3, 'B♭'], [5, 'C'], [6, 'D♭']] },
      { lane: 2, notes: [[1, 'E♭'], [3, 'F'], [5, 'G'], [6, 'A♭']] },
      { lane: 1, notes: [[1, 'B♭'], [3, 'C'], [4, 'D♭'], [6, 'E♭']] },
      { lane: 0, notes: [[1, 'F'], [3, 'G'], [4, 'A♭'], [6, 'B♭']] }
    ];
    var FRETS = 7;
    var SEQ = [];
    for (var r = ROWS.length - 1; r >= 0; r--) {
      for (var n = 0; n < ROWS[r].notes.length; n++) SEQ.push([r, n]);
    }

    var root = el('div', 'position:relative;background:#0a0a0a;padding:18px 16px 12px;'
      + 'display:flex;flex-direction:column;gap:14px;height:100%;box-sizing:border-box');
    add(root, screenHead(t('screenScales', 'Chords & Scales')));

    var mode = add(root, el('div', 'display:flex;gap:6px'));
    [[t('scalesTab', 'Scales'), true], [t('chordsTab', 'Chords'), false]].forEach(function (m) {
      add(mode, el('div', 'flex:1 1 0;text-align:center;border-radius:10px;padding:9px 0;'
        + 'font:600 13px/1 ' + DISPLAY + ';background:' + (m[1] ? '#0c2018' : '#0e0f12')
        + ';border:1px solid ' + (m[1] ? '#2dd4bf' : '#1c1d22')
        + ';color:' + (m[1] ? '#2dd4bf' : '#a8a29e'), m[0]));
    });

    var card = add(root, el('div', 'display:flex;align-items:center;gap:10px;'
      + 'background:#0c2018;border:1px solid #2dd4bf;border-radius:12px;padding:11px 12px'));
    add(card, el('div', 'font:700 22px/1 ' + DISPLAY + ';color:#fafaf9', 'C'));
    var cardMid = add(card, el('div', 'flex:1;min-width:0;display:flex;flex-direction:column;gap:4px'));
    add(cardMid, el('div', 'font:600 15px/1 ' + DISPLAY + ';color:#fafaf9', 'Phrygian'));
    add(cardMid, el('div', 'font:400 10px/1 ' + MONO + ';color:#a8a29e;white-space:nowrap;'
      + 'overflow:hidden;text-overflow:ellipsis',
      t('scaleDegrees', '7 notes') + ' · R ♭2 ♭3 4 5 ♭6 ♭7'));
    add(card, el('div', 'width:34px;height:34px;border-radius:9px;background:#2dd4bf;'
      + 'color:#04211d;display:flex;align-items:center;justify-content:center;'
      + 'font:11px/1 sans-serif', '▶'));

    var fbRow = add(root, el('div', 'display:flex;align-items:center;'
      + 'justify-content:space-between;gap:8px'));
    add(fbRow, el('span', 'font:400 8.5px/1 ' + MONO + ';letter-spacing:.14em;'
      + 'text-transform:uppercase;color:#6b6560', t('fretboard', 'Fretboard')));
    var fbRight = add(fbRow, el('div', 'display:flex;align-items:center;gap:5px'));
    var toggle = add(fbRight, el('div', 'display:flex;background:#0e0f12;'
      + 'border:1px solid #1c1d22;border-radius:8px;overflow:hidden'));
    [[t('notesTab', 'Notes'), true], [t('degreesTab', 'Degrees'), false]].forEach(function (s) {
      add(toggle, el('span', 'padding:6px 10px;font:600 10.5px/1 ' + DISPLAY
        + ';background:' + (s[1] ? '#0c2018' : 'transparent')
        + ';color:' + (s[1] ? '#2dd4bf' : '#a8a29e') + ';white-space:nowrap', s[0]));
    });
    add(fbRight, el('div', 'width:26px;height:26px;border-radius:7px;border:1px solid #2dd4bf;'
      + 'color:#2dd4bf;display:flex;align-items:center;justify-content:center;'
      + 'font:10px/1 ' + MONO, '⛶'));

    var board = add(root, el('div', 'flex:1;min-height:0;background:#151110;'
      + 'border:1px solid #2b2620;border-radius:10px;padding:10px 8px;display:flex;'
      + 'flex-direction:column;gap:8px'));
    add(board, el('div', 'font:500 9px/1 ' + MONO + ';letter-spacing:.14em;'
      + 'text-transform:uppercase;color:#a8a29e',
      'C Phrygian · 24 ' + t('frets', 'frets')));
    var grid = add(board, el('div', 'position:relative;flex:1;min-height:0'));

    for (var fr = 0; fr < FRETS; fr++) {
      add(grid, el('div', 'position:absolute;top:0;bottom:14px;left:'
        + ((fr + 1) / FRETS) * 100 + '%;width:' + (fr === 0 ? '3px' : '1px')
        + ';background:' + (fr === 0 ? '#e8e2d4' : '#4a4238')));
    }
    ROWS.forEach(function (row, i) {
      add(grid, el('div', 'position:absolute;left:0;right:0;top:'
        + ((i + 0.5) / ROWS.length) * 86 + '%;height:2px;background:#b8a678;opacity:.7'));
    });

    var noteNodes = [];
    ROWS.forEach(function (row, ri) {
      row.notes.forEach(function (note, ni) {
        var col = LANE_INK[row.lane];
        var tonic = note[1] === 'C';
        var node = add(grid, el('div', 'position:absolute;left:'
          + ((note[0] + 0.5) / FRETS) * 100 + '%;top:' + ((ri + 0.5) / ROWS.length) * 86 + '%;'
          + 'transform:translate(-50%,-50%);width:20px;height:20px;border-radius:50%;'
          + 'border:2px solid ' + col + ';background:' + (tonic ? col : '#151110')
          + ';color:' + (tonic ? '#141110' : col) + ';display:flex;align-items:center;'
          + 'justify-content:center;font:600 9px/1 ' + MONO + ';transition:transform .12s ease',
          note[1]));
        noteNodes.push({ node: node, ri: ri, ni: ni, col: col, tonic: tonic });
      });
    });

    var numbers = add(grid, el('div', 'position:absolute;left:0;right:0;bottom:0;display:flex'));
    for (var f2 = 0; f2 < FRETS; f2++) {
      add(numbers, el('div', 'flex:1 1 0;text-align:center;font:400 9px/1 ' + MONO
        + ';color:#6b6d75', String(f2)));
    }

    var legend = add(board, el('div', 'display:flex;gap:14px;flex-wrap:wrap'));
    function legendItem(swatch, text) {
      var item = add(legend, el('div', 'display:flex;align-items:center;gap:5px;'
        + 'font:400 8.5px/1 ' + MONO + ';letter-spacing:.1em;text-transform:uppercase;color:#a8a29e'));
      add(item, el('span', swatch));
      item.appendChild(document.createTextNode(text));
    }
    legendItem('width:9px;height:9px;border-radius:50%;background:#8fbf5a', t('tonic', 'Tonic'));
    legendItem('width:9px;height:9px;border-radius:50%;border:2px solid #a682d8',
      t('colourIsString', 'Colour = string'));

    add(root, tabBar('ChordsAndScales'));

    var lastStep = -1;
    function frame(secs, beat) {
      var step = Math.floor(beat * 2) % SEQ.length;
      if (step === lastStep) return;
      lastStep = step;
      var playing = SEQ[step];
      noteNodes.forEach(function (n) {
        var on = n.ri === playing[0] && n.ni === playing[1];
        n.node.style.transform = 'translate(-50%,-50%) scale(' + (on ? 1.28 : 1) + ')';
        n.node.style.background = on ? '#fafaf9' : n.tonic ? n.col : '#151110';
        n.node.style.color = on || n.tonic ? '#141110' : n.col;
        n.node.style.boxShadow = on ? '0 0 14px ' + n.col : 'none';
      });
    }

    return { node: root, frame: frame };
  }

  /**
   * Studio: a marked section looping under a playhead.
   *
   * A is in-tune green and B is far rose — the same pair the app uses for
   * section markers — and the record button is the rose one, breathing because
   * a take is armed.
   */
  function buildStudio() {
    var A = 0.27, B = 0.74;
    var BARS = 54;
    function clock(m) {
      var total = Math.round(470 * m);
      return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
    }

    var root = el('div', 'position:relative;background:#0a0a0a;padding:18px 16px 12px;'
      + 'display:flex;flex-direction:column;gap:14px;height:100%;box-sizing:border-box');
    add(root, screenHead(t('screenStudio', 'Studio')));

    function chip(parent, text, on) {
      return add(parent, el('div', 'border-radius:99px;padding:8px 13px;'
        + 'font:500 11.5px/1 ' + MONO + ';background:' + (on ? '#0c2018' : '#0e0f12')
        + ';border:1px solid ' + (on ? '#2dd4bf' : '#1c1d22')
        + ';color:' + (on ? '#2dd4bf' : '#a8a29e') + ';white-space:nowrap', text));
    }

    var lvl = add(root, el('div', 'background:#0e0f12;border:1px solid #1c1d22;'
      + 'border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:10px'));
    var modes = add(lvl, el('div', 'display:flex;gap:5px'));
    chip(modes, t('audioChip', 'AUDIO'), true);
    chip(modes, t('videoChip', 'VIDEO'), false);
    var meterRow = add(lvl, el('div', 'display:flex;align-items:center;'
      + 'justify-content:center;gap:4px;height:30px'));
    var levelBars = [];
    for (var i = 0; i < 11; i++) {
      levelBars.push(add(meterRow, el('span', 'width:18px;height:8px;border-radius:3px;'
        + 'background:#2dd4bf')));
    }
    add(lvl, el('div', 'font:400 9px/1 ' + MONO + ';letter-spacing:.18em;'
      + 'text-transform:uppercase;color:#a8a29e;text-align:center',
      t('inputLevel', 'Input level')));

    var trk = add(root, el('div', 'flex:1;min-height:0;background:#0e0f12;'
      + 'border:1px solid #1c1d22;border-radius:12px;padding:12px;display:flex;'
      + 'flex-direction:column;gap:10px'));
    var trkHead = add(trk, el('div', 'display:flex;align-items:center;gap:9px'));
    add(trkHead, el('div', 'width:30px;height:30px;border-radius:9px;border:1px solid #2dd4bf;'
      + 'color:#2dd4bf;display:flex;align-items:center;justify-content:center;'
      + 'font:10px/1 sans-serif;flex:0 0 auto', '▶'));
    var trkMid = add(trkHead, el('div', 'flex:1;min-width:0;display:flex;'
      + 'flex-direction:column;gap:3px'));
    add(trkMid, el('div', 'font:700 13px/1 ' + DISPLAY + ';color:#fafaf9;white-space:nowrap;'
      + 'overflow:hidden;text-overflow:ellipsis', 'Rock Pop Backing Track'));
    add(trkMid, el('div', 'font:400 9px/1 ' + MONO + ';letter-spacing:.14em;'
      + 'text-transform:uppercase;color:#a8a29e', t('backingTrack', 'Backing track')));

    var wave = add(trk, el('div', 'position:relative;flex:1;min-height:58px'));
    var barRow = add(wave, el('div', 'position:absolute;inset:0;display:flex;'
      + 'align-items:center;gap:2px'));
    var bars = [];
    for (var b = 0; b < BARS; b++) {
      var f = b / BARS;
      var amp = 0.3 + Math.abs(Math.sin(b * 1.7)) * 0.5 + Math.abs(Math.sin(b * 0.41)) * 0.2;
      var node = add(barRow, el('span', 'flex:1 1 0;height:' + Math.round(amp * 100)
        + '%;border-radius:1px;background:#1c1d22'));
      bars.push({ node: node, f: f, inSection: f >= A && f <= B });
    }
    add(wave, el('div', 'position:absolute;top:0;bottom:0;left:' + A * 100 + '%;width:2px;background:#34d399'));
    add(wave, el('div', 'position:absolute;top:-4px;left:' + A * 100 + '%;transform:translateX(-2px);'
      + 'background:#34d399;color:#141110;border-radius:4px;padding:2px 5px;font:600 9px/1 ' + MONO, 'A'));
    add(wave, el('div', 'position:absolute;top:0;bottom:0;left:' + B * 100 + '%;width:2px;background:#fb7185'));
    add(wave, el('div', 'position:absolute;bottom:-4px;left:' + B * 100 + '%;transform:translateX(-2px);'
      + 'background:#fb7185;color:#141110;border-radius:4px;padding:2px 5px;font:600 9px/1 ' + MONO, 'B'));
    var playhead = add(wave, el('div', 'position:absolute;top:-3px;bottom:-3px;left:0;width:2px;'
      + 'background:#fafaf9;box-shadow:0 0 8px rgba(250,250,249,.7)'));

    var times = add(trk, el('div', 'display:flex;align-items:baseline;'
      + 'justify-content:space-between;gap:8px'));
    add(times, el('span', 'font:400 10px/1 ' + MONO + ';color:#34d399', 'A ' + clock(A)));
    var now = add(times, el('span', 'font:500 13px/1 ' + MONO + ';color:#fafaf9'));
    add(times, el('span', 'font:400 10px/1 ' + MONO + ';color:#fb7185', 'B ' + clock(B)));

    var ctl = add(root, el('div', 'display:flex;gap:6px;flex-wrap:wrap'));
    chip(ctl, '− 100% +', false);
    chip(ctl, t('loopChip', 'Loop'), true);
    chip(ctl, t('autosaveChip', 'Auto-save'), false);
    chip(ctl, t('speedUpChip', '+5% speed-up per loop'), false);

    var recWrap = add(root, el('div', 'display:flex;justify-content:center'));
    var recOuter = add(recWrap, el('div', 'width:58px;height:58px;border-radius:50%;'
      + 'background:#101114;display:flex;align-items:center;justify-content:center'));
    var rec = add(recOuter, el('div', 'width:34px;height:34px;border-radius:50%;background:#fb7185'));

    add(root, tabBar('Studio'));

    function frame(secs) {
      var pos = A + ((secs / 9) % 1) * (B - A);
      bars.forEach(function (bar) {
        var played = bar.inSection && bar.f <= pos;
        bar.node.style.background = played ? '#34d399' : bar.inSection ? '#164e3a' : '#1c1d22';
      });
      playhead.style.left = pos * 100 + '%';
      now.textContent = clock(pos) + ' / 7:50';
      levelBars.forEach(function (bar, i) {
        var amp = Math.abs(Math.sin(secs * 3.1 + i * 0.55)) * 0.75 + 0.25;
        bar.style.height = Math.round(4 + amp * 16) + 'px';
        bar.style.opacity = String(0.35 + amp * 0.6);
      });
      var breath = Math.abs(Math.sin(secs * 1.6));
      rec.style.transform = 'scale(' + (1 + breath * 0.08) + ')';
      rec.style.boxShadow = '0 0 ' + (10 + breath * 18) + 'px rgba(251,113,133,.55)';
    }

    return { node: root, frame: frame };
  }

  /** The note highway: notes travel right to left through one fixed cursor. */
  function buildHighway() {
    var root = el('div', 'position:relative;width:100%;'
      + 'height:clamp(180px,22vw,260px);overflow:hidden;background:#0b1613');
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', t('highwayAlt',
      "Afinora's note highway: notes travel along the neck and each one is graded as it crosses the cursor"));

    add(root, el('div', 'position:absolute;inset:0;background:linear-gradient(#0b1613,#123128)'));
    add(root, el('div', 'position:absolute;left:0;right:0;top:22%;height:56%;'
      + 'background:linear-gradient(' + NECK.join(',') + ');'
      + 'border-top:1px solid #54412a;border-bottom:1px solid #54412a'));

    var barLines = [];
    for (var b = 0; b <= TOTAL; b += 4) {
      barLines.push({
        beat: b,
        node: add(root, el('div', 'position:absolute;top:22%;height:56%;width:1px;'
          + 'background:rgba(255,180,84,.32)'))
      });
    }

    for (var l = 0; l < LANES; l++) {
      add(root, el('div', 'position:absolute;left:0;right:0;top:calc(22% + '
        + ((l + 0.5) * 56) / LANES + '%);height:' + (l < 3 ? '2px' : '1px')
        + ';background:' + (l < 3 ? '#b08d52' : '#cfc9bb')
        + ';box-shadow:0 1px 2px rgba(0,0,0,.4)'));
    }

    var notes = [];
    for (var i = 0; i < TOTAL; i++) {
      var lane = (i * 5) % LANES;
      var finger = PATTERN[i % PATTERN.length];
      var node = add(root, el('div', 'position:absolute;top:calc(22% + '
        + ((lane + 0.5) * 56) / LANES + '%);transform:translate(-50%,-50%);min-width:26px;'
        + 'padding:3px 7px;border-radius:7px;text-align:center;'
        + 'font:600 13px/1 ' + MONO, String(5 + finger)));
      notes.push({ node: node, index: i, finger: finger, verdict: VERDICTS[i % VERDICTS.length] });
    }

    add(root, el('div', 'position:absolute;top:12%;bottom:12%;left:' + CURSOR + '%;width:2px;'
      + 'background:#fff8ea;box-shadow:0 0 12px rgba(255,248,234,.7)'));

    var shout = add(root, el('div', 'position:absolute;left:' + CURSOR + '%;top:4%;'
      + 'font:700 clamp(18px,2.4vw,30px)/1 ' + DISPLAY + ';letter-spacing:-.02em;'
      + 'text-shadow:0 2px 18px rgba(0,0,0,.85);white-space:nowrap;opacity:0'));

    var ticks = [];
    for (var k = 0; k <= TOTAL; k++) {
      ticks.push({
        beat: k,
        node: add(root, el('div', 'position:absolute;bottom:10px;width:3px;border-radius:2px;'
          + 'height:' + (k % 4 === 0 ? '14px' : '8px')
          + ';background:' + (k % 4 === 0 ? '#ffb454' : FINGER[k % FINGER.length])
          + ';opacity:' + (k % 4 === 0 ? '.95' : '.65')))
      });
    }

    var SHOUT = [t('shoutPerfect', 'PERFECT!'), t('shoutGood', 'GOOD!'), t('shoutMiss', 'MISS!')];

    function place(node, x) {
      if (x < -8 || x > 108) {
        node.style.display = 'none';
        return false;
      }
      node.style.display = '';
      node.style.left = x + '%';
      return true;
    }

    function frame(secs, beat) {
      var phase = beat % TOTAL;

      barLines.forEach(function (bar) {
        place(bar.node, CURSOR + (bar.beat - phase) * PCT_PER_BEAT);
      });
      ticks.forEach(function (tick) {
        place(tick.node, CURSOR + (tick.beat - phase) * PCT_PER_BEAT);
      });

      notes.forEach(function (note) {
        var x = CURSOR + (note.index - phase) * PCT_PER_BEAT;
        if (!place(note.node, x)) return;
        var passed = x < CURSOR - 0.6;
        var tone = VERDICT[note.verdict];
        var missed = passed && note.verdict === 2;
        var s = note.node.style;
        s.background = missed ? '#25100d' : FINGER[note.finger];
        s.color = missed ? tone : '#141110';
        s.border = passed ? '2px solid ' + tone : '1px solid rgba(255,255,255,.35)';
        s.boxShadow = passed ? '0 0 14px ' + tone + '66' : '0 2px 6px rgba(0,0,0,.35)';
      });

      var justPassed = Math.floor(phase);
      var p = phase - justPassed;
      if (p < 0.7) {
        var vi = VERDICTS[justPassed % VERDICTS.length];
        shout.textContent = SHOUT[vi];
        shout.style.color = VERDICT[vi];
        shout.style.opacity = String(Math.max(0, 1 - p / 0.7));
        shout.style.transform = 'translate(-50%,0) scale(' + (1 + p * 0.3) + ')';
      } else {
        shout.style.opacity = '0';
      }
    }

    return { node: root, frame: frame };
  }

  /**
   * The hero field: six strings, vibrating.
   *
   * The app's own string ramp, each lane bowed by its own slow sine so the set
   * never lines up. Not a photograph and not pretending to be one — it is the
   * thing the whole app listens to, drawn as itself.
   */
  function buildStringField() {
    var root = el('div', 'position:absolute;inset:0;overflow:hidden');
    root.setAttribute('aria-hidden', 'true');
    add(root, el('div', 'position:absolute;inset:0;background:'
      + 'radial-gradient(120% 90% at 18% 40%,#10231d 0%,#06130f 45%,#050505 100%)'));

    var lanes = [];
    for (var l = 0; l < 6; l++) {
      var top = 14 + l * 13.5;
      var thick = l < 3 ? 2.5 - l * 0.4 : 1.4 - (l - 3) * 0.15;
      var line = add(root, el('div', 'position:absolute;left:-4%;right:-4%;top:' + top + '%;'
        + 'height:' + thick + 'px;background:' + LANE_INK[l] + ';opacity:.28;filter:blur(.3px)'));
      var glow = add(root, el('div', 'position:absolute;top:' + top + '%;width:13%;'
        + 'height:' + (thick + 2) + 'px;border-radius:99px;background:' + LANE_INK[l]
        + ';opacity:.5;filter:blur(4px)'));
      lanes.push({
        line: line, glow: glow,
        amp: 5 + l * 1.1, speed: 0.9 + l * 0.17, phase: l * 1.7, drift: 7 + l * 2.3
      });
    }

    var w1 = add(root, el('div', 'position:absolute;top:10%;width:46%;height:70%;'
      + 'border-radius:50%;background:radial-gradient(closest-side,rgba(52,211,153,.13),rgba(52,211,153,0))'));
    var w2 = add(root, el('div', 'position:absolute;bottom:-10%;width:38%;height:60%;'
      + 'border-radius:50%;background:radial-gradient(closest-side,rgba(45,212,191,.1),rgba(45,212,191,0))'));

    function frame(secs) {
      lanes.forEach(function (lane) {
        var y = Math.sin(secs * lane.speed + lane.phase) * lane.amp;
        lane.line.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
        lane.glow.style.left = (((secs * lane.drift) % 132) - 16) + '%';
        lane.glow.style.transform = 'translateY(' + (y - 1).toFixed(2) + 'px)';
      });
      w1.style.left = (20 + Math.sin(secs * 0.18) * 14) + '%';
      w2.style.right = (8 + Math.cos(secs * 0.13) * 10) + '%';
    }

    return { node: root, frame: frame };
  }

  /**
   * The three signal paths of "how it listens".
   *
   * A stock photo of a guitar would decorate this section; a diagram explains
   * it. Each one shows what actually reaches the detector: air, a wire, or
   * nothing leaving the device at all.
   */
  function buildListen(kind) {
    var root = el('div', 'position:absolute;inset:0;overflow:hidden');
    root.setAttribute('aria-hidden', 'true');
    var moving = [];

    function phone(style) {
      return add(root, el('div', 'position:absolute;border-radius:8px;'
        + 'border:2px solid #a8a29e;background:#050505;' + style));
    }

    if (kind === 'mic') {
      add(root, el('div', 'position:absolute;left:16%;top:50%;width:46px;height:46px;'
        + 'margin:-23px 0 0 -23px;border-radius:50%;border:2px solid #b8a678;background:#151110'));
      for (var i = 0; i < 5; i++) {
        moving.push({ kind: 'wave', offset: i * 0.2, node: add(root, el('div',
          'position:absolute;left:16%;top:50%;border-radius:50%;border:2px solid #34d399;'
          + 'clip-path:polygon(50% 0,100% 0,100% 100%,50% 100%)')) });
      }
      phone('right:14%;top:50%;width:34px;height:58px;margin-top:-29px');
    } else if (kind === 'usb') {
      add(root, el('div', 'position:absolute;left:13%;top:50%;width:13px;height:20px;'
        + 'margin-top:-10px;border-radius:3px 1px 1px 3px;background:#c9a860'));
      add(root, el('div', 'position:absolute;left:calc(13% + 13px);top:50%;width:10px;'
        + 'height:7px;margin-top:-3.5px;background:#a8a29e'));
      add(root, el('div', 'position:absolute;left:calc(13% + 21px);right:24%;top:50%;'
        + 'height:4px;margin-top:-2px;border-radius:2px;background:#5c4a20'));
      moving.push({ kind: 'pulse', node: add(root, el('div',
        'position:absolute;top:50%;width:18px;height:10px;margin-top:-5px;border-radius:5px;'
        + 'background:#fbbf24;box-shadow:0 0 16px rgba(251,191,36,.9)')) });
      add(root, el('div', 'position:absolute;left:50%;top:50%;margin-top:14px;'
        + 'transform:translateX(-50%);font:500 9px/1 ' + MONO
        + ';letter-spacing:.18em;color:#c9a860', 'USB'));
      phone('right:14%;top:50%;width:34px;height:58px;margin-top:-29px;border-color:#fbbf24');
    } else {
      add(root, el('div', 'position:absolute;inset:16% 20%;border-radius:14px;'
        + 'border:1.5px dashed #245447'));
      var body = add(root, el('div', 'position:absolute;left:50%;top:50%;width:92px;height:74px;'
        + 'transform:translate(-50%,-50%);border-radius:10px;border:2px solid #a8a29e;'
        + 'background:#050505;overflow:hidden;display:flex;align-items:center;'
        + 'justify-content:center;gap:3px'));
      for (var j = 0; j < 13; j++) {
        moving.push({ kind: 'bar', index: j, node: add(body, el('span',
          'width:3px;border-radius:2px;background:#34d399')) });
      }
      // A pulse that reaches the boundary and dies there.
      moving.push({ kind: 'stop', node: add(root, el('div',
        'position:absolute;top:50%;width:7px;height:7px;margin-top:-3.5px;'
        + 'border-radius:50%;background:#34d399')) });
    }

    function frame(secs) {
      moving.forEach(function (m) {
        if (m.kind === 'wave') {
          var ph = (secs * 0.5 + m.offset) % 1;
          var d = 46 + ph * 190;
          m.node.style.width = d + 'px';
          m.node.style.height = d + 'px';
          m.node.style.margin = (-d / 2) + 'px 0 0 ' + (-d / 2) + 'px';
          m.node.style.opacity = String(0.55 * (1 - ph));
        } else if (m.kind === 'pulse') {
          m.node.style.left = 'calc(17% + ' + ((secs * 0.42) % 1) * 57 + '%)';
        } else if (m.kind === 'bar') {
          var amp = Math.abs(Math.sin(secs * 3.2 + m.index * 0.62));
          m.node.style.height = Math.round(6 + amp * 40) + 'px';
          m.node.style.opacity = String(0.4 + amp * 0.6);
        } else {
          var p = (secs * 0.45) % 1;
          m.node.style.left = 'calc(50% + ' + (46 + p * 34) + 'px)';
          m.node.style.opacity = String(0.75 * (1 - p));
        }
      });
    }

    return { node: root, frame: frame };
  }

  // ------------------------------------------------------------ mounting

  var BUILDERS = {
    tuner: function () { return buildTuner('guitar'); },
    'tuner-violin': function () { return buildTuner('violin'); },
    metronome: buildMetronome,
    fretboard: buildFretboard,
    studio: buildStudio,
    highway: buildHighway,
    field: buildStringField,
    'listen-mic': function () { return buildListen('mic'); },
    'listen-usb': function () { return buildListen('usb'); },
    'listen-device': function () { return buildListen('device'); }
  };

  var pieces = [];

  function mount() {
    var slots = document.querySelectorAll('[data-mock]');
    Array.prototype.forEach.call(slots, function (slot) {
      var make = BUILDERS[slot.getAttribute('data-mock')];
      if (!make) return;
      var piece = make();
      slot.textContent = '';
      slot.appendChild(piece.node);
      pieces.push(piece);
    });

    // One static frame either way, so a reduced-motion visitor sees a composed
    // screen rather than an empty one.
    draw(1.6);

    if (reduced || !pieces.length) return;
    run();
  }

  /**
   * Paint one frame.
   *
   * Each piece is wrapped on its own: without this, a single throw anywhere in
   * the ten would skip the requestAnimationFrame at the end of the tick and
   * kill the whole loop silently, leaving every mockup drawn but frozen. A
   * piece that fails is dropped and the rest keep running.
   */
  function draw(secs) {
    var beat = (secs / 60) * BPM;
    for (var i = pieces.length - 1; i >= 0; i--) {
      try {
        pieces[i].frame(secs, beat);
      } catch (err) {
        pieces.splice(i, 1);
        if (window.console && console.warn) console.warn('Afinora: mockup stopped', err);
      }
    }
  }

  var running = false;

  function run() {
    if (running || reduced || !pieces.length) return;
    running = true;
    var t0 = performance.now();
    (function tick(now) {
      draw((now - t0) / 1000);
      if (running) requestAnimationFrame(tick);
    })(performance.now());
  }

  /**
   * Browsers stop requestAnimationFrame in a hidden tab and resume it on
   * return, but a tab discarded and restored by a memory saver comes back with
   * no loop at all. Restarting on the way back in costs nothing and covers it.
   */
  function watchVisibility() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && !reduced) {
        running = false;
        run();
      }
    });

    // Someone who turns system animations back on while the page is open
    // should get them, rather than having to reload.
    if (window.matchMedia) {
      var query = window.matchMedia('(prefers-reduced-motion: reduce)');
      var onChange = function (e) {
        reduced = e.matches;
        if (!reduced) run();
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  }

  /**
   * Scroll reveal.
   *
   * The hiding class is added by script, never by the stylesheet, so a browser
   * without IntersectionObserver shows every section instead of a blank page.
   */
  function reveal() {
    if (reduced || !window.IntersectionObserver) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll('main > section'), 1);
    if (!sections.length) return;
    document.documentElement.classList.add('js-reveal');
    sections.forEach(function (s) { s.classList.add('pending'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('shown');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    sections.forEach(function (s) { io.observe(s); });

    /**
     * Show everything at once before jumping to an anchor.
     *
     * A hidden section still occupies its space but sits 22px low, and it
     * snaps into place the moment the smooth scroll passes it. Every one of
     * those shifts moves the target further up while the browser is still
     * travelling towards where it used to be, so a jump to #download lands
     * short — which reads as a link that does nothing. Revealing first means
     * the page has stopped moving before the scroll starts.
     */
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href*="#"]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      var hash = href.slice(href.indexOf('#'));
      if (hash.length < 2 || !document.querySelector(hash)) return;
      // Only for links that stay on this page.
      var path = href.split('#')[0];
      if (path && path !== location.pathname && path !== './' && path !== '') return;
      io.disconnect();
      sections.forEach(function (s) { s.classList.add('shown'); });
    }, true);
  }

  /** Close the language menu on an outside click, the way a menu should. */
  function languageMenu() {
    var menu = document.querySelector('details.lang');
    if (!menu) return;
    document.addEventListener('click', function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.open) menu.open = false;
    });
  }

  function start() { mount(); watchVisibility(); reveal(); languageMenu(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
