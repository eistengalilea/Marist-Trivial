export type CategoryColorId =
  | 'blue'
  | 'pink'
  | 'yellow'
  | 'purple'
  | 'green'
  | 'orange';

export type EmblemKind =
  | 'compass'
  | 'diamond'
  | 'star'
  | 'hex'
  | 'leaf'
  | 'flame';

export interface CategoryConfig {
  id: CategoryColorId;
  colorName: string;
  hex: string;
  lightHex: string;
  darkHex: string;
  emblem: EmblemKind;
  unassignedLabel: string;
}

export type SpaceKind = 'hub' | 'hq' | 'spoke' | 'ring' | 'roll_again';

export interface BoardSpace {
  id: string;
  kind: SpaceKind;
  category: CategoryColorId | null;
  position: [number, number, number];
  angle: number;
  radius: number;
  neighbors: string[];
  spokeIndex: number | null;
  spokeStep: number | null;
  ringIndex: number | null;
  label: string;
}

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  cpuAccuracy: number;
  summary: string;
}

export type MatchLength = 'short' | 'medium' | 'long';

export interface MatchLengthConfig {
  id: MatchLength;
  label: string;
  questionsPerWedge: number;
  summary: string;
}

export interface PlayerConfig {
  id: string;
  name: string;
  rimHex: string;
  isCpu: boolean;
}

export interface PlayerState extends PlayerConfig {
  spaceId: string;
  wedges: Record<CategoryColorId, boolean>;
  categoryProgress: Record<CategoryColorId, number>;
}

export type GamePhase =
  | 'idle'
  | 'rolling'
  | 'choosing_move'
  | 'moving'
  | 'challenge'
  | 'final_challenge'
  | 'won';

export type CameraPreset = 'overview' | 'top' | '2d' | 'follow';

export type HighlightFilter =
  | 'none'
  | 'hub'
  | 'all_hq'
  | 'all_roll_again'
  | 'all_spokes'
  | 'all_ring'
  | CategoryColorId;

import type { TriviaQuestion } from './questions';

export interface ActiveChallenge {
  playerId: string;
  spaceId: string;
  kind: 'standard' | 'hq' | 'hub_choice' | 'final';
  category: CategoryColorId | null;
  needsCategoryChoice: boolean;
  question: TriviaQuestion | null;
  selectedOptionIndex: number | null;
  isRevealed: boolean;
}
