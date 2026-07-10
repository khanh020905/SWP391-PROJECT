const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://kaoybbpezkkmufzbhxru.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthb3liYnBlemtrbXVmemJoeHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTI2Nzc5NSwiZXhwIjoyMDk0ODQzNzk1fQ.7VT1X4qttHogRpiJoKNxjFJ5cMUAqmQyg4m_7wxk3F8";

const supabase = createClient(supabaseUrl, supabaseKey);

const EXAM_ID = "a1b2c3d4-0001-0001-0001-000000000002";

const examMetadata = {
  id: EXAM_ID,
  title: "Cambridge 18 Test 2",
  category: "reading",
  category_id: "R2",
  duration_minutes: 60,
  description: "Test 2",
  status: "published"
};

const sections = [
  {
    exam_id: EXAM_ID,
    section_no: 1,
    title: "The MAGIC of KEFIR",
    content: `A The shepherds of the North Caucasus region of Europe were only trying to transport milk the best way they knew how – in leather pouches strapped to the side of donkeys – when they made a significant discovery. A fermentation process would sometimes inadvertently occur en route, and when the pouches were opened up on arrival they would no longer contain milk but rather a pungent, effervescent, low-alcoholic substance instead. This unexpected development was a blessing in disguise. The new drink – which acquired the name kefir – turned out to be a health tonic, a naturally-preserved dairy product and a tasty addition to our culinary repertoire.

B Although their exact origin remains a mystery, we do know that yeast-based kefir grains have always been at the root of the kefir phenomenon. These grains are capable of a remarkable feat: in contradistinction to most other items you might find in a grocery store, they actually expand and propagate with use. This is because the grains, which are granular to the touch and bear a slight resemblance to cauliflower rosettes, house active cultures that feed on lactose when added to milk. Consequently, a bigger problem for most kefir drinkers is not where to source new kefir grains, but what to do with the ones they already have!

C The great thing about kefir is that it does not require a manufacturing line in order to be produced. Grains can be simply thrown in with a batch of milk for ripening to begin. The mixture then requires a cool, dark place to live and grow, with periodic unsettling to prevent clumping (Caucasus inhabitants began storing the concoction in animal-skin satchels on the back of doors – every time someone entered the room the mixture would get lightly shaken). After about 24 hours the yeast cultures in the grains have multiplied and devoured most of the milk sugars, and the final product is then ready for human consumption.

D Nothing compares to a person’s first encounter with kefir. The smooth, uniform consistency rolls over the tongue in a manner akin to liquefied yogurt. The sharp, tart pungency of unsweetened yogurt is there too, but there is also a slight hint of effervescence, something most users will have previously associated only with mineral waters, soda or beer. Kefir also comes with a subtle aroma of yeast, and depending on the type of milk and ripening conditions, ethanol content can reach up to two or three percent – about on par with a decent lager – although you can expect around 0.8 to one per cent for a typical day-old preparation. This can bring out a tiny edge of alcohol in the kefir’s flavour.

E Although it has prevailed largely as a fermented milk drink, over the years kefir has acquired a number of other uses. Many bakers use it instead of starter yeast in the preparation of sourdough, and the tangy flavour also makes kefir an ideal buttermilk substitute in pancakes. Kefir also accompanies sour cream as one of the main ingredients in cold beetroot soup and can be used in lieu of regular cow’s milk on granola or cereal. As a way to keep their digestive systems fine-tuned, athletes sometimes combine kefir with yoghurt in protein shakes.

F Associated for centuries with pictures of Slavic babushkas clutching a shawl in one hand and a cup of kefir in the other, the unassuming beverage has become a minor celebrity of the nascent health food movement in the contemporary West. Every day, more studies pour out supporting the benefits of a diet high in probiotics. This trend toward consuming probiotics has engulfed the leisure classes in these countries to the point that it is poised to become, according to some commentators, “the next multivitamin”. These days the word kefir is consequently more likely to bring to mind glamorous, yoga mat-toting women from Los Angeles than austere visions of blustery Eastern Europe.

G Kefir’s rise in popularity has encouraged producers to take short cuts or alter the production process. Some home users have omitted the ripening and culturation process while commercial dealers often add thickeners, stabilisers and sweeteners. But the beauty of kefir is that, at its healthiest and tastiest, it is a remarkably affordable, uncluttered process, as any accidental invention is bound to be. All that is necessary are some grains, milk and a little bit of patience. A return to the unadulterated kefir-making of old is in everyone’s interest.`,
    answers: {
      "1": "viii",
      "2": "iii",
      "3": "vii",
      "4": "i",
      "5": "vi",
      "6": "ix",
      "7": "ii",
      "8": "cauliflower rosettes",
      "9": "periodic unsettling",
      "10": "milk sugars",
      "11": "liquefied yoghurt",
      "12": "C",
      "13": "E"
    }
  },
  {
    exam_id: EXAM_ID,
    section_no: 2,
    title: "FOOD FOR THOUGHT",
    content: `A Why not eat insects? So asked British entomologist Vincent M. Holt in the title of his 1885 treatise on the benefits of what he named entomophagy – the consumption of insects (and similar creatures) as a food source. The prospect of eating dishes such as “wireworm sauce” and “slug soup” failed to garner favour amongst those in the proper Victorian social milieu of his time, however, and Holt’s visionary ideas were considered at best eccentric, at worst an offense to every refined palate. Anticipating such a reaction, Holt acknowledged the difficulty in unseating deep-rooted prejudices against insect cuisine, but quietly asserted his confidence that “we shall some day quite gladly cook and eat them”.

B It has taken nearly 150 years but an eclectic Western-driven movement has finally mounted around the entomophagic cause. In Los Angeles and other cosmopolitan Western cities, insects have been caught up in the endless pursuit of novel and authentic delicacies. “Eating grasshoppers is a thing you do here”, bug-supplier Bricia Lopez has explained. “There’s more of a ‘cool’ factor involved.” Meanwhile, the Food and Agricultural Organization has considered a policy paper on the subject, initiated farming projects in Laos, and set down plans for a world congress on insect farming in 2013.

C Eating insects is not a new phenomenon. In fact, insects and other such creatures are already eaten in 80 per cent of the world’s countries, prepared in customary dishes ranging from deep-fried tarantula in Cambodia to bowls of baby bees in China. With the specialist knowledge that Western companies and organisations can bring to the table, however, these hand-prepared delicacies have the potential to be produced on a scale large enough to lower costs and open up mass markets. A new American company, for example, is attempting to develop pressurisation machines that would de-shell insects and make them available in the form of cutlets. According to the entrepreneur behind the company, Matthew Krisiloff, this will be the key to pleasing the uninitiated palate.

D Insects certainly possess some key advantages over traditional Western meat sources. According to research findings from Professor Arnold van Huis, a Dutch entomologist, breeding insects results in far fewer noxious by-products. Insects produce less ammonia than pig and poultry farming, ten times less methane than livestock, and 300 times less nitrous oxide. Huis also notes that insects – being cold-blooded creatures – can convert food to protein at a rate far superior to that of cows, since the latter exhaust much of their energy just keeping themselves warm.

E Although insects are sometimes perceived by Westerners as unhygienic or disease-ridden, they are a reliable option in light of recent global epidemics (as Holt pointed out many years ago, insects are “decidedly more particular in their feeding than ourselves”). Because bugs are genetically distant from humans, species-hopping diseases such as swine flu or mad cow disease are much less likely to start or spread amongst grasshoppers or slugs than in poultry and cattle. Furthermore, the squalid, cramped quarters that encourage diseases to propagate among many animal populations are actually the residence of choice for insects, which thrive in such conditions.

F Then, of course, there are the commercial gains. As FAO Forestry Manager Patrick Durst notes, in developing countries many rural people and traditional forest dwellers have remarkable knowledge about managing insect populations to produce food. Until now, they have only used this knowledge to meet their own subsistence needs, but Durst believes that, with the adoption of modern technology and improved promotional methods, opportunities to expand the market to new consumers will flourish. This could provide a crucial step into the global economic arena for those primarily rural, impoverished populations who have been excluded from the rise of manufacturing and large-scale agriculture.

G Nevertheless, much stands in the way of the entomophagic movement. One problem is the damage that has been caused, and continues to be caused, by Western organisations prepared to kill off grasshoppers and locusts – complete food proteins – in favour of preserving the incomplete protein crops of millet, wheat, barley and maize. Entomologist Florence Dunkel has described the consequences of such interventions. While examining children’s diets as a part of her field work in Mali, Dunkel discovered that a protein deficiency syndrome called kwashiorkor was increasing in incidence. Children in the area were once protected against kwashiorkor by a diet high in grasshoppers, but these had become unsafe to eat after pesticide use in the area increased.

H A further issue is the persistent fear many Westerners still have about eating insects. “The problem is the ick factor—the eyes, the wings, the legs,” Krisiloff has said. “It’s not as simple as hiding it in a bug nugget. People won’t accept it beyond the novelty. When you think of a chicken, you think of a chicken breast, not the eyes, wings, and beak.” For Marcel Dicke, the key lies in camouflaging the fact that people are eating insects at all. Insect flour is one of his propositions, as is changing the language of insect cuisine. “If you say it’s mealworms, it makes people think of ringworm”, he notes. “So stop saying ‘worm’. If we use Latin names, say it’s a Tenebrio quiche, it sounds much more fancy”. For Krisiloff, Dicke and others, keeping quiet about the gritty reality of our food is often the best approach.

I It is yet to be seen if history will truly redeem Vincent Holt and his suggestion that British families should gather around their dining tables for a breakfast of “moths on toast”. It is clear, however, that entomophagy, far from being a kooky sideshow to the real business of food production, has much to offer in meeting the challenges that global societies in the 21st century will face.`,
    answers: {
      "14": "vi",
      "15": "ix",
      "16": "v",
      "17": "iv",
      "18": "x",
      "19": "ii",
      "20": "vii",
      "21": "iii",
      "22": "energy",
      "23": "subsistence needs",
      "24": "rural, impoverished",
      "25": "pesticide use",
      "26": "protein deficiency"
    }
  },
  {
    exam_id: EXAM_ID,
    section_no: 3,
    title: "Love stories",
    content: `Love stories
“Love stories” are often associated – at least in the popular imagination – with fairy tales, adolescent day dreams, Disney movies and other frivolous pastimes. For psychologists developing taxonomies of affection and attachment, however, this is an area of rigorous academic pursuit. Beginning in the early 1970s with the groundbreaking contributions of John Alan Lee, researchers have developed classifications that they believe better characterise our romantic predispositions. This involves examining not a single, universal, emotional expression (“love”), but rather a series of divergent behaviours and narratives that each has an individualised purpose, desired outcome and state of mind. Lee’s gritty methodology painstakingly involved participants matching 170 typical romantic encounters (e.g., “The night after I met X…”) with nearly 1500 possible reactions (“I could hardly get to sleep” or “I wrote X a letter”). The patterns unknowingly expressed by respondents culminated in a taxonomy of six distinct love “styles” that continue to inform research in the area forty years later.

The first of these styles – eros – is closely tied in with images of romantic love that are promulgated in Western popular culture. Characteristic of this style is a passionate emotional intensity, a strong physical magnetism – as if the two partners were literally being “pulled” together – and a sense of inevitability about the relationship. A related but more frantic style of love called mania involves an obsessive, compulsive attitude toward one’s partner. Vast swings in mood from ecstasy to agony – dependent on the level of attention a person is receiving from his or her partner – are typical of manic love.

Two styles were much more subdued, however. Storge is a quiet, companionate type of loving – “love by evolution” rather than “love by revolution”, according to some theorists. Relationships built on a foundation of platonic affection and caring are archetypal of storge. When care is extended to a sacrificial level of doting, however, it becomes another style – agape. In an agape relationship one partner becomes a “caretaker”, exalting the welfare of the other above his or her own needs.

The final two styles of love seem to lack aspects of emotion and reciprocity altogether. The ludus style envisions relationships primarily as a game in which it is best to “play the field” or experience a diverse set of partners over time. Mutually-gratifying outcomes in relationships are not considered necessary, and deception of a partner and lack of disclosure about one’s activities are also typical. While Lee found that college students in his study overwhelmingly disagreed with the tenets of this style, substantial numbers of them acted in a typically ludic style while dating, a finding that proves correct the deceit inherent in ludus. Pragma lovers also downplayed emotive aspects of relationships but favoured practical, sensible connections. Successful arranged marriages are a great example of pragma, in that the couple decide to make the relationship work; but anyone who seeks an ideal partner with a shopping list of necessary attributes (high salary, same religion, etc.) fits the classification.

Robert J. Sternberg’s contemporary research on love stories has elaborated on how these narratives determine the shape of our relationships and our lives. Sternberg and others have proposed and tested the theory of love as a story, “whereby the interaction of our personal attributes with the environment – which we in part create – leads to the development of stories about love that we then seek to fulfil, to the extent possible, in our lives.” Sternberg’s taxonomy of love stories numbers far more, at twenty-six, than Lee’s taxonomy of love styles, but as Sternberg himself admits there is plenty of overlap. The seventh story, Game, coincides with ludus, for example, while the nineteenth story, Sacrifice, fits neatly on top of agape.

Sternberg’s research demonstrates that we may have predilections toward multiple love stories, each represented in a mental hierarchy and varying in weight in terms of their personal significance. This explains the frustration many of us experience when comparing potential partners. One person often fulfils some expected narratives - such as a need for mystery and fantasy – while lacking the ability to meet the demands of others (which may lie in direct contradiction). It is also the case that stories have varying abilities to adapt to a given cultural milieu and its respective demands. Love stories are, therefore, interactive and adaptive phenomena in our lives rather than rigid prescriptions.

Steinberg also explores how our love stories interact with the love stories of our partners. What happens when someone who sees love as art collides with someone who sees love as business? Can a Sewing story (love is what you make it) co-exist with a Theatre story (love is a script with predictable acts, scenes and lines)? Certainly, it is clear that we look for partners with love stories that complement and are compatible with our own narratives. But they do not have to be an identical match. Someone who sees love as mystery and art, for example, might locate that mystery better in a partner who views love through a lens of business and humour. Not all love stories, however, are equally well predisposed to relationship longevity; stories that view love as a game, as a kind of surveillance or as an addiction are all unlikely to prove durable.

Research on love stories continues apace. Defying the myth that rigorous science and the romantic persuasions of ordinary people are incompatible, this research demonstrates that good psychology can clarify and comment on the way we give affection and form attachments.`,
    answers: {
      "27": "D",
      "28": "E",
      "29": "A",
      "30": "C",
      "31": "B",
      "32": "E",
      "33": "B",
      "34": "F",
      "35": "YES",
      "36": "YES",
      "37": "YES",
      "38": "NO",
      "39": "NOT GIVEN",
      "40": "NO"
    }
  }
];

