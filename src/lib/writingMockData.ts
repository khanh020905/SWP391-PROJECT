import type { WritingTask, WritingTestMeta } from "@/types/writing";

export const WRITING_TEST_META: WritingTestMeta = {
  id: "ielts-academic-writing-practice-test-1",
  testTitle: "IELTS Academic Writing Practice Test",
  module: "Academic",
  durationMinutes: 60,
  totalTasks: 2,
};

export const WRITING_TASKS: WritingTask[] = [
  {
    id: "task1",
    label: "Writing Task 1",
    title: "Academic Report",
    subtitle:
      "You should spend about 20 minutes on this task. Write at least 150 words.",
    recommendedMinutes: 20,
    minimumWords: 150,
    prompt:
      "The chart below shows the percentage of households in one European country with access to five household technologies between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    visualTitle: "Household Technology Access, 2000-2020",
    visualDescription:
      "Percentage of households with access to selected household technologies.",
    dataPoints: [
      {
        label: "Internet",
        values: [
          { name: "2000", value: 32, suffix: "%" },
          { name: "2005", value: 48, suffix: "%" },
          { name: "2010", value: 67, suffix: "%" },
          { name: "2015", value: 81, suffix: "%" },
          { name: "2020", value: 93, suffix: "%" },
        ],
      },
      {
        label: "Smartphone",
        values: [
          { name: "2000", value: 4, suffix: "%" },
          { name: "2005", value: 18, suffix: "%" },
          { name: "2010", value: 46, suffix: "%" },
          { name: "2015", value: 72, suffix: "%" },
          { name: "2020", value: 88, suffix: "%" },
        ],
      },
      {
        label: "Washing machine",
        values: [
          { name: "2000", value: 74, suffix: "%" },
          { name: "2005", value: 78, suffix: "%" },
          { name: "2010", value: 82, suffix: "%" },
          { name: "2015", value: 86, suffix: "%" },
          { name: "2020", value: 90, suffix: "%" },
        ],
      },
      {
        label: "Dishwasher",
        values: [
          { name: "2000", value: 28, suffix: "%" },
          { name: "2005", value: 34, suffix: "%" },
          { name: "2010", value: 41, suffix: "%" },
          { name: "2015", value: 49, suffix: "%" },
          { name: "2020", value: 58, suffix: "%" },
        ],
      },
    ],
    assessmentFocus: [
      "Overview of the main trends",
      "Accurate data selection",
      "Clear comparisons",
      "Formal report style",
    ],
  },
  {
    id: "task2",
    label: "Writing Task 2",
    title: "Essay",
    subtitle:
      "You should spend about 40 minutes on this task. Write at least 250 words.",
    recommendedMinutes: 40,
    minimumWords: 250,
    prompt:
      "Some people believe that governments should invest more money in public transport, while others think building more roads is the best way to reduce traffic congestion. Discuss both views and give your own opinion.",
    bullets: [
      "Give reasons for your answer.",
      "Include any relevant examples from your own knowledge or experience.",
    ],
    assessmentFocus: [
      "Clear position throughout the essay",
      "Balanced discussion of both views",
      "Logical paragraphing",
      "Range and accuracy of grammar and vocabulary",
    ],
  },
];

export const WRITING_STORAGE_KEY = `ielts-writing-${WRITING_TEST_META.id}`;
export const WRITING_ATTEMPTS_KEY = "ielts-writing-attempts";
