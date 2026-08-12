// =============================================================================
// Badge SVG Generator
// =============================================================================
// Generates themed SVG badge images for all 50 lifetime achievements.
// Each badge features a unique illustration that matches the achievement's theme.
//
// Usage: npx tsx scripts/generate-badge-svgs.ts
// =============================================================================

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = join(__dirname, '..', 'public', 'badges');
mkdirSync(OUTPUT_DIR, { recursive: true });

// Helper to wrap an illustration inside a circular badge frame
function createBadge(
  filename: string,
  backgroundGradientStart: string,
  backgroundGradientEnd: string,
  borderColour: string,
  illustration: string,
  label: string
): void {
  const slug = filename.replace(/\.svg$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="bg-${slug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${backgroundGradientStart};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${backgroundGradientEnd};stop-opacity:1"/>
    </linearGradient>
    <clipPath id="circle-clip-${slug}">
      <circle cx="100" cy="100" r="90"/>
    </clipPath>
  </defs>
  <!-- Outer ring -->
  <circle cx="100" cy="100" r="95" fill="${borderColour}" opacity="0.3"/>
  <circle cx="100" cy="100" r="90" fill="url(#bg-${slug})"/>
  <!-- Inner border -->
  <circle cx="100" cy="100" r="90" fill="none" stroke="${borderColour}" stroke-width="4"/>
  <!-- Illustration -->
  <g clip-path="url(#circle-clip-${slug})">
    ${illustration}
  </g>
  <!-- Label banner -->
  <rect x="20" y="160" width="160" height="28" rx="14" fill="${borderColour}" opacity="0.85"/>
  <text x="100" y="179" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="white">${label}</text>
</svg>`;

  writeFileSync(join(OUTPUT_DIR, filename), svg + '\n', 'utf-8');
  console.log(`  ✓ ${filename}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISTANCE BADGES — Trails, paths, and journey illustrations
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Distance Badges ──');

// Parkrun Pioneer: A winding park path with trees
createBadge(
  'lifetime-distance-parkrun.svg',
  '#e8f5e9',
  '#a5d6a7',
  '#388e3c',
  `<path d="M30 140 Q60 120 80 130 Q100 140 120 125 Q140 110 170 120" fill="none" stroke="#4caf50" stroke-width="4" stroke-linecap="round"/>
   <circle cx="50" cy="105" r="12" fill="#66bb6a"/>
   <rect x="48" y="115" width="4" height="15" fill="#795548"/>
   <circle cx="90" cy="95" r="15" fill="#43a047"/>
   <rect x="88" y="108" width="4" height="18" fill="#795548"/>
   <circle cx="140" cy="100" r="10" fill="#66bb6a"/>
   <rect x="138" y="108" width="4" height="12" fill="#795548"/>
   <path d="M60 70 L65 55 L70 70" fill="#81c784" stroke="none"/>
   <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#2e7d32">5km</text>`,
  'PARKRUN PIONEER'
);

// Royal Parks Rambler: London park gate with trees and a path
createBadge(
  'lifetime-distance-royal-parks.svg',
  '#f3e5f5',
  '#ce93d8',
  '#7b1fa2',
  `<rect x="75" y="55" width="50" height="70" fill="none" stroke="#4a148c" stroke-width="3" rx="2"/>
   <path d="M75 55 Q100 40 125 55" fill="none" stroke="#4a148c" stroke-width="3"/>
   <rect x="85" y="70" width="12" height="40" fill="#e1bee7" stroke="#7b1fa2" stroke-width="1"/>
   <rect x="103" y="70" width="12" height="40" fill="#e1bee7" stroke="#7b1fa2" stroke-width="1"/>
   <circle cx="50" cy="80" r="15" fill="#66bb6a"/>
   <rect x="48" y="93" width="4" height="18" fill="#795548"/>
   <circle cx="150" cy="80" r="15" fill="#66bb6a"/>
   <rect x="148" y="93" width="4" height="18" fill="#795548"/>
   <path d="M70 140 Q100 130 130 140" fill="none" stroke="#8d6e63" stroke-width="3" stroke-dasharray="6,4"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="11" fill="#4a148c">10km</text>`,
  'ROYAL PARKS RAMBLER'
);

// Half Marathon Hero: A road with distance markers and a finish ribbon
createBadge(
  'lifetime-distance-half-marathon.svg',
  '#fff3e0',
  '#ffcc80',
  '#e65100',
  `<path d="M40 150 L60 90 L100 70 L140 90 L160 150" fill="none" stroke="#bf360c" stroke-width="3"/>
   <rect x="80" y="60" width="40" height="5" fill="#ff5722" rx="2"/>
   <text x="100" y="55" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#bf360c">FINISH</text>
   <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="#e65100">21.1</text>
   <text x="100" y="118" text-anchor="middle" font-family="Arial" font-size="11" fill="#bf360c">kilometres</text>
   <circle cx="60" cy="90" r="4" fill="#ff8a65"/>
   <circle cx="140" cy="90" r="4" fill="#ff8a65"/>`,
  'HALF MARATHON HERO'
);

// Marathon Legend: A gold medal with 42.2 engraved
createBadge(
  'lifetime-distance-marathon.svg',
  '#fffde7',
  '#fff59d',
  '#f9a825',
  `<circle cx="100" cy="95" r="35" fill="#fdd835" stroke="#f9a825" stroke-width="3"/>
   <circle cx="100" cy="95" r="28" fill="none" stroke="#f57f17" stroke-width="2"/>
   <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#e65100">42.2</text>
   <text x="100" y="115" text-anchor="middle" font-family="Arial" font-size="8" fill="#bf360c">KILOMETRES</text>
   <path d="M85 55 L100 60 L115 55" fill="none" stroke="#f9a825" stroke-width="3"/>
   <path d="M80 50 L85 55 M120 50 L115 55" stroke="#f9a825" stroke-width="2" fill="none"/>`,
  'MARATHON LEGEND'
);

// Century Strider: Footprints forming "100"
createBadge(
  'lifetime-distance-century.svg',
  '#e3f2fd',
  '#90caf9',
  '#1565c0',
  `<text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="40" font-weight="bold" fill="#1565c0">100</text>
   <text x="100" y="125" text-anchor="middle" font-family="Arial" font-size="10" fill="#1976d2">kilometres</text>
   <ellipse cx="55" cy="135" rx="5" ry="8" fill="#42a5f5" transform="rotate(-15 55 135)"/>
   <ellipse cx="70" cy="130" rx="5" ry="8" fill="#42a5f5" transform="rotate(-10 70 130)"/>
   <ellipse cx="130" cy="130" rx="5" ry="8" fill="#42a5f5" transform="rotate(10 130 130)"/>
   <ellipse cx="145" cy="135" rx="5" ry="8" fill="#42a5f5" transform="rotate(15 145 135)"/>`,
  'CENTURY STRIDER'
);

// Thames Path Wanderer: River winding through with bridge
createBadge(
  'lifetime-distance-thames-path.svg',
  '#e0f7fa',
  '#80deea',
  '#00838f',
  `<path d="M20 100 Q50 80 80 100 Q110 120 140 100 Q170 80 180 90" fill="none" stroke="#0097a7" stroke-width="6" opacity="0.6"/>
   <path d="M20 110 Q50 90 80 110 Q110 130 140 110 Q170 90 180 100" fill="none" stroke="#00acc1" stroke-width="4" opacity="0.4"/>
   <rect x="85" y="75" width="30" height="3" fill="#5d4037" rx="1"/>
   <path d="M85 78 L85 95 M115 78 L115 95" stroke="#5d4037" stroke-width="2"/>
   <path d="M85 75 Q100 65 115 75" fill="none" stroke="#5d4037" stroke-width="2"/>
   <text x="100" y="60" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#004d40">135km</text>`,
  'THAMES PATH WANDERER'
);

// Camino Portugués: Scallop shell (pilgrimage symbol) with path
createBadge(
  'lifetime-distance-camino-portugues.svg',
  '#fff8e1',
  '#ffe082',
  '#ff8f00',
  `<path d="M100 65 L80 120 M100 65 L90 120 M100 65 L100 125 M100 65 L110 120 M100 65 L120 120" stroke="#ffa000" stroke-width="2" fill="none"/>
   <path d="M75 120 Q100 135 125 120" fill="none" stroke="#ff8f00" stroke-width="3"/>
   <path d="M75 120 Q100 130 125 120" fill="#ffecb3" stroke="none"/>
   <circle cx="100" cy="65" r="5" fill="#ff8f00"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#e65100">250km</text>`,
  'CAMINO PORTUGUÉS'
);

// Pennine Way Pathfinder: Rolling hills with a trail marker post
createBadge(
  'lifetime-distance-pennine-way.svg',
  '#e8f5e9',
  '#c8e6c9',
  '#2e7d32',
  `<path d="M20 130 Q50 100 80 115 Q110 130 140 105 Q160 90 180 100" fill="#a5d6a7" stroke="none"/>
   <path d="M20 140 Q60 115 100 125 Q140 135 180 115" fill="#81c784" stroke="none"/>
   <rect x="95" y="70" width="4" height="40" fill="#5d4037"/>
   <rect x="87" y="65" width="20" height="14" fill="#ffeb3b" stroke="#f9a825" stroke-width="1" rx="2"/>
   <path d="M99 72 L107 72" stroke="#2e7d32" stroke-width="2"/>
   <text x="100" y="55" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#1b5e20">431km</text>`,
  'PENNINE WAY PATHFINDER'
);

// South West Coast Path Explorer: Coastal cliffs with waves
createBadge(
  'lifetime-distance-south-west-coast.svg',
  '#e1f5fe',
  '#81d4fa',
  '#01579b',
  `<path d="M20 110 L50 80 L70 90 L100 70 L130 85 L150 75 L180 90" fill="#8d6e63" stroke="#5d4037" stroke-width="2"/>
   <path d="M20 120 Q50 115 80 120 Q110 125 140 118 Q160 113 180 120 L180 160 L20 160 Z" fill="#1976d2" opacity="0.6"/>
   <path d="M30 125 Q45 120 60 125 Q75 130 90 124" fill="none" stroke="white" stroke-width="1.5" opacity="0.7"/>
   <path d="M110 122 Q125 117 140 122 Q155 127 170 121" fill="none" stroke="white" stroke-width="1.5" opacity="0.7"/>
   <circle cx="140" cy="50" r="12" fill="#ffeb3b" opacity="0.8"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#01579b">630km</text>`,
  'SW COAST PATH'
);

// Camino de Santiago: Cathedral silhouette with star above
createBadge(
  'lifetime-distance-camino-frances.svg',
  '#fce4ec',
  '#f48fb1',
  '#880e4f',
  `<rect x="80" y="85" width="40" height="50" fill="#ad1457" opacity="0.8"/>
   <path d="M80 85 L100 60 L120 85" fill="#c2185b"/>
   <rect x="88" y="70" width="4" height="20" fill="#880e4f"/>
   <rect x="108" y="70" width="4" height="20" fill="#880e4f"/>
   <circle cx="88" cy="67" r="3" fill="#ffd54f"/>
   <circle cx="112" cy="67" r="3" fill="#ffd54f"/>
   <rect x="93" y="105" width="14" height="20" fill="#4e342e" rx="7" ry="0"/>
   <polygon points="100,35 103,44 112,44 105,50 107,59 100,54 93,59 95,50 88,44 97,44" fill="#ffd54f"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#880e4f">780km</text>`,
  'CAMINO DE SANTIAGO'
);

// Thousand Kilometre Trekker: Milestone stone with "1000" carved
createBadge(
  'lifetime-distance-thousand.svg',
  '#f3e5f5',
  '#e1bee7',
  '#6a1b9a',
  `<path d="M70 130 L75 75 Q100 65 125 75 L130 130 Z" fill="#9e9e9e" stroke="#616161" stroke-width="2"/>
   <path d="M75 80 Q100 72 125 80" fill="none" stroke="#757575" stroke-width="1"/>
   <text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#4a148c">1000</text>
   <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="9" fill="#6a1b9a">km</text>
   <path d="M65 130 L135 130" stroke="#795548" stroke-width="3"/>
   <path d="M60 133 Q100 138 140 133" fill="#8d6e63" stroke="none"/>`,
  '1000km TREKKER'
);

// Land's End to John o' Groats: Map outline of Great Britain with route
createBadge(
  'lifetime-distance-lands-end-john-o-groats.svg',
  '#e8eaf6',
  '#c5cae9',
  '#283593',
  `<path d="M95 40 Q92 50 88 55 Q85 60 90 65 Q95 68 93 75 Q90 80 92 85 Q95 88 93 95 Q90 100 93 105 Q97 108 95 115 Q92 120 95 125 Q100 130 98 135 Q95 140 100 145" fill="none" stroke="#3f51b5" stroke-width="8" stroke-linecap="round" opacity="0.3"/>
   <circle cx="98" cy="143" r="5" fill="#f44336"/>
   <circle cx="95" cy="42" r="5" fill="#4caf50"/>
   <path d="M98 143 Q95 120 93 105 Q92 90 95 75 Q93 60 95 42" fill="none" stroke="#ff5722" stroke-width="2" stroke-dasharray="4,3"/>
   <text x="125" cy="143" font-family="Arial" font-size="7" fill="#283593">Land's End</text>
   <text x="110" y="45" font-family="Arial" font-size="7" fill="#283593">John o' Groats</text>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#1a237e">1,407km</text>`,
  "LAND'S END TO JoG"
);

// Great Wall Voyager: The Great Wall stretching into distance
createBadge(
  'lifetime-distance-great-wall.svg',
  '#ffebee',
  '#ffcdd2',
  '#b71c1c',
  `<path d="M25 120 L45 105 L65 110 L85 95 L105 100 L125 85 L145 90 L165 75 L180 80" fill="none" stroke="#795548" stroke-width="6"/>
   <path d="M25 120 L45 105 L65 110 L85 95 L105 100 L125 85 L145 90 L165 75 L180 80" fill="none" stroke="#a1887f" stroke-width="3"/>
   <rect x="43" y="98" width="6" height="10" fill="#6d4c41"/>
   <rect x="83" y="88" width="6" height="10" fill="#6d4c41"/>
   <rect x="123" y="78" width="6" height="10" fill="#6d4c41"/>
   <rect x="163" y="68" width="6" height="10" fill="#6d4c41"/>
   <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#b71c1c">2,000km</text>
   <path d="M50 50 Q55 45 60 50 Q65 45 70 50 Q75 45 80 50" fill="none" stroke="#ef9a9a" stroke-width="1.5"/>`,
  'GREAT WALL VOYAGER'
);

// ═══════════════════════════════════════════════════════════════════════════════
// DURATION BADGES — Clocks, hourglasses, and time-themed illustrations
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Duration Badges ──');

// First Hour on the Belt: A treadmill belt with a clock showing 1 hour
createBadge(
  'lifetime-duration-one-hour.svg',
  '#e8f5e9',
  '#c8e6c9',
  '#2e7d32',
  `<rect x="60" y="100" width="80" height="30" rx="5" fill="#bdbdbd" stroke="#757575" stroke-width="2"/>
   <path d="M65 115 L135 115" stroke="#9e9e9e" stroke-width="1" stroke-dasharray="3,2"/>
   <circle cx="100" cy="72" r="22" fill="white" stroke="#2e7d32" stroke-width="3"/>
   <line x1="100" y1="72" x2="100" y2="58" stroke="#2e7d32" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="100" y1="72" x2="110" y2="72" stroke="#4caf50" stroke-width="2" stroke-linecap="round"/>
   <circle cx="100" cy="72" r="2" fill="#2e7d32"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#1b5e20">1 HOUR</text>`,
  'FIRST HOUR'
);

// Five Hour Milestone: An hourglass with sand flowing
createBadge(
  'lifetime-duration-five-hours.svg',
  '#fff3e0',
  '#ffe0b2',
  '#e65100',
  `<path d="M75 55 L125 55 L105 90 L125 125 L75 125 L95 90 Z" fill="#fff8e1" stroke="#e65100" stroke-width="3"/>
   <path d="M80 58 L120 58 L105 85 Z" fill="#ffb74d" opacity="0.6"/>
   <path d="M95 95 L80 122 L120 122 Z" fill="#ffb74d" opacity="0.8"/>
   <rect x="93" y="87" width="14" height="6" fill="#ff9800" rx="3"/>
   <line x1="75" y1="55" x2="125" y2="55" stroke="#bf360c" stroke-width="3" stroke-linecap="round"/>
   <line x1="75" y1="125" x2="125" y2="125" stroke="#bf360c" stroke-width="3" stroke-linecap="round"/>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#bf360c">5 HOURS</text>`,
  'FIVE HOUR MILESTONE'
);

// Ten Hour Tenacity: A stopwatch showing 10:00
createBadge(
  'lifetime-duration-ten-hours.svg',
  '#e3f2fd',
  '#bbdefb',
  '#0d47a1',
  `<circle cx="100" cy="95" r="35" fill="white" stroke="#1565c0" stroke-width="4"/>
   <circle cx="100" cy="95" r="30" fill="none" stroke="#bbdefb" stroke-width="2"/>
   <rect x="97" y="55" width="6" height="10" rx="3" fill="#1565c0"/>
   <path d="M90 50 L110 50" stroke="#0d47a1" stroke-width="2" stroke-linecap="round"/>
   <text x="100" y="102" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#0d47a1">10:00</text>
   <line x1="100" y1="95" x2="100" y2="70" stroke="#1976d2" stroke-width="2" stroke-linecap="round"/>
   <line x1="100" y1="95" x2="118" y2="95" stroke="#42a5f5" stroke-width="1.5" stroke-linecap="round"/>
   <circle cx="100" cy="95" r="2" fill="#0d47a1"/>`,
  'TEN HOUR TENACITY'
);

// Full Day of Fitness: Sun and moon cycle (24 hours)
createBadge(
  'lifetime-duration-full-day.svg',
  '#fce4ec',
  '#f8bbd0',
  '#880e4f',
  `<circle cx="70" cy="80" r="18" fill="#ffd54f" stroke="#ff8f00" stroke-width="2"/>
   <path d="M52 80 L45 80 M70 62 L70 55 M88 80 L95 80 M58 68 L53 63 M82 68 L87 63" stroke="#ffb300" stroke-width="2" stroke-linecap="round"/>
   <path d="M120 85 A15 15 0 1 1 120 84.99" fill="#b0bec5" stroke="#546e7a" stroke-width="2"/>
   <circle cx="127" cy="79" r="12" fill="#fce4ec"/>
   <text x="100" y="125" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#880e4f">24h</text>
   <path d="M50 110 Q75 105 100 110 Q125 115 150 110" fill="none" stroke="#ad1457" stroke-width="1.5" stroke-dasharray="4,3"/>`,
  'FULL DAY OF FITNESS'
);

// Weekend Warrior: Calendar pages showing Saturday and Sunday
createBadge(
  'lifetime-duration-weekend-warrior.svg',
  '#ede7f6',
  '#d1c4e9',
  '#4527a0',
  `<rect x="55" y="60" width="40" height="45" rx="3" fill="white" stroke="#5e35b1" stroke-width="2"/>
   <rect x="55" y="60" width="40" height="12" rx="3" fill="#7c4dff"/>
   <text x="75" y="90" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#311b92">SAT</text>
   <rect x="105" y="70" width="40" height="45" rx="3" fill="white" stroke="#5e35b1" stroke-width="2"/>
   <rect x="105" y="70" width="40" height="12" rx="3" fill="#7c4dff"/>
   <text x="125" y="100" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#311b92">SUN</text>
   <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#4527a0">48 HOURS</text>`,
  'WEEKEND WARRIOR'
);

// Three Day Dedication: Three tally marks with a ribbon
createBadge(
  'lifetime-duration-three-day-dedication.svg',
  '#e0f2f1',
  '#b2dfdb',
  '#004d40',
  `<rect x="70" y="60" width="8" height="60" rx="3" fill="#00897b"/>
   <rect x="88" y="60" width="8" height="60" rx="3" fill="#00897b"/>
   <rect x="106" y="60" width="8" height="60" rx="3" fill="#00897b"/>
   <path d="M65 130 Q92 140 118 130" fill="none" stroke="#ffd54f" stroke-width="3"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#004d40">72 HOURS</text>
   <circle cx="72" cy="55" r="3" fill="#4db6ac"/>
   <circle cx="92" cy="55" r="3" fill="#4db6ac"/>
   <circle cx="112" cy="55" r="3" fill="#4db6ac"/>`,
  '3 DAY DEDICATION'
);

// Century of Hours: A grand clock face with "100" overlay
createBadge(
  'lifetime-duration-century-hours.svg',
  '#fff8e1',
  '#ffecb3',
  '#ff6f00',
  `<circle cx="100" cy="90" r="38" fill="white" stroke="#ff8f00" stroke-width="4"/>
   <circle cx="100" cy="90" r="33" fill="none" stroke="#ffe082" stroke-width="2"/>
   ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
     .map((angle) => {
       const rad = ((angle - 90) * Math.PI) / 180;
       const x1 = 100 + 28 * Math.cos(rad);
       const y1 = 90 + 28 * Math.sin(rad);
       const x2 = 100 + 33 * Math.cos(rad);
       const y2 = 90 + 33 * Math.sin(rad);
       return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ff8f00" stroke-width="2"/>`;
     })
     .join('\n   ')}
   <text x="100" y="97" text-anchor="middle" font-family="Arial" font-size="22" font-weight="bold" fill="#e65100">100</text>
   <text x="100" y="112" text-anchor="middle" font-family="Arial" font-size="8" fill="#ff6f00">HOURS</text>`,
  'CENTURY OF HOURS'
);

// One Week Wonder: A seven-segment arc (like a week visualised)
createBadge(
  'lifetime-duration-one-week.svg',
  '#e8eaf6',
  '#c5cae9',
  '#1a237e',
  `${[0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const startAngle = ((i * 51.4 - 180) * Math.PI) / 180;
      const endAngle = (((i + 1) * 51.4 - 183) * Math.PI) / 180;
      const x1 = 100 + 40 * Math.cos(startAngle);
      const y1 = 95 + 40 * Math.sin(startAngle);
      const x2 = 100 + 40 * Math.cos(endAngle);
      const y2 = 95 + 40 * Math.sin(endAngle);
      const colours = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'];
      return `<path d="M100 95 L${x1.toFixed(1)} ${y1.toFixed(1)} A40 40 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${colours[i]}" opacity="0.7"/>`;
    })
    .join('\n   ')}
   <circle cx="100" cy="95" r="20" fill="white"/>
   <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#1a237e">168h</text>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="10" fill="#283593">7 DAYS</text>`,
  'ONE WEEK WONDER'
);

