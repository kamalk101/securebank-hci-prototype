(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    return 'PKR ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function byText(root, selector, text) {
    return $$(selector, root).filter(function (n) { return n.textContent.trim() === text; })[0] || null;
  }
  function containsText(root, selector, text) {
    return $$(selector, root).filter(function (n) { return n.textContent.indexOf(text) > -1; })[0] || null;
  }

  function timeNow() {
    var d = new Date();
    var h = d.getHours() % 12 || 12;
    return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + (d.getHours() < 12 ? 'AM' : 'PM');
  }

  var refSeq = 100000 + (Date.now() % 800000);

  function newRef() {
    refSeq = refSeq >= 999999 ? 100000 : refSeq + 1;
    return 'SB-2026-' + refSeq;
  }

  function txNode(cls, icon, label, sub, amount, status) {
    var row = document.createElement('div');
    row.className = cls;

    var ic = document.createElement('span');
    ic.className = 'tico';
    ic.innerHTML = '<svg class="ic"><use href="#i-' + esc(icon) + '"/></svg>';

    var main = document.createElement('div');
    main.className = 'txmain';
    var name = document.createElement('b');
    name.textContent = label;
    var meta = document.createElement('span');
    meta.textContent = sub;
    main.appendChild(name);
    main.appendChild(meta);

    var right = document.createElement('div');
    right.className = 'txamt';
    var amt = document.createElement('b');
    amt.textContent = '\u2212' + money(amount);
    var stat = document.createElement(cls === 'txrow' ? 'small' : 'stat');
    if (status === 'Processing') stat.className += ' pend';
    stat.textContent = status;
    right.appendChild(amt);
    right.appendChild(stat);

    row.appendChild(ic);
    row.appendChild(main);
    row.appendChild(right);
    return row;
  }

  function recordTx(opts) {
    opts = opts || {};
    var amount = Number(opts.amount || 0);
    var ref = opts.ref || newRef();
    var time = timeNow();
    var label = opts.label || 'Transfer';
    var status = opts.status || 'Completed';

    state.balance = Math.round((state.balance - amount) * 100) / 100;

    var dash = $('#g2 .tx');
    if (dash) dash.insertBefore(txNode('txrow', opts.icon || 'swap', label, 'Today \u00b7 ' + time, amount, status), dash.firstChild);

    var hist = $('#g5 .hlist');
    if (hist) hist.insertBefore(txNode('hrow', opts.icon || 'swap', label, time, amount, status), hist.firstChild);

    var bal = $('#g2 .balnum');
    if (bal && bal.textContent.indexOf('\u2022') === -1) bal.textContent = money(state.balance);

    if (opts.kind === 'bill') {
      var bill = $('#g2 .billcard');
      if (bill) {
        bill.innerHTML = '<span class="bic"><svg class="ic"><use href="#i-checkc"/></svg></span>' +
          '<div><h4>Electricity bill paid</h4><p>K-Electric \u00b7 ' + esc(money(amount)) + '</p></div>' +
          '<button class="btn small" type="button" disabled>Paid</button>';
      }
    }

    document.dispatchEvent(new CustomEvent('sb:tx', {
      detail: { ref: ref, kind: opts.kind || 'transfer', label: label, amount: amount, balance: state.balance, status: status }
    }));
    return ref;
  }

  var SCREENS = [
    null,
    { name: 'Login', g: 'g1', b: 'b1' },
    { name: 'Home', g: 'g2', b: 'b2' },
    { name: 'Send money', g: 'g3', b: 'b3' },
    { name: 'Review & confirm', g: 'g4', b: 'b4' },
    { name: 'Transaction history', g: 'g5', b: 'b5' },
    { name: 'Bills', g: 'g6', b: 'b6' },
    { name: 'Cards', g: 'g7', b: 'b7' },
    { name: 'Settings', g: 'g8', b: 'b8' },
    { name: 'Support', g: 'g9', b: 'b9' }
  ];

  var SINGLE = window.SINGLE_VARIANT || null;

  var demoLogin = {};

  var state = {
    mode: 'good',
    step: 1,
    balance: 245780.5,
    history: { good: [1], bad: [1] },
    transfer: { to: 'Ali Raza', bank: 'Bank Alfalah', acct: '4412', amount: 15000, note: '', when: 'now' },
    bill: { name: 'K-Electric', consumer: '2210-4457-88', amount: 8420 },
    card: { online: true, contactless: true, frozen: false, blocked: false },
    prefs: { text: 1, hc: false, rm: false, lang: 'en' }
  };

  var currentId = null;
  var API = {};

  /* ---------- feedback ---------- */

  var toastTimer;
  function toast(message, tone) {
    var node = $('#toast');
    if (!node) return;
    tone = tone || 'ok';
    node.className = 'toast ' + tone;
    node.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-' +
      (tone === 'ok' ? 'checkc' : 'alert') + '"/></svg><span></span>';
    node.lastChild.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, 3200);
  }
  function hideToast() {
    var node = $('#toast');
    if (node) node.hidden = true;
    clearTimeout(toastTimer);
  }

  var dialogOpen = false;
  var lastFocus = null;

  function dialog(opts) {
    var root = $('#modalRoot');
    if (!root) return;
    if (!dialogOpen) lastFocus = document.activeElement;
    clear(root);

    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    var box = document.createElement('div');
    box.className = 'dialog' + (opts.tone === 'bad' ? ' bad' : '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'dlg-title');

    var title = document.createElement('h3');
    title.id = 'dlg-title';
    title.textContent = opts.title || 'Message';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'dlg-x';
    close.setAttribute('aria-label', 'Close dialog');
    close.textContent = '\u00d7';
    close.addEventListener('click', closeDialog);

    var body = document.createElement('div');
    body.className = 'dlg-body';
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    var actions = document.createElement('div');
    actions.className = 'dlg-actions';

    (opts.actions || [{ label: 'OK', kind: 'primary' }]).forEach(function (a) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = a.label;
      if (a.kind) btn.className = a.kind;
      btn.addEventListener('click', function () {
        var data = {};
        if (opts.collect) {
          try { data = opts.collect() || {}; } catch (err) { data = {}; }
        }
        var keep = false;
        if (a.onClick) keep = a.onClick(data) === false;
        var next = $('#modalRoot .dialog');
        if (next && next !== box) return; /* handler opened a follow-up dialog */
        if (!keep) closeDialog();
      });
      actions.appendChild(btn);
    });

    box.appendChild(close);
    box.appendChild(title);
    box.appendChild(body);
    if ((opts.actions || []).length) box.appendChild(actions);
    backdrop.appendChild(box);
    root.appendChild(backdrop);
    dialogOpen = true;

    if (opts.onMount) opts.onMount(box);

    setTimeout(function () {
      var target = opts.focus ? $(opts.focus, box) : actions.querySelector('button');
      (target || close).focus();
    }, 20);
  }

  function closeDialog() {
    if (!dialogOpen) return;
    var root = $('#modalRoot');
    if (root) root.innerHTML = '';
    dialogOpen = false;
    if (lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus({ preventScroll: true }); } catch (err) { lastFocus.focus(); }
    }
    lastFocus = null;
  }

  document.addEventListener('keydown', function (e) {
    if (!dialogOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDialog();
      return;
    }
    if (e.key === 'Tab') {
      var items = $$('#modalRoot button, #modalRoot input, #modalRoot select, #modalRoot textarea, #modalRoot a[href]');
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ---------- interaction helpers ---------- */

  function act(node, handler, label) {
    if (!node) return;
    var native = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(node.tagName);
    if (!native) {
      node.setAttribute('role', 'button');
      node.tabIndex = 0;
    }
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('click', function (e) {
      if (e && e.preventDefault) e.preventDefault();
      handler(e);
    });
    if (!native) {
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler(e);
        }
      });
    }
  }

  function makeSwitch(node, label, get, set) {
    if (!node) return;
    node.setAttribute('role', 'switch');
    node.tabIndex = 0;
    node.setAttribute('aria-label', label);
    node.setAttribute('aria-checked', String(!!get()));
    node.classList.toggle('on', !!get());
    function toggle() {
      if (node.getAttribute('aria-disabled') === 'true') return;
      var value = !get();
      set(value);
      node.classList.toggle('on', value);
      node.setAttribute('aria-checked', String(value));
    }
    node.addEventListener('click', toggle);
    node.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle();
      }
    });
  }

  function loading(button, label, ms, done) {
    if (!button || button.disabled) return;
    var html = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = label;
    setTimeout(function () {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.innerHTML = html;
      if (done) done();
    }, ms || 600);
  }

  function setErrText(err, message) {
    document.dispatchEvent(new CustomEvent('sb:error', { detail: { message: message } }));
    var icon = err.querySelector('svg');
    err.setAttribute('role', 'alert');
    err.textContent = '';
    if (icon) err.appendChild(icon);
    err.appendChild(document.createTextNode(' ' + message));
  }

  function toInput(node, opts) {
    if (!node) return null;
    opts = opts || {};
    var input = document.createElement('input');
    input.type = opts.type || 'text';
    input.className = opts.cls || '';
    input.value = opts.value == null ? '' : opts.value;
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.label) input.setAttribute('aria-label', opts.label);
    if (opts.maxlength) input.maxLength = opts.maxlength;
    if (opts.inputmode) input.inputMode = opts.inputmode;
    node.replaceWith(input);
    return input;
  }

  function inputIn(wrapper, opts) {
    clear(wrapper);
    var input = document.createElement('input');
    input.type = opts.type || 'text';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    if (opts.label) input.setAttribute('aria-label', opts.label);
    wrapper.appendChild(input);
    return input;
  }

  function searchInput(node, placeholder, label) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) node.removeChild(n);
    });
    var input = document.createElement('input');
    input.type = 'search';
    input.placeholder = placeholder;
    input.setAttribute('aria-label', label || placeholder);
    node.appendChild(input);
    return input;
  }

  function initSections() {
    $$('#phone section').forEach(function (sec) {
      var step = Number(sec.id.slice(1));
      var meta = SCREENS[step];
      if (meta) sec.setAttribute('aria-label', meta.name + ' screen');
    });
  }

  /* ---------- navigation ---------- */

  var NOTES = {
    good: '<b>Good design.</b> Nine screens that apply the HCI principles in the report: clear hierarchy, visible feedback, error prevention, and accessible controls.',
    bad: '<b>Bad design.</b> These are deliberate violations for comparison: tiny low-contrast text, ambiguous actions, no validation, and broken feedback. Do not use as a pattern.'
  };

  function updateNote() {
    var note = $('#modeNote');
    if (!note) return;
    note.className = 'mode-note ' + state.mode;
    note.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-' +
      (state.mode === 'good' ? 'shield' : 'alert') + '"/></svg><span>' + NOTES[state.mode] + '</span>';
  }

  function announce(message) {
    var live = $('#srLive');
    if (!live) {
      live = document.createElement('div');
      live.id = 'srLive';
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = message;
  }

  function updateURL() {
    try {
      var url = new URL(location.href);
      if (!SINGLE) url.searchParams.set('mode', state.mode);
      url.searchParams.set('screen', String(state.step));
      history.replaceState(null, '', url.href);
    } catch (err) { /* file:// may refuse; the app still works */ }
  }

  function syncNav(id) {
    var map = { g2: 0, g3: 1, g5: 1, g6: 1, g7: 2, g8: 4, g9: 3 };
    $$('#app-good .nav').forEach(function (nav) {
      var sec = nav.closest('section');
      var index = sec ? map[sec.id] : undefined;
      $$('a', nav).forEach(function (a, i) {
        a.classList.toggle('on', i === index);
      });
    });
  }

  function show(step, opts) {
    opts = opts || {};
    step = Math.max(1, Math.min(9, step));

    if (currentId && API[currentId] && API[currentId].leave) API[currentId].leave();

    state.step = step;
    var meta = SCREENS[step];
    var id = meta[state.mode === 'bad' ? 'b' : 'g'];

    $$('.variant .g, .variant .b').forEach(function (s) { s.classList.remove('active'); });
    var sec = document.getElementById(id);
    if (!sec) return;
    sec.classList.add('active');

    var goodWrap = $('#app-good');
    var badWrap = $('#app-bad');
    if (goodWrap) goodWrap.hidden = state.mode !== 'good';
    if (badWrap) badWrap.hidden = state.mode !== 'bad';

    $$('.mode-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode));
    });

    var label = $('#screenLabel');
    if (label) label.textContent = 'Screen ' + step + ' of 9 \u00b7 ' + meta.name;

    var back = $('#backBtn');
    if (back) back.disabled = state.history[state.mode].length <= 1;

    if (!SINGLE) updateNote();
    syncNav(id);
    closeDialog();
    hideToast();

    currentId = id;
    if (API[id] && API[id].enter) API[id].enter();

    sec.tabIndex = -1;
    try { sec.focus({ preventScroll: true }); } catch (err) { sec.focus(); }

    if (!opts.initial) updateURL();
    announce(meta.name + ' screen, ' + state.mode + ' design');
    document.dispatchEvent(new CustomEvent('sb:screen', {
      detail: { step: step, name: meta.name, mode: state.mode }
    }));
  }

  function go(step) {
    if (step === state.step) return;
    var h = state.history[state.mode];
    h.push(step);
    show(step);
  }

  function back() {
    var h = state.history[state.mode];
    if (h.length <= 1) return;
    h.pop();
    show(h[h.length - 1]);
  }

  function setMode(mode) {
    if (SINGLE) return;
    if (mode === state.mode) return;
    state.mode = mode;
    state.history[mode] = [state.step];
    show(state.step);
  }

  function adDialog(after) {
    dialog({
      tone: 'bad',
      title: 'ADVERTISEMENT',
      body: '<div style="text-align:center;color:#C00000;font:bold 26px Arial,sans-serif">50% OFF</div>' +
        '<p style="text-align:center;font:11px Arial,sans-serif;color:#666">Car loans this month only. Terms apply. Offer may not be available in your region.</p>',
      actions: [
        { label: 'No thanks', onClick: function () { if (after) after(); } },
        { label: 'Apply now', kind: 'primary', onClick: function () { toast('Application started (maybe).', 'warn'); if (after) after(); } }
      ]
    });
  }

  function badInfo(text) {
    dialog({
      tone: 'bad',
      title: 'Message',
      body: '<p style="font:11px Arial,sans-serif">' + esc(text || 'This page is not available. Try again later.') + '</p>',
      actions: [{ label: 'OK', kind: 'primary' }]
    });
  }

  /* ============================================================
     GOOD DESIGN
     ============================================================ */

  function initG1() {
    var g1 = $('#g1');
    var acct = toInput($('.field .val', g1), { value: '0245 7891 0023', label: 'Account or CNIC number', cls: 'val', inputmode: 'numeric' });
    acct.id = 'g1-acct';
    acct.autocomplete = 'username';
    var pwd = toInput($('.field .dots', g1), { type: 'password', value: 'secure123', label: 'Password', cls: 'val' });
    pwd.id = 'g1-pwd';
    pwd.autocomplete = 'current-password';

    var pwdField = pwd.closest('.field');
    var err = $('.err', g1);
    err.id = 'g1-err';
    err.hidden = true;
    pwd.setAttribute('aria-describedby', 'g1-err');

    $$('.fgroup > label', g1).forEach(function (l, i) {
      l.setAttribute('for', i === 0 ? 'g1-acct' : 'g1-pwd');
    });

    function fail(message) {
      pwdField.classList.add('error');
      err.hidden = false;
      setErrText(err, message);
      pwd.setAttribute('aria-invalid', 'true');
      pwd.focus();
    }
    function clearErr() {
      pwdField.classList.remove('error');
      err.hidden = true;
      pwd.removeAttribute('aria-invalid');
    }
    pwd.addEventListener('input', clearErr);

    var eye = $('.eye', g1);
    eye.setAttribute('aria-label', 'Show password');
    act(eye, function () {
      var hidden = pwd.type === 'password';
      pwd.type = hidden ? 'text' : 'password';
      eye.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
      eye.style.opacity = hidden ? '.55' : '1';
    });

    var remember = $('.check', g1);
    remember.setAttribute('role', 'checkbox');
    remember.tabIndex = 0;
    remember.setAttribute('aria-checked', 'false');
    function toggleRemember() {
      var on = remember.getAttribute('aria-checked') !== 'true';
      remember.setAttribute('aria-checked', String(on));
      remember.querySelector('.box').classList.toggle('on', on);
    }
    remember.addEventListener('click', toggleRemember);
    remember.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleRemember(); }
    });

    act($('.link', g1), function () {
      dialog({
        title: 'Reset your password',
        body: '<p>We will send a one-time reset link to the number ending <b>0312</b>.</p><p class="dlg-note">This prototype does not send a real message.</p>',
        actions: [
          { label: 'Cancel' },
          { label: 'Send link', kind: 'primary', onClick: function () { toast('Reset link sent to the number ending 0312.'); } }
        ]
      });
    });

    var login = $$('.btn', g1)[0];
    var bio = $$('.btn', g1)[1];
    var attempts = 0;
    var MAX_ATTEMPTS = 3;
    var LOCK_SECONDS = 30;
    var lockTick = null;
    var lockLeft = 0;
    var loginLabel = login.textContent;

    function endLock() {
      if (lockTick) { clearInterval(lockTick); lockTick = null; }
      lockLeft = 0;
      login.disabled = false;
      login.removeAttribute('aria-disabled');
      login.textContent = loginLabel;
    }

    function lockOut() {
      endLock();
      lockLeft = LOCK_SECONDS;
      login.disabled = true;
      login.setAttribute('aria-disabled', 'true');
      login.textContent = 'Try again in ' + lockLeft + 's';
      lockTick = setInterval(function () {
        lockLeft -= 1;
        if (lockLeft > 0) { login.textContent = 'Try again in ' + lockLeft + 's'; return; }
        endLock();
        attempts = 0;
        clearErr();
      }, 1000);
    }

    function wrongAttempt() {
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        fail('Too many incorrect attempts. Sign-in is locked for ' + LOCK_SECONDS + ' seconds. Use your fingerprint, or wait for the timer.');
        lockOut();
        return;
      }
      var left = MAX_ATTEMPTS - attempts;
      fail('Incorrect password. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' remaining.');
    }

    act(login, function () {
      if (lockTick) return;
      if (!pwd.value) { fail('Enter your password to continue.'); return; }
      if (pwd.value.length < 6) { fail('Password must be at least 6 characters.'); return; }
      if (pwd.value !== 'secure123') { wrongAttempt(); return; }
      attempts = 0;
      clearErr();
      loading(login, 'Signing in\u2026', 650, function () {
        go(2);
        toast('Signed in securely. Welcome back, Ayesha.');
      });
    });
    pwd.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); login.click(); }
    });
    act(bio, function () {
      loading(bio, 'Checking\u2026', 650, function () {
        pwd.value = 'secure123';
        attempts = 0;
        endLock();
        clearErr();
        go(2);
        toast('Signed in with fingerprint.');
      });
    });

    demoLogin.good = function () {
      endLock();
      attempts = 0;
      pwd.value = 'wrong123';
      pwd.dispatchEvent(new Event('input', { bubbles: true }));
      go(1);
      wrongAttempt();
    };

    act($('.register a', g1), function () {
      dialog({
        title: 'Open an account',
        body: '<p>Bring your CNIC to any branch, or start the application in the mobile app.</p><p class="dlg-note">Account opening is outside the scope of this nine-screen prototype.</p>',
        actions: [{ label: 'Got it', kind: 'primary' }]
      });
    });
  }

  function initG2() {
    var g2 = $('#g2');
    var balance = $('.balnum', g2);
    var eye = $('.balhead .eye', g2);
    var MASK = 'PKR \u2022\u2022\u2022\u2022\u2022\u2022';
    var hidden = true;

    eye.setAttribute('role', 'button');
    eye.tabIndex = 0;

    function renderBalance() {
      balance.textContent = hidden ? MASK : money(state.balance);
      eye.setAttribute('aria-pressed', String(hidden));
      eye.setAttribute('aria-label', hidden ? 'Show balance' : 'Hide balance');
    }
    renderBalance();

    act(eye, function () {
      hidden = !hidden;
      renderBalance();
    });

    API.g2 = {
      enter: function () {
        hidden = true;
        renderBalance();
      }
    };

    act($('.bellwrap .iconbtn', g2), function () { toast('No new notifications.'); }, 'Notifications');
    act($('.avatar', g2), function () { go(8); }, 'Open profile');

    var qa = $$('.qa a', g2);
    act(qa[0], function () { go(3); });
    act(qa[1], function () { go(6); });
    act(qa[2], function () {
      dialog({
        title: 'Scan a QR code',
        body: '<p>Point the camera at a merchant QR code to pay.</p><p class="dlg-note">Camera scanning is not enabled in this prototype.</p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    });
    act(qa[3], function () {
      dialog({
        title: 'Mobile top-up',
        body: '<p>Top up <b>0300 \u2022\u2022\u2022 4471</b>.</p><p class="dlg-note">Choose an amount for this demo.</p>',
        actions: [
          { label: 'PKR 250', onClick: function () { toast('PKR 250 top-up sent to 0300 \u2022\u2022\u2022 4471.'); } },
          { label: 'PKR 500', kind: 'primary', onClick: function () { toast('PKR 500 top-up sent to 0300 \u2022\u2022\u2022 4471.'); } },
          { label: 'PKR 1,000', onClick: function () { toast('PKR 1,000 top-up sent to 0300 \u2022\u2022\u2022 4471.'); } }
        ]
      });
    });

    act($('.billcard .btn', g2), function () {
      state.bill = { name: 'K-Electric', consumer: '2210-4457-88', amount: 8420 };
      go(6);
    });
    act($('.sec a', g2), function () { go(5); });
    $$('.txrow', g2).forEach(function (row) { act(row, function () { go(5); }); });
  }

  function initG3() {
    var g3 = $('#g3');
    var people = $$('.person', g3);
    var known = {
      'Ali Raza': { bank: 'Bank Alfalah', acct: '4412' },
      'Sana Malik': { bank: 'Meezan Bank', acct: '7781' },
      'HBL 8890': { bank: 'HBL', acct: '8890' }
    };

    function selectPerson(node) {
      people.forEach(function (p) { p.classList.remove('sel'); });
      node.classList.add('sel');
      var name = node.lastChild.textContent.trim();
      var info = known[name] || { bank: 'Bank Alfalah', acct: '0000' };
      state.transfer.to = name;
      state.transfer.bank = info.bank;
      state.transfer.acct = info.acct;
    }

    people.forEach(function (p) {
      if (p.classList.contains('add')) {
        act(p, function () {
          dialog({
            title: 'Add a beneficiary',
            body: '<div class="fgroup"><label for="nb-name">Full name</label><div class="field"><input id="nb-name" placeholder="e.g. Hamza Khan" autocomplete="off"></div></div>' +
              '<div class="fgroup"><label for="nb-acct">Account number</label><div class="field"><input id="nb-acct" inputmode="numeric" placeholder="8 to 16 digits" autocomplete="off"></div></div>' +
              '<p class="dlg-note" id="nb-err" role="alert"></p>',
            collect: function () {
              return { name: ($('#nb-name') || {}).value || '', acct: ($('#nb-acct') || {}).value || '' };
            },
            actions: [
              { label: 'Cancel' },
              {
                label: 'Add', kind: 'primary', onClick: function (data) {
                  var name = data.name.trim();
                  var acct = data.acct.replace(/\s/g, '');
                  if (name.length < 3 || acct.length < 6) {
                    var err = $('#nb-err');
                    if (err) err.textContent = 'Enter a name and an account number with at least 6 digits.';
                    return false;
                  }
                  var chip = document.createElement('div');
                  chip.className = 'person';
                  var ini = document.createElement('span');
                  ini.className = 'pi';
                  ini.textContent = name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
                  chip.appendChild(ini);
                  chip.appendChild(document.createTextNode(name));
                  var addChip = people[people.length - 1];
                  addChip.parentNode.insertBefore(chip, addChip);
                  known[name] = { bank: 'Bank Alfalah', acct: acct };
                  people = $$('.person', g3);
                  act(chip, function () { selectPerson(chip); });
                  selectPerson(chip);
                  toast(name + ' added and selected.');
                }
              }
            ]
          });
        }, 'Add a new beneficiary');
      } else {
        act(p, function () { selectPerson(p); });
      }
    });

    act($('.fromcard', g3), function () {
      dialog({
        title: 'Pay from',
        body: '<p>Choose the account to debit.</p>',
        actions: [
          {
            label: 'Current \u2022\u2022 0023', kind: 'primary', onClick: function () {
              $('.fromcard b', g3).textContent = 'Current account \u2022\u2022 0023';
              $('.fromcard span', g3).textContent = 'Available ' + money(state.balance);
            }
          },
          {
            label: 'Savings \u2022\u2022 8890', onClick: function () {
              $('.fromcard b', g3).textContent = 'Savings account \u2022\u2022 8890';
              $('.fromcard span', g3).textContent = 'Available PKR 96,410.00';
            }
          },
          { label: 'Cancel' }
        ]
      });
    }, 'Change the account to pay from');

    var amountBox = $('.amountbox', g3);
    var amt = toInput($('.amt', g3), { value: '15,000.00', label: 'Amount in Pakistani rupees', cls: 'amt', inputmode: 'decimal' });
    amt.setAttribute('aria-describedby', 'g3-amt-err');

    var amtErr = document.createElement('p');
    amtErr.className = 'err';
    amtErr.id = 'g3-amt-err';
    amtErr.hidden = true;
    amountBox.after(amtErr);

    function amountFail(message) {
      amountBox.style.borderColor = '#B3261E';
      amtErr.hidden = false;
      setErrText(amtErr, message);
      amt.setAttribute('aria-invalid', 'true');
      amt.focus();
    }
    function amountClear() {
      amountBox.style.borderColor = '';
      amtErr.hidden = true;
      amt.removeAttribute('aria-invalid');
    }
    amt.addEventListener('focus', function () { amt.value = amt.value.replace(/,/g, ''); });
    amt.addEventListener('input', function () {
      amountClear();
      var v = amt.value.replace(/[^\d.]/g, '');
      var dot = v.indexOf('.');
      if (dot > -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
      amt.value = v;
    });
    amt.addEventListener('blur', function () {
      var v = parseFloat(amt.value.replace(/,/g, '')) || 0;
      amt.value = v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      state.transfer.amount = v;
    });

    var scheduleNote = document.createElement('p');
    scheduleNote.className = 'demo-hint';
    scheduleNote.hidden = true;
    scheduleNote.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-clock"/></svg><span>Scheduled for today, 6:00 PM.</span>';
    amountBox.appendChild(scheduleNote);

    $$('.seg div', g3).forEach(function (seg, i) {
      act(seg, function () {
        $$('.seg div', g3).forEach(function (s) { s.classList.remove('on'); });
        seg.classList.add('on');
        state.transfer.when = i === 0 ? 'now' : 'scheduled';
        scheduleNote.hidden = i === 0;
      });
    });

    var note = toInput($('.note span', g3), { placeholder: 'Add a note (optional)', label: 'Transfer note', maxlength: 60 });
    var counter = $$('.note span', g3)[0];
    note.addEventListener('input', function () {
      counter.textContent = note.value.length + '/60';
      state.transfer.note = note.value;
    });

    var cont = $('.cta .btn', g3);
    act(cont, function () {
      var value = parseFloat(amt.value.replace(/,/g, '')) || 0;
      if (value < 100) { amountFail('Enter at least PKR 100.'); return; }
      if (value > state.balance) { amountFail('That is more than your available balance of ' + money(state.balance) + '.'); return; }
      state.transfer.amount = value;
      updateReview();
      loading(cont, 'Checking\u2026', 420, function () { go(4); });
    });

    act($('.top .iconbtn', g3), function () { go(2); }, 'Back');
    act($$('.top .iconbtn', g3)[1], function () {
      dialog({
        title: 'Transfer limits and fees',
        body: '<p>Instant transfers up to <b>PKR 1,000,000</b> per day. This transfer costs <b>PKR 0</b>.</p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    }, 'Transfer information');

    API.g3 = {
      enter: function () {
        var from = $('.fromcard b', g3);
        var avail = $('.fromcard div span', g3);
        if (from && avail && from.textContent.indexOf('Current') === 0) {
          avail.textContent = 'Available ' + money(state.balance);
        }
      }
    };
  }

  function updateReview() {
    var g4 = $('#g4');
    var values = $$('.summary .srow .v', g4);
    function setValue(node, main, sub) {
      if (!node) return;
      clear(node);
      node.appendChild(document.createTextNode(main));
      if (sub) {
        var small = document.createElement('small');
        small.textContent = sub;
        node.appendChild(small);
      }
    }
    setValue(values[0], state.transfer.to, state.transfer.bank + ' \u2022\u2022 ' + state.transfer.acct);
    setValue(values[2], money(state.transfer.amount), 'Arrives instantly');
    var total = $('.totalbox b', g4);
    if (total) total.textContent = money(state.transfer.amount);
  }

  function initG4() {
    var g4 = $('#g4');
    var otp = $('.otp', g4);
    clear(otp);
    var boxes = [];
    for (var i = 0; i < 6; i++) {
      var box = document.createElement('input');
      box.type = 'text';
      box.inputMode = 'numeric';
      box.maxLength = 1;
      box.autocomplete = 'one-time-code';
      box.setAttribute('aria-label', 'Digit ' + (i + 1) + ' of 6');
      otp.appendChild(box);
      boxes.push(box);
    }

    var confirm = $('.sheet .btn', g4);
    confirm.disabled = true;

    function code() {
      return boxes.map(function (b) { return b.value; }).join('');
    }
    function refresh() {
      confirm.disabled = code().length < 6;
    }
    boxes.forEach(function (box, i) {
      box.addEventListener('input', function () {
        box.value = box.value.replace(/\D/g, '').slice(0, 1);
        box.classList.toggle('filled', !!box.value);
        if (box.value && i < 5) boxes[i + 1].focus();
        refresh();
      });
      box.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          boxes[i - 1].focus();
          boxes[i - 1].value = '';
          boxes[i - 1].classList.remove('filled');
          refresh();
        } else if (e.key === 'ArrowLeft' && i > 0) {
          boxes[i - 1].focus();
        } else if (e.key === 'ArrowRight' && i < 5) {
          boxes[i + 1].focus();
        }
      });
      box.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        if (!text) return;
        e.preventDefault();
        text.split('').forEach(function (d, j) {
          if (boxes[j]) {
            boxes[j].value = d;
            boxes[j].classList.add('filled');
          }
        });
        refresh();
        boxes[Math.min(text.length, 5)].focus();
      });
    });

    var hint = document.createElement('p');
    hint.className = 'demo-hint';
    hint.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-info"/></svg><span>Demo: enter any 6 digits to continue.</span>';
    var sheetCopy = $('.sheet p', g4);
    if (sheetCopy) sheetCopy.after(hint);

    var resend = $('.resend span:last-child', g4);
    var resendLeft = 0;
    var resendTimer = null;
    function renderResend() {
      clear(resend);
      if (resendLeft > 0) {
        resend.appendChild(document.createTextNode('Resend in '));
        var b = document.createElement('b');
        b.textContent = '00:' + String(resendLeft).padStart(2, '0');
        resend.appendChild(b);
        resend.setAttribute('role', 'button');
        resend.tabIndex = 0;
        resend.setAttribute('aria-disabled', 'true');
      } else {
        resend.textContent = 'Resend code';
        resend.setAttribute('role', 'button');
        resend.tabIndex = 0;
        resend.removeAttribute('aria-disabled');
      }
    }
    function startResend() {
      clearInterval(resendTimer);
      resendLeft = 24;
      renderResend();
      resendTimer = setInterval(function () {
        resendLeft--;
        renderResend();
        if (resendLeft <= 0) clearInterval(resendTimer);
      }, 1000);
    }
    function requestCode() {
      if (resendLeft > 0) {
        toast('You can request another code in ' + resendLeft + ' seconds.', 'warn');
        return;
      }
      startResend();
      toast('A new code was sent to the number ending 0312.');
    }
    resend.addEventListener('click', requestCode);
    resend.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); requestCode(); }
    });

    function resetOtp() {
      boxes.forEach(function (b) { b.value = ''; b.classList.remove('filled'); });
      refresh();
    }

    act(confirm, function () {
      if (code().length < 6) return;
      loading(confirm, 'Verifying\u2026', 700, function () {
        var ref = recordTx({
          kind: 'transfer',
          label: state.transfer.to,
          amount: state.transfer.amount,
          icon: 'swap'
        });
        dialog({
          title: 'Transfer complete',
          body: '<div style="width:44px;height:44px;border-radius:50%;background:#E9F5EE;color:#1B7F4B;display:flex;align-items:center;justify-content:center;margin-bottom:12px"><svg class="ic" style="width:22px;height:22px"><use href="#i-checkc"/></svg></div>' +
            '<p><b>' + esc(money(state.transfer.amount)) + '</b> was sent to <b>' + esc(state.transfer.to) + '</b>.</p>' +
            '<p class="dlg-note">Reference ' + ref + '. The money arrives instantly.</p>',
          actions: [{
            label: 'Done', kind: 'primary', onClick: function () {
              go(2);
              toast('Transfer completed.');
            }
          }]
        });
      });
    });

    act($('.cancel', g4), function () { go(3); });
    act($('.top .iconbtn', g4), function () { go(3); }, 'Back to transfer');

    API.g4 = {
      enter: function () {
        updateReview();
        resetOtp();
        startResend();
      },
      leave: function () {
        clearInterval(resendTimer);
      }
    };
  }

  function initG5() {
    var g5 = $('#g5');
    var input = searchInput($('.search', g5), 'Search by name or amount', 'Search transactions');
    $$('.hrow', g5).forEach(function (row) { bindRow(row); });

    var chips = $$('.chip', g5);
    var chipCats = ['all', 'in', 'out', 'bills'];
    var activeCat = 'all';

    var empty = document.createElement('div');
    empty.className = 'empty';
    empty.hidden = true;
    empty.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-search"/></svg><b>No matching transactions</b><span>Try a different name, amount, or filter.</span>';
    var resetFilters = document.createElement('button');
    resetFilters.type = 'button';
    resetFilters.textContent = 'Clear filters';
    resetFilters.addEventListener('click', function () {
      input.value = '';
      activeCat = 'all';
      chips.forEach(function (c, i) { c.classList.toggle('on', i === 0); });
      apply();
    });
    empty.appendChild(resetFilters);
    $('.body', g5).appendChild(empty);

    function bindRow(row) {
      row.dataset.bound = '1';
      row.dataset.cat = row.querySelector('.txamt b.pos') ? 'in' :
        (/K-Electric|PTCL|Foodpanda/i.test(row.textContent) ? 'bills' : 'out');
      act(row, function () { openTransaction(row); });
    }

    document.addEventListener('sb:tx', function () {
      $$('.hrow', g5).forEach(function (row) {
        if (!row.dataset.bound) bindRow(row);
      });
      apply();
    });

    function apply() {
      var query = input.value.trim().toLowerCase();
      var any = false;
      $$('.hrow', g5).forEach(function (row) {
        var ok = (activeCat === 'all' || row.dataset.cat === activeCat) &&
          (!query || row.textContent.toLowerCase().indexOf(query) > -1);
        row.hidden = !ok;
        if (ok) any = true;
      });
      $$('.day', g5).forEach(function (day) {
        var list = day.nextElementSibling;
        var visible = list && $$('.hrow', list).some(function (r) { return !r.hidden; });
        day.hidden = !visible;
        if (list) list.hidden = !visible;
      });
      empty.hidden = any;
    }

    chips.forEach(function (chip, i) {
      act(chip, function () {
        activeCat = chipCats[i];
        chips.forEach(function (c) { c.classList.remove('on'); });
        chip.classList.add('on');
        apply();
      });
    });
    input.addEventListener('input', apply);

    act($('.top .iconbtn', g5), function () { go(2); }, 'Back');
    act($$('.top .iconbtn', g5)[1], function () {
      toast('Statement for October sent to ayesha.khan@example.com.');
    }, 'Download statement');

    function openTransaction(row) {
      var name = $('.txmain b', row).textContent;
      var when = $('.txmain span', row).textContent;
      var amount = $('.txamt b', row).textContent;
      var status = $('.stat', row).textContent.trim();
      dialog({
        title: name,
        body: '<p><b>' + esc(amount) + '</b> \u00b7 ' + esc(status) + '</p>' +
          '<p class="dlg-note">' + esc(when) + ' \u00b7 Reference SB' + (48210 + Math.abs(name.length * 37) % 900) + '</p>' +
          '<p>Need help with this transaction?</p>',
        actions: [
          { label: 'Close' },
          { label: 'Report an issue', kind: 'primary', onClick: function () { toast('Support has been notified about this transaction.'); } }
        ]
      });
    }
  }

  function initG6() {
    var g6 = $('#g6');
    var input = searchInput($('.search', g6), 'Search biller or company', 'Search billers');
    var billers = $$('.biller', g6);
    var cards = $('.card', g6);
    var cats = $$('.cat a', g6);
    var catNames = ['electricity', 'gas', 'internet', 'mobile'];
    var activeCat = 'all';

    var empty = document.createElement('div');
    empty.className = 'empty';
    empty.hidden = true;
    empty.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-search"/></svg><b>No saved billers here</b><span>Try another category or search for a company.</span>';
    cards.after(empty);

    function selectBiller(node) {
      billers.forEach(function (b) { b.classList.remove('sel'); });
      node.classList.add('sel');
      var name = $('b', node).textContent;
      var info = $('b', node).nextElementSibling;
      var consumer = (info ? info.textContent : '').replace(/^Consumer\s+|^Account\s+/, '');
      var amountText = $('.due div', node).textContent;
      state.bill = {
        name: name,
        consumer: consumer,
        amount: parseFloat(amountText.replace(/[^\d.]/g, '')) || 0
      };
      $('.cta p', g6).textContent = name + ' \u00b7 ' + money(state.bill.amount) + ' \u00b7 Review before paying.';
    }

    billers.forEach(function (b) { act(b, function () { selectBiller(b); }); });

    function apply() {
      var query = input.value.trim().toLowerCase();
      var any = false;
      billers.forEach(function (b) {
        var name = $('b', b).textContent.toLowerCase();
        var cat = name.indexOf('electric') > -1 ? 'electricity' :
          name.indexOf('ptcl') > -1 ? 'internet' :
          name.indexOf('jazz') > -1 ? 'mobile' : 'gas';
        var ok = (activeCat === 'all' || cat === activeCat) && (!query || name.indexOf(query) > -1);
        b.hidden = !ok;
        if (ok) any = true;
      });
      cards.hidden = !any;
      empty.hidden = any;
    }

    cats.forEach(function (cat, i) {
      act(cat, function () {
        if (activeCat === catNames[i]) {
          activeCat = 'all';
          cats.forEach(function (c) { c.style.outline = ''; c.style.borderColor = ''; });
        } else {
          activeCat = catNames[i];
          cats.forEach(function (c) { c.style.outline = ''; c.style.borderColor = ''; });
          cat.style.outline = '2px solid #0B3C5D';
          cat.style.outlineOffset = '1px';
        }
        apply();
      });
    });
    input.addEventListener('input', apply);

    var cont = $('.cta .btn', g6);
    act(cont, function () {
      if (!state.bill) { toast('Choose a biller first.', 'warn'); return; }
      dialog({
        title: 'Review bill',
        body: '<p><b>' + esc(state.bill.name) + '</b><br><span class="dlg-note">Consumer ' + esc(state.bill.consumer) + '</span></p>' +
          '<p>Amount <b>' + esc(money(state.bill.amount)) + '</b><br><span class="dlg-note">Service fee PKR 0.00</span></p>',
        actions: [
          { label: 'Cancel' },
          {
            label: 'Pay ' + money(state.bill.amount), kind: 'primary', onClick: function () {
              var billRef = recordTx({
                kind: 'bill',
                label: state.bill.name,
                amount: state.bill.amount,
                icon: 'bolt'
              });
              dialog({
                title: 'Bill paid',
                body: '<p>' + esc(money(state.bill.amount)) + ' paid to <b>' + esc(state.bill.name) + '</b>.</p>' +
                  '<p class="dlg-note">Reference ' + billRef + '. Receipt sent to your email.</p>',
                actions: [{ label: 'Done', kind: 'primary', onClick: function () { go(2); toast('Bill paid.'); } }]
              });
            }
          }
        ]
      });
    });

    act($('.sec a', g6), function () { toast('Manage billers is not part of this prototype.'); });
    act($('.top .iconbtn', g6), function () { go(2); }, 'Back');

    API.g6 = {
      enter: function () {
        var match = billers.filter(function (b) { return $('b', b).textContent === state.bill.name; })[0];
        if (match) selectBiller(match);
        apply();
      }
    };
  }

  function initG7() {
    var g7 = $('#g7');
    var card = $('.cardvis', g7);
    var number = $('.cvnum', g7);
    var status = $('.cardstat .pill', g7);
    var hint = $('.cardstat span:last-child', g7);
    var switches = $$('.sw', g7);
    var onlineSw = switches[0];
    var contactSw = switches[1];
    var freezeSw = switches[2];
    var revealTimer = null;

    function setPill(text, cls) {
      status.className = 'pill' + (cls ? ' ' + cls : '');
      clear(status);
      var dot = document.createElement('i');
      status.appendChild(dot);
      status.appendChild(document.createTextNode(text));
    }

    function revealNumber() {
      number.textContent = '4412 8890 2210 4412';
      card.classList.add('reveal');
      hint.textContent = 'Visible for 10 seconds';
      clearTimeout(revealTimer);
      revealTimer = setTimeout(function () {
        if (!state.card.blocked) number.textContent = '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4412';
        card.classList.remove('reveal');
        hint.textContent = 'Tap card to view number';
      }, 10000);
      toast('Card number visible for 10 seconds.');
    }

    act(card, function () {
      if (state.card.blocked) { toast('This card is blocked. Order a replacement first.', 'warn'); return; }
      dialog({
        title: 'Verify it\u2019s you',
        body: '<p>Use your fingerprint to view the full card number.</p>',
        actions: [
          { label: 'Cancel' },
          { label: 'Use fingerprint', kind: 'primary', onClick: revealNumber }
        ]
      });
    }, 'View card number');

    makeSwitch(onlineSw, 'Online payments', function () { return state.card.online; }, function (v) {
      state.card.online = v;
      document.dispatchEvent(new CustomEvent('sb:card', { detail: { setting: 'online', value: v } }));
      toast(v ? 'Online payments turned on.' : 'Online payments turned off.');
    });
    makeSwitch(contactSw, 'Contactless payments', function () { return state.card.contactless; }, function (v) {
      state.card.contactless = v;
      document.dispatchEvent(new CustomEvent('sb:card', { detail: { setting: 'contactless', value: v } }));
      toast(v ? 'Contactless turned on.' : 'Contactless turned off.');
    });
    makeSwitch(freezeSw, 'Freeze card', function () { return state.card.frozen; }, function (v) {
      state.card.frozen = v;
      document.dispatchEvent(new CustomEvent('sb:card', { detail: { setting: 'freeze', value: v } }));
      if (v) {
        setPill('Card paused', 'off');
        toast('Card frozen. Transactions will be declined.');
      } else if (!state.card.blocked) {
        setPill('Card active');
        toast('Card unfrozen.');
      }
      onlineSw.setAttribute('aria-disabled', String(v || state.card.blocked));
      contactSw.setAttribute('aria-disabled', String(v || state.card.blocked));
    });

    var pinRow = containsText(g7, '.setrow', 'Show PIN');
    act(pinRow, function () {
      if (state.card.blocked) { toast('This card is blocked.', 'warn'); return; }
      dialog({
        title: 'Verify it\u2019s you',
        body: '<p>Your PIN is protected. Confirm with your fingerprint to view it.</p>',
        actions: [
          { label: 'Cancel' },
          {
            label: 'Use fingerprint', kind: 'primary', onClick: function () {
              dialog({
                title: 'Your card PIN',
                body: '<p style="font-size:30px;font-weight:900;letter-spacing:8px;text-align:center;color:#0B3C5D">4 4 1 2</p><p class="dlg-note">Never share this PIN. SecureBank will never ask for it by call, SMS, or email.</p>',
                actions: [{ label: 'Hide PIN', kind: 'primary' }]
              });
            }
          }
        ]
      });
    });

    var danger = $('.danger', g7);
    act(danger, function () {
      if (state.card.blocked) { toast('This card is already blocked.'); return; }
      dialog({
        title: 'Report card as lost?',
        body: '<p>This permanently blocks the card. A replacement is ordered and arrives in 3\u20135 working days.</p><p class="dlg-note">You can cancel this and keep using the card.</p>',
        actions: [
          { label: 'Cancel' },
          {
            label: 'Block card', kind: 'danger', onClick: function () {
              state.card.blocked = true;
              state.card.frozen = true;
              setPill('Card blocked', 'blocked');
              card.classList.add('blocked');
              freezesOff();
              danger.innerHTML = '<span class="sico"><svg class="ic"><use href="#i-alert"/></svg></span><div style="flex:1"><b style="font-size:12.5px">Card blocked</b><div style="font-size:10px;color:#8A5C58">Replacement ordered \u00b7 arrives in 3\u20135 days</div></div>';
              toast('Card blocked. Replacement ordered.');
            }
          }
        ]
      });
    });

    function freezesOff() {
      state.card.online = false;
      state.card.contactless = false;
      [onlineSw, contactSw, freezeSw].forEach(function (sw) {
        sw.classList.remove('on');
        sw.setAttribute('aria-checked', 'false');
        sw.setAttribute('aria-disabled', 'true');
      });
    }

    act($('.top .iconbtn', g7), function () {
      dialog({
        title: 'Add a card',
        body: '<p>Order a new debit or credit card from the app.</p><p class="dlg-note">Card ordering is outside this prototype.</p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    }, 'Add a card');

    API.g7 = {
      enter: function () {
        if (state.card.blocked) {
          setPill('Card blocked', 'blocked');
          card.classList.add('blocked');
          freezesOff();
        } else if (state.card.frozen) {
          setPill('Card paused', 'off');
        }
      },
      leave: function () {
        clearTimeout(revealTimer);
        if (!state.card.blocked) {
          number.textContent = '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 4412';
          card.classList.remove('reveal');
        }
      }
    };
  }

  function initG8() {
    var g8 = $('#g8');
    var app = $('#app-good');
    var slider = $('.slider .track', g8);
    var range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '2';
    range.step = '1';
    range.value = '1';
    range.setAttribute('aria-label', 'Text size');
    range.setAttribute('aria-valuetext', 'Large');
    slider.replaceWith(range);

    var sizeLabel = $('.setrow .row span', g8);
    var sizeNames = ['Standard', 'Large', 'Extra large'];
    range.addEventListener('input', function () {
      var value = Number(range.value);
      app.classList.remove('ts-0', 'ts-1', 'ts-2');
      app.classList.add('ts-' + value);
      sizeLabel.textContent = sizeNames[value];
      range.setAttribute('aria-valuetext', sizeNames[value]);
      state.prefs.text = value;
    });

    var switches = $$('.sw', g8);
    var hcSw = switches[0];
    var rmSw = switches[1];
    hcSw.classList.remove('on');
    makeSwitch(hcSw, 'High contrast', function () { return state.prefs.hc; }, function (v) {
      state.prefs.hc = v;
      app.classList.toggle('hc', v);
      toast(v ? 'High contrast turned on.' : 'High contrast turned off.');
    });
    makeSwitch(rmSw, 'Reduce motion', function () { return state.prefs.rm; }, function (v) {
      state.prefs.rm = v;
      app.classList.toggle('rm', v);
      toast(v ? 'Animations reduced.' : 'Animations restored.');
    });

    $$('.langopt', g8).forEach(function (opt) {
      opt.setAttribute('aria-pressed', String(opt.classList.contains('on')));
      act(opt, function () {
        $$('.langopt', g8).forEach(function (o) {
          o.classList.remove('on');
          o.setAttribute('aria-pressed', 'false');
        });
        opt.classList.add('on');
        opt.setAttribute('aria-pressed', 'true');
        var urdu = opt.textContent.trim() === '\u0627\u0631\u062f\u0648';
        state.prefs.lang = urdu ? 'ur' : 'en';
        toast(urdu ? 'Urdu selected. Most text stays in English in this demo.' : 'English selected.');
      });
    });

    act($('.profile', g8), function () {
      dialog({
        title: 'Ayesha Khan',
        body: '<p>Current account \u2022\u2022 0023<br><span class="dlg-note">Member since 2019 \u00b7 CNIC 4412-\u2022\u2022\u2022\u2022\u2022\u2022\u2022-8</span></p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    });

    var twoFa = containsText(g8, '.setrow', 'Two-factor authentication');
    act(twoFa, function () {
      dialog({
        title: 'Two-factor authentication',
        body: '<p>On \u00b7 codes are sent by SMS to the number ending <b>0312</b>.</p><p class="dlg-note">Changing 2FA settings requires re-authentication in the full app.</p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    });

    var changePwd = containsText(g8, '.setrow', 'Change password');
    act(changePwd, function () {
      dialog({
        title: 'Change password',
        body: '<p>Last changed 2 months ago.</p><p class="dlg-note">Password changes are outside this prototype.</p>',
        actions: [{ label: 'Close', kind: 'primary' }]
      });
    });

    act($('.logout', g8), function () {
      dialog({
        title: 'Log out?',
        body: '<p>You will need your password or fingerprint to sign in again.</p>',
        actions: [
          { label: 'Cancel' },
          {
            label: 'Log out', kind: 'danger', onClick: function () {
              go(1);
              toast('You have been logged out.');
            }
          }
        ]
      });
    });
  }

  function initG9() {
    var g9 = $('#g9');
    var chat = $('.chat', g9);
    var typing = $('.typing', g9);
    var composer = $('.cinput', g9);
    var input = inputIn(composer, { placeholder: 'Type a message\u2026', label: 'Message' });
    var send = $('.circle', g9);
    var replyTimer = null;

    function timeNow() {
      return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    function addBubble(text, who) {
      var bubble = document.createElement('div');
      bubble.className = 'bubble ' + who;
      bubble.textContent = text;
      var t = document.createElement('span');
      t.className = 't';
      t.textContent = timeNow();
      bubble.appendChild(t);
      chat.appendChild(bubble);
      chat.scrollTop = chat.scrollHeight;
    }
    function replyTo(text) {
      var t = text.toLowerCase();
      if (t.indexOf('fraud') > -1 || t.indexOf('stolen') > -1) {
        return 'I have alerted our fraud team and opened case #4821. A specialist will call you within 10 minutes. You can freeze your card from Cards if you need to. Never share your OTP or PIN.';
      }
      if (t.indexOf('card') > -1) {
        return 'I can order a replacement card. It arrives in 3\u20135 working days. Would you like me to start that?';
      }
      if (t.indexOf('transfer') > -1 || t.indexOf('pending') > -1) {
        return 'Your PKR 15,000 transfer is queued and will complete within 30 minutes. No action is needed.';
      }
      return 'Thanks, I have noted that. An agent will follow up within 2 minutes. You can also call 111-222-333.';
    }
    function sendMessage(text) {
      text = (text || '').trim();
      if (!text) return;
      addBubble(text, 'me');
      input.value = '';
      typing.classList.add('show');
      chat.scrollTop = chat.scrollHeight;
      clearTimeout(replyTimer);
      replyTimer = setTimeout(function () {
        typing.classList.remove('show');
        addBubble(replyTo(text), 'them');
      }, 1300);
    }

    act(send, function () { sendMessage(input.value); }, 'Send message');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); sendMessage(input.value); }
    });
    $$('.quick span', g9).forEach(function (q) {
      act(q, function () { sendMessage(q.textContent); });
    });
    act($('.composer .iconbtn', g9), function () {
      toast('Attachments are not available in this prototype.', 'warn');
    }, 'Attach a file');
    act($('.top .iconbtn', g9), function () { go(2); }, 'Back');

    API.g9 = {
      enter: function () {
        typing.classList.remove('show');
        chat.scrollTop = chat.scrollHeight;
      },
      leave: function () {
        clearTimeout(replyTimer);
        typing.classList.remove('show');
      }
    };
  }

  /* ============================================================
     BAD DESIGN
     ============================================================ */

  function initB1() {
    var b1 = $('#b1');
    var fields = $$('.badfield', b1);
    var user = fields[0];
    var pass = fields[1];
    var attempts = 0;
    var locked = false;

    function esc(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }

    function badAlert(text, clearFields) {
      dialog({
        tone: 'bad',
        title: 'Message',
        body: text,
        actions: [{
          label: 'OK', kind: 'primary', onClick: function () {
            if (clearFields) { user.value = ''; pass.value = ''; }
          }
        }]
      });
    }

    function submit() {
      if (locked) { badAlert('Account locked. Contact your branch.', false); return; }
      if (!user.value || !pass.value) {
        badAlert('ERROR 401: INVALID_CREDENTIALS \u2014 authentication failure has occurred due to invalid credentials.', true);
        return;
      }
      if (user.value.replace(/\s+/g, '') !== '024578910023') {
        badAlert('No account found for ' + esc(user.value.trim()) + '. Check the number or visit a branch.', false);
        return;
      }
      if (pass.value !== 'secure123') {
        attempts += 1;
        if (attempts >= 3) {
          locked = true;
          badAlert('Account locked. Contact your branch.', true);
        } else {
          badAlert('ERROR 401: INVALID_CREDENTIALS \u2014 authentication failure has occurred due to invalid credentials.', true);
        }
        return;
      }
      go(2);
    }

    demoLogin.bad = function () {
      locked = false;
      attempts = 0;
      go(1);
      user.value = '0245 7891 0023';
      pass.value = 'wrong123';
      submit();
    };

    var buttons = $$('.badbtn', b1);
    act(buttons[0], submit);
    act(buttons[1], submit);

    var ad = $$('div[style*="width:108px"]', b1)[0];
    act(ad, function () { adDialog(); }, 'Car loan advertisement');

    $$('a', b1).forEach(function (a) {
      var text = a.textContent.trim();
      if (text === 'Home') {
        act(a, function () { go(2); });
      } else {
        act(a, function () { badInfo('Reset and help pages are unavailable. Call 111-222-333 (9am\u20135pm, Mon\u2013Fri, except public holidays).'); });
      }
    });
  }

  function initB2() {
    var b2 = $('#b2');

    var navMap = {
      Home: function () { go(2); },
      Accounts: function () { go(2); },
      Transfer: function () { go(3); },
      Bills: function () { go(6); },
      Cards: function () { go(7); },
      Logout: function () { go(1); },
      Loans: function () { badInfo('Loans module is under construction.'); },
      Offers: function () { adDialog(); }
    };
    $$('a', b2).forEach(function (a) {
      var text = a.textContent.trim();
      if (navMap[text]) { act(a, navMap[text]); return; }
      if (text === 'View all 43') { act(a, function () { go(5); }); return; }
      if (text === 'Refresh') {
        act(a, function () {
          a.textContent = 'Loading...';
          toast('Balance refresh timed out.', 'warn');
        });
        return;
      }
      if (text === 'Hide?') {
        act(a, function () {
          var line = containsText(b2, 'div', 'Quick balance:');
          if (line && line.firstChild) {
            line.firstChild.textContent = line.firstChild.textContent.indexOf('****') > -1
              ? line.firstChild.textContent.replace('****', '245780.5')
              : line.firstChild.textContent.replace('245780.5', '****');
          }
        });
        return;
      }
      act(a, function () { badInfo('This link is not available.'); });
    });

    var grid = $('div[style*="grid-template-columns"]', b2);
    if (grid) {
      var steps = [null, 3, 6, null, 7, 7, null, null, null, null, null, null, null, null, 8, 1];
      Array.prototype.slice.call(grid.children).forEach(function (tile, i) {
        act(tile, function () {
          if (i === 0) {
            badInfo('Quick balance: PKR 245780.5 (as of 23 Oct).');
          } else if (steps[i]) {
            go(steps[i]);
          } else if (i === 15) {
            go(1);
          } else {
            badInfo('This feature is under construction.');
          }
        });
      });
    }

    var nav = $$('.badnav span', b2);
    var navSteps = [2, 3, 6, 7, null, 8, 1, null];
    nav.forEach(function (item, i) {
      act(item, function () {
        if (navSteps[i]) go(navSteps[i]);
        else badInfo('Help is unavailable. Try again later.');
      });
    });
  }

  function initB3() {
    var b3 = $('#b3');
    var buttons = $$('.badbtn', b3);
    [0, 1, 2].forEach(function (i) {
      act(buttons[i], function () { go(4); });
    });
    act(buttons[3], function () {
      $$('input', b3).forEach(function (i) { i.value = ''; });
      $$('select', b3).forEach(function (s) { s.selectedIndex = 0; });
    });
  }

  function initB4() {
    var b4 = $('#b4');
    function finish() {
      dialog({
        tone: 'bad',
        title: 'Message',
        body: 'Transaction status is unknown. A confirmation may arrive by email within 48 hours. Do not close this window.',
        actions: [{
          label: 'OK', kind: 'primary', onClick: function () {
            go(2);
            toast('Transaction submitted (maybe).', 'warn');
          }
        }]
      });
    }
    $$('.badbtn', b4).forEach(function (btn) { act(btn, finish); });
  }

  function initB5() {
    var b5 = $('#b5');
    var goBtn = $('.badbtn', b5);
    act(goBtn, function () {
      goBtn.textContent = 'Loading...';
      goBtn.disabled = true;
      goBtn.style.color = '#BBB';
      setTimeout(function () { toast('Query timed out. Try again later.', 'warn'); }, 1200);
    });
  }

  function initB6() {
    var b6 = $('#b6');
    var list = $('div[style*="position:absolute"]', b6);
    var select = $('select', b6);

    if (list) {
      Array.prototype.slice.call(list.children).forEach(function (row) {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function () {
          var name = row.textContent.trim();
          if (name.indexOf('scroll for') > -1) return;
          var opt = document.createElement('option');
          opt.textContent = name;
          select.appendChild(opt);
          opt.selected = true;
          list.hidden = true;
        });
      });
    }

    var pay = $('.badbtn', b6);
    act(pay, function () {
      adDialog(function () {
        dialog({
          tone: 'bad',
          title: 'Message',
          body: 'Payment submitted (maybe). No receipt will be generated. Some payments may take 3\u20135 working days.',
          actions: [{ label: 'OK', kind: 'primary', onClick: function () { go(2); } }]
        });
      });
    });
  }

  function initB7() {
    var b7 = $('#b7');
    var statusLine = containsText(b7, 'div', 'Card status:');
    var buttons = $$('.badbtn', b7);

    act(buttons[0], function () {
      dialog({
        tone: 'bad',
        title: 'Message',
        body: 'Your PIN is 4412. Do not share it with anyone (except when we ask).',
        actions: [{ label: 'OK', kind: 'primary' }]
      });
    });
    act(buttons[1], function () {
      if (statusLine) statusLine.textContent = 'Card status: BLOCKED (or maybe active \u2014 check with branch).';
      buttons[1].disabled = true;
    });
    act(buttons[2], function () {
      toast('Unblock request ignored.', 'warn');
    });
    act(buttons[3], function () {
      var options = ['ACTIVE', 'BLOCKED?', 'FROZEN?', 'PENDING (unknown)'];
      if (statusLine) statusLine.textContent = 'Card status: ' + options[Math.floor(Math.random() * options.length)];
    });

    $$('[style*="width:32px"]', b7).forEach(function (sw) {
      var knob = sw.querySelector('i');
      if (!knob) return;
      act(sw, function () {
        knob.style.left = knob.style.left === '18px' ? '1px' : '18px';
      }, 'Toggle setting');
    });

    $$('a', b7).forEach(function (a) {
      act(a, function () { badInfo('Visit your nearest branch during working hours (9am\u20135pm) or call 111-222-333.'); });
    });
  }

  function initB8() {
    var b8 = $('#b8');
    var save = $('.badbtn', b8);
    act(save, function () { toast('Changes may or may not be saved.', 'warn'); });

    $$('a', b8).forEach(function (a) {
      var text = a.textContent.trim();
      if (text === 'Log Out' || text === 'Log out') {
        act(a, function () { go(1); });
      } else if (text === 'Delete Account' || text === 'Delete now') {
        act(a, function () {
          dialog({
            tone: 'bad',
            title: 'Message',
            body: 'ARE YOU SURE? This action cannot be undone (probably).',
            actions: [
              {
                label: 'Yes', kind: 'danger', onClick: function () {
                  go(1);
                  toast('Account deletion requested (pending review).', 'warn');
                }
              },
              {
                label: 'No', onClick: function () {
                  go(1);
                  toast('Account deletion requested (pending review).', 'warn');
                }
              }
            ]
          });
        });
      } else if (text === 'Reset') {
        act(a, function () { toast('Settings reset to defaults (maybe).', 'warn'); });
      } else {
        act(a, function () { badInfo('This setting is not available in your region.'); });
      }
    });
  }

  function initB9() {
    var b9 = $('#b9');
    var buttons = $$('.badbtn', b9);
    var chatBtn = buttons[0];
    var sendBtn = buttons[1];
    var input = $('input.badfield', b9);

    chatBtn.disabled = true;
    chatBtn.setAttribute('aria-disabled', 'true');

    act(sendBtn, function () {
      if (!input.value.trim()) return;
      var error = document.createElement('div');
      error.textContent = 'Error: CHAT_SESSION_TIMEOUT (code 504). Your message could not be sent.';
      error.style.cssText = 'color:#CC0000;font:7px Arial,sans-serif;margin:4px 0';
      var box = $('div[style*="height:430px"]', b9);
      if (box) box.appendChild(error);
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      toast('CHAT_SESSION_TIMEOUT (code 504).', 'bad');
    });

    $$('a', b9).forEach(function (a) {
      act(a, function () { adDialog(); });
    });
  }

  /* ============================================================
     BOOTSTRAP
     ============================================================ */

  function initShell() {
    $$('.mode-btn').forEach(function (btn) {
      act(btn, function () { setMode(btn.dataset.mode); });
    });
    act($('#backBtn'), back);
    act($('#resetBtn'), function () {
      var url = new URL(location.href);
      if (!SINGLE) url.searchParams.set('mode', state.mode);
      url.searchParams.set('screen', '1');
      location.replace(url.href);
    });
    $$('#app-good .nav').forEach(function (nav) {
      var targets = [2, 5, 7, 9, 8];
      $$('a', nav).forEach(function (a, i) {
        act(a, function () { go(targets[i]); });
      });
    });
  }

  function setClock() {
    var now = new Date();
    var hours = now.getHours() % 12 || 12;
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var text = hours + ':' + minutes;
    $$('.g .sb > span:first-child').forEach(function (n) { n.textContent = text; });
    $$('.b .bsb > span:last-child').forEach(function (n) { n.textContent = text; });
  }

  function boot() {
    initSections();
    initShell();

    if (!SINGLE || SINGLE === 'good') {
      initG1(); initG2(); initG3(); initG4(); initG5();
      initG6(); initG7(); initG8(); initG9();
    }
    if (!SINGLE || SINGLE === 'bad') {
      initB1(); initB2(); initB3(); initB4(); initB5();
      initB6(); initB7(); initB8(); initB9();
    }

    var params = new URLSearchParams(location.search);
    state.mode = SINGLE || (params.get('mode') === 'bad' ? 'bad' : 'good');
    var start = parseInt(params.get('screen'), 10);
    state.step = start >= 1 && start <= 9 ? start : 1;
    state.history[state.mode] = [state.step];

    setClock();
    show(state.step, { initial: true });

    window.__demo = {
      go: go,
      back: back,
      setMode: setMode,
      state: state,
      dialog: dialog,
      toast: toast,
      recordTx: recordTx,
      newRef: newRef,
      loginFail: function () {
        var run = demoLogin[state.mode];
        if (run) run();
      }
    };
    document.dispatchEvent(new CustomEvent('sb:ready', { detail: { mode: state.mode, single: SINGLE } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
