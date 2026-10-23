let consumptionChart = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();

  const refreshBtn = document.getElementById('refreshForecastBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Training & Forecasting...';
      try {
        await API.generatePrediction('next_billing_period');
        await loadDashboardData();
      } catch (err) {
        alert('Forecast error: ' + err.message);
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '⚡ Run ML Forecast';
      }
    });
  }
});

async function loadDashboardData() {
  try {
    const user = API.getUser();
    if (user) {
      document.getElementById('welcomeUser').textContent = `Welcome, ${user.fullName}`;
    }

    // 1. Fetch Location info
    const locRes = await API.getMyLocations();
    const primaryLoc = locRes.locations && locRes.locations[0];
    if (primaryLoc) {
      document.getElementById('serviceLocationDesc').textContent = 
        `Service Location: ${primaryLoc.cityOrTown}, ${primaryLoc.district} (PIN ${primaryLoc.pincode}) | Category: ${primaryLoc.tariffCategory.toUpperCase()}`;
    }

    // 2. Fetch Readings
    const readingsRes = await API.getReadings({ limit: 30 });
    const readings = readingsRes.readings || [];
    const totalActualKwh = readingsRes.summary ? readingsRes.summary.totalConsumptionKwh : 0;

    document.getElementById('actualKwhDisplay').innerHTML = `${totalActualKwh.toFixed(1)} <span style="font-size:1.1rem; font-weight:500;">kWh</span>`;

    // 3. Fetch or Trigger Forecast
    let predRes = await API.getLatestPrediction();
    let prediction = predRes.prediction;

    if (!prediction) {
      // If none generated yet, request one
      const genRes = await API.generatePrediction('next_billing_period');
      prediction = genRes.prediction;
    }

    if (prediction) {
      document.getElementById('predictedKwhDisplay').innerHTML = `${prediction.predictedKwh.toFixed(1)} <span style="font-size:1.1rem; font-weight:500;">kWh</span>`;
      document.getElementById('modelTypeSub').textContent = `Model: ${prediction.modelVersion || 'XGBoost Regressor'}`;

      // Usage Pattern Badge
      const patternBadge = document.getElementById('patternBadge');
      const pat = (prediction.usagePattern || 'stable').toLowerCase();
      patternBadge.textContent = pat.toUpperCase();
      patternBadge.className = 'badge ' + (
        pat === 'stable' ? 'badge-success' :
        pat === 'increasing' ? 'badge-warning' :
        pat === 'seasonal' ? 'badge-info' : 'badge-danger'
      );
      document.getElementById('patternSub').textContent = `Pattern: ${pat.replace('_', ' ')}`;

      // Anomaly Detection banner
      const anomalyBanner = document.getElementById('anomalyBanner');
      if (prediction.anomalyDetected) {
        anomalyBanner.style.display = 'flex';
        document.getElementById('anomalyBannerText').textContent = prediction.anomalyReason || 'Abnormal spike detected in recent telemetry.';
      } else {
        anomalyBanner.style.display = 'none';
      }
    }

    // 4. Calculate Current Estimated Bill
    const billRes = await API.calculateEstimate({
      unitsKwh: totalActualKwh,
      tariffCategory: primaryLoc ? primaryLoc.tariffCategory : 'domestic',
      saveRecord: false
    });

    if (billRes.estimate) {
      const b = billRes.estimate;
      document.getElementById('estimatedCostDisplay').textContent = `₹ ${b.estimatedAmount.toFixed(2)}`;
      document.getElementById('tariffVersionSub').textContent = `Tariff: ${b.tariffVersion}`;

      document.getElementById('billUnits').textContent = `${b.totalUnitsKwh} kWh`;
      document.getElementById('billGross').textContent = `₹ ${b.grossEnergyCharge.toFixed(2)}`;
      document.getElementById('billSubsidy').textContent = `- ₹ ${b.subsidyAmount.toFixed(2)}`;
      document.getElementById('billFixed').textContent = `+ ₹ ${b.fixedCharge.toFixed(2)}`;
      document.getElementById('billTax').textContent = `+ ₹ ${b.taxAmount.toFixed(2)}`;
      document.getElementById('billTotal').textContent = `₹ ${b.estimatedAmount.toFixed(2)}`;
    }

    // 5. Render Recent Readings Table
    renderRecentReadings(readings);

    // 6. Render Chart (Historical + XGBoost Forecast)
    renderChart(readings, prediction ? prediction.dailyForecasts : []);

  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function renderRecentReadings(readings) {
  const tbody = document.querySelector('#recentReadingsTable tbody');
  if (!readings || readings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">No meter readings recorded yet. <a href="readings.html" style="color:var(--primary); font-weight:600;">Add your first reading</a></td></tr>`;
    return;
  }

  tbody.innerHTML = readings.slice(0, 7).map(r => {
    const d = new Date(r.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const sourceClass = r.readingSource === 'smart_meter' ? 'badge-success' : r.readingSource === 'simulation' ? 'badge-warning' : 'badge-info';
    return `
      <tr>
        <td>${d}</td>
        <td><strong>${Number(r.consumptionKwh).toFixed(2)} kWh</strong></td>
        <td><span class="badge ${sourceClass}">${r.readingSource.replace('_', ' ')}</span></td>
        <td><span class="badge ${r.qualityStatus === 'valid' ? 'badge-success' : 'badge-danger'}">${r.qualityStatus}</span></td>
        <td style="color:var(--text-muted); font-size:0.85rem;">${escapeHtml(r.notes || '-')}</td>
      </tr>
    `;
  }).join('');
}

function renderChart(readings, dailyForecasts = []) {
  const ctx = document.getElementById('consumptionChart').getContext('2d');

  // Chronologically sort recent historical readings (up to 7 days)
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-7);

  const histLabels = sorted.map(r => new Date(r.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const histValues = sorted.map(r => r.consumptionKwh);

  const forecastLabels = (dailyForecasts || []).map(f => new Date(f.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  const forecastValues = (dailyForecasts || []).map(f => f.predictedKwh);

  // Combine timeline
  const combinedLabels = [...histLabels, ...forecastLabels];
  const actualSeries = [...histValues, ...new Array(forecastValues.length).fill(null)];
  const forecastSeries = [...new Array(histValues.length).fill(null), ...forecastValues];

  if (consumptionChart) {
    consumptionChart.destroy();
  }

  consumptionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: combinedLabels.length > 0 ? combinedLabels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Actual Consumption (kWh)',
          data: actualSeries.length > 0 ? actualSeries : [5.2, 6.1, 4.8, 5.9, 7.2, 8.1, 6.5],
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 5
        },
        {
          label: 'XGBoost ML Forecast (kWh)',
          data: forecastSeries,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          pointRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { weight: 600 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} kWh`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Energy (kWh)' }
        }
      }
    }
  });
}