// Quarter Thousand Hours: A trophy cup with "250" engraved
createBadge(
  'lifetime-duration-quarter-thousand.svg',
  '#f9fbe7',
  '#f0f4c3',
  '#827717',
  `<path d="M75 70 L80 110 Q100 120 120 110 L125 70 Z" fill="#fdd835" stroke="#f9a825" stroke-width="2"/>
   <path d="M70 70 L65 80 Q65 95 80 95" fill="none" stroke="#f9a825" stroke-width="3"/>
   <path d="M130 70 L135 80 Q135 95 120 95" fill="none" stroke="#f9a825" stroke-width="3"/>
   <rect x="90" y="115" width="20" height="8" fill="#fbc02d"/>
   <rect x="85" y="122" width="30" height="5" fill="#f9a825" rx="2"/>
   <text x="100" y="97" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#5d4037">250</text>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="9" fill="#827717">HOURS</text>`,
  '250 HOURS'
);

// Five Hundred Hour Hero: A star constellation forming a clock
createBadge(
  'lifetime-duration-five-hundred-hours.svg',
  '#263238',
  '#37474f',
  '#00bcd4',
  `<circle cx="100" cy="90" r="40" fill="none" stroke="#00bcd4" stroke-width="2" stroke-dasharray="3,3"/>
   <circle cx="100" cy="55" r="3" fill="#80deea"/>
   <circle cx="130" cy="70" r="2.5" fill="#80deea"/>
   <circle cx="135" cy="95" r="2" fill="#80deea"/>
   <circle cx="120" cy="120" r="3" fill="#80deea"/>
   <circle cx="80" cy="120" r="2" fill="#80deea"/>
   <circle cx="65" cy="95" r="2.5" fill="#80deea"/>
   <circle cx="70" cy="70" r="2" fill="#80deea"/>
   <path d="M100 55 L130 70 L135 95 L120 120 L80 120 L65 95 L70 70 Z" fill="none" stroke="#4dd0e1" stroke-width="1" opacity="0.5"/>
   <text x="100" y="97" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#e0f7fa">500</text>
   <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#4dd0e1">HOURS</text>`,
  '500 HOUR HERO'
);