const matchHeadingsP1 = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const matchHeadingsP2 = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi"];
const loveStyles = ["A", "B", "C", "D", "E", "F"];

const questions = [];

// Helper function to build 36-char standard UUIDs
function makeUuid(idx) {
  // c1b2c3d4-0001-0001-0001-0000000000XX
  const padded = String(idx).padStart(12, "0");
  return `c1b2c3d4-0001-0001-0001-${padded}`;
}

// Passage 1
for (let i = 1; i <= 7; i++) {
  const sectionsLabels = ["A", "B", "C", "D", "E", "F", "G"];
  const correct = ["viii", "iii", "vii", "i", "vi", "ix", "ii"];
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 1,
    question_type: "matching",
    text: `Section ${sectionsLabels[i-1]}`,
    correct_answer: correct[i-1],
    options: matchHeadingsP1,
    order_index: i
  });
}

const fillTextsP1 = [
  "8 What do kefir grains look like?",
  "9 What needs to happen to kefir while it is ripening?",
  "10 What will the yeast cultures have consumed before kefir is ready to drink?",
  "11 The texture of kefir in the mouth is similar to what?"
];
const fillAnsP1 = ["cauliflower rosettes", "periodic unsettling", "milk sugars", "liquefied yoghurt"];
for (let i = 8; i <= 11; i++) {
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 1,
    question_type: "fill_blank",
    text: fillTextsP1[i-8],
    correct_answer: fillAnsP1[i-8],
    options: null,
    order_index: i
  });
}

