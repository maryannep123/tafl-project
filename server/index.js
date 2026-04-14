const express = require("express");
const cors = require("cors");

const deriveRoutes = require("./routes/deriveRoutes");

const app = express();
const PORT = 5050;

app.use(cors());
app.use(express.json());

app.use("/api", deriveRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "CFG Server Running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});