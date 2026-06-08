import type { Locale } from '@/lib/i18n/config';

/**
 * Elaborated Personal Month detail for the journey strip's tap-to-detail
 * modal. PM is always 1-9 (masters are NOT preserved at the month level
 * per Decoz / World Numerology — `personalMonth` reduces to a single
 * digit, see `personal.ts`), so the pack covers digits 1-9 only.
 *
 * Each entry has four sections:
 *
 *   - `essence`        — 1-2 sentences naming the month's texture / lens.
 *                         The "what this month is about" paragraph.
 *   - `personalTips`   — mindset / practice / self-care for the month.
 *   - `moneyTips`      — money + career angle: what's favored, what's not.
 *   - `loveTips`       — relationship + romance angle.
 *
 * The angles are deliberately separated because daily reading prose
 * weaves them; the modal is the user's one place to see each one called
 * out. Kept deterministic (no AI cost on every modal open).
 */
export interface PersonalMonthDetail {
  essence: string;
  personalTips: string;
  moneyTips: string;
  loveTips: string;
}

const ID: Record<number, PersonalMonthDetail> = {
  1: {
    essence:
      'Bulan Personal 1 — bab baru dalam siklus 9 bulan. Energi inisiasi, awal yang fresh; apa yang kamu mulai bulan ini akan bergema sepanjang siklus.',
    personalTips:
      'Ambil inisiatif tanpa nungguin restu orang lain. Tulis satu niat baru di awal bulan dan jagain itu — tindakan kecil yang konsisten lebih bermakna dari ledakan motivasi sesaat.',
    moneyTips:
      'Cocok buat launching project, pitch ide, nego posisi baru, atau buka revenue stream. Hindari investasi gambling — kamu lagi fase menanam, bukan panen. Jangan mulai banyak hal sekaligus, fokus satu pijakan dulu.',
    loveTips:
      'Single? Energi magnetisme naik — keluar dari rutinitas bisa bawa kenalan baru. Pasangan? Bulan reset hubungan: ngomong jujur soal apa yang kamu mau ke depan, jangan asumsiin pasangan udah tau.',
  },
  2: {
    essence:
      'Bulan Personal 2 — bangun perlahan. Energi kolaborasi, kepekaan, dan detail. Bukan saat untuk dorongan agresif; progress datang dari kerjasama dan kesabaran.',
    personalTips:
      'Slow down, dengerin lebih banyak. Keputusan terbaik bulan ini lahir dari refleksi tenang, bukan reaksi cepat. Rawat kebutuhan emosional sendiri sebelum kewalahan ngurus orang lain.',
    moneyTips:
      'Bulan bagus buat partnership, deal kolaboratif, atau beresin admin & detail finansial. Hindari konfrontasi keras soal uang atau pengeluaran impulsif besar. Trust yang dibangun sekarang sering jadi modal panen di PM 8.',
    loveTips:
      'Bulan keintiman emosional — pasangan butuh kehadiran, bukan grand gesture. Single? Koneksi yang lahir di PM 2 cenderung dalam dan slow burn, bukan instant chemistry.',
  },
  3: {
    essence:
      'Bulan Personal 3 — ekspresi, kreativitas, sosial. Energi naik, mood ringan, ide-ide ngalir. Cocok untuk dilihat, dilibatkan, didengar.',
    personalTips:
      'Kasih ruang buat main, ekspresi, kreasi — bahkan kalau cuma 30 menit sehari. Hati-hati scatter energy: terlalu banyak hal sekaligus = nggak ada yang selesai. Pilih 1-2 hal kreatif yang paling penting.',
    moneyTips:
      'Cocok buat marketing, branding, networking, presentation, atau jualan lewat konten. Pengeluaran lebih gampang lepas bulan ini — set budget hiburan. Income kreatif (komisi, side project) bisa tiba-tiba muncul.',
    loveTips:
      'Bulan flirty dan playful. Single? Banyak peluang sosial — keluar lebih sering. Pasangan? Bawa fun balik ke hubungan: tertawa bareng, coba hal baru. Hindari overpromise di mood yang lagi tinggi.',
  },
  4: {
    essence:
      'Bulan Personal 4 — kerja, struktur, fondasi. Bulan disiplin dan eksekusi pelan tapi pasti. Hasil yang bertahan lahir dari kerja konsisten, bukan shortcut.',
    personalTips:
      'Bangun sistem yang berfungsi: rutinitas pagi, jadwal olahraga, batas waktu kerja. Lelah fisik bisa numpuk — jaga tidur dan body care. Ngerasa berat bulan ini wajar, bukan tanda salah arah.',
    moneyTips:
      'Cocok buat ngerapihin keuangan: bayar utang, evaluasi pengeluaran, set up tabungan otomatis. Investasi konservatif lebih cocok daripada gambling. Pemasukan dari kerja keras, bukan luck.',
    loveTips:
      'Bulan bangun pondasi hubungan: bahas hal serius (komitmen, rencana keuangan, tinggal bareng). Pasangan mungkin terasa terlalu seriusin segala hal — jaga ruang ringan juga. Single? Cari yang stabil & jelas niatnya, bukan drama.',
  },
  5: {
    essence:
      'Bulan Personal 5 — perubahan, kebebasan, unexpected. Banyak hal bergerak — orang, situasi, kesempatan. Variety naik tajam; rutinitas bisa kerasa sempit.',
    personalTips:
      'Welcome perubahan, jangan ditahan. Tapi jangan ngambil keputusan permanen di tengah bulan yang volatile ini — endapkan dulu. Aktivitas fisik dan eksplorasi (jalan baru, makanan baru, kota baru) merelease energi yang menumpuk.',
    moneyTips:
      'Volatile — pemasukan bisa unexpected, pengeluaran juga. Hindari komitmen finansial jangka panjang (KPR, beli aset besar) bulan ini. Side income atau opportunity baru sering muncul — eksplorasi bebas dulu, commit nanti.',
    loveTips:
      'Bulan tergoda. Single? Banyak chemistry tapi cepet bosen — sadar pola. Pasangan? Kasih ruang nafas masing-masing; jangan klingy. Komitmen yang dibuat di PM 5 cenderung kena re-evaluasi — tunggu PM 6 buat keputusan keluarga.',
  },
  6: {
    essence:
      'Bulan Personal 6 — tanggung jawab, rumah, keluarga. Fokus geser ke orang-orang yang kamu sayang. Bulan paling subur untuk cinta dan komitmen.',
    personalTips:
      'Rawat orang dekat tanpa kehilangan diri. Hati-hati savior syndrome: kamu bukan pertanggungjawaban semua orang. Estetika & home environment naik mood — beresin rumah atau ruang kerja.',
    moneyTips:
      'Pengeluaran untuk keluarga / rumah naik (renovasi, kebutuhan ortu, anak). Cocok buat beli aset hunian, asuransi keluarga, atau dana pendidikan. Karier di healing / teaching / hospitality lagi subur.',
    loveTips:
      'Bulan pernikahan, lamaran, kehamilan, atau pindah serumah sering jatuh di sini. Pasangan: deepen komitmen, talk about future. Single? Cari kualitas care-giver / kemampuan bangun rumah, bukan cuma chemistry.',
  },
  7: {
    essence:
      'Bulan Personal 7 — refleksi, studi, introspeksi. Energi menyendiri, dalam, pencarian makna. Bukan bulan untuk push agresif eksternal.',
    personalTips:
      'Ambil quiet time setiap hari — jurnal, meditasi, baca, jalan sendiri. Hindari forcing decisions ketika bingung; jawaban datang dalam keheningan. Sosial yang terlalu padat menghabiskan energi lebih cepat bulan ini.',
    moneyTips:
      'Bukan bulan agresif — push deal yang masih ngambang biasanya backfire. Cocok buat upskilling, riset pasar, review portfolio, atau cuti panjang. Pemasukan stabil; bukan growth-month finansial.',
    loveTips:
      'Pasangan butuh ruang sendiri-sendiri, jangan diambil personal. Bagus buat conversation yang dalam, bukan light banter. Single? Bulan ini lebih sehat dibikin untuk self-knowledge daripada cari pasangan baru.',
  },
  8: {
    essence:
      'Bulan Personal 8 — panen, kuasa, hasil material. Bulan paling subur untuk karier dan keuangan. Manifestasi kerja keras yang sudah ditanam sebelumnya.',
    personalTips:
      'Tampil percaya diri, ambil pijakan otoritas. Hindari ego trap: power bukan dominasi. Jaga keseimbangan — workaholic mode di PM 8 bisa habiskan kesehatan dan hubungan.',
    moneyTips:
      'Bulan deal besar, promosi, raise, investasi return, deal closing. Push project finansial penting sekarang. Hati-hati pengeluaran besar yang impulsif karena lagi confident — review keputusan beli besar 24 jam dulu.',
    loveTips:
      'Karier bisa nyedot perhatian dari pasangan — sengaja luangin waktu. Single? Magnet sama orang ambisius / berada. Pasangan: gestur kecil yang konsisten lebih bermakna dari liburan mewah.',
  },
  9: {
    essence:
      'Bulan Personal 9 — penutupan, pelepasan, completion. Bulan terakhir siklus 9-bulan; yang nggak lagi melayani perlu dilepas biar PM 1 berikutnya bisa fresh.',
    personalTips:
      'Lepas yang nggak sesuai lagi — kebiasaan, komitmen, item fisik. Emosi bisa naik tajam dan tak terduga — kasih ruang. Hindari mulai project besar baru, fokus ke ngeberesin yang ada.',
    moneyTips:
      'Bulan beresin urusan: lunasin utang kecil, tutup akun nganggur, evaluasi langganan, finalize proyek yang menggantung. Bukan bulan launching baru. Refund / closing payment / settled bonus sering muncul.',
    loveTips:
      'Hubungan yang udah selesai biasanya benar-benar tutup di bulan ini — itu kabar baik, ruang dibuka. Pasangan: tutup konflik lama, jangan dibawa ke siklus berikutnya. Single? Lepas attachment ke masa lalu; PM 1 berikutnya baru kondusif buat fresh start.',
  },
};

