import type { ReadingPassage, ReadingTestMeta } from "@/types/reading";

export const READING_TEST_META: ReadingTestMeta = {
  id: "cam18-test1-reading",
  testTitle: "Cambridge IELTS 18 — Academic Reading",
  cambridge: "Test 1",
  durationMinutes: 60,
};

// ─── PASSAGE 1 (Questions 1–13) ────────────────────────────────────────────
export const READING_PASSAGE_1: ReadingPassage = {
  id: "passage-1",
  sectionLabel: "Reading Passage 1",
  title: "Urban Farming: The Future of Food Production",
  subtitle:
    "You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.",
  paragraphs: [
    {
      id: "p1-1",
      label: "Paragraph A",
      text: "Urban farming, the practice of cultivating, processing, and distributing food in or around metropolitan areas, is rapidly changing our relationship with what we eat. In many cities worldwide, empty lots, rooftops, and abandoned warehouses are being transformed into lush, green farms. Proponents argue that growing food where it is consumed reduces transportation costs and greenhouse gas emissions, creating a more sustainable urban ecosystem. In a world where over half the population lives in cities, this hyper-local approach to agriculture seems not just innovative, but necessary.",
    },
    {
      id: "p1-2",
      label: "Paragraph B",
      text: "Historically, food production was strictly segregated from urban life. The industrial revolution pushed farms further into rural areas, relying on massive transport networks to bring fresh produce to city dwellers. However, this system has significant flaws: fruit and vegetables are often picked unripe to survive long journeys, losing nutritional value along the way. Furthermore, supply chain disruptions, such as fuel price hikes or extreme weather events, can leave city supermarket shelves empty within days. Urban agriculture offers a resilient buffer against such vulnerabilities.",
    },
    {
      id: "p1-3",
      label: "Paragraph C",
      text: "One of the most promising methods in urban farming is hydroponics—growing plants in nutrient-rich water solutions without soil. This technique allows crops to be stacked vertically in layers, drastically reducing the physical footprint required. A single vertical hydroponic farm in a disused London subway tunnel can produce up to ten times the yield of a traditional soil-based farm of the same surface area. Additionally, vertical farming uses up to 95% less water, a critical factor in regions facing severe droughts.",
    },
    {
      id: "p1-4",
      label: "Paragraph D",
      text: "Despite the clear environmental benefits, critics point out several major hurdles, chief among them being energy consumption. Vertical farms rely heavily on artificial LED lighting and climate control systems, which require substantial electricity. If this power comes from fossil fuels, the carbon footprint of vertical farming may actually exceed that of traditional field agriculture. Therefore, integrating renewable energy sources—such as solar panels and wind turbines—is vital for the long-term viability of high-tech urban farms.",
    },
    {
      id: "p1-5",
      label: "Paragraph E",
      text: "Community engagement represents another dimension of urban agriculture's appeal. Shared allotment gardens and cooperative rooftop projects allow residents to participate directly in food production, strengthening neighbourhood ties and improving mental wellbeing. Educational programmes in schools increasingly incorporate small-scale growing spaces, teaching children where food comes from and encouraging healthier eating habits. For policymakers, supporting urban farming initiatives can align environmental goals with social inclusion objectives.",
    },
    {
      id: "p1-6",
      label: "Paragraph F",
      text: "Looking ahead, experts predict that technological advances will continue to lower the costs of urban farming equipment. Automated monitoring systems can optimise nutrient delivery and detect plant diseases early, while drone pollination may become commonplace in enclosed growing environments. Nevertheless, scaling urban agriculture to meet a significant share of a city's food demand will require coordinated investment, revised zoning regulations, and public acceptance of food grown within built environments rather than distant countryside fields.",
    },
  ],
  questions: [
    {
      id: 1,
      type: "tfng",
      instruction: "Questions 1–4 — Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE, or NOT GIVEN.",
      prompt:
        "Proponents believe that urban farming can help lower greenhouse gas emissions.",
    },
    {
      id: 2,
      type: "tfng",
      prompt:
        "Fruit and vegetables from rural farms always have higher nutritional value than urban produce.",
    },
    {
      id: 3,
      type: "tfng",
      prompt:
        "Supply chain problems can quickly affect food availability in cities.",
    },
    {
      id: 4,
      type: "tfng",
      prompt:
        "Governments have already made urban farming the main source of food in most cities.",
    },
    {
      id: 5,
      type: "mcq",
      instruction: "Questions 5–7 — Choose the correct letter, A, B, C or D.",
      prompt: "What is the main advantage of vertical hydroponics mentioned in Paragraph C?",
      options: [
        { key: "A", text: "It uses soil enriched with artificial chemicals." },
        { key: "B", text: "It produces higher yields in a smaller physical space." },
        { key: "C", text: "It completely eliminates the need for water." },
        { key: "D", text: "It is cheaper to set up than traditional farming." },
      ],
    },
    {
      id: 6,
      type: "mcq",
      prompt: "According to the passage, vertical farming can use up to",
      options: [
        { key: "A", text: "50% less water than traditional methods." },
        { key: "B", text: "75% less water than traditional methods." },
        { key: "C", text: "90% less water than traditional methods." },
        { key: "D", text: "95% less water than traditional methods." },
      ],
    },
    {
      id: 7,
      type: "mcq",
      prompt: "Critics are mainly concerned about",
      options: [
        { key: "A", text: "the lack of community involvement." },
        { key: "B", text: "the energy requirements of vertical farms." },
        { key: "C", text: "the poor taste of hydroponic vegetables." },
        { key: "D", text: "the difficulty of finding urban land." },
      ],
    },
    {
      id: 8,
      type: "matching",
      instruction: "Questions 8–10 — Choose the correct heading for each paragraph from the list of headings below.",
      prompt: "Paragraph B",
      paragraphRef: "p1-2",
      headings: [
        "i. The energy demands of indoor agriculture",
        "ii. Historical separation of farms and cities",
        "iii. Community benefits of shared growing spaces",
        "iv. Future technological developments",
        "v. Weaknesses in long-distance food supply",
        "vi. The role of renewable power",
        "vii. Educational programmes in schools",
      ],
    },
    {
      id: 9,
      type: "matching",
      prompt: "Paragraph E",
      paragraphRef: "p1-5",
      headings: [
        "i. The energy demands of indoor agriculture",
        "ii. Historical separation of farms and cities",
        "iii. Community benefits of shared growing spaces",
        "iv. Future technological developments",
        "v. Weaknesses in long-distance food supply",
        "vi. The role of renewable power",
        "vii. Educational programmes in schools",
      ],
    },
    {
      id: 10,
      type: "matching",
      prompt: "Paragraph F",
      paragraphRef: "p1-6",
      headings: [
        "i. The energy demands of indoor agriculture",
        "ii. Historical separation of farms and cities",
        "iii. Community benefits of shared growing spaces",
        "iv. Future technological developments",
        "v. Weaknesses in long-distance food supply",
        "vi. The role of renewable power",
        "vii. Educational programmes in schools",
      ],
    },
    {
      id: 11,
      type: "fill",
      instruction: "Questions 11–13 — Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      prompt:
        "Vertical farms rely heavily on artificial ________ and climate control systems.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 12,
      type: "fill",
      prompt:
        "Automated systems can detect plant ________ at an early stage.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 13,
      type: "fill",
      prompt:
        "Scaling urban agriculture will require revised ________ regulations.",
      placeholder: "Your answer",
      maxWords: 2,
    },
  ],
};

