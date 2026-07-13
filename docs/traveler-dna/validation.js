(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.TravelerDNAValidation = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var QUESTION_TYPES = {
    text: true,
    textarea: true,
    single: true,
    multi: true,
    number: true,
    date: true,
    range: true
  };

  function validateSurveyDefinition(survey) {
    var errors = [];
    if (!isObject(survey)) {
      return invalid("La definición del cuestionario no es un objeto válido.");
    }

    if (!nonEmptyString(survey.version)) {
      errors.push("Falta survey.version.");
    }
    if (!nonEmptyString(survey.title)) {
      errors.push("Falta survey.title.");
    }
    if (!Array.isArray(survey.sections) || !survey.sections.length) {
      errors.push("survey.sections debe ser un arreglo no vacío.");
    }
    if (!Array.isArray(survey.archetypes) || !survey.archetypes.length) {
      errors.push("survey.archetypes debe ser un arreglo no vacío.");
    }

    var archetypeIds = Object.create(null);
    (survey.archetypes || []).forEach(function (item, index) {
      if (!isObject(item)) {
        errors.push("survey.archetypes[" + index + "] no es un objeto válido.");
        return;
      }
      if (!nonEmptyString(item.id)) {
        errors.push("survey.archetypes[" + index + "].id falta o es inválido.");
      } else if (archetypeIds[item.id]) {
        errors.push("survey.archetypes tiene el id duplicado: " + item.id);
      } else {
        archetypeIds[item.id] = true;
      }
      if (!nonEmptyString(item.label)) {
        errors.push("survey.archetypes[" + index + "].label falta o es inválido.");
      }
    });

    var sectionIds = Object.create(null);
    var questionIds = Object.create(null);
    var interestGateRefs = [];
    (survey.sections || []).forEach(function (section, sectionIndex) {
      if (!isObject(section)) {
        errors.push("survey.sections[" + sectionIndex + "] no es un objeto válido.");
        return;
      }

      if (!nonEmptyString(section.id)) {
        errors.push("survey.sections[" + sectionIndex + "].id falta o es inválido.");
      } else if (sectionIds[section.id]) {
        errors.push("survey.sections tiene el id duplicado: " + section.id);
      } else {
        sectionIds[section.id] = true;
      }

      if (!nonEmptyString(section.title)) {
        errors.push("survey.sections[" + sectionIndex + "].title falta o es inválido.");
      }
      if (!Array.isArray(section.questions) || !section.questions.length) {
        errors.push("survey.sections[" + sectionIndex + "].questions debe ser un arreglo no vacío.");
        return;
      }

      section.questions.forEach(function (question, questionIndex) {
        validateQuestionDefinition(question, section, sectionIndex, questionIndex, questionIds, interestGateRefs, errors);
      });
    });

    interestGateRefs.forEach(function (ref) {
      if (!sectionIds[ref.sectionId]) {
        errors.push("interest_gate referencia una sección inexistente: " + ref.sectionId);
      }
    });

    return finalize(errors);
  }

  function validateQuestionDefinition(question, section, sectionIndex, questionIndex, questionIds, interestGateRefs, errors) {
    if (!isObject(question)) {
      errors.push("survey.sections[" + sectionIndex + "].questions[" + questionIndex + "] no es un objeto válido.");
      return;
    }

    if (!nonEmptyString(question.id)) {
      errors.push("survey.sections[" + sectionIndex + "].questions[" + questionIndex + "].id falta o es inválido.");
    } else if (questionIds[question.id]) {
      errors.push("El id de pregunta está duplicado: " + question.id);
    } else {
      questionIds[question.id] = true;
    }

    if (!nonEmptyString(question.label)) {
      errors.push("survey.sections[" + sectionIndex + "].questions[" + questionIndex + "].label falta o es inválido.");
    }

    if (!QUESTION_TYPES[question.type]) {
      errors.push("survey.sections[" + sectionIndex + "].questions[" + questionIndex + "].type inválido: " + question.type);
      return;
    }

    if (question.type === "single" || question.type === "multi") {
      if (!Array.isArray(question.options) || !question.options.length) {
        errors.push("La pregunta " + question.id + " requiere options no vacías.");
        return;
      }
      question.options.forEach(function (option, optionIndex) {
        if (!isObject(option)) {
          errors.push("survey.sections[" + sectionIndex + "].questions[" + questionIndex + "].options[" + optionIndex + "] no es un objeto válido.");
          return;
        }
        if (!nonEmptyString(option.value)) {
          errors.push("La opción " + optionIndex + " de " + question.id + " carece de value.");
        }
        if (!nonEmptyString(option.label)) {
          errors.push("La opción " + optionIndex + " de " + question.id + " carece de label.");
        }
        if (question.id === "interest_gate" && !Array.isArray(option.sectionIds)) {
          errors.push("La opción " + option.value + " de interest_gate requiere sectionIds.");
        } else if (question.id === "interest_gate" && Array.isArray(option.sectionIds)) {
          if (!option.sectionIds.length) {
            errors.push("La opción " + option.value + " de interest_gate requiere sectionIds no vacíos.");
          }
          option.sectionIds.forEach(function (sectionId, refIndex) {
            if (!nonEmptyString(sectionId)) {
              errors.push("interest_gate.sectionIds[" + refIndex + "] de " + option.value + " es inválido.");
            } else {
              interestGateRefs.push({
                sectionId: sectionId,
                optionValue: option.value
              });
            }
          });
        }
      });
    }

    if (question.type === "number") {
      if (typeof question.min !== "undefined" && !isFiniteNumber(question.min)) {
        errors.push("La pregunta " + question.id + " tiene min inválido.");
      }
      if (typeof question.max !== "undefined" && !isFiniteNumber(question.max)) {
        errors.push("La pregunta " + question.id + " tiene max inválido.");
      }
      if (typeof question.step !== "undefined" && !isFiniteNumber(question.step)) {
        errors.push("La pregunta " + question.id + " tiene step inválido.");
      }
      if (typeof question.min !== "undefined" && typeof question.max !== "undefined" && isFiniteNumber(question.min) && isFiniteNumber(question.max) && question.min > question.max) {
        errors.push("La pregunta " + question.id + " tiene min mayor que max.");
      }
    }
  }

  function validateExportPayload(payload) {
    var errors = [];
    if (!isObject(payload)) {
      return invalid("El payload de export no es un objeto válido.");
    }

    if (payload.app !== "Travel OS") {
      errors.push("payload.app debe ser Travel OS.");
    }
    if (payload.module !== "Traveler DNA") {
      errors.push("payload.module debe ser Traveler DNA.");
    }
    if (!nonEmptyString(payload.version)) {
      errors.push("payload.version falta o es inválido.");
    }
    if (!isIsoDateTime(payload.generatedAt)) {
      errors.push("payload.generatedAt debe ser ISO date-time.");
    }
    if (!isObject(payload.profile)) {
      errors.push("payload.profile debe ser un objeto.");
    } else {
      validateProfile(payload.profile, errors);
    }
    if (!isObject(payload.summary)) {
      errors.push("payload.summary debe ser un objeto.");
    } else {
      validateSummary(payload.summary, errors);
    }

    return finalize(errors);
  }

  function validateProfile(profile, errors) {
    if (!nonEmptyString(profile.version)) {
      errors.push("profile.version falta o es inválido.");
    }
    if (!isIsoDateTime(profile.createdAt)) {
      errors.push("profile.createdAt debe ser ISO date-time.");
    }
    if (!isIsoDateTime(profile.updatedAt)) {
      errors.push("profile.updatedAt debe ser ISO date-time.");
    }
    if (profile.completedAt !== null && !isIsoDateTime(profile.completedAt)) {
      errors.push("profile.completedAt debe ser ISO date-time o null.");
    }
    if (typeof profile.name !== "string") {
      errors.push("profile.name debe ser string.");
    }
    if (!isObject(profile.answers)) {
      errors.push("profile.answers debe ser un objeto.");
    }
    if (!isObject(profile.scores)) {
      errors.push("profile.scores debe ser un objeto.");
    }
    if (!isIntegerRange(profile.confidence, 0, 100)) {
      errors.push("profile.confidence debe estar entre 0 y 100.");
    }
    if (!isIntegerRange(profile.confidencePercent, 0, 100)) {
      errors.push("profile.confidencePercent debe estar entre 0 y 100.");
    }
    if (!nonEmptyString(profile.confidenceLabel)) {
      errors.push("profile.confidenceLabel falta o es inválido.");
    }
    if (!Array.isArray(profile.topArchetypes)) {
      errors.push("profile.topArchetypes debe ser un arreglo.");
    } else {
      profile.topArchetypes.forEach(function (item, index) {
        validateArchetypeItem(item, "profile.topArchetypes[" + index + "]", errors);
      });
    }
    if (!Array.isArray(profile.allArchetypes)) {
      errors.push("profile.allArchetypes debe ser un arreglo.");
    } else {
      profile.allArchetypes.forEach(function (item, index) {
        validateArchetypeItem(item, "profile.allArchetypes[" + index + "]", errors);
      });
    }
    if (!isObject(profile.signals)) {
      errors.push("profile.signals debe ser un objeto.");
    } else {
      validateSignals(profile.signals, errors);
    }
    if (!isObject(profile.gating)) {
      errors.push("profile.gating debe ser un objeto.");
    } else {
      validateGating(profile.gating, errors);
    }
    if (!Array.isArray(profile.visibleSectionIds)) {
      errors.push("profile.visibleSectionIds debe ser un arreglo.");
    } else {
      profile.visibleSectionIds.forEach(function (sectionId, index) {
        if (!nonEmptyString(sectionId)) {
          errors.push("profile.visibleSectionIds[" + index + "] es inválido.");
        }
      });
    }
    if (!nonEmptyString(profile.narrative)) {
      errors.push("profile.narrative falta o es inválido.");
    }
    if (!nonEmptyString(profile.questionVersion)) {
      errors.push("profile.questionVersion falta o es inválido.");
    }
  }

  function validateSummary(summary, errors) {
    if (!nonEmptyString(summary.title)) {
      errors.push("summary.title falta o es inválido.");
    }
    if (!nonEmptyString(summary.copy)) {
      errors.push("summary.copy falta o es inválido.");
    }
    if (!Array.isArray(summary.overview)) {
      errors.push("summary.overview debe ser un arreglo.");
    }
    if (!Array.isArray(summary.archetypes)) {
      errors.push("summary.archetypes debe ser un arreglo.");
    }
    if (!Array.isArray(summary.signals)) {
      errors.push("summary.signals debe ser un arreglo.");
    }
    if (!isObject(summary.gating)) {
      errors.push("summary.gating debe ser un objeto.");
    }
  }

  function validateArchetypeItem(item, path, errors) {
    if (!isObject(item)) {
      errors.push(path + " no es un objeto válido.");
      return;
    }
    if (!nonEmptyString(item.id)) {
      errors.push(path + ".id falta o es inválido.");
    }
    if (!nonEmptyString(item.label)) {
      errors.push(path + ".label falta o es inválido.");
    }
    if (!isFiniteNumber(item.score)) {
      errors.push(path + ".score falta o es inválido.");
    }
    if (!isIntegerRange(item.scorePercent, 0, 100)) {
      errors.push(path + ".scorePercent debe estar entre 0 y 100.");
    }
    if (!isIntegerRange(item.affinityPercent, 0, 100)) {
      errors.push(path + ".affinityPercent debe estar entre 0 y 100.");
    }
    if (!isIntegerRange(item.confidencePercent, 0, 100)) {
      errors.push(path + ".confidencePercent debe estar entre 0 y 100.");
    }
    if (!nonEmptyString(item.confidenceLabel)) {
      errors.push(path + ".confidenceLabel falta o es inválido.");
    }
    if (!isFiniteNumber(item.answeredPotential)) {
      errors.push(path + ".answeredPotential falta o es inválido.");
    }
    if (!isIntegerRange(item.answeredQuestions, 0, Number.MAX_SAFE_INTEGER)) {
      errors.push(path + ".answeredQuestions falta o es inválido.");
    }
    if (!Array.isArray(item.reasons)) {
      errors.push(path + ".reasons debe ser un arreglo.");
    }
  }

  function validateSignals(signals, errors) {
    var keys = [
      "confidence",
      "purpose",
      "destination",
      "flexibility",
      "dates",
      "budget",
      "party",
      "pace",
      "accessibility",
      "photo",
      "wellness",
      "interestsSelected",
      "interestsRejected"
    ];
    keys.forEach(function (key) {
      if (!nonEmptyString(signals[key])) {
        errors.push("profile.signals." + key + " falta o es inválido.");
      }
    });
  }

  function validateGating(gating, errors) {
    var keys = [
      "sectionId",
      "questionId",
      "selectedValues",
      "selectedCategories",
      "rejectedCategories",
      "selectedSectionIds",
      "skippedSectionIds",
      "visibleSectionIds"
    ];
    keys.forEach(function (key) {
      if (typeof gating[key] === "undefined") {
        errors.push("profile.gating." + key + " falta.");
      }
    });
    ["selectedValues", "selectedSectionIds", "skippedSectionIds", "visibleSectionIds"].forEach(function (key) {
      if (!Array.isArray(gating[key])) {
        errors.push("profile.gating." + key + " debe ser un arreglo.");
      }
    });
    ["selectedCategories", "rejectedCategories"].forEach(function (key) {
      if (!Array.isArray(gating[key])) {
        errors.push("profile.gating." + key + " debe ser un arreglo.");
      }
    });
  }

  function sanitizeExportPayload(payload) {
    var clone = deepClone(payload);
    if (!isObject(clone) || !isObject(clone.profile)) {
      return clone;
    }

    clone.profile.name = "";
    if (isObject(clone.profile.answers)) {
      delete clone.profile.answers.traveler_name;
      delete clone.profile.answers.home_city;
    }
    if (isObject(clone.summary)) {
      clone.summary.title = "Tu Traveler DNA está listo.";
    }
    return clone;
  }

  function finalize(errors) {
    if (errors.length) {
      return { valid: false, errors: errors.slice(), message: errors[0] };
    }
    return { valid: true, errors: [], message: "" };
  }

  function invalid(message) {
    return { valid: false, errors: [message], message: message };
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  function isIntegerRange(value, min, max) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value && value >= min && value <= max;
  }

  function isIsoDateTime(value) {
    return typeof value === "string" && !isNaN(Date.parse(value));
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  return {
    validateSurveyDefinition: validateSurveyDefinition,
    validateExportPayload: validateExportPayload,
    sanitizeExportPayload: sanitizeExportPayload
  };
});
