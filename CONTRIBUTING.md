# Contributing

Thanks for wanting to help! Corrections from real-world pilots, controllers, JTACs and experienced simmers are
especially welcome.

## Reporting problems

- Wrong phraseology, outdated frequencies, typos, bugs: please open an
  [issue](https://github.com/carelesstuna/fence-in-comms-training/issues). Paste the small reference line shown
  below each exercise (e.g. `Ref m5-l1 · 4/12 · m5-awacs-checkin-fragged · #WA8H` – clicking it copies it): it
  names the lesson, step and exercise, and the code at the end rebuilds the same random values. For phraseology,
  add a public source if you have one.
- Reporting an infringement: see [LEGAL.md](LEGAL.md).

## Changing content

- Lessons, drills, radio calls and scenarios live in `content/` as Markdown and YAML. The format is described in
  [content/README.md](content/README.md) (in German). Run `npm run validate` and `npm test` before opening a pull
  request.
- Explanations are written in German, radio calls in English.
- Cite your sources and summarise in your own words. Please don't copy longer passages, tables or images from
  manuals, books or websites, and don't use material with distribution restrictions (FOUO, CUI, "not for public
  release").
- AI-assisted contributions are fine – most of this project was written by AI itself (see the README). You are
  responsible for checking the result.

## Licensing of contributions

By contributing, you agree that your contributions to `content/` are licensed under CC BY-SA 4.0
([LICENSE-CONTENT.md](LICENSE-CONTENT.md)) and all other contributions under the MIT license ([LICENSE](LICENSE)).