// Endurance Elite: A diamond/gem shape representing rarity
createBadge(
  'lifetime-duration-endurance-elite.svg',
  '#1a237e',
  '#283593',
  '#7c4dff',
  `<polygon points="100,50 130,80 100,130 70,80" fill="#7c4dff" stroke="#b388ff" stroke-width="2"/>
   <polygon points="100,50 115,80 100,95 85,80" fill="#b388ff" opacity="0.5"/>
   <path d="M70 80 L100 50 L130 80" fill="none" stroke="#d1c4e9" stroke-width="1"/>
   <text x="100" y="108" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">750</text>
   <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="8" fill="#d1c4e9">HOURS</text>
   <polygon points="100,45 103,48 100,50 97,48" fill="#ffd54f"/>`,
  'ENDURANCE ELITE'
);

// Thousand Hour Triumph: A crown atop a grand clock
createBadge(
  'lifetime-duration-thousand-hours.svg',
  '#4a148c',
  '#6a1b9a',
  '#ffd54f',
  `<circle cx="100" cy="100" r="30" fill="white" stroke="#ffd54f" stroke-width="3"/>
   <text x="100" y="107" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#4a148c">1000</text>
   <text x="100" y="119" text-anchor="middle" font-family="Arial" font-size="7" fill="#6a1b9a">HOURS</text>
   <path d="M75 62 L80 50 L90 58 L100 45 L110 58 L120 50 L125 62 Z" fill="#ffd54f" stroke="#ffb300" stroke-width="1.5"/>
   <circle cx="80" cy="48" r="3" fill="#ff6f00"/>
   <circle cx="100" cy="43" r="3" fill="#ff6f00"/>
   <circle cx="120" cy="48" r="3" fill="#ff6f00"/>`,
  '1000 HOUR TRIUMPH'
);

