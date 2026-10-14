/* =========================================================
   CampusConnect — single source of truth for the API base URL.

   Load this BEFORE any script that talks to the backend, then
   use window.ccApi("/api/...") instead of hardcoding a host.

   Resolution order:
     1. localStorage "cc_api_base"      manual override
     2. page opened from disk (file://) -> local Flask
     3. a local static server that is NOT Flask
        (e.g. Live Server on :5500)      -> local Flask
     4. anything else (Flask serving the app, Render, ...)
                                        -> same origin
   ========================================================= */
(function () {
    "use strict";

    var base = "";

    try {
        var custom = localStorage.getItem("cc_api_base");
        if (custom) {
            base = custom.replace(/\/+$/, "");
        }
    } catch (e) {
        /* localStorage blocked (private mode / file://): fall through */
    }

    if (!base) {
        var host = location.hostname;
        var isLocalhost =
            host === "127.0.0.1" || host === "localhost" || host === "";

        if (location.protocol === "file:") {
            base = "http://127.0.0.1:5000";
        } else if (isLocalhost && location.port && location.port !== "5000") {
            base = "http://127.0.0.1:5000";
        }
    }

    window.CC_API_BASE = base;

    /* Helper so pages never hand-build URLs. */
    window.ccApi = function (path) {
        if (!path) {
            return window.CC_API_BASE;
        }
        return window.CC_API_BASE + (path.charAt(0) === "/" ? path : "/" + path);
    };
})();
