import { NextRequest, NextResponse } from "next/server";
import { cambridgeDictionary } from "@/lib/cambridgeDictionary";

// Free Google Translate API client-side endpoint wrapper for server use
async function translateToVietnamese(text: string): Promise<string> {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.ok) {
      const data = await res.json();
      // Google single translate response is nested: data[0] contains array of translation segments
      if (data && data[0]) {
        return data[0].map((segment: any) => segment[0]).join("") || text;
      }
    }
  } catch (e) {
    console.error("❌ Translation failed for text:", text, e);
  }
  return text;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawWord = searchParams.get("word");

    if (!rawWord) {
      return NextResponse.json({ error: "Word query parameter is required" }, { status: 400 });
    }

    const word = rawWord.trim().toLowerCase();

    // 1. Check in local curated Cambridge dictionary first
    if (cambridgeDictionary[word]) {
      return NextResponse.json({ 
        source: "local",
        entries: cambridgeDictionary[word] 
      });
    }

    // 2. Fetch from public Dictionary API
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const dictRes = await fetch(dictUrl);

    if (!dictRes.ok) {
      // If not found in either, return a basic translated entry
      const wordTranslation = await translateToVietnamese(rawWord);
      return NextResponse.json({
        source: "fallback",
        entries: [
          {
            word: rawWord,
            partOfSpeech: "noun/verb",
            ipaUk: "/-/ ",
            ipaUs: "/-/",
            definition: `No official definition found for "${rawWord}".`,
            translation: wordTranslation,
            exampleSentence: `Could not find an example for "${rawWord}".`
          }
        ]
      });
    }

    const dictData = await dictRes.json();
    const entry = dictData[0];

    // Find phonetics
    let ipa = "";
    let audioUrl = "";
    if (entry.phonetics && entry.phonetics.length > 0) {
      const phon = entry.phonetics.find((p: any) => p.text && p.audio) || entry.phonetics.find((p: any) => p.text) || entry.phonetics[0];
      ipa = phon.text || entry.phonetic || "";
      audioUrl = phon.audio || "";
    } else {
      ipa = entry.phonetic || "";
    }

    // Map meanings into our CambridgeDictEntry structure
    const entries: any[] = [];
    const meaningsLimit = entry.meanings.slice(0, 2); // limit to 2 meanings for clarity

    for (const meaning of meaningsLimit) {
      const def = meaning.definitions[0];
      if (def) {
        // Translate definition and example to Vietnamese
        const definitionEn = def.definition;
        const definitionVi = await translateToVietnamese(definitionEn);
        
        const exampleEn = def.example || "";
        const exampleVi = exampleEn ? await translateToVietnamese(exampleEn) : "";

        // Also translate the word itself as a tag
        const wordTranslation = await translateToVietnamese(word);

        entries.push({
          word: entry.word,
          partOfSpeech: meaning.partOfSpeech,
          ipaUk: ipa,
          ipaUs: ipa,
          definition: definitionEn,
          translation: `${wordTranslation} (${definitionVi})`,
          exampleSentence: exampleEn || `No example available for ${entry.word}.`,
          exampleTranslation: exampleVi,
          audioUrl: audioUrl,
          level: "B2" // Default fallback level
        });
      }
    }

    return NextResponse.json({
      source: "api.dictionaryapi.dev",
      entries: entries
    });

  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/student/vocabulary/lookup:", error);
    return NextResponse.json(
      { message: "Không thể tra từ điển.", error: error.message },
      { status: 500 }
    );
  }
}
