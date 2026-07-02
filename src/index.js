import fs from 'node:fs';

const TYPES = {
  feature: ['add', 'new', 'implement', 'feature', 'enable'],
  fix: ['fix', 'bug', 'repair', 'regression', 'correct'],
  docs: ['docs', 'readme', 'guide', 'documentation'],
  test: ['test', 'fixture', 'coverage', 'assert'],
  chore: ['chore', 'cleanup', 'metadata', 'package']
};

export function loadSummary(path) {
  return parseSummary(fs.readFileSync(path, 'utf8'), path);
}

export function parseSummary(text, source = 'inline') {
  const body = String(text || '').replace(/\r\n/g, '\n');
  if (!body.trim()) throw new Error('change summary is empty');
  if (source.endsWith('.json')) return normalize(JSON.parse(body), source);
  const sections = splitSections(body);
  return normalize({
    source,
    title: firstHeading(body) || basename(source),
    summary: collect(sections, ['summary', 'overview', 'result']).join(' ') || firstParagraph(body),
    files: collect(sections, ['files', 'changed files', 'changes']).filter(looksLikeFile),
    verification: collect(sections, ['verification', 'tests', 'checks']),
    artifacts: collect(sections, ['artifacts', 'links', 'outputs']),
    risks: collect(sections, ['risks', 'limitations', 'known issues']),
    audience: collect(sections, ['audience', 'users'])
  }, source);
}

export function classifyChange(summary) {
  const haystack = [summary.title, summary.summary, ...summary.files].join(' ').toLowerCase();
  const scores = Object.fromEntries(Object.entries(TYPES).map(([type, words]) => [type, words.filter(word => haystack.includes(word)).length]));
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0) return 'mixed';
  return ranked.filter(([, score]) => score === ranked[0][1]).length > 1 ? 'mixed' : ranked[0][0];
}

export function buildBrief(summary) {
  const type = classifyChange(summary);
  const warnings = [];
  if (!summary.verification.length) warnings.push('missing verification evidence');
  if (!summary.artifacts.length) warnings.push('missing artifact links or file references');
  const releaseNotes = [lead(summary, type), ...summary.files.slice(0, 5).map(file => `Updated ${file}`)];
  const demo = [`Open with the problem: ${summary.summary || summary.title}`, `Show the ${type} change using local fixtures or screenshots.`, evidenceLine(summary), riskLine(summary)];
  const post = `${summary.title}: ${summary.summary || 'Repository update ready for review.'} Evidence: ${summary.verification[0] || 'verification pending'}.`;
  return { source: summary.source, title: summary.title, type, releaseNotes, demo, post, evidence: summary.verification, artifacts: summary.artifacts, risks: summary.risks, warnings };
}

export function renderMarkdown(brief) {
  const list = (items, empty='- None listed') => items.length ? items.map(item => `- ${item}`).join('\n') : empty;
  return `# ${brief.title}\n\nType: ${brief.type}\n\n## Release Notes\n\n${list(brief.releaseNotes)}\n\n## Demo Outline\n\n${list(brief.demo)}\n\n## Post Draft\n\n${brief.post}\n\n## Evidence\n\n${list(brief.evidence)}\n\n## Artifacts\n\n${list(brief.artifacts)}\n\n## Risks\n\n${list(brief.risks, '- None known')}\n\n## Warnings\n\n${list(brief.warnings, '- None')}\n`;
}

function splitSections(text) {
  const sections = new Map([['body', []]]); let current = 'body';
  for (const line of text.split('\n')) { const h = line.match(/^#{1,4}\s+(.+)$/); if (h) { current = h[1].trim().toLowerCase(); if (!sections.has(current)) sections.set(current, []); } else sections.get(current).push(line); }
  return sections;
}
function collect(sections, names) { const out=[]; for (const [name, lines] of sections) if (names.some(n => name.includes(n))) out.push(...items(lines)); return unique(out); }
function items(lines) { return lines.map(l => l.trim()).filter(Boolean).map(l => l.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '')).filter(l => l.length > 1); }
function normalize(input, source) { return { source: input.source || source, title: input.title || basename(source), summary: input.summary || '', files: unique(input.files || []), verification: unique(input.verification || []), artifacts: unique(input.artifacts || []), risks: unique(input.risks || []), audience: unique(input.audience || []) }; }
function looksLikeFile(line) { return /[\w.-]+\/[\w./-]+|[\w.-]+\.(js|ts|md|json|yml|yaml|py|sh)$/i.test(line); }
function unique(items) { return [...new Set(items.map(String).map(s => s.trim()).filter(Boolean))]; }
function firstHeading(text) { return text.match(/^#\s+(.+)$/m)?.[1]?.trim(); }
function firstParagraph(text) { return text.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#') && !l.startsWith('-')) || ''; }
function basename(path) { return path.split('/').pop()?.replace(/\.[^.]+$/, '') || 'change-summary'; }
function lead(summary, type) { return `${type} update: ${summary.summary || summary.title}`; }
function evidenceLine(summary) { return summary.verification.length ? `Cite verification: ${summary.verification[0]}` : 'Call out verification as pending before public use.'; }
function riskLine(summary) { return summary.risks.length ? `Name risk: ${summary.risks[0]}` : 'State that no material risk is known after review.'; }
