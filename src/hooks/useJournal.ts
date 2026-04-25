import { useState, useEffect, useCallback } from 'react';

export interface JournalEntry {
  text: string;
  domain: string;
  timestamp: number;
}

const STORAGE_KEY = 'ls_journal_entries';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  const loadEntries = useCallback(async () => {
    const data = await chrome.storage.local.get([STORAGE_KEY]);
    const allEntries: JournalEntry[] = (data[STORAGE_KEY] as JournalEntry[]) || [];

    // Show most recent first, keep last 50
    setEntries(allEntries.slice(-50).reverse());
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Group entries by date for the timeline view
  const groupedByDate: Record<string, JournalEntry[]> = {};
  for (const entry of entries) {
    const dateKey = new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(entry);
  }

  return {
    entries,
    groupedByDate,
    loadEntries,
  };
}