// ═══════════════════════════════════════════════════════════════════════════════
// ELEVATION BADGES — Mountains, towers, and peaks
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Elevation Badges ──');

// Hilltop Hiker: A gentle green hill with a small figure at the top
createBadge(
  'lifetime-elevation-hilltop.svg',
  '#e8f5e9',
  '#c8e6c9',
  '#388e3c',
  `<path d="M20 140 Q60 140 80 115 Q95 95 100 90 Q105 95 120 115 Q140 140 180 140 Z" fill="#66bb6a"/>
   <path d="M20 145 L180 145" stroke="#4caf50" stroke-width="2"/>
   <circle cx="100" cy="78" r="5" fill="#5d4037"/>
   <line x1="100" y1="83" x2="100" y2="97" stroke="#5d4037" stroke-width="2"/>
   <line x1="100" y1="88" x2="93" y2="95" stroke="#5d4037" stroke-width="2"/>
   <line x1="100" y1="88" x2="107" y2="95" stroke="#5d4037" stroke-width="2"/>
   <text x="100" y="60" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#1b5e20">100m</text>`,
  'HILLTOP HIKER'
);

// Eiffel Tower Ascent: Simplified Eiffel Tower silhouette
createBadge(
  'lifetime-elevation-eiffel-tower.svg',
  '#e3f2fd',
  '#bbdefb',
  '#1565c0',
  `<path d="M100 40 L90 80 L85 80 L80 130 L75 130 L72 145 L128 145 L125 130 L120 130 L115 80 L110 80 Z" fill="none" stroke="#37474f" stroke-width="2.5"/>
   <path d="M87 90 L113 90" stroke="#37474f" stroke-width="2"/>
   <path d="M83 110 L117 110" stroke="#37474f" stroke-width="2"/>
   <path d="M78 130 L122 130" stroke="#37474f" stroke-width="1.5"/>
   <rect x="93" y="95" width="14" height="10" fill="none" stroke="#37474f" stroke-width="1.5" rx="5"/>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="#1565c0">330m</text>`,
  'EIFFEL TOWER ASCENT'
);

// CN Tower Climb: CN Tower silhouette
createBadge(
  'lifetime-elevation-cn-tower.svg',
  '#fce4ec',
  '#f8bbd0',
  '#c62828',
  `<rect x="97" y="35" width="6" height="110" fill="#d32f2f"/>
   <ellipse cx="100" cy="95" rx="18" ry="8" fill="#ef5350" stroke="#c62828" stroke-width="1.5"/>
   <ellipse cx="100" cy="92" rx="14" ry="5" fill="#ffcdd2"/>
   <rect x="99" y="30" width="2" height="15" fill="#b71c1c"/>
   <path d="M82 95 L75 100 M118 95 L125 100" stroke="#c62828" stroke-width="1.5"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#b71c1c">553m</text>`,
  'CN TOWER CLIMB'
);

// Burj Khalifa Heights: Tall stepped tower
createBadge(
  'lifetime-elevation-burj-khalifa.svg',
  '#fff8e1',
  '#ffecb3',
  '#ff6f00',
  `<rect x="96" y="30" width="8" height="115" fill="#bdbdbd" stroke="#9e9e9e" stroke-width="1"/>
   <path d="M92 60 L96 60 L96 145 L92 145" fill="#e0e0e0" stroke="#9e9e9e" stroke-width="0.5"/>
   <path d="M104 60 L108 60 L108 145 L104 145" fill="#e0e0e0" stroke="#9e9e9e" stroke-width="0.5"/>
   <path d="M88 80 L92 80 L92 145 L88 145" fill="#eeeeee" stroke="#9e9e9e" stroke-width="0.5"/>
   <path d="M108 80 L112 80 L112 145 L108 145" fill="#eeeeee" stroke="#9e9e9e" stroke-width="0.5"/>
   <rect x="98" y="25" width="4" height="8" fill="#9e9e9e"/>
   <circle cx="100" cy="23" r="2" fill="#ffd54f"/>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#e65100">828m</text>`,
  'BURJ KHALIFA HEIGHTS'
);

// Snowdon Summit: Welsh mountain with flag
createBadge(
  'lifetime-elevation-snowdon.svg',
  '#e8f5e9',
  '#a5d6a7',
  '#1b5e20',
  `<path d="M30 145 L75 75 L100 60 L125 75 L170 145 Z" fill="#4caf50"/>
   <path d="M30 145 L75 75 L100 60" fill="#66bb6a"/>
   <path d="M85 70 L100 60 L100 55" fill="none" stroke="none"/>
   <path d="M95 55 L100 40 L100 60" fill="none" stroke="#d32f2f" stroke-width="2"/>
   <path d="M100 40 L112 47 L100 53" fill="#d32f2f"/>
   <path d="M60 110 Q100 95 140 110" fill="white" opacity="0.3"/>
   <text x="100" y="135" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">1,085m</text>`,
  'SNOWDON SUMMIT'
);

// Ben Nevis Conqueror: Rugged Scottish peak with mist
createBadge(
  'lifetime-elevation-ben-nevis.svg',
  '#eceff1',
  '#cfd8dc',
  '#37474f',
  `<path d="M20 145 L60 95 L85 80 L100 55 L115 80 L140 95 L180 145 Z" fill="#546e7a"/>
   <path d="M20 145 L60 95 L85 80 L100 55" fill="#78909c"/>
   <path d="M90 60 L100 55 L110 60 L105 58 L100 62 L95 58 Z" fill="white"/>
   <path d="M40 120 Q65 115 90 120" fill="white" opacity="0.4"/>
   <path d="M110 110 Q135 105 160 115" fill="white" opacity="0.3"/>
   <text x="100" y="135" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">1,345m</text>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="7" fill="#cfd8dc">Scotland</text>`,
  'BEN NEVIS CONQUEROR'
);

// Mount Kosciuszko: Australian landscape with rounded peak
createBadge(
  'lifetime-elevation-mount-kosciuszko.svg',
  '#fff3e0',
  '#ffe0b2',
  '#e65100',
  `<path d="M20 145 Q50 140 70 120 Q85 100 100 90 Q115 100 130 120 Q150 140 180 145 Z" fill="#ff8a65"/>
   <path d="M20 145 Q50 140 70 120 Q85 100 100 90" fill="#ffab91"/>
   <circle cx="155" cy="55" r="15" fill="#fdd835"/>
   <path d="M35 135 Q55 130 75 135" fill="none" stroke="#a1887f" stroke-width="2"/>
   <path d="M50 145 Q55 142 60 145" fill="#8d6e63"/>
   <text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#bf360c">2,228m</text>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="7" fill="#e65100">Australia</text>`,
  'MT KOSCIUSZKO'
);

// Mount Fuji Ascent: Iconic Fuji shape with snow cap
createBadge(
  'lifetime-elevation-mount-fuji.svg',
  '#e3f2fd',
  '#bbdefb',
  '#1565c0',
  `<path d="M25 145 L80 70 L100 50 L120 70 L175 145 Z" fill="#3949ab"/>
   <path d="M80 70 L100 50 L120 70 Q110 75 100 72 Q90 75 80 70 Z" fill="white"/>
   <circle cx="50" cy="55" r="12" fill="#ef5350" opacity="0.8"/>
   <path d="M60 120 Q80 115 100 120 Q120 125 140 118" fill="none" stroke="white" stroke-width="1" opacity="0.4"/>
   <text x="100" y="135" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">3,776m</text>`,
  'MOUNT FUJI ASCENT'
);

