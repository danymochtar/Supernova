import type { Locale } from '@/lib/i18n/config';
import type { CoreLite } from './score';

export interface CompatibilityPattern {
  key: string;
  /** Title-case label suitable for badge / heading display. */
  title: string;
  /** Plain-text explanation. */
  body: string;
  /** Soft category for color-coding the UI. */
  tone: 'harmony' | 'tension' | 'neutral';
}

interface T {
  // helper messages
  bothMasters: { title: string; body: string };
  sharedKarmicDebt: { title: string; body: string };
  sharedKarmicLessons: (lessons: string) => { title: string; body: string };
  sameLifePath: { title: string; body: string };
  sameSoulUrge: { title: string; body: string };
  sameExpression: { title: string; body: string };
  myLpTheirExpr: { title: string; body: string };
  theirLpMyExpr: { title: string; body: string };
  myLpTheirSu: { title: string; body: string };
  theirLpMySu: { title: string; body: string };
  cycleBookends: { title: string; body: string };
  freedomVsRoot: { title: string; body: string };
  pairedReducedToNine: { title: string; body: string };
  myExprTheirSu: { title: string; body: string };
}

const COPY_ID: T = {
  bothMasters: {
    title: 'Sama-sama membawa angka master',
    body: 'Anda berdua punya energi master di profil inti. Koneksi seperti ini cenderung intens dan transformatif — keduanya hadir dengan misi yang lebih besar dari diri sendiri.',
  },
  sharedKarmicDebt: {
    title: 'Sama-sama membawa karmic debt',
    body: 'Keduanya menjalani pelajaran berat yang serupa. Bisa jadi pemahaman yang dalam — atau saling memicu kalau lukanya belum disadari. Jujurlah pada apa yang sedang Anda berdua proses.',
  },
  sharedKarmicLessons: (lessons) => ({
    title: 'Karmic lesson yang sama',
    body: `Anda berdua sama-sama perlu mengembangkan energi ${lessons}. Bisa jadi area pertumbuhan bersama, atau bisa jadi titik buta yang dua-duanya tidak lihat.`,
  }),
  sameLifePath: {
    title: 'Life Path mirror',
    body: 'Misi hidup yang sama. Pasangan yang saling mengerti tanpa banyak kata, tapi waspada: tantangan dan jebakan kalian juga sama persis — bisa saling menarik ke jurang yang sama.',
  },
  sameSoulUrge: {
    title: 'Soul Urge resonance',
    body: 'Keduanya merindukan hal yang sama secara terdalam. Koneksi emosi yang kuat di tingkat motivasi — kalian "ngerti" satu sama lain di level yang jarang dialami pasangan lain.',
  },
  sameExpression: {
    title: 'Bakat yang serupa',
    body: 'Cara kalian membawa diri ke dunia mirip. Bisa jadi tim yang efektif, tapi juga bisa rebutan ranah yang sama. Diferensiasi peran membantu.',
  },
  myLpTheirExpr: {
    title: 'Misi Anda = bakat alami mereka',
    body: 'Apa yang Anda jalani sebagai misi, mereka memiliki bakat untuk membantunya. Mereka secara intuitif mendukung arah hidup Anda.',
  },
  theirLpMyExpr: {
    title: 'Misi mereka = bakat alami Anda',
    body: 'Apa yang menjadi misi mereka adalah area di mana Anda secara alami kuat. Anda bisa jadi pendukung yang sangat nyata di jalan mereka.',
  },
  myLpTheirSu: {
    title: 'Misi Anda = yang mereka rindukan',
    body: 'Mereka mendambakan apa yang Anda jalani sehari-hari. Anda bisa jadi inspirasi dan refleksi langsung untuk mereka.',
  },
  theirLpMySu: {
    title: 'Misi mereka = yang Anda rindukan',
    body: 'Anda mendambakan apa yang menjadi jalan mereka. Risiko: hidup melalui mereka alih-alih melalui diri sendiri. Pelajaran besarnya: jalankan misi Anda sendiri.',
  },
  cycleBookends: {
    title: '1 dan 9 — siklus bookend',
    body: 'Awal bertemu akhir. Pasangan yang saling melengkapi pada transisi-transisi besar hidup — yang satu memulai, yang lain menyelesaikan.',
  },
  freedomVsRoot: {
    title: 'Kebebasan bertemu akar',
    body: 'Tarik-menarik klasik antara petualangan (5) dan tanggung jawab keluarga (6). Tantangan utama yang bisa jadi pertumbuhan luar biasa — atau jurang yang melebar.',
  },
  pairedReducedToNine: {
    title: 'Pasangan menjumlah ke 9',
    body: 'Kombinasi dengan total reduksi 9 — angka pelayanan & penyelesaian. Sering jadi pasangan yang melayani sesuatu yang lebih besar dari mereka berdua.',
  },
  myExprTheirSu: {
    title: 'Bakat Anda = yang mereka rindukan',
    body: 'Cara Anda muncul ke dunia adalah persis yang mereka idamkan. Anda mungkin terlihat seperti versi ideal dari yang sedang mereka cari.',
  },
};

