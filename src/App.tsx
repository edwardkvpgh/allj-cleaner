import { useCallback, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanSearch,
  Trash2,
  RotateCcw,
  Zap,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { Header } from "./components/Header";
import { WindowTitleBar } from "./components/WindowTitleBar";
import { CategoryCard } from "./components/CategoryCard";
import { BlockingAppsModal, type BlockingModalMode } from "./components/BlockingAppsModal";
import { TempCleanPrompt } from "./components/TempCleanPrompt";
import { NoAppsFoundModal } from "./components/NoAppsFoundModal";
import type { AppPhase, CleanResult, InterferenceApp, LockingApp, ScanCategory } from "./types";
import { APP_NAME, COMPANY_NAME } from "./constants/brand";
import { formatBytes } from "./utils/format";
import { sortCategoriesBySize } from "./utils/categories";
import { closeableInterferenceApps, filterCloseableLockingApps } from "./utils/apps";
import {
  enrichCleanResult,
  getCleanBanner,
  hasCleanLockIssues,
} from "./utils/clean";

function App() {
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [categories, setCategories] = useState<ScanCategory[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cleanResult, setCleanResult] = useState<CleanResult | null>(null);
  const [preCleanCategories, setPreCleanCategories] = useState<ScanCategory[]>([]);
  const [blockingApps, setBlockingApps] = useState<LockingApp[]>([]);
  const [interferenceApps, setInterferenceApps] = useState<InterferenceApp[]>([]);
  const [loadingInterferenceApps, setLoadingInterferenceApps] = useState(false);
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const [closingApps, setClosingApps] = useState(false);
  const [checkingBlockers, setCheckingBlockers] = useState(false);
  const [showTempPrompt, setShowTempPrompt] = useState(false);
  const [showNoAppsFound, setShowNoAppsFound] = useState(false);
  const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>([]);
  const [blockingModalMode, setBlockingModalMode] =
    useState<BlockingModalMode>("clean");
  const [dismissedBlockingPrompt, setDismissedBlockingPrompt] = useState(false);

  const clearBlockingState = useCallback(() => {
    setShowBlockingModal(false);
    setShowTempPrompt(false);
    setShowNoAppsFound(false);
    setBlockingApps([]);
    setInterferenceApps([]);
    setLoadingInterferenceApps(false);
    setPendingCategoryIds([]);
    setClosingApps(false);
    setCheckingBlockers(false);
    setBlockingModalMode("clean");
    setDismissedBlockingPrompt(true);
  }, []);

  const totalSize = useMemo(
    () =>
      categories
        .filter((c) => selected.has(c.id))
        .reduce((sum, c) => sum + c.size_bytes, 0),
    [categories, selected],
  );

  const selectableCategories = useMemo(
    () => categories.filter((c) => c.available && c.size_bytes > 0),
    [categories],
  );

  const sortedCategories = useMemo(
    () => sortCategoriesBySize(categories),
    [categories],
  );

  const setSortedCategories = useCallback((next: ScanCategory[]) => {
    setCategories(sortCategoriesBySize(next));
  }, []);

  const runScan = useCallback(async () => {
    setPhase("scanning");
    setCleanResult(null);
    try {
      const results = await invoke<ScanCategory[]>("scan_all");
      setSortedCategories(results);
      const defaultSelected = new Set(
        results
          .filter((c) => c.available && c.size_bytes > 0)
          .map((c) => c.id),
      );
      setSelected(defaultSelected);
      setPhase("results");
    } catch {
      setPhase("idle");
    }
  }, [setSortedCategories]);

  const requestScan = useCallback(async () => {
    if (checkingBlockers) return;

    setCheckingBlockers(true);
    try {
      const apps = filterCloseableLockingApps(
        await invoke<LockingApp[]>("get_pre_scan_apps"),
      );
      if (apps.length > 0) {
        setBlockingApps(apps);
        setBlockingModalMode("scan");
        setShowBlockingModal(true);
        return;
      }
    } catch {
      // If detection fails, still scan.
    } finally {
      setCheckingBlockers(false);
    }

    clearBlockingState();
    await runScan();
  }, [checkingBlockers, clearBlockingState, runScan]);

  const handleScanAnyway = useCallback(async () => {
    setShowBlockingModal(false);
    setBlockingApps([]);
    setBlockingModalMode("clean");
    await runScan();
  }, [runScan]);

  const fetchInterferenceApps = useCallback(async (categoryIds: string[]) => {
    if (categoryIds.length === 0) {
      setInterferenceApps([]);
      return [];
    }

    setLoadingInterferenceApps(true);
    try {
      const apps = await invoke<InterferenceApp[]>("get_interference_apps", {
        categoryIds,
      });
      setInterferenceApps(apps);
      return apps;
    } catch {
      setInterferenceApps([]);
      return [];
    } finally {
      setLoadingInterferenceApps(false);
    }
  }, []);

  const findBlockingApps = useCallback(
    async (categoryIds: string[]): Promise<LockingApp[]> => {
      if (categoryIds.length === 0) return [];

      let apps = await invoke<LockingApp[]>("get_locking_apps", { categoryIds });
      if (apps.length === 0) {
        apps = await invoke<LockingApp[]>("get_pre_scan_apps");
      }
      return filterCloseableLockingApps(apps);
    },
    [],
  );

  const runClean = useCallback(async (categoryIds: string[]) => {
    setShowBlockingModal(false);
    setShowTempPrompt(false);
    setPhase("cleaning");
    const snapshot = categories.filter((category) => categoryIds.includes(category.id));
    setPreCleanCategories(snapshot);
    try {
      const result = await invoke<CleanResult>("clean_selected", {
        categoryIds,
      });
      const refreshed = await invoke<ScanCategory[]>("scan_all");
      const enriched = enrichCleanResult(result, snapshot, refreshed);
      setCleanResult(enriched);
      setSortedCategories(refreshed);
      const stillDirty = refreshed.filter(
        (c) => categoryIds.includes(c.id) && c.size_bytes > 0,
      );
      setSelected(new Set(stillDirty.map((c) => c.id)));
      setPhase("results");

      if (hasCleanLockIssues(enriched) && !dismissedBlockingPrompt) {
        const apps = await findBlockingApps(categoryIds);
        if (apps.length > 0) {
          setPendingCategoryIds(categoryIds);
          setBlockingApps(apps);
          setBlockingModalMode("clean");
          setShowBlockingModal(true);
        }
      }
    } catch {
      setPhase("results");
    } finally {
      setCheckingBlockers(false);
      setClosingApps(false);
    }
  }, [categories, setSortedCategories, dismissedBlockingPrompt, findBlockingApps]);

  const openBlockingAppsModal = useCallback(
    async (categoryIds: string[]): Promise<LockingApp[]> => {
      if (categoryIds.length === 0) return [];
      setPendingCategoryIds(categoryIds);
      setShowTempPrompt(false);
      setShowNoAppsFound(false);
      setCheckingBlockers(true);
      try {
        const apps = await findBlockingApps(categoryIds);
        if (apps.length > 0) {
          setBlockingApps(apps);
          setBlockingModalMode("clean");
          setShowBlockingModal(true);
        } else {
          const interference = await fetchInterferenceApps(categoryIds);
          const closeable = closeableInterferenceApps(interference);
          if (closeable.length > 0) {
            setBlockingApps(closeable);
            setBlockingModalMode("clean");
            setShowBlockingModal(true);
          } else {
            setShowNoAppsFound(true);
          }
        }
        return apps;
      } finally {
        setCheckingBlockers(false);
      }
    },
    [findBlockingApps, fetchInterferenceApps],
  );

  const handleFindBlockingApps = useCallback(async () => {
    const categoryIds =
      pendingCategoryIds.length > 0
        ? pendingCategoryIds
        : selected.size > 0
          ? Array.from(selected)
          : categories.filter((c) => c.size_bytes > 0).map((c) => c.id);
    await openBlockingAppsModal(categoryIds);
  }, [pendingCategoryIds, selected, categories, openBlockingAppsModal]);

  const handleClean = useCallback(async () => {
    if (selected.size === 0 || checkingBlockers) return;

    const categoryIds = Array.from(selected);
    setPendingCategoryIds(categoryIds);
    setDismissedBlockingPrompt(false);
    setCheckingBlockers(true);

    try {
      const apps = await findBlockingApps(categoryIds);
      if (apps.length > 0) {
        setBlockingApps(apps);
        setBlockingModalMode("clean");
        setShowBlockingModal(true);
        return;
      }

      if (categoryIds.includes("user_temp")) {
        await fetchInterferenceApps(categoryIds);
        setShowTempPrompt(true);
        return;
      }
    } catch {
      if (categoryIds.includes("user_temp")) {
        await fetchInterferenceApps(categoryIds);
        setShowTempPrompt(true);
        return;
      }
    } finally {
      setCheckingBlockers(false);
    }

    await runClean(categoryIds);
  }, [selected, runClean, checkingBlockers, findBlockingApps, fetchInterferenceApps]);

  const closeSelectedApps = useCallback(async (appsToClose: LockingApp[]) => {
    if (appsToClose.length === 0) return;

    setClosingApps(true);
    setCheckingBlockers(true);

    try {
      const safeApps = filterCloseableLockingApps(appsToClose);
      if (safeApps.length === 0) return;

      await invoke("force_close_apps", { apps: safeApps });
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch {
      // Continue even if close partially fails.
    } finally {
      setShowBlockingModal(false);
      setShowTempPrompt(false);
      setBlockingApps([]);
      setClosingApps(false);
      setCheckingBlockers(false);
    }
  }, []);

  const handleForceCloseAndClean = useCallback(
    async (appsToClose: LockingApp[]) => {
      const categoryIds =
        pendingCategoryIds.length > 0 ? pendingCategoryIds : Array.from(selected);
      if (categoryIds.length === 0) return;

      await closeSelectedApps(appsToClose);
      await runClean(categoryIds);
    },
    [pendingCategoryIds, selected, runClean, closeSelectedApps],
  );

  const handleForceCloseAndScan = useCallback(
    async (appsToClose: LockingApp[]) => {
      await closeSelectedApps(appsToClose);
      await runScan();
    },
    [closeSelectedApps, runScan],
  );

  const handleBlockingModalConfirm = useCallback(
    (appsToClose: LockingApp[]) => {
      if (blockingModalMode === "scan") {
        void handleForceCloseAndScan(appsToClose);
      } else {
        void handleForceCloseAndClean(appsToClose);
      }
    },
    [blockingModalMode, handleForceCloseAndScan, handleForceCloseAndClean],
  );

  const toggleCategory = useCallback((id: string) => {
    setPhase((current) => (current === "done" ? "results" : current));
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(selectableCategories.map((c) => c.id)));
  }, [selectableCategories]);

  const reset = useCallback(() => {
    clearBlockingState();
    setPhase("idle");
    setCategories([]);
    setSelected(new Set());
    setCleanResult(null);
    setPreCleanCategories([]);
  }, [clearBlockingState]);

  const isLoading = phase === "scanning" || phase === "cleaning";
  const modalActive = showBlockingModal && blockingApps.length > 0;
  const canAct =
    (phase === "results" || phase === "done") &&
    !isLoading &&
    !modalActive &&
    !showTempPrompt &&
    !showNoAppsFound;
  const showResults =
    phase === "scanning" ||
    phase === "results" ||
    phase === "cleaning" ||
    phase === "done";
  const showFooter =
    phase === "results" || phase === "done" || phase === "cleaning";
  const showBanner = Boolean(cleanResult && showFooter);

  return (
    <div className="mesh-bg relative flex h-full flex-col overflow-hidden">
      <WindowTitleBar />

      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 animate-float rounded-full bg-neon-purple/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-32 h-56 w-56 animate-float rounded-full bg-neon-cyan/10 blur-3xl" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-6">
        <Header />

        <BlockingAppsModal
          apps={blockingApps}
          open={modalActive}
          busy={closingApps}
          mode={blockingModalMode}
          onCancel={clearBlockingState}
          onSkip={blockingModalMode === "scan" ? handleScanAnyway : undefined}
          onConfirm={handleBlockingModalConfirm}
        />

        <TempCleanPrompt
          open={showTempPrompt}
          apps={interferenceApps}
          loadingApps={loadingInterferenceApps}
          onCancel={clearBlockingState}
          onFindApps={() => {
            void openBlockingAppsModal(pendingCategoryIds);
          }}
          onYeetAnyway={() => {
            setShowTempPrompt(false);
            void runClean(pendingCategoryIds);
          }}
        />

        <NoAppsFoundModal
          open={showNoAppsFound}
          apps={interferenceApps}
          loadingApps={loadingInterferenceApps}
          onCancel={clearBlockingState}
          onYeetAnyway={() => {
            setShowNoAppsFound(false);
            void runClean(pendingCategoryIds);
          }}
        />

        <main className="mt-6 flex min-h-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.section
                key="idle"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-1 flex-col items-center justify-center text-center"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mb-6 text-6xl"
                >
                  💾
                </motion.div>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  your disk is{" "}
                  <span className="text-gradient">lowkey bloated</span>
                </h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">
                  scan for temp files, browser cache, and recycle bin junk.
                  preview everything. clean only what you pick. no cap.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={requestScan}
                  className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink px-8 py-4 font-display text-base font-semibold shadow-glow transition-shadow hover:shadow-glow-cyan"
                >
                  <ScanSearch size={20} />
                  scan my storage
                </motion.button>
              </motion.section>
            )}

            {showResults && (
              <motion.section
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex min-h-0 flex-1 flex-col"
              >
                {showBanner && cleanResult && (() => {
                  const banner = getCleanBanner(cleanResult, preCleanCategories);

                  return (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-4 glass-card p-4 ${banner.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <PartyPopper className={banner.text} size={24} />
                      <div className="min-w-0">
                        <p className={`font-display font-semibold ${banner.text}`}>
                          {banner.title}
                        </p>
                        <p className="text-sm text-white/60">{banner.subtitle}</p>
                        {banner.tip && (
                          <p className="mt-1.5 text-xs text-white/45">{banner.tip}</p>
                        )}
                        {banner.showCloseApps && (
                          <button
                            type="button"
                            onClick={handleFindBlockingApps}
                            disabled={checkingBlockers}
                            className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/15 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-400/25 disabled:opacity-50"
                          >
                            {checkingBlockers
                              ? "finding apps..."
                              : "find & close blocking apps"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  );
                })()}

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/30">
                      {phase === "scanning"
                        ? "scanning..."
                        : phase === "cleaning"
                          ? "cleaning..."
                          : "found junk"}
                    </p>
                    <p className="font-display text-2xl font-bold">
                      {phase === "scanning" ? (
                        <span className="text-white/50">hold on...</span>
                      ) : (
                        <>
                          <span className="text-gradient">
                            {formatBytes(
                              categories.reduce((s, c) => s + c.size_bytes, 0),
                            )}
                          </span>
                          <span className="ml-2 text-base font-normal text-white/40">
                            total
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {canAct && selectableCategories.length > 0 && (
                    <button
                      onClick={selectAll}
                      className="text-xs text-neon-cyan/80 transition-colors hover:text-neon-cyan"
                    >
                      select all
                    </button>
                  )}
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {phase === "scanning" ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/40">
                      <Loader2 className="mb-3 animate-spin text-neon-purple" size={32} />
                      <p className="text-sm">scanning your digital mess...</p>
                    </div>
                  ) : (
                    sortedCategories.map((cat, i) => (
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        selected={selected.has(cat.id)}
                        onToggle={toggleCategory}
                        index={i}
                      />
                    ))
                  )}
                </div>

                <div className="mt-4 shrink-0 border-t border-white/10 bg-void/60 pt-4 backdrop-blur-md">
                  {showFooter && (
                    <div className="flex flex-wrap items-center gap-3">
                      {canAct && (
                        <div className="min-w-0 flex-1 text-sm text-white/50">
                          <Zap size={14} className="mr-1 inline text-neon-cyan" />
                          {selected.size > 0 ? (
                            <>
                              ready to free{" "}
                              <span className="font-semibold text-white">
                                {formatBytes(totalSize)}
                              </span>
                            </>
                          ) : (
                            <span className="text-white/40">
                              pick categories to clean
                            </span>
                          )}
                        </div>
                      )}

                      {canAct && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={selected.size === 0 || checkingBlockers}
                          onClick={handleClean}
                          className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple px-5 py-2.5 font-display text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {checkingBlockers ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          {checkingBlockers ? "checking..." : "yeet selected"}
                        </motion.button>
                      )}

                      <button
                        onClick={requestScan}
                        disabled={checkingBlockers || phase === "cleaning"}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <RotateCcw size={14} />
                        rescan
                      </button>

                      <button
                        onClick={reset}
                        disabled={phase === "cleaning"}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        start over
                      </button>
                    </div>
                  )}

                  {checkingBlockers && (
                    <div className="flex w-full items-center justify-center gap-2 py-2 text-sm text-white/50">
                      <Loader2 className="animate-spin text-neon-cyan" size={18} />
                      checking what&apos;s running...
                    </div>
                  )}

                  {phase === "cleaning" && (
                    <div className="flex w-full items-center justify-center gap-2 py-2 text-sm text-white/50">
                      <Loader2 className="animate-spin text-neon-pink" size={18} />
                      deleting the clutter...
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <footer className="relative z-10 mt-2 shrink-0 text-center text-[10px] leading-relaxed text-white/25">
          {APP_NAME} · © {new Date().getFullYear()} {COMPANY_NAME} · free under MIT License
        </footer>
      </div>
    </div>
  );
}

export default App;
