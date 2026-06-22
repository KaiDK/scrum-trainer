/* ====================================================================
   Scrum Trainer – App-Logik
   Reine In-Browser-App ohne Serverkomponente.
   ==================================================================== */
(function () {
  "use strict";

  var QUESTIONS_PER_QUIZ = 15;
  var PASS_INFO = null; // bewusst kein Bestanden/Nicht-bestanden (Vorgabe)

  var root = document.getElementById("screen");

  // ---------- Anwendungszustand ----------
  var state = {
    screen: "start",      // "start" | "quiz" | "result"
    certKey: null,        // "psm" | "pspo"
    questions: [],        // ausgewählte 15 Fragen
    answers: [],          // answers[i] = Array der gewählten Buchstaben
    current: 0,           // aktueller Frage-Index (Quiz)
    reviewIndex: 0,       // aktueller Index in der Ergebnis-Durchsicht
    startTime: null,
    elapsedAtFinish: 0,
    timerId: null
  };

  // ---------- Hilfsfunktionen ----------
  function formatTime(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function elapsedSeconds() {
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
  }

  // Fisher-Yates: n zufällige Elemente aus einem Array
  function pickRandom(arr, n) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy.slice(0, n);
  }

  function sameAnswer(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort();
    var y = b.slice().sort();
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }

  function isCorrect(i) {
    return sameAnswer(state.answers[i] || [], state.questions[i].correct);
  }

  function scoreCount() {
    var c = 0;
    for (var i = 0; i < state.questions.length; i++) if (isCorrect(i)) c++;
    return c;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function optionLetters(q) {
    return Object.keys(q.options); // bewahrt A,B,C,D-Reihenfolge
  }

  // ---------- Timer ----------
  function startTimer() {
    stopTimer();
    state.startTime = Date.now();
    state.timerId = setInterval(function () {
      var el = document.getElementById("timer-val");
      if (el) el.textContent = formatTime(elapsedSeconds());
    }, 1000);
  }
  function stopTimer() {
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  }

  // ====================================================================
  //  START-SCREEN
  // ====================================================================
  function renderStart() {
    var certs = [QUIZ_DATA.psm, QUIZ_DATA.pspo];
    var cards = certs.map(function (c) {
      return (
        '<button class="cert-card" data-cert="' + c.id + '">' +
          '<span class="cert-badge">' + escapeHtml(c.shortName) + '</span>' +
          '<p class="cert-name">' + escapeHtml(c.name) + '</p>' +
          '<p class="cert-desc">' + escapeHtml(c.description) + '</p>' +
          '<span class="cert-meta">' + QUESTIONS_PER_QUIZ + ' Fragen starten →</span>' +
        '</button>'
      );
    }).join("");

    root.innerHTML =
      '<div class="card">' +
        '<div class="start-intro">' +
          '<h2>Welche Zertifizierung möchtest du trainieren?</h2>' +
          '<p>Pro Quiz werden ' + QUESTIONS_PER_QUIZ + ' zufällige Fragen aus 50 abgefragt.</p>' +
        '</div>' +
        '<div class="cert-grid">' + cards + '</div>' +
        '<p class="start-note">Die Stoppuhr startet, sobald du eine Zertifizierung auswählst. Viel Erfolg!</p>' +
      '</div>';

    Array.prototype.forEach.call(root.querySelectorAll(".cert-card"), function (btn) {
      btn.addEventListener("click", function () {
        startQuiz(btn.getAttribute("data-cert"));
      });
    });
  }

  // ====================================================================
  //  QUIZ-SCREEN
  // ====================================================================
  function startQuiz(certKey) {
    state.certKey = certKey;
    state.questions = pickRandom(QUIZ_DATA[certKey].questions, QUESTIONS_PER_QUIZ);
    state.answers = state.questions.map(function () { return []; });
    state.current = 0;
    state.screen = "quiz";
    startTimer();
    render();
  }

  function renderQuiz() {
    var total = state.questions.length;
    var idx = state.current;
    var q = state.questions[idx];
    var cert = QUIZ_DATA[state.certKey];
    var selected = state.answers[idx] || [];
    var progressPct = Math.round(((idx + 1) / total) * 100);

    var optionsHtml = optionLetters(q).map(function (letter) {
      var checked = selected.indexOf(letter) !== -1;
      var inputType = q.multiple ? "checkbox" : "radio";
      return (
        '<label class="option' + (checked ? " selected" : "") + '" data-letter="' + letter + '">' +
          '<input type="' + inputType + '" name="opt" value="' + letter + '"' + (checked ? " checked" : "") + ' />' +
          '<span class="opt-text"><span class="opt-letter">' + letter + ')</span> ' + escapeHtml(q.options[letter]) + '</span>' +
        '</label>'
      );
    }).join("");

    var hint = q.multiple ? '<span class="q-hint">Mehrere Antworten möglich</span>' : "";
    var isLast = idx === total - 1;

    var dotsHtml = state.questions.map(function (_, i) {
      var cls = "dot-btn";
      if (i === idx) cls += " current";
      else if ((state.answers[i] || []).length > 0) cls += " answered";
      return '<button class="' + cls + '" data-goto="' + i + '">' + (i + 1) + '</button>';
    }).join("");

    root.innerHTML =
      '<div class="card">' +
        '<div class="quiz-bar">' +
          '<span class="badge">' + escapeHtml(cert.shortName) + '</span>' +
          '<span class="timer"><span class="dot"></span><span id="timer-val">' + formatTime(elapsedSeconds()) + '</span></span>' +
        '</div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + progressPct + '%"></div></div>' +
        '<div class="q-count">Frage ' + (idx + 1) + ' von ' + total + '</div>' +
        '<h2 class="q-text">' + escapeHtml(q.question) + '</h2>' +
        hint +
        '<div class="options">' + optionsHtml + '</div>' +
        '<div class="nav-row">' +
          '<button class="btn btn-ghost" id="prev-btn"' + (idx === 0 ? " disabled" : "") + '>← Zurück</button>' +
          (isLast
            ? '<button class="btn btn-success" id="finish-btn">Quiz abschließen ✓</button>'
            : '<button class="btn btn-primary" id="next-btn">Weiter →</button>') +
        '</div>' +
        '<div class="dots">' + dotsHtml + '</div>' +
      '</div>';

    // Antwort-Auswahl
    Array.prototype.forEach.call(root.querySelectorAll(".option input"), function (input) {
      input.addEventListener("change", function () {
        selectAnswer(idx, input.value, q.multiple);
      });
    });

    var prevBtn = document.getElementById("prev-btn");
    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(idx - 1); });
    var nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(idx + 1); });
    var finishBtn = document.getElementById("finish-btn");
    if (finishBtn) finishBtn.addEventListener("click", finishQuiz);

    Array.prototype.forEach.call(root.querySelectorAll(".dot-btn"), function (btn) {
      btn.addEventListener("click", function () {
        goTo(parseInt(btn.getAttribute("data-goto"), 10));
      });
    });
  }

  function selectAnswer(idx, letter, multiple) {
    var arr = state.answers[idx] || [];
    if (multiple) {
      var pos = arr.indexOf(letter);
      if (pos === -1) arr.push(letter); else arr.splice(pos, 1);
    } else {
      arr = [letter];
    }
    state.answers[idx] = arr;
    // Nur die Optik der Optionen aktualisieren (Timer/Fokus erhalten)
    Array.prototype.forEach.call(root.querySelectorAll(".option"), function (opt) {
      var l = opt.getAttribute("data-letter");
      if (arr.indexOf(l) !== -1) opt.classList.add("selected");
      else opt.classList.remove("selected");
    });
    // Dot als beantwortet markieren
    var dot = root.querySelector('.dot-btn[data-goto="' + idx + '"]');
    if (dot && arr.length > 0) dot.classList.add("answered");
  }

  function goTo(i) {
    if (i < 0 || i >= state.questions.length) return;
    state.current = i;
    renderQuiz();
  }

  function finishQuiz() {
    var unanswered = 0;
    for (var i = 0; i < state.answers.length; i++) {
      if (!state.answers[i] || state.answers[i].length === 0) unanswered++;
    }
    if (unanswered > 0) {
      var ok = window.confirm(
        unanswered + " von " + state.questions.length +
        " Fragen sind noch unbeantwortet und zählen als falsch.\n\nQuiz jetzt trotzdem abschließen?"
      );
      if (!ok) return;
    }
    stopTimer();
    state.elapsedAtFinish = elapsedSeconds();
    state.reviewIndex = 0;
    state.screen = "result";
    render();
  }

  // ====================================================================
  //  ERGEBNIS-SCREEN
  // ====================================================================
  function renderResult() {
    var total = state.questions.length;
    var score = scoreCount();
    var pct = Math.round((score / total) * 100);
    var cert = QUIZ_DATA[state.certKey];

    // Farbe des Rings nach Anteil
    var ringColor =
      pct >= 85 ? "var(--correct)" :
      pct >= 50 ? "var(--accent)" : "var(--wrong)";
    var ringStyle =
      "background: conic-gradient(" + ringColor + " " + (pct * 3.6) + "deg, var(--surface-muted) 0deg);";

    root.innerHTML =
      '<div class="card">' +
        '<div class="result-head">' +
          '<h2>Dein Ergebnis</h2>' +
          '<span class="cert-label">' + escapeHtml(cert.name) + ' (' + escapeHtml(cert.shortName) + ')</span>' +
        '</div>' +
        '<div class="score-ring-wrap">' +
          '<div class="score-ring" style="' + ringStyle + '">' +
            '<div class="inner">' +
              '<span class="score-pct" style="color:' + ringColor + '">' + pct + '%</span>' +
              '<span class="score-frac">' + score + ' / ' + total + ' richtig</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="result-stats">' +
          '<div class="stat"><div class="stat-val">' + score + ' / ' + total + '</div><div class="stat-label">Richtige Antworten</div></div>' +
          '<div class="stat"><div class="stat-val">' + pct + '%</div><div class="stat-label">Trefferquote</div></div>' +
          '<div class="stat"><div class="stat-val">' + formatTime(state.elapsedAtFinish) + '</div><div class="stat-label">Benötigte Zeit</div></div>' +
        '</div>' +
        '<div class="result-actions">' +
          '<button class="btn btn-primary" id="retry-btn">Neues Quiz (' + escapeHtml(cert.shortName) + ')</button>' +
          '<button class="btn btn-ghost" id="home-btn">Zertifizierung wechseln</button>' +
        '</div>' +
        '<div class="review-section">' +
          '<p class="review-title">Antworten durchsehen</p>' +
          '<p class="review-sub">Navigiere durch alle Fragen und sieh Lösung &amp; Erläuterung.</p>' +
          '<div id="review-body"></div>' +
        '</div>' +
      '</div>';

    document.getElementById("retry-btn").addEventListener("click", function () {
      startQuiz(state.certKey);
    });
    document.getElementById("home-btn").addEventListener("click", function () {
      state.screen = "start";
      render();
    });

    renderReview();
  }

  function renderReview() {
    var body = document.getElementById("review-body");
    if (!body) return;

    var total = state.questions.length;
    var i = state.reviewIndex;
    var q = state.questions[i];
    var userAns = state.answers[i] || [];
    var correct = isCorrect(i);

    var optionsHtml = optionLetters(q).map(function (letter) {
      var isRight = q.correct.indexOf(letter) !== -1;
      var isPicked = userAns.indexOf(letter) !== -1;
      var cls = "option";
      var tag = "";
      if (isRight) { cls += " correct"; tag = '<span class="tag">Richtig</span>'; }
      else if (isPicked) { cls += " wrong"; tag = '<span class="tag">Deine Wahl</span>'; }
      return (
        '<div class="' + cls + '">' +
          '<span class="opt-text"><span class="opt-letter">' + letter + ')</span> ' + escapeHtml(q.options[letter]) + '</span>' +
          tag +
        '</div>'
      );
    }).join("");

    var verdict = correct
      ? '<span class="verdict ok">✓ Richtig beantwortet</span>'
      : '<span class="verdict no">✗ Falsch beantwortet</span>';

    if (userAns.length === 0) {
      verdict = '<span class="verdict no">✗ Nicht beantwortet</span>';
    }

    var dotsHtml = state.questions.map(function (_, k) {
      var cls = "dot-btn" + (k === i ? " current" : "") + (isCorrect(k) ? " correct" : " wrong");
      return '<button class="' + cls + '" data-review="' + k + '">' + (k + 1) + '</button>';
    }).join("");

    body.innerHTML =
      '<div class="q-count">Frage ' + (i + 1) + ' von ' + total + '</div>' +
      verdict +
      '<h3 class="q-text">' + escapeHtml(q.question) + '</h3>' +
      '<div class="options">' + optionsHtml + '</div>' +
      '<div class="explanation"><strong>Erläuterung</strong><p>' + escapeHtml(q.explanation) + '</p></div>' +
      '<div class="nav-row">' +
        '<button class="btn btn-ghost" id="rev-prev"' + (i === 0 ? " disabled" : "") + '>← Zurück</button>' +
        '<button class="btn btn-primary" id="rev-next"' + (i === total - 1 ? " disabled" : "") + '>Weiter →</button>' +
      '</div>' +
      '<div class="dots">' + dotsHtml + '</div>';

    var rp = document.getElementById("rev-prev");
    if (rp) rp.addEventListener("click", function () { goReview(i - 1); });
    var rn = document.getElementById("rev-next");
    if (rn) rn.addEventListener("click", function () { goReview(i + 1); });
    Array.prototype.forEach.call(body.querySelectorAll(".dot-btn"), function (btn) {
      btn.addEventListener("click", function () {
        goReview(parseInt(btn.getAttribute("data-review"), 10));
      });
    });
  }

  function goReview(i) {
    if (i < 0 || i >= state.questions.length) return;
    state.reviewIndex = i;
    renderReview();
  }

  // ====================================================================
  //  Router
  // ====================================================================
  function render() {
    if (state.screen === "start") renderStart();
    else if (state.screen === "quiz") renderQuiz();
    else if (state.screen === "result") renderResult();
  }

  // ---------- Start ----------
  if (typeof QUIZ_DATA === "undefined") {
    root.innerHTML = '<div class="card"><p>Fehler: Fragendaten konnten nicht geladen werden ' +
      '(data/questions.js).</p></div>';
    return;
  }
  render();
})();