questions.push({
  id: makeUuid(12),
  exam_id: EXAM_ID,
  section: 1,
  question_type: "multiple_choice",
  text: "Which product CANNOT be replaced by kefir? (Question 1 of 2)",
  correct_answer: "C",
  options: [
    "A. Ordinary cow’s milk",
    "B. Buttermilk",
    "C. Sour cream",
    "D. Starter yeast",
    "E. Yoghurt"
  ],
  order_index: 12
});

questions.push({
  id: makeUuid(13),
  exam_id: EXAM_ID,
  section: 1,
  question_type: "multiple_choice",
  text: "Which product CANNOT be replaced by kefir? (Question 2 of 2)",
  correct_answer: "E",
  options: [
    "A. Ordinary cow’s milk",
    "B. Buttermilk",
    "C. Sour cream",
    "D. Starter yeast",
    "E. Yoghurt"
  ],
  order_index: 13
});

// Passage 2
const correctP2 = ["vi", "ix", "v", "iv", "x", "ii", "vii", "iii"];
for (let i = 14; i <= 21; i++) {
  const sectionsLabels = ["A", "B", "C", "D", "E", "F", "G", "H"];
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 2,
    question_type: "matching",
    text: `Section ${sectionsLabels[i-14]}`,
    correct_answer: correctP2[i-14],
    options: matchHeadingsP2,
    order_index: i
  });
}

