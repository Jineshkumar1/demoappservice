const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY).start();

const { DefaultAzureCredential } = require('@azure/identity');
const { MetricsQueryClient } = require('@azure/monitor-query');

app.get('/', async (req, res) => {
  const memUsage = process.memoryUsage();

  let cpuProd = 0, memProd = 0, cpuStaging = 0, memStaging = 0;
  try {
    const credential = new DefaultAzureCredential();
    const client = new MetricsQueryClient(credential);
    const subId = process.env.AZURE_SUBSCRIPTION_ID;
    const rg = process.env.AZURE_RESOURCE_GROUP;
    const siteName = 'jpappdemo';

    // Production
    const prodResourceId = `/subscriptions/${subId}/resourceGroups/${rg}/providers/Microsoft.Web/sites/${siteName}`;
    const prodMetrics = await client.queryResource(prodResourceId, {
      metricNames: ["CpuTime", "MemoryPercentage"],
      timespan: { duration: "PT1H" },
      granularity: "PT1H",
      aggregations: ["Average"]
    });
    if (prodMetrics.metrics.CpuTime && prodMetrics.metrics.CpuTime.length > 0 && prodMetrics.metrics.CpuTime[0].data.length > 0) {
      cpuProd = prodMetrics.metrics.CpuTime[0].data[0].average || 0;
    }
    if (prodMetrics.metrics.MemoryPercentage && prodMetrics.metrics.MemoryPercentage.length > 0 && prodMetrics.metrics.MemoryPercentage[0].data.length > 0) {
      memProd = prodMetrics.metrics.MemoryPercentage[0].data[0].average || 0;
    }

    // Staging
    const stagingResourceId = `${prodResourceId}/slots/staging`;
    const stagingMetrics = await client.queryResource(stagingResourceId, {
      metricNames: ["CpuTime", "MemoryPercentage"],
      timespan: { duration: "PT1H" },
      granularity: "PT1H",
      aggregations: ["Average"]
    });
    if (stagingMetrics.metrics.CpuTime && stagingMetrics.metrics.CpuTime.length > 0 && stagingMetrics.metrics.CpuTime[0].data.length > 0) {
      cpuStaging = stagingMetrics.metrics.CpuTime[0].data[0].average || 0;
    }
    if (stagingMetrics.metrics.MemoryPercentage && stagingMetrics.metrics.MemoryPercentage.length > 0 && stagingMetrics.metrics.MemoryPercentage[0].data.length > 0) {
      memStaging = stagingMetrics.metrics.MemoryPercentage[0].data[0].average || 0;
    }
  } catch (error) {
    console.error('Error fetching Azure metrics:', error);
  }

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
      <h3>Azure App Service Metrics (Last 1 Hour Average)</h3>
      <canvas id="cpuChart" width="400" height="200"></canvas>
      <canvas id="memChart" width="400" height="200"></canvas>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        const cpuData = {
          labels: ['Production', 'Staging'],
          datasets: [{
            label: 'CPU Time (%)',
            data: [${cpuProd}, ${cpuStaging}],
            backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
          }]
        };
        const memData = {
          labels: ['Production', 'Staging'],
          datasets: [{
            label: 'Memory (%)',
            data: [${memProd}, ${memStaging}],
            backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
            borderWidth: 1
          }]
        };
        new Chart(document.getElementById('cpuChart'), {
          type: 'bar',
          data: cpuData,
          options: { scales: { y: { beginAtZero: true } } }
        });
        new Chart(document.getElementById('memChart'), {
          type: 'bar',
          data: memData,
          options: { scales: { y: { beginAtZero: true } } }
        });
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});