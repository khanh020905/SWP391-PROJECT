// ============================================================
// IELTS Reading Practice Data
// Sources: Cambridge 9-20, Essential Words for the IELTS
// ============================================================

export interface ReadingPassage {
  id: string;
  title: string;
  page?: number;
}

export interface ReadingUnit {
  unit: number;
  topic: string;
  icon: string;
  passages: ReadingPassage[];
}

export interface CambridgeTest {
  id: string;
  book: number;
  test: number;
  title: string;
  passages: { title: string; topic: string }[];
  level: string;
  status: "free" | "paid";
}

// ============================================================
// CAMBRIDGE 9 - 20 (Ưu tiên hàng đầu)
// ============================================================
export const cambridgeTests: CambridgeTest[] = [
  // Cambridge 9
  { id: "cam-9-1", book: 9, test: 1, title: "Cambridge 9 - Test 1", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "William Henry Perkin", topic: "History" },
    { title: "Is There Anybody Out There?", topic: "Science" },
    { title: "The History of the Tortoise", topic: "Natural Science" },
  ]},
  { id: "cam-9-2", book: 9, test: 2, title: "Cambridge 9 - Test 2", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "Hearing impairment in children", topic: "Health" },
    { title: "Venus in Transit", topic: "Science" },
    { title: "A Neuroscientist Reveals How to Think Differently", topic: "Psychology" },
  ]},
  { id: "cam-9-3", book: 9, test: 3, title: "Cambridge 9 - Test 3", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "Attitudes to Language", topic: "Society" },
    { title: "Tidal Power", topic: "Technology" },
    { title: "Information Theory", topic: "Science" },
  ]},
  { id: "cam-9-4", book: 9, test: 4, title: "Cambridge 9 - Test 4", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "The Life and Work of Marie Curie", topic: "History" },
    { title: "Young Children's Sense of Identity", topic: "Education" },
    { title: "The Development of Museums", topic: "Culture" },
  ]},
  // Cambridge 10
  { id: "cam-10-1", book: 10, test: 1, title: "Cambridge 10 - Test 1", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "Stepwells", topic: "Culture" },
    { title: "European Transport Systems", topic: "Transportation" },
    { title: "The Psychology of Innovation", topic: "Psychology" },
  ]},
  { id: "cam-10-2", book: 10, test: 2, title: "Cambridge 10 - Test 2", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "Tea and the Industrial Revolution", topic: "History" },
    { title: "Gifted Children and Learning", topic: "Education" },
    { title: "Museums of Fine Art and Their Public", topic: "Culture" },
  ]},
  { id: "cam-10-3", book: 10, test: 3, title: "Cambridge 10 - Test 3", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "The Context, Meaning and Scope of Tourism", topic: "Tourism" },
    { title: "Autumn Leaves", topic: "Natural Science" },
    { title: "Beyond the Blue Horizon", topic: "History" },
  ]},
  { id: "cam-10-4", book: 10, test: 4, title: "Cambridge 10 - Test 4", level: "Band 5.5-8.0", status: "free", passages: [
    { title: "The Megafires of California", topic: "Environment" },
    { title: "Second Nature", topic: "Psychology" },
    { title: "When Evolution Runs Backwards", topic: "Natural Science" },
  ]},
  // Cambridge 11
  { id: "cam-11-1", book: 11, test: 1, title: "Cambridge 11 - Test 1", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Crop-growing Skyscrapers", topic: "Technology" },
    { title: "The Falkirk Wheel", topic: "Technology" },
    { title: "Reducing the Effects of Climate Change", topic: "Environment" },
  ]},
  { id: "cam-11-2", book: 11, test: 2, title: "Cambridge 11 - Test 2", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Raising the Mary Rose", topic: "History" },
    { title: "What Destroyed the Civilisation of Easter Island?", topic: "History" },
    { title: "Neuroaesthetics", topic: "Psychology" },
  ]},
  { id: "cam-11-3", book: 11, test: 3, title: "Cambridge 11 - Test 3", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Story of Silk", topic: "History" },
    { title: "Great Migrations", topic: "Natural Science" },
    { title: "Precocity and Genius", topic: "Education" },
  ]},
  { id: "cam-11-4", book: 11, test: 4, title: "Cambridge 11 - Test 4", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Research Using Twins", topic: "Science" },
    { title: "An Introduction to Film Sound", topic: "Culture" },
    { title: "This Marvellous Invention", topic: "Technology" },
  ]},
  // Cambridge 12
  { id: "cam-12-1", book: 12, test: 1, title: "Cambridge 12 - Test 1", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Cork", topic: "Natural Science" },
    { title: "Collecting as a Hobby", topic: "Society" },
    { title: "What's the Purpose of Gaining Knowledge?", topic: "Education" },
  ]},
  { id: "cam-12-2", book: 12, test: 2, title: "Cambridge 12 - Test 2", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Risks Agriculture Faces in Developing Countries", topic: "Environment" },
    { title: "The Lost City", topic: "History" },
    { title: "The Benefits of Being Bilingual", topic: "Education" },
  ]},
  { id: "cam-12-3", book: 12, test: 3, title: "Cambridge 12 - Test 3", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Flying Tortoises", topic: "Natural Science" },
    { title: "The Intersection of Health Sciences and Geography", topic: "Health" },
    { title: "Music and the Emotions", topic: "Psychology" },
  ]},
  { id: "cam-12-4", book: 12, test: 4, title: "Cambridge 12 - Test 4", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Cut Flower Trade", topic: "Business" },
    { title: "Bring Back the Big Cats", topic: "Environment" },
    { title: "UK Dystopia", topic: "Society" },
  ]},
  // Cambridge 13
  { id: "cam-13-1", book: 13, test: 1, title: "Cambridge 13 - Test 1", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Case Study: Tourism in the Maldives", topic: "Tourism" },
    { title: "Artificial Artists", topic: "Technology" },
    { title: "Cutty Sark: the Fastest Sailing Ship", topic: "History" },
  ]},
  { id: "cam-13-2", book: 13, test: 2, title: "Cambridge 13 - Test 2", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Bringing Cinnamon to Europe", topic: "History" },
    { title: "Oxytocin", topic: "Health" },
    { title: "Making the Most of Trends", topic: "Business" },
  ]},
  { id: "cam-13-3", book: 13, test: 3, title: "Cambridge 13 - Test 3", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Coconut Palm", topic: "Natural Science" },
    { title: "How Baby Shark do?", topic: "Natural Science" },
    { title: "Book Review", topic: "Culture" },
  ]},
  { id: "cam-13-4", book: 13, test: 4, title: "Cambridge 13 - Test 4", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Cutty Sark: the Fastest Sailing Ship", topic: "History" },
    { title: "Why Laughing Matters", topic: "Psychology" },
    { title: "Artificial Intelligence", topic: "Technology" },
  ]},
  // Cambridge 14
  { id: "cam-14-1", book: 14, test: 1, title: "Cambridge 14 - Test 1", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Importance of Children's Play", topic: "Education" },
    { title: "The Growth of Bike-sharing Schemes", topic: "Transportation" },
    { title: "Motivational Factors and the Hospitality Industry", topic: "Business" },
  ]},
  { id: "cam-14-2", book: 14, test: 2, title: "Cambridge 14 - Test 2", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Alexander Henderson", topic: "Culture" },
    { title: "Back to the Future of Skyscraper Design", topic: "Technology" },
    { title: "Why Companies Should Welcome Disorder", topic: "Business" },
  ]},
  { id: "cam-14-3", book: 14, test: 3, title: "Cambridge 14 - Test 3", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Concept of Intelligence", topic: "Psychology" },
    { title: "Saving the Soil", topic: "Environment" },
    { title: "Book Review on Being Funny", topic: "Culture" },
  ]},
  { id: "cam-14-4", book: 14, test: 4, title: "Cambridge 14 - Test 4", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Secret of Stay Young", topic: "Health" },
    { title: "Why Zoos Are Good", topic: "Environment" },
    { title: "Chelsea Physic Garden", topic: "History" },
  ]},
  // Cambridge 15
  { id: "cam-15-1", book: 15, test: 1, title: "Cambridge 15 - Test 1", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Nutmeg – a Valuable Spice", topic: "History" },
    { title: "Driverless Cars", topic: "Technology" },
    { title: "What is the Appeal of Smartphones?", topic: "Society" },
  ]},
  { id: "cam-15-2", book: 15, test: 2, title: "Cambridge 15 - Test 2", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Could Earth Be Swallowed by a Black Hole?", topic: "Science" },
    { title: "Silbo Gomero", topic: "Culture" },
    { title: "The Deforestation of the Amazon", topic: "Environment" },
  ]},
  { id: "cam-15-3", book: 15, test: 3, title: "Cambridge 15 - Test 3", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "Henry Moore", topic: "Culture" },
    { title: "The Existential Threat of AI", topic: "Technology" },
    { title: "What Makes Us Human?", topic: "Psychology" },
  ]},
  { id: "cam-15-4", book: 15, test: 4, title: "Cambridge 15 - Test 4", level: "Band 6.0-8.5", status: "free", passages: [
    { title: "The Return of the Huarango", topic: "Environment" },
    { title: "Attitudes Towards Artificial Intelligence", topic: "Technology" },
    { title: "A Debate on Zoos", topic: "Society" },
  ]},
  // Cambridge 16
  { id: "cam-16-1", book: 16, test: 1, title: "Cambridge 16 - Test 1", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Why We Need to Protect Polar Bears", topic: "Environment" },
    { title: "The Step Pyramid of Djoser", topic: "History" },
    { title: "The Future of Work", topic: "Business" },
  ]},
  { id: "cam-16-2", book: 16, test: 2, title: "Cambridge 16 - Test 2", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The White Horse of Uffington", topic: "History" },
    { title: "I Contain Multitudes", topic: "Science" },
    { title: "How to Make Wise Decisions", topic: "Psychology" },
  ]},
  { id: "cam-16-3", book: 16, test: 3, title: "Cambridge 16 - Test 3", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Roman Tunnels", topic: "History" },
    { title: "Responding to Climate Change", topic: "Environment" },
    { title: "How to Lose Weight", topic: "Health" },
  ]},
  { id: "cam-16-4", book: 16, test: 4, title: "Cambridge 16 - Test 4", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Geoglyphs of South America", topic: "History" },
    { title: "Do You Have What It Takes?", topic: "Business" },
    { title: "Gaining a Second Language", topic: "Education" },
  ]},
  // Cambridge 17
  { id: "cam-17-1", book: 17, test: 1, title: "Cambridge 17 - Test 1", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The Development of the London Underground", topic: "Transportation" },
    { title: "Stadiums: past, present and future", topic: "Culture" },
    { title: "To Catch a King", topic: "History" },
  ]},
  { id: "cam-17-2", book: 17, test: 2, title: "Cambridge 17 - Test 2", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The Dead Sea Scrolls", topic: "History" },
    { title: "A second attempt at domesticating the tomato", topic: "Science" },
    { title: "Insight or evolution?", topic: "Psychology" },
  ]},
  { id: "cam-17-3", book: 17, test: 3, title: "Cambridge 17 - Test 3", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The thylacine", topic: "Natural Science" },
    { title: "Palm oil", topic: "Environment" },
    { title: "Building the skyline", topic: "Architecture" },
  ]},
  { id: "cam-17-4", book: 17, test: 4, title: "Cambridge 17 - Test 4", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Bats to the rescue", topic: "Natural Science" },
    { title: "Roman tunnels", topic: "History" },
    { title: "Why we need to protect polar bears", topic: "Environment" },
  ]},
  // Cambridge 18
  { id: "cam-18-1", book: 18, test: 1, title: "Cambridge 18 - Test 1", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Urban Farming", topic: "Technology" },
    { title: "Forest management in Pennsylvania, USA", topic: "Environment" },
    { title: "Conquering Earth's space junk problem", topic: "Science" },
  ]},
  { id: "cam-18-2", book: 18, test: 2, title: "Cambridge 18 - Test 2", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Stonehenge", topic: "History" },
    { title: "Living with Artificial Intelligence", topic: "Technology" },
    { title: "An Ideal City", topic: "Architecture" },
  ]},
  { id: "cam-18-3", book: 18, test: 3, title: "Cambridge 18 - Test 3", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Materials for the Future", topic: "Technology" },
    { title: "Conquering Earth's Space Junk Problem", topic: "Science" },
    { title: "AI and the Arts", topic: "Culture" },
  ]},
  { id: "cam-18-4", book: 18, test: 4, title: "Cambridge 18 - Test 4", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Green Roofs", topic: "Environment" },
    { title: "The Growth of Cycling", topic: "Transportation" },
    { title: "What Do We Know About the Origin of Language?", topic: "Science" },
  ]},
  // Cambridge 19
  { id: "cam-19-1", book: 19, test: 1, title: "Cambridge 19 - Test 1", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "How tennis rackets have changed", topic: "Sports" },
    { title: "The pirates of the ancient Mediterranean", topic: "History" },
    { title: "The persistence and peril of misinformation", topic: "Psychology" },
  ]},
  { id: "cam-19-2", book: 19, test: 2, title: "Cambridge 19 - Test 2", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The Industrial Revolution in Britain", topic: "History" },
    { title: "Athletes and stress", topic: "Psychology" },
    { title: "An inquiry into the existence of the gifted child", topic: "Education" },
  ]},
  { id: "cam-19-3", book: 19, test: 3, title: "Cambridge 19 - Test 3", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Archaeologists discover evidence of prehistoric island settlers", topic: "History" },
    { title: "The global importance of wetlands", topic: "Environment" },
    { title: "Is the era of artificial speech translation upon us?", topic: "Technology" },
  ]},
  { id: "cam-19-4", book: 19, test: 4, title: "Cambridge 19 - Test 4", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The impact of climate change on butterflies in Britain", topic: "Environment" },
    { title: "Deep-sea mining", topic: "Science" },
    { title: "The unselfish gene", topic: "Psychology" },
  ]},
  // Cambridge 20
  { id: "cam-20-1", book: 20, test: 1, title: "Cambridge 20 - Test 1", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The kākāpō", topic: "Natural Science" },
    { title: "Reintroducing elms to Britain", topic: "Environment" },
    { title: "How stress affects our judgement", topic: "Psychology" },
  ]},
  { id: "cam-20-2", book: 20, test: 2, title: "Cambridge 20 - Test 2", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Manatees", topic: "Natural Science" },
    { title: "Procrastination", topic: "Psychology" },
    { title: "Invasion of the Robot Umpires", topic: "Technology" },
  ]},
  { id: "cam-20-3", book: 20, test: 3, title: "Cambridge 20 - Test 3", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Frozen Food", topic: "History" },
    { title: "Can the planet's coral reefs be saved?", topic: "Environment" },
    { title: "Robots and us", topic: "Technology" },
  ]},
  { id: "cam-20-4", book: 20, test: 4, title: "Cambridge 20 - Test 4", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "Georgia O'Keeffe", topic: "Culture" },
    { title: "Adapting to the effects of climate change", topic: "Environment" },
    { title: "A new role for livestock guard dogs", topic: "Natural Science" },
  ]},
  { id: "cam-20-5", book: 20, test: 5, title: "Cambridge 20 - Test 5", level: "Band 6.0-9.0", status: "free", passages: [
    { title: "The MAGIC of KEFIR", topic: "Health" },
    { title: "FOOD FOR THOUGHT", topic: "Environment" },
    { title: "Love stories", topic: "Psychology" },
  ]},
];

