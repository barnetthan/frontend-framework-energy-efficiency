import {
  generateRows,
  generateUpdateSequence,
  formatPrice,
  formatChange,
  formatPercent,
  formatVolume,
} from './data.js';

// Update constants for 10,000 rows
const ROW_COUNT = 10000;
const allRows = generateRows(ROW_COUNT);
const swapRows = generateRows(ROW_COUNT, ROW_COUNT - 1);

// Update 500 rows per tick (5% of the data) over 100 ticks
const updateSequence = generateUpdateSequence(ROW_COUNT, 500, 100);

let rows = [];

const tbody = document.getElementById('tbody');
const rowCountEl = document.getElementById('row-count');
const resultsEl = document.getElementById('results');
const btnMount = document.getElementById('btn-mount');
const btnSort = document.getElementById('btn-sort');
const btnUpdates = document.getElementById('btn-updates');
const btnSwap = document.getElementById('btn-swap');
const btnPartial = document.getElementById('btn-partial');

function setDisabled(disabled) {
  btnSort.disabled = disabled;
  btnUpdates.disabled = disabled;
  btnSwap.disabled = disabled;
  btnPartial.disabled = disabled;
}

function showResult(text) {
  resultsEl.style.display = '';
  resultsEl.textContent = 'Last: ' + text;
}

function measureEnd(name) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      performance.mark(name + '-end');
      const m = performance.measure(name, name + '-start', name + '-end');
      showResult(`${name}: ${m.duration.toFixed(2)}ms`);
      console.log(`${name}: ${m.duration.toFixed(2)}ms`);
    });
  });
}

function createRowEl(row) {
  const tr = document.createElement('tr');
  if (row.highlighted) tr.className = 'highlighted';

  const changeClass = row.change >= 0 ? 'positive' : 'negative';

  tr.innerHTML =
    `<td>${row.id}</td>` +
    `<td>${row.ticker}</td>` +
    `<td>${row.company}</td>` +
    `<td class="${changeClass}">${formatPrice(row.price)}</td>` +
    `<td class="${changeClass}">${formatChange(row.change)}</td>` +
    `<td class="${changeClass}">${formatPercent(row.changePercent)}</td>` +
    `<td>${formatVolume(row.volume)}</td>` +
    `<td><span class="sector-badge sector-${row.sector}">${row.sector}</span></td>`;

  return tr;
}

function renderAll() {
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const row of rows) {
    fragment.appendChild(createRowEl(row));
  }
  tbody.appendChild(fragment);
  rowCountEl.textContent = rows.length + ' rows rendered';
  setDisabled(rows.length === 0);
  btnMount.textContent = rows.length > 0 ? 'Clear' : 'Mount 10,000 Rows';
}

function updateRowEl(tr, row) {
  const changeClass = row.change >= 0 ? 'positive' : 'negative';
  tr.className = row.highlighted ? 'highlighted' : '';
  const tds = tr.children;
  tds[3].className = changeClass;
  tds[3].textContent = formatPrice(row.price);
  tds[4].className = changeClass;
  tds[4].textContent = formatChange(row.change);
  tds[5].className = changeClass;
  tds[5].textContent = formatPercent(row.changePercent);
}

// Mount / Clear
btnMount.addEventListener('click', () => {
  if (rows.length > 0) {
    rows = [];
    renderAll();
    return;
  }
  performance.mark('mount-start');
  rows = allRows;
  renderAll();
  measureEnd('mount');
});

// Sort
btnSort.addEventListener('click', () => {
  performance.mark('sort-start');
  rows = [...rows].sort((a, b) => b.price - a.price);
  renderAll();
  measureEnd('sort');
});

// Frequent Updates
btnUpdates.addEventListener('click', () => {
  performance.mark('updates-start');
  let tick = 0;
  const id = setInterval(() => {
    const updates = updateSequence[tick];
    const trs = tbody.children;
    for (const u of updates) {
      rows[u.rowIndex] = {
        ...rows[u.rowIndex],
        price: u.newPrice,
        change: u.newChange,
        changePercent: u.newChangePercent,
      };
      updateRowEl(trs[u.rowIndex], rows[u.rowIndex]);
    }
    tick++;
    if (tick >= 100) {
      clearInterval(id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('updates-end');
          const m = performance.measure('updates', 'updates-start', 'updates-end');
          showResult(`updates: ${m.duration.toFixed(2)}ms`);
          console.log(`updates: ${m.duration.toFixed(2)}ms`);
        });
      });
    }
  }, 100);
});

// Swap
btnSwap.addEventListener('click', () => {
  performance.mark('swap-start');
  rows = swapRows;
  renderAll();
  measureEnd('swap');
});

// Partial Update
btnPartial.addEventListener('click', () => {
  performance.mark('partial-start');
  const trs = tbody.children;
  for (let i = 0; i < rows.length; i += 10) {
    rows[i] = { ...rows[i], highlighted: !rows[i].highlighted };
    trs[i].className = rows[i].highlighted ? 'highlighted' : '';
  }
  measureEnd('partial');
});
