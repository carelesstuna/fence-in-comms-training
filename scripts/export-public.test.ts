import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import {
  classify,
  genericPatterns,
  personalPatterns,
  privateRefPatterns,
  scan,
} from './export-public'

describe('export-public', () => {
  it('ordnet Pfade ein, privat geht vor öffentlich', () => {
    expect(classify('src/main.tsx')).toBe('public')
    expect(classify('content/hangar/skyeye.md')).toBe('public')
    expect(classify('docs/desktop-app.md')).toBe('public')
    expect(classify('docs/research/01-funkverfahren.md')).toBe('private')
    expect(classify('docs/PLAN.md')).toBe('private')
    expect(classify('.claude/launch.json')).toBe('private')
    expect(classify('docs/neu.md')).toBe('unknown')
    expect(classify('srcx/a.ts')).toBe('unknown')
  })

  it('jede Datei im Repo ist eingeordnet', () => {
    let files: string[]
    try {
      files = execFileSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD'], {
        encoding: 'utf8',
      })
        .split('\0')
        .filter(Boolean)
    } catch {
      return // kein Git-Repo (z. B. entpacktes Archiv)
    }
    expect(files.filter((f) => classify(f) === 'unknown')).toEqual([])
  })

  it('findet private Spuren und Verweise auf private Dateien', () => {
    const files = new Map([
      // Laufwerksbuchstabe zusammengesetzt, damit diese Datei selbst nicht anschlägt
      [
        'a.md',
        Buffer.from(
          `Handbuch unter ${'G'}:\\Falcon BMS 4.38\\Docs\nAuszug in C:\\dev\\Projekt X Quellen\\funde\n`,
        ),
      ],
      [
        'b.md',
        Buffer.from(
          'Fragen an max.mustermann@example.org\nvon Max Mustermann\nsiehe docs/research/01\n',
        ),
      ],
      ['c.png', Buffer.from([0x89, 0x50, 0, 0x47])],
      ['d.ts', Buffer.from("const tar = 'C:\\\\Windows\\\\System32\\\\tar.exe'\n")],
      // Platzhalter ebenfalls zusammengesetzt
      ['LICENSE', Buffer.from(`Copyright (c) 2026 <${'GITHUB-KONTO'}> and contributors\n`)],
    ])
    const leaks = scan(files, [
      ...genericPatterns('Projekt X'),
      ...personalPatterns('Max Mustermann', 'max.mustermann@example.org'),
    ])
    expect(leaks.map((l) => `${l.file}:${l.line} ${l.reason}`)).toEqual([
      'a.md:1 Pfad auf einem lokalen Laufwerk',
      'a.md:2 lokaler Ordner neben dem Repo',
      'b.md:1 eigene Mailadresse',
      'b.md:2 eigener Name',
      'LICENSE:1 Platzhalter nicht ausgefüllt',
    ])
    expect(scan(files, privateRefPatterns()).map((l) => `${l.file}:${l.line}`)).toEqual(['b.md:3'])
  })
})