// ============================================================
// ĐỀ VOL SIÊU CHUẨN
// ============================================================
export interface DeVolTest {
  id: string;
  test: number;
  title: string;
  passages: { title: string; topic: string }[];
  level: string;
}

export const deVolTests: DeVolTest[] = [
  { id: "tid-vol-1", test: 1, title: "Đề Vol Siêu Chuẩn · Test 1", level: "Band 6.0-8.0", passages: [{ title: "The Baobabs of Madagascar", topic: "Science" }, { title: "Coins – the first form of money", topic: "History" }, { title: "Creating a Better Grapefruit", topic: "Environment" }] },
  { id: "tid-vol-2", test: 2, title: "Đề Vol Siêu Chuẩn · Test 2", level: "Band 6.0-8.0", passages: [{ title: "Andrew Carnegie: industrialist and philanthropist", topic: "History" }, { title: "Translating: a key to international understanding?", topic: "Culture" }, { title: "What could possibly explain the lack of vegetation on Easter Island?", topic: "Environment" }] },
  { id: "tid-vol-3", test: 3, title: "Đề Vol Siêu Chuẩn · Test 3", level: "Band 6.0-8.0", passages: [{ title: "NEW UNDERSTANDING OF GIRAFFES IN THE WILD", topic: "Science" }, { title: "Healthy buildings, productive people", topic: "Society" }, { title: "Child’s Play in Medieval England", topic: "History" }] },
  { id: "tid-vol-4", test: 4, title: "Đề Vol Siêu Chuẩn · Test 4", level: "Band 6.0-8.0", passages: [{ title: "Traditional Farming in Zambia's Luapula Province", topic: "Agriculture" }, { title: "Babies cry in their mother tongue", topic: "Science" }, { title: "Ancient Rome: archaeologists are trying to understand more about the early history of the city", topic: "History" }] },
  { id: "tid-vol-5", test: 5, title: "Đề Vol Siêu Chuẩn · Test 5", level: "Band 6.0-8.0", passages: [{ title: "The origins of tennis", topic: "Sports" }, { title: "John Ray and the Study of Plants", topic: "Science" }, { title: "Sir Francis Ronalds 1788 – 1873", topic: "History" }] },
  { id: "tid-vol-6", test: 6, title: "Đề Vol Siêu Chuẩn · Test 6", level: "Band 6.0-8.0", passages: [{ title: "HEALTH IN THE WILD", topic: "Science" }, { title: "SPEAKING OF NOTHING", topic: "Society" }, { title: "CHANGES TO THE SOVIET UNION’S WORKING WEEK", topic: "History" }] },
  { id: "tid-vol-7", test: 7, title: "Đề Vol Siêu Chuẩn · Test 7", level: "Band 6.0-8.0", passages: [{ title: "SEAWEED", topic: "Environment" }, { title: "THE HISTORY OF CELTIC LANGUAGE", topic: "Culture" }, { title: "The psychology of new product adoption", topic: "Business" }] },
  { id: "tid-vol-8", test: 8, title: "Đề Vol Siêu Chuẩn · Test 8", level: "Band 6.0-8.0", passages: [{ title: "Australia's Airborne Dentists", topic: "Health" }, { title: "Public art programs: research update", topic: "Culture" }, { title: "200 Years of Australian Landscapes at the Royal Academy in London", topic: "Art" }] },
];

