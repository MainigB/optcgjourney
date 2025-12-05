import AsyncStorage from '@react-native-async-storage/async-storage';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

export type Dice = 'won' | 'lost' | 'none';
export type Order = 'first' | 'second';
export type Result = 'win' | 'loss';

export interface Round {
  id: string;
  num: number;
  opponentLeader?: string; // deck do oponente (do autocomplete)
  dice: Dice;
  order: Order;
  result: Result;
  isBye?: boolean; // round de BYE: conta no placar, mas não em estatísticas/aggregações
}

export interface Tournament {
  id: string;
  name: string;
  deck: string;   // seu deck (do autocomplete)
  date: number;
  set?: string;
  type?: string;
  wins: number;   // sempre recalculado a partir de rounds
  losses: number;
  rounds?: Round[];
  finalized?: boolean; // <- NOVO: quando true, bloqueia adição de rounds
}

const K_TOURNAMENTS = 'tournaments'; // legado (sem compressão)
const K_TOURNAMENTS_V2 = 'tournaments_v2_utf16'; // novo (com compressão)

function serializeCompressed(obj: unknown): string {
  const json = JSON.stringify(obj);
  return compressToUTF16(json);
}

function deserializeCompressed(payload: string | null): unknown {
  if (!payload) return null;
  const json = decompressFromUTF16(payload);
  if (!json) return null;
  return JSON.parse(json);
}

// ---------------- Normalização / Coerção ----------------
export function wrPercent(wins: number, losses: number) {
  const total = wins + losses;
  if (!total) return 0;
  return Math.round((wins / total) * 100);
}

/** Converte emojis de cores para letras */
function migrateEmojisToLetters(s: string): string {
  return (s || '')
    .replace(/🟢/g, 'G')
    .replace(/🔵/g, 'U')
    .replace(/🟣/g, 'P')
    .replace(/⚫/g, 'B')
    .replace(/🔴/g, 'R')
    .replace(/🟡/g, 'Y');
}

/** Chave exata p/ comparar rótulos sem "achatar" set/emoji (mantém OPxx/STxx e cores). */
export function deckKeyExact(s: string) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, ' ')                              // normaliza espaços
    .trim();                                           // NÃO baixa caixa, NÃO remove emoji
}