const fillTextsP2 = [
  "Insects use food intake economically in the production of protein as they waste less ________",
  "Traditional knowledge could be combined with modern methods for mass production instead of just covering ________",
  "This could help ________ people gain access to world markets.",
  "Due to increased ________, more children in Mali are suffering from",
  "are suffering from ________"
];
const fillAnsP2 = [
  "energy",
  "subsistence needs",
  "rural, impoverished",
  "pesticide use",
  "protein deficiency"
];
for (let i = 22; i <= 26; i++) {
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 2,
    question_type: "fill_blank",
    text: fillTextsP2[i-22],
    correct_answer: fillAnsP2[i-22],
    options: null,
    order_index: i
  });
}

// Passage 3
const matchTextsP3 = [
  "My most important concern is that my partner is happy.",
  "I enjoy having many romantic partners.",
  "I feel that my partner and I were always going to end up together.",
  "I want to be friends first and then let romance develop later.",
  "I always feel either very excited or absolutely miserable about my relationship.",
  "I prefer to keep many aspects of my love life to myself.",
  "When I am in love, that is all I can think about.",
  "I know before I meet someone what qualities I need in a partner."
];
const correctP3 = ["D", "E", "A", "C", "B", "E", "B", "F"];
for (let i = 27; i <= 34; i++) {
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 3,
    question_type: "matching",
    text: matchTextsP3[i-27],
    correct_answer: correctP3[i-27],
    options: loveStyles,
    order_index: i
  });
}