// ─── PASSAGE 2 (Questions 14–26) ───────────────────────────────────────────
export const READING_PASSAGE_2: ReadingPassage = {
  id: "passage-2",
  sectionLabel: "Reading Passage 2",
  title: "The Psychology of Decision-Making",
  subtitle:
    "You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.",
  paragraphs: [
    {
      id: "p2-1",
      label: "Paragraph A",
      text: "Every day, human beings make thousands of decisions — from what to eat for breakfast to which career path to pursue. For much of the twentieth century, economists modelled this process using the concept of the 'rational agent': an individual who carefully weighs all available information and selects the option that maximises personal benefit. Yet decades of psychological research have dismantled this tidy picture, revealing that human decision-making is riddled with systematic biases and shortcuts that can lead us badly astray.",
    },
    {
      id: "p2-2",
      label: "Paragraph B",
      text: "One of the most influential contributions to this field came from psychologists Daniel Kahneman and Amos Tversky, who introduced Prospect Theory in 1979. Their experiments demonstrated that people do not evaluate outcomes in terms of absolute wealth, but rather as gains or losses relative to a reference point — usually the status quo. Crucially, losses loom larger than equivalent gains: losing £100 feels significantly worse than gaining £100 feels good. This 'loss aversion' distorts risk assessment in predictable ways, causing investors to hold failing stocks too long and sell winners too soon.",
    },
    {
      id: "p2-3",
      label: "Paragraph C",
      text: "Closely related is the concept of anchoring, whereby the first piece of information encountered — even if arbitrary — exerts a disproportionate influence on subsequent judgements. In a landmark study, participants who spun a wheel of fortune that stopped at 65 gave significantly higher estimates of African nations in the United Nations than those whose wheel stopped at 10. The initial number 'anchored' their thinking, despite being entirely irrelevant. Advertisers and negotiators routinely exploit this tendency by presenting an inflated initial price or demand.",
    },
    {
      id: "p2-4",
      label: "Paragraph D",
      text: "Availability bias describes our tendency to judge the likelihood of events based on how easily examples come to mind. Dramatic, memorable events — a plane crash, a shark attack, a lottery win — are recalled quickly and vividly, so people consistently overestimate their probability. Conversely, mundane but genuinely common causes of death, such as cardiovascular disease or diabetes, receive less media attention and are consequently underestimated. This misalignment between perceived and actual risk has profound implications for public health policy and personal lifestyle choices.",
    },
    {
      id: "p2-5",
      label: "Paragraph E",
      text: "The framing effect illustrates that the way information is presented can be just as powerful as the information itself. When a medical procedure is described as having a '90% survival rate,' patients respond far more positively than when the identical procedure is described as having a '10% mortality rate.' Rational economic theory would predict identical responses to logically equivalent statements, yet consistently, emotionally laden framing alters decisions. Policymakers have used this insight to 'nudge' citizens toward healthier choices through careful rewording of public health messages.",
    },
    {
      id: "p2-6",
      label: "Paragraph F",
      text: "Despite its imperfections, human decision-making is not simply irrational. Kahneman himself described two systems of thinking: System 1, which is fast, intuitive, and prone to bias; and System 2, which is slow, deliberate, and analytical. In many everyday situations, System 1's heuristics are remarkably efficient, allowing rapid responses to familiar problems without cognitive overload. The goal of behavioural science, therefore, is not to replace intuition with computation, but to identify circumstances where biases are most damaging and to design environments — or 'choice architectures' — that help people make better decisions without removing their freedom to choose.",
    },
  ],
  questions: [
    {
      id: 14,
      type: "tfng",
      instruction: "Questions 14–18 — Do the following statements agree with the claims of the writer in Reading Passage 2? Write YES, NO, or NOT GIVEN.",
      prompt:
        "The 'rational agent' model accurately predicts human economic behaviour in most situations.",
    },
    {
      id: 15,
      type: "tfng",
      prompt:
        "Prospect Theory shows that people judge outcomes relative to a baseline reference point.",
    },
    {
      id: 16,
      type: "tfng",
      prompt:
        "Loss aversion means people feel gains and losses equally strongly.",
    },
    {
      id: 17,
      type: "tfng",
      prompt:
        "The wheel of fortune study proves that irrelevant numbers can influence people's estimates.",
    },
    {
      id: 18,
      type: "tfng",
      prompt:
        "Availability bias causes people to overestimate the risk of common everyday diseases.",
    },
    {
      id: 19,
      type: "mcq",
      instruction: "Questions 19–22 — Choose the correct letter, A, B, C or D.",
      prompt: "According to Paragraph E, the framing effect shows that",
      options: [
        { key: "A", text: "patients always prefer positive statistics." },
        { key: "B", text: "the presentation of information can change decisions even when content is identical." },
        { key: "C", text: "mortality rates are more accurate than survival rates." },
        { key: "D", text: "rational theory successfully predicts patient responses." },
      ],
    },
    {
      id: 20,
      type: "mcq",
      prompt: "Kahneman's System 1 thinking is best described as",
      options: [
        { key: "A", text: "slow and deliberate." },
        { key: "B", text: "analytical and accurate." },
        { key: "C", text: "fast and prone to bias." },
        { key: "D", text: "logical and unbiased." },
      ],
    },
    {
      id: 21,
      type: "mcq",
      prompt: "The purpose of 'choice architecture' according to the passage is to",
      options: [
        { key: "A", text: "force people to make rational choices." },
        { key: "B", text: "remove all cognitive biases from decision-making." },
        { key: "C", text: "help people make better decisions while preserving freedom of choice." },
        { key: "D", text: "replace System 1 thinking entirely with System 2." },
      ],
    },
    {
      id: 22,
      type: "mcq",
      prompt: "Which bias do advertisers most directly exploit, according to the passage?",
      options: [
        { key: "A", text: "Availability bias" },
        { key: "B", text: "Loss aversion" },
        { key: "C", text: "The framing effect" },
        { key: "D", text: "Anchoring" },
      ],
    },
    {
      id: 23,
      type: "fill",
      instruction: "Questions 23–26 — Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      prompt:
        "Kahneman and Tversky showed that people evaluate outcomes as ________ or losses compared to their current situation.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 24,
      type: "fill",
      prompt:
        "The tendency to overestimate dramatic events is called ________ bias.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 25,
      type: "fill",
      prompt:
        "The way a message is worded is called its ________, and this can alter people's decisions.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 26,
      type: "fill",
      prompt:
        "System 1 thinking relies on ________ that allow rapid responses to familiar situations.",
      placeholder: "Your answer",
      maxWords: 2,
    },
  ],
};

