import twilioLib from "twilio";

let client: ReturnType<typeof twilioLib> | null = null;

function getClient() {
  if (!client) {
    client = twilioLib(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  }
  return client;
}

export async function sendInviteSms(toPhone: string, senderName: string, inviteUrl: string) {
  return getClient().messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: toPhone,
    body: `MyMemo: ${senderName} wants to share a personal message with you. Log in to see it: ${inviteUrl}`,
  });
}
