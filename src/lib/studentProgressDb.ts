import fs from "fs";
import path from "path";

export interface StudentStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // "YYYY-MM-DD"
  lastStudyTimestamp: string | null; // ISO String
  dailyGoalMinutes: number;
  todayMinutes: number;
  lastGoalMetDate: string | null;
  history: Record<string, number>;
}

export interface StudyLog {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  timestamp: string; // ISO String
  activity: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: "STUDY_REMINDER" | "STREAK_WARNING" | "SYSTEM";
  status: "READ" | "UNREAD";
  createdAt: string; // ISO String
}

export interface PhaseTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedHours: number;
}

export interface LearningPhase {
  id: string;
  title: string;
  description: string;
  skills: string[];
  tasks: PhaseTask[];
}

export interface StudentRoadmap {
  userId: string;
  currentBand: number;
  targetBand: number;
  targetDate: string;
  dailyHours: number;
  focusSkills: string[];
  status: "PROPOSED" | "ACTIVE" | "COMPLETED";
  phases: LearningPhase[];
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyItem {
  id: string;
  userId: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  translation: string;
  exampleSentence?: string;
  ipa?: string;
  isFavorite: boolean;
  notes?: string;
  collectionId?: string | null;
  createdAt: string;
}

export interface VocabularyCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface StudentProgressData {
  streaks: Record<string, StudentStreak>;
  studyLogs: StudyLog[];
  notifications: InAppNotification[];
  roadmaps?: Record<string, StudentRoadmap>;
  vocabularies?: VocabularyItem[];
  collections?: VocabularyCollection[];
}

const PROGRESS_FILE = path.join(process.cwd(), "src", "lib", "studentProgress.json");

// Helper to format date to YYYY-MM-DD in local time zone
export function getLocalDateString(dateInput: Date = new Date()): string {
  const offset = dateInput.getTimezoneOffset();
  const localDate = new Date(dateInput.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

const initialProgressData = (): StudentProgressData => {
  const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const threeDaysAgo = getLocalDateString(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
  const today = getLocalDateString(new Date());

  return {
    streaks: {
      "usr_2": {
        userId: "usr_2",
        currentStreak: 5,
        longestStreak: 12,
        lastStudyDate: yesterday,
        lastStudyTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        dailyGoalMinutes: 30,
        todayMinutes: 35,
        lastGoalMetDate: yesterday,
        history: { [yesterday]: 35 }
      },
      "usr_4": {
        userId: "usr_4",
        currentStreak: 0,
        longestStreak: 4,
        lastStudyDate: threeDaysAgo,
        lastStudyTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        dailyGoalMinutes: 30,
        todayMinutes: 0,
        lastGoalMetDate: null,
        history: { [threeDaysAgo]: 0 }
      },
      "usr_5": {
        userId: "usr_5",
        currentStreak: 3,
        longestStreak: 3,
        lastStudyDate: today,
        lastStudyTimestamp: new Date().toISOString(),
        dailyGoalMinutes: 30,
        todayMinutes: 45,
        lastGoalMetDate: today,
        history: { [today]: 45 }
      }
    },
    studyLogs: [
      {
        id: "log_init_1",
        userId: "usr_2",
        date: yesterday,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        activity: "Luyện đề Speaking - Study & Hometown (Part 1)"
      },
      {
        id: "log_init_2",
        userId: "usr_5",
        date: today,
        timestamp: new Date().toISOString(),
        activity: "Luyện tập IELTS Speaking Room"
      }
    ],
    notifications: [
      {
        id: "notify_init_1",
        userId: "usr_2",
        title: "Duy trì streak học tập! 🔥",
        content: "Chúc mừng bạn đã đạt chuỗi 5 ngày học liên tiếp. Hãy tiếp tục luyện tập hôm nay để nâng band điểm IELTS nhé!",
        type: "STUDY_REMINDER",
        status: "UNREAD",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: "notify_init_2",
        userId: "usr_4",
        title: "Cảnh báo sắp mất chuỗi học tập! ⚠️",
        content: "Đã 3 ngày bạn chưa luyện tập IELTS. Hãy làm ngay một bài nói Speaking ngắn hôm nay để kích hoạt lại streak nhé!",
        type: "STREAK_WARNING",
        status: "UNREAD",
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ],
    vocabularies: [],
    collections: []
  };
};

function ensureProgressFileExists(): void {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PROGRESS_FILE)) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(initialProgressData(), null, 2), "utf-8");
  }
}

export async function readProgressData(): Promise<StudentProgressData> {
  ensureProgressFileExists();
  try {
    const fileData = await fs.promises.readFile(PROGRESS_FILE, "utf-8");
    const parsed = JSON.parse(fileData || JSON.stringify(initialProgressData()));
    if (!parsed.roadmaps) {
      parsed.roadmaps = {};
    }
    if (!parsed.vocabularies) {
      parsed.vocabularies = [];
    }
    if (!parsed.collections) {
      parsed.collections = [];
    }
    return parsed;
  } catch (error) {
    console.error("Lỗi khi đọc file studentProgress.json:", error);
    const fallback = initialProgressData();
    if (!fallback.roadmaps) {
      fallback.roadmaps = {};
    }
    if (!fallback.vocabularies) {
      fallback.vocabularies = [];
    }
    if (!fallback.collections) {
      fallback.collections = [];
    }
    return fallback;
  }
}

export async function writeProgressData(data: StudentProgressData): Promise<boolean> {
  ensureProgressFileExists();
  try {
    await fs.promises.writeFile(PROGRESS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Lỗi khi ghi file studentProgress.json:", error);
    return false;
  }
}

// Streaks Operations
export async function getStudentStreak(userId: string): Promise<StudentStreak> {
  const data = await readProgressData();
  const todayStr = getLocalDateString();

  if (!data.streaks[userId]) {
    data.streaks[userId] = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      lastStudyTimestamp: null,
      dailyGoalMinutes: 30,
      todayMinutes: 0,
      lastGoalMetDate: null,
      history: {}
    };
    await writeProgressData(data);
    return data.streaks[userId];
  }

  const streak = data.streaks[userId];
  
  // Backwards compatibility / default value initialization
  if (streak.dailyGoalMinutes === undefined) streak.dailyGoalMinutes = 30;
  if (streak.todayMinutes === undefined) streak.todayMinutes = 0;
  if (streak.history === undefined) streak.history = {};
  if (streak.lastGoalMetDate === undefined) streak.lastGoalMetDate = null;

  // Reset todayMinutes if it's a new day
  if (streak.lastStudyDate !== todayStr) {
    if (streak.lastStudyDate) {
      streak.history[streak.lastStudyDate] = streak.todayMinutes;
    }
    streak.todayMinutes = 0;
    
    // Check if the streak broke (yesterday's goal was not met)
    const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (streak.lastGoalMetDate !== yesterdayStr && streak.lastGoalMetDate !== todayStr) {
      streak.currentStreak = 0;
    }
    
    data.streaks[userId] = streak;
    await writeProgressData(data);
  }

  return streak;
}

export async function logStudyActivity(userId: string, activity: string): Promise<StudentStreak> {
  // Automatically award 10 minutes of study for general activities completed
  return await logStudyMinutes(userId, 10, activity);
}

export async function logStudyMinutes(userId: string, minutes: number, activity?: string): Promise<StudentStreak> {
  const data = await readProgressData();
  const todayStr = getLocalDateString();
  const timestamp = new Date().toISOString();

  if (!data.streaks[userId]) {
    data.streaks[userId] = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      lastStudyTimestamp: null,
      dailyGoalMinutes: 30,
      todayMinutes: 0,
      lastGoalMetDate: null,
      history: {}
    };
  }

