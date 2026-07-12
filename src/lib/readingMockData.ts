import type { ReadingPassage, ReadingTestMeta } from "@/types/reading";

export const READING_TEST_META: ReadingTestMeta = {
  id: "bc-road-to-ielts-reading-1",
  testTitle: "British Council Road to IELTS — Academic Reading Test 1",
  cambridge: "Practice Test 1",
  durationMinutes: 60,
};

// ─── PASSAGE 1 (Questions 1–13) ────────────────────────────────────────────
export const READING_PASSAGE_1: ReadingPassage = {
  id: "passage-1",
  sectionLabel: "Reading Passage 1",
  title: "MAKING TIME FOR SCIENCE",
  subtitle:
    "You should spend about 20 minutes on Questions 1–13, which are based on Reading Passage 1 below.",
  paragraphs: [
    {
      id: "p1-1",
      label: "Paragraph 1",
      text: "Chronobiology might sound a little futuristic – like something from a science fiction novel, perhaps – but it’s actually a field of study that concerns one of the oldest processes life on this planet has ever known: short-term rhythms of time and their effect on flora and fauna.",
    },
    {
      id: "p1-2",
      label: "Paragraph 2",
      text: "This can take many forms. Marine life, for example, is influenced by tidal patterns. Animals tend to be active or inactive depending on the position of the sun or moon. Numerous creatures, humans included, are largely diurnal – that is, they like to come out during the hours of sunlight. Nocturnal animals, such as bats and possums, prefer to forage by night. A third group are known as crepuscular: they thrive in the low-light of dawn and dusk and remain inactive at other hours.",
    },
    {
      id: "p1-3",
      label: "Paragraph 3",
      text: "When it comes to humans, chronobiologists are interested in what is known as the circadian rhythm. This is the complete cycle our bodies are naturally geared to undergo within the passage of a twenty-four hour day. Aside from sleeping at night and waking during the day, each cycle involves many other factors such as changes in blood pressure and body temperature. Not everyone has an identical circadian rhythm. ‘Night people’, for example, often describe how they find it very hard to operate during the morning, but become alert and focused by evening. This is a benign variation within circadian rhythms known as a chronotype.",
    },
    {
      id: "p1-4",
      label: "Paragraph 4",
      text: "Scientists have limited abilities to create durable modifications of chronobiological demands. Recent therapeutic developments for humans such as artificial light machines and melatonin administration can reset our circadian rhythms, for example, but our bodies can tell the difference and health suffers when we breach these natural rhythms for extended periods of time. Plants appear no more malleable in this respect; studies demonstrate that vegetables grown in season and ripened on the tree are far higher in essential nutrients than those grown in greenhouses and ripened by laser.",
    },
    {
      id: "p1-5",
      label: "Paragraph 5",
      text: "Knowledge of chronobiological patterns can have many pragmatic implications for our day-to-day lives. While contemporary living can sometimes appear to subjugate biology – after all, who needs circadian rhythms when we have caffeine pills, energy drinks, shift work and cities that never sleep? – keeping in synch with our body clock is important.",
    },
    {
      id: "p1-6",
      label: "Paragraph 6",
      text: "The average urban resident, for example, rouses at the eye-blearing time of 6.04 a.m., which researchers believe to be far too early. One study found that even rising at 7.00 a.m. has deleterious effects on health unless exercise is performed for 30 minutes afterward. The optimum moment has been whittled down to 7.22 a.m.; muscle aches, headaches and moodiness were reported to be lowest by participants in the study who awoke then.",
    },
    {
      id: "p1-7",
      label: "Paragraph 7",
      text: "Once you’re up and ready to go, what then? If you’re trying to shed some extra pounds, dieticians are adamant: never skip breakfast. This disorients your circadian rhythm and puts your body in starvation mode. The recommended course of action is to follow an intense workout with a carbohydrate-rich breakfast; the other way round and weight loss results are not as pronounced.",
    },
    {
      id: "p1-8",
      label: "Paragraph 8",
      text: "Morning is also great for breaking out the vitamins. Supplement absorption by the body is not temporal-dependent, but naturopath Pam Stone notes that the extra boost at breakfast helps us get energised for the day ahead. For improved absorption, Stone suggests pairing supplements with a food in which they are soluble and steering clear of caffeinated beverages. Finally, Stone warns to take care with storage; high potency is best for absorption, and warmth and humidity are known to deplete the potency of a supplement.",
    },
    {
      id: "p1-9",
      label: "Paragraph 9",
      text: "After-dinner espressos are becoming more of a tradition – we have the Italians to thank for that – but to prepare for a good night’s sleep we are better off putting the brakes on caffeine consumption as early as 3 p.m. With a seven hour half-life, a cup of coffee containing 90 mg of caffeine taken at this hour could still leave 45 mg of caffeine in your nervous system at ten o’clock that evening. It is essential that, by the time you are ready to sleep, your body is rid of all traces.",
    },
    {
      id: "p1-10",
      label: "Paragraph 10",
      text: "Evenings are important for winding down before sleep; however, dietician Geraldine Georgeou warns that an after-five carbohydrate-fast is more cultural myth than chronobiological demand. This will deprive your body of vital energy needs. Overloading your gut could lead to indigestion, though. Our digestive tracts do not shut down for the night entirely, but their work slows to a crawl as our bodies prepare for sleep. Consuming a modest snack should be entirely sufficient.",
    },
  ],
  questions: [
    {
      id: 1,
      type: "tfng",
      instruction: "Questions 1–7 — Do the following statements agree with the information given in Reading Passage 1? Write TRUE, FALSE, or NOT GIVEN.",
      prompt: "Chronobiology is the study of how living things have evolved over time.",
    },
    {
      id: 2,
      type: "tfng",
      prompt: "The rise and fall of sea levels affects how sea creatures behave.",
    },
    {
      id: 3,
      type: "tfng",
      prompt: "Most animals are active during the daytime.",
    },
    {
      id: 4,
      type: "tfng",
      prompt: "Circadian rhythms identify how we do different things on different days.",
    },
    {
      id: 5,
      type: "tfng",
      prompt: "A ‘night person’ can still have a healthy circadian rhythm.",
    },
    {
      id: 6,
      type: "tfng",
      prompt: "New therapies can permanently change circadian rhythms without causing harm.",
    },
    {
      id: 7,
      type: "tfng",
      prompt: "Naturally-produced vegetables have more nutritional value.",
    },
    {
      id: 8,
      type: "mcq",
      instruction: "Questions 8–13 — Choose the correct letter, A, B, C or D.",
      prompt: "What did researchers identify as the ideal time to wake up in the morning?",
      options: [
        { key: "A", text: "6.04" },
        { key: "B", text: "7.00" },
        { key: "C", text: "7.22" },
        { key: "D", text: "7.30" },
      ],
    },
    {
      id: 9,
      type: "mcq",
      prompt: "In order to lose weight, we should",
      options: [
        { key: "A", text: "avoid eating breakfast" },
        { key: "B", text: "eat a low carbohydrate breakfast" },
        { key: "C", text: "exercise before breakfast" },
        { key: "D", text: "exercise after breakfast" },
      ],
    },
    {
      id: 10,
      type: "mcq",
      prompt: "Which is NOT mentioned as a way to improve supplement absorption?",
      options: [
        { key: "A", text: "avoiding drinks containing caffeine while taking supplements" },
        { key: "B", text: "taking supplements at breakfast" },
        { key: "C", text: "taking supplements with foods that can dissolve them" },
        { key: "D", text: "storing supplements in a cool, dry environment" },
      ],
    },
    {
      id: 11,
      type: "mcq",
      prompt: "The best time to stop drinking coffee is",
      options: [
        { key: "A", text: "mid-afternoon" },
        { key: "B", text: "10 p.m." },
        { key: "C", text: "only when feeling anxious" },
        { key: "D", text: "after dinner" },
      ],
    },
    {
      id: 12,
      type: "mcq",
      prompt: "In the evening, we should",
      options: [
        { key: "A", text: "stay away from carbohydrates" },
        { key: "B", text: "stop exercising" },
        { key: "C", text: "eat as much as possible" },
        { key: "D", text: "eat a light meal" },
      ],
    },
    {
      id: 13,
      type: "mcq",
      prompt: "Which of the following phrases best describes the main aim of Reading Passage 1?",
      options: [
        { key: "A", text: "to suggest healthier ways of eating, sleeping and exercising" },
        { key: "B", text: "to describe how modern life has made chronobiology largely irrelevant" },
        { key: "C", text: "to introduce chronobiology and describe some practical applications" },
        { key: "D", text: "to plan a daily schedule that can alter our natural chronobiological rhythms" },
      ],
    },
  ],
};

