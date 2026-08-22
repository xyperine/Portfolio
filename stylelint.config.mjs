/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    "custom-property-empty-line-before" : null,
    "declaration-empty-line-before" : null,
    "color-function-notation": "legacy",
    "hue-degree-notation": "number"
  }
};
