export enum MemeTone {
  FUNNY = 'funny',
  SARCASTIC = 'sarcastic',
  SAVAGE = 'savage',
  RELATABLE = 'relatable'
}

export interface ReelSong {
  name: string;
  artist: string;
  reason: string;
}

export interface MemeCaptions {
  funny: string;
  sarcastic: string;
  savage: string;
  relatable: string;
}

export interface MemeResult {
  captions: MemeCaptions;
  songs: Record<MemeTone, ReelSong>;
}

export interface StaticMeme {
  url: string;
  topText: string;
  bottomText: string;
}

export interface SiteStats {
  memesCreated: number;
  downloads: number;
  creatorsJoined: number;
}

export interface MemeState {
  imageSource: string | null;
  captions: MemeCaptions | null;
  songs: Record<MemeTone, ReelSong> | null;
  selectedTone: MemeTone;
  isGenerating: boolean;
  error: string | null;
  credits: number;
}