// Matterhorn Mountaineer: Iconic pyramid peak
createBadge(
  'lifetime-elevation-matterhorn.svg',
  '#eceff1',
  '#b0bec5',
  '#263238',
  `<path d="M40 145 L100 45 L160 145 Z" fill="#546e7a"/>
   <path d="M40 145 L100 45 L100 145 Z" fill="#78909c"/>
   <path d="M90 55 L100 45 L110 55 L105 52 L100 58 L95 52 Z" fill="white"/>
   <path d="M85 65 L100 58 L115 65" fill="white" opacity="0.6"/>
   <path d="M60 110 L70 100 L80 105 L90 95" fill="none" stroke="white" stroke-width="1" opacity="0.3"/>
   <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">4,478m</text>
   <text x="100" y="142" text-anchor="middle" font-family="Arial" font-size="7" fill="#cfd8dc">Alps</text>`,
  'MATTERHORN'
);

// Kilimanjaro Climber: Flat-topped mountain with savanna below
createBadge(
  'lifetime-elevation-kilimanjaro.svg',
  '#fff3e0',
  '#ffcc80',
  '#e65100',
  `<path d="M25 140 L55 80 L80 65 L120 65 L145 80 L175 140 Z" fill="#795548"/>
   <path d="M70 70 L80 65 L120 65 L130 70 Q110 60 100 62 Q90 60 70 70 Z" fill="white"/>
   <path d="M20 145 L180 145" stroke="#a1887f" stroke-width="2"/>
   <path d="M30 142 Q35 138 40 142 M60 142 Q65 138 70 142 M130 142 Q135 138 140 142 M155 142 Q160 138 165 142" fill="none" stroke="#8d6e63" stroke-width="1.5"/>
   <text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="white">5,895m</text>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="7" fill="#bf360c">Africa</text>`,
  'KILIMANJARO CLIMBER'
);

// Everest Summiteer: The world's highest peak with prayer flags
createBadge(
  'lifetime-elevation-everest.svg',
  '#1a237e',
  '#283593',
  '#ffd54f',
  `<path d="M30 145 L70 90 L90 75 L100 45 L110 75 L130 90 L170 145 Z" fill="#5c6bc0"/>
   <path d="M30 145 L70 90 L90 75 L100 45" fill="#7986cb"/>
   <path d="M92 50 L100 45 L108 50 L104 48 L100 52 L96 48 Z" fill="white"/>
   <path d="M80 80 L90 75 L100 78 L110 75 L120 80" fill="none" stroke="#e0e0e0" stroke-width="1" opacity="0.5"/>
   <path d="M95 55 L100 45 L105 55" fill="none" stroke="#ffd54f" stroke-width="1"/>
   <path d="M95 55 L98 53 L101 56 L104 52 L105 55" fill="none" stroke="#ff5722" stroke-width="1"/>
   <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">8,849m</text>
   <text x="100" y="135" text-anchor="middle" font-family="Arial" font-size="8" fill="#ffd54f">TOP OF THE WORLD</text>`,
  'EVEREST SUMMITEER'
);

// Above the Clouds: Clouds below, peak above
createBadge(
  'lifetime-elevation-above-the-clouds.svg',
  '#4fc3f7',
  '#0288d1',
  '#01579b',
  `<path d="M80 70 L100 40 L120 70 Z" fill="#37474f"/>
   <path d="M80 70 L100 40 L100 70 Z" fill="#546e7a"/>
   <path d="M95 45 L100 40 L105 45" fill="white"/>
   <path d="M20 90 Q40 80 60 90 Q80 100 100 90 Q120 80 140 90 Q160 100 180 90 L180 100 Q160 110 140 100 Q120 90 100 100 Q80 110 60 100 Q40 90 20 100 Z" fill="white" opacity="0.9"/>
   <path d="M30 100 Q50 92 70 100 Q90 108 110 100 Q130 92 150 100 Q170 108 180 105" fill="white" opacity="0.6"/>
   <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="white">15,000m</text>`,
  'ABOVE THE CLOUDS'
);

// Stratosphere Seeker: Earth's curvature from high altitude
createBadge(
  'lifetime-elevation-stratosphere.svg',
  '#0d47a1',
  '#1565c0',
  '#64b5f6',
  `<path d="M0 130 Q50 120 100 125 Q150 130 200 125 L200 200 L0 200 Z" fill="#1976d2"/>
   <path d="M0 135 Q50 128 100 132 Q150 136 200 130" fill="none" stroke="#64b5f6" stroke-width="1.5" opacity="0.6"/>
   <path d="M20 120 Q100 110 180 118" fill="none" stroke="#90caf9" stroke-width="1" opacity="0.4"/>
   <circle cx="100" cy="70" r="3" fill="white"/>
   <path d="M100 73 L100 85" stroke="white" stroke-width="1.5"/>
   <path d="M95 80 L100 85 L105 80" fill="none" stroke="white" stroke-width="1.5"/>
   ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${60 + i * 20}" cy="${145 - i * 2}" r="1" fill="white" opacity="0.5"/>`).join('\n   ')}
   <text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="white">20,000m</text>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="8" fill="#90caf9">STRATOSPHERE</text>`,
  'STRATOSPHERE SEEKER'
);

// ═══════════════════════════════════════════════════════════════════════════════
// CALORIES BADGES — Fire, heat, and energy themed
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n── Calories Badges ──');

// First Five Hundred: A small candle flame
createBadge(
  'lifetime-calories-five-hundred.svg',
  '#fff8e1',
  '#ffecb3',
  '#f57f17',
  `<rect x="95" y="100" width="10" height="35" fill="#ffe082" stroke="#f9a825" stroke-width="1" rx="2"/>
   <path d="M100 100 Q93 85 97 70 Q100 60 100 55 Q100 60 103 70 Q107 85 100 100 Z" fill="#ff9800"/>
   <path d="M100 100 Q95 88 98 78 Q100 70 100 65 Q100 70 102 78 Q105 88 100 100 Z" fill="#ffc107"/>
   <path d="M100 95 Q97 88 99 80 Q100 75 101 80 Q103 88 100 95 Z" fill="#ffeb3b"/>
   <rect x="90" y="135" width="20" height="5" rx="2" fill="#8d6e63"/>
   <text x="100" y="55" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#e65100">500</text>`,
  'FIRST FIVE HUNDRED'
);

// Kiloburn: A single bold flame
createBadge(
  'lifetime-calories-one-thousand.svg',
  '#fff3e0',
  '#ffcc80',
  '#e65100',
  `<path d="M100 130 Q80 115 78 95 Q76 75 88 60 Q92 50 100 40 Q108 50 112 60 Q124 75 122 95 Q120 115 100 130 Z" fill="#ff5722"/>
   <path d="M100 130 Q87 118 85 100 Q83 82 93 68 Q97 60 100 50 Q103 60 107 68 Q117 82 115 100 Q113 118 100 130 Z" fill="#ff9800"/>
   <path d="M100 130 Q92 120 91 108 Q90 95 96 82 Q99 75 100 68 Q101 75 104 82 Q110 95 109 108 Q108 120 100 130 Z" fill="#ffc107"/>
   <path d="M100 125 Q96 118 95 110 Q95 100 99 90 Q100 85 101 90 Q105 100 105 110 Q104 118 100 125 Z" fill="#ffeb3b"/>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#bf360c">1,000 cal</text>`,
  'KILOBURN'
);

// Slow Burn: Smouldering embers/coals
createBadge(
  'lifetime-calories-two-thousand-five-hundred.svg',
  '#3e2723',
  '#4e342e',
  '#ff6f00',
  `<ellipse cx="80" cy="115" rx="15" ry="10" fill="#d84315" opacity="0.8"/>
   <ellipse cx="110" cy="110" rx="12" ry="9" fill="#bf360c" opacity="0.9"/>
   <ellipse cx="95" cy="120" rx="18" ry="8" fill="#e65100" opacity="0.7"/>
   <ellipse cx="120" cy="120" rx="10" ry="7" fill="#d84315" opacity="0.6"/>
   <path d="M78 108 Q80 100 82 108" fill="#ff9800" opacity="0.8"/>
   <path d="M108 103 Q110 95 112 103" fill="#ffb300" opacity="0.7"/>
   <path d="M93 112 Q95 105 97 112" fill="#ff6f00" opacity="0.9"/>
   <path d="M118 113 Q120 107 122 113" fill="#ff8f00" opacity="0.6"/>
   <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#ffcc80">2,500</text>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="9" fill="#ffab40">SLOW BURN</text>`,
  'SLOW BURN'
);