// ============================================================
// TID PRACTICE SETS
// ============================================================
export interface TIDPracticeTest {
  id: string;
  set: number;
  test: number;
  title: string;
  passages: { title: string; topic: string }[];
  level: string;
}

export const tidPracticeTests: TIDPracticeTest[] = [
  {
    id: "tid-20-1",
    set: 20,
    test: 1,
    title: "TID Practice Set 20 · Test 1",
    level: "Band 6.0-8.0",
    passages: [
      { title: "The Kākāpō", topic: "Natural Science" },
      { title: "Reintroducing Elms to Britain", topic: "Environment" },
      { title: "How Stress Affects Our Judgement", topic: "Psychology" },
    ],
  },
  {
    id: "tid-20-2",
    set: 20,
    test: 2,
    title: "TID Practice Set 20 · Test 2",
    level: "Band 6.0-8.0",
    passages: [
      { title: "Manatees", topic: "Natural Science" },
      { title: "Procrastination", topic: "Psychology" },
      { title: "Invasion of the Robot Umpires", topic: "Technology" },
    ],
  },
  {
    id: "tid-20-3",
    set: 20,
    test: 3,
    title: "TID Practice Set 20 · Test 3",
    level: "Band 6.0-8.0",
    passages: [
      { title: "Frozen Food", topic: "History" },
      { title: "Can the Planet's Coral Reefs Be Saved?", topic: "Environment" },
      { title: "Robots and Us", topic: "Technology" },
    ],
  },
  {
    id: "tid-20-4",
    set: 20,
    test: 4,
    title: "TID Practice Set 20 · Test 4",
    level: "Band 6.0-8.0",
    passages: [
      { title: "Georgia O'Keeffe", topic: "Culture" },
      { title: "Adapting to the Effects of Climate Change", topic: "Environment" },
      { title: "A New Role for Livestock Guard Dogs", topic: "Natural Science" },
    ],
  },
];

