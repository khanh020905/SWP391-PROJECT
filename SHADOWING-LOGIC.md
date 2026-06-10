# Shadowing & Dictation Feature — Full Logic Reference

## Overview

Two practice modes share the same video + subtitle infrastructure:

- **Shadowing** — listen to a sentence, record yourself, get a pronunciation score
- **Dictation** — listen and type what you hear letter by letter

Both modes are available on pre-packaged lessons AND custom YouTube videos the user uploads themselves.

---

## Part 1: Custom Video Upload Flow

### Step 1 — Caption Extraction (`GET /api/youtube-captions`)

**File:** `frontend/src/app/api/youtube-captions/route.ts`

#### Auth & rate-limit gate

- Requires Supabase session (401 if not logged in)
- Calls `checkShadowingRateLimit()` before fetching (same limits as save endpoint)

#### Video ID parsing

Accepts full YouTube URLs or bare 11-char IDs.
Patterns handled: `youtube.com/watch?v=`, `youtu.be/`, plain `xxxxxxxxxxx`.

#### Transcript fetch strategy

```
fetchEnglishTranscript(videoId)
  ├── fetchViaYtDlp()         ← primary (production server)
  │     yt-dlp --dump-json → subtitle URL → fetch json3 format
  │     Prefers manual captions > auto-generated
  │     Prefers exact `en` > en-US/en-GB/en-AU
  └── fetchViaPackage()       ← fallback (local dev, yt-dlp not on PATH)
        youtube-transcript npm, tries en/en-US/en-GB/en-AU/en-CA in order
```

> **Why yt-dlp?** YouTube blocks transcript fetches from datacenter IPs. yt-dlp implements the PO token / anti-bot bypass that the npm package doesn't have.

#### Post-fetch processing

1. **HTML entity decode** (`&#39;` → `'`, `&amp;` → `&`, etc.)
2. **Unit normalisation** — json3 offsets are ms; heuristic `firstOffset > 100` detects ms and divides by 1000. After `fetchViaYtDlp`, offsets are already converted to seconds.
3. **IPA generation** per segment via `textToIpa()`:
   - Tokenise, lowercase, strip punctuation
   - Look up each word in `cmu-pronouncing-dictionary` (ARPABET format)
   - Convert ARPABET → IPA via `arpaToIpa()` (stress marks: `1`→`ˈ`, `2`→`ˌ`; `AH0`→`ə`, `ER0`→`ɚ`)
4. **English check** — `looksLikeEnglish()` samples first 10 segments; rejects if ASCII ratio < 75%
5. **Length check** — rejects videos > 20 minutes (`last start_time + duration > 1200s`)

#### Response shape

```json
{
  "videoId": "xxxxxxxxxxx",
  "segments": [
    {
      "id": 0,
      "text": "Hello world.",
      "start_time": 1.4,
      "duration": 2.1,
      "ipa": "/hɛloʊ wɝld/",
      "vietnamese_text": null
    }
  ]
}
```

---

### Step 2 — Save to Supabase (`POST /api/shadowing/save`)

**File:** `frontend/src/app/api/shadowing/save/route.ts`

#### Validation checks (in order)

| Check | Limit | HTTP |
|---|---|---|
| Auth | required | 401 |
| Rate limit | see below | 429 |
| `segments` array | required + non-empty | 400 |
| Max segments | 1500 | 400 |
| Video duration | < 20 min | 400 |
| Duplicate | same `youtube_id` + `user_id` | 409 + returns existing `id` |

#### Rate limiting (`frontend/src/app/api/shadowing/_utils.ts`)

```
GLOBAL_DAILY_LIMIT = 25    (resets at UTC midnight)
PER_USER_DAILY_LIMIT = 1
```

Admins and Tidians bypass all limits:

```ts
role === "super_admin" || "content_editor" || "tidian"  →  allowed: true
```

Both counts query `shadowing_videos WHERE is_custom = true AND created_at >= today_utc`.

`reason` field in 429 response: `"global"` or `"user"` — UI shows different copy for each.

#### Database writes

**Step A — `shadowing_videos` insert:**

```ts
{
  youtube_id, title, thumbnail_url,
  category: 'Custom', level: 'Custom', duration: '--:--',
  segments: segments.length,
  user_id, is_custom: true, is_community: true
}
```

Title + thumbnail fetched from YouTube oEmbed (no API key). Falls back to generic title / `hqdefault.jpg`.

**Step B — `shadowing_subtitles` batch insert (100 rows/batch):**

```ts
{ video_id, text, ipa, start_time, duration, vietnamese_text }
```

If any batch fails → rollback by deleting the video row → return 500.

#### Success response

```json
{ "success": true, "id": "<supabase-uuid>", "youtubeId": "xxxxxxxxxxx" }
```

