/**
 * Sprachausgabe (Kokoro-82M): Dateien, Quellen und Stimmen. Ohne Browser-APIs, damit Tests und Skripte
 * sie lesen können. Dieselbe Liste steht in `src-tauri/src/tts.rs` (ein Test prüft, dass beide passen).
 *
 * - Modell: Kokoro-82M v1.0 als ONNX (fp32), Apache-2.0, von onnx-community auf Hugging Face. Die
 *   kleineren Varianten taugen nicht: fp16 liefert je nach Text und Tempo NaN (auf WebGPU immer), q8 ist
 *   auf der CPU dreimal langsamer (quantisierte Faltungen ohne schnellen Kern). Messung: docs/audio.md.
 * - Stimmen: je 0,5 MB, gleiche Quelle.
 * - Aussprache: die Lexika von misaki (Apache-2.0), mit denen Kokoro trainiert wurde – statt espeak-ng.
 */

/** Kokoro liefert 24 kHz mono. */
export const TTS_RATE = 24000

export type TtsFileKind = 'model' | 'voice' | 'lexicon'

export interface TtsFile {
  /** Dateiname im Modell-Ordner bzw. im Browser-Speicher. */
  name: string
  kind: TtsFileKind
  size: number
  sha256: string
  /** Originalquelle auf festem Stand (Commit). */
  url: string
}

const HF =
  'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/1939ad2a8e416c0acfeecc08a694d14ef25f2231'
const MISAKI =
  'https://raw.githubusercontent.com/hexgrad/misaki/fba1236595f2d2bf21d414ba6e57d25256afada3/misaki/data'

export type Accent = 'us' | 'gb'

export interface Voice {
  /** Kennung bei Kokoro, z. B. „af_heart“ (a = US, b = GB; f/m). */
  id: string
  label: string
  accent: Accent
  female: boolean
  /** Eigenes Tempo der Stimme (manche sprechen von Natur aus langsamer). */
  speed: number
  sha256: string
}

/** Die Stimmen der Gegenstellen – US und GB, Frauen und Männer. */
export const VOICES: readonly Voice[] = [
  {
    id: 'af_heart',
    label: 'Heart (US, w)',
    accent: 'us',
    female: true,
    speed: 1.05,
    sha256: 'd583ccff3cdca2f7fae535cb998ac07e9fcb90f09737b9a41fa2734ec44a8f0b',
  },
  {
    id: 'af_bella',
    label: 'Bella (US, w)',
    accent: 'us',
    female: true,
    speed: 1.05,
    sha256: 'f69d836209b78eb8c66e75e3cda491e26ea838a3674257e9d4e5703cbaf55c8b',
  },
  {
    id: 'am_michael',
    label: 'Michael (US, m)',
    accent: 'us',
    female: false,
    speed: 1.1,
    sha256: '1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1',
  },
  {
    id: 'am_fenrir',
    label: 'Fenrir (US, m)',
    accent: 'us',
    female: false,
    speed: 1.1,
    sha256: 'c27989f741f7ee34d273a39d8a595cc0837d35f5ced9a29b7cc162614616df43',
  },
  {
    id: 'am_puck',
    label: 'Puck (US, m)',
    accent: 'us',
    female: false,
    speed: 1.1,
    sha256: 'fcf73c989033e9233e0b98713eca600c8c74dcc1614b37009d5450ff4a2274a0',
  },
  {
    id: 'bf_emma',
    label: 'Emma (GB, w)',
    accent: 'gb',
    female: true,
    speed: 1.05,
    sha256: '669fe0647f9dd04fcab92f1439a40eeb4c8b4ab1f82e4996fe3d918ce4a63b73',
  },
  {
    id: 'bm_george',
    label: 'George (GB, m)',
    accent: 'gb',
    female: false,
    speed: 1.1,
    sha256: 'c4b235a4c1f2cd3b939fed08b899ce9385638b763f7b73a59616c4fc9bd6c9bc',
  },
  {
    id: 'bm_fable',
    label: 'Fable (GB, m)',
    accent: 'gb',
    female: false,
    speed: 1.1,
    sha256: 'f889083196807b4adb15e9204252165f503b8d33d3982e681c52443c49d798f1',
  },
]

export const voiceInfo = (id: string): Voice | undefined => VOICES.find((v) => v.id === id)

export const MODEL_FILE = 'kokoro-v1.0-fp32.onnx'
export const voiceFile = (id: string): string => `kokoro-${id}.bin`
export const lexiconFiles = (accent: Accent): string[] => [
  `misaki-${accent}_gold.json`,
  `misaki-${accent}_silver.json`,
]

export const TTS_FILES: readonly TtsFile[] = [
  {
    name: MODEL_FILE,
    kind: 'model',
    size: 325_532_232,
    sha256: '8fbea51ea711f2af382e88c833d9e288c6dc82ce5e98421ea61c058ce21a34cb',
    url: `${HF}/onnx/model.onnx`,
  },
  ...VOICES.map((v): TtsFile => ({
    name: voiceFile(v.id),
    kind: 'voice',
    size: 522_240,
    sha256: v.sha256,
    url: `${HF}/voices/${v.id}.bin`,
  })),
  {
    name: 'misaki-us_gold.json',
    kind: 'lexicon',
    size: 3_000_469,
    sha256: 'dc414872a49a28ae6c141463d502fd945f3b2fde040484fdc47d00cc4612686f',
    url: `${MISAKI}/us_gold.json`,
  },
  {
    name: 'misaki-us_silver.json',
    kind: 'lexicon',
    size: 3_099_517,
    sha256: 'de8f67be911bb6c659187b4a65fd966b6a30e56350e0f790d763210b053ac475',
    url: `${MISAKI}/us_silver.json`,
  },
  {
    name: 'misaki-gb_gold.json',
    kind: 'lexicon',
    size: 2_838_552,
    sha256: '29e62f4b60261c88f7f3c2c7811ca3825978948090b72d2b27d565b729282f71',
    url: `${MISAKI}/gb_gold.json`,
  },
  {
    name: 'misaki-gb_silver.json',
    kind: 'lexicon',
    size: 3_663_898,
    sha256: '48131e2d92ccc41655f4543e87e0f938e71463eb5a54be7f0693bb712ebb6bce',
    url: `${MISAKI}/gb_silver.json`,
  },
]

/** Gesamtgröße zum Nachladen, MB (gerundet). */
export const TTS_DOWNLOAD_MB = Math.round(TTS_FILES.reduce((n, f) => n + f.size, 0) / 1e6)

/** Für die Seite „Lizenzen“: was die Sprachausgabe nachlädt, mit Lizenz und Quelle. */
export const TTS_LICENSES: readonly { name: string; version: string; license: string; url: string }[] = [
  { name: 'Kokoro-82M (Modell und Stimmen, hexgrad)', version: 'v1.0', license: 'Apache-2.0', url: 'https://huggingface.co/hexgrad/Kokoro-82M' },
  { name: 'Kokoro-82M als ONNX (onnx-community)', version: 'v1.0 fp32', license: 'Apache-2.0', url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX' },
  { name: 'misaki (Aussprache-Lexika US/GB)', version: 'fba1236', license: 'Apache-2.0', url: 'https://github.com/hexgrad/misaki' },
]