// ─── PASSAGE 2 (Questions 14–26) ───────────────────────────────────────────
export const READING_PASSAGE_2: ReadingPassage = {
  id: "passage-2",
  sectionLabel: "Reading Passage 2",
  title: "The Triune Brain",
  subtitle:
    "You should spend about 20 minutes on Questions 14–26, which are based on Reading Passage 2 below.",
  paragraphs: [
    {
      id: "p2-1",
      label: "Paragraph 1",
      text: "The first of our three brains to evolve is what scientists call the reptilian cortex. This brain sustains the elementary activities of animal survival such as respiration, adequate rest and a beating heart. We are not required to consciously “think” about these activities. The reptilian cortex also houses the “startle centre”, a mechanism that facilitates swift reactions to unexpected occurrences in our surroundings. That panicked lurch you experience when a door slams shut somewhere in the house, or the heightened awareness you feel when a twig cracks in a nearby bush while out on an evening stroll are both examples of the reptilian cortex at work. When it comes to our interaction with others, the reptilian brain offers up only the most basic impulses: aggression, mating, and territorial defence. There is no great difference, in this sense, between a crocodile defending its spot along the river and a turf war between two urban gangs.",
    },
    {
      id: "p2-2",
      label: "Paragraph 2",
      text: "Although the lizard may stake a claim to its habitat, it exerts total indifference toward the well-being of its young. Listen to the anguished squeal of a dolphin separated from its pod or witness the sight of elephants mourning their dead, however, and it is clear that a new development is at play. Scientists have identified this as the limbic cortex. Unique to mammals, the limbic cortex impels creatures to nurture their offspring by delivering feelings of tenderness and warmth to the parent when children are nearby. These same sensations also cause mammals to develop various types of social relations and kinship networks. When we are with others of “our kind” – be it at soccer practice, church, school or a nightclub – we experience positive sensations of togetherness, solidarity and comfort. If we spend too long away from these networks, then loneliness sets in and encourages us to seek companionship.",
    },
    {
      id: "p2-3",
      label: "Paragraph 3",
      text: "Only human capabilities extend far beyond the scope of these two cortexes. Humans eat, sleep and play, but we also speak, plot, rationalise and debate finer points of morality. Our unique abilities are the result of an expansive third brain – the neocortex – which engages with logic, reason and ideas. The power of the neocortex comes from its ability to think beyond the present, concrete moment. While other mammals are mainly restricted to impulsive actions (although some, such as apes, can learn and remember simple lessons), humans can think about the “big picture”. We can string together simple lessons (for example, an apple drops downwards from a tree; hurting others causes unhappiness) to develop complex theories of physical or social phenomena (such as the laws of gravity and a concern for human rights).",
    },
    {
      id: "p2-4",
      label: "Paragraph 4",
      text: "The neocortex is also responsible for the process by which we decide on and commit to particular courses of action. Strung together over time, these choices can accumulate into feats of progress unknown to other animals. Anticipating a better grade on the following morning’s exam, a student can ignore the limbic urge to socialise and go to sleep early instead. Over three years, this ongoing sacrifice translates into a first class degree and a scholarship to graduate school; over a lifetime, it can mean ground-breaking contributions to human knowledge and development. The ability to sacrifice our drive for immediate satisfaction in order to benefit later is a product of the neocortex.",
    },
    {
      id: "p2-5",
      label: "Paragraph 5",
      text: "Understanding the triune brain can help us appreciate the different natures of brain damage and psychological disorders. The most devastating form of brain damage, for example, is a condition in which someone is understood to be brain dead. In this state a person appears merely unconscious – sleeping, perhaps – but this is illusory. Here, the reptilian brain is functioning on autopilot despite the permanent loss of other cortexes.",
    },
    {
      id: "p2-6",
      label: "Paragraph 6",
      text: "Disturbances to the limbic cortex are registered in a different manner. Pups with limbic damage can move around and feed themselves well enough but do not register the presence of their littermates. Scientists have observed how, after a limbic lobotomy, “one impaired monkey stepped on his outraged peers as if treading on a log or a rock”. In our own species, limbic damage is closely related to sociopathic behaviour. Sociopaths in possession of fully-functioning neocortexes are often shrewd and emotionally intelligent people but lack any ability to relate to, empathise with or express concern for others.",
    },
    {
      id: "p2-7",
      label: "Paragraph 7",
      text: "One of the neurological wonders of history occurred when a railway worker named Phineas Gage survived an incident during which a metal rod skewered his skull, taking a considerable amount of his neocortex with it. Though Gage continued to live and work as before, his fellow employees observed a shift in the equilibrium of his personality. Gage’s animal propensities were now sharply pronounced while his intellectual abilities suffered; garrulous or obscene jokes replaced his once quick wit. New findings suggest, however, that Gage managed to soften these abrupt changes over time and rediscover an appropriate social manner. This would indicate that reparative therapy has the potential to help patients with advanced brain trauma to gain an improved quality of life.",
    },
  ],
  questions: [
    {
      id: 14,
      type: "mcq",
      instruction: "Questions 14–22 — Classify the following as typical of A (The reptilian cortex), B (The limbic cortex), or C (The neocortex).",
      prompt: "Giving up short-term happiness for future gains",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 15,
      type: "mcq",
      prompt: "Maintaining the bodily functions necessary for life",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 16,
      type: "mcq",
      prompt: "Experiencing the pain of losing another",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 17,
      type: "mcq",
      prompt: "Forming communities and social groups",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 18,
      type: "mcq",
      prompt: "Making a decision and carrying it out",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 19,
      type: "mcq",
      prompt: "Guarding areas of land",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 20,
      type: "mcq",
      prompt: "Developing explanations for things",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 21,
      type: "mcq",
      prompt: "Looking after one’s young",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 22,
      type: "mcq",
      prompt: "Responding quickly to sudden movement and noise",
      options: [
        { key: "A", text: "The reptilian cortex" },
        { key: "B", text: "The limbic cortex" },
        { key: "C", text: "The neocortex" },
      ],
    },
    {
      id: 23,
      type: "fill",
      instruction: "Questions 23–26 — Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      prompt: "A person with only a functioning reptilian cortex is known as ________.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 24,
      type: "fill",
      prompt: "________ in humans is associated with limbic disruption.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 25,
      type: "fill",
      prompt: "An industrial accident caused Phineas Gage to lose part of his ________.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 26,
      type: "fill",
      prompt: "After his accident, co-workers noticed an imbalance between Gage’s ________ and higher-order thinking.",
      placeholder: "Your answer",
      maxWords: 2,
    },
  ],
};

