"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { loadSampleAction } from "@/actions/trips";
import { Button } from "@/components/ui/button";

export function LoadSampleButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await loadSampleAction();
          if (!result.ok) toast.error(result.error);
          else toast.success("Sample nomad year loaded");
        })
      }
    >
      {pending ? "Loading…" : "Load the sample nomad year"}
    </Button>
  );
}