// Five Thousand Flames: Multiple dancing flames
createBadge(
  'lifetime-calories-five-thousand.svg',
  '#bf360c',
  '#d32f2f',
  '#ff9800',
  `<path d="M70 130 Q60 115 62 100 Q64 85 70 75 Q73 80 76 85 Q82 100 80 110 Q78 120 70 130 Z" fill="#ff5722"/>
   <path d="M70 125 Q64 115 66 103 Q68 92 72 85 Q75 92 76 100 Q77 112 70 125 Z" fill="#ff9800"/>
   <path d="M100 120 Q85 105 87 85 Q89 65 100 50 Q111 65 113 85 Q115 105 100 120 Z" fill="#ff5722"/>
   <path d="M100 115 Q90 102 92 87 Q94 72 100 60 Q106 72 108 87 Q110 102 100 115 Z" fill="#ffc107"/>
   <path d="M130 130 Q120 115 122 100 Q124 85 130 75 Q133 80 136 85 Q142 100 140 110 Q138 120 130 130 Z" fill="#ff5722"/>
   <path d="M130 125 Q124 115 126 103 Q128 92 132 85 Q134 92 135 100 Q136 112 130 125 Z" fill="#ff9800"/>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#ffeb3b">5,000</text>`,
  'FIVE THOUSAND FLAMES'
);

// Ten Thousand Torch: A blazing torch
createBadge(
  'lifetime-calories-ten-thousand.svg',
  '#1b0000',
  '#3e2723',
  '#ff6f00',
  `<rect x="95" y="95" width="10" height="50" fill="#8d6e63" rx="3"/>
   <path d="M85 95 L115 95 L110 100 L90 100 Z" fill="#a1887f"/>
   <path d="M100 95 Q85 75 88 55 Q90 40 100 30 Q110 40 112 55 Q115 75 100 95 Z" fill="#ff5722"/>
   <path d="M100 90 Q90 75 92 60 Q94 48 100 38 Q106 48 108 60 Q110 75 100 90 Z" fill="#ff9800"/>
   <path d="M100 82 Q94 72 96 62 Q98 52 100 45 Q102 52 104 62 Q106 72 100 82 Z" fill="#ffc107"/>
   <path d="M100 72 Q97 65 99 58 Q100 52 101 58 Q103 65 100 72 Z" fill="#ffeb3b"/>
   <text x="100" y="155" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#ffcc80">10,000 cal</text>`,
  'TEN THOUSAND TORCH'
);

// Furnace Mode: An industrial furnace glowing
createBadge(
  'lifetime-calories-twenty-five-thousand.svg',
  '#212121',
  '#424242',
  '#ff3d00',
  `<rect x="60" y="70" width="80" height="70" fill="#616161" stroke="#757575" stroke-width="2" rx="5"/>
   <rect x="70" y="80" width="60" height="40" rx="3" fill="#1a1a1a" stroke="#424242" stroke-width="1"/>
   <path d="M80 120 Q85 105 90 110 Q95 100 100 108 Q105 98 110 108 Q115 100 120 110 Q125 105 130 120" fill="#ff3d00"/>
   <path d="M85 120 Q90 110 95 115 Q100 105 105 113 Q110 105 115 112 Q120 108 125 120" fill="#ff9100"/>
   <path d="M90 120 Q95 113 100 116 Q105 110 110 115 Q115 112 120 120" fill="#ffc400"/>
   <rect x="65" y="68" width="70" height="5" fill="#9e9e9e" rx="2"/>
   <text x="100" y="55" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="#ff6e40">25,000</text>`,
  'FURNACE MODE'
);

// Fifty Thousand Furnace: A blazing bonfire
createBadge(
  'lifetime-calories-fifty-thousand.svg',
  '#4a0000',
  '#6d0000',
  '#ff8f00',
  `<path d="M100 130 Q70 115 65 85 Q62 55 80 40 Q85 50 88 55 Q82 65 85 80 Q90 70 95 60 Q97 50 100 35 Q103 50 105 60 Q110 70 115 80 Q118 65 112 55 Q115 50 120 40 Q138 55 135 85 Q130 115 100 130 Z" fill="#d50000"/>
   <path d="M100 125 Q78 112 75 88 Q73 65 87 52 Q92 60 94 67 Q88 75 92 85 Q97 75 100 60 Q103 75 108 85 Q112 75 106 67 Q108 60 113 52 Q127 65 125 88 Q122 112 100 125 Z" fill="#ff6d00"/>
   <path d="M100 118 Q85 108 83 90 Q82 72 92 62 Q96 70 100 65 Q104 70 108 62 Q118 72 117 90 Q115 108 100 118 Z" fill="#ffab00"/>
   <path d="M100 108 Q92 100 91 88 Q90 78 97 72 Q100 78 103 72 Q110 78 109 88 Q108 100 100 108 Z" fill="#ffeb3b"/>
   <text x="100" y="152" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#ffd54f">50,000</text>`,
  'FIFTY THOUSAND'
);

// Calorie Crusher: A fist smashing through fire
createBadge(
  'lifetime-calories-seventy-five-thousand.svg',
  '#311b92',
  '#4527a0',
  '#ff6d00',
  `<path d="M65 90 Q65 75 80 75 L120 75 Q135 75 135 90 Q135 105 120 105 L80 105 Q65 105 65 90 Z" fill="#ff8f00"/>
   <path d="M80 80 L85 80 L85 100 L80 100 Z M90 78 L95 78 L95 100 L90 100 Z M100 78 L105 78 L105 100 L100 100 Z M110 80 L115 80 L115 100 L110 100 Z" fill="#ffab40" rx="2"/>
   <path d="M70 100 L75 100 L75 105 L70 105 Z" fill="#ff6d00"/>
   <path d="M55 85 Q58 80 62 85 M138 85 Q141 80 145 85 M55 95 Q58 100 62 95 M138 95 Q141 100 145 95" fill="none" stroke="#ffab00" stroke-width="2"/>
   <text x="100" y="65" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="#ffd54f">75,000</text>
   <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="9" fill="#ce93d8">CRUSHER</text>`,
  'CALORIE CRUSHER'
);

// Hundred Thousand Blaze: A blazing sun/supernova
createBadge(
  'lifetime-calories-hundred-thousand.svg',
  '#1a0000',
  '#330000',
  '#ff6f00',
  `<circle cx="100" cy="90" r="25" fill="#ff8f00"/>
   <circle cx="100" cy="90" r="18" fill="#ffc107"/>
   <circle cx="100" cy="90" r="10" fill="#ffeb3b"/>
   ${[0, 45, 90, 135, 180, 225, 270, 315]
     .map((angle) => {
       const rad = (angle * Math.PI) / 180;
       const x1 = 100 + 28 * Math.cos(rad);
       const y1 = 90 + 28 * Math.sin(rad);
       const x2 = 100 + 42 * Math.cos(rad);
       const y2 = 90 + 42 * Math.sin(rad);
       return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ff6f00" stroke-width="3" stroke-linecap="round"/>`;
     })
     .join('\n   ')}
   <text x="100" y="95" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#bf360c">100K</text>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="9" fill="#ffab40">BLAZE</text>`,
  '100K BLAZE'
);

// Inferno Legend: A ring of fire
createBadge(
  'lifetime-calories-one-hundred-fifty-thousand.svg',
  '#1b0000',
  '#4a0000',
  '#ff3d00',
  `<circle cx="100" cy="90" r="35" fill="none" stroke="#ff3d00" stroke-width="8"/>
   <circle cx="100" cy="90" r="35" fill="none" stroke="#ff8f00" stroke-width="4"/>
   ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
     .map((angle) => {
       const rad = (angle * Math.PI) / 180;
       const x = 100 + 35 * Math.cos(rad);
       const y = 90 + 35 * Math.sin(rad);
       return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(x + (100 - x) * 0.3).toFixed(1)} ${(y + (90 - y) * 0.3 - 8).toFixed(1)} ${(x + (100 - x) * 0.15).toFixed(1)} ${(y + (90 - y) * 0.15).toFixed(1)}" fill="none" stroke="#ffc400" stroke-width="2"/>`;
     })
     .join('\n   ')}
   <text x="100" y="88" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="#ffd54f">150K</text>
   <text x="100" y="102" text-anchor="middle" font-family="Arial" font-size="8" fill="#ffab00">INFERNO</text>`,
  'INFERNO LEGEND'
);

// Quarter Million Burn: A volcanic eruption
createBadge(
  'lifetime-calories-quarter-million.svg',
  '#210000',
  '#4a0000',
  '#ff5722',
  `<path d="M40 145 L75 100 L85 105 L100 55 L115 105 L125 100 L160 145 Z" fill="#5d4037"/>
   <path d="M85 105 L100 55 L115 105 Q100 100 85 105 Z" fill="#bf360c"/>
   <path d="M92 65 Q95 50 100 45 Q105 50 108 65 Q105 55 100 52 Q95 55 92 65 Z" fill="#ff5722"/>
   <circle cx="90" cy="52" r="3" fill="#ff8f00" opacity="0.8"/>
   <circle cx="110" cy="48" r="2.5" fill="#ff6f00" opacity="0.7"/>
   <circle cx="95" cy="40" r="2" fill="#ffc107" opacity="0.6"/>
   <circle cx="105" cy="38" r="2.5" fill="#ffab00" opacity="0.7"/>
   <path d="M88 70 Q85 65 82 68 M112 70 Q115 65 118 68" fill="none" stroke="#ff3d00" stroke-width="1.5"/>
   <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#ffd54f">250,000</text>`,
  'QUARTER MILLION'
);

