import { shouldSend } from "./report.ts";

const complete = { to: "tech@example.com", workOrderId: "WO-17", technician: "Mina", photos: ["arrival.jpg"], dispatchStatus: "complete" as const, followUp: "Replace seal" };
if (!shouldSend(complete)) throw new Error("complete work orders with follow-up should send");
if (shouldSend({ ...complete, dispatchStatus: "assigned" })) throw new Error("assigned work orders should wait");
console.log("report decision test passed");

const { renderPdf } = await import("./report.ts");
const pdf = new TextDecoder().decode(renderPdf(complete));
if (!pdf.includes("/Count 1 /Kids [3 0 R]") || !pdf.includes("/Type /Page /Parent 2 0 R")) {
  throw new Error("PDF must contain a reachable page");
}
const xrefOffset = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
if (!pdf.slice(xrefOffset).startsWith("xref\n")) throw new Error("invalid PDF cross-reference offset");

const { infrai, InfraiError } = await import("./infrai.ts");
const originalFetch = globalThis.fetch;
const originalKey = process.env.INFRAI_API_KEY;
process.env.INFRAI_API_KEY = "local-test";
let calls = 0;
try {
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify(calls < 3
      ? { ok: false, error: { code: "RATE_LIMITED" } }
      : { ok: true, data: { message_id: "test-message" } }), { status: calls < 3 ? 429 : 200 });
  };
  const result = await infrai.email.send({ to: complete.to, subject: "test", body: "test" });
  if (calls !== 3 || result.message_id !== "test-message") throw new Error("429 must retry rejected envelopes");
  calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(JSON.stringify({ ok: false, error: { code: "RATE_LIMITED" } }), { status: 429 });
  };
  try {
    await infrai.email.send({ to: complete.to, subject: "test", body: "test" });
    throw new Error("exhausted retries must fail");
  } catch (error) {
    if (!(error instanceof InfraiError) || error.status !== 429 || calls !== 3) throw error;
  }
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.INFRAI_API_KEY;
  else process.env.INFRAI_API_KEY = originalKey;
}
console.log("PDF and retry tests passed");