// ─── PASSAGE 3 (Questions 27–40) ───────────────────────────────────────────
export const READING_PASSAGE_3: ReadingPassage = {
  id: "passage-3",
  sectionLabel: "Reading Passage 3",
  title: "The Deep Ocean: Earth's Final Frontier",
  subtitle:
    "You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.",
  paragraphs: [
    {
      id: "p3-1",
      label: "Paragraph A",
      text: "The deep ocean — broadly defined as waters below 200 metres — covers roughly 65% of Earth's surface and constitutes about 95% of the planet's living space by volume. Yet despite its vast extent, it remains more poorly charted than the surface of Mars. Until the mid-twentieth century, the abyssal plains were assumed to be barren, featureless deserts devoid of life. The development of pressure-resistant submersibles and remotely operated vehicles (ROVs) transformed this perception, revealing a world of extraordinary biodiversity adapted to conditions of crushing pressure, near-freezing temperatures, and perpetual darkness.",
    },
    {
      id: "p3-2",
      label: "Paragraph B",
      text: "The food web of the deep sea is fundamentally different from that found in sunlit surface waters. In the photic zone — the upper 200 metres reached by sunlight — photosynthesis fuels the growth of phytoplankton, which in turn supports an elaborate chain of grazers, predators, and decomposers. Below this zone, however, there is no light for photosynthesis. Deep-sea communities depend instead on 'marine snow': a continuous shower of organic particles — dead cells, faecal pellets, and mucous aggregates — sinking from surface waters above. This fragile supply chain means that deep-sea ecosystems respond extremely slowly to environmental change.",
    },
    {
      id: "p3-3",
      label: "Paragraph C",
      text: "The discovery of hydrothermal vents in 1977 fundamentally altered scientific understanding of life's limits. Scientists aboard the submersible Alvin encountered chimneys of superheated water — reaching temperatures of over 400°C — gushing from rifts in the ocean floor. Surrounding these vents were dense communities of giant tubeworms, clams, mussels, and shrimp, thriving in conditions previously thought incompatible with life. The key was chemosynthesis: bacteria around the vents derive energy not from sunlight but from chemical reactions involving hydrogen sulphide. These bacteria form the base of an entirely independent food web — the first ecosystem found to operate without solar energy.",
    },
    {
      id: "p3-4",
      label: "Paragraph D",
      text: "Despite its remoteness, the deep ocean is not insulated from human impact. Plastic pollution has been detected in the deepest trenches, including the Mariana Trench at nearly 11,000 metres depth. Bottom trawling — a commercial fishing method that drags heavy nets across the seafloor — destroys fragile deep-sea coral gardens that may have taken thousands of years to grow. Mining companies are now eyeing polymetallic nodules on abyssal plains; these potato-sized rocks contain commercially valuable concentrations of manganese, cobalt, nickel, and copper. Critics warn that mining operations would generate sediment plumes capable of smothering vast areas of the seafloor and disrupting poorly understood ecosystems.",
    },
    {
      id: "p3-5",
      label: "Paragraph E",
      text: "The deep ocean may also hold crucial answers to questions about climate change. Cold deep water absorbs and stores vast quantities of carbon dioxide from the atmosphere, playing a critical role in regulating global temperatures. The thermohaline circulation — driven by differences in water temperature and salinity — transports this cold, carbon-rich water from the surface to the deep ocean over timescales of hundreds to thousands of years. Disruption of this circulation, possibly triggered by the melting of polar ice caps, could have catastrophic consequences for both marine ecosystems and global climate stability.",
    },
    {
      id: "p3-6",
      label: "Paragraph F",
      text: "Advances in technology are slowly expanding our knowledge of the deep ocean. Autonomous underwater vehicles (AUVs) can now conduct surveys over hundreds of kilometres without a surface vessel, transmitting high-resolution data via acoustic modems. Environmental DNA techniques allow scientists to detect the presence of organisms simply by filtering seawater and sequencing the genetic material left behind, removing the need to physically capture or even observe animals. Still, current estimates suggest that only a fraction of deep-sea species have been formally described by science, and many may become extinct before they are ever discovered.",
    },
  ],
  questions: [
    {
      id: 27,
      type: "matching",
      instruction: "Questions 27–31 — Match each statement with the correct paragraph (A–F).",
      prompt: "The deep ocean plays a role in regulating the Earth's climate.",
      paragraphRef: "p3-5",
      headings: [
        "A. Introduction and overview of the deep ocean",
        "B. The food supply system in the deep sea",
        "C. Discovery of life near hydrothermal vents",
        "D. Human threats to deep-sea environments",
        "E. The ocean's role in climate regulation",
        "F. New technologies for ocean exploration",
      ],
    },
    {
      id: 28,
      type: "matching",
      prompt: "Scientists found a food web that does not rely on the sun.",
      paragraphRef: "p3-3",
      headings: [
        "A. Introduction and overview of the deep ocean",
        "B. The food supply system in the deep sea",
        "C. Discovery of life near hydrothermal vents",
        "D. Human threats to deep-sea environments",
        "E. The ocean's role in climate regulation",
        "F. New technologies for ocean exploration",
      ],
    },
    {
      id: 29,
      type: "matching",
      prompt: "New equipment allows surveys without needing a ship at the surface.",
      paragraphRef: "p3-6",
      headings: [
        "A. Introduction and overview of the deep ocean",
        "B. The food supply system in the deep sea",
        "C. Discovery of life near hydrothermal vents",
        "D. Human threats to deep-sea environments",
        "E. The ocean's role in climate regulation",
        "F. New technologies for ocean exploration",
      ],
    },
    {
      id: 30,
      type: "matching",
      prompt: "Commercial activities may permanently damage ancient seafloor structures.",
      paragraphRef: "p3-4",
      headings: [
        "A. Introduction and overview of the deep ocean",
        "B. The food supply system in the deep sea",
        "C. Discovery of life near hydrothermal vents",
        "D. Human threats to deep-sea environments",
        "E. The ocean's role in climate regulation",
        "F. New technologies for ocean exploration",
      ],
    },
    {
      id: 31,
      type: "matching",
      prompt: "Deep-sea communities change very slowly in response to environmental shifts.",
      paragraphRef: "p3-2",
      headings: [
        "A. Introduction and overview of the deep ocean",
        "B. The food supply system in the deep sea",
        "C. Discovery of life near hydrothermal vents",
        "D. Human threats to deep-sea environments",
        "E. The ocean's role in climate regulation",
        "F. New technologies for ocean exploration",
      ],
    },
    {
      id: 32,
      type: "tfng",
      instruction: "Questions 32–36 — Do the following statements agree with the information in Reading Passage 3? Write TRUE, FALSE, or NOT GIVEN.",
      prompt:
        "The deep ocean covers more than half of Earth's total surface area.",
    },
    {
      id: 33,
      type: "tfng",
      prompt:
        "Phytoplankton use sunlight to produce food in the surface waters.",
    },
    {
      id: 34,
      type: "tfng",
      prompt:
        "The bacteria at hydrothermal vents use sunlight to produce energy through chemosynthesis.",
    },
    {
      id: 35,
      type: "tfng",
      prompt:
        "Polymetallic nodules are found on the abyssal plains and contain valuable metals.",
    },
    {
      id: 36,
      type: "tfng",
      prompt:
        "Scientists have now formally described the majority of deep-sea species.",
    },
    {
      id: 37,
      type: "mcq",
      instruction: "Questions 37–40 — Choose the correct letter, A, B, C or D.",
      prompt: "What does the thermohaline circulation do, according to Paragraph E?",
      options: [
        { key: "A", text: "It prevents polar ice caps from melting." },
        { key: "B", text: "It moves carbon-rich cold water from the surface to the deep ocean." },
        { key: "C", text: "It generates heat that warms deep-sea ecosystems." },
        { key: "D", text: "It absorbs plastic pollution from surface waters." },
      ],
    },
    {
      id: 38,
      type: "mcq",
      prompt: "Environmental DNA techniques are valuable because they",
      options: [
        { key: "A", text: "allow scientists to identify organisms without capturing them." },
        { key: "B", text: "can repair damaged deep-sea ecosystems." },
        { key: "C", text: "generate acoustic maps of the ocean floor." },
        { key: "D", text: "replace the need for underwater vehicles entirely." },
      ],
    },
    {
      id: 39,
      type: "mcq",
      prompt: "The discovery of hydrothermal vents was significant because",
      options: [
        { key: "A", text: "they provided a new source of geothermal energy for humans." },
        { key: "B", text: "they proved that the deep ocean was completely lifeless." },
        { key: "C", text: "they showed that life can exist independently of solar energy." },
        { key: "D", text: "they revealed that the Mariana Trench is the deepest point on Earth." },
      ],
    },
    {
      id: 40,
      type: "mcq",
      prompt: "Which of the following best summarises the main idea of the passage?",
      options: [
        { key: "A", text: "The deep ocean is well understood by modern science." },
        { key: "B", text: "Human activity has no significant impact on the deep ocean." },
        { key: "C", text: "The deep ocean is a vast, largely unexplored space that is vital for life on Earth and increasingly threatened." },
        { key: "D", text: "Only hydrothermal vents support life in the deep ocean." },
      ],
    },
  ],
};

export const ALL_PASSAGES: ReadingPassage[] = [
  READING_PASSAGE_1,
  READING_PASSAGE_2,
  READING_PASSAGE_3,
];

export const STORAGE_KEY = `ielts-reading-${READING_TEST_META.id}`;
