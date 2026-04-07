import { useState, useRef } from 'react';
import { generateRows, generateUpdateSequence, formatVolume, formatPrice, formatChange, formatPercent } from './data.js';
import Row from './components/Row.jsx';

const allRows = generateRows(1000);
const swapRows = generateRows(1000, 999);
const updateSequence = generateUpdateSequence(1000, 50, 100);

function App() {
  const [rows, setRows] = useState([]);
  const [lastResult, setLastResult] = useState('');
  const intervalRef = useRef(null);

  function measureEnd(name) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        performance.mark(name + '-end');
        const measure = performance.measure(name, name + '-start', name + '-end');
        setLastResult(`${name}: ${measure.duration.toFixed(2)}ms`);
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
      });
    });
  }

  const handleMount = () => {
    if (rows.length > 0) {
      setRows([]);
    } else {
      performance.mark('mount-start');
      setRows(allRows);
      measureEnd('mount');
    }
  };

  const handleSort = () => {
    performance.mark('sort-start');
    setRows([...rows].sort((a, b) => b.price - a.price));
    measureEnd('sort');
  };

  const handleFrequentUpdates = () => {
    performance.mark('updates-start');
    let tick = 0;
    const id = setInterval(() => {
      setRows(prev => {
        const next = [...prev];
        const updates = updateSequence[tick];
        for (const u of updates) {
          next[u.rowIndex] = {
            ...next[u.rowIndex],
            price: u.newPrice,
            change: u.newChange,
            changePercent: u.newChangePercent,
          };
        }
        return next;
      });
      tick++;
      if (tick >= 100) {
        clearInterval(id);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            performance.mark('updates-end');
            const measure = performance.measure('updates', 'updates-start', 'updates-end');
            setLastResult(`updates: ${measure.duration.toFixed(2)}ms`);
            console.log(`updates: ${measure.duration.toFixed(2)}ms`);
          });
        });
      }
    }, 100);
    intervalRef.current = id;
  };

  const handleSwap = () => {
    performance.mark('swap-start');
    setRows(swapRows);
    measureEnd('swap');
  };

  const handlePartialUpdate = () => {
    performance.mark('partial-start');
    setRows(rows.map((row, i) =>
      i % 10 === 0 ? { ...row, highlighted: !row.highlighted } : row
    ));
    measureEnd('partial');
  };

  return (
    <div className="app">
      <h1 className="app-title">React Energy Benchmark</h1>
      <div className="control-panel">
        <button className="primary" onClick={handleMount}>
          {rows.length > 0 ? 'Clear' : 'Mount 1,000 Rows'}
        </button>
        <button onClick={handleSort} disabled={rows.length === 0}>Sort by Price</button>
        <button onClick={handleFrequentUpdates} disabled={rows.length === 0}>Frequent Updates (10s)</button>
        <button onClick={handleSwap} disabled={rows.length === 0}>Swap All Rows</button>
        <button onClick={handlePartialUpdate} disabled={rows.length === 0}>Partial Update</button>
      </div>
      {lastResult && <div className="results">Last: {lastResult}</div>}
      <div className="row-count">{rows.length} rows rendered</div>
      <div className="data-grid-container">
        <table className="data-grid">
          <thead>
            <tr>
              <th>ID</th><th>Ticker</th><th>Company</th><th>Price</th>
              <th>Change</th><th>Change %</th><th>Volume</th><th>Sector</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => <Row key={row.id} row={row} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
