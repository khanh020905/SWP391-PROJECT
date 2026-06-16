"use client";

import React from "react";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("./ChatWidget"),
  { ssr: false }
);

export default function ChatWidgetWrapper() {
  return <ChatWidget />;
}