const tfTextsP3 = [
  "People’s notions of love affect their relationships, rather than vice versa.",
  "Some of our love stories are more important to us than others.",
  "Our love stories can change to meet the needs of particular social environments.",
  "We look for romantic partners with a love story just like our own.",
  "The most successful partners have matching love stories.",
  "No love story is more suited to a long relationship than any other."
];
const tfAnsP3 = ["YES", "YES", "YES", "NO", "NOT GIVEN", "NO"];
for (let i = 35; i <= 40; i++) {
  questions.push({
    id: makeUuid(i),
    exam_id: EXAM_ID,
    section: 3,
    question_type: "true_false",
    text: tfTextsP3[i-35],
    correct_answer: tfAnsP3[i-35],
    options: null,
    order_index: i
  });
}

async function run() {
  console.log("Seeding Cambridge 18 Test 2 Reading Exam...");
  
  // 1. Delete existing exam if any
  await supabase.from("exams").delete().eq("id", EXAM_ID);
  
  // 2. Insert exam metadata
  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert(examMetadata)
    .select()
    .single();
    
  if (examError) {
    console.error("Error inserting exam:", examError);
    return;
  }
  console.log("Exam meta inserted:", exam.id);

  // 3. Insert sections
  const { data: insertedSections, error: sectionsError } = await supabase
    .from("exam_sections")
    .insert(sections)
    .select();
    
  if (sectionsError) {
    console.error("Error inserting sections:", sectionsError);
    // Rollback
    await supabase.from("exams").delete().eq("id", EXAM_ID);
    return;
  }
  console.log(`Inserted ${insertedSections.length} sections.`);

  // 4. Insert questions
  const { data: insertedQuestions, error: questionsError } = await supabase
    .from("questions")
    .insert(questions)
    .select();
    
  if (questionsError) {
    console.error("Error inserting questions:", questionsError);
    // Rollback
    await supabase.from("exams").delete().eq("id", EXAM_ID);
    return;
  }
  console.log(`Inserted ${insertedQuestions.length} questions successfully!`);
  console.log("Done seeding Cambridge 18 Test 2!");
}

run().catch(console.error);
