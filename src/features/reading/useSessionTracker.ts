import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { SESSION_CONFIG } from '@/config';
import { finalizeSession, recordPageEvent, startSession } from '@/db/repo';

/**
 * Tracks a single reading session while a reader screen is mounted.
 *
 * Accrues *active* reading time only: the clock advances while the app is in
 * the foreground and the reader has seen interaction within
 * {@link SESSION_CONFIG.idleTimeoutMs}. Backgrounding the app or sitting idle
 * on a page pauses accrual, so "time per page" and session length reflect real
 * reading rather than a screen left on.
 */
export function useSessionTracker(documentId: string) {
  const [ready, setReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [pagesRead, setPagesRead] = useState(1);

  const sessionIdRef = useRef<string | null>(null);
  const finishedRef = useRef(false);

  // Time accounting (all in ms).
  const activeMsRef = useRef(0);
  const pageActiveMsRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastActivityRef = useRef(0);
  const isForegroundRef = useRef(true);

  // Reading position.
  const currentPageRef = useRef(1);
  const visitedPagesRef = useRef<Set<number>>(new Set([1]));

  const isActive = useCallback((now: number) => {
    return (
      isForegroundRef.current &&
      now - lastActivityRef.current <= SESSION_CONFIG.idleTimeoutMs
    );
  }, []);

  // Create the session once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await startSession({ documentId, startPage: 1 });
      if (cancelled) return;
      sessionIdRef.current = id;
      const now = Date.now();
      lastTickRef.current = now;
      lastActivityRef.current = now;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Foreground / background handling.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      const now = Date.now();
      if (state === 'active') {
        isForegroundRef.current = true;
        // Resume cleanly: don't count the time spent in the background, and
        // treat returning to the app as a fresh interaction.
        lastTickRef.current = now;
        lastActivityRef.current = now;
      } else {
        isForegroundRef.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  // The accrual tick.
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      if (isActive(now)) {
        activeMsRef.current += delta;
        pageActiveMsRef.current += delta;
        setActiveSeconds(Math.round(activeMsRef.current / 1000));
      }
    }, SESSION_CONFIG.tickMs);
    return () => clearInterval(interval);
  }, [ready, isActive]);

  /** Call on any user interaction (page turn, tap, scroll) to reset idle. */
  const registerInteraction = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const onPageChanged = useCallback((page: number) => {
    if (page === currentPageRef.current) return;
    const sessionId = sessionIdRef.current;

    // Flush dwell for the page we're leaving.
    if (sessionId && pageActiveMsRef.current > 0) {
      void recordPageEvent({
        sessionId,
        pageNumber: currentPageRef.current,
        dwellSeconds: pageActiveMsRef.current / 1000,
      });
    }

    pageActiveMsRef.current = 0;
    currentPageRef.current = page;
    visitedPagesRef.current.add(page);
    lastActivityRef.current = Date.now();

    setCurrentPage(page);
    setPagesRead(visitedPagesRef.current.size);
  }, []);

  const onLoadComplete = useCallback((numberOfPages: number) => {
    setTotalPages(numberOfPages);
  }, []);

  /** Persist the session. Safe to call multiple times; only the first counts. */
  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;

    if (pageActiveMsRef.current > 0) {
      await recordPageEvent({
        sessionId,
        pageNumber: currentPageRef.current,
        dwellSeconds: pageActiveMsRef.current / 1000,
      });
    }

    await finalizeSession(sessionId, {
      durationSeconds: activeMsRef.current / 1000,
      endPage: currentPageRef.current,
      pagesRead: visitedPagesRef.current.size,
    });
  }, []);

  // Finalize if the screen unmounts without an explicit finish().
  useEffect(() => {
    return () => {
      void finish();
    };
  }, [finish]);

  return {
    ready,
    currentPage,
    totalPages,
    activeSeconds,
    pagesRead,
    onPageChanged,
    onLoadComplete,
    registerInteraction,
    finish,
  };
}
