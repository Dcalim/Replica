require("dotenv").config();

const app = require("./app");
const { openDatabase } = require("./db");
const { pruneExpiredHistory } = require("./services/settings");

const PORT = process.env.PORT || 3001;

openDatabase();
pruneExpiredHistory();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