const EN: Record<number, PersonalMonthDetail> = {
  1: {
    essence:
      "Personal Month 1 — a new chapter in the 9-month cycle. Initiation energy, fresh start; what you begin this month will echo through the rest of the cycle.",
    personalTips:
      "Take initiative without waiting for permission. Write one new intention at the start of the month and protect it — small consistent action means more than a burst of motivation.",
    moneyTips:
      "Right for launching a project, pitching an idea, negotiating a new role, opening a revenue stream. Avoid gambling investments — you're planting, not harvesting. Don't start many things at once; focus one foothold first.",
    loveTips:
      "Single? Your magnetism rises — breaking routine brings new introductions. Partnered? A relationship reset month: speak honestly about what you want ahead, don't assume your partner already knows.",
  },
  2: {
    essence:
      "Personal Month 2 — slow build. Cooperation, sensitivity, attention to detail. Not the month for aggressive pushing; progress comes through partnership and patience.",
    personalTips:
      "Slow down, listen more. The best calls this month come from quiet reflection, not quick reactions. Tend your own emotional needs before getting overwhelmed caring for others.",
    moneyTips:
      "A strong month for partnerships, collaborative deals, or tidying financial admin and detail. Avoid hard money confrontations and impulsive big spends. Trust built now often becomes the harvest capital of PM 8.",
    loveTips:
      "A month of emotional intimacy — your partner needs presence, not grand gestures. Single? Connections that start in PM 2 tend to be deep and slow-burn, not instant chemistry.",
  },
  3: {
    essence:
      "Personal Month 3 — expression, creativity, social. Energy lifts, mood lightens, ideas flow. Right for being seen, included, heard.",
    personalTips:
      "Make room to play, express, create — even 30 minutes a day. Beware scattered energy: too many things at once means nothing finishes. Pick the one or two creative things that matter most.",
    moneyTips:
      "Right for marketing, branding, networking, presentations, or content-based selling. Spending leaks more easily this month — set an entertainment budget. Creative income (commissions, side projects) often surfaces unexpectedly.",
    loveTips:
      "A flirty, playful month. Single? Plenty of social opportunities — go out more. Partnered? Bring fun back: laugh together, try something new. Avoid overpromising in the high mood.",
  },
  4: {
    essence:
      "Personal Month 4 — work, structure, foundation. A month of discipline and slow but durable execution. Lasting results come from steady work, not shortcuts.",
    personalTips:
      "Build systems that actually function: morning routine, workout schedule, work-stop time. Physical fatigue can stack — protect sleep and bodywork. Feeling heavy this month is normal, not a sign you're off track.",
    moneyTips:
      "Right for tidying finances: pay off debts, audit spending, set up auto-savings. Conservative investments fit better than gambles. Income comes from hard work, not luck.",
    loveTips:
      "A month for building relationship foundation: have the serious talks (commitment, money plans, moving in). A partner may feel you're treating everything too seriously — keep room for lightness too. Single? Look for stable and clear-intentioned, not drama.",
  },
  5: {
    essence:
      "Personal Month 5 — change, freedom, the unexpected. Many things move — people, situations, opportunities. Variety spikes; routine can feel tight.",
    personalTips:
      "Welcome change, don't resist. But don't make permanent decisions in the middle of this volatile month — let them settle first. Physical activity and exploration (new routes, foods, cities) release the energy that builds up.",
    moneyTips:
      "Volatile — income can be unexpected, so can spending. Avoid long-term financial commitments (mortgages, big asset purchases) this month. New side income or opportunity often surfaces — explore freely, commit later.",
    loveTips:
      "A tempting month. Single? Lots of chemistry but it gets boring fast — notice the pattern. Partnered? Give each other breathing room; don't cling. Commitments made in PM 5 tend to get re-evaluated — wait for PM 6 for family decisions.",
  },
  6: {
    essence:
      "Personal Month 6 — responsibility, home, family. Focus shifts to the people you love. The most fertile month for love and commitment.",
    personalTips:
      "Care for the close ones without losing yourself. Watch for savior syndrome: you're not responsible for everyone. Aesthetics and home environment lift mood — tidy the house or workspace.",
    moneyTips:
      "Spending on family / home rises (renovations, parents' needs, kids). Right for buying residential assets, family insurance, or education funds. Careers in healing, teaching, hospitality are particularly fertile now.",
    loveTips:
      "Marriage, engagement, pregnancy, or moving in together often falls here. Partnered: deepen commitment, talk about the future. Single? Look for care-giving capacity, ability to build a home — not just chemistry.",
  },
  7: {
    essence:
      "Personal Month 7 — reflection, study, introspection. Solitary, deep, meaning-seeking energy. Not a month for aggressive external pushing.",
    personalTips:
      "Take quiet time daily — journal, meditate, read, walk alone. Avoid forcing decisions when confused; answers come in the silence. Over-packed social schedules drain energy faster this month.",
    moneyTips:
      "Not an aggressive month — pushing dangling deals tends to backfire. Right for upskilling, market research, portfolio review, or a longer break. Income stays steady; this isn't a financial growth month.",
    loveTips:
      "A partner needing alone time isn't personal — don't take it that way. Good for the deeper conversations, not light banter. Single? This month is healthier used for self-knowledge than chasing someone new.",
  },
  8: {
    essence:
      "Personal Month 8 — harvest, power, material results. The most fertile month for career and finance. Manifestation of work planted earlier.",
    personalTips:
      "Show up confident, claim your authority. Avoid the ego trap: power isn't domination. Hold the balance — workaholic mode in PM 8 can burn through health and relationships.",
    moneyTips:
      "Big-deal month: promotions, raises, investment returns, closings. Push the important financial moves now. Beware impulsive big spending while feeling confident — sit on any large purchase 24 hours first.",
    loveTips:
      "Career can absorb attention from a partner — make deliberate time. Single? You'll magnetize ambitious or well-resourced people. Partnered: small consistent gestures mean more than lavish trips.",
  },
  9: {
    essence:
      "Personal Month 9 — closing, release, completion. The last month of the 9-month cycle; what no longer serves needs to be released so the next PM 1 can land clean.",
    personalTips:
      "Let go of what no longer fits — habits, commitments, physical items. Emotions can rise sharply and unexpectedly — make room. Avoid starting big new projects; focus on finishing what's already on the plate.",
    moneyTips:
      "A month for closing the loop: pay off small debts, close dormant accounts, audit subscriptions, finalize hanging projects. Not a launch month. Refunds, closing payments, settled bonuses often surface.",
    loveTips:
      "Relationships that have run their course tend to truly close this month — that's the good news, space opens. Partnered: close old conflicts, don't drag them into the next cycle. Single? Release attachment to past crushes; next month's PM 1 is the actual fresh start window.",
  },
};

/**
 * Look up the elaborated detail for a Personal Month (1-9) in the user's
 * locale. Other locales fall back to ID until the pack is translated.
 * Returns `null` if `pm` is outside 1-9 (shouldn't happen — PM always
 * reduces to a single digit).
 */
export function personalMonthDetail(pm: number, locale: Locale): PersonalMonthDetail | null {
  const pack = locale === 'en' ? EN : ID;
  return pack[pm] ?? null;
}
