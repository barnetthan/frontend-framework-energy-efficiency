<script setup>
import { formatPrice, formatChange, formatPercent, formatVolume } from '../data.js';

const props = defineProps({
  row: Object,
});
</script>

<template>
  <tr :class="{ highlighted: row.highlighted }">
    <td>{{ row.id }}</td>
    <td>{{ row.ticker }}</td>
    <td>{{ row.company }}</td>
    <td :class="row.change >= 0 ? 'positive' : 'negative'">{{ formatPrice(row.price) }}</td>
    <td :class="row.change >= 0 ? 'positive' : 'negative'">{{ formatChange(row.change) }}</td>
    <td :class="row.change >= 0 ? 'positive' : 'negative'">{{ formatPercent(row.changePercent) }}</td>
    <td>{{ formatVolume(row.volume) }}</td>
    <td><span :class="'sector-badge sector-' + row.sector">{{ row.sector }}</span></td>
  </tr>
</template>
