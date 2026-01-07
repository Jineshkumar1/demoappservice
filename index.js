const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  const memUsage = process.memoryUsage();
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Demo App Service</title>
    </head>
    <body>
      <h1>Welcome</h1>
      <h2>Initial Version of the App (v2.0)</h2>
      <p>Memory Usage:</p>
      <ul>
        <li>RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB</li>
        <li>Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB</li>
        <li>Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB</li>
        <li>External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB</li>
      </ul>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});