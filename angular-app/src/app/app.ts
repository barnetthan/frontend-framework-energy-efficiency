import { Component, signal } from '@angular/core';
import { RowComponent } from './row/row';
import { generateRows, generateUpdateSequence, StockRow } from './data';

// Update constants for 10,000 rows
const ROW_COUNT = 10000;
const allRows = generateRows(ROW_COUNT);
const swapRows = generateRows(ROW_COUNT, ROW_COUNT - 1);

// Update 500 rows per tick (5% of the data) over 100 ticks
const updateSequence = generateUpdateSequence(ROW_COUNT, 500, 100);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RowComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  rows = signal<StockRow[]>([]);
  lastResult = signal<string>('');

  private measureEnd(name: string) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark(name + '-end');
        const m = performance.measure(name, name + '-start', name + '-end');
        this.lastResult.set(`${name}: ${m.duration.toFixed(2)}ms`);
        console.log(`${name}: ${m.duration.toFixed(2)}ms`);
      });
    });
  }

  handleMount() {
    if (this.rows().length > 0) {
      this.rows.set([]);
      return;
    }
    performance.mark('mount-start');
    this.rows.set(allRows);
    this.measureEnd('mount');
  }

  handleSort() {
    performance.mark('sort-start');
    this.rows.set([...this.rows()].sort((a, b) => b.price - a.price));
    this.measureEnd('sort');
  }

  handleFrequentUpdates() {
    performance.mark('updates-start');
    let tick = 0;
    const id = setInterval(() => {
      const current = [...this.rows()];
      const updates = updateSequence[tick];
      for (const u of updates) {
        current[u.rowIndex] = {
          ...current[u.rowIndex],
          price: u.newPrice,
          change: u.newChange,
          changePercent: u.newChangePercent,
        };
      }
      this.rows.set(current);
      tick++;
      if (tick >= 100) {
        clearInterval(id);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            performance.mark('updates-end');
            const m = performance.measure('updates', 'updates-start', 'updates-end');
            this.lastResult.set(`updates: ${m.duration.toFixed(2)}ms`);
            console.log(`updates: ${m.duration.toFixed(2)}ms`);
          });
        });
      }
    }, 100);
  }

  handleSwap() {
    performance.mark('swap-start');
    this.rows.set(swapRows);
    this.measureEnd('swap');
  }

  handlePartialUpdate() {
    performance.mark('partial-start');
    this.rows.set(this.rows().map((row, i) =>
      i % 10 === 0 ? { ...row, highlighted: !row.highlighted } : row
    ));
    this.measureEnd('partial');
  }
}