  const streak = data.streaks[userId];
  
  if (streak.dailyGoalMinutes === undefined) streak.dailyGoalMinutes = 30;
  if (streak.todayMinutes === undefined) streak.todayMinutes = 0;
  if (streak.history === undefined) streak.history = {};
  if (streak.lastGoalMetDate === undefined) streak.lastGoalMetDate = null;

  // Check if it's a new day to reset todayMinutes
  if (streak.lastStudyDate !== todayStr) {
    if (streak.lastStudyDate) {
      streak.history[streak.lastStudyDate] = streak.todayMinutes;
    }
    streak.todayMinutes = 0;
  }

  // Accumulate minutes
  streak.todayMinutes += minutes;
  streak.lastStudyDate = todayStr;
  streak.lastStudyTimestamp = timestamp;
  streak.history[todayStr] = streak.todayMinutes;

  // Check if today's goal is met
  const goalMetToday = streak.todayMinutes >= streak.dailyGoalMinutes;
  
  if (goalMetToday) {
    if (streak.lastGoalMetDate !== todayStr) {
      const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
      
      if (streak.lastGoalMetDate === yesterdayStr) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      
      streak.lastGoalMetDate = todayStr;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }
  } else {
    // If goal not met today yet, check if the streak is already broken from yesterday
    const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (streak.lastGoalMetDate !== todayStr && streak.lastGoalMetDate !== yesterdayStr) {
      streak.currentStreak = 0;
    }
  }