const COPY_EN: T = {
  bothMasters: {
    title: 'Both carrying master numbers',
    body: 'Both of you have master energy in your core profile. Connections like this tend to be intense and transformative — you both arrive with a mission larger than yourselves.',
  },
  sharedKarmicDebt: {
    title: 'Both carrying karmic debt',
    body: 'Both of you live with similarly heavy lessons. This can become deep understanding — or mutual triggering if the wounds aren\'t conscious. Be honest about what each of you is processing.',
  },
  sharedKarmicLessons: (lessons) => ({
    title: 'Shared karmic lessons',
    body: `Both of you need to develop the ${lessons} energy. This can be a shared growth edge — or a blind spot neither of you sees.`,
  }),
  sameLifePath: {
    title: 'Life Path mirror',
    body: 'Same life mission. A pair that understands each other without words, but careful: your challenges and traps are also identical — you can pull each other into the same ditch.',
  },
  sameSoulUrge: {
    title: 'Soul Urge resonance',
    body: 'Both yearn for the same thing at the deepest level. A strong emotional connection at the motivation layer — you "get" each other at a depth most pairs never reach.',
  },
  sameExpression: {
    title: 'Similar natural talents',
    body: 'You both move through the world the same way. Can be a highly effective team, but you may also compete for the same territory. Role differentiation helps.',
  },
  myLpTheirExpr: {
    title: 'Your mission = their natural talent',
    body: 'What you live as your mission is what they\'re naturally talented at supporting. They intuitively back your direction in life.',
  },
  theirLpMyExpr: {
    title: 'Their mission = your natural talent',
    body: 'What they live as their mission is an area where you\'re naturally strong. You can be a very real support on their path.',
  },
  myLpTheirSu: {
    title: 'Your mission = what they yearn for',
    body: 'They long for what you live every day. You can be direct inspiration and a mirror for them.',
  },
  theirLpMySu: {
    title: 'Their mission = what you yearn for',
    body: 'You long for what they walk. Risk: living through them instead of yourself. The big lesson: walk your own mission.',
  },
  cycleBookends: {
    title: '1 and 9 — cycle bookends',
    body: 'Beginning meets end. A pair that complements each other through major life transitions — one starts, the other completes.',
  },
  freedomVsRoot: {
    title: 'Freedom meets roots',
    body: 'The classic pull between adventure (5) and family responsibility (6). A core challenge that can become extraordinary growth — or a widening rift.',
  },
  pairedReducedToNine: {
    title: 'The pair sums to 9',
    body: 'A combination whose total reduces to 9 — the number of service and completion. Often a pair that serves something larger than the two of them.',
  },
  myExprTheirSu: {
    title: 'Your talent = what they yearn for',
    body: 'How you show up in the world is exactly what they long for. You may look like the ideal version of what they\'re searching for.',
  },
};

