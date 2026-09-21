import React from "react";
import { Button } from "@/components/ui/button";

type AISummaryPanelProps = {
  summary?: string;
  error?: string;
  onSave?: () => void;
};

export function AISummaryPanel({ summary, error, onSave }: AISummaryPanelProps) {
  if (error) {
    return <div className="ai-summary ai-error"><span className="kicker">AI SUMMARY ERROR</span><p>{error}</p><small>Retry after checking the investor events and meeting notes.</small></div>;
  }
  if (!summary) return null;
  return <div className="ai-summary"><span className="kicker">AI HISTORY SUMMARY</span><p>{summary}</p>{onSave && <Button variant="outline" onClick={onSave}>Save summary to notes</Button>}</div>;
}
