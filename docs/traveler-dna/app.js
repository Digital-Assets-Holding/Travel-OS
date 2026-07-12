(function () {
  "use strict";

  var APP_VERSION = "1.0.0";
  var STORAGE_KEY = "travel-os.traveler-dna.draft.v1";
  var FINAL_KEY = "travel-os.traveler-dna.final.v1";

  var state = {
    screen: "welcome",
    sectionIndex: 0,
    answers: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    name: "",
    exportPayload: null
  };

  var survey = null;
  var archetypeMap = {};
  var maxPotential = {};
  var dom = {};
  var currentSection = null;
  var currentSummary = null;
  var toastTimer = null;
  var ready = false;

  document.addEventListener("DOMContentLoaded", boot);

  function boot() {
    cacheDom();
    bindGlobalEvents();
    restoreDraft();
    loadSurvey();
  }

  function cacheDom() {
    dom.resumeBanner = document.getElementById("resume-banner");
    dom.resumeBannerCopy = document.getElementById("resume-banner-copy");
    dom.resumeButton = document.getElementById("resume-button");
    dom.discardButton = document.getElementById("discard-button");
    dom.screenWelcome = document.getElementById("screen-welcome");
    dom.screenSurvey = document.getElementById("screen-survey");
    dom.screenSummary = document.getElementById("screen-summary");
    dom.screenThanks = document.getElementById("screen-thanks");
    dom.nameInput = document.getElementById("traveler-name");
    dom.startButton = document.getElementById("start-button");
    dom.backButton = document.getElementById("back-button");
    dom.nextButton = document.getElementById("next-button");
    dom.submitButton = document.getElementById("submit-button");
    dom.editButton = document.getElementById("edit-button");
    dom.restartButton = document.getElementById("restart-button");
    dom.downloadJson = document.getElementById("download-json");
    dom.downloadHtml = document.getElementById("download-html");
    dom.downloadMd = document.getElementById("download-md");
    dom.sectionKicker = document.getElementById("section-kicker");
    dom.sectionTitle = document.getElementById("section-title");
    dom.sectionCopy = document.getElementById("section-copy");
    dom.progressCount = document.getElementById("progress-count");
    dom.progressDetail = document.getElementById("progress-detail");
    dom.progressFill = document.getElementById("progress-fill");
    dom.questionStack = document.getElementById("question-stack");
    dom.summaryTitle = document.getElementById("summary-title");
    dom.summaryCopy = document.getElementById("summary-copy");
    dom.summaryOverview = document.getElementById("summary-overview");
    dom.summaryArchetypes = document.getElementById("summary-archetypes");
    dom.summarySignals = document.getElementById("summary-signals");
    dom.rawJson = document.getElementById("raw-json");
    dom.thanksCopy = document.getElementById("thanks-copy");
  }

  function bindGlobalEvents() {
    dom.startButton.addEventListener("click", startSurvey);
    dom.backButton.addEventListener("click", previousSection);
    dom.nextButton.addEventListener("click", nextSection);
    dom.submitButton.addEventListener("click", submitSurvey);
    dom.editButton.addEventListener("click", function () {
      goToScreen("survey");
    });
    dom.restartButton.addEventListener("click", resetAll);
    dom.downloadJson.addEventListener("click", function () {
      downloadCurrentOutput("json");
    });
    dom.downloadHtml.addEventListener("click", function () {
      downloadCurrentOutput("html");
    });
    dom.downloadMd.addEventListener("click", function () {
      downloadCurrentOutput("md");
    });
    dom.resumeButton.addEventListener("click", function () {
      goToScreen(state.screen === "summary" ? "summary" : "survey");
      if (state.name) {
        dom.nameInput.value = state.name;
      }
      if (state.screen === "summary") {
        renderSummary();
      } else {
        renderSection();
      }
      hideResumeBanner();
    });
    dom.discardButton.addEventListener("click", function () {
      resetStorage();
      state = createDefaultState();
      renderWelcome();
      hideResumeBanner();
      toast("Borrador descartado", "Puedes empezar desde cero.");
    });
    window.addEventListener("beforeunload", saveDraft);
  }

  function loadSurvey() {
    fetch("./questions.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("No se pudo cargar questions.json");
        }
        return response.json();
      })
      .then(function (payload) {
        survey = payload;
        buildIndex();
        ready = true;
        hydrateScreenFromState();
        updateResumeBanner();
      })
      .catch(function (error) {
        console.error(error);
        toast("Error de carga", "No se pudo cargar questions.json.");
      });
  }

  function buildIndex() {
    archetypeMap = {};
    (survey.archetypes || []).forEach(function (item) {
      archetypeMap[item.id] = item;
      maxPotential[item.id] = 0;
    });

    (survey.sections || []).forEach(function (section) {
      (section.questions || []).forEach(function (question) {
        collectQuestionPotential(question);
      });
    });
  }

  function collectQuestionPotential(question) {
    if (!question.options || !question.options.length) {
      return;
    }

    question.options.forEach(function (option) {
      var scores = option.scores || {};
      Object.keys(scores).forEach(function (archetypeId) {
        var value = Number(scores[archetypeId]) || 0;
        if (value > 0) {
          maxPotential[archetypeId] = (maxPotential[archetypeId] || 0) + value;
        }
      });
    });
  }

  function createDefaultState() {
    return {
      screen: "welcome",
      sectionIndex: 0,
      answers: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      name: "",
      exportPayload: null
    };
  }

  function restoreDraft() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      var draft = JSON.parse(raw);
      state = normalizeState(draft);
      syncTravelerName();
    } catch (error) {
      console.warn("Invalid draft ignored", error);
      resetStorage();
    }
  }

  function syncTravelerName() {
    var nameFromHeader = normalizeText(state.name);
    var nameFromAnswers = normalizeText(state.answers.traveler_name);

    if (nameFromHeader && !nameFromAnswers) {
      state.answers.traveler_name = nameFromHeader;
      return;
    }

    if (!nameFromHeader && nameFromAnswers) {
      state.name = nameFromAnswers;
    }
  }

  function normalizeState(candidate) {
    var fallback = createDefaultState();
    if (!candidate || typeof candidate !== "object") {
      return fallback;
    }

    return {
      screen: candidate.screen || fallback.screen,
      sectionIndex: typeof candidate.sectionIndex === "number" ? candidate.sectionIndex : fallback.sectionIndex,
      answers: candidate.answers && typeof candidate.answers === "object" ? candidate.answers : {},
      createdAt: candidate.createdAt || fallback.createdAt,
      updatedAt: candidate.updatedAt || fallback.updatedAt,
      completedAt: candidate.completedAt || null,
      name: candidate.name || "",
      exportPayload: candidate.exportPayload || null
    };
  }

  function hydrateScreenFromState() {
    dom.nameInput.value = state.name || "";
    if (!state.screen || state.screen === "welcome") {
      renderWelcome();
      return;
    }

    if (state.screen === "survey") {
      goToScreen("survey");
      renderSection();
      return;
    }

    if (state.screen === "summary") {
      goToScreen("summary");
      renderSummary();
      return;
    }

    if (state.screen === "thanks") {
      goToScreen("thanks");
      renderThanks();
      return;
    }

    renderWelcome();
  }

  function renderWelcome() {
    goToScreen("welcome");
    updateResumeBanner();
  }

  function startSurvey() {
    var name = normalizeText(dom.nameInput.value);
    if (!name) {
      toast("Falta tu nombre", "Es necesario para personalizar el resumen.");
      dom.nameInput.focus();
      return;
    }

    setAnswer("traveler_name", name);
    syncTravelerName();
    state.screen = "survey";
    state.sectionIndex = clamp(state.sectionIndex, 0, getSections().length - 1);
    saveDraft();
    goToScreen("survey");
    renderSection();
  }

  function previousSection() {
    if (!currentSection) {
      return;
    }

    if (state.sectionIndex <= 0) {
      goToScreen("welcome");
      return;
    }

    state.sectionIndex -= 1;
    state.screen = "survey";
    saveDraft();
    renderSection();
  }

  function nextSection() {
    if (!currentSection) {
      return;
    }

    var validation = validateSection(currentSection);
    if (!validation.valid) {
      showValidationMessage(validation.message);
      return;
    }

    clearValidationMessage();
    persistSectionAnswers(currentSection);
    if (state.sectionIndex < getSections().length - 1) {
      state.sectionIndex += 1;
      state.screen = "survey";
      saveDraft();
      renderSection();
      return;
    }

    state.screen = "summary";
    saveDraft();
    goToScreen("summary");
    renderSummary();
  }

  function renderSection() {
    var sections = getSections();
    currentSection = sections[state.sectionIndex] || sections[0];
    if (!currentSection) {
      return;
    }

    dom.sectionKicker.textContent = currentSection.kicker || "Sección";
    dom.sectionTitle.textContent = currentSection.title || "";
    dom.sectionCopy.textContent = currentSection.summary || "";
    dom.progressCount.textContent = (state.sectionIndex + 1) + " / " + sections.length;
    dom.progressDetail.textContent = countAnsweredQuestions() + " preguntas completas";
    dom.progressFill.style.width = ((state.sectionIndex) / Math.max(1, sections.length - 1)) * 100 + "%";
    dom.backButton.disabled = state.sectionIndex === 0;
    dom.nextButton.textContent = state.sectionIndex === sections.length - 1 ? "Resumen" : "Siguiente";

    dom.questionStack.innerHTML = "";
    (currentSection.questions || []).forEach(function (question) {
      dom.questionStack.appendChild(renderQuestion(question));
    });

    hydrateQuestionValues(currentSection);
  }

  function renderQuestion(question) {
    var template = document.getElementById("question-template");
    var node = template.content.firstElementChild.cloneNode(true);
    var title = node.querySelector(".question-title");
    var help = node.querySelector(".question-help");
    var tag = node.querySelector(".question-tag");
    var body = node.querySelector(".question-body");
    var error = node.querySelector(".question-error");

    title.textContent = question.label;
    help.textContent = question.help || "";
    tag.textContent = question.type || "text";
    node.dataset.questionId = question.id;
    node.dataset.questionType = question.type;
    node.dataset.required = question.required ? "true" : "false";
    if (question.minSelections) {
      node.dataset.minSelections = String(question.minSelections);
    }

    body.appendChild(renderQuestionControl(question, node, error));
    return node;
  }

  function renderQuestionControl(question, card, errorNode) {
    var wrapper = document.createElement("div");
    wrapper.className = "question-control";

    if (question.type === "text" || question.type === "number" || question.type === "date") {
      var input = document.createElement("input");
      input.className = "text-input";
      input.type = question.type;
      if (question.type === "number") {
        if (typeof question.min !== "undefined") input.min = String(question.min);
        if (typeof question.max !== "undefined") input.max = String(question.max);
        if (typeof question.step !== "undefined") input.step = String(question.step);
        input.inputMode = "numeric";
      }
      if (question.placeholder) {
        input.placeholder = question.placeholder;
      }
      input.autocomplete = question.id === "traveler_name" ? "name" : "off";
      input.addEventListener("input", function () {
        setAnswer(question.id, input.value);
        clearQuestionError(card, errorNode);
      });
      wrapper.appendChild(input);
      return wrapper;
    }

    if (question.type === "textarea") {
      var textarea = document.createElement("textarea");
      textarea.className = "textarea-input";
      textarea.rows = question.rows || 4;
      textarea.placeholder = question.placeholder || "";
      textarea.addEventListener("input", function () {
        setAnswer(question.id, textarea.value);
        clearQuestionError(card, errorNode);
      });
      wrapper.appendChild(textarea);
      return wrapper;
    }

    if (question.type === "single") {
      var singleGrid = document.createElement("div");
      singleGrid.className = "option-grid";
      if (question.layout) {
        singleGrid.classList.add(question.layout);
      }
      (question.options || []).forEach(function (option) {
        var label = buildChoiceLabel(question, option, false, function () {
          setAnswer(question.id, option.value);
          clearQuestionError(card, errorNode);
          updateSingleSelection(question.id, option.value);
        });
        singleGrid.appendChild(label);
      });
      wrapper.appendChild(singleGrid);
      return wrapper;
    }

    if (question.type === "multi") {
      var multiList = document.createElement("div");
      multiList.className = "multi-list";
      if (question.layout) {
        multiList.classList.add(question.layout);
      }
      (question.options || []).forEach(function (option) {
        var label = buildChoiceLabel(question, option, true, function () {
          clearQuestionError(card, errorNode);
          setAnswer(question.id, getMultiValues(question.id));
        });
        multiList.appendChild(label);
      });
      wrapper.appendChild(multiList);
      return wrapper;
    }

    if (question.type === "range") {
      var rangeRow = document.createElement("div");
      rangeRow.className = "range-row";
      var range = document.createElement("input");
      range.type = "range";
      range.className = "range-input";
      if (typeof question.min !== "undefined") range.min = String(question.min);
      if (typeof question.max !== "undefined") range.max = String(question.max);
      if (typeof question.step !== "undefined") range.step = String(question.step);
      var rangeValue = document.createElement("div");
      rangeValue.className = "range-value";
      range.value = String(question.defaultValue || question.min || 0);
      rangeValue.textContent = range.value;
      range.addEventListener("input", function () {
        rangeValue.textContent = range.value;
        setAnswer(question.id, Number(range.value));
        clearQuestionError(card, errorNode);
      });
      rangeRow.appendChild(range);
      rangeRow.appendChild(rangeValue);
      wrapper.appendChild(rangeRow);
      return wrapper;
    }

    return wrapper;
  }

  function buildChoiceLabel(question, option, isMulti, onChange) {
    var label = document.createElement("label");
    label.className = isMulti ? "multi-item" : "choice-option";

    var input = document.createElement("input");
    input.type = isMulti ? "checkbox" : "radio";
    input.name = question.id;
    input.value = option.value;
    input.dataset.optionValue = option.value;

    var span = document.createElement("span");
    span.textContent = option.label;

    input.addEventListener("change", function () {
      if (input.type === "radio") {
        if (input.checked) {
          markSingleActive(question.id, option.value);
        }
      } else {
        if (input.checked) {
          addMultiValue(question.id, option.value);
        } else {
          removeMultiValue(question.id, option.value);
        }
      }
      onChange();
    });

    label.appendChild(input);
    label.appendChild(span);
    return label;
  }

  function hydrateQuestionValues(section) {
    (section.questions || []).forEach(function (question) {
      var value = state.answers[question.id];
      if (typeof value === "undefined" || value === null) {
        return;
      }

      var card = dom.questionStack.querySelector('[data-question-id="' + question.id + '"]');
      if (!card) {
        return;
      }

      var controls = card.querySelectorAll("input, textarea");
      if (question.type === "single") {
        controls.forEach(function (control) {
          control.checked = control.value === value;
        });
      } else if (question.type === "multi") {
        var values = Array.isArray(value) ? value : [];
        controls.forEach(function (control) {
          control.checked = values.indexOf(control.value) !== -1;
        });
      } else if (question.type === "range") {
        controls[0].value = String(value);
        controls[1].textContent = String(value);
      } else if (controls[0]) {
        controls[0].value = String(value);
      }
    });
  }

  function updateSingleSelection(questionId, selectedValue) {
    var card = dom.questionStack.querySelector('[data-question-id="' + questionId + '"]');
    if (!card) {
      return;
    }
    card.querySelectorAll('input[type="radio"]').forEach(function (input) {
      input.checked = input.value === selectedValue;
    });
  }

  function addMultiValue(questionId, value) {
    var list = Array.isArray(state.answers[questionId]) ? state.answers[questionId].slice() : [];
    if (list.indexOf(value) === -1) {
      list.push(value);
    }
    state.answers[questionId] = list;
    saveDraft();
  }

  function removeMultiValue(questionId, value) {
    var list = Array.isArray(state.answers[questionId]) ? state.answers[questionId].slice() : [];
    var index = list.indexOf(value);
    if (index !== -1) {
      list.splice(index, 1);
    }
    state.answers[questionId] = list;
    saveDraft();
  }

  function getMultiValues(questionId) {
    return Array.isArray(state.answers[questionId]) ? state.answers[questionId].slice() : [];
  }

  function setAnswer(questionId, value) {
    state.answers[questionId] = normalizeAnswerValue(value);
    if (questionId === "traveler_name") {
      state.name = normalizeText(value);
    }
    state.updatedAt = new Date().toISOString();
    saveDraft();
    updateResumeBanner();
  }

  function persistSectionAnswers(section) {
    (section.questions || []).forEach(function (question) {
      if (question.type === "multi") {
        state.answers[question.id] = getMultiValues(question.id);
      } else {
        var card = dom.questionStack.querySelector('[data-question-id="' + question.id + '"]');
        if (!card) {
          return;
        }
        var control = card.querySelector("input, textarea");
        if (!control) {
          return;
        }
        if (question.type === "single") {
          var checked = card.querySelector('input[type="radio"]:checked');
          state.answers[question.id] = normalizeAnswerValue((checked || control).value);
        } else if (question.type === "number") {
          state.answers[question.id] = control.value === "" ? "" : Number(control.value);
        } else if (question.type === "range") {
          state.answers[question.id] = Number(control.value);
        } else {
          state.answers[question.id] = normalizeAnswerValue(control.value);
        }
      }
    });
    if (dom.nameInput.value) {
      state.name = normalizeText(dom.nameInput.value);
      state.answers.traveler_name = state.name;
    }
    state.updatedAt = new Date().toISOString();
    saveDraft();
  }

  function validateSection(section) {
    var questions = section.questions || [];
    for (var i = 0; i < questions.length; i += 1) {
      var question = questions[i];
      var value = state.answers[question.id];
      var valid = true;
      var message = "";

      if (question.type === "text" || question.type === "textarea" || question.type === "single" || question.type === "number" || question.type === "date") {
        if (question.required && isEmpty(value)) {
          valid = false;
          message = "Completa esta respuesta para continuar.";
        }
      }

      if (question.type === "multi") {
        var count = Array.isArray(value) ? value.length : 0;
        var minSelections = question.minSelections || (question.required ? 1 : 0);
        if (count < minSelections) {
          valid = false;
          message = minSelections > 1 ? "Selecciona al menos " + minSelections + " opciones." : "Selecciona al menos una opción.";
        }
      }

      if (!valid) {
        highlightQuestionError(question.id, message);
        return { valid: false, message: message };
      }
    }

    // Validación cruzada de fechas: el regreso no puede ser anterior al inicio.
    var start = state.answers.travel_start_date;
    var end = state.answers.travel_end_date;
    var hasStart = questions.some(function (q) {
      return q.id === "travel_start_date";
    });
    if (hasStart && !isEmpty(start) && !isEmpty(end) && end < start) {
      var dateMessage = "La fecha de regreso no puede ser anterior a la de inicio.";
      highlightQuestionError("travel_end_date", dateMessage);
      return { valid: false, message: dateMessage };
    }

    return { valid: true };
  }

  function highlightQuestionError(questionId, message) {
    var card = dom.questionStack.querySelector('[data-question-id="' + questionId + '"]');
    if (!card) {
      return;
    }
    card.classList.add("is-invalid");
    var error = card.querySelector(".question-error");
    if (error) {
      error.textContent = message || "Revisa esta respuesta.";
    }
  }

  function clearQuestionError(card, errorNode) {
    card.classList.remove("is-invalid");
    if (errorNode) {
      errorNode.textContent = "";
    }
  }

  function showValidationMessage(message) {
    toast("Falta información", message);
  }

  function clearValidationMessage() {
    // Intencionalmente vacío: el mensaje se comunica con el toast y el error por tarjeta.
  }

  function countAnsweredQuestions() {
    var sections = getSections();
    var count = 0;
    sections.forEach(function (section) {
      (section.questions || []).forEach(function (question) {
        if (!isEmpty(state.answers[question.id])) {
          count += 1;
        }
      });
    });
    return count;
  }

  function getSections() {
    return survey && survey.sections ? survey.sections : [];
  }

  function goToScreen(screenName) {
    state.screen = screenName;
    var screens = [dom.screenWelcome, dom.screenSurvey, dom.screenSummary, dom.screenThanks];
    screens.forEach(function (screen) {
      screen.hidden = true;
      screen.classList.remove("active");
    });

    if (screenName === "welcome") {
      dom.screenWelcome.hidden = false;
      dom.screenWelcome.classList.add("active");
      dom.nameInput.value = state.name || dom.nameInput.value || "";
    }
    if (screenName === "survey") {
      dom.screenSurvey.hidden = false;
      dom.screenSurvey.classList.add("active");
      if (currentSection) {
        renderSection();
      }
    }
    if (screenName === "summary") {
      dom.screenSummary.hidden = false;
      dom.screenSummary.classList.add("active");
    }
    if (screenName === "thanks") {
      dom.screenThanks.hidden = false;
      dom.screenThanks.classList.add("active");
    }

    saveDraft();
  }

  function renderSummary() {
    currentSummary = buildSummary();
    dom.summaryTitle.textContent = currentSummary.title;
    dom.summaryCopy.textContent = currentSummary.copy;
    dom.summaryOverview.innerHTML = "";
    dom.summaryArchetypes.innerHTML = "";
    dom.summarySignals.innerHTML = "";
    dom.rawJson.textContent = JSON.stringify(currentSummary.payload, null, 2);

    currentSummary.overview.forEach(function (item) {
      dom.summaryOverview.appendChild(renderOverviewCard(item));
    });

    currentSummary.archetypes.forEach(function (item) {
      dom.summaryArchetypes.appendChild(renderResultCard(item));
    });

    currentSummary.signals.forEach(function (item) {
      dom.summarySignals.appendChild(renderSignalCard(item));
    });
  }

  function renderOverviewCard(item) {
    var card = document.createElement("article");
    card.className = "overview-card";
    card.innerHTML = "<strong>" + escapeHtml(item.label) + "</strong><span>" + escapeHtml(item.value) + "</span>";
    return card;
  }

  function renderResultCard(item) {
    var card = document.createElement("article");
    card.className = "result-card";
    var reasonHtml = item.reasons.length ? "<p>" + escapeHtml(item.reasons.join(" · ")) + "</p>" : "<p>Sin señales dominantes todavía.</p>";
    card.innerHTML =
      "<h3>" +
      escapeHtml(item.label) +
      "</h3>" +
      "<div class='score-row'>" +
      "<div class='score-meta'><span>" +
      escapeHtml(item.scoreLabel) +
      "</span><span>" +
      escapeHtml(String(item.scorePercent)) +
      "%</span></div>" +
      "<div class='score-bar'><span style='width:" +
      item.scorePercent +
      "%'></span></div>" +
      "</div>" +
      reasonHtml;
    return card;
  }

  function renderSignalCard(item) {
    var card = document.createElement("article");
    card.className = "signal-card";
    card.innerHTML = "<h3>" + escapeHtml(item.label) + "</h3><p>" + escapeHtml(item.value) + "</p>";
    return card;
  }

  function buildSummary() {
    var profile = buildProfile();
    var summary = {
      title: state.name ? state.name + ", tu Traveler DNA está listo." : "Tu Traveler DNA está listo.",
      copy: profile.narrative,
      overview: [
        { label: "Propósito", value: profile.signals.purpose },
        { label: "Fechas", value: profile.signals.dates },
        { label: "Presupuesto", value: profile.signals.budget },
        { label: "Ritmo", value: profile.signals.pace }
      ],
      archetypes: profile.topArchetypes,
      signals: [
        { label: "Destino preferido", value: profile.signals.destination },
        { label: "Flexibilidad", value: profile.signals.flexibility },
        { label: "Compañía", value: profile.signals.party },
        { label: "Accesibilidad", value: profile.signals.accessibility },
        { label: "Fotografía", value: profile.signals.photo },
        { label: "Wellness", value: profile.signals.wellness }
      ],
      payload: profile
    };
    return summary;
  }

  function buildProfile() {
    var scoring = scoreAnswers();
    var rawScores = scoring.raw;
    var trace = scoring.trace;
    var archetypes = (survey.archetypes || []).map(function (item) {
      var score = rawScores[item.id] || 0;
      var potential = Math.max(1, maxPotential[item.id] || 1);
      var percent = Math.min(100, Math.round((score / potential) * 100));
      return {
        id: item.id,
        label: item.label,
        score: score,
        scorePercent: percent,
        scoreLabel: score.toFixed(1),
        reasons: collectReasons(item.id, trace)
      };
    });

    archetypes.sort(function (a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.scorePercent - a.scorePercent;
    });

    var top = archetypes.slice(0, 6).filter(function (item) {
      return item.score > 0;
    });

    var signals = buildSignals();
    var narrative = buildNarrative(top, signals);

    return {
      version: APP_VERSION,
      createdAt: state.createdAt,
      updatedAt: new Date().toISOString(),
      completedAt: state.completedAt,
      name: state.name,
      answers: deepClone(state.answers),
      scores: rawScores,
      topArchetypes: top,
      allArchetypes: archetypes,
      signals: signals,
      narrative: narrative,
      questionVersion: survey.version || APP_VERSION
    };
  }

  function scoreAnswers() {
    var raw = {};
    var trace = {};
    (survey.sections || []).forEach(function (section) {
      (section.questions || []).forEach(function (question) {
        var value = state.answers[question.id];
        if (isEmpty(value)) {
          return;
        }
        applyQuestionScore(question, value, raw, trace);
      });
    });
    return { raw: raw, trace: trace };
  }

  function applyQuestionScore(question, value, raw, trace) {
    if (question.type === "single") {
      var option = findOption(question, value);
      if (option) {
        applyScoreMap(option.scores || {}, raw, trace, question, option);
      }
      return;
    }

    if (question.type === "multi") {
      var values = Array.isArray(value) ? value : [];
      values.forEach(function (item) {
        var multiOption = findOption(question, item);
        if (multiOption) {
          applyScoreMap(multiOption.scores || {}, raw, trace, question, multiOption);
        }
      });
      return;
    }

    if (question.type === "number") {
      var numberValue = Number(value) || 0;
      if (question.id === "trip_length") {
        if (numberValue >= 14) {
          bumpScore(raw, trace, question, "explorer", 1.5, "trip_length");
          bumpScore(raw, trace, question, "backpacker", 1, "trip_length");
        }
        if (numberValue >= 21) {
          bumpScore(raw, trace, question, "road_trip", 1, "trip_length");
        }
      }
      return;
    }

    if (question.type === "textarea") {
      var text = normalizeText(value).toLowerCase();
      if (!text) {
        return;
      }
      var direction = question.id === "avoid" ? -1 : 1;
      applyKeywordScores(text, raw, trace, question, direction);
    }
    // Campos "text" (nombre, ciudad) no aportan señal de scoring.
  }

  function applyScoreMap(scores, raw, trace, question, option) {
    Object.keys(scores).forEach(function (archetypeId) {
      var amount = Number(scores[archetypeId]) || 0;
      if (amount <= 0) {
        return;
      }
      bumpScore(raw, trace, question, archetypeId, amount, option.label);
    });
  }

  function bumpScore(raw, trace, question, archetypeId, amount, sourceLabel) {
    raw[archetypeId] = (raw[archetypeId] || 0) + amount;
    if (!trace[archetypeId]) {
      trace[archetypeId] = [];
    }
    trace[archetypeId].push({
      question: question.label,
      source: sourceLabel,
      amount: amount
    });
  }

  function applyKeywordScores(text, raw, trace, question, direction) {
    var keywordMap = {
      explorer: ["explorar", "explore", "hidden", "gems", "aventura", "descubrir"],
      foodie: ["food", "comida", "restaurante", "chef", "tasting", "cocina"],
      shopper: ["shopper", "shopping", "compras", "boutique", "mall"],
      luxury: ["lujo", "luxury", "premium", "vip", "concierge"],
      backpacker: ["mochilero", "backpacker", "hostel", "budget", "low cost"],
      business: ["negocio", "business", "meeting", "reunión", "congreso"],
      culture: ["cultura", "culture", "museum", "museo", "galería"],
      history: ["history", "historia", "patrimonio", "heritage"],
      adventure: ["adventure", "aventura", "hiking", "rafting", "zipline"],
      extreme_sports: ["extreme", "skydiving", "canyoning", "climbing"],
      outdoor: ["outdoor", "aire libre", "nature", "naturaleza", "park"],
      camping: ["camping", "campamento", "van", "rv"],
      road_trip: ["road trip", "carretera", "auto", "rental"],
      photographer: ["photo", "fotografía", "camera", "drone", "portrait"],
      sports_fan: ["sports", "deporte", "stadium", "estadio"],
      music: ["music", "música", "concierto"],
      nightlife: ["nightlife", "noche", "clubbing", "after"],
      wellness: ["wellness", "bienestar", "yoga", "meditation", "meditación"],
      spa: ["spa", "masaje", "thermal"],
      family: ["family", "familia", "niños", "kids"],
      theme_parks: ["theme park", "parque temático"],
      gaming: ["gaming", "videojuegos"],
      anime: ["anime", "manga"],
      technology: ["tech", "tecnología", "gadgets"],
      luxury_vintage: ["vintage", "antique", "coleccion"],
      dark_tourism: ["dark tourism", "cementerio", "gothic", "oscuro"],
      urban_exploration: ["urbex", "urban", "exploration"],
      astronomy: ["astronomy", "astro", "stars", "stargazing"],
      safari: ["safari", "wildlife", "animales"],
      diving: ["diving", "buceo", "snorkel"],
      ski: ["ski", "snow", "nieve"],
      cruise: ["cruise", "crucero"],
      volunteering: ["volunteer", "voluntariado"],
      pilgrimage: ["pilgrimage", "peregrinación"],
      festivals: ["festival", "festivals", "fiesta"],
      shopping: ["shopping", "compras", "bazaar"],
      art: ["art", "arte", "gallery", "galería"],
      architecture: ["architecture", "arquitectura", "building"],
      local_experiences: ["local", "locales", "authentic", "auténtico"],
      hidden_gems: ["hidden gem", "secreto", "oculto"]
    };

    Object.keys(keywordMap).forEach(function (archetypeId) {
      var terms = keywordMap[archetypeId];
      var matched = terms.some(function (term) {
        return matchesWholeTerm(text, term);
      });
      if (matched) {
        var amount = 1 * (direction || 1);
        bumpScore(raw, trace, question, archetypeId, amount, direction === -1 ? "keyword-avoid" : "keyword");
      }
    });
  }

  function matchesWholeTerm(text, term) {
    // Coincidencia por palabra completa: evita "van" en "vancouver" y "art" en "cuarto".
    // \b no funciona bien con acentos, así que usamos separadores explícitos.
    var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var pattern = new RegExp("(^|[^a-záéíóúüñ0-9])" + escaped + "($|[^a-záéíóúüñ0-9])", "i");
    return pattern.test(text);
  }

  function collectReasons(archetypeId, trace) {
    var entries = trace[archetypeId] || [];
    if (!entries.length) {
      return [];
    }

    return entries
      .slice()
      .sort(function (a, b) {
        return b.amount - a.amount;
      })
      .slice(0, 3)
      .map(function (entry) {
        return entry.question + ": " + entry.source;
      });
  }

  function buildSignals() {
    var answers = state.answers;
    var signals = {};
    signals.purpose = labelFromValue("trip_purpose", answers.trip_purpose) || "No definido";
    signals.destination = labelFromValue("destination_style", answers.destination_style) || "No definido";
    signals.flexibility = labelFromValue("travel_window", answers.travel_window) || "No definida";
    signals.dates = formatDateRange(answers.travel_start_date, answers.travel_end_date);
    signals.budget = labelFromValue("budget_band", answers.budget_band) || "No definido";
    signals.party = labelFromValue("party_size", answers.party_size) || "No definido";
    signals.pace = labelFromValue("pace", answers.pace) || "No definido";
    signals.accessibility = formatSelections(answers.access_needs) || "Sin necesidades marcadas";
    signals.photo = formatSelections(answers.photo_preferences) || "Sin preferencia explícita";
    signals.wellness = formatSelections(answers.wellness_preferences) || "Sin preferencia explícita";
    return signals;
  }

  function formatDateRange(startValue, endValue) {
    var start = normalizeText(startValue);
    var end = normalizeText(endValue);
    if (!start && !end) {
      return "Sin fechas definidas";
    }

    var startLabel = start ? formatCompactDate(start) : "inicio abierto";
    var endLabel = end ? formatCompactDate(end) : "regreso abierto";
    return startLabel + " → " + endLabel;
  }

  function formatCompactDate(value) {
    if (!value) {
      return "";
    }
    var date = new Date(value + "T00:00:00");
    if (isNaN(date.getTime())) {
      return value;
    }
    try {
      return new Intl.DateTimeFormat("es-MX", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    } catch (error) {
      return value;
    }
  }

  function buildNarrative(top, signals) {
    var topLine = top.length
      ? "Tus señales dominantes son " + top.slice(0, 3).map(function (item) { return item.label; }).join(", ") + "."
      : "Aún no hay suficientes señales para una afinidad dominante.";
    return [topLine, "Presupuesto: " + signals.budget + ".", "Ritmo: " + signals.pace + "."].join(" ");
  }

  function labelFromValue(questionId, value) {
    var question = findQuestion(questionId);
    if (!question) {
      return "";
    }
    var option = findOption(question, value);
    return option ? option.label : "";
  }

  function formatSelections(values) {
    if (!Array.isArray(values) || !values.length) {
      return "";
    }
    var question = findQuestionByValue(values[0]);
    if (!question) {
      return values.join(", ");
    }
    return values
      .map(function (value) {
        var option = findOption(question, value);
        return option ? option.label : value;
      })
      .join(", ");
  }

  function findQuestion(questionId) {
    var found = null;
    (survey.sections || []).some(function (section) {
      return (section.questions || []).some(function (question) {
        if (question.id === questionId) {
          found = question;
          return true;
        }
        return false;
      });
    });
    return found;
  }

  function findQuestionByValue(value) {
    var found = null;
    (survey.sections || []).some(function (section) {
      return (section.questions || []).some(function (question) {
        if ((question.options || []).some(function (option) {
          return option.value === value;
        })) {
          found = question;
          return true;
        }
        return false;
      });
    });
    return found;
  }

  function findOption(question, value) {
    return (question.options || []).find(function (option) {
      return option.value === value;
    }) || null;
  }

  function submitSurvey() {
    if (!currentSummary) {
      renderSummary();
    }

    state.completedAt = new Date().toISOString();
    state.screen = "thanks";
    state.exportPayload = buildExportPayload();
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(FINAL_KEY, JSON.stringify(state.exportPayload));
    saveDraft();
    goToScreen("thanks");
    renderThanks();
    toast("Perfil listo", "Se generaron los exportes.");
  }

  function renderThanks() {
    var payload = state.exportPayload || buildExportPayload();
    dom.thanksCopy.textContent = "Puedes descargar los tres archivos o volver a editar el perfil. El borrador sigue guardado localmente.";
    dom.downloadJson.dataset.payload = JSON.stringify(payload, null, 2);
    dom.downloadHtml.dataset.payload = buildExportHtml(payload);
    dom.downloadMd.dataset.payload = buildExportMarkdown(payload);
  }

  function buildExportPayload() {
    var summary = currentSummary || buildSummary();
    return {
      app: "Travel OS",
      module: "Traveler DNA",
      version: APP_VERSION,
      generatedAt: new Date().toISOString(),
      profile: summary.payload,
      summary: {
        title: summary.title,
        copy: summary.copy,
        overview: summary.overview,
        archetypes: summary.payload.topArchetypes,
        signals: summary.signals
      }
    };
  }

  function buildExportHtml(payload) {
    var topItems = payload.summary.archetypes
      .map(function (item) {
        return "<li><strong>" + escapeHtml(item.label) + "</strong><span>" + escapeHtml(String(item.scorePercent)) + "%</span></li>";
      })
      .join("");

    var overviewItems = payload.summary.overview
      .map(function (item) {
        return "<li><strong>" + escapeHtml(item.label) + "</strong><span>" + escapeHtml(item.value) + "</span></li>";
      })
      .join("");

    return (
      "<!doctype html>" +
      "<html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover'>" +
      "<title>traveler-summary</title>" +
      "<style>" +
      "body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',Segoe UI,sans-serif;margin:0;padding:32px;background:#f5f1ea;color:#101114}" +
      "@media (prefers-color-scheme: dark){body{background:#0f1115;color:#f3f4f6}}h1,h2,p,ul{margin:0 0 16px} .card{max-width:900px;margin:0 auto;background:rgba(255,255,255,.72);border:1px solid rgba(16,17,20,.08);border-radius:24px;padding:28px} ul{list-style:none;padding:0;display:grid;gap:10px} li{display:flex;justify-content:space-between;gap:12px;padding:14px;border-radius:16px;background:rgba(255,255,255,.85);border:1px solid rgba(16,17,20,.08)}" +
      "</style></head><body><article class='card'><p>Travel OS · Traveler DNA</p><h1>" +
      escapeHtml(payload.summary.title) +
      "</h1><p>" +
      escapeHtml(payload.summary.copy) +
      "</p><h2>Resumen</h2><ul>" +
      overviewItems +
      "</ul><h2>Top archetypes</h2><ul>" +
      topItems +
      "</ul></article></body></html>"
    );
  }

  function buildExportMarkdown(payload) {
    var lines = [];
    lines.push("# " + payload.summary.title);
    lines.push("");
    lines.push(payload.summary.copy);
    lines.push("");
    lines.push("## Resumen");
    payload.summary.overview.forEach(function (item) {
      lines.push("- " + item.label + ": " + item.value);
    });
    lines.push("");
    lines.push("## Top archetypes");
    payload.summary.archetypes.forEach(function (item) {
      lines.push("- " + item.label + " (" + item.scorePercent + "%): " + (item.reasons.join("; ") || "sin razones detalladas"));
    });
    lines.push("");
    lines.push("## Señales");
    payload.summary.signals.forEach(function (item) {
      lines.push("- " + item.label + ": " + item.value);
    });
    return lines.join("\n");
  }

  function downloadCurrentOutput(type) {
    var payload = state.exportPayload || buildExportPayload();
    var content = "";
    var filename = "";
    var mime = "text/plain;charset=utf-8";

    if (type === "json") {
      content = JSON.stringify(payload, null, 2);
      filename = "traveler-dna.json";
      mime = "application/json;charset=utf-8";
    } else if (type === "html") {
      content = buildExportHtml(payload);
      filename = "traveler-summary.html";
      mime = "text/html;charset=utf-8";
    } else {
      content = buildExportMarkdown(payload);
      filename = "traveler-summary.md";
      mime = "text/markdown;charset=utf-8";
    }

    triggerDownload(filename, content, mime);
  }

  function triggerDownload(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 200);
  }

  function saveDraft() {
    if (!ready) {
      return;
    }
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateResumeBanner();
  }

  function resetStorage() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FINAL_KEY);
  }

  function resetAll() {
    resetStorage();
    state = createDefaultState();
    currentSection = null;
    currentSummary = null;
    dom.nameInput.value = "";
    renderWelcome();
    toast("Perfil reiniciado", "Listo para crear uno nuevo.");
  }

  function updateResumeBanner() {
    var hasDraft = Boolean(localStorage.getItem(STORAGE_KEY));
    if (!hasDraft || state.screen !== "welcome") {
      hideResumeBanner();
      return;
    }

    var when = state.updatedAt ? formatDate(new Date(state.updatedAt)) : "hace poco";
    dom.resumeBannerCopy.textContent = state.name
      ? "Guardado por última vez " + when + "."
      : "Hay un borrador guardado en este navegador.";
    dom.resumeBanner.hidden = false;
  }

  function hideResumeBanner() {
    dom.resumeBanner.hidden = true;
  }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(date);
    } catch (error) {
      return date.toLocaleString();
    }
  }

  function toast(title, message) {
    var existing = document.querySelector(".modal-toast");
    if (existing) {
      existing.remove();
    }

    var node = document.createElement("div");
    node.className = "modal-toast";
    node.innerHTML = "<strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(message) + "</p>";
    document.body.appendChild(node);
    requestAnimationFrame(function () {
      node.classList.add("show");
    });

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      node.classList.remove("show");
      setTimeout(function () {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }, 220);
    }, 2400);
  }

  function normalizeAnswerValue(value) {
    if (typeof value === "string") {
      return value.trim();
    }
    return value;
  }

  function normalizeText(value) {
    return String(value || "").trim();
  }

  function isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return value === "" || value === null || typeof value === "undefined";
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

})();
