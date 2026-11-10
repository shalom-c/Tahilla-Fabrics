import assert from "node:assert/strict";
import test from "node:test";
import validateNigerianPhone from "./validateNigerianPhone.js";

test("accepts local and international Nigerian phone formats", () => {
  for (const [input, normalized] of [
    ["08120422386", "+2348120422386"],
    ["0812 042 2386", "+2348120422386"],
    ["(0812) 042-2386", "+2348120422386"],
    ["+2348120422386", "+2348120422386"],
    ["+234 812 042 2386", "+2348120422386"],
  ]) {
    assert.deepEqual(validateNigerianPhone(input), {
      valid: true,
      normalized,
      error: "",
    });
  }
});

test("rejects malformed or unsupported Nigerian phone numbers with the specific error", () => {
  assert.equal(
    validateNigerianPhone("8120422386").error,
    "Please start your number with 0 (for example 0812 042 2386) or with +234.",
  );
  assert.equal(
    validateNigerianPhone("+23408120422386").error,
    "Remove the 0 after +234.",
  );

  for (const input of [
    "2348120422386",
    "0812042238",
    "081204223866",
    "0612042238",
  ]) {
    assert.equal(validateNigerianPhone(input).valid, false, input);
  }
});
