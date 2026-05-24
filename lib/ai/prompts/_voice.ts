/**
 * Shared "natural voice" rules injected into the synthesis-style AI
 * prompts (About You, Percintaan, Keuangan). They exist to kill the
 * tells that make generated prose read as AI-written:
 *   - the uniform "[Name] adalah sosok yang…" / "[Name] is someone who…"
 *     opener every reading defaults to,
 *   - the "X — bukan Y" / "this isn't A, but B" / "not just X but Y"
 *     hedge construction,
 *   - overused reflective clichés.
 *
 * Each prompt's ID branch embeds VOICE_ID; the EN branch (which
 * localizeEnglishPrompt adapts to the other locales) embeds VOICE_EN.
 */

export const VOICE_ID = `GAYA BAHASA (PENTING — biar nggak kerasa "ditulis AI"):
- Buka tiap bacaan dengan cara BEDA. HINDARI template seragam "[Nama] adalah sosok yang…", "[Nama] adalah orang yang…", "[Nama] adalah pribadi yang…". Boleh mulai dari satu observasi tajam, satu gambaran konkret, satu ketegangan, sapaan langsung, atau langsung ke inti — yang penting hidup, bukan rumus.
- HINDARI konstruksi negasi "X — bukan Y", "ini bukan A, tapi B", "bukan sekadar X tapi Y". Itu pola khas AI. Sampaikan langsung tanpa nge-frame lewat negasi.
- HINDARI klise reflektif yang overused: "Di balik X ada Y", "perpaduan yang terus berproses", "kekuatannya justru tumbuh dari…", "dua energi yang saling mengisi". Cari frasa yang lebih segar dan spesifik ke orang ini.
- Nada: teman yang jeli & hangat lagi ngobrol — bukan esai. Konkret, spesifik, manusiawi.`;

export const VOICE_EN = `VOICE (IMPORTANT — don't sound "AI-written"):
- Open each reading DIFFERENTLY. AVOID the uniform template "[Name] is someone who…", "[Name] is a person who…". Start from a sharp observation, a concrete image, a tension, a direct address, or straight to the point — alive, not formulaic.
- AVOID the negation construction "X — not Y", "this isn't A, but B", "not just X but Y". It's a classic AI tell. Say it directly without framing via negation.
- AVOID overused reflective clichés: "Behind X lies Y", "a blend still in progress", "its strength grows precisely from…", "two energies that complete each other". Find fresher phrasing specific to this person.
- Tone: a perceptive, warm friend talking — not an essay. Concrete, specific, human.`;
