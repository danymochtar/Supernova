/**
 * The 36 Human Design channels. Each channel is two gates that connect
 * two centers. A channel is "defined" when both of its gates are active
 * (i.e. one of the 26 planetary activations — 13 Personality + 13 Design
 * — landed in each gate). A defined channel lights up both of its end
 * centers; that's how the 9-center bodygraph's defined/undefined map
 * actually gets computed.
 *
 * The list below is the canonical Jovian Archive channel inventory.
 * `circuit` groups them into the three main HD circuit families
 * (Individual / Tribal / Collective); we keep it tagged here so the
 * detail modal in P2 can show the channel's family without a second
 * lookup.
 */

import type { HDCenter } from './types';

export interface HDChannel {
  /** Two gates that complete the channel. Order doesn't matter for the
   *  defined-iff-both-active rule. */
  gates: [number, number];
  /** Two centers this channel connects. */
  centers: [HDCenter, HDCenter];
  /** Channel name (the I Ching synthesis). English-canonical; locale
   *  content packs translate this in `content/humanDesign/channels.*.json`. */
  name: string;
  /** Family the channel belongs to. */
  circuit:
    | 'INDIVIDUAL_KNOWING'
    | 'INDIVIDUAL_CENTERING'
    | 'TRIBAL_ETHIC'
    | 'TRIBAL_DEFENSE'
    | 'COLLECTIVE_LOGIC'
    | 'COLLECTIVE_SENSING'
    | 'INTEGRATION';
}

/** The 36 canonical Human Design channels. */
export const CHANNELS: readonly HDChannel[] = [
  // — Individual circuit / Knowing —
  { gates: [3, 60], centers: ['SACRAL', 'ROOT'], name: 'Mutation', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [14, 2], centers: ['SACRAL', 'G'], name: 'The Beat', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [1, 8], centers: ['G', 'THROAT'], name: 'Inspiration', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [43, 23], centers: ['AJNA', 'THROAT'], name: 'Structuring', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [61, 24], centers: ['HEAD', 'AJNA'], name: 'Awareness', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [22, 12], centers: ['SOLAR_PLEXUS', 'THROAT'], name: 'Openness', circuit: 'INDIVIDUAL_KNOWING' },
  { gates: [39, 55], centers: ['ROOT', 'SOLAR_PLEXUS'], name: 'Emoting', circuit: 'INDIVIDUAL_KNOWING' },

  // — Individual circuit / Centering —
  { gates: [38, 28], centers: ['ROOT', 'SPLEEN'], name: 'Struggle', circuit: 'INDIVIDUAL_CENTERING' },
  { gates: [57, 20], centers: ['SPLEEN', 'THROAT'], name: 'The Brainwave', circuit: 'INDIVIDUAL_CENTERING' },
  { gates: [57, 10], centers: ['SPLEEN', 'G'], name: 'Perfected Form', circuit: 'INDIVIDUAL_CENTERING' },
  { gates: [10, 20], centers: ['G', 'THROAT'], name: 'Awakening', circuit: 'INDIVIDUAL_CENTERING' },

  // — Tribal circuit / Ethic —
  { gates: [37, 40], centers: ['SOLAR_PLEXUS', 'HEART'], name: 'Community', circuit: 'TRIBAL_ETHIC' },
  { gates: [19, 49], centers: ['ROOT', 'SOLAR_PLEXUS'], name: 'Synthesis', circuit: 'TRIBAL_ETHIC' },
  { gates: [26, 44], centers: ['HEART', 'SPLEEN'], name: 'Surrender', circuit: 'TRIBAL_ETHIC' },
  { gates: [21, 45], centers: ['HEART', 'THROAT'], name: 'Money Line', circuit: 'TRIBAL_ETHIC' },

  // — Tribal circuit / Defense —
  { gates: [27, 50], centers: ['SACRAL', 'SPLEEN'], name: 'Preservation', circuit: 'TRIBAL_DEFENSE' },
  { gates: [59, 6], centers: ['SACRAL', 'SOLAR_PLEXUS'], name: 'Mating', circuit: 'TRIBAL_DEFENSE' },

  // — Collective Logic —
  { gates: [42, 53], centers: ['SACRAL', 'ROOT'], name: 'Maturation', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [29, 46], centers: ['SACRAL', 'G'], name: 'Discovery', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [9, 52], centers: ['SACRAL', 'ROOT'], name: 'Concentration', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [5, 15], centers: ['SACRAL', 'G'], name: 'Rhythm', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [7, 31], centers: ['G', 'THROAT'], name: 'The Alpha', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [62, 17], centers: ['THROAT', 'AJNA'], name: 'Acceptance', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [4, 63], centers: ['AJNA', 'HEAD'], name: 'Logic', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [16, 48], centers: ['THROAT', 'SPLEEN'], name: 'The Wavelength', circuit: 'COLLECTIVE_LOGIC' },
  { gates: [18, 58], centers: ['SPLEEN', 'ROOT'], name: 'Judgment', circuit: 'COLLECTIVE_LOGIC' },

  // — Collective Sensing —
  { gates: [13, 33], centers: ['G', 'THROAT'], name: 'The Prodigal', circuit: 'COLLECTIVE_SENSING' },
  { gates: [11, 56], centers: ['AJNA', 'THROAT'], name: 'Curiosity', circuit: 'COLLECTIVE_SENSING' },
  { gates: [64, 47], centers: ['HEAD', 'AJNA'], name: 'Abstraction', circuit: 'COLLECTIVE_SENSING' },
  { gates: [35, 36], centers: ['THROAT', 'SOLAR_PLEXUS'], name: 'Transitoriness', circuit: 'COLLECTIVE_SENSING' },
  { gates: [30, 41], centers: ['SOLAR_PLEXUS', 'ROOT'], name: 'Recognition', circuit: 'COLLECTIVE_SENSING' },

  // — Integration channels (the 4 self-defining channels) —
  { gates: [34, 20], centers: ['SACRAL', 'THROAT'], name: 'Charisma', circuit: 'INTEGRATION' },
  { gates: [34, 57], centers: ['SACRAL', 'SPLEEN'], name: 'Power', circuit: 'INTEGRATION' },
  { gates: [34, 10], centers: ['SACRAL', 'G'], name: 'Exploration', circuit: 'INTEGRATION' },
  { gates: [25, 51], centers: ['G', 'HEART'], name: 'Initiation', circuit: 'INTEGRATION' },
  { gates: [32, 54], centers: ['SPLEEN', 'ROOT'], name: 'Transformation', circuit: 'INTEGRATION' },
] as const;

/** Find the index of a channel given two gate numbers (order-insensitive),
 *  or null if no canonical channel exists for that pair. */
export function channelIndexForGates(g1: number, g2: number): number | null {
  for (let i = 0; i < CHANNELS.length; i++) {
    const [a, b] = CHANNELS[i]!.gates;
    if ((a === g1 && b === g2) || (a === g2 && b === g1)) return i;
  }
  return null;
}
