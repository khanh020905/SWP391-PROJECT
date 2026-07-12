"use client";

import React from "react";
import MockAudioPlayer from "./MockAudioPlayer";
import TranscriptViewer from "./TranscriptViewer";
import { useListeningTest } from "@/context/ListeningTestContext";

export default function AudioPanel() {
  const { currentSection } = useListeningTest();
  const hasDescription = !!(currentSection?.audioDescription && currentSection.audioDescription.trim() !== "");

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="shrink-0">
        <MockAudioPlayer />
      </div>
      {hasDescription && (
        <div className="flex-1 min-h-0">
          <TranscriptViewer />
        </div>
      )}
    </div>
  );
}
