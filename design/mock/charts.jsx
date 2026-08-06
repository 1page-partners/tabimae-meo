/* SVG charts — line chart for MEO score trend */

const LineChart = ({ data }) => {
  const W = 640, H = 220;
  const padL = 36, padR = 16, padT = 18, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const yMin = 50, yMax = 90;
  const x = (i) => padL + (innerW * i) / (data.length - 1);
  const y = (v) => padT + innerH * (1 - (v - yMin) / (yMax - yMin));

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.score).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const gridVals = [50, 60, 70, 80, 90];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C5F84" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2C5F84" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)} stroke="#EFE9DE" strokeWidth="1" />
          <text x={padL - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10.5" fill="#A89F92">{v}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#2C5F84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.score)} r="4" fill="#fff" stroke="#2C5F84" strokeWidth="2.5" />
          <text x={x(i)} y={y(d.score) - 12} textAnchor="middle" fontSize="11" fontWeight="600" fill="#2A2521">{d.score}</text>
          <text x={x(i)} y={H - 9} textAnchor="middle" fontSize="11" fill="#7A736A">{d.month}</text>
        </g>
      ))}
    </svg>
  );
};

Object.assign(window, { LineChart });