// chave canônica p/ comparar nomes de decks (remove emoji/acentos, normaliza espaços/caixa)
export function deckKey(s: string) {
  let t = (s || '');

  // 1) decodifica entidades HTML comuns
  t = t
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // 2) remove acentos
  t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3) remove emojis (com fallback p/ engines sem \p{…})
  try {
    t = t.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji})/gu, '');
  } catch {
    t = t.replace(/[\u{1F000}-\u{1FAFF}]/gu, '');
  }

  // 4) normaliza pontuação “exótica” → espaço
  t = t.replace(/[^\p{L}\p{N}&()'’\- ]+/gu, ' ');

  // 5) normaliza aspas “curly” para simples
  t = t.replace(/[’‘]/g, "'");

  // 6) colapsa espaços e baixa caixa
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();

  return t;
}

function coerceOrder(v: any): Order | undefined {
  if (v === 'first' || v === 1 || v === '1' || /^first/i.test(v)) return 'first';
  if (v === 'second' || v === 2 || v === '2' || /^second/i.test(v)) return 'second';
  if (/^prime/i.test(String(v))) return 'first';
  if (/^segu/i.test(String(v))) return 'second';
  return undefined;
}

function coerceDice(v: any): Dice {
  if (v === 'won' || v === true || /^won|win|ganh/i.test(String(v))) return 'won';
  if (v === 'lost' || v === false || /^lost|lose|perd/i.test(String(v))) return 'lost';
  return 'none';
}

function coerceResult(v: any): Result | undefined {
  if (v === 'win' || v === true || v === 'W' || /^win|vict|vit[óo]ria|ganh/i.test(String(v))) return 'win';
  if (v === 'loss' || v === false || v === 'L' || /^loss|der|derrota|perd/i.test(String(v))) return 'loss';
  return undefined;
}

function sanitizeRound(r: any, idx: number): Round {
  const order: Order = coerceOrder(r.order) ?? 'second';
  const dice: Dice = coerceDice(r.dice);
  const result: Result = coerceResult(r.result) ?? 'loss';
  return {
    id: String(r.id || (Math.random().toString(36).slice(2) + Date.now().toString(36))),
    num: Number(r.num ?? idx + 1),
    opponentLeader: (r.opponentLeader ?? '').toString().trim() || undefined,
    order,
    dice,
    result,
    isBye: Boolean(r.isBye) || false,
  };
}

// ---------------- Persistência ----------------
export async function loadTournaments(): Promise<Tournament[]> {
  try {
    // 1) tenta formato comprimido (v2)
    const v2 = await AsyncStorage.getItem(K_TOURNAMENTS_V2);
    if (v2) {
      const parsed = (deserializeCompressed(v2) as Tournament[] | null) || [];
      const migrated = parsed.map((t, i) => {
        const rounds = (t.rounds ?? []).map((r, idx) => {
          const sanitized = sanitizeRound(r, idx);
          return {
            ...sanitized,
            opponentLeader: sanitized.opponentLeader ? migrateEmojisToLetters(sanitized.opponentLeader) : sanitized.opponentLeader,
          };
        });
        const rec = computeRecord({ ...t, rounds });
        const deckName = migrateEmojisToLetters((t.deck || '').trim());
        
        // Verifica se precisa migrar
        const needsMigration = (t.deck || '').includes('🟢') || (t.deck || '').includes('🔵') || 
                               (t.deck || '').includes('🟣') || (t.deck || '').includes('⚫') || 
                               (t.deck || '').includes('🔴') || (t.deck || '').includes('🟡') ||
                               rounds.some(r => r.opponentLeader && (
                                 r.opponentLeader.includes('🟢') || r.opponentLeader.includes('🔵') ||
                                 r.opponentLeader.includes('🟣') || r.opponentLeader.includes('⚫') ||
                                 r.opponentLeader.includes('🔴') || r.opponentLeader.includes('🟡')
                               ));
        
        return {
          id: t.id || `${i}-${Date.now()}`,
          name: (t.name || '').trim(),
          deck: deckName,
          date: t.date ?? Date.now(),
          set: t.set?.trim() || undefined,
          type: t.type?.trim() || undefined,
          rounds,
          wins: rec.wins,
          losses: rec.losses,
          finalized: Boolean((t as any).finalized) || false,
        } as Tournament;
      });
      
      // Verifica se houve migração e salva
      const hadMigration = migrated.some(t => {
        const original = parsed.find(orig => orig.id === t.id);
        if (!original) return false;
        return (original.deck || '').includes('🟢') || (original.deck || '').includes('🔵') || 
               (original.deck || '').includes('🟣') || (original.deck || '').includes('⚫') || 
               (original.deck || '').includes('🔴') || (original.deck || '').includes('🟡');
      });
      
      if (hadMigration) {
        try {
          await AsyncStorage.setItem(K_TOURNAMENTS_V2, serializeCompressed(migrated));
        } catch {}
      }
      
      return migrated;
    }

    // 2) fallback para legado (v1) sem compressão e migra salvando em v2
    const v1 = await AsyncStorage.getItem(K_TOURNAMENTS);
    const raw = v1 ? (JSON.parse(v1) as Tournament[]) : [];

    // MIGRA / SANEIA rounds e recalcula placares
    const migrated = raw.map((t, i) => {
      const rounds = (t.rounds ?? []).map((r, idx) => {
        const sanitized = sanitizeRound(r, idx);
        return {
          ...sanitized,
          opponentLeader: sanitized.opponentLeader ? migrateEmojisToLetters(sanitized.opponentLeader) : sanitized.opponentLeader,
        };
      });
      const rec = computeRecord({ ...t, rounds });
      return {
        id: t.id || `${i}-${Date.now()}`,
        name: (t.name || '').trim(),
        deck: migrateEmojisToLetters((t.deck || '').trim()),
        date: t.date ?? Date.now(),
        set: t.set?.trim() || undefined,
        type: t.type?.trim() || undefined,
        rounds,
        wins: rec.wins,
        losses: rec.losses,
        finalized: Boolean((t as any).finalized) || false, // <- garante default
      } as Tournament;
    });

    // salva imediatamente em v2 comprimido para economizar espaço
    try {
      await AsyncStorage.setItem(K_TOURNAMENTS_V2, serializeCompressed(migrated));
      // remove legado para liberar espaço
      await AsyncStorage.removeItem(K_TOURNAMENTS);
    } catch {}
    return migrated;
  } catch {
    return [];
  }
}

export async function saveTournaments(list: Tournament[]) {
  try {
    // grava apenas em v2 (comprimido) e remove a chave antiga para minimizar uso
    await AsyncStorage.setItem(K_TOURNAMENTS_V2, serializeCompressed(list));
    await AsyncStorage.removeItem(K_TOURNAMENTS);
  } catch {}
}

// ---------------- Helpers de criação/placar ----------------
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function makeTournament(data: { name: string; deck: string; date?: number; set?: string; type?: string }): Tournament {
  return {
    id: uid(),
    name: (data.name || '').trim(),
    deck: (data.deck || '').trim(),
    date: data.date ?? Date.now(),
    set: data.set?.trim() || undefined,
    type: data.type?.trim() || undefined,
    wins: 0,
    losses: 0,
    rounds: [],
    finalized: false, // <- default
  };
}

export function computeRecord(t: Pick<Tournament, 'rounds' | 'wins' | 'losses'>): { wins: number; losses: number } {
  const rs = t.rounds ?? [];
  if (rs.length === 0) return { wins: t.wins ?? 0, losses: t.losses ?? 0 };
  let w = 0, l = 0;
  for (const r of rs) r.result === 'win' ? w++ : l++;
  return { wins: w, losses: l };
}

// ---------------- Agregações (Seus Decks) ----------------
export function aggregateDecks(list: Tournament[]) {
  type Agg = { deck: string; wins: number; losses: number; tournaments: number; rounds: number; nameCounts: Map<string, number> };
  const map = new Map<string, Agg>();
  for (const t of list) {
    const rec = computeRecord(t);
    const deckName = t.deck.trim();
    const key = deckKeyExact(deckName); // Usa deckKeyExact para distinguir versões diferentes
    if (!key) continue;
    
    if (!map.has(key)) {
      const nameCounts = new Map<string, number>();
      map.set(key, { deck: deckName, wins: 0, losses: 0, tournaments: 0, rounds: 0, nameCounts });
    }
    const cur = map.get(key)!;
    cur.wins += rec.wins;
    cur.losses += rec.losses;
    cur.tournaments += 1;
    cur.rounds += (t.rounds?.length ?? rec.wins + rec.losses);
    
    // Conta a frequência de cada nome exato para este deck
    const currentCount = cur.nameCounts.get(deckName) || 0;
    cur.nameCounts.set(deckName, currentCount + 1);
  }
  
  // Para cada deck, pega o nome mais frequente para garantir consistência
  const arr = Array.from(map.values()).map(agg => {
    let mostFrequent = agg.deck;
    let maxCount = 0;
    for (const [name, count] of agg.nameCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = name;
      }
    }
    return { deck: mostFrequent, wins: agg.wins, losses: agg.losses, tournaments: agg.tournaments, rounds: agg.rounds };
  });
  
  return arr.sort((a, b) => b.wins - a.wins);
}

