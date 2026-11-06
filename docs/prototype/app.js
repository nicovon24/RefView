(() => {
  const state = {
    lang: localStorage.getItem("refview-prototype-lang") || "es",
    view: "home",
    camera: "third",
    decision: null,
    assessmentAnswer: null,
    role: "main",
    catalogState: "ready",
    plannedScenario: "deflection",
  };

  const views = [...document.querySelectorAll("[data-view]")];
  const header = document.getElementById("global-header");
  const menu = document.getElementById("mobile-nav");
  const menuButton = document.getElementById("menu-button");
  const toast = document.getElementById("toast");

  const sampleActivity = document.querySelector(".home-ribbon > div:first-child span");
  sampleActivity.dataset.es = "intentos de ejemplo esta semana";
  sampleActivity.dataset.en = "sample attempts this week";
  const synchronizedInput = document.querySelector('[name="synchronized"]');
  const synchronizedLabel = synchronizedInput.nextElementSibling;
  synchronizedInput.checked = false;
  synchronizedInput.disabled = true;
  synchronizedLabel.dataset.es = "Sincronización planificada · no demostrada";
  synchronizedLabel.dataset.en = "Planned synchronization · not demonstrated";
  const varNotice = document.createElement("p");
  varNotice.className = "var-concept-notice";
  varNotice.dataset.es = "Vistas conceptuales independientes · no son evidencia sincronizada del motor";
  varNotice.dataset.en = "Independent concept views · not synchronized engine evidence";
  document.querySelector(".var-header").after(varNotice);
  const coachIntro = document.querySelector(".coach-messages .coach-message p");
  coachIntro.dataset.es = "Puedo explicar este ejemplo preparado usando sólo hechos curados y la referencia versionada. Este prototipo no registra tu posición ni analiza video.";
  coachIntro.dataset.en = "I can explain this prepared example using only curated facts and the versioned reference. This prototype does not record your position or analyze video.";

  const copy = (es, en) => state.lang === "es" ? es : en;

  function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-es][data-en]").forEach((element) => {
      element.textContent = element.dataset[state.lang];
    });
    document.querySelectorAll("[data-es-aria-label][data-en-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", element.dataset[`${state.lang}AriaLabel`]);
    });
    document.getElementById("language-toggle").innerHTML = state.lang === "es" ? "ES <span>/ EN</span>" : "EN <span>/ ES</span>";
    document.getElementById("language-toggle").setAttribute("aria-label", copy("Cambiar a inglés", "Switch to Spanish"));
    academySearch.placeholder = copy("Buscar entre siete temas…", "Search seven topics…");
    renderAcademy();
    const scenarioSearch = document.getElementById("scenario-search");
    scenarioSearch.placeholder = scenarioSearch.dataset[`${state.lang}Placeholder`];
    renderCatalog();
    renderRole();
    const coachInput = document.getElementById("coach-input");
    coachInput.placeholder = copy("Preguntá sobre este intento…", "Ask about this attempt…");
    const commNote = document.querySelector(".var-notes textarea");
    commNote.placeholder = copy("Nota de comunicación…", "Communication note…");
    updateCameraLabel();
    localStorage.setItem("refview-prototype-lang", state.lang);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function showView(name, pushHash = true) {
    const target = document.querySelector(`[data-view="${name}"]`);
    if (!target) return;
    if (name === "var") {
      const back = document.querySelector(".var-header .back-button");
      const fromRole = state.view === "simulator";
      back.dataset.simStep = fromRole ? "simulator" : "debrief";
      back.dataset.es = fromRole ? "Volver a roles" : "Volver al debrief";
      back.dataset.en = fromRole ? "Back to roles" : "Back to debrief";
      back.textContent = back.dataset[state.lang];
    }
    state.view = name;
    views.forEach((view) => view.classList.toggle("is-active", view === target));
    const live = name === "live";
    document.body.classList.toggle("live-mode", live);
    header.classList.toggle("live-hidden", live);
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === name);
    });
    if (pushHash) history.replaceState(null, "", `#${name}`);
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "auto" });
    const heading = target.querySelector("h1");
    const focusTarget = heading || target;
    if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
    focusTarget.focus({ preventScroll: true });
  }

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.nav));
  });
  document.querySelectorAll("[data-sim-step]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.simStep));
  });

  menuButton.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    menuButton.setAttribute("aria-expanded", String(!menu.hidden));
  });

  document.getElementById("language-toggle").addEventListener("click", () => {
    state.lang = state.lang === "es" ? "en" : "es";
    applyLanguage();
    showToast(copy("Idioma cambiado a español", "Language switched to English"));
  });

  const roleLabels = {
    main: ["Árbitro principal", "Main referee"],
    assistant: ["Árbitro asistente · concepto planificado", "Assistant referee · planned concept"],
    var: ["VAR · workspace ilustrativo", "VAR · illustrative workspace"],
  };
  function renderRole() {
    document.querySelectorAll("[data-role]").forEach((item) => {
      const selected = item.dataset.role === state.role;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    const label = roleLabels[state.role];
    const output = document.getElementById("selected-role-label");
    output.dataset.es = label[0];
    output.dataset.en = label[1];
    output.textContent = label[state.lang === "es" ? 0 : 1];
    const continueButton = document.getElementById("role-continue");
    const actions = {
      main: ["Elegir escenario", "Choose scenario"],
      assistant: ["Ver estado del asistente", "View assistant status"],
      var: ["Abrir VAR ilustrativo", "Open illustrative VAR"],
    };
    continueButton.dataset.es = actions[state.role][0];
    continueButton.dataset.en = actions[state.role][1];
    continueButton.textContent = actions[state.role][state.lang === "es" ? 0 : 1];
  }
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = button.dataset.role;
      renderRole();
    });
  });
  document.getElementById("role-continue").addEventListener("click", () => {
    showView(state.role === "main" ? "scenario" : state.role === "assistant" ? "role-unavailable" : "var");
  });

  const catalogSearch = document.getElementById("scenario-search");
  const catalogPanels = [...document.querySelectorAll("[data-catalog-panel]")];
  const catalogItems = [...document.querySelectorAll("[data-catalog-item]")];
  const plannedTitles = {
    deflection: ["Rebote o pase deliberado", "Deflection or deliberate play"],
    advantage: ["Ventaja y segunda acción", "Advantage and second action"],
  };
  function renderCatalog() {
    const query = catalogSearch.value.trim().toLocaleLowerCase(state.lang);
    let matches = 0;
    catalogItems.forEach((item) => {
      const matched = !query || item.dataset[`search${state.lang[0].toUpperCase()}${state.lang.slice(1)}`].toLocaleLowerCase(state.lang).includes(query);
      item.hidden = !matched;
      if (matched && item.tagName === "BUTTON") matches += 1;
    });
    document.querySelector(".scenario-layout").classList.toggle("catalog-planned-only", catalogItems[0].hidden);
    const visibleState = state.catalogState === "ready" && matches === 0 ? "empty-search" : state.catalogState;
    catalogPanels.forEach((panel) => { panel.hidden = panel.dataset.catalogPanel !== visibleState; });
    const count = document.getElementById("catalog-count");
    count.hidden = visibleState !== "ready";
    count.textContent = copy(`${matches} de 3 ejemplos del concepto`, `${matches} of 3 concept examples`);
    const planned = document.getElementById("planned-scenario-title");
    planned.textContent = plannedTitles[state.plannedScenario][state.lang === "es" ? 0 : 1];
    planned.setAttribute("lang", state.lang);
  }
  function setCatalogState(next) {
    state.catalogState = next;
    renderCatalog();
    const active = catalogPanels.find((panel) => !panel.hidden);
    const focusTarget = next === "ready"
      ? active.querySelector(".scenario-feature:not([hidden]) h2") ||
        active.querySelector(".scenario-queue [data-catalog-item]:not([hidden])") ||
        document.getElementById("scenario-title")
      : active.querySelector("h2") || document.getElementById("scenario-title");
    if (focusTarget.matches("button, a[href], input, select, textarea")) focusTarget.removeAttribute("tabindex");
    else if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
    focusTarget.focus({ preventScroll: true });
  }
  catalogSearch.addEventListener("input", () => {
    state.catalogState = "ready";
    renderCatalog();
  });
  document.querySelectorAll("[data-catalog-demo]").forEach((button) => {
    button.addEventListener("click", () => setCatalogState(button.dataset.catalogDemo));
  });
  document.getElementById("clear-scenario-search").addEventListener("click", () => {
    catalogSearch.value = "";
    setCatalogState("ready");
    catalogSearch.focus();
  });
  document.querySelectorAll("[data-catalog-planned]").forEach((button) => {
    button.addEventListener("click", () => {
      state.plannedScenario = button.dataset.catalogPlanned;
      setCatalogState("planned-content");
    });
  });
  document.querySelector("[data-catalog-ready]").addEventListener("click", () => {
    document.querySelector(".scenario-feature .button").focus();
  });
  document.querySelectorAll("[data-main-fixture]").forEach((button) => {
    button.addEventListener("click", () => {
      state.role = "main";
      renderRole();
      catalogSearch.value = "";
      state.catalogState = "ready";
      renderCatalog();
      showView("scenario");
    });
  });

  const gameFrame = document.getElementById("game-frame");
  const gameImage = document.getElementById("game-camera-image");
  const cameraLabel = document.getElementById("camera-label");
  function updateCameraLabel() {
    if (!cameraLabel) return;
    const pov = state.camera === "pov";
    cameraLabel.textContent = pov ? copy("Primera persona", "First person") : copy("Detrás del árbitro", "Behind referee");
    cameraLabel.dataset.es = pov ? "Primera persona" : "Detrás del árbitro";
    cameraLabel.dataset.en = pov ? "First person" : "Behind referee";
  }
  function toggleCamera() {
    state.camera = state.camera === "third" ? "pov" : "third";
    const pov = state.camera === "pov";
    gameImage.src = pov ? "assets/referee-pov-concept.png" : "assets/third-person-concept.png";
    gameImage.alt = pov ? copy("Concepto visual en primera persona del árbitro", "Visual concept from the referee's first-person view") : copy("Concepto visual detrás del árbitro", "Visual concept behind the referee");
    gameFrame.classList.toggle("camera-pov", pov);
    updateCameraLabel();
    showToast(pov ? copy("Cámara: primera persona", "Camera: first person") : copy("Cámara: detrás del árbitro", "Camera: behind referee"));
  }
  document.getElementById("camera-toggle").addEventListener("click", toggleCamera);
  document.getElementById("camera-distance").addEventListener("input", (event) => {
    gameFrame.classList.remove("camera-near", "camera-far");
    if (event.target.value === "1") gameFrame.classList.add("camera-near");
    if (event.target.value === "3") gameFrame.classList.add("camera-far");
  });

  document.getElementById("pause-game").addEventListener("click", (event) => {
    const paused = gameFrame.classList.toggle("is-paused");
    event.currentTarget.textContent = paused ? copy("Reanudar", "Resume") : copy("Pausar", "Pause");
    let note = gameFrame.querySelector(".pause-note");
    if (paused) {
      note = document.createElement("div");
      note.className = "pause-note";
      note.textContent = copy("PAUSA", "PAUSED");
      gameFrame.append(note);
    } else note?.remove();
  });

  const decisionPanel = document.getElementById("decision-panel");
  const decisionTrigger = document.getElementById("decision-trigger");
  const decisionDetail = document.getElementById("decision-detail");
  const submitDecision = document.getElementById("submit-decision");
  decisionTrigger.addEventListener("click", () => {
    decisionPanel.hidden = false;
    decisionTrigger.hidden = true;
  });
  document.getElementById("decision-close").addEventListener("click", () => {
    decisionPanel.hidden = true;
    decisionTrigger.hidden = false;
  });
  document.querySelectorAll("[data-decision]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-decision]").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.decision = button.dataset.decision;
      decisionDetail.hidden = state.decision !== "stop";
      submitDecision.disabled = false;
    });
  });
  submitDecision.addEventListener("click", () => {
    localStorage.setItem("refview-prototype-last-decision", JSON.stringify({ decision: state.decision, at: new Date().toISOString() }));
    decisionPanel.hidden = true;
    decisionTrigger.hidden = false;
    showView("debrief");
  });

  const replayRange = document.querySelector('[name="replay-timeline"]');
  const replayTime = replayRange.nextElementSibling;
  let replayPlaying = false;
  let replayTimer;
  function renderReplayTime() {
    const seconds = 12.3 + Number(replayRange.value) * 0.1;
    replayTime.textContent = `00:${seconds.toFixed(1).padStart(4, "0")}`;
  }
  function stopReplay() {
    replayPlaying = false;
    window.clearInterval(replayTimer);
    document.getElementById("replay-play").textContent = "Play";
  }
  document.getElementById("replay-play").addEventListener("click", (event) => {
    replayPlaying = !replayPlaying;
    event.currentTarget.textContent = replayPlaying ? copy("Pausa", "Pause") : "Play";
    window.clearInterval(replayTimer);
    if (replayPlaying) replayTimer = window.setInterval(() => {
      replayRange.value = Number(replayRange.value) >= 100 ? 0 : Number(replayRange.value) + 1;
      renderReplayTime();
    }, 180);
  });
  document.getElementById("replay-step-back").addEventListener("click", () => {
    stopReplay(); replayRange.value = Math.max(0, Number(replayRange.value) - 1); renderReplayTime();
  });
  document.getElementById("replay-step-forward").addEventListener("click", () => {
    stopReplay(); replayRange.value = Math.min(100, Number(replayRange.value) + 1); renderReplayTime();
  });
  replayRange.addEventListener("input", () => { stopReplay(); renderReplayTime(); });
  renderReplayTime();
  document.querySelectorAll(".evidence-timeline button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".evidence-timeline button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
  }));

  document.querySelectorAll(".camera-feed").forEach((feed) => feed.addEventListener("click", () => {
    document.querySelectorAll(".camera-feed").forEach((item) => item.classList.remove("active"));
    feed.classList.add("active");
  }));
  let varDelay = 360;
  document.querySelectorAll(".speed-buttons button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".speed-buttons button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    varDelay = 180 / Number.parseFloat(button.textContent);
    if (varPlaying) {
      window.clearInterval(varTimer);
      varTimer = window.setInterval(() => { varFrame = varFrame >= 100 ? 0 : varFrame + 1; renderVarFrame(); }, varDelay);
    }
  }));
  const varButtons = [...document.querySelectorAll(".transport-buttons button")];
  const varTimecode = document.querySelector(".timecode");
  const varPlayhead = document.querySelector(".var-timeline .playhead");
  let varFrame = 56;
  let varPlaying = false;
  let varTimer;
  function renderVarFrame() {
    const seconds = 12.8 + varFrame * 0.1;
    const label = `00:${seconds.toFixed(3).padStart(6, "0")}`;
    varTimecode.textContent = label;
    document.querySelectorAll(".camera-feed figcaption span").forEach((span) => { span.textContent = label; });
    varPlayhead.style.left = `${varFrame}%`;
  }
  function stopVar() {
    varPlaying = false;
    window.clearInterval(varTimer);
    varButtons[2].textContent = "Play";
  }
  function stepVar(delta) {
    stopVar(); varFrame = Math.max(0, Math.min(100, varFrame + delta)); renderVarFrame();
  }
  varButtons[0].addEventListener("click", () => { stopVar(); varFrame = 0; renderVarFrame(); });
  varButtons[1].addEventListener("click", () => stepVar(-1));
  varButtons[2].addEventListener("click", () => {
    varPlaying = !varPlaying;
    varButtons[2].textContent = varPlaying ? copy("Pausa", "Pause") : "Play";
    window.clearInterval(varTimer);
    if (varPlaying) varTimer = window.setInterval(() => {
      varFrame = varFrame >= 100 ? 0 : varFrame + 1; renderVarFrame();
    }, varDelay);
  });
  varButtons[3].addEventListener("click", () => stepVar(1));
  varButtons[4].addEventListener("click", () => { stopVar(); varFrame = 100; renderVarFrame(); });
  renderVarFrame();
  document.getElementById("var-check-complete").addEventListener("click", () => {
    document.getElementById("var-state-label").textContent = copy("CHEQUEO COMPLETO", "CHECK COMPLETE");
    showToast(copy("Comunicación demo: chequeo completo", "Demo communication: check complete"));
  });
  document.getElementById("var-recommend").addEventListener("click", () => {
    document.querySelector(".var-state").classList.add("review");
    document.getElementById("var-state-label").textContent = copy("REVISIÓN RECOMENDADA", "REVIEW RECOMMENDED");
    showToast(copy("Estado ilustrativo: revisión recomendada", "Illustrative state: review recommended"));
  });

  const topics = {
    challenges: {
      es: ["¿Cuándo un desafío se convierte en falta?", "No alcanza con ver contacto. Primero describí qué hizo cada jugador, dónde ocurrió y cómo afectó al rival."],
      en: ["When does a challenge become a foul?", "Contact alone is not enough. First describe what each player did, where it happened and how it affected the opponent."],
    },
    offside: { es: ["Fuera de juego: posición no es infracción", "Separá la posición del atacante, la acción posterior y el tipo de intervención del defensor."], en: ["Offside: position is not an offence", "Separate the attacker’s position, the later action and the defender’s type of intervention."] },
    handball: { es: ["Mano: describí antes de interpretar", "Ubicación del brazo, movimiento y consecuencia son hechos distintos de la decisión final."], en: ["Handball: describe before interpreting", "Arm position, movement and consequence are facts distinct from the final decision."] },
    advantage: { es: ["Ventaja: valorá la oportunidad real", "La posesión por sí sola no siempre produce una ventaja mejor que el tiro libre."], en: ["Advantage: assess the real opportunity", "Possession alone does not always create an advantage better than the free kick."] },
    penalties: { es: ["Área penal: ubicación y naturaleza", "La línea pertenece al área. Determiná primero dónde ocurre la infracción."], en: ["Penalty area: location and nature", "The line belongs to the area. First determine where the offence occurs."] },
    discipline: { es: ["Disciplina: la sanción necesita contexto", "Intensidad, riesgo, oportunidad y conducta se evalúan por separado."], en: ["Discipline: sanction needs context", "Intensity, risk, opportunity and conduct are assessed separately."] },
    var: { es: ["VAR: corregir no es volver a arbitrar", "La intervención depende de la categoría revisable y del umbral de error."], en: ["VAR: correction is not re-refereeing", "Intervention depends on the reviewable category and the error threshold."] },
  };
  const academySearch = document.querySelector('[name="academy-search"]');
  const topicButtons = [...document.querySelectorAll("[data-topic]")];
  const academyPreview = document.createElement("p");
  academyPreview.className = "academy-preview-note";
  academyPreview.dataset.es = "Vista preliminar del tema. La lección completa, la referencia y la práctica de este tema todavía no están disponibles en el concepto.";
  academyPreview.dataset.en = "Topic preview only. This topic's complete lesson, reference and practice are not available in the concept yet.";
  document.querySelector(".academy-view .lesson-lead").after(academyPreview);
  let selectedTopic = "challenges";
  function renderAcademy() {
    const query = academySearch.value.trim().toLocaleLowerCase(state.lang);
    const visible = topicButtons.filter((button) => {
      const matches = !query || button.dataset[state.lang].toLocaleLowerCase(state.lang).includes(query);
      button.hidden = !matches;
      return matches;
    });
    if (visible.length && !visible.some((button) => button.dataset.topic === selectedTopic)) selectedTopic = visible[0].dataset.topic;
    topicButtons.forEach((button) => {
      const active = !button.hidden && button.dataset.topic === selectedTopic;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const empty = visible.length === 0;
    document.getElementById("academy-empty").hidden = !empty;
    document.querySelector(".academy-view .lesson").hidden = empty;
    document.querySelector(".academy-view .official-reference").hidden = empty;
    document.getElementById("academy-search-count").textContent = copy(`${visible.length} de 7 temas ilustrativos`, `${visible.length} of 7 illustrative topics`);
    if (empty) return;
    const challenge = selectedTopic === "challenges";
    academyPreview.hidden = challenge;
    academyPreview.textContent = academyPreview.dataset[state.lang];
    const level = document.querySelector(".academy-view .lesson-level");
    level.dataset.es = challenge ? "RUTA PARA PRINCIPIANTES · 8 MIN" : "VISTA PRELIMINAR · SIN LECCIÓN COMPLETA";
    level.dataset.en = challenge ? "BEGINNER PATH · 8 MIN" : "TOPIC PREVIEW · NO COMPLETE LESSON";
    level.textContent = level.dataset[state.lang];
    document.querySelector(".academy-view .lesson-example").hidden = !challenge;
    document.querySelector(".academy-view .lesson details").hidden = !challenge;
    document.querySelector('.academy-view .lesson > [data-sim-step="briefing"]').hidden = !challenge;
    document.querySelector(".academy-view .official-reference").hidden = !challenge;
    const content = topics[selectedTopic];
    const title = document.getElementById("lesson-title");
    const lead = document.getElementById("lesson-lead");
    title.dataset.es = content.es[0]; title.dataset.en = content.en[0]; title.textContent = content[state.lang][0];
    lead.dataset.es = content.es[1]; lead.dataset.en = content.en[1]; lead.textContent = content[state.lang][1];
  }
  topicButtons.forEach((button) => button.addEventListener("click", () => {
    selectedTopic = button.dataset.topic;
    renderAcademy();
  }));
  academySearch.addEventListener("input", renderAcademy);
  document.getElementById("clear-academy-search").addEventListener("click", () => {
    academySearch.value = "";
    renderAcademy();
    academySearch.focus();
  });

  const ratingInput = document.getElementById("rating-input");
  const ratingOutput = document.getElementById("rating-output");
  ratingInput.addEventListener("input", () => { ratingOutput.textContent = `${ratingInput.value} / 10`; });
  document.getElementById("save-rating").addEventListener("click", () => {
    localStorage.setItem("refview-prototype-rating", ratingInput.value);
    document.getElementById("rating-feedback").textContent = copy(`Tu valoración demo se actualizó a ${ratingInput.value}/10 en este navegador.`, `Your demo rating was updated to ${ratingInput.value}/10 in this browser.`);
  });
  const savedRating = localStorage.getItem("refview-prototype-rating");
  if (savedRating) { ratingInput.value = savedRating; ratingOutput.textContent = `${savedRating} / 10`; }

  document.getElementById("comment-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("comment-input");
    if (!input.value.trim()) return;
    const article = document.createElement("article");
    article.className = "comment";
    article.innerHTML = `<header><span class="comment-avatar">NV</span><div><strong>Nicolás</strong><small>${copy("Ahora · borrador local de demostración", "Now · local demo draft")}</small></div></header><p></p><footer><button type="button">${copy("Útil", "Useful")} <b>0</b></button><button type="button">${copy("No útil", "Not useful")} <b>0</b></button></footer>`;
    article.querySelector("p").textContent = input.value.trim();
    document.getElementById("comments").prepend(article);
    input.value = "";
    showToast(copy("Comentario agregado sólo a esta demostración", "Comment added only to this demonstration"));
  });
  document.getElementById("comments").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const footer = button.parentElement;
    footer.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button && !button.classList.contains("is-active")));
  });
  document.getElementById("planned-match-button").addEventListener("click", () => {
    const explanation = document.getElementById("planned-match-explanation");
    explanation.hidden = false;
    explanation.focus();
  });
  document.getElementById("active-match-button").addEventListener("click", () => {
    document.getElementById("planned-match-explanation").hidden = true;
  });

  document.querySelectorAll("[data-answer]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-answer]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    state.assessmentAnswer = button.dataset.answer;
    document.getElementById("check-answer").disabled = false;
  }));
  document.getElementById("check-answer").addEventListener("click", () => {
    const panel = document.getElementById("correction-panel");
    panel.hidden = false;
    const correct = state.assessmentAnswer === "b";
    const badge = panel.querySelector(".result-pill");
    badge.textContent = correct ? copy("RESPUESTA CORRECTA", "CORRECT ANSWER") : copy("REVISÁ EL CRITERIO", "REVIEW THE CRITERION");
    badge.classList.toggle("success", correct);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  const drawer = document.getElementById("coach-drawer");
  let coachOpener = null;
  function closeCoach() {
    drawer.hidden = true;
    coachOpener?.focus();
  }
  document.querySelectorAll("[data-open-coach]").forEach((button) => button.addEventListener("click", () => {
    coachOpener = button;
    drawer.hidden = false;
    document.getElementById("coach-input").focus();
  }));
  document.getElementById("coach-close").addEventListener("click", closeCoach);
  const coachAnswers = {
    miss: {
      es: "Este ejemplo preparado propone que una oclusión breve podría ocultar el contacto. El prototipo no registra tu posición ni puede afirmar qué viste; la respuesta usa únicamente el brief curado.",
      en: "This prepared example proposes that a brief occlusion could hide the contact. The prototype does not record your position or know what you saw; this answer uses only the curated brief.",
    },
    sanction: { es: "La interpretación propuesta es penal sin tarjeta: el desafío se considera imprudente, no temerario, y las circunstancias completas no sostienen DOGSO. Nicolás todavía debe revisar el fútbol y la evidencia renderizada.", en: "The proposed interpretation is a penalty with no card: the challenge is considered careless, not reckless, and the full circumstances do not support DOGSO. Nicolás still needs to review the football and rendered evidence." },
    var: { es: "El VAR sólo podría intervenir si la situación es revisable y existe un error claro y obvio. En esta demostración, la interpretación propuesta considera que ese umbral no está alcanzado.", en: "VAR could intervene only if the situation is reviewable and there is a clear and obvious error. In this demonstration, the proposed interpretation says that threshold is not met." },
    practice: { es: "Practicá mantener un ángulo abierto al acercarte al área y luego compará un desafío fuera y otro sobre la línea. La Academy enlaza esta práctica con la Ley 12.", en: "Practice keeping an open angle when approaching the penalty area, then compare a challenge outside with one on the line. Academy links this practice to Law 12." },
  };
  function addCoachMessage(text, user = false) {
    const message = document.createElement("div");
    message.className = `coach-message${user ? " user" : ""}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    message.append(paragraph);
    document.getElementById("coach-messages").append(message);
    message.scrollIntoView({ behavior: "smooth" });
  }
  document.querySelectorAll("[data-coach-prompt]").forEach((button) => button.addEventListener("click", () => {
    addCoachMessage(button.textContent, true);
    addCoachMessage(coachAnswers[button.dataset.coachPrompt][state.lang]);
  }));
  document.getElementById("coach-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("coach-input");
    if (!input.value.trim()) return;
    addCoachMessage(input.value.trim(), true);
    addCoachMessage(copy("En este prototipo sólo puedo responder las preguntas preparadas de arriba. Un proveedor alojado se conectará más adelante con límites y referencias versionadas.", "In this prototype I can only answer the prepared questions above. A hosted provider may be connected later with usage limits and versioned references."));
    input.value = "";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && !drawer.hidden) {
      const focusable = [...drawer.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key.toLowerCase() === "c" && state.view === "live" && !event.target.matches("input,textarea,select")) toggleCamera();
    if (event.key === "Escape") {
      if (!drawer.hidden) closeCoach();
      if (!decisionPanel.hidden) { decisionPanel.hidden = true; decisionTrigger.hidden = false; }
    }
  });

  window.addEventListener("hashchange", () => {
    const requested = location.hash.replace("#", "");
    if (document.querySelector(`[data-view="${requested}"]`) && requested !== state.view) showView(requested, false);
  });

  applyLanguage();
  const initial = location.hash.replace("#", "");
  showView(document.querySelector(`[data-view="${initial}"]`) ? initial : "home", false);
})();
