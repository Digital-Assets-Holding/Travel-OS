#!/usr/bin/env node

const assert = require("assert/strict");
const validation = require("../docs/traveler-dna/validation.js");
const survey = require("../docs/traveler-dna/questions.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildValidExportPayload() {
  return {
    app: "Travel OS",
    module: "Traveler DNA",
    version: "1.2.1",
    generatedAt: "2026-07-13T12:00:00.000Z",
    profile: {
      version: "1.1.0",
      createdAt: "2026-07-13T11:00:00.000Z",
      updatedAt: "2026-07-13T11:30:00.000Z",
      completedAt: "2026-07-13T11:45:00.000Z",
      name: "Yued",
      answers: {
        traveler_name: "Yued",
        home_city: "Querétaro",
        destination_style: ["city"]
      },
      scores: { foodie: 4 },
      confidence: 87,
      confidencePercent: 87,
      confidenceLabel: "87%",
      topArchetypes: [
        {
          id: "foodie",
          label: "Foodie",
          score: 4,
          scorePercent: 100,
          affinityPercent: 100,
          confidencePercent: 87,
          confidenceLabel: "87%",
          answeredPotential: 4,
          answeredQuestions: 1,
          reasons: ["Propósito del viaje: Negocios"]
        }
      ],
      allArchetypes: [
        {
          id: "foodie",
          label: "Foodie",
          score: 4,
          scorePercent: 100,
          affinityPercent: 100,
          confidencePercent: 87,
          confidenceLabel: "87%",
          answeredPotential: 4,
          answeredQuestions: 1,
          reasons: ["Propósito del viaje: Negocios"]
        }
      ],
      signals: {
        confidence: "87%",
        purpose: "Negocios",
        destination: "Ciudad",
        flexibility: "Algo flexibles",
        dates: "Sin fechas definidas",
        budget: "No definido",
        party: "Familia",
        pace: "Balanceado",
        accessibility: "Sin necesidades marcadas",
        photo: "Sin preferencia explícita",
        wellness: "Sin preferencia explícita",
        interestsSelected: "Food",
        interestsRejected: "Shopper"
      },
      gating: {
        sectionId: "interest-gate",
        questionId: "interest_gate",
        selectedValues: ["food"],
        selectedCategories: [
          { value: "food", label: "Food", sectionIds: ["food-dna"] }
        ],
        rejectedCategories: [
          { value: "shopping", label: "Shopper", sectionIds: ["shopping-dna"] }
        ],
        selectedSectionIds: ["food-dna"],
        skippedSectionIds: ["shopping-dna"],
        visibleSectionIds: ["basic-info", "travel-mission", "traveler-dna"]
      },
      visibleSectionIds: ["basic-info", "travel-mission", "traveler-dna"],
      narrative: "Tus señales dominantes son Foodie.",
      questionVersion: survey.version
    },
    summary: {
      title: "Yued, tu Traveler DNA está listo.",
      copy: "Tus señales dominantes son Foodie.",
      overview: [
        { label: "Propósito", value: "Negocios" }
      ],
      archetypes: [
        {
          id: "foodie",
          label: "Foodie",
          score: 4,
          scorePercent: 100,
          affinityPercent: 100,
          confidencePercent: 87,
          confidenceLabel: "87%",
          answeredPotential: 4,
          answeredQuestions: 1,
          reasons: ["Propósito del viaje: Negocios"]
        }
      ],
      signals: [
        { label: "Confidence", value: "87%" }
      ],
      gating: {
        sectionId: "interest-gate",
        questionId: "interest_gate",
        selectedValues: ["food"],
        selectedCategories: [
          { value: "food", label: "Food", sectionIds: ["food-dna"] }
        ],
        rejectedCategories: [
          { value: "shopping", label: "Shopper", sectionIds: ["shopping-dna"] }
        ],
        selectedSectionIds: ["food-dna"],
        skippedSectionIds: ["shopping-dna"],
        visibleSectionIds: ["basic-info", "travel-mission", "travel-dna"]
      }
    }
  };
}

const surveyCheck = validation.validateSurveyDefinition(survey);
assert.equal(surveyCheck.valid, true, surveyCheck.message || surveyCheck.errors.join("\n"));

const duplicateSectionSurvey = clone(survey);
duplicateSectionSurvey.sections[1].id = duplicateSectionSurvey.sections[0].id;
const duplicateSectionCheck = validation.validateSurveyDefinition(duplicateSectionSurvey);
assert.equal(duplicateSectionCheck.valid, false);

const brokenGateSurvey = clone(survey);
brokenGateSurvey.sections
  .find((section) => section.id === "interest-gate")
  .questions[0].options[0].sectionIds = ["missing-section"];
const brokenGateCheck = validation.validateSurveyDefinition(brokenGateSurvey);
assert.equal(brokenGateCheck.valid, false);

const payload = buildValidExportPayload();
const payloadCheck = validation.validateExportPayload(payload);
assert.equal(payloadCheck.valid, true, payloadCheck.message || payloadCheck.errors.join("\n"));

const sanitized = validation.sanitizeExportPayload(payload);
const sanitizedCheck = validation.validateExportPayload(sanitized);
assert.equal(sanitizedCheck.valid, true, sanitizedCheck.message || sanitizedCheck.errors.join("\n"));
assert.equal(sanitized.profile.name, "");
assert.ok(!Object.prototype.hasOwnProperty.call(sanitized.profile.answers, "traveler_name"));
assert.ok(!Object.prototype.hasOwnProperty.call(sanitized.profile.answers, "home_city"));
assert.equal(sanitized.summary.title, "Tu Traveler DNA está listo.");

console.log("Traveler DNA validation tests passed.");