// Half Million Incinerator: A supernova explosion
createBadge(
  'lifetime-calories-half-million.svg',
  '#000000',
  '#1a0000',
  '#ffd54f',
  `<circle cx="100" cy="90" r="15" fill="white"/>
   <circle cx="100" cy="90" r="10" fill="#ffeb3b"/>
   <circle cx="100" cy="90" r="5" fill="#fff9c4"/>
   ${[0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336]
     .map((angle) => {
       const rad = (angle * Math.PI) / 180;
       const length = 20 + (angle % 48 === 0 ? 15 : 0);
       const x1 = 100 + 18 * Math.cos(rad);
       const y1 = 90 + 18 * Math.sin(rad);
       const x2 = 100 + length * Math.cos(rad);
       const y2 = 90 + length * Math.sin(rad);
       const colour = angle % 48 === 0 ? '#ffd54f' : '#ff8f00';
       return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${colour}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>`;
     })
     .join('\n   ')}
   <text x="100" y="140" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="#ffd54f">500,000</text>
   <text x="100" y="152" text-anchor="middle" font-family="Arial" font-size="7" fill="#ff8f00">INCINERATOR</text>`,
  'HALF MILLION'
);

// ═══════════════════════════════════════════════════════════════════════════════
// STARTER BADGES — Beginner-friendly quick-win badges (from achievements.ts seed)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Starter Distance Badges ────────────────────────────────────────────────

console.log('\n── Starter Distance Badges ──');

// First 100 Metres: A large footprint with "100m" text
createBadge(
  'first-100-metres.svg',
  '#f1f8e9',
  '#aed581',
  '#558b2f',
  `<ellipse cx="95" cy="80" rx="14" ry="22" fill="#8d6e63" transform="rotate(-10 95 80)"/>
   <ellipse cx="88" cy="62" rx="5" ry="7" fill="#795548" transform="rotate(-10 88 62)"/>
   <ellipse cx="97" cy="58" rx="5" ry="7" fill="#795548" transform="rotate(-5 97 58)"/>
   <ellipse cx="106" cy="60" rx="5" ry="7" fill="#795548" transform="rotate(5 106 60)"/>
   <ellipse cx="112" cy="66" rx="4" ry="6" fill="#795548" transform="rotate(15 112 66)"/>
   <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="20" font-weight="bold" fill="#33691e">100m</text>
   <text x="100" y="138" text-anchor="middle" font-family="Arial" font-size="10" fill="#558b2f">FIRST STEP</text>`,
  'FIRST 100 METRES'
);

// Half Kilometre: A milestone stone with "0.5km" carved in
createBadge(
  'half-kilometre.svg',
  '#e8f5e9',
  '#a5d6a7',
  '#2e7d32',
  `<path d="M75 130 L78 70 Q100 58 122 70 L125 130 Z" fill="#9e9e9e" stroke="#616161" stroke-width="2"/>
   <path d="M78 75 Q100 65 122 75" fill="none" stroke="#757575" stroke-width="1"/>
   <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#1b5e20">0.5</text>
   <text x="100" y="116" text-anchor="middle" font-family="Arial" font-size="10" fill="#2e7d32">km</text>
   <path d="M68 130 L132 130" stroke="#795548" stroke-width="3"/>
   <path d="M62 133 Q100 138 138 133" fill="#8d6e63" stroke="none"/>
   <path d="M30 115 Q40 100 55 108 Q70 116 80 110" fill="none" stroke="#66bb6a" stroke-width="2"/>`,
  'HALF KILOMETRE'
);

// One Kilometre: A trail marker post with "1KM" sign
createBadge(
  'one-kilometre.svg',
  '#e8f5e9',
  '#81c784',
  '#388e3c',
  `<rect x="97" y="70" width="6" height="65" fill="#795548" rx="2"/>
   <rect x="82" y="65" width="36" height="20" fill="#4caf50" stroke="#2e7d32" stroke-width="2" rx="3"/>
   <path d="M82 65 L100 58 L118 65" fill="#43a047" stroke="#2e7d32" stroke-width="1"/>
   <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="white">1 KM</text>
   <path d="M30 125 Q55 115 75 120 Q90 124 100 120" fill="none" stroke="#a5d6a7" stroke-width="2" stroke-dasharray="5,3"/>
   <path d="M100 120 Q115 116 135 120 Q155 124 175 118" fill="none" stroke="#a5d6a7" stroke-width="2" stroke-dasharray="5,3"/>`,
  'ONE KILOMETRE'
);

// Five Kilometres: A finish tape stretched across a park path
createBadge(
  'five-kilometres.svg',
  '#e8f5e9',
  '#c8e6c9',
  '#388e3c',
  `<path d="M30 130 Q60 118 100 122 Q140 126 175 115" fill="none" stroke="#a5d6a7" stroke-width="3" stroke-dasharray="6,4"/>
   <rect x="60" y="85" width="4" height="40" fill="#5d4037"/>
   <rect x="136" y="85" width="4" height="40" fill="#5d4037"/>
   <rect x="62" y="90" width="76" height="8" fill="#e53935" rx="2" opacity="0.85"/>
   <rect x="62" y="102" width="76" height="8" fill="white" rx="1" opacity="0.85"/>
   <text x="100" y="98" text-anchor="middle" font-family="Arial" font-size="9" font-weight="bold" fill="white">FINISH</text>
   <text x="100" y="70" text-anchor="middle" font-family="Arial" font-size="24" font-weight="bold" fill="#2e7d32">5km</text>`,
  'FIVE KILOMETRES'
);

// ─── Starter Duration Badges ─────────────────────────────────────────────────

console.log('\n── Starter Duration Badges ──');

// Two Minutes: A mini stopwatch showing 2:00
createBadge(
  'two-minutes.svg',
  '#fff8e1',
  '#ffe082',
  '#f57f17',
  `<circle cx="100" cy="95" r="32" fill="white" stroke="#f9a825" stroke-width="3"/>
   <circle cx="100" cy="95" r="26" fill="none" stroke="#fff9c4" stroke-width="2"/>
   <rect x="97" y="58" width="6" height="9" rx="3" fill="#f9a825"/>
   <path d="M90 53 L110 53" stroke="#f57f17" stroke-width="2" stroke-linecap="round"/>
   <path d="M113 65 L118 60" stroke="#f9a825" stroke-width="2" stroke-linecap="round"/>
   <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#e65100">2:00</text>
   <line x1="100" y1="95" x2="100" y2="73" stroke="#f57f17" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="100" y1="95" x2="116" y2="95" stroke="#ffb300" stroke-width="1.5" stroke-linecap="round"/>
   <circle cx="100" cy="95" r="2.5" fill="#e65100"/>
   <text x="100" y="145" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#e65100">2 MINUTES</text>`,
  'TWO MINUTES'
);

// Five Minutes: A clock face with hand at the 5-minute mark
createBadge(
  'five-minutes.svg',
  '#fff3e0',
  '#ffcc80',
  '#e65100',
  `<circle cx="100" cy="92" r="33" fill="white" stroke="#ef6c00" stroke-width="3"/>
   <circle cx="100" cy="92" r="27" fill="none" stroke="#fff3e0" stroke-width="1.5"/>
   <text x="100" y="68" text-anchor="middle" font-family="Arial" font-size="8" fill="#bf360c">12</text>
   <text x="130" y="96" text-anchor="middle" font-family="Arial" font-size="8" fill="#bf360c">3</text>
   <text x="100" y="122" text-anchor="middle" font-family="Arial" font-size="8" fill="#bf360c">6</text>
   <text x="70" y="96" text-anchor="middle" font-family="Arial" font-size="8" fill="#bf360c">9</text>
   <line x1="100" y1="92" x2="100" y2="67" stroke="#e65100" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="100" y1="92" x2="116" y2="109" stroke="#ff9800" stroke-width="1.5" stroke-linecap="round"/>
   <circle cx="100" cy="92" r="2.5" fill="#e65100"/>
   <text x="100" y="143" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#e65100">5 MINUTES</text>`,
  'FIVE MINUTES'
);

