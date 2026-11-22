/**
 * Lokale Ordner außerhalb von Git: Modelle und Programme für die Spracherkennung (`.asr`) und die
 * Aufnahmen der Messreihe. Beide gelten für den Haupt-Checkout – auch aus einem Worktree heraus –,
 * damit nicht jeder Worktree alles neu lädt.
 */
import { execFileSync } from 'node:child_process'
import { basename, dirname, join, resolve } from 'node:path'

/** Wurzel des Haupt-Checkouts (über das gemeinsame `.git`), sonst das aktuelle Verzeichnis. */
export function mainRepoRoot(cwd = process.cwd()): string {
  try {
    const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return dirname(common)
  } catch {
    return resolve(cwd)
  }
}

/** whisper.cpp und Modelle: `RT_ASR_DIR` oder `.asr` im Haupt-Checkout (steht in .gitignore). */
export function asrDir(): string {
  return resolve(process.env.RT_ASR_DIR || join(mainRepoRoot(), '.asr'))
}

/** Aufnahmen der Messreihe: `RT_MESSREIHE_DIR` oder ein Ordner neben dem Repo, „<Repo> Messreihe“. */
export function messreiheDir(): string {
  if (process.env.RT_MESSREIHE_DIR) return resolve(process.env.RT_MESSREIHE_DIR)
  const root = mainRepoRoot()
  return join(dirname(root), `${basename(root)} Messreihe`)
}
