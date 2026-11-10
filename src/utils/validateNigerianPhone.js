const MISSING_LOCAL_PREFIX_ERROR = "Please start your number with 0 (for example 0812 042 2386) or with +234.";
const EXTRA_INTERNATIONAL_ZERO_ERROR = "Remove the 0 after +234.";
const INVALID_PHONE_ERROR = "Enter a valid Nigerian number, for example 0812 042 2386 or +234 812 042 2386.";

export function validateNigerianPhone(input) {
  const phone = String(input ?? "").replace(/[\s\-()]/g, "");

  if (/^\+2340/.test(phone)) {
    return { valid: false, normalized: "", error: EXTRA_INTERNATIONAL_ZERO_ERROR };
  }

  if (/^\d{10}$/.test(phone)) {
    return { valid: false, normalized: "", error: MISSING_LOCAL_PREFIX_ERROR };
  }

  if (/^0[789]\d{9}$/.test(phone)) {
    return { valid: true, normalized: `+234${phone.slice(1)}`, error: "" };
  }

  if (/^\+234[1-9]\d{9}$/.test(phone)) {
    return { valid: true, normalized: phone, error: "" };
  }

  return { valid: false, normalized: "", error: INVALID_PHONE_ERROR };
}

export default validateNigerianPhone;