// Fifteen Minutes: A quarter-hour arc progress ring
createBadge(
  'fifteen-minutes.svg',
  '#fff3e0',
  '#ffb74d',
  '#ef6c00',
  `<circle cx="100" cy="90" r="34" fill="white" stroke="#e0e0e0" stroke-width="3"/>
   <path d="M100 56 A34 34 0 0 1 134 90" fill="none" stroke="#ef6c00" stroke-width="6" stroke-linecap="round"/>
   <circle cx="100" cy="90" r="24" fill="none" stroke="#fff3e0" stroke-width="2"/>
   <line x1="100" y1="90" x2="100" y2="67" stroke="#ef6c00" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="100" y1="90" x2="116" y2="90" stroke="#ff9800" stroke-width="1.5" stroke-linecap="round"/>
   <circle cx="100" cy="90" r="2.5" fill="#ef6c00"/>
   <text x="100" y="97" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#e65100">15</text>
   <text x="100" y="143" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#ef6c00">15 MINUTES</text>`,
  'FIFTEEN MINUTES'
);

// Thirty Minutes: A half-filled hourglass
createBadge(
  'thirty-minutes.svg',
  '#fff3e0',
  '#ffa726',
  '#e65100',
  `<path d="M72 55 L128 55 L108 88 L128 125 L72 125 L92 88 Z" fill="#fff8e1" stroke="#e65100" stroke-width="3"/>
   <path d="M76 58 L124 58 L108 85 Z" fill="#ffb74d" opacity="0.7"/>
   <path d="M92 91 L76 122 L124 122 Z" fill="#ff9800" opacity="0.5"/>
   <path d="M92 91 L108 91 L124 122 L76 122 Z" fill="#ff9800" opacity="0.4"/>
   <rect x="90" y="86" width="20" height="6" fill="#ef6c00" rx="3"/>
   <line x1="72" y1="55" x2="128" y2="55" stroke="#bf360c" stroke-width="3" stroke-linecap="round"/>
   <line x1="72" y1="125" x2="128" y2="125" stroke="#bf360c" stroke-width="3" stroke-linecap="round"/>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#bf360c">30 MINUTES</text>`,
  'THIRTY MINUTES'
);

// ─── Starter Calorie Badges ───────────────────────────────────────────────────

console.log('\n── Starter Calorie Badges ──');

// Fifty Calories: A small glowing ember / spark
createBadge(
  'fifty-calories.svg',
  '#fff8e1',
  '#ffe082',
  '#f57f17',
  `<circle cx="100" cy="88" r="18" fill="#ff9800" opacity="0.15"/>
   <path d="M100 110 Q90 98 92 85 Q94 75 100 68 Q106 75 108 85 Q110 98 100 110 Z" fill="#ff8f00"/>
   <path d="M100 107 Q93 97 95 87 Q97 79 100 74 Q103 79 105 87 Q107 97 100 107 Z" fill="#ffc107"/>
   <path d="M100 100 Q96 93 97 86 Q99 81 100 78 Q101 81 103 86 Q104 93 100 100 Z" fill="#ffeb3b"/>
   <path d="M88 78 Q84 72 88 68 M112 78 Q116 72 112 68" fill="none" stroke="#ffb300" stroke-width="1.5" stroke-linecap="round"/>
   <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#e65100">50</text>
   <text x="100" y="146" text-anchor="middle" font-family="Arial" font-size="9" fill="#f57f17">CALORIES</text>`,
  'FIFTY CALORIES'
);

// Two Hundred Calories: A small campfire with logs
createBadge(
  'two-hundred-calories.svg',
  '#fbe9e7',
  '#ffab91',
  '#bf360c',
  `<path d="M78 125 L85 125" stroke="#5d4037" stroke-width="5" stroke-linecap="round" transform="rotate(-20 78 125)"/>
   <path d="M122 125 L115 125" stroke="#5d4037" stroke-width="5" stroke-linecap="round" transform="rotate(20 122 125)"/>
   <path d="M88 125 L112 125" stroke="#6d4c41" stroke-width="4" stroke-linecap="round"/>
   <path d="M100 120 Q87 105 90 88 Q93 72 100 62 Q107 72 110 88 Q113 105 100 120 Z" fill="#d84315"/>
   <path d="M100 117 Q90 104 93 90 Q96 78 100 70 Q104 78 107 90 Q110 104 100 117 Z" fill="#ff7043"/>
   <path d="M100 112 Q94 102 96 92 Q98 83 100 78 Q102 83 104 92 Q106 102 100 112 Z" fill="#ffca28"/>
   <text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#bf360c">200 CAL</text>`,
  '200 CALORIES'
);

// ─── Starter Consistency & Speed Badges ──────────────────────────────────────

console.log('\n── Starter Consistency & Speed Badges ──');

// First Workout: A small golden trophy
createBadge(
  'first-workout.svg',
  '#e3f2fd',
  '#90caf9',
  '#1565c0',
  `<path d="M78 65 L82 105 Q100 115 118 105 L122 65 Z" fill="#fdd835" stroke="#f9a825" stroke-width="2"/>
   <path d="M73 65 L68 75 Q68 90 82 90" fill="none" stroke="#f9a825" stroke-width="3"/>
   <path d="M127 65 L132 75 Q132 90 118 90" fill="none" stroke="#f9a825" stroke-width="3"/>
   <rect x="91" y="110" width="18" height="7" fill="#fbc02d"/>
   <rect x="86" y="116" width="28" height="5" fill="#f9a825" rx="2"/>
   <text x="100" y="94" text-anchor="middle" font-family="Arial" font-size="11" font-weight="bold" fill="#5d4037">#1</text>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#1565c0">FIRST WORKOUT</text>`,
  'FIRST WORKOUT'
);

// Five Workouts: Five gold stars in a row
createBadge(
  'five-workouts.svg',
  '#e8eaf6',
  '#c5cae9',
  '#283593',
  `${[0, 1, 2, 3, 4]
    .map((i) => {
      const cx = 38 + i * 31;
      const cy = 90;
      return `<polygon points="${cx},${cy - 14} ${cx + 5},${cy - 4} ${cx + 15},${cy - 4} ${cx + 8},${cy + 3} ${cx + 10},${cy + 14} ${cx},${cy + 8} ${cx - 10},${cy + 14} ${cx - 8},${cy + 3} ${cx - 15},${cy - 4} ${cx - 5},${cy - 4}" fill="#fdd835" stroke="#f9a825" stroke-width="1"/>`;
    })
    .join('\n   ')}
   <text x="100" y="125" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#283593">5 WORKOUTS</text>`,
  'FIVE WORKOUTS'
);

// Ten Workouts: A rosette/ribbon badge
createBadge(
  'ten-workouts.svg',
  '#ede7f6',
  '#ce93d8',
  '#6a1b9a',
  `${[0, 36, 72, 108, 144, 180, 216, 252, 288, 324]
    .map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + 28 * Math.cos(rad);
      const y1 = 88 + 28 * Math.sin(rad);
      const x2 = 100 + 40 * Math.cos(rad);
      const y2 = 88 + 40 * Math.sin(rad);
      return `<ellipse cx="${((x1 + x2) / 2).toFixed(1)}" cy="${((y1 + y2) / 2).toFixed(1)}" rx="8" ry="5" fill="#ab47bc" transform="rotate(${angle} ${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)})"/>`;
    })
    .join('\n   ')}
   <circle cx="100" cy="88" r="22" fill="#ce93d8" stroke="#6a1b9a" stroke-width="2"/>
   <circle cx="100" cy="88" r="17" fill="white"/>
   <text x="100" y="84" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="#4a148c">10</text>
   <text x="100" y="97" text-anchor="middle" font-family="Arial" font-size="7" fill="#6a1b9a">WORKOUTS</text>
   <text x="100" y="148" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#6a1b9a">TEN WORKOUTS</text>`,
  'TEN WORKOUTS'
);

// Speed Demon: A lightning bolt with speed lines
createBadge(
  'speed-demon.svg',
  '#fff9c4',
  '#fff176',
  '#f57f17',
  `<polygon points="108,48 88,95 102,95 92,148 120,88 105,88" fill="#fdd835" stroke="#f9a825" stroke-width="2"/>
   <line x1="55" y1="72" x2="80" y2="72" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="48" y1="90" x2="78" y2="90" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="55" y1="108" x2="80" y2="108" stroke="#ffb300" stroke-width="2.5" stroke-linecap="round"/>
   <line x1="140" y1="72" x2="155" y2="72" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
   <line x1="140" y1="90" x2="158" y2="90" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
   <line x1="140" y1="108" x2="155" y2="108" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
   <text x="100" y="160" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#e65100">10 km/h</text>`,
  'SPEED DEMON'
);

console.log(`\n✓ All badge SVGs generated in: ${OUTPUT_DIR}`);
