"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setGiftDecisionAction } from "@/app/(app)/regalos/actions";
import { Button } from "@/components/ui/button";

export function GiftSuggestionsClient({
  birthdayId,
  suggestionId,
  isDecided,
}: {
  birthdayId: string;
  suggestionId: string;
  isDecided: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChoose() {
    setLoading(true);
    await setGiftDecisionAction({ birthday_id: birthdayId, gift_suggestion_id: suggestionId });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant={isDecided ? "default" : "outline"}
        disabled={loading || isDecided}
        onClick={handleChoose}
      >
        {isDecided ? "Elegida" : "Elegir esta opción"}
      </Button>
    </div>
  );
}