// ============================================================
// ESSENTIAL WORDS FOR THE IELTS (10 Units × 3 Passages)
// Source: Google Drive - Essential words for the IELTS
// ============================================================
export const essentialWordsUnits: ReadingUnit[] = [
  {
    unit: 1,
    topic: "The Natural World",
    icon: "🌿",
    passages: [
      { id: "ew-1-1", title: "Environmental Impacts of Logging", page: 9 },
      { id: "ew-1-2", title: "Bird Migration", page: 18 },
      { id: "ew-1-3", title: "Plant Life in the Taklimakan Desert", page: 27 },
    ],
  },
  {
    unit: 2,
    topic: "Leisure Time",
    icon: "🎯",
    passages: [
      { id: "ew-2-1", title: "Peripheral Vision in Sports", page: 37 },
      { id: "ew-2-2", title: "History of the Circus", page: 45 },
      { id: "ew-2-3", title: "Uses of Leisure Time", page: 55 },
    ],
  },
  {
    unit: 3,
    topic: "Transportation",
    icon: "🚗",
    passages: [
      { id: "ew-3-1", title: "First Headlamps", page: 65 },
      { id: "ew-3-2", title: "Major Subways of Europe", page: 73 },
      { id: "ew-3-3", title: "Electric Cars Around the Globe", page: 83 },
    ],
  },
  {
    unit: 4,
    topic: "Culture",
    icon: "🎭",
    passages: [
      { id: "ew-4-1", title: "Origins of Writing", page: 93 },
      { id: "ew-4-2", title: "Hula Dancing in Hawaiian Culture", page: 102 },
      { id: "ew-4-3", title: "The Art of Mime", page: 111 },
    ],
  },
  {
    unit: 5,
    topic: "Health",
    icon: "🏥",
    passages: [
      { id: "ew-5-1", title: "Nurse Migration", page: 121 },
      { id: "ew-5-2", title: "Aerobic Exercise and Brain Health", page: 130 },
      { id: "ew-5-3", title: "How Drugs Are Studied", page: 140 },
    ],
  },
  {
    unit: 6,
    topic: "Tourism",
    icon: "✈️",
    passages: [
      { id: "ew-6-1", title: "Hiking the Inca Trail", page: 149 },
      { id: "ew-6-2", title: "What Is Ecotourism?", page: 158 },
      { id: "ew-6-3", title: "Learning Vacations", page: 168 },
    ],
  },
  {
    unit: 7,
    topic: "Business",
    icon: "💼",
    passages: [
      { id: "ew-7-1", title: "What Makes a Small Business Successful?", page: 177 },
      { id: "ew-7-2", title: "Brand Loyalty", page: 186 },
      { id: "ew-7-3", title: "Global Outsourcing", page: 195 },
    ],
  },
  {
    unit: 8,
    topic: "Society",
    icon: "🏙️",
    passages: [
      { id: "ew-8-1", title: "Social Networking", page: 205 },
      { id: "ew-8-2", title: "Why Are Women Leaving Science Careers?", page: 214 },
      { id: "ew-8-3", title: "Wheelchair-Accessibility Issues", page: 223 },
    ],
  },
  {
    unit: 9,
    topic: "Education",
    icon: "🎓",
    passages: [
      { id: "ew-9-1", title: "Learning Styles", page: 233 },
      { id: "ew-9-2", title: "The Homeschool Option", page: 242 },
      { id: "ew-9-3", title: "Educating the Gifted", page: 251 },
    ],
  },
  {
    unit: 10,
    topic: "Technology/Inventions",
    icon: "💡",
    passages: [
      { id: "ew-10-1", title: "The Development of the Lightbulb", page: 261 },
      { id: "ew-10-2", title: "The Invention of Variable-Pitch Propellers", page: 271 },
      { id: "ew-10-3", title: "The Transatlantic Cable", page: 280 },
    ],
  },
];

