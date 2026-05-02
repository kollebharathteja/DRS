const fs = require("fs");
const path = require("path");

fs.copyFileSync(path.join(process.cwd(), "index.source.html"), path.join(process.cwd(), "index.html"));
