// SG §20.2: map geometry, nodes, path, chapter cards and fixed footer bar.
import type { SaveV2 } from '../../meta/saveSchema';
import { levelParams } from '../../core/levels';
import { createMiniGloop } from '../../render/miniGloop';
import { mapGeometry, type MapGeometry } from './mapGeometry';
import { S, formatNumber } from '../strings';
import { readSafeAreaInsets } from '../safeArea';
import { el } from '../dom';
import { iconMarkup } from '../icons';

const FLAVOURS = [1, 3, 4, 5, 6, 7] as const;
export function createAdventureMap(save: SaveV2, actions: { back(): void; openLevel(level: number): void }): HTMLElement {
  const { top: safeTop, bottom: safeBottom } = readSafeAreaInsets();
  const geometry = mapGeometry({ w: window.innerWidth, h: window.innerHeight, safeTop, safeBottom });
  const root = document.createElement('main'); root.className = 'screen-wrap adventure-screen';
  const header = document.createElement('header'); header.className = 'adventure-header';
  const back = button('‹', 'adventure-back', () => actions.back()); back.setAttribute('aria-label', S.back);
  const title = document.createElement('h1'); title.textContent = S.adventure;
  const stars = Object.values(save.adventure.levels).reduce((sum, item) => sum + item.stars, 0);
  const chips = document.createElement('div'); chips.className = 'adventure-chips'; chips.append(chip(S.adventureStars(stars)), coinChip(save.profile.coins));
  header.append(back, title, chips);
  const scroll = document.createElement('div'); scroll.className = 'adventure-scroll';
  const column = document.createElement('div'); column.className = 'adventure-map-column'; column.style.width = `${geometry.colW}px`;
  const content = document.createElement('div'); content.className = 'adventure-map-content'; content.style.width = `${geometry.colW}px`; content.style.height = `${geometry.contentHeight}px`;
  content.append(mapPath(save.adventure.frontier, geometry));
  const pausedLevel = save.adventure.inProgress?.adventure?.level;
  for (const nodeGeo of geometry.nodes) {
    const { level } = nodeGeo; const state = save.adventure.levels[String(level)]; const won = Boolean(state?.wins); const unlocked = level <= save.adventure.frontier || won;
    const params = levelParams(level); const wrap = document.createElement('div'); wrap.className = 'adventure-node-wrap';
    wrap.style.left = `${nodeGeo.cx - nodeGeo.box.w / 2}px`; wrap.style.top = `${nodeGeo.box.y}px`; wrap.style.width = `${nodeGeo.box.w}px`; wrap.style.height = `${nodeGeo.box.h}px`;
    const node = document.createElement('button'); node.type = 'button'; node.className = `adventure-node${won ? ' is-won' : ''}${!unlocked ? ' is-locked' : ''}${level === save.adventure.frontier && !won ? ' is-next' : ''}${params.band === 'hard' ? ' is-hard' : ''}`;
    node.style.width = `${nodeGeo.r * 2}px`; node.style.height = `${nodeGeo.r * 2}px`; node.textContent = formatNumber(level); node.disabled = !unlocked;
    node.setAttribute('aria-label', S.adventureNodeAria(level, state?.stars ?? 0, params.band === 'hard', level === save.adventure.frontier && !won, !unlocked));
    if (unlocked) node.addEventListener('click', () => actions.openLevel(level));
    if (level === save.adventure.frontier && !won) {
      const art = document.createElement('canvas'); art.width = 40; art.height = 40; art.className = 'adventure-node-art'; art.style.left = `${(nodeGeo.box.w - 40) / 2}px`;
      const ctx = art.getContext('2d'); if (ctx) ctx.drawImage(createMiniGloop(FLAVOURS[params.chapter - 1] ?? 1, 'idle'), 0, 0, 40, 40); wrap.append(art);
    }
    wrap.append(node);
    if (pausedLevel === level) { const label = document.createElement('small'); label.textContent = S.continue; label.className = 'adventure-node-caption'; wrap.append(label); }
    else if (!unlocked) { const lock = document.createElement('small'); lock.textContent = S.lock; lock.className = 'adventure-node-caption'; wrap.append(lock); }
    else if (won) { const starsLabel = document.createElement('small'); starsLabel.textContent = '★'.repeat(state?.stars ?? 0) + '☆'.repeat(3 - (state?.stars ?? 0)); starsLabel.className = 'adventure-node-stars'; wrap.append(starsLabel); }
    if (params.band === 'hard') { const hard = document.createElement('small'); hard.textContent = S.hard; hard.className = 'adventure-node-hard'; wrap.append(hard); }
    content.append(wrap);
  }
  for (const card of geometry.cards) content.append(chapterCard(save, card.chapter, card));
  column.append(content); scroll.append(column);
  const target = Math.max(1, Math.min(120, pausedLevel ?? save.adventure.frontier));
  const footerBar = document.createElement('footer'); footerBar.className = 'adventure-footer-bar';
  footerBar.style.width = `${geometry.colW}px`; footerBar.style.height = `calc(${geometry.barHeight}px + var(--safe-area-bottom))`;
  if (save.adventure.frontier > 120) { const done = document.createElement('p'); done.className = 'adventure-all-won'; done.textContent = S.allLevelsWon; footerBar.append(done); }
  else { const play = button(pausedLevel === target ? S.continueLevel(target) : S.playLevel(target), 'button button--primary adventure-footer', () => actions.openLevel(target)); footerBar.append(play); }
  root.append(header, scroll, footerBar);
  requestAnimationFrame(() => { scroll.scrollTop = geometry.scrollTopFor(target); });
  return root;
}
function chapterCard(save: SaveV2, chapter: number, pos: MapGeometry['cards'][number]): HTMLElement {
  const card = document.createElement('section'); card.className = 'adventure-chapter-card';
  card.style.left = `${pos.x}px`; card.style.top = `${pos.y}px`; card.style.width = `${pos.w}px`; card.style.height = `${pos.h}px`;
  const art = document.createElement('canvas'); art.width = 72; art.height = 72; const ctx = art.getContext('2d'); if (ctx) ctx.drawImage(createMiniGloop(FLAVOURS[chapter - 1] ?? 1, 'idle'), 0, 0, 72, 72);
  const copy = document.createElement('div'); copy.className = 'adventure-chapter-copy'; const heading = document.createElement('strong'); heading.textContent = S.chapter(chapter, S.adventureChapterName(chapter));
  const earned = Array.from({ length: 20 }, (_, index) => save.adventure.levels[String((chapter - 1) * 20 + index + 1)]?.stars ?? 0).reduce<number>((sum, value) => sum + value, 0);
  const progress = document.createElement('small'); progress.textContent = S.chapterStars(earned);
  const rewards = document.createElement('small'); rewards.textContent = `${S.chapterLevelsReward}${save.adventure.chaptersDone.includes(chapter) ? ' ✓' : ''}`;
  const starReward = document.createElement('small'); starReward.textContent = `${S.chapterStarsReward}${save.adventure.chaptersAllStars.includes(chapter) ? ' ✓' : ''}`;
  copy.append(heading, progress, rewards, starReward); card.append(art, copy); return card;
}
function chip(text: string): HTMLElement { return el('span', 'adventure-chip', text); }
function coinChip(amount: number): HTMLElement { const node = chip(''); node.classList.add('coin-chip'); node.setAttribute('role', 'img'); node.setAttribute('aria-label', S.coinsAria(amount)); node.innerHTML = `${iconMarkup('coin')}<span>${S.coins(amount)}</span>`; return node; }
function button(text: string, cls: string, action: () => void): HTMLButtonElement { const item = el('button', cls, text); item.addEventListener('click', action); return item; }
function mapPath(frontier: number, geometry: MapGeometry): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('adventure-map-path'); svg.setAttribute('viewBox', `0 0 ${geometry.colW} ${geometry.contentHeight}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  const points = geometry.nodes.map(({ cx, cy }) => ({ x: cx, y: cy }));
  const pathFor = (items: typeof points): string => { if (!items.length) return ''; let path = `M ${items[0]!.x} ${items[0]!.y}`; for (let index = 0; index < items.length - 1; index += 1) { const p0 = items[Math.max(0, index - 1)]!; const p1 = items[index]!; const p2 = items[index + 1]!; const p3 = items[Math.min(items.length - 1, index + 2)]!; path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`; } return path; };
  const base = document.createElementNS(svg.namespaceURI, 'path'); base.setAttribute('d', pathFor(points)); base.classList.add('adventure-path-base'); svg.append(base);
  const doneThrough = Math.max(1, Math.min(120, frontier)); if (doneThrough > 1) { const progress = document.createElementNS(svg.namespaceURI, 'path'); progress.setAttribute('d', pathFor(points.slice(0, doneThrough))); progress.classList.add('adventure-path-progress'); svg.append(progress); }
  return svg;
}