// ============================================================
// IELTS READING WORKBOOK (Units 1-6)
// ============================================================
export interface WorkbookPassage {
  id: string;
  title: string;
}

export interface WorkbookUnit {
  unit: number;
  topic: string;
  icon: string;
  passages: WorkbookPassage[];
}

export const workbookUnits: WorkbookUnit[] = [
  {
    unit: 1,
    topic: "The Best Cities in the World",
    icon: "🏙️",
    passages: [
      { id: "tid-wb-1-1", title: "The best cities in the world" },
      { id: "tid-wb-1-2", title: "The world's friendliest city" },
      { id: "tid-wb-1-3", title: "A city survey with a difference – The City Brands Index" },
      { id: "tid-wb-1-4", title: "The happiest country in the world – Costa Rica & the Happy Planet Index" },
    ],
  },
  {
    unit: 2,
    topic: "Ocean Navigators and Biology",
    icon: "🌊",
    passages: [
      { id: "tid-wb-2-1", title: "Mau Piailug, ocean navigator" },
      { id: "tid-wb-2-2", title: "Sylvia Earle, underwater hero" },
    ],
  },
  {
    unit: 3,
    topic: "Transport & Technology",
    icon: "🚗",
    passages: [
      { id: "tid-wb-3-1", title: "Your next car may be electric" },
      { id: "tid-wb-3-2", title: "How traffic-free shopping streets developed" },
      { id: "tid-wb-3-3", title: "The Boeing 787 Dreamliner" },
      { id: "tid-wb-3-4", title: "Traffic jams – no end in sight" },
    ],
  },
  {
    unit: 4,
    topic: "Inventions & Innovations",
    icon: "💡",
    passages: [
      { id: "tid-wb-4-1", title: "Air conditioning – History of an invention" },
      { id: "tid-wb-4-2", title: "Rubik's Cube – How the puzzle achieved success" },
      { id: "tid-wb-4-3", title: "Marcel Bich – The man who made the ballpoint pen affordable" },
      { id: "tid-wb-4-4", title: "The ballpoint pen – How this popular item evolved" },
    ],
  },
  {
    unit: 5,
    topic: "Animals & Migration",
    icon: "🐾",
    passages: [
      { id: "tid-wb-5-1", title: "The life of the European bee-eater" },
      { id: "tid-wb-5-2", title: "Humpback whale breaks migration record" },
      { id: "tid-wb-5-3", title: "The honey badger" },
      { id: "tid-wb-5-3b", title: "On the trail of the honey badger (Extension)" },
    ],
  },
  {
    unit: 6,
    topic: "Human Behaviour & Psychology",
    icon: "🧠",
    passages: [
      { id: "tid-wb-6-1", title: "Making a change – How easy is it to change our lives?" },
      { id: "tid-wb-6-2", title: "Breaking the habit – Why bad habits can stay with us for life" },
      { id: "tid-wb-6-3", title: "Reducing errors in memory – The role of sleep" },
      { id: "tid-wb-6-4", title: "Fighting fear using virtual reality (VRET)" },
    ],
  },
];

// Question types available
export const questionTypes = [
  "True / False / Not Given",
  "Yes / No / Not Given",
  "Matching Headings",
  "Matching Information",
  "Matching Features",
  "Summary Completion",
  "Sentence Completion",
  "Short Answer Questions",
  "Multiple Choice",
  "Diagram / Flow Chart / Table Completion",
  "Fill in the Blanks (Điền từ)",
] as const;

// Helper to group cambridge tests by book number
export function getCambridgeByBook(): Record<number, CambridgeTest[]> {
  const grouped: Record<number, CambridgeTest[]> = {};
  cambridgeTests.forEach((test) => {
    if (!grouped[test.book]) grouped[test.book] = [];
    grouped[test.book].push(test);
  });
  return grouped;
}
