export type CreditId =
  | 'oga-lofi'
  | 'fs-325583'
  | 'fs-802606'
  | 'fs-442772'
  | 'fs-500912'
  | 'kenney-interface'
  | 'kenney-impact'
  | 'kenney-casino'
  | 'kenney-jingles'
  | 'original';

export type CreditGroup = 'Music' | 'Sound effects' | 'Code and art';

export interface Credit {
  id: CreditId;
  group: CreditGroup;
  title: string;
  author: string;
  site: string;
  url: string;
  licence: string;
  licenceUrl: string;
}

const cc0 = 'CC0';
const cc0Url = 'https://creativecommons.org/publicdomain/zero/1.0/';

export const CREDITS: readonly Credit[] = [
  { id: 'oga-lofi', group: 'Music', title: 'Lofi Hip Hop Loop', author: 'omfgdude', site: 'OpenGameArt', url: 'https://opengameart.org/content/lofi-hip-hop-loop', licence: cc0, licenceUrl: cc0Url },
  { id: 'fs-325583', group: 'Sound effects', title: 'mouth pops - wet - room.flac', author: 'cbenci', site: 'Freesound', url: 'https://freesound.org/people/cbenci/sounds/325583/', licence: cc0, licenceUrl: cc0Url },
  { id: 'fs-802606', group: 'Sound effects', title: 'Pops - Mouth', author: 'JelloApocalypse', site: 'Freesound', url: 'https://freesound.org/people/JelloApocalypse/sounds/802606/', licence: cc0, licenceUrl: cc0Url },
  { id: 'fs-442772', group: 'Sound effects', title: 'Slime Squish', author: 'qubodup', site: 'Freesound', url: 'https://freesound.org/people/qubodup/sounds/442772/', licence: cc0, licenceUrl: cc0Url },
  { id: 'fs-500912', group: 'Sound effects', title: 'Squish impact', author: 'Bertsz', site: 'Freesound', url: 'https://freesound.org/people/Bertsz/sounds/500912/', licence: cc0, licenceUrl: cc0Url },
  { id: 'kenney-interface', group: 'Sound effects', title: 'Interface Sounds', author: 'Kenney', site: 'Kenney', url: 'https://kenney.nl/assets/interface-sounds', licence: cc0, licenceUrl: cc0Url },
  { id: 'kenney-impact', group: 'Sound effects', title: 'Impact Sounds', author: 'Kenney', site: 'Kenney', url: 'https://kenney.nl/assets/impact-sounds', licence: cc0, licenceUrl: cc0Url },
  { id: 'kenney-casino', group: 'Sound effects', title: 'Casino Audio', author: 'Kenney', site: 'Kenney', url: 'https://kenney.nl/assets/casino-audio', licence: cc0, licenceUrl: cc0Url },
  { id: 'kenney-jingles', group: 'Sound effects', title: 'Music Jingles', author: 'Kenney', site: 'Kenney', url: 'https://kenney.nl/assets/music-jingles', licence: cc0, licenceUrl: cc0Url },
  { id: 'original', group: 'Code and art', title: 'Code, art and synth sounds', author: 'made for Gloop Pop', site: '', url: '', licence: '', licenceUrl: '' },
];

export function creditLine(credit: Credit): string {
  if (credit.id === 'original') return `${credit.title}: ${credit.author}.`;
  return `${credit.title} by ${credit.author} · ${credit.licence} · ${credit.site}`;
}

export function creditAriaLabel(credit: Credit): string {
  return `Open ${credit.title} on ${credit.site}`;
}
