<script setup>
import { ref, shallowRef } from 'vue';
import { generateRows, generateUpdateSequence } from './data.js';
import Row from './components/Row.vue';

// Pre-generate data at module level
const allRows = generateRows(1000);
const swapRows = generateRows(1000, 999);
const updateSequence = generateUpdateSequence(1000, 50, 100);

const rows = shallowRef([]);
const lastResult = ref('');

function measureEnd(name) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      performance.mark(name + '-end');
      const m = performance.measure(name, name + '-start', name + '-end');
      lastResult.value = `${name}: ${m.duration.toFixed(2)}ms`;
      console.log(`${name}: ${m.duration.toFixed(2)}ms`);
    });
  });
}

function handleMount() {
  if (rows.value.length > 0) {
    rows.value = [];
    return;
  }
  performance.mark('mount-start');
  rows.value = allRows;
  measureEnd('mount');
}

function handleSort() {
  performance.mark('sort-start');
  rows.value = [...rows.value].sort((a, b) => b.price - a.price);
  measureEnd('sort');
}

function handleFrequentUpdates() {
  performance.mark('updates-start');
  let tick = 0;
  const id = setInterval(() => {
    const current = [...rows.value];
    const updates = updateSequence[tick];
    for (const u of updates) {
      current[u.rowIndex] = {
        ...current[u.rowIndex],
        price: u.newPrice,
        change: u.newChange,
        changePercent: u.newChangePercent,
      };
    }
    rows.value = current;
    tick++;
    if (tick >= 100) {
      clearInterval(id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performance.mark('updates-end');
          const m = performance.measure('updates', 'updates-start', 'updates-end');
          lastResult.value = `updates: ${m.duration.toFixed(2)}ms`;
          console.log(`updates: ${m.duration.toFixed(2)}ms`);
        });
      });
    }
  }, 100);
}

function handleSwap() {
  performance.mark('swap-start');
  rows.value = swapRows;
  measureEnd('swap');
}

function handlePartialUpdate() {
  performance.mark('partial-start');
  rows.value = rows.value.map((row, i) =>
    i % 10 === 0 ? { ...row, highlighted: !row.highlighted } : row
  );
  measureEnd('partial');
}
</script>

<template>
  <div class="app">
    <h1 class="app-title">Vue Energy Benchmark</h1>
    <div class="control-panel">
      <button class="primary" @click="handleMount">
        {{ rows.length > 0 ? 'Clear' : 'Mount 1,000 Rows' }}
      </button>
      <button @click="handleSort" :disabled="rows.length === 0">Sort by Price</button>
      <button @click="handleFrequentUpdates" :disabled="rows.length === 0">Frequent Updates (10s)</button>
      <button @click="handleSwap" :disabled="rows.length === 0">Swap All Rows</button>
      <button @click="handlePartialUpdate" :disabled="rows.length === 0">Partial Update</button>
    </div>
    <div v-if="lastResult" class="results">Last: {{ lastResult }}</div>
    <div class="row-count">{{ rows.length }} rows rendered</div>
    <div class="data-grid-container">
      <table class="data-grid">
        <thead>
          <tr>
            <th>ID</th><th>Ticker</th><th>Company</th><th>Price</th>
            <th>Change</th><th>Change %</th><th>Volume</th><th>Sector</th>
          </tr>
        </thead>
        <tbody>
          <Row v-for="row in rows" :key="row.id" :row="row" />
        </tbody>
      </table>
    </div>
  </div>
</template>
