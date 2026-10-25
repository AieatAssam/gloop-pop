// SG §20.2: candy level nodes, chapter cards, sugar path and fixed play control.
import type { SaveV2 } from '../../meta/saveSchema';
import { levelParams } from '../../core/levels';
import { createMiniGloop } from '../../render/miniGloop';
import { S } from '../strings';

const FLAVOURS = [1, 3, 4, 5, 6, 7] as const;
export function createAdventureMap(save: SaveV2, actions: { back(): void; openLevel(level: number): void }): HTMLElement {
  const root = document.createElement('main'); root.className = 'screen-wrap adventure-screen';
  const header = document.createElement('header'); header.className = 'adventure-header';
  const back = button('‹', 'adventure-back', () => actions.back()); back.setAttribute('aria-label', S.back);
  const title = document.createElement('h1'); title.textContent = S.adventure;
  const stars = Object.values(save.adventure.levels).reduce((sum, item) => sum + item.stars, 0);
  const chips = document.createElement('div'); chips.className = 'adventure-chips'; chips.append(chip(S.adventureStars(stars)), chip(S.coins(save.profile.coins)));
  header.append(back, title, chips);
  const scroll = document.createElement('div'); scroll.className = 'adventure-scroll';
  const column = document.createElement('div'); column.className = 'adventure-map-column';
  const content = document.createElement('div'); content.className = 'adventure-map-content';
  const pitch = window.innerWidth >= 800 ? 104 : 96; const contentHeight = 120 * pitch + 220;
  content.style.height = `${contentHeight}px`;
  content.append(mapPath(save.adventure.frontier, contentHeight, pitch, window.innerWidth >= 800 ? 180 : 160));
  const pausedLevel = save.adventure.inProgress?.adventure?.level;
  for (let level = 1; level <= 120; level += 1) {
    const state = save.adventure.levels[String(level)]; const won = Boolean(state?.wins); const unlocked = level <= save.adventure.frontier || won;
    const params = levelParams(level); const nodeWrap = document.createElement('div'); nodeWrap.className = 'adventure-node-wrap';
    const node = document.createElement('button'); node.type = 'button'; node.className = `adventure-node${won ? ' is-won' : ''}${!unlocked ? ' is-locked' : ''}${level === save.adventure.frontier && !won ? ' is-next' : ''}${params.band === 'hard' ? ' is-hard' : ''}`;
    node.textContent = new Intl.NumberFormat('en-US').format(level); node.disabled = !unlocked; node.setAttribute('aria-label', S.adventureNodeAria(level, state?.stars ?? 0, params.band === 'hard', level === save.adventure.frontier && !won, !unlocked));
    if (unlocked) node.addEventListener('click', () => actions.openLevel(level));
    if (level === save.adventure.frontier && !won) {
      const art = document.createElement('canvas'); art.width = 64; art.height = 64; art.className = 'adventure-node-art'; const ctx = art.getContext('2d');
      if (ctx) ctx.drawImage(createMiniGloop(FLAVOURS[params.chapter - 1] ?? 1, 'idle'), 0, 0, 64, 64);
      nodeWrap.append(art);
    }
    nodeWrap.append(node);
    if (pausedLevel === level) { const label = document.createElement('small'); label.textContent = S.continue; label.className = 'adventure-node-caption'; nodeWrap.append(label); }
    else if (!unlocked) { const lock = document.createElement('small'); lock.textContent = S.lock; lock.className = 'adventure-node-caption'; nodeWrap.append(lock); }
    else if (won) { const starsLabel = document.createElement('small'); starsLabel.textContent = '★'.repeat(state?.stars ?? 0) + '☆'.repeat(3 - (state?.stars ?? 0)); starsLabel.className = 'adventure-node-stars'; nodeWrap.append(starsLabel); }
    if (params.band === 'hard') { const hard = document.createElement('small'); hard.textContent = S.hard; hard.className = 'adventure-node-hard'; nodeWrap.append(hard); }
    const offset = [0, 18, 28, 18, 0, -18, -28, -18][(level - 1) % 8] ?? 0;
    nodeWrap.style.setProperty('--node-x', `${offset}%`); nodeWrap.style.setProperty('--node-y', `${(120 - level) * pitch}px`); content.append(nodeWrap);
    if (level % 20 === 0) content.append(chapterCard(save, Math.ceil(level / 20), (120 - level) * pitch + 12));
  }
  column.append(content); scroll.append(column);
  const target = Math.max(1, pausedLevel ?? save.adventure.frontier);
  root.append(header, scroll);
  if (save.adventure.frontier > 120) { const done = document.createElement('p'); done.className = 'adventure-all-won'; done.textContent = S.allLevelsWon; root.append(done); }
  else { const footer = button(S.playLevel(target), 'button button--primary adventure-footer', () => actions.openLevel(target)); root.append(footer); }
  requestAnimationFrame(() => { scroll.scrollTop = Math.max(0, (120 - target) * pitch + (window.innerWidth >= 800 ? 180 : 160) - scroll.clientHeight * 0.6); });
  return root;
}
function chapterCard(save: SaveV2, chapter: number, y: number): HTMLElement {
  const card = document.createElement('section'); card.className = 'adventure-chapter-card'; card.style.top = `${y}px`;
  const art = document.createElement('canvas'); art.width = 72; art.height = 72; const ctx = art.getContext('2d'); if (ctx) ctx.drawImage(createMiniGloop(FLAVOURS[chapter - 1] ?? 1, 'idle'), 0, 0, 72, 72);
  const copy = document.createElement('div'); copy.className = 'adventure-chapter-copy'; const heading = document.createElement('strong'); heading.textContent = S.chapter(chapter, S.adventureChapterName(chapter));
  const earned = Array.from({ length: 20 }, (_, index) => save.adventure.levels[String((chapter - 1) * 20 + index + 1)]?.stars ?? 0).reduce<number>((sum, value) => sum + value, 0);
  const progress = document.createElement('small'); progress.textContent = S.chapterStars(earned);
  const rewards = document.createElement('small'); rewards.textContent = `${S.chapterLevelsReward}${save.adventure.chaptersDone.includes(chapter) ? ' ✓' : ''}`;
  const starReward = document.createElement('small'); starReward.textContent = `${S.chapterStarsReward}${save.adventure.chaptersAllStars.includes(chapter) ? ' ✓' : ''}`;
  copy.append(heading, progress, rewards, starReward); card.append(art, copy); return card;
}
function chip(text: string): HTMLElement { const value = document.createElement('span'); value.className = 'adventure-chip'; value.textContent = text; return value; }
function button(text: string, cls: string, action: () => void): HTMLButtonElement { const item = document.createElement('button'); item.type = 'button'; item.textContent = text; item.className = cls; item.addEventListener('click', action); return item; }
function mapPath(frontier: number, height: number, pitch: number, centreOffset: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('adventure-map-path'); svg.setAttribute('viewBox', `0 0 600 ${height}`); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
  const points = Array.from({ length: 120 }, (_, index) => { const level = index + 1; const offset = [0, 18, 28, 18, 0, -18, -28, -18][(level - 1) % 8] ?? 0; return { x: 300 + offset * 6, y: (120 - level) * pitch + centreOffset }; });
  const pathFor = (items: typeof points): string => { if (!items.length) return ''; let path = `M ${items[0]!.x} ${items[0]!.y}`; for (let index = 0; index < items.length - 1; index += 1) { const p0 = items[Math.max(0, index - 1)]!; const p1 = items[index]!; const p2 = items[index + 1]!; const p3 = items[Math.min(items.length - 1, index + 2)]!; path += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`; } return path; };
  const base = document.createElementNS(svg.namespaceURI, 'path'); base.setAttribute('d', pathFor(points)); base.classList.add('adventure-path-base'); svg.append(base);
  const doneThrough = Math.max(1, Math.min(120, frontier)); if (doneThrough > 1) { const progress = document.createElementNS(svg.namespaceURI, 'path'); progress.setAttribute('d', pathFor(points.slice(0, doneThrough))); progress.classList.add('adventure-path-progress'); svg.append(progress); }
  return svg;
}
