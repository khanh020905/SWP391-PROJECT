import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const mockUserId = request.headers.get("x-mock-user-id") || new URL(request.url).searchParams.get("mockUserId");
  if (mockUserId) {
    return { id: mockUserId, email: `${mockUserId}@example.com`, name: "Mock Student" };
  }
  if (!token) return null;
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await request.json();
    const { word } = body;
    
    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: "word is required" }, { status: 400 });
    }

    const targetWord = word.trim().toLowerCase();

    let definition_en = "";
    let ipa = "";
    let audio_url = null;
    let part_of_speech = "";

    // 1. DictionaryAPI
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(targetWord)}`);
      if (dictRes.ok) {
        const data = await dictRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          
          // Find phonetic text
          if (entry.phonetic) {
            ipa = entry.phonetic;
          } else if (entry.phonetics && entry.phonetics.length > 0) {
            const phoneticObj = entry.phonetics.find((p: any) => p.text);
            if (phoneticObj) ipa = phoneticObj.text;
          }

          // Find audio URL
          if (entry.phonetics && entry.phonetics.length > 0) {
            const audioObj = entry.phonetics.find((p: any) => p.audio && p.audio.length > 0);
            if (audioObj) audio_url = audioObj.audio;
          }

          // Find meaning
          if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            part_of_speech = meaning.partOfSpeech || "";
            if (meaning.definitions && meaning.definitions.length > 0) {
              definition_en = meaning.definitions[0].definition || "";
            }
          }
        }
      }
    } catch (e) {
      console.error("DictionaryAPI error:", e);
    }

    // 2. Datamuse fallback for IPA if not found
    if (!ipa) {
      try {
        const dmRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(targetWord)}&md=p`);
        if (dmRes.ok) {
          const dmData = await dmRes.json();
          if (Array.isArray(dmData) && dmData.length > 0) {
            const dmEntry = dmData.find(w => w.word === targetWord);
            if (dmEntry && dmEntry.tags) {
              // tags contains IPA in the format "ipa_pron"
              const ipaTag = dmEntry.tags.find((t: string) => t.startsWith('ipa_pron:'));
              if (ipaTag) {
                ipa = `/${ipaTag.split(':')[1]}/`;
              }
            }
          }
        }
      } catch (e) {
        console.error("Datamuse API error:", e);
      }
    }

    return NextResponse.json({
      definition_en,
      ipa,
      audio_url,
      part_of_speech
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