// ─── PASSAGE 3 (Questions 27–40) ───────────────────────────────────────────
export const READING_PASSAGE_3: ReadingPassage = {
  id: "passage-3",
  sectionLabel: "Reading Passage 3",
  title: "HELIUM’S FUTURE UP IN THE AIR",
  subtitle:
    "You should spend about 20 minutes on Questions 27–40, which are based on Reading Passage 3 below.",
  paragraphs: [
    {
      id: "p3-1",
      label: "Paragraph A",
      text: "In recent years we have all been exposed to dire media reports concerning the impending demise of global coal and oil reserves, but the depletion of another key non-renewable resource continues without receiving much press at all. Helium – an inert, odourless, monatomic element known to lay people as the substance that makes balloons float and voices squeak when inhaled – could be gone from this planet within a generation.",
    },
    {
      id: "p3-2",
      label: "Paragraph B",
      text: "Helium itself is not rare; there is actually a plentiful supply of it in the cosmos. In fact, 24 per cent of our galaxy’s elemental mass consists of helium, which makes it the second most abundant element in our universe. Because of its lightness, however, most helium vanished from our own planet many years ago. Consequently, only a miniscule proportion – 0.00052%, to be exact – remains in earth’s atmosphere. Helium is the by-product of millennia of radioactive decay from the elements thorium and uranium. The helium is mostly trapped in subterranean natural gas bunkers and commercially extracted through a method known as fractional distillation.",
    },
    {
      id: "p3-3",
      label: "Paragraph C",
      text: "The loss of helium on Earth would affect society greatly. Defying the perception of it as a novelty substance for parties and gimmicks, the element actually has many vital applications in society. Probably the most well known commercial usage is in airships and blimps (non-flammable helium replaced hydrogen as the lifting gas du jour after the Hindenburg catastrophe in 1932, during which an airship burst into flames and crashed to the ground killing some passengers and crew). But helium is also instrumental in deep-sea diving, where it is blended with nitrogen to mitigate the dangers of inhaling ordinary air under high pressure; as a cleaning agent for rocket engines; and, in its most prevalent use, as a coolant for superconducting magnets in hospital MRI (magnetic resonance imaging) scanners.",
    },
    {
      id: "p3-4",
      label: "Paragraph D",
      text: "The possibility of losing helium forever poses the threat of a real crisis because its unique qualities are extraordinarily difficult, if not impossible to duplicate (certainly, no biosynthetic ersatz product is close to approaching the point of feasibility for helium, even as similar developments continue apace for oil and coal). Helium is even cheerfully derided as a “loner” element since it does not adhere to other molecules like its cousin, hydrogen. According to Dr. Lee Sobotka, helium is the “most noble of gases, meaning it’s very stable and non-reactive for the most part ... it has a closed electronic configuration, a very tightly bound atom. It is this coveting of its own electrons that prevents combination with other elements’. Another important attribute is helium’s unique boiling point, which is lower than that for any other element. The worsening global shortage could render millions of dollars of high-value, life-saving equipment totally useless. The dwindling supplies have already resulted in the postponement of research and development projects in physics laboratories and manufacturing plants around the world. There is an enormous supply and demand imbalance partly brought about by the expansion of high-tech manufacturing in Asia.",
    },
    {
      id: "p3-5",
      label: "Paragraph E",
      text: "The source of the problem is the Helium Privatisation Act (HPA), an American law passed in 1996 that requires the U.S. National Helium Reserve to liquidate its helium assets by 2015 regardless of the market price. Although intended to settle the original cost of the reserve by a U.S. Congress ignorant of its ramifications, the result of this fire sale is that global helium prices are so artificially deflated that few can be bothered recycling the substance or using it judiciously. Deflated values also mean that natural gas extractors see no reason to capture helium. Much is lost in the process of extraction. As Sobotka notes: \"[t]he government had the good vision to store helium, and the question now is: Will the corporations have the vision to capture it when extracting natural gas, and consumers the wisdom to recycle? This takes long-term vision because present market forces are not sufficient to compel prudent practice”. For Nobel-prize laureate Robert Richardson, the U.S. government must be prevailed upon to repeal its privatisation policy as the country supplies over 80 per cent of global helium, mostly from the National Helium Reserve. For Richardson, a twenty- to fifty-fold increase in prices would provide incentives to recycle.",
    },
    {
      id: "p3-6",
      label: "Paragraph F",
      text: "A number of steps need to be taken in order to avert a costly predicament in the coming decades. Firstly, all existing supplies of helium ought to be conserved and released only by permit, with medical uses receiving precedence over other commercial or recreational demands. Secondly, conservation should be obligatory and enforced by a regulatory agency. At the moment some users, such as hospitals, tend to recycle diligently while others, such as NASA, squander massive amounts of helium. Lastly, research into alternatives to helium must begin in earnest.",
    },
  ],
  questions: [
    {
      id: 27,
      type: "matching",
      instruction: "Questions 27–31 — Which paragraph contains the following information? Write the correct letter, A–F, in boxes 27–31 on your answer sheet.",
      prompt: "A use for helium which makes an activity safer",
      paragraphRef: "p3-3",
      headings: ["A", "B", "C", "D", "E", "F"],
    },
    {
      id: 28,
      type: "matching",
      prompt: "The possibility of creating an alternative to helium",
      paragraphRef: "p3-4",
      headings: ["A", "B", "C", "D", "E", "F"],
    },
    {
      id: 29,
      type: "matching",
      prompt: "A term which describes the process of how helium is taken out of the ground",
      paragraphRef: "p3-2",
      headings: ["A", "B", "C", "D", "E", "F"],
    },
    {
      id: 30,
      type: "matching",
      prompt: "A reason why users of helium do not make efforts to conserve it",
      paragraphRef: "p3-5",
      headings: ["A", "B", "C", "D", "E", "F"],
    },
    {
      id: 31,
      type: "matching",
      prompt: "A contrast between helium’s chemical properties and how non-scientists think about it",
      paragraphRef: "p3-1",
      headings: ["A", "B", "C", "D", "E", "F"],
    },
    {
      id: 32,
      type: "tfng",
      instruction: "Questions 32–35 — Do the following statements agree with the claims of the writer in Reading Passage 3? Write YES, NO, or NOT GIVEN.",
      prompt: "Helium chooses to be on its own.",
    },
    {
      id: 33,
      type: "tfng",
      prompt: "Helium is a very cold substance.",
    },
    {
      id: 34,
      type: "tfng",
      prompt: "High-tech industries in Asia use more helium than laboratories and manufacturers in other parts of the world.",
    },
    {
      id: 35,
      type: "tfng",
      prompt: "The US Congress understood the possible consequences of the HPA.",
    },
    {
      id: 36,
      type: "fill",
      instruction: "Questions 36–40 — Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
      prompt: "Sobotka argues that big business and users of helium need to help look after helium stocks because ________ will not be encouraged through buying and selling alone.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 37,
      type: "fill",
      prompt: "Richardson believes that the ________ needs to be withdrawn, as the U.S. provides most of the world’s helium.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 38,
      type: "fill",
      prompt: "He argues that higher costs would mean people have ________ to use the resource many times over.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 39,
      type: "fill",
      prompt: "People should need a ________ to access helium that we still have.",
      placeholder: "Your answer",
      maxWords: 2,
    },
    {
      id: 40,
      type: "fill",
      prompt: "Furthermore, a ________ should ensure that helium is used carefully.",
      placeholder: "Your answer",
      maxWords: 2,
    },
  ],
};

export const ALL_PASSAGES: ReadingPassage[] = [
  READING_PASSAGE_1,
  READING_PASSAGE_2,
  READING_PASSAGE_3,
];

export const STORAGE_KEY = `ielts-reading-${READING_TEST_META.id}`;
