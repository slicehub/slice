curl -X POST http://localhost:3001/tally \
  -H "Content-Type: application/json" \
  -d '{
    "votes":[1,0,1,1,0],
    "salts":["0","0","0","0","0"]
  }'