export function deckStats(list: Tournament[], deck: string) {
  const deckTrimmed = deck.trim();
  // Busca usando comparação direta (como na tela de detalhes)
  const agg = aggregateDecks(list).find(d => d.deck.trim() === deckTrimmed)
    ?? { deck, wins: 0, losses: 0, tournaments: 0, rounds: 0 };
  return { ...agg, wr: wrPercent(agg.wins, agg.losses) };
}

// ---------------- Matchups por deck adversário ----------------
export function matchupsForDeck(list: Tournament[], myDeck: string) {
  const myDeckTrimmed = myDeck.trim();
  type MU = { opponent: string; wins: number; losses: number; rounds: number; nameCounts: Map<string, number> };
  const map = new Map<string, MU>();

  for (const t of list) {
    // Compara diretamente o nome do deck (como na tela de detalhes)
    if (t.deck.trim() !== myDeckTrimmed) continue;
    for (const r of t.rounds ?? []) {
      if (r.isBye) continue; // BYE não entra em matchups
      const label = (r.opponentLeader || '').trim();
      const k = deckKeyExact(label);          // <<---- CHAVE EXATA AQUI
      if (!k) continue;

      if (!map.has(k)) {
        // Cria novo matchup com contador de nomes
        const nameCounts = new Map<string, number>();
        map.set(k, { opponent: '', wins: 0, losses: 0, rounds: 0, nameCounts });
      }
      const cur = map.get(k)!;
      if (r.result === 'win') cur.wins++; else cur.losses++;
      cur.rounds++;
      
      // Conta a frequência de cada nome exato para este matchup
      const currentCount = cur.nameCounts.get(label) || 0;
      cur.nameCounts.set(label, currentCount + 1);
    }
  }

  // Para cada matchup, pega o nome mais frequente
  const arr = Array.from(map.values()).map(mu => {
    let mostFrequent = '';
    let maxCount = 0;
    for (const [name, count] of mu.nameCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = name;
      }
    }
    // Garante que sempre há um nome válido (pega o primeiro se não houver contagem)
    if (!mostFrequent && mu.nameCounts.size > 0) {
      mostFrequent = Array.from(mu.nameCounts.keys())[0];
    }
    return { opponent: mostFrequent, wins: mu.wins, losses: mu.losses, rounds: mu.rounds, wr: wrPercent(mu.wins, mu.losses) };
  });
  
  arr.sort((a, b) => (b.rounds - a.rounds) || (b.wr - a.wr));
  return arr;
}