  data.streaks[userId] = streak;

  // Add study log
  const newLog: StudyLog = {
    id: "log_" + Math.random().toString(36).substring(2, 9),
    userId,
    date: todayStr,
    timestamp,
    activity: activity || `Tích lũy ${minutes} phút học tập`
  };
  data.studyLogs.push(newLog);

  await writeProgressData(data);
  return streak;
}

export async function updateStudentGoal(userId: string, dailyGoalMinutes: number): Promise<StudentStreak> {
  const data = await readProgressData();
  const todayStr = getLocalDateString();
  
  if (!data.streaks[userId]) {
    data.streaks[userId] = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      lastStudyTimestamp: null,
      dailyGoalMinutes: dailyGoalMinutes,
      todayMinutes: 0,
      lastGoalMetDate: null,
      history: {}
    };
  } else {
    const streak = data.streaks[userId];
    streak.dailyGoalMinutes = dailyGoalMinutes;
    
    // If new goal is smaller and matches/exceeds today's minutes, mark goal as met today!
    if (streak.todayMinutes >= dailyGoalMinutes && streak.lastGoalMetDate !== todayStr) {
      const yesterdayStr = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
      if (streak.lastGoalMetDate === yesterdayStr) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.lastGoalMetDate = todayStr;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }
  }

  await writeProgressData(data);
  return data.streaks[userId];
}

