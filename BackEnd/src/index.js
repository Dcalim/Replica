require("dotenv").config();

const app = require("./app");
const { openDatabase } = require("./db");

const PORT = process.env.PORT || 3001;

openDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
