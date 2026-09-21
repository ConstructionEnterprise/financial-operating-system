export function sixMonthsFrom(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 6);
  return result;
}

export function buildInitialSubject(firmName: string) {
  return `CE/FF + ${firmName}`;
}

export function buildFollowUpSubject(firmName: string) {
  return `Following up — CE/FF + ${firmName}`;
}

export function canSendFromGmailStatus(connected: boolean) {
  return connected;
}

export function canSendToContactStatus(status: string) {
  return status !== "opted_out" && status !== "bounced" && status !== "paused";
}

export function canShowSendButton(gmailConnected: boolean, status: string) {
  return gmailConnected && status === "approved" && canSendToContactStatus(status);
}
