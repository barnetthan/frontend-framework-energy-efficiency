import { Component, input } from '@angular/core';
import { StockRow, formatPrice, formatChange, formatPercent, formatVolume } from '../data';

@Component({
  selector: '[app-row]',
  standalone: true,
  template: `
    <td>{{ row().id }}</td>
    <td>{{ row().ticker }}</td>
    <td>{{ row().company }}</td>
    <td [class]="row().change >= 0 ? 'positive' : 'negative'">{{ formatPrice(row().price) }}</td>
    <td [class]="row().change >= 0 ? 'positive' : 'negative'">{{ formatChange(row().change) }}</td>
    <td [class]="row().change >= 0 ? 'positive' : 'negative'">{{ formatPercent(row().changePercent) }}</td>
    <td>{{ formatVolume(row().volume) }}</td>
    <td><span [class]="'sector-badge sector-' + row().sector">{{ row().sector }}</span></td>
  `,
})
export class RowComponent {
  row = input.required<StockRow>();
  formatPrice = formatPrice;
  formatChange = formatChange;
  formatPercent = formatPercent;
  formatVolume = formatVolume;
}
