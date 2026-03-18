# Badge Studio

**Live tool:** https://dynamicskillset.com/badge-studio

A simple, client-side badge generator running entirely in the browser. Tweak some colours and settings, hit randomise if you like, and get a downloadable badge image in PNG or SVG format. These can be used with Open Badges — or anywhere you need a recognition marker.

Originally created by [Andrew Hayward](https://github.com/andrewhayward) at Mozilla, where it helped teams quickly create badges while staying within brand guidelines. This version strips out the Mozilla branding, updates the codebase, and adds a randomise button to make it more playful.

## What it's good for

- **Keeps badge design light** — no design software, brand team, or lengthy review cycle needed just to prototype a new badge
- **Supports rapid iteration** — sketch a pathway of badges and adjust visuals until they feel coherent
- **Lowers the barrier for experimentation** — educators, community organisers, and project teams can try new recognition ideas without committing to a full credentialing platform

## Features

- Multiple templates, colour palettes (including WAO brand colours), masks, and icons
- Randomise button for quick exploration
- Download as PNG or SVG
- Runs entirely client-side — nothing is sent to a server

## Reuse or fork it

Fork the codebase and add your own brand colours, icons, or whatever else you want.

## Developing

\`\`\`bash
npm install
npm run dev
\`\`\`

## Building

\`\`\`bash
npm run build
\`\`\`

Output goes to \`dist/\`. The production build uses \`/badge-studio/\` as the base path.

## Licence

[Mozilla Public License, v2.0](https://www.mozilla.org/en-US/MPL/2.0/)
