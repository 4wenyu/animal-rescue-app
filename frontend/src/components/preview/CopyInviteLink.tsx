"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";

export function CopyInviteLink({
  idle,
  done,
}: {
  idle: string;
  done: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.origin + "/preview";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      {copied ? done : idle}
    </Button>
  );
}