export function detectPatterns(
  me: CoreLite,
  them: CoreLite,
  locale: Locale,
): CompatibilityPattern[] {
  const c = locale === 'id' ? COPY_ID : COPY_EN;
  const out: CompatibilityPattern[] = [];

  const meLP = me.lifePath.reduced;
  const themLP = them.lifePath.reduced;
  const meExpr = me.expression.reduced;
  const themExpr = them.expression.reduced;
  const meSU = me.soulUrge.reduced;
  const themSU = them.soulUrge.reduced;

  if (meLP === themLP) out.push({ key: 'sameLifePath', tone: 'neutral', ...c.sameLifePath });
  if (meSU === themSU) out.push({ key: 'sameSoulUrge', tone: 'harmony', ...c.sameSoulUrge });
  if (meExpr === themExpr) out.push({ key: 'sameExpression', tone: 'neutral', ...c.sameExpression });

  // Cross-component LP↔Expression
  if (meLP !== themLP && meLP === themExpr) {
    out.push({ key: 'myLpTheirExpr', tone: 'harmony', ...c.myLpTheirExpr });
  }
  if (meLP !== themLP && themLP === meExpr) {
    out.push({ key: 'theirLpMyExpr', tone: 'harmony', ...c.theirLpMyExpr });
  }
  // Cross-component LP↔Soul Urge
  if (meLP !== themLP && meLP === themSU) {
    out.push({ key: 'myLpTheirSu', tone: 'harmony', ...c.myLpTheirSu });
  }
  if (meLP !== themLP && themLP === meSU) {
    out.push({ key: 'theirLpMySu', tone: 'tension', ...c.theirLpMySu });
  }
  if (meExpr === themSU && meExpr !== themExpr) {
    out.push({ key: 'myExprTheirSu', tone: 'harmony', ...c.myExprTheirSu });
  }

  // Specific archetype combos
  if ((meLP === 1 && themLP === 9) || (meLP === 9 && themLP === 1)) {
    out.push({ key: 'cycleBookends', tone: 'harmony', ...c.cycleBookends });
  }
  if ((meLP === 5 && themLP === 6) || (meLP === 6 && themLP === 5)) {
    out.push({ key: 'freedomVsRoot', tone: 'tension', ...c.freedomVsRoot });
  }
  if (meLP !== themLP) {
    const sum = meLP + themLP;
    const reduced = sum > 9 ? Math.floor(sum / 10) + (sum % 10) : sum;
    if (reduced === 9) {
      out.push({ key: 'pairedReducedToNine', tone: 'harmony', ...c.pairedReducedToNine });
    }
  }

  // Master + master
  const myMasters = [me.lifePath, me.expression, me.soulUrge].filter((x) => x.isMaster).length;
  const theirMasters = [them.lifePath, them.expression, them.soulUrge].filter((x) => x.isMaster).length;
  if (myMasters > 0 && theirMasters > 0) {
    out.push({ key: 'bothMasters', tone: 'harmony', ...c.bothMasters });
  }

  // Karmic debts
  const myDebts = [me.lifePath, me.expression, me.soulUrge].some((x) => x.karmicDebt);
  const theirDebts = [them.lifePath, them.expression, them.soulUrge].some((x) => x.karmicDebt);
  if (myDebts && theirDebts) {
    out.push({ key: 'sharedKarmicDebt', tone: 'tension', ...c.sharedKarmicDebt });
  }

  // Shared karmic lessons
  const shared = me.karmicLessons.filter((n) => them.karmicLessons.includes(n));
  if (shared.length > 0) {
    out.push({ key: 'sharedKarmicLessons', tone: 'tension', ...c.sharedKarmicLessons(shared.join(', ')) });
  }

  return out;
}