UI navigates to `/practice/speaking/shadowing/<id>?saved=true&mode=<shadowing|dictation>`.

---

### Step 3 — Frontend modal (`/practice/speaking/shadowing`)

**File:** `frontend/src/app/practice/speaking/shadowing/page.tsx`

**2-step modal UI:**

| Step | What happens |
|---|---|
| 1 — URL input | User pastes YouTube link → `GET /api/youtube-captions?videoId=...` |
| 2 — Preview & save | Shows thumbnail + segment count + "Lưu vào thư viện" toggle → `POST /api/shadowing/save` |

**localStorage fallback:** Before calling save, segments are always written to
`localStorage["custom_lesson_<videoId>"]`. If user is not logged in or save is skipped,
navigation uses `?custom=true` and the player reads from localStorage instead of Supabase.

On 409 (duplicate) → still navigates to the existing lesson ID.

---

## Part 2: Lesson Player

**File:** `frontend/src/app/practice/speaking/shadowing/[lessonId]/page.tsx`

### Data loading (on mount)

| URL param | Source |
|---|---|
| `?saved=true` or `?community=true` | Supabase: `shadowing_videos` by UUID + `shadowing_subtitles` ordered by `start_time` |
| `?custom=true` | `localStorage["custom_lesson_<lessonId>"]` |
| *(no param)* | Supabase: `shadowing_videos` by `youtube_id` |

`activeSubtitles` = loaded subtitles if present, otherwise falls back to `mockTranscripts` (Star Wars laser scene — dev placeholder).

### YouTube player sync

A 100ms interval polls `player.getCurrentTime()`. When playback reaches `start_time + duration` of the current sentence, it pauses the video automatically. This is what makes sentences play one-at-a-time.

### Progress persistence

- `localStorage["shadowing_progress_<videoId>"]` → `{ currentIdx }`
- `localStorage["shadowing_results_<videoId>"]` → score object keyed by sentence index
- On mount: if prior progress exists, shows "Tiếp tục?" resume modal (framer-motion spring animation)
- Practice history POSTed to `/api/history` debounced by 3 s, then PATCHed on subsequent score changes

### Auto-translation

On each sentence change, if `vietnamese_text` is absent from DB and no local translation exists:

- Calls `mymemory.translated.net/get?q=...&langpair=en|vi`
- On success, saves back to `shadowing_subtitles.vietnamese_text` via Supabase client (for all future users)

### Keyboard shortcuts (both modes)

| Key | Action |
|---|---|
| `Tab` | Replay current sentence from `start_time` |
| `Enter` | Advance to next sentence |
| `Ctrl` | Go back to previous sentence |

Single `keydown` listener in capture phase routes to `shadowKeyHandlerRef` or `dictKeyHandlerRef` depending on `practiceMode`. Refs are updated every render (no deps array) so handlers always read fresh state without stale closure bugs.

---

## Part 3: Shadowing Mode

### Recording pipeline

```
User clicks record button
  → startRecording()
      ├── SpeechRecognition (continuous, interim results, en-US)
      │     Updates latestTranscriptRef on every result event
      │     On `onend` while MediaRecorder still running → restarts recognition
      │         (handles network disconnects mid-session)
      └── MediaRecorder (timeslice=100ms, audio/webm)
            Collects chunks into audioChunksRef

User clicks stop
  → pendingEvalRef = { targetText, idx, videoId }
  → recognition.stop() + mediaRecorder.stop()
  → mediaRecorder.onstop fires:
      1. POST /api/transcribe (Groq Whisper, webm blob + hint text)
             → finalTranscript   (preferred if non-empty)
      2. Fallback: latestTranscriptRef from Web Speech API
      3. evaluatePronunciation(finalTranscript, targetText)
      4. setResults + localStorage["shadowing_results_<videoId>"]
```

**Microphone warm-up:** `navigator.mediaDevices.getUserMedia` is called on component mount and the stream is kept alive in `streamRef`. This avoids the ~200ms silence on the first recording that occurs when hardware has to spin up from cold. The 200ms `setTimeout` settle in `startRecording()` also helps.

### Scoring algorithm — `evaluatePronunciation(spoken, target)`

1. Normalise both strings: lowercase + strip `[^\w\s']`
2. Split into word arrays
3. **LCS (Longest Common Subsequence)** — order-preserving match via DP table
   - Prevents inflated scores from unordered word inclusion (e.g., Whisper hallucinating the full target text)
4. Backtrack DP table to find which target word indices matched in order
5. `score = Math.round(matched.size / targetWords.length * 100)`
6. Returns `{ score, wordResults: [{ word, correct }], spokenText }`

Word results drive the colour-coded feedback (green = correct, red = missed).

---

## Part 4: Dictation Mode

