import express from 'express';

const app = express();
const port = 3000;


app.post('/init', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});