// ---------------- Splits gerais (ordem e dado) ----------------
type Split = { wins: number; losses: number; rounds: number; wr: number };
const pack = (w: number, l: number): Split => ({ wins: w, losses: l, rounds: w + l, wr: wrPercent(w, l) });

export function deckSplits(list: Tournament[], myDeck: string) {
  const myDeckTrimmed = myDeck.trim();
  let o1w = 0, o1l = 0, o2w = 0, o2l = 0;
  let wonW = 0, wonL = 0, lostW = 0, lostL = 0;

  for (const t of list) {
    // Compara diretamente o nome do deck (como na tela de detalhes)
    if (t.deck.trim() !== myDeckTrimmed) continue;
    for (const r of t.rounds ?? []) {
      if (r.isBye) continue; // BYE não entra em splits
      if (r.order === 'first') (r.result === 'win' ? o1w++ : o1l++);
      else if (r.order === 'second') (r.result === 'win' ? o2w++ : o2l++);

      if (r.dice === 'won') (r.result === 'win' ? wonW++ : wonL++);
      else if (r.dice === 'lost') (r.result === 'win' ? lostW++ : lostL++);
    }
  }

  return {
    orderFirst:  pack(o1w, o1l),
    orderSecond: pack(o2w, o2l),
    diceWon:     pack(wonW, wonL),
    diceLost:    pack(lostW, lostL),
  };
}

// ---------------- Splits específicos do matchup (inclui MATRIZ) ----------------
export function matchupSplitsForDeck(list: Tournament[], myDeck: string, opponentDeck: string) {
  const myDeckTrimmed = myDeck.trim();
  const oppExact = deckKeyExact(opponentDeck);

  let w = 0, l = 0;
  let o1w = 0, o1l = 0, o2w = 0, o2l = 0;
  let wonW = 0, wonL = 0, lostW = 0, lostL = 0;
  let fWonW = 0, fWonL = 0, fLostW = 0, fLostL = 0;
  let sWonW = 0, sWonL = 0, sLostW = 0, sLostL = 0;

  for (const t of list) {
    // Compara diretamente o nome do deck (como na tela de detalhes)
    if (t.deck.trim() !== myDeckTrimmed) continue;
    for (const r of t.rounds ?? []) {
      if (r.isBye) continue; // BYE não entra em splits por matchup
      const ropp = deckKeyExact(r.opponentLeader || '');
      if (ropp !== oppExact) continue;

      if (r.result === 'win') w++; else l++;

      if (r.order === 'first') (r.result === 'win' ? o1w++ : o1l++);
      else if (r.order === 'second') (r.result === 'win' ? o2w++ : o2l++);

      if (r.dice === 'won') (r.result === 'win' ? wonW++ : wonL++);
      else if (r.dice === 'lost') (r.result === 'win' ? lostW++ : lostL++);

      if (r.order === 'first' && r.dice === 'won') (r.result === 'win' ? fWonW++ : fWonL++);
      if (r.order === 'first' && r.dice === 'lost') (r.result === 'win' ? fLostW++ : fLostL++);
      if (r.order === 'second' && r.dice === 'won') (r.result === 'win' ? sWonW++ : sWonL++);
      if (r.order === 'second' && r.dice === 'lost') (r.result === 'win' ? sLostW++ : sLostL++);
    }
  }

  const packLocal = (W: number, L: number) => ({ wins: W, losses: L, rounds: W + L, wr: wrPercent(W, L) });

  return {
    total:       packLocal(w, l),
    orderFirst:  packLocal(o1w, o1l),
    orderSecond: packLocal(o2w, o2l),
    diceWon:     packLocal(wonW, wonL),
    diceLost:    packLocal(lostW, lostL),
    matrix: {
      firstWon:   packLocal(fWonW, fWonL),
      firstLost:  packLocal(fLostW, fLostL),
      secondWon:  packLocal(sWonW, sWonL),
      secondLost: packLocal(sLostW, sLostL),
    },
  };
}


