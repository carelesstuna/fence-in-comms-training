import { lazy, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { contentResult } from './content'
import { useApp } from './state/store'
import { watchOtherWindows } from './state/sync'
import { requestPersistentStorage } from './state/transfer'
import { makeRun, RunContext } from './ui/run'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SpeechProvider } from './platform/SpeechProvider'
import { AudioProvider } from './platform/AudioProvider'
import { Layout } from './components/Layout'
import { PathPage } from './features/path/PathPage'
import { Onboarding } from './features/onboarding/Onboarding'
import { LessonPlayer } from './features/lesson/LessonPlayer'
import { PlacementTest } from './features/placement/PlacementTest'
import { HangarPage } from './features/hangar/HangarPage'
import { TopicPage, TopicsIndexPage } from './features/wissen/TopicPage'
import { ProgressPage } from './features/profile/ProgressPage'
import { SettingsPage } from './features/profile/SettingsPage'
import { DrillPreview } from './features/preview/DrillPreview'
import { ScenarioPage } from './features/preview/ScenarioPage'
import { CheckridePage } from './features/checkride/CheckridePage'
import { DailyDrillPage } from './features/daily/DailyDrill'
import { GlossaryPage } from './features/glossary/GlossaryPage'

function ContentErrors() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-red-300">Die Inhalte enthalten Fehler</h1>
      <p className="mt-1 text-muted">
        Bitte <code>npm run validate</code> ausführen und die Fehler beheben:
      </p>
      <ul className="mt-4 space-y-2 font-mono text-sm">
        {contentResult.errors.map((e, i) => (
          <li key={i} className="rounded bg-red-500/10 px-3 py-2">
            <div className="text-red-200">{e.file}</div>
            <div className="text-text">{e.message}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Home() {
  const onboarded = useApp((s) => s.onboarded)
  return onboarded ? <PathPage /> : <Navigate to="/start" replace />
}

/** Neue Seite beginnt oben – nicht mittendrin, wo die letzte aufgehört hat. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

/** Fehler auf einer Seite: Kopfzeile und Navigation bleiben, beim Seitenwechsel wird neu versucht. */
function PageBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <ErrorBoundary resetKey={pathname} onHome={() => navigate('/')}>
      {children}
    </ErrorBoundary>
  )
}

/** Nur im Entwicklungsmodus: ein Fehler beim Würfeln (in useMemo), um die Fehlerseite zu prüfen. */
function CrashTest() {
  useMemo(() => {
    throw new Error('Testfehler beim Würfeln (nur im Entwicklungsmodus)')
  }, [])
  return null
}

/** Lizenzen (selten besucht, daher erst bei Bedarf geladen). */
const LicensesPage = lazy(() => import('./features/licenses/LicensesPage'))
/** Nur im Entwicklungsmodus: Aufnahmen für die Messreihe der Spracherkennung. */
const RecordingPage = import.meta.env.DEV ? lazy(() => import('./features/dev/RecordingPage')) : null

/** Die eigentliche App – erst gebaut, wenn die Inhalte fehlerfrei geladen sind. */
function Trainer() {
  const profile = useApp((s) => s.profile)
  const onboarded = useApp((s) => s.onboarded)
  // Standard-Durchlauf für Seiten außerhalb von Lektionen (z. B. Hangar)
  const browseRun = useMemo(() => makeRun(profile), [profile])
  // Abzeichen für Fortschritt nachtragen, der schon vor ihnen da war
  useEffect(() => {
    useApp.getState().refreshAchievements()
  }, [])
  // Zweites Fenster oder Tab (z. B. über „Mehr dazu“): dessen Änderungen übernehmen, statt sie später zu überschreiben
  useEffect(() => watchOtherWindows(), [])
  // Sobald es Fortschritt gibt: den Browser bitten, ihn nicht von selbst zu löschen
  useEffect(() => {
    if (onboarded) void requestPersistentStorage()
  }, [onboarded])
  return (
    <HashRouter>
      <ScrollToTop />
      <RunContext.Provider value={browseRun}>
        <Layout>
          <PageBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/start" element={<Onboarding />} />
              <Route path="/lesson/:id" element={<LessonPlayer />} />
              <Route path="/placement/:moduleId" element={<PlacementTest />} />
              <Route path="/exam/:moduleId" element={<PlacementTest mode="exam" />} />
              <Route path="/hangar" element={<HangarPage />} />
              <Route path="/wissen" element={<TopicsIndexPage />} />
              <Route path="/wissen/:id" element={<TopicPage />} />
              <Route path="/fortschritt" element={<ProgressPage />} />
              <Route path="/einstellungen" element={<SettingsPage />} />
              <Route path="/einstellungen/:tab" element={<SettingsPage />} />
              {/* Früher eine Seite für alles – alte Links landen in den Einstellungen */}
              <Route path="/profile" element={<Navigate to="/einstellungen" replace />} />
              <Route path="/drill/:id" element={<DrillPreview />} />
              <Route path="/scenario/:id" element={<ScenarioPage />} />
              <Route path="/checkride/:rankId" element={<CheckridePage />} />
              <Route path="/daily" element={<DailyDrillPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route
                path="/lizenzen"
                element={
                  <Suspense fallback={<p className="p-6 text-muted">Lädt …</p>}>
                    <LicensesPage />
                  </Suspense>
                }
              />
              {import.meta.env.DEV && <Route path="/dev/fehler" element={<CrashTest />} />}
              {RecordingPage && (
                <Route
                  path="/dev/aufnahme"
                  element={
                    <Suspense fallback={<p className="p-6 text-muted">Lädt …</p>}>
                      <RecordingPage />
                    </Suspense>
                  }
                />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageBoundary>
        </Layout>
      </RunContext.Provider>
    </HashRouter>
  )
}

export default function App() {
  // Erst die Inhalte prüfen, dann den Run bauen – sonst stürzt makeRun über fehlende Inhalte ab
  const contentOk = contentResult.errors.length === 0 && !!contentResult.index
  // Fängt Fehler außerhalb der Seiten ab (z. B. in der Kopfzeile)
  return <ErrorBoundary fullPage>{contentOk ? <SpeechProvider><AudioProvider><Trainer /></AudioProvider></SpeechProvider> : <ContentErrors />}</ErrorBoundary>
}
