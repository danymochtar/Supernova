/**
 * Template-based explanation renderer. Plain Bahasa Indonesia per Ground
 * Rule 6 — calm, warm, no exclamation marks, no absolute predictions.
 *
 * Later iteration may swap in an AI call; the input shape here matches
 * a future `generateNarrative()` so the swap stays surgical.
 */

import type { ConnectionReading } from './types';

/** Relationship number meanings — one word each, keyed by the reduced /
 *  master-preserved relationship number. Interpolated into the SOULMATE
 *  template's "{relationshipMeaning}" slot. */
const RELATIONSHIP_MEANING: Record<number, string> = {
  1: 'kemandirian',
  2: 'harmoni',
  3: 'ekspresi',
  4: 'kestabilan',
  5: 'kebebasan',
  6: 'kepedulian',
  7: 'refleksi',
  8: 'ambisi',
  9: 'penerimaan',
  11: 'inspirasi (master)',
  22: 'pembangun (master)',
  33: 'pengasuhan (master)',
};

function meaningOf(n: number): string {
  return RELATIONSHIP_MEANING[n] ?? 'proses';
}

/** Which karmic debt number to reference in the KARMIC template. */
function pickKarmicDebtNumber(reading: ConnectionReading): number {
  // pair debt (13/14/16/19 from lpA + lpB) wins over per-person debts.
  if ([13, 14, 16, 19].includes(reading.pairSumRaw)) return reading.pairSumRaw;
  if (reading.a.karmicDebt) return reading.a.karmicDebt.number;
  if (reading.b.karmicDebt) return reading.b.karmicDebt.number;
  return 0;
}

/** Render the primary explanation paragraph. */
export function explainConnection(reading: ConnectionReading): string {
  const rn = reading.relationshipNumber;
  const rnMeaning = meaningOf(rn);
  const parts: string[] = [];

  switch (reading.primary) {
    case 'SOULMATE': {
      parts.push(
        `Life path kalian ada di grup yang sama, jadi secara natural kalian mudah nyambung.`,
        `Angka hubungan kalian adalah ${rn} — angka yang menggambarkan ${rnMeaning}.`,
        `Koneksi seperti ini biasanya terasa nyaman dan familiar, seperti sudah kenal lama.`,
        `Yang perlu dijaga bukan kedekatannya, tapi ruang untuk masing-masing tetap jadi diri sendiri.`,
      );
      break;
    }
    case 'KARMIC': {
      const debt = pickKarmicDebtNumber(reading);
      parts.push(
        `Ada angka karmic debt (${debt}) yang muncul di kombinasi kalian.`,
        `Dalam numerologi, ini dibaca sebagai hubungan yang datang membawa pelajaran — bukan hukuman.`,
        `Koneksi seperti ini biasanya intens dan kadang melelahkan.`,
        `Perhatikan pola yang terus berulang; biasanya di situ pelajarannya.`,
      );
      break;
    }
    case 'TWIN_FLAME': {
      parts.push(
        `Angka kalian saling memantul — ini penanda twin flame dalam numerologi.`,
        `Hubungan seperti ini sering terasa seperti bercermin: apa yang kamu lihat pada dirinya sering kali adalah bagian dari dirimu sendiri.`,
        `Twin flame tidak selalu berarti bersama secara fisik, tapi koneksinya cenderung terasa kuat bahkan saat berjauhan.`,
      );
      break;
    }
    case 'NEUTRAL':
    default: {
      parts.push(
        `Tidak ada penanda khusus di kombinasi angka kalian — dan itu bukan hal buruk.`,
        `Banyak hubungan baik yang tumbuh pelan tanpa label.`,
        `Angka hubungan kalian adalah ${rn} — energi ${rnMeaning}.`,
        `Koneksi ini masih berkembang, biarkan waktu yang menunjukkan arahnya.`,
      );
      break;
    }
  }

  // Undertone lines (append when relevant, one line each).
  if (reading.undertones.includes('karmicUndertone') && reading.primary !== 'KARMIC') {
    parts.push(
      `Ada karmic debt yang dibawa salah satu dari kalian — biasanya muncul sebagai pola berulang yang minta diselesaikan.`,
    );
  }
  if (reading.undertones.includes('amplified')) {
    parts.push(
      `Ada master number di kombinasi kalian, jadi intensitas hubungan ini cenderung lebih tinggi dari biasanya.`,
    );
  }

  return parts.join(' ');
}
