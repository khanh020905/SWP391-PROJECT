// Dictation library grouping — ported from The IELTS Dictionary
// (Website-Ielts frontend/src/utils/listening/parser.ts).
// Challenges are pre-normalized at export time (scripts wrote
// public/data/dictation/*.json), so this file only handles grouping
// the lesson index into shelves for the hub page.

export interface DictationIndexEntry {
  lesson_id: string;
  lesson_name: string;
  totalSentences: number;
}

export interface DictationChallenge {
  id: number;
  position: number;
  content: string;
  jsonContent: (string | string[])[];
  solution: string[][];
  audioSrc: string;
  translation?: string;
}

export interface DictationLesson {
  lessonId: string;
  lessonName: string;
  audioSrc: string;
  challenges: DictationChallenge[];
}

export interface ListeningTask {
  id: string;
  title: string;
  totalSentences: number;
  category?: string;
}

export interface CamVolume {
  id: string;
  title: string;
  tests: Record<string, ListeningTask[]>;
}

/**
 * Parses the lesson index into a hierarchical structure.
 * Supports Cambridge, Spelling, Numbers, Conversations, and IPA categories.
 */
export function parseListeningGroups(entries: DictationIndexEntry[]): CamVolume[] {
  const groups: Record<string, CamVolume> = {};

  entries.forEach((item) => {
    const lessonIdStr = String(item.lesson_id || "");
    const lessonName = item.lesson_name || `Lesson ${lessonIdStr}`;

    let groupId = "other";
    let groupTitle = "General Tasks";

    // Category detection logic (from lesson name prefixes or Cambridge format)
    const upperName = lessonName.toUpperCase();

    if (lessonName.match(/Cam\s*(\d+)/i)) {
      const match = lessonName.match(/Cam\s*(\d+)/i);
      groupId = `cam${match![1]}`;
      groupTitle = `Cambridge ${match![1]}`;
    } else if (upperName.includes("[SPELLING]") || lessonName.toLowerCase().includes("spelling")) {
      groupId = "spelling";
      groupTitle = "Spelling";
    } else if (upperName.includes("[NUMBERS]") || lessonName.toLowerCase().includes("number")) {
      groupId = "numbers";
      groupTitle = "Numbers";
    } else if (upperName.includes("[CONVERSATIONS]") || lessonName.toLowerCase().includes("conversation")) {
      groupId = "conversations";
      groupTitle = "Conversations";
    } else if (upperName.includes("[IPA]") || upperName.includes("[PRONUNCIATION]") || lessonName.toLowerCase().includes("pronunciation")) {
      groupId = "ipa";
      groupTitle = "Pronunciation (IPA)";
    }

    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        title: groupTitle,
        tests: {},
      };
    }

    // Determine sub-grouping (Tests for Cambridge, 'Sections' for Conversations)
    let testKey = "Exercises";
    if (groupId.startsWith("cam")) {
      const testMatch = lessonName.match(/Test\s*(\d+)/i);
      testKey = testMatch ? `Test ${testMatch[1]}` : "General";
    } else if (groupId === "conversations") {
      // Extract leading number from lesson name (e.g. "[CONVERSATIONS] - 25. Shopping" -> 25)
      const numMatch = lessonName.match(/(\d+)\./);
      if (numMatch) {
        const num = parseInt(numMatch[1]);
        const sectionNum = Math.ceil(num / 20);
        testKey = `Section ${sectionNum}`;
      }
    }

    if (!groups[groupId].tests[testKey]) {
      groups[groupId].tests[testKey] = [];
    }

    groups[groupId].tests[testKey].push({
      id: lessonIdStr,
      title: lessonName,
      totalSentences: item.totalSentences,
      category: groupId,
    });
  });

  // Sort groups: Cambridge descending first, then others alphabetically
  const sortedVolumes = Object.values(groups).sort((a, b) => {
    const isCamA = a.id.startsWith("cam");
    const isCamB = b.id.startsWith("cam");

    if (isCamA && isCamB) return b.id.localeCompare(a.id, undefined, { numeric: true });
    if (isCamA) return -1;
    if (isCamB) return 1;

    return a.title.localeCompare(b.title);
  });

  // Sort tasks within each test
  sortedVolumes.forEach((vol) => {
    Object.keys(vol.tests).forEach((testKey) => {
      vol.tests[testKey].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" })
      );
    });
  });

  return sortedVolumes;
}