// Notifications Operations
export async function getNotifications(userId: string): Promise<InAppNotification[]> {
  const data = await readProgressData();
  return data.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addNotification(
  userId: string,
  title: string,
  content: string,
  type: InAppNotification["type"]
): Promise<InAppNotification> {
  const data = await readProgressData();
  const newNotification: InAppNotification = {
    id: "notify_" + Math.random().toString(36).substring(2, 9),
    userId,
    title,
    content,
    type,
    status: "UNREAD",
    createdAt: new Date().toISOString()
  };
  
  data.notifications.push(newNotification);
  await writeProgressData(data);
  return newNotification;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
  const data = await readProgressData();
  const notification = data.notifications.find(n => n.id === notificationId && n.userId === userId);
  
  if (notification) {
    notification.status = "READ";
    await writeProgressData(data);
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const data = await readProgressData();
  let updated = false;
  
  data.notifications.forEach(n => {
    if (n.userId === userId && n.status === "UNREAD") {
      n.status = "READ";
      updated = true;
    }
  });

  if (updated) {
    await writeProgressData(data);
    return true;
  }
  return false;
}

export async function deleteNotification(userId: string, notificationId: string): Promise<boolean> {
  const data = await readProgressData();
  const index = data.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
  
  if (index !== -1) {
    data.notifications.splice(index, 1);
    await writeProgressData(data);
    return true;
  }
  return false;
}

// Roadmap Operations
export async function getStudentRoadmap(userId: string): Promise<StudentRoadmap | null> {
  const data = await readProgressData();
  return data.roadmaps?.[userId] || null;
}

export async function saveStudentRoadmap(userId: string, roadmap: StudentRoadmap): Promise<boolean> {
  const data = await readProgressData();
  if (!data.roadmaps) {
    data.roadmaps = {};
  }
  data.roadmaps[userId] = roadmap;
  return await writeProgressData(data);
}

export async function deleteStudentRoadmap(userId: string): Promise<boolean> {
  const data = await readProgressData();
  if (data.roadmaps && data.roadmaps[userId]) {
    delete data.roadmaps[userId];
    return await writeProgressData(data);
  }
  return false;
}

// Vocabulary & Collections Operations
export async function getVocabularies(userId: string): Promise<VocabularyItem[]> {
  const data = await readProgressData();
  const vocabs = data.vocabularies || [];
  const userVocabs = vocabs.filter(v => v.userId === userId);

  if (userVocabs.length === 0) {
    if (!data.collections) data.collections = [];
    const userCollections = data.collections.filter(c => c.userId === userId);
    
    let col1Id = "col_1_" + userId;
    let col2Id = "col_2_" + userId;
    
    if (userCollections.length === 0) {
      data.collections.push(
        {
          id: col1Id,
          userId,
          name: "Urban Farming Vocab",
          description: "Từ vựng quan trọng rút ra từ bài đọc về Nông nghiệp đô thị",
          createdAt: new Date().toISOString()
        },
        {
          id: col2Id,
          userId,
          name: "Speaking Boosters",
          description: "Từ vựng nâng band điểm trong phòng nói Speaking",
          createdAt: new Date().toISOString()
        }
      );
      col1Id = "col_1_" + userId;
      col2Id = "col_2_" + userId;
    } else {
      col1Id = userCollections[0].id;
      col2Id = userCollections[1]?.id || col1Id;
    }

    const seedVocabs: VocabularyItem[] = [
      {
        id: "vocab_1_" + userId,
        userId,
        word: "proponents",
        partOfSpeech: "noun",
        definition: "A person who speaks publicly in support of a particular idea or plan of action.",
        translation: "Người ủng hộ, người đề xuất (Người ủng hộ)",
        exampleSentence: "He is one of the leading proponents of urban agriculture and green buildings.",
        ipa: "/prəˈpəʊ.nənt/",
        isFavorite: true,
        collectionId: col1Id,
        notes: "Collocation quan trọng: leading proponents of...",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_2_" + userId,
        userId,
        word: "emissions",
        partOfSpeech: "noun",
        definition: "An amount of gas, heat, light, etc. that is sent out.",
        translation: "Sự phát thải, lượng khí thải (Sự phát thải)",
        exampleSentence: "Many countries are trying to reduce their greenhouse gas emissions to combat climate change.",
        ipa: "/iˈmɪʃ.ən/",
        isFavorite: false,
        collectionId: col1Id,
        notes: "greenhouse gas emissions",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_3_" + userId,
        userId,
        word: "yield",
        partOfSpeech: "noun",
        definition: "An amount of something positive, such as food or profit, that is produced or generated.",
        translation: "Sản lượng, năng suất, lợi nhuận (Sản lượng)",
        exampleSentence: "Modern hydroponic farms can produce up to ten times the yield of traditional soil agriculture.",
        ipa: "/jiːld/",
        isFavorite: true,
        collectionId: col1Id,
        notes: "crop yield / high yield",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_4_" + userId,
        userId,
        word: "vital",
        partOfSpeech: "adjective",
        definition: "Necessary for the success or continued existence of something; extremely important.",
        translation: "Sống còn, cực kỳ quan trọng, thiết yếu (Cực kỳ quan trọng)",
        exampleSentence: "Good nutrition and regular exercise are vital for maintaining a healthy life.",
        ipa: "/ˈvaɪ.təl/",
        isFavorite: false,
        collectionId: col1Id,
        notes: "vital for / vital role",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_5_" + userId,
        userId,
        word: "accommodate",
        partOfSpeech: "verb",
        definition: "To provide with a place to live or to be stored; to have space for.",
        translation: "Chứa được, cung cấp chỗ ở, đáp ứng (Chứa được)",
        exampleSentence: "The new conference room can easily accommodate up to eighty attendees.",
        ipa: "/əˈcɒm.ə.deɪt/",
        isFavorite: false,
        collectionId: col2Id,
        notes: "accommodate guests / attendees",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_6_" + userId,
        userId,
        word: "state-of-the-art",
        partOfSpeech: "adjective",
        definition: "Very modern and using the most recent ideas and methods.",
        translation: "Tối tân, hiện đại nhất, tiên tiến nhất (Tối tân)",
        exampleSentence: "The Richmond Suite is equipped with a state-of-the-art sound system and projector.",
        ipa: "/ˌsteɪt.əv.ði.ˈɑːt/",
        isFavorite: true,
        collectionId: col2Id,
        notes: "Từ rất tốt để ghi điểm cao cho Speaking Part 2",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_7_" + userId,
        userId,
        word: "sustainable",
        partOfSpeech: "adjective",
        definition: "Able to continue over a period of time; causing little or no damage to the environment.",
        translation: "Bền vững, có tính bền vững (Bền vững)",
        exampleSentence: "Urban farming helps create a more sustainable urban ecosystem.",
        ipa: "/səˈsteɪ.nə.bəl/",
        isFavorite: false,
        collectionId: col1Id,
        notes: "sustainable development / ecosystem",
        createdAt: new Date().toISOString()
      },
      {
        id: "vocab_8_" + userId,
        userId,
        word: "resilient",
        partOfSpeech: "adjective",
        definition: "Able to be happy, successful, etc. again after something difficult or bad has happened, or returning to original shape.",
        translation: "Kiên cường, bền bỉ, có khả năng phục hồi nhanh (Kiên cường)",
        exampleSentence: "Urban agriculture offers a resilient buffer against food supply chain disruptions.",
        ipa: "/rɪˈzɪl.i.ənt/",
        isFavorite: true,
        collectionId: col1Id,
        notes: "resilient buffer / economy",
        createdAt: new Date().toISOString()
      }
    ];

    if (!data.vocabularies) data.vocabularies = [];
    data.vocabularies.push(...seedVocabs);
    await writeProgressData(data);
    return seedVocabs;
  }

  return userVocabs;
}

export async function addVocabulary(
  userId: string,
  word: string,
  partOfSpeech: string,
  definition: string,
  translation: string,
  exampleSentence?: string,
  ipa?: string,
  collectionId?: string | null,
  isFavorite?: boolean,
  notes?: string
): Promise<VocabularyItem> {
  const data = await readProgressData();
  if (!data.vocabularies) {
    data.vocabularies = [];
  }
  
  const existingIndex = data.vocabularies.findIndex(
    v => v.userId === userId && v.word.toLowerCase() === word.toLowerCase()
  );
  
  const vocabItem: VocabularyItem = {
    id: existingIndex !== -1 ? data.vocabularies[existingIndex].id : "vocab_" + Math.random().toString(36).substring(2, 9),
    userId,
    word,
    partOfSpeech,
    definition,
    translation,
    exampleSentence,
    ipa,
    isFavorite: isFavorite ?? (existingIndex !== -1 ? data.vocabularies[existingIndex].isFavorite : false),
    notes: notes ?? (existingIndex !== -1 ? data.vocabularies[existingIndex].notes : ""),
    collectionId: collectionId ?? (existingIndex !== -1 ? data.vocabularies[existingIndex].collectionId : null),
    createdAt: existingIndex !== -1 ? data.vocabularies[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex !== -1) {
    data.vocabularies[existingIndex] = vocabItem;
  } else {
    data.vocabularies.push(vocabItem);
  }

  await writeProgressData(data);
  return vocabItem;
}

export async function updateVocabulary(
  userId: string,
  vocabId: string,
  updates: Partial<Omit<VocabularyItem, "id" | "userId" | "word" | "createdAt">>
): Promise<VocabularyItem | null> {
  const data = await readProgressData();
  const vocabs = data.vocabularies || [];
  const index = vocabs.findIndex(v => v.id === vocabId && v.userId === userId);
  
  if (index !== -1) {
    const updated = {
      ...vocabs[index],
      ...updates
    };
    vocabs[index] = updated;
    data.vocabularies = vocabs;
    await writeProgressData(data);
    return updated;
  }
  return null;
}

export async function toggleFavoriteVocab(userId: string, vocabId: string): Promise<boolean> {
  const data = await readProgressData();
  const vocabs = data.vocabularies || [];
  const index = vocabs.findIndex(v => v.id === vocabId && v.userId === userId);
  
  if (index !== -1) {
    vocabs[index].isFavorite = !vocabs[index].isFavorite;
    data.vocabularies = vocabs;
    await writeProgressData(data);
    return true;
  }
  return false;
}

export async function deleteVocabulary(userId: string, vocabId: string): Promise<boolean> {
  const data = await readProgressData();
  const vocabs = data.vocabularies || [];
  const index = vocabs.findIndex(v => v.id === vocabId && v.userId === userId);
  
  if (index !== -1) {
    vocabs.splice(index, 1);
    data.vocabularies = vocabs;
    await writeProgressData(data);
    return true;
  }
  return false;
}

export async function getCollections(userId: string): Promise<VocabularyCollection[]> {
  const data = await readProgressData();
  const cols = data.collections || [];
  const userCollections = cols.filter(c => c.userId === userId);

  if (userCollections.length === 0) {
    if (!data.collections) data.collections = [];
    const newCollections = [
      {
        id: "col_1_" + userId,
        userId,
        name: "Urban Farming Vocab",
        description: "Từ vựng quan trọng rút ra từ bài đọc về Nông nghiệp đô thị",
        createdAt: new Date().toISOString()
      },
      {
        id: "col_2_" + userId,
        userId,
        name: "Speaking Boosters",
        description: "Từ vựng nâng band điểm trong phòng nói Speaking",
        createdAt: new Date().toISOString()
      }
    ];
    data.collections.push(...newCollections);
    await writeProgressData(data);
    return newCollections;
  }

  return userCollections;
}

export async function createCollection(
  userId: string,
  name: string,
  description?: string
): Promise<VocabularyCollection> {
  const data = await readProgressData();
  if (!data.collections) {
    data.collections = [];
  }
  
  const newCol: VocabularyCollection = {
    id: "col_" + Math.random().toString(36).substring(2, 9),
    userId,
    name,
    description,
    createdAt: new Date().toISOString()
  };
  
  data.collections.push(newCol);
  await writeProgressData(data);
  return newCol;
}

export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const data = await readProgressData();
  const cols = data.collections || [];
  const index = cols.findIndex(c => c.id === collectionId && c.userId === userId);
  
  if (index !== -1) {
    cols.splice(index, 1);
    data.collections = cols;
    
    // Also remove collectionId reference from any vocabularies in this collection
    if (data.vocabularies) {
      data.vocabularies = data.vocabularies.map(v => 
        (v.userId === userId && v.collectionId === collectionId) ? { ...v, collectionId: null } : v
      );
    }
    
    await writeProgressData(data);
    return true;
  }
  return false;
}
