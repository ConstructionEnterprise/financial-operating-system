import React from "react";
import { canShowSendButton } from "../../../shared/outreach";

type SendButtonProps = {
  gmailConnected: boolean;
  status: string;
  pending?: boolean;
  onSend: () => void;
};

export function SendButton({ gmailConnected, status, pending = false, onSend }: SendButtonProps) {
  const enabled = canShowSendButton(gmailConnected, status) && !pending;
  return <button className="send-button" disabled={!enabled} onClick={onSend}>{pending ? "Sending…" : "Send via Gmail"}</button>;
}
