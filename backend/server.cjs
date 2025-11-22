const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { generateVoteProof } = require("../scripts/zk/zkVote.js");
const { generateTallyProof } = require("../scripts/zk/zkTally.js");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/vote", async (req, res) => {
  const vote = req.body.vote;
  const result = await generateVoteProof(vote);
  res.json(result);
});

app.post("/tally", async (req, res) => {
  const { votes, salts } = req.body;
  const result = await generateTallyProof(votes, salts);
  res.json(result);
});

app.listen(3001, () => {
  console.log("Slice backend running at http://localhost:3001");
});