// ---------------- Mutações ----------------
export async function addRoundToTournament(
  tournamentId: string,
  data: { opponentLeader?: string; dice: Dice; order: Order; result: Result; isBye?: boolean }
): Promise<Tournament | null> {
  const list = await loadTournaments();
  const i = list.findIndex((t) => t.id === tournamentId);
  if (i < 0) return null;

  const t = { ...list[i] };
  if (t.finalized) {
    // não permite adicionar novos rounds em torneio finalizado
    return t;
  }

  const rounds = t.rounds ? [...t.rounds] : [];
  const round: Round = sanitizeRound(
    {
      id: uid(),
      num: rounds.length + 1,
      opponentLeader: data.opponentLeader,
      dice: data.dice,
      order: data.order,
      result: data.result,
      isBye: Boolean(data.isBye) || false,
    },
    rounds.length
  );
  rounds.push(round);

  const rec = computeRecord({ ...t, rounds });
  const nextT: Tournament = { ...t, rounds, wins: rec.wins, losses: rec.losses };
  const next = [...list];
  next[i] = nextT;
  await saveTournaments(next);
  return nextT;
}

export async function removeRound(tournamentId: string, roundId: string): Promise<Tournament | null> {
  const list = await loadTournaments();
  const i = list.findIndex((t) => t.id === tournamentId);
  if (i < 0) return null;

  const t = { ...list[i] };
  // Remover round continua permitido (pode corrigir erros de input)
  const kept = (t.rounds ?? []).filter((r) => r.id !== roundId).map(sanitizeRound);
  kept.forEach((r, idx) => (r.num = idx + 1));

  const rec = computeRecord({ ...t, rounds: kept });
  const nextT: Tournament = { ...t, rounds: kept, wins: rec.wins, losses: rec.losses };
  const next = [...list];
  next[i] = nextT;
  await saveTournaments(next);
  return nextT;
}

// ---- Finalizar / Reabrir torneio ----
export async function setTournamentFinalized(tournamentId: string, finalized: boolean): Promise<Tournament | null> {
  const list = await loadTournaments();
  const i = list.findIndex(t => t.id === tournamentId);
  if (i < 0) return null;

  const t0 = list[i];
  const nextT: Tournament = { ...t0, finalized: Boolean(finalized) };
  const next = [...list]; next[i] = nextT;
  await saveTournaments(next);
  return nextT;
}

// ---- Deletar torneio ----
export async function deleteTournament(tournamentId: string): Promise<boolean> {
  const list = await loadTournaments();
  const filtered = list.filter(t => t.id !== tournamentId);
  
  // Retorna true se realmente deletou algo
  if (filtered.length === list.length) return false;
  
  await saveTournaments(filtered);
  return true;
}

// ---- Atualizar torneio ----
export async function updateTournament(
  tournamentId: string,
  updates: { name?: string; date?: number }
): Promise<Tournament | null> {
  const list = await loadTournaments();
  const i = list.findIndex(t => t.id === tournamentId);
  if (i < 0) return null;

  const t0 = list[i];
  const nextT: Tournament = {
    ...t0,
    name: updates.name !== undefined ? (updates.name || '').trim() : t0.name,
    date: updates.date !== undefined ? updates.date : t0.date,
  };
  const next = [...list];
  next[i] = nextT;
  await saveTournaments(next);
  return nextT;
}