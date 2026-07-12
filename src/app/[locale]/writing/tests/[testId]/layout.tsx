import fs from "fs/promises";
import path from "path";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ testId: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { testId } = await params;

  try {
    const file = path.join(process.cwd(), "public", "data", "writing", `${path.basename(testId)}.json`);
    const data = JSON.parse(await fs.readFile(file, "utf8"));

    const taskLabel = data.task_type === "task1" ? "Task 1" : data.task_type === "task2" ? "Task 2" : "Writing";
    const title = `${taskLabel}: ${data.title || "Bài tập Writing IELTS"}`;
    const description = (data.description || "")
      .replace(/<[^>]+>/g, "")
      .trim()
      .substring(0, 200) || "Luyện viết IELTS với đề thi thực tế.";
    const images = data.cloudinary_url
      ? [{ url: data.cloudinary_url as string, alt: data.title as string }]
      : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: data.cloudinary_url ? [data.cloudinary_url as string] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
