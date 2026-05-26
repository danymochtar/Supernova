/**
 * Shared "natural voice" rules injected into every generative prompt so the
 * prose doesn't read as AI-written. Kills the common tells:
 *   - uniform "[Name] is someone who…" openers,
 *   - em/en dashes used to splice clauses,
 *   - the "X, not Y" / "not just X but Y" negation framing,
 *   - showing off English vocabulary (gratuitous code-switching),
 *   - overused reflective clichés.
 *
 * Each prompt's ID branch embeds VOICE_ID; the EN branch (which
 * localizeEnglishPrompt adapts to the other locales) embeds VOICE_EN.
 */

export const VOICE_ID = `GAYA BAHASA (PENTING — biar nggak kerasa "ditulis AI"):
- Buka tiap teks dengan cara BEDA. HINDARI template seragam kayak "[Nama] adalah sosok yang…", "[Nama] adalah orang yang…", "[Nama] adalah pribadi yang…". Mulai dari satu observasi tajam, gambaran konkret, ketegangan, sapaan langsung, atau langsung ke inti.
- JANGAN pakai em-dash (—) atau en-dash (–) buat nyelipin klausa atau ngasih jeda dramatis. Pakai titik, koma, tanda kurung, atau pecah jadi kalimat terpisah. (Tanda hubung biasa "-" di kata kayak "sehari-hari" tetep boleh.)
- JANGAN nge-frame pakai negasi: "X, bukan Y", "ini bukan A tapi B", "bukan sekadar X tapi Y", "bukan cuma X tapi juga Y". Itu pola paling khas AI. Sampaikan langsung apa adanya.
- Tulis Bahasa Indonesia yang natural. JANGAN pamer kosakata Inggris atau nyelipin kata Inggris biar kelihatan keren — itu tell AI. Hindari kata kayak "genuinely", "consequence", "meaningful", "layer", "good timing", "resolve", "sign off", "at face value", "heavy", "actually", "literally". Pakai padanan Indonesia yang wajar. Istilah Inggris yang emang dipakai sehari-hari orang Indonesia ("vibe", "mood", "deadline", "meeting", "chat", "oke") boleh seperlunya, jangan dipaksa.
- HINDARI klise reflektif overused: "Di balik X ada Y", "perpaduan yang terus berproses", "kekuatannya justru tumbuh dari…", "dua energi yang saling mengisi".
- Nada: teman yang jeli & hangat lagi ngobrol, bukan esai. Konkret, spesifik, manusiawi.`;

export const VOICE_EN = `VOICE (IMPORTANT — don't sound "AI-written"):
- Open each text DIFFERENTLY. AVOID the uniform "[Name] is someone who…" / "[Name] is a person who…" template. Start from a sharp observation, a concrete image, a tension, a direct address, or straight to the point.
- DO NOT use em-dashes (—) or en-dashes (–) to splice in clauses or add dramatic pauses. Use periods, commas, parentheses, or separate sentences. (A normal hyphen "-" in compound words is fine.)
- DO NOT frame things via negation: "X, not Y", "this isn't A, it's B", "not just X but Y", "not only X but also Y". It's the most classic AI tell. Say it plainly.
- Write plainly. DON'T show off vocabulary or reach for fancy words to sound clever — that's an AI tell. Use ordinary, human words.
- AVOID overused reflective clichés: "Behind X lies Y", "a blend still in progress", "its strength grows precisely from…", "two energies that complete each other".
- Tone: a perceptive, warm friend talking, not an essay. Concrete, specific, human.`;
