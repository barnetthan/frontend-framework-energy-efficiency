import { formatPrice, formatChange, formatPercent, formatVolume } from '../data.js';

function Row({ row }) {
  const changeClass = row.change >= 0 ? 'positive' : 'negative';
  return (
    <tr className={row.highlighted ? 'highlighted' : ''}>
      <td>{row.id}</td>
      <td>{row.ticker}</td>
      <td>{row.company}</td>
      <td className={changeClass}>{formatPrice(row.price)}</td>
      <td className={changeClass}>{formatChange(row.change)}</td>
      <td className={changeClass}>{formatPercent(row.changePercent)}</td>
      <td>{formatVolume(row.volume)}</td>
      <td><span className={`sector-badge sector-${row.sector}`}>{row.sector}</span></td>
    </tr>
  );
}

export default Row;