### Sentence parsing — `parsedDictation` (useMemo)

Runs on every `currentSentence.text` change. Produces:

```ts
{
  words: Array<{
    isSpace: boolean,
    chars: Array<{
      raw: string,         // original character
      isLetter: boolean,   // /[a-z0-9À-ỹ]/i
      letterIndex: number  // sequential index across whole sentence, -1 if not a letter
    }>
  }>,
  totalLetters: number,    // total typeable characters
  letters: Array<{ char: string (lowercase), raw: string, index: number }>
}
```

Punctuation (`,`, `.`, `'`, etc.) is parsed and rendered but **not counted** as typeable — it shows automatically inline without requiring a keypress.

### Typing mechanics — `dictPos`

`dictPos` is the cursor: the index of the **next letter the user must type**.

On each keypress (`dictKeyHandlerRef`):

- If `e.key.toLowerCase() === letters[dictPos].char` → `dictPos++`, clear wrong state
- Otherwise → `setWrongLetterIdx(dictPos)`, flash ❌ for 400ms via setTimeout, `dictPos` stays

Space key is caught and suppressed (`preventDefault`) — spaces are never required to be typed.
Single-char keys only; `Tab`, `Enter`, `Ctrl` are handled separately before reaching the letter logic.

### Visual rendering

**Top row — `dict-sentence`:** Shows actual characters. Letters at index `< dictPos` have class `shown` (revealed). The letter at `dictPos` gets class `cursor` (blinking caret effect) or `wrong` (red flash). Punctuation always shows.

**Bottom row — `dbox` tiles:** One box per letter, mirrors the cursor/filled/pop states. Letters before cursor show the actual character; letters at or after cursor show a `·` dot.

Progress bar (`dict-bar`) and dino sprite advance proportionally to `dictPos / totalLetters`.

### Completing a sentence

When `dictPos >= parsedDictation.totalLetters`:

- Sentence added to `completedDictSentences` Set (sidebar shows ✓ checkmark)
- **Completion sound:** Web Audio API plays a 4-note Mario fanfare (`C5 E5 G5 C6`, square wave oscillators, 130ms spacing, 180ms duration each)
- `dict-card` gets class `done` (visual celebration state)
- `yoohoo` element shows "yoo hoo! 🇻🇳"

### Hint system — word clicks

**`handleDictWordClick(word)`:**
Clicking a word in dictation mode progressively reveals it:

- If cursor is before the word's first letter → reveal first letter (`dictPos = firstLetterIndex + 1`)
- If cursor is mid-word → reveal entire word (`dictPos = lastLetterIndex + 1`)

**`revealedHints[wordIndex]`** tracks a 2-level hint per word (used in a separate hint-click handler `handleHintClick` that triggers dictionary lookup on level 2).

### Action buttons

| Button | Action |
|---|---|
| Hiện đáp án | `setDictPos(parsedDictation.totalLetters)` — instantly reveals all letters |
| Làm lại | `setDictPos(0)`, seek player to sentence start, play |

### Mobile virtual keyboard

Rendered only on `lg:hidden` (< 1024px). Three rows: `qwerty…`, `asdfg…'`, `zxcvb…-`.
Each key tap calls `dictKeyHandlerRef.current({ key, ctrlKey: false, ... })` directly — reuses the exact same handler as physical keyboard so behaviour is identical.

---

## Database tables involved

| Table | Fields used |
|---|---|
| `shadowing_videos` | `id`, `youtube_id`, `title`, `thumbnail_url`, `category`, `level`, `duration`, `segments`, `user_id`, `is_custom`, `is_community`, `created_at` |
| `shadowing_subtitles` | `id`, `video_id`, `text`, `ipa`, `start_time`, `duration`, `vietnamese_text` |
| `profiles` | `role` — rate-limit bypass check |

---

## Error surfaces to know

| Scenario | Where it fails | Message |
|---|---|---|
| No English CC on video | `fetchViaYtDlp` | "Transcript is disabled on this video" |
| Non-English video | `looksLikeEnglish()` | "Video không có phụ đề tiếng Anh..." |
| Video > 20 min | Both extract + save | "Video quá dài..." |
| > 1500 subtitle segments | Save validation | "Video quá dài (tối đa 1500 đoạn)" |
| Global daily cap hit | `_utils.ts` | `reason: "global"` → big amber warning block |
| Per-user cap hit | `_utils.ts` | `reason: "user"` → different amber copy |
| Duplicate video | Save 409 | Still navigates to existing lesson |
| yt-dlp not on PATH | `ENOENT` → package fallback | Silent, dev-only |
| Groq Whisper fails | `onstop` catch | Falls back to Web Speech transcript |
| Web Speech no-speech | `recognition.onerror` | "Không nghe thấy tiếng..." toast, 3s |
