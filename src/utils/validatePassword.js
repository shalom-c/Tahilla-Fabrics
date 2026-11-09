const passwordRules = [
  { id: "length", label: "8 to 16 characters", test: (password) => password.length >= 8 && password.length <= 16 },
  { id: "uppercase", label: "At least one uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { id: "lowercase", label: "At least one lowercase letter", test: (password) => /[a-z]/.test(password) },
  { id: "number", label: "At least one number", test: (password) => /[0-9]/.test(password) },
  { id: "symbol", label: "At least one symbol", test: (password) => /[^A-Za-z0-9\s]/.test(password) },
];

export default function validatePassword(password) {
  const rules = passwordRules.map(({ id, label, test }) => ({
    id,
    label,
    passed: test(password),
  }));
  const score = rules.filter((rule) => rule.passed).length;

  return {
    rules,
    passed: rules.filter((rule) => rule.passed),
    failed: rules.filter((rule) => !rule.passed),
    valid: score === rules.length,
    strength: score === rules.length ? "strong" : score >= 3 ? "medium" : "weak",
  };
}
