/* ============================================================
   STUDY LAYER
   Presenter console, annotation pins, task sheet, SUS,
   instrumentation and edge-state demos for the SecureBank
   prototype. Classic script: works over file:// as well.

   Depends on window.__demo (exposed by app.js).
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var MODE = window.SINGLE_VARIANT === 'bad' ? 'bad' : 'good';
  var STORE_KEY = 'sb.study.v1';

  var SCREENS = [
    'Login',
    'Home',
    'Send money',
    'Review & confirm',
    'Transaction history',
    'Bills',
    'Cards',
    'Settings',
    'Support'
  ];

  /* ---------- annotation content ----------
     Each entry: t = title, d = explanation, sel = target element
     (matched inside the active screen), x/y = fallback position as a
     fraction of the phone frame. */

  var CALLOUTS = {
    good: {
      1: [
        { t: 'Inline, specific error message', d: '"Incorrect password. 2 attempts left." says what failed, how many attempts remain, and what to do next. It sits on the field, not in a banner at the top of the screen.', sel: '.err' },
        { t: 'A second way to sign in', d: 'Fingerprint removes the memory burden of a long password and provides a fallback that still feels secure.', sel: '.btn.ghost' },
        { t: 'Security expectation set early', d: 'The notice states that the bank never asks for a PIN, password, or OTP by call, SMS, or email — reducing the chance a customer falls for a scam.', sel: '.secure' }
      ],
      2: [
        { t: 'Balance is scannable and can be hidden', d: 'The amount is the largest element on the screen. The eye control hides it for use in public without leaving the screen.', sel: '.balance' },
        { t: 'Four frequent tasks, one tap away', d: 'Transfer, pay bill, scan QR, and top-up cover routine banking, so users do not hunt through menus.', sel: '.qa' },
        { t: 'Status is visible per transaction', d: '"Completed" and "Processing" answer the question "did my money move?" without opening a detail screen.', sel: '.tx' }
      ],
      3: [
        { t: 'Saved beneficiaries first', d: 'A known recipient is one tap and the account details fill themselves. Adding a new person is secondary and clearly marked.', sel: '.people' },
        { t: 'The amount field prevents bad input', d: 'A numeric keypad opens, commas are formatted automatically, and the limit error appears under the field.', sel: '.amountbox' },
        { t: 'One obvious primary action', d: 'A single primary button at the bottom; back and information stay as header icons, so the main path is unambiguous.', sel: '.cta' }
      ],
      4: [
        { t: 'Grouped summary before commitment', d: 'Recipient, account, amount, and fee sit in one block so the user can check details before an irreversible action.', sel: '.summary' },
        { t: 'Consequence stated in advance', d: 'The warning that transfers cannot be reversed appears before the OTP — the right moment to stop a mistake.', sel: '.warn' },
        { t: 'Code entry with a visible resend timer', d: 'Six boxes match the OTP format; the countdown removes the "should I press again?" uncertainty.', sel: '.resend' }
      ],
      5: [
        { t: 'Search and filters together', d: 'Users narrow by name, amount, or category instead of scrolling a long list.', sel: '.search' },
        { t: 'Dates chunk the list', d: 'Day headings turn one long list into short, scannable groups — an application of chunking.', sel: '.day' },
        { t: 'Status and direction are explicit', d: 'Colour, sign, and a text label carry the same meaning, so nothing depends on colour alone.', sel: '.hlist' }
      ],
      6: [
        { t: 'Billers grouped by category', d: 'Electricity, gas, internet, and mobile are visible first; the long tail sits behind search rather than in the user\'s face.', sel: '.cat' },
        { t: 'Saved biller keeps the consumer number', d: 'The app remembers the consumer number and the due amount, which shortens a monthly recurring task.', sel: '.body' },
        { t: 'Review before money leaves the account', d: 'A confirmation repeats biller, consumer number, and amount, so a typo is caught before payment.', sel: '.cta' }
      ],
      7: [
        { t: 'Card state is shown on the card', d: 'The card itself changes when it is frozen or blocked, matching the mental model of a physical card.', sel: '.cardvis' },
        { t: 'Toggles give instant feedback', d: 'Each switch announces its new state and disables incompatible options, preventing contradictory settings.', sel: '.sw' },
        { t: 'Destructive action is separated', d: '"Report card as lost" is visually distinct, explained, and confirmed — not mixed in with everyday switches.', sel: '.danger' }
      ],
      8: [
        { t: 'Text size with immediate preview', d: 'Three steps instead of a numeric field; the change applies at once, so the user sees the result before leaving.', sel: '.slider, input[type="range"]' },
        { t: 'Contrast and motion are user choices', d: 'Accessibility preferences are first-class settings, not hidden developer options.', sel: '.sw' },
        { t: 'Account actions at the bottom', d: 'Log out and delete account sit away from frequently changed settings and require confirmation.', sel: '.logout, .danger' }
      ],
      9: [
        { t: 'Live chat shows presence and wait time', d: 'An online indicator and an expected reply time set expectations, so waiting does not feel like a broken screen.', sel: '.chathead, .presence, .chat' },
        { t: 'Quick topics before typing', d: 'Common issues are offered as chips, which is faster than describing a problem from scratch.', sel: '.chips, .topics' },
        { t: 'A clear route to a human', d: 'Escalation to a call or email is visible with hours, so the user is never trapped in a loop.', sel: '.contact, .cta' }
      ]
    },
    bad: {
      1: [
        { t: 'Error exposed as a system code', d: '"ERROR 401: INVALID_CREDENTIALS" names the internal fault, not the user\'s problem. It does not say which field is wrong or what to do.', x: .5, y: .3 },
        { t: 'A deceptive security option', d: '"Remember my password on this public computer" invites a security mistake and is presented as a normal checkbox.', x: .5, y: .62 },
        { t: 'Competing calls to action and an advert', d: 'SUBMIT, Login, and Reset are different words for overlapping actions, and an advertisement sits above the form.', x: .5, y: .82 }
      ],
      2: [
        { t: 'Twelve equally weighted links', d: 'Home, Loans, and Offers look the same as Transfer. Nothing signals frequency or importance.', x: .5, y: .22 },
        { t: 'Advertising before banking', d: 'Hot offers and banners take the top of the screen and push balance and actions below the fold.', x: .5, y: .42 },
        { t: 'Tiny text and internal jargon', d: '"Enquiry", "Beneficia…", and 8 px labels force reading and guessing instead of recognition.', x: .5, y: .74 }
      ],
      3: [
        { t: 'Too many mandatory fields', d: 'Branch code, purpose, CNIC, and remarks are required or ambiguous, although the bank already knows most of this.', x: .5, y: .5 },
        { t: 'No format guidance or validation', d: 'Amount, account number, and bank are plain text boxes; the rules appear only after submission, if at all.', x: .5, y: .64 },
        { t: '"Step 1 of ?"', d: 'An unknown number of steps prevents the user from estimating the effort — a direct violation of feedback and user control.', x: .5, y: .2 }
      ],
      4: [
        { t: 'Uncertain outcome', d: '"Transaction may or may not have completed" gives no reliable state, and no reference number exists for follow-up.', x: .5, y: .3 },
        { t: 'Total is a question mark', d: 'Fee "--" and Total "?" mean the debited amount is unknown, so the user cannot verify the transaction.', x: .5, y: .5 },
        { t: '"ARE YOU SURE???"', d: 'A modal with technical language and no clear button labels interrupts at the worst possible moment.', x: .5, y: .66 }
      ],
      5: [
        { t: 'Five date formats in one list', d: '24/10/26, Oct 24 2026, 23-10-2026, Yesterday, and 10/23/2026 all appear. The same information is formatted five ways.', x: .5, y: .48 },
        { t: 'A one-letter status column', d: 'A bare "S" or coloured dot does not say Completed, Pending, or Failed. Meaning depends on a legend that is not shown.', x: .5, y: .64 },
        { t: 'Round trip before any data', d: 'Account radio buttons and a "GO" button add a step before a single transaction can be seen.', x: .5, y: .2 }
      ],
      6: [
        { t: 'A 45-item dropdown with duplicates', d: 'Companies appear in a flat menu, with K-Electric Karachi listed twice, and there is no search.', x: .5, y: .35 },
        { t: 'Hedged fees and dates', d: '"(maybe)", "(subject to change)", and "late fee may apply" undermine trust in the amount that will be charged.', x: .5, y: .62 },
        { t: 'No confirmation step', d: 'The form proceeds without reviewing biller, consumer number, and total, so a typo becomes a lost payment.', x: .5, y: .85 }
      ],
      7: [
        { t: 'Full card number and PIN on screen', d: 'The screen shows 1234 5678 9012 4412 and PIN 4412 without verification — a serious privacy failure.', x: .5, y: .35 },
        { t: 'Contradictory status', d: '"ACTIVE (or maybe blocked — check with branch)" tells the user nothing. System state must be definite.', x: .5, y: .58 },
        { t: 'Freeze / Disable / Lock', d: 'Three labels for overlapping concepts, placed next to SHOW PIN and BLOCK CARD with no explanation.', x: .5, y: .75 }
      ],
      8: [
        { t: 'Save is disconnected from the change', d: '"Changes may or may not be saved" puts the burden on the user to verify whether settings applied.', x: .5, y: .2 },
        { t: 'Unlabelled, self-contradicting controls', d: 'A toggle reads "ON (international, maybe off)" — the label contradicts its own state.', x: .5, y: .55 },
        { t: 'Destructive actions in the ordinary list', d: 'Log out and Delete Account are ordinary rows without separation or confirmation.', x: .5, y: .72 }
      ],
      9: [
        { t: 'Chat is online and unavailable at once', d: 'The page promises "Chat with us" while the transcript shows timeouts and "This chat has ended".', x: .5, y: .32 },
        { t: 'An error code shown to the customer', d: '"CHAT_SESSION_TIMEOUT (code 504)" is a developer message, not an explanation or a next step.', x: .5, y: .56 },
        { t: 'No ticket and no transcript', d: 'Chat history is not saved and no ticket number is issued, so the user must repeat the problem.', x: .5, y: .82 }
      ]
    }
  };

  var TASKS = [
    { id: 'T1', title: 'Sign in to the app', hint: 'Login screen → Home', auto: 'screen:2' },
    { id: 'T2', title: 'Send PKR 15,000 to Ali Raza', hint: 'Send money → review → OTP', auto: 'tx:transfer' },
    { id: 'T3', title: 'Pay the K-Electric bill', hint: 'Home → Pay now, or Bills', auto: 'tx:bill' },
    { id: 'T4', title: 'Freeze the debit card', hint: 'Cards → Freeze card', auto: 'card:freeze' },
    { id: 'T5', title: 'Find the Foodpanda payment', hint: 'History → search "foodpanda"', auto: 'search:foodpanda' }
  ];

  var SUS_ITEMS = [
    'I think that I would like to use this system frequently.',
    'I found the system unnecessarily complex.',
    'I thought the system was easy to use.',
    'I think that I would need the support of a technical person to be able to use this system.',
    'I found the various functions in this system were well integrated.',
    'I thought there was too much inconsistency in this system.',
    'I would imagine that most people would learn to use this system very quickly.',
    'I found the system very cumbersome to use.',
    'I felt very confident using the system.',
    'I needed to learn a lot of things before I could get going with this system.'
  ];

  /* ---------- persisted session ---------- */

  var S = {
    participant: '',
    events: [],
    sus: null,
    tasks: {},
    started: Date.now()
  };

  var SESSION_START = Date.now();
  var skeletonTimer = null;
  var longNames = [];

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      S.participant = typeof data.participant === 'string' ? data.participant : '';
      S.events = Array.isArray(data.events) ? data.events : [];
      S.sus = data.sus || null;
      S.tasks = data.tasks && typeof data.tasks === 'object' ? data.tasks : {};
      if (data.started) S.started = data.started;
    } catch (err) { /* storage may be blocked; the session still runs */ }
  }

  function save() {
    try {
      if (S.events.length > 800) S.events = S.events.slice(-800);
      localStorage.setItem(STORE_KEY, JSON.stringify({
        participant: S.participant,
        events: S.events,
        sus: S.sus,
        tasks: S.tasks,
        started: S.started
      }));
    } catch (err) { /* quota or private mode */ }
  }

  var saveTimer = null;
  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function iso(t) { return new Date(t || Date.now()).toISOString(); }

  function log(type, data) {
    var entry = { t: iso(), p: S.participant || null, mode: MODE, e: type };
    if (data) {
      for (var k in data) {
        if (Object.prototype.hasOwnProperty.call(data, k)) entry[k] = data[k];
      }
    }
    S.events.push(entry);
    saveSoon();
    if (type !== 'tap') renderDataIfOpen();
  }

  /* ---------- tiny DOM helpers ---------- */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function txt(value) { return document.createTextNode(value == null ? '' : String(value)); }

  function button(label, cls, handler, title) {
    var b = document.createElement('button');
    b.type = 'button';
    if (cls) b.className = cls;
    b.textContent = label;
    if (title) b.title = title;
    if (handler) b.addEventListener('click', handler);
    return b;
  }

  function app() { return window.__demo; }

  function go(step) {
    if (!app()) return;
    app().go(step);
  }

  function toast(message, tone) {
    if (app()) app().toast(message, tone);
  }

  /* ---------- presenter bar ---------- */

  var bar = null;
  var mapButtons = [];
  var step = 1;

  function buildBar() {
    bar = el('div', 'study-bar');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Study console');

    var brand = el('div', 'sb-brand');
    brand.appendChild(el('span', 'sb-dot'));
    brand.appendChild(el('b', null, 'Study console'));
    var chip = button(S.participant || 'P—', 'sb-part', function () { openPanel('tasks'); }, 'Participant code — click to set');
    chip.id = 'sbParticipant';
    brand.appendChild(chip);
    bar.appendChild(brand);

    var nav = el('div', 'sb-nav');
    nav.appendChild(button('\u2039', 'sb-arrow', function () { prev(); }, 'Previous screen (Left arrow)'));
    var map = el('div', 'sb-map');
    map.setAttribute('role', 'group');
    map.setAttribute('aria-label', 'Screen map');
    for (var i = 1; i <= 9; i++) {
      (function (n) {
        var b = button(String(n), null, function () { go(n); }, 'Screen ' + n + ' \u00b7 ' + SCREENS[n - 1]);
        b.setAttribute('aria-label', 'Screen ' + n + ' of 9, ' + SCREENS[n - 1]);
        b.dataset.step = String(n);
        if ((CALLOUTS[MODE][n] || []).length) b.classList.add('has-note');
        map.appendChild(b);
        mapButtons.push(b);
      })(i);
    }
    nav.appendChild(map);
    nav.appendChild(button('\u203a', 'sb-arrow', function () { next(); }, 'Next screen (Right arrow)'));
    bar.appendChild(nav);

    var tools = el('div', 'sb-tools');

    var annoBtn = button(null, 'sb-tool', function () { toggleAnno(); }, 'Annotations (A)');
    annoBtn.setAttribute('aria-pressed', 'false');
    annoBtn.innerHTML = 'Annotations <kbd>A</kbd>';
    annoBtn.id = 'sbAnnoBtn';

    var taskBtn = button(null, 'sb-tool', function () { openPanel('tasks'); }, 'Task sheet (T)');
    taskBtn.innerHTML = 'Tasks <kbd>T</kbd>';

    var susBtn = button(null, 'sb-tool', function () { openPanel('sus'); }, 'SUS questionnaire (S)');
    susBtn.innerHTML = 'SUS <kbd>S</kbd>';

    var edgeBtn = button(null, 'sb-tool', function () { openPanel('edge'); }, 'Edge states (E)');
    edgeBtn.innerHTML = 'States <kbd>E</kbd>';

    var dataBtn = button(null, 'sb-tool', function () { openPanel('data'); }, 'Session data (D)');
    dataBtn.innerHTML = 'Data <kbd>D</kbd>';

    var cleanBtn = button(null, 'sb-tool', function () { toggleClean(); }, 'Clean presentation mode (C)');
    cleanBtn.innerHTML = 'Clean <kbd>C</kbd>';

    var helpBtn = button('?', 'sb-tool', function () { openPanel('help'); }, 'Shortcuts and protocol (?)');

    tools.appendChild(annoBtn);
    tools.appendChild(taskBtn);
    tools.appendChild(susBtn);
    tools.appendChild(edgeBtn);
    tools.appendChild(dataBtn);
    tools.appendChild(cleanBtn);
    tools.appendChild(helpBtn);
    bar.appendChild(tools);

    document.body.appendChild(bar);

    var exit = button('Exit clean mode', 'sb-exit', function () { toggleClean(false); }, 'Leave clean mode');
    document.body.appendChild(exit);
  }

  function prev() { if (step > 1) go(step - 1); }
  function next() { if (step < 9) go(step + 1); }

  function markMap(n) {
    step = n;
    mapButtons.forEach(function (b) {
      var on = Number(b.dataset.step) === n;
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'step' : 'false');
    });
  }

  /* ---------- annotations ---------- */

  var annoOn = false;
  var annoPanel = null;
  var pinEls = [];

  function toggleAnno(force) {
    annoOn = typeof force === 'boolean' ? force : !annoOn;
    document.body.classList.toggle('sb-annotate', annoOn);
    var btn = $('#sbAnnoBtn');
    if (btn) btn.setAttribute('aria-pressed', String(annoOn));
    if (annoOn) {
      buildAnnoPanel();
      renderPins();
      log('annotation', { state: 'on', step: step });
    } else {
      removePins();
      if (annoPanel) { annoPanel.remove(); annoPanel = null; }
      log('annotation', { state: 'off', step: step });
    }
  }

  function buildAnnoPanel() {
    if (annoPanel) annoPanel.remove();
    annoPanel = el('aside', 'anno-panel');
    annoPanel.setAttribute('aria-label', 'Screen annotations');

    var head = el('div', 'anno-head');
    var wrap = el('div');
    var h2 = el('h2', null, 'Screen ' + step + ' \u00b7 ' + SCREENS[step - 1]);
    wrap.appendChild(h2);
    wrap.appendChild(el('p', null, MODE === 'good' ? 'Good design — what to point at' : 'Bad design — what is deliberately wrong'));
    head.appendChild(wrap);
    head.appendChild(button('\u00d7', 'anno-close', function () { toggleAnno(false); }, 'Close annotations'));
    annoPanel.appendChild(head);

    annoPanel.appendChild(el('p', 'anno-foot', 'Pins point at the element on the phone. Click a pin or a card to pair them; the numbered panel is the text used in the report walkthrough.'));

    buildAnnoItems();

    var stage = $('.stage');
    if (stage) stage.appendChild(annoPanel);
  }

  function buildAnnoItems() {
    if (!annoPanel) return;
    $$('.anno-item', annoPanel).forEach(function (n) { n.remove(); });
    var foot = $('.anno-foot', annoPanel);
    var list = CALLOUTS[MODE][step] || [];
    list.forEach(function (c, i) {
      var item = el('div', 'anno-item');
      item.dataset.n = String(i + 1);
      item.setAttribute('role', 'button');
      item.tabIndex = 0;
      item.appendChild(el('span', 'anno-num', String(i + 1)));
      var body = el('div');
      body.appendChild(el('h3', null, c.t));
      body.appendChild(el('p', null, c.d));
      item.appendChild(body);
      item.addEventListener('click', function () {
        $$('.anno-item', annoPanel).forEach(function (n) { n.classList.remove('on'); });
        item.classList.add('on');
        var pin = pinEls[i];
        if (pin) pin.classList.add('on');
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
      if (foot) annoPanel.insertBefore(item, foot);
      else annoPanel.appendChild(item);
    });
  }

  function removePins() {
    pinEls.forEach(function (p) { p.remove(); });
    pinEls = [];
  }

  function renderPins() {
    removePins();
    var phone = $('#phone');
    if (!phone || !annoOn) return;
    var list = CALLOUTS[MODE][step] || [];
    list.forEach(function (c, i) {
      var pin = button(String(i + 1), 'sb-pin', function () {
        $$('.sb-pin').forEach(function (p) { p.classList.remove('on'); });
        pin.classList.add('on');
        var card = $$('.anno-item', annoPanel)[i];
        if (card && annoPanel) {
          card.classList.add('on');
          card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, c.t);
      pin.dataset.n = String(i + 1);
      pin.setAttribute('aria-label', 'Annotation ' + (i + 1) + ': ' + c.t);
      phone.appendChild(pin);
      pinEls.push(pin);
    });
    placePins();
    if (window.requestAnimationFrame) window.requestAnimationFrame(placePins);
  }

  function placePins() {
    var phone = $('#phone');
    if (!phone || !annoOn) return;
    var sec = $('#phone section.active');
    var pr = phone.getBoundingClientRect();
    var list = CALLOUTS[MODE][step] || [];
    pinEls.forEach(function (pin, i) {
      var c = list[i];
      if (!c) return;
      var x = pr.width * (c.x == null ? 0.5 : c.x);
      var y = pr.height * (c.y == null ? 0.35 : c.y);
      if (c.sel && sec) {
        var target = null;
        c.sel.split(',').some(function (sel) {
          var found = sec.querySelector(sel.trim());
          if (found) { target = found; return true; }
          return false;
        });
        if (target) {
          var r = target.getBoundingClientRect();
          if (r.width > 6 && r.height > 6) {
            x = r.left - pr.left + r.width * 0.5;
            y = r.top - pr.top + Math.min(r.height * 0.5, 24);
          }
        }
      }
      x = Math.max(16, Math.min(pr.width - 16, x));
      y = Math.max(54, Math.min(pr.height - 56, y));
      pin.style.left = x + 'px';
      pin.style.top = y + 'px';
    });
  }

  /* ---------- drawer ---------- */

  var drawer = null;
  var lastFocus = null;

  function openPanel(name) {
    if (drawer) closePanel();
    lastFocus = document.activeElement;
    drawer = el('aside', 'study-drawer');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'false');
    drawer.setAttribute('aria-label', 'Study panel');
    drawer.dataset.panel = name;

    var head = el('div', 'sd-head');
    var titles = { tasks: 'Task sheet', sus: 'System Usability Scale', data: 'Session data', edge: 'Edge states', help: 'Shortcuts and protocol' };
    head.appendChild(el('h2', null, titles[name] || name));
    head.appendChild(button('\u00d7', 'sd-close', closePanel, 'Close panel'));
    drawer.appendChild(head);

    var body = el('div', 'sd-body');
    body.id = 'sbDrawerBody';
    drawer.appendChild(body);
    document.body.appendChild(drawer);

    renderPanel(name);
    log('panel', { name: name });
    var close = $('.sd-close', drawer);
    if (close) close.focus();
  }

  function closePanel() {
    if (!drawer) return;
    drawer.remove();
    drawer = null;
    if (lastFocus && document.contains(lastFocus)) {
      try { lastFocus.focus(); } catch (err) { /* ignore */ }
    }
  }

  function renderPanel(name) {
    if (!drawer) return;
    var body = $('#sbDrawerBody', drawer);
    if (!body) return;
    body.innerHTML = '';
    if (name === 'tasks') renderTasks(body);
    else if (name === 'sus') renderSus(body);
    else if (name === 'data') renderData(body);
    else if (name === 'edge') renderEdge(body);
    else renderHelp(body);
  }

  function renderDataIfOpen() {
    if (drawer && drawer.dataset.panel === 'data') {
      var body = $('#sbDrawerBody', drawer);
      if (body) { body.innerHTML = ''; renderData(body); }
    }
  }

  /* ---------- participant ---------- */

  function participantField(body) {
    body.appendChild(el('h3', null, 'Session'));
    body.appendChild(el('p', null, 'Enter the code written on the consent form. It is stored only in this browser and printed in every export.'));
    var field = document.createElement('input');
    field.className = 'sd-field';
    field.value = S.participant;
    field.placeholder = 'e.g. P01';
    field.setAttribute('aria-label', 'Participant code');
    field.maxLength = 16;
    field.addEventListener('input', function () {
      S.participant = field.value.trim();
      var chip = $('#sbParticipant');
      if (chip) chip.textContent = S.participant || 'P—';
      saveSoon();
    });
    field.addEventListener('change', function () {
      log('participant', { code: S.participant });
    });
    body.appendChild(field);
    return field;
  }

  /* ---------- tasks ---------- */

  function taskState(id) {
    return S.tasks[id] || { status: 'idle' };
  }

  function startTask(id) {
    S.tasks[id] = { status: 'active', start: Date.now() };
    log('task-start', { id: id });
    save();
    renderPanel('tasks');
  }

  function completeTask(id) {
    var t = taskState(id);
    if (t.status === 'done') return;
    var start = t.start || Date.now();
    S.tasks[id] = { status: 'done', start: start, end: Date.now(), ms: Date.now() - start };
    log('task-done', { id: id, ms: Date.now() - start });
    save();
    if (drawer && drawer.dataset.panel === 'tasks') renderPanel('tasks');
    toast('Task ' + id + ' completed.');
  }

  function skipTask(id) {
    S.tasks[id] = { status: 'skipped', end: Date.now() };
    log('task-skip', { id: id });
    save();
    renderPanel('tasks');
  }

  function renderTasks(body) {
    participantField(body);

    body.appendChild(el('h3', null, 'Tasks'));
    body.appendChild(el('p', null, 'Start a task before the participant tries it. Completion is logged automatically for T1–T5; the time shown is from Start to completion.'));

    TASKS.forEach(function (task) {
      var st = taskState(task.id);
      var card = el('div', 'task');
      var head = el('header');
      head.appendChild(el('span', 'tid', task.id));
      head.appendChild(el('h4', null, task.title));
      card.appendChild(head);
      card.appendChild(el('p', 'hint', task.hint));

      var meta = el('div', 'meta');
      var pill = el('span', 'pillstate ' + (st.status === 'active' ? 'active' : st.status === 'done' ? 'done' : st.status === 'skipped' ? 'skip' : ''), st.status);
      meta.appendChild(pill);
      if (st.status === 'done' && st.ms != null) {
        meta.appendChild(el('span', 'ms', (st.ms / 1000).toFixed(1) + ' s'));
      }
      meta.appendChild(el('span', 'ms', ''));
      card.appendChild(meta);

      var row = el('div', 'sb-btn-row');
      if (st.status === 'active') {
        row.appendChild(button('Mark done', 'sb-btn sm primary', function () { completeTask(task.id); }));
        row.appendChild(button('Skip', 'sb-btn sm', function () { skipTask(task.id); }));
      } else if (st.status === 'done' || st.status === 'skipped') {
        row.appendChild(button('Restart', 'sb-btn sm', function () { startTask(task.id); }));
      } else {
        row.appendChild(button('Start', 'sb-btn sm primary', function () { startTask(task.id); }));
      }
      card.appendChild(row);
      body.appendChild(card);
    });

    var actions = el('div', 'sb-btn-row');
    actions.appendChild(button('Reset tasks', 'sb-btn sm', function () {
      S.tasks = {};
      log('task-reset', {});
      save();
      renderPanel('tasks');
    }));
    actions.appendChild(button('Export now', 'sb-btn sm', function () {
      exportJson();
    }));
    body.appendChild(actions);
    body.appendChild(el('p', 'sd-note', MODE === 'good'
      ? 'Automatic completion: T1 on reaching Home, T2 on a completed transfer, T3 on a paid bill, T4 on freezing the card, T5 on searching "foodpanda" in History.'
      : 'Only T1 completes automatically in this build. Mark the others done or skipped yourself; record why the participant could not finish.'));
  }

  /* ---------- SUS ---------- */

  function renderSus(body) {
    participantField(body);

    body.appendChild(el('h3', null, 'System Usability Scale'));
    body.appendChild(el('p', null, 'Ten statements, five-point scale from strongly disagree (1) to strongly agree (5). Score = ((odd − 1) + (5 − even)) × 2.5, giving 0–100.'));

    var form = document.createElement('form');
    form.id = 'sbSusForm';
    SUS_ITEMS.forEach(function (statement, i) {
      var q = el('div', 'sus-q');
      q.appendChild(el('p', null, (i + 1) + '. ' + statement));
      var scale = el('div', 'sus-scale');
      for (var v = 1; v <= 5; v++) {
        var label = document.createElement('label');
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'sus-' + i;
        input.value = String(v);
        if (S.sus && S.sus.answers && S.sus.answers[i] === v) input.checked = true;
        label.appendChild(input);
        label.appendChild(txt(String(v)));
        scale.appendChild(label);
      }
      q.appendChild(scale);
      form.appendChild(q);
    });

    var total = el('div', 'sus-total');
    total.id = 'sbSusTotal';
    total.appendChild(el('b', null, S.sus ? String(S.sus.score) : '\u2014'));
    total.appendChild(el('span', null, S.sus ? 'saved score (0–100)' : 'complete all ten, then score'));
    form.appendChild(total);

    var actions = el('div', 'sb-btn-row');
    actions.appendChild(button('Score', 'sb-btn primary', function (e) {
      e.preventDefault();
      scoreSus(form);
    }));
    actions.appendChild(button('Reset form', 'sb-btn', function (e) {
      e.preventDefault();
      form.reset();
    }));
    form.appendChild(actions);
    body.appendChild(form);

    body.appendChild(el('p', 'sd-note', 'Interpretation used in the report: above 80 = excellent, 68 = average, below 51 = poor. Save the score to include it in the export.'));
  }

  function scoreSus(form) {
    var answers = [];
    for (var i = 0; i < 10; i++) {
      var checked = form.querySelector('input[name="sus-' + i + '"]:checked');
      if (!checked) {
        toast('Answer all 10 statements before scoring.', 'warn');
        return;
      }
      answers.push(Number(checked.value));
    }
    var sum = 0;
    answers.forEach(function (r, idx) { sum += (idx % 2 === 0) ? r - 1 : 5 - r; });
    var score = sum * 2.5;
    S.sus = { answers: answers, score: score, at: iso() };
    log('sus', { score: score, answers: answers.join('') });
    save();

    var total = $('#sbSusTotal');
    if (total) {
      total.innerHTML = '';
      total.appendChild(el('b', null, String(score)));
      total.appendChild(el('span', null, score >= 80 ? 'excellent' : score >= 68 ? 'above average' : score >= 51 ? 'below average' : 'poor'));
    }
    toast('SUS score saved: ' + score.toFixed(1));
  }

  /* ---------- data ---------- */

  function counts() {
    var c = { screen: 0, tap: 0, error: 0, tx: 0, done: 0, events: S.events.length };
    S.events.forEach(function (e) {
      if (e.e === 'task-done') c.done += 1;
      else if (c[e.e] != null) c[e.e] += 1;
    });
    return c;
  }

  function renderData(body) {
    participantField(body);

    var c = counts();
    var grid = el('div', 'sbs-grid');
    [['Events', c.events], ['Screen views', c.screen], ['Taps', c.tap], ['Validation errors', c.error], ['Transactions', c.tx], ['Tasks done', c.done]].forEach(function (pair) {
      var box = el('div', 'sbs');
      box.appendChild(el('b', null, String(pair[1])));
      box.appendChild(el('span', null, pair[0]));
      grid.appendChild(box);
    });
    body.appendChild(grid);

    body.appendChild(el('h3', null, 'Export'));
    var actions = el('div', 'sb-btn-row');
    actions.appendChild(button('Download JSON', 'sb-btn primary', exportJson));
    actions.appendChild(button('Download CSV', 'sb-btn', exportCsv));
    actions.appendChild(button('Copy JSON', 'sb-btn', copyJson));
    body.appendChild(actions);

    body.appendChild(el('h3', null, 'Log preview'));
    var area = document.createElement('textarea');
    area.className = 'sd-json';
    area.setAttribute('readonly', 'readonly');
    area.setAttribute('aria-label', 'Event log preview');
    area.value = JSON.stringify(S.events.slice(-40), null, 1);
    body.appendChild(area);

    var foot = el('p', 'sd-note');
    foot.textContent = 'Session ' + Math.round((Date.now() - SESSION_START) / 60000) + ' min. Events are saved in this browser under ' + STORE_KEY + '. Clearing the log removes them permanently.';
    body.appendChild(foot);

    var danger = el('div', 'sb-btn-row');
    danger.appendChild(button('Clear session log', 'sb-btn danger', function () {
      if (!window.confirm('Delete all logged events for this prototype?')) return;
      S.events = [];
      S.tasks = {};
      S.sus = null;
      save();
      renderPanel('data');
    }));
    body.appendChild(danger);
  }

  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 800);
  }

  function stamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function payload() {
    return {
      study: 'SecureBank HCI prototype',
      variant: MODE,
      participant: S.participant || null,
      startedAt: iso(S.started),
      exportedAt: iso(),
      sus: S.sus,
      tasks: S.tasks,
      events: S.events
    };
  }

  function exportJson() {
    var name = 'securebank-' + MODE + '-' + (S.participant || 'anon') + '-' + stamp() + '.json';
    download(name, JSON.stringify(payload(), null, 2), 'application/json');
    log('export', { format: 'json' });
    toast('JSON exported.');
  }

  function exportCsv() {
    var rows = [['timestamp', 'participant', 'variant', 'event', 'step', 'name', 'value']];
    S.events.forEach(function (e) {
      rows.push([
        e.t,
        e.p || '',
        e.mode || MODE,
        e.e,
        e.step == null ? '' : e.step,
        e.name || e.label || e.id || '',
        e.message || e.ref || e.score || e.state || ''
      ]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (v) {
        var s = String(v == null ? '' : v);
        return '"' + s.replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    var name = 'securebank-' + MODE + '-' + (S.participant || 'anon') + '-' + stamp() + '.csv';
    download(name, csv, 'text/csv');
    log('export', { format: 'csv' });
    toast('CSV exported.');
  }

  function copyJson() {
    var text = JSON.stringify(payload(), null, 2);
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); toast('JSON copied.'); }
      catch (err) { toast('Copy failed — use Download JSON.', 'warn'); }
      area.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('JSON copied.'); }, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- edge states ---------- */

  function removeBanner() {
    $$('.edge-banner').forEach(function (b) { b.remove(); });
    document.body.classList.remove('sb-offline');
  }

  function edge(name) {
    log('edge', { name: name });
    var phone = $('#phone');

    if (name === 'offline') {
      removeBanner();
      if (!phone) return;
      var banner = el('div', 'edge-banner');
      banner.setAttribute('role', 'status');
      var label = el('span', null, 'You are offline. Last 30 days of history are still available.');
      banner.appendChild(label);
      banner.appendChild(button('Retry', null, function () {
        label.textContent = 'Reconnecting\u2026';
        setTimeout(function () {
          removeBanner();
          toast('Back online. Everything is up to date.');
          log('edge', { name: 'online' });
        }, 900);
      }));
      phone.appendChild(banner);
      document.body.classList.add('sb-offline');
      return;
    }

    if (name === 'timeout') {
      app().dialog({
        title: 'Session expired',
        body: '<p>For your security you were signed out after 30 minutes of inactivity.</p><p class="dlg-note">Your draft transfer was saved and is waiting on the Home screen.</p>',
        actions: [{ label: 'Log in again', kind: 'primary', onClick: function () { go(1); } }]
      });
      return;
    }

    if (name === 'biometric') {
      go(1);
      setTimeout(function () {
        app().dialog({
          title: 'Fingerprint not recognised',
          body: '<p>We could not match your fingerprint. You can try again or use your password.</p><p class="dlg-note">Nothing is locked. Two attempts remain before the password is required.</p>',
          actions: [
            { label: 'Use password' },
            { label: 'Try again', kind: 'primary', onClick: function () { toast('Fingerprint accepted.'); } }
          ]
        });
      }, 240);
      return;
    }

    if (name === 'amount') {
      go(3);
      setTimeout(function () {
        var amt = $('#g3 .amt');
        if (!amt) return;
        amt.focus();
        amt.value = '999999';
        amt.dispatchEvent(new Event('input', { bubbles: true }));
        amt.dispatchEvent(new Event('blur'));
        var cta = $('#g3 .cta .btn');
        if (cta) cta.click();
      }, 280);
      return;
    }

    if (name === 'longname') {
      go(5);
      setTimeout(function () {
        if (longNames.length) return;
        $$('#g5 .hrow .txmain b').slice(0, 4).forEach(function (b, i) {
          longNames.push([b, b.textContent]);
          b.textContent = i === 0
            ? 'Muhammad Abdul Rehman Traders and General Store (Pvt) Ltd'
            : i === 1
              ? 'Syed Muhammad Hassan Ali Raza Qadri'
              : i === 2
                ? 'K-Electric Limited — Karachi South Region'
                : 'Foodpanda Pakistan (Pvt) Ltd — Gulshan Branch';
        });
        log('edge', { name: 'longname-applied' });
      }, 260);
      return;
    }

    if (name === 'skeleton') {
      go(2);
      setTimeout(function () {
        var targets = $$('#g2 .balnum, #g2 .txmain b, #g2 .txamt b');
        targets.forEach(function (n) { n.classList.add('sk'); });
        toast('Loading the latest balance\u2026');
        clearTimeout(skeletonTimer);
        skeletonTimer = setTimeout(function () {
          targets.forEach(function (n) { n.classList.remove('sk'); });
          toast('Balance updated just now.');
        }, 1400);
      }, 260);
      return;
    }

    if (name === 'text') {
      go(8);
      setTimeout(function () {
        var range = $('#g8 input[type="range"]');
        if (!range) return;
        range.value = '2';
        range.dispatchEvent(new Event('input', { bubbles: true }));
        toast('Text size set to Extra large.');
        log('edge', { name: 'text-200' });
      }, 260);
      return;
    }

    if (name === 'reset') {
      removeBanner();
      clearTimeout(skeletonTimer);
      $$('.sk').forEach(function (n) { n.classList.remove('sk'); });
      longNames.forEach(function (pair) { pair[0].textContent = pair[1]; });
      longNames = [];
      var range = $('#g8 input[type="range"]');
      if (range) {
        range.value = '1';
        range.dispatchEvent(new Event('input', { bubbles: true }));
      }
      toast('Edge states reset.');
      return;
    }
  }

  function renderEdge(body) {
    body.appendChild(el('h3', null, 'Simulated conditions'));
    body.appendChild(el('p', null,
      MODE === 'good'
        ? 'These are the states the report claims are handled. Each one can be triggered live during a demo or a usability session.'
        : 'The bad design handles almost none of these. Triggering them shows the gap the good design closes; note what the participant sees.'

    ));

    var list = [
      ['offline', 'Network loss + retry', 'Banner with retry; history stays readable'],
      ['timeout', '30-second session timeout', 'Explained sign-out, draft preserved'],
      ['biometric', 'Biometric rejected', 'Retry or fall back to password'],
      ['amount', 'Amount above balance', 'Inline error with the real available balance'],
      ['longname', 'Very long beneficiary names', 'Rows wrap without pushing amounts off-screen'],
      ['skeleton', 'Slow balance refresh', 'Skeleton state, then a fresh value'],
      ['text', 'Text size: extra large', 'Uses the real Settings control'],
      ['reset', 'Reset all simulated states', '']
    ];

    var grid = el('div', 'edge-grid');
    list.forEach(function (item) {
      var b = button(item[1], 'sb-btn' + (item[0] === 'reset' ? ' ghost' : ''), function () { edge(item[0]); });
      b.title = item[2];
      grid.appendChild(b);
    });
    body.appendChild(grid);

    var note = el('p', 'edge-note');
    note.textContent = MODE === 'good'
      ? 'Offline, timeout, and skeleton states are simulated locally; no network request is made. All other states use the real interface logic.'
      : 'This build does not implement recovery states on purpose. Use the console to show the failure, then compare with the good build.';
    body.appendChild(note);

    if (MODE === 'good') {
      body.appendChild(el('h3', null, 'Print'));
      var row = el('div', 'sb-btn-row');
      row.appendChild(button('Print this screen', 'sb-btn', function () { window.print(); }));
      body.appendChild(row);
      body.appendChild(el('p', 'sd-note', 'The print stylesheet puts the 390 × 844 phone frame on one A4 page. Only the visible screen is printed.'));
    }
  }

  /* ---------- help ---------- */

  function renderHelp(body) {
    body.appendChild(el('h3', null, 'Protocol'));
    body.appendChild(el('p', null, 'One participant at a time. Read the task aloud, start the timer in the task sheet, and let the participant think aloud. Do not point at the screen; note where they hesitate. Stop after 10 minutes or when the five tasks are done.'));
    body.appendChild(el('p', null, 'Run the good and the bad build with the same tasks, in alternating order across participants, then compare task time, errors, and SUS.'));

    body.appendChild(el('h3', null, 'Keyboard'));
    var keys = [
      ['1 – 9', 'Jump to screen'],
      ['← / →', 'Previous / next screen'],
      ['A', 'Toggle annotations'],
      ['T / S / D / E', 'Tasks, SUS, data, edge states'],
      ['C', 'Clean presentation mode'],
      ['R', 'Restart from the login screen'],
      ['Esc', 'Close a dialog or panel'],
      ['?', 'This help']
    ];
    keys.forEach(function (pair) {
      var row = el('div', 'sb-btn-row');
      row.style.margin = '0 0 6px';
      var k = el('kbd', null, pair[0]);
      k.style.cssText = 'flex:none;min-width:74px;font:700 10.5px/1.6 ui-monospace,monospace;background:#EDF2F5;border:1px solid #D5DFE6;border-radius:5px;padding:1px 6px;color:#33454F;text-align:center';
      row.appendChild(k);
      row.appendChild(el('span', null, pair[1]));
      body.appendChild(row);
    });

    body.appendChild(el('h3', null, 'Build'));
    body.appendChild(el('p', null, 'Variant: ' + MODE + '. Shared dataset: Ayesha Khan, current account ·· 0023, opening balance PKR 245,780.50. Transfers update the balance and both activity lists, so the same numbers appear across screens.'));
    body.appendChild(el('p', null, 'The report is at ../report/HCI_Project_Report.html. Screen-by-screen notes are in docs/screen-map.md.'));

    body.appendChild(el('h3', null, 'Data'));
    body.appendChild(el('p', null, 'Events are stored in localStorage on this device only. Download JSON or CSV after each session and clear the log before the next participant.'));
  }

  /* ---------- clean mode ---------- */

  function toggleClean(force) {
    var on = typeof force === 'boolean' ? force : !document.body.classList.contains('sb-clean');
    document.body.classList.toggle('sb-clean', on);
    if (on) {
      if (annoOn) toggleAnno(false);
      closePanel();
      log('clean', { state: 'on' });
    } else {
      log('clean', { state: 'off' });
    }
  }

  /* ---------- event wiring ---------- */

  function activeStep() {
    if (window.__demo && window.__demo.state) return window.__demo.state.step;
    return 1;
  }

  var lastScreenLog = 0;

  function onScreen(e) {
    var d = e.detail || {};
    markMap(d.step || 1);
    if (d.step !== lastScreenLog) {
      lastScreenLog = d.step;
      log('screen', { step: d.step, name: d.name });
    }
    autoComplete('screen:' + d.step);

    if (annoOn) {
      if (annoPanel) {
        var stage = $('.stage');
        if (stage) stage.appendChild(annoPanel);
        var h2 = $('.anno-head h2', annoPanel);
        if (h2) h2.textContent = 'Screen ' + d.step + ' \u00b7 ' + SCREENS[d.step - 1];
        buildAnnoItems();
      }
      renderPins();
    }
  }

  function descriptors(node) {
    var label = (node.getAttribute && (node.getAttribute('aria-label') || node.getAttribute('title'))) || '';
    var text = (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    var cls = node.className && typeof node.className === 'string' ? node.className.split(/\s+/).slice(0, 3).join('.') : '';
    return { tag: node.tagName ? node.tagName.toLowerCase() : '', label: label || text, cls: cls };
  }

  function onTap(e) {
    var node = e.target;
    if (!node || !node.closest) return;
    var hit = node.closest('button, a, .sw, .eye, .person, .chip, .hrow, .txrow, .cardvis, .qa a, [role="button"]');
    if (!hit) return;
    if (hit.closest('.study-bar') || hit.closest('.study-drawer') ||
        hit.closest('.anno-panel') || hit.closest('.shell') ||
        hit.closest('.stage-hint') || hit.classList.contains('sb-pin')) return;
    var d = descriptors(hit);
    log('tap', { step: step, tag: d.tag, name: d.label, cls: d.cls });
  }

  function onError(e) {
    log('error', { step: step, message: (e.detail && e.detail.message) || 'validation error' });
  }

  function onTx(e) {
    log('tx', { step: step, ref: e.detail.ref, kind: e.detail.kind, amount: e.detail.amount, balance: e.detail.balance });
    autoComplete('tx:' + e.detail.kind);
  }

  function onCard(e) {
    var d = e.detail || {};
    log('card', { setting: d.setting, value: d.value });
    if (d.setting === 'freeze' && d.value) autoComplete('card:freeze');
  }

  function autoComplete(key) {
    TASKS.forEach(function (task) {
      if (task.auto !== key) return;
      if (taskState(task.id).status === 'active') completeTask(task.id);
    });
  }

  function watchSearch() {
    var input = $('#g5 input[type="search"]');
    if (!input) return;
    input.addEventListener('input', function () {
      if (input.value.trim().toLowerCase().indexOf('foodpanda') === 0) autoComplete('search:foodpanda');
    });
  }

  function onKey(e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Escape') {
      if (drawer) { closePanel(); e.preventDefault(); return; }
      if (annoOn) { toggleAnno(false); e.preventDefault(); return; }
      return;
    }

    var digit = parseInt(e.key, 10);
    if (digit >= 1 && digit <= 9 && String(digit) === e.key) {
      go(digit);
      e.preventDefault();
      return;
    }

    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === 'ArrowLeft') { prev(); e.preventDefault(); }
    else if (k === 'ArrowRight') { next(); e.preventDefault(); }
    else if (k === 'a') { toggleAnno(); e.preventDefault(); }
    else if (k === 't') { openPanel('tasks'); e.preventDefault(); }
    else if (k === 's') { openPanel('sus'); e.preventDefault(); }
    else if (k === 'd') { openPanel('data'); e.preventDefault(); }
    else if (k === 'e') { openPanel('edge'); e.preventDefault(); }
    else if (k === 'c') { toggleClean(); e.preventDefault(); }
    else if (k === 'r') { location.reload(); e.preventDefault(); }
    else if (k === '?') { openPanel('help'); e.preventDefault(); }
    else if (k === 'n') { next(); e.preventDefault(); }
    else if (k === 'p') { prev(); e.preventDefault(); }
  }

  /* ---------- start ---------- */

  function start() {
    if (bar) return;
    document.body.classList.add('sb-variant-' + MODE);
    load();
    buildBar();

    step = activeStep();
    markMap(step);

    document.addEventListener('sb:screen', onScreen);
    document.addEventListener('sb:error', onError);
    document.addEventListener('sb:tx', onTx);
    document.addEventListener('sb:card', onCard);
    document.addEventListener('click', onTap, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', placePins);

    watchSearch();
    setTimeout(watchSearch, 300);

    log('session', { mode: MODE });
    lastScreenLog = step;
    log('screen', { step: step, name: SCREENS[step - 1] });

    window.__study = {
      openPanel: openPanel,
      toggleAnno: toggleAnno,
      toggleClean: toggleClean,
      log: log,
      state: S,
      exportJson: exportJson,
      exportCsv: exportCsv,
      go: go,
      edge: edge,
      startTask: startTask,
      completeTask: completeTask,
      tasks: TASKS
    };
  }

  if (window.__demo) {
    start();
  } else {
    document.addEventListener('sb:ready', start);
    window.addEventListener('load', function () {
      if (!bar) start();
    });
  }
})();
