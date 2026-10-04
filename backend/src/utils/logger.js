const { sanitizeLogArgs } = require("./tokenSecurity");

const debug = (...args) => console.log("[debug]", ...sanitizeLogArgs(...args));
const info  = (...args) => console.log("[info]", ...sanitizeLogArgs(...args));
const warn  = (...args) => console.warn("[warn]", ...sanitizeLogArgs(...args));
const error = (...args) => console.error("[error]", ...sanitizeLogArgs(...args));

module.exports = { debug, info, warn, error };

