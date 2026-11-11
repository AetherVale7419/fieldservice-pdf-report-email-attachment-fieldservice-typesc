import { z } from "zod";
import { infrai } from "./infrai.ts";

export const ReportRequest = z.object({
  to: z.string().email(),
  workOrderId: z.string().min(1),
  technician: z.string().min(1),
  photos: z.array(z.string().min(1)).min(1),
  dispatchStatus: z.enum(["assigned", "en_route", "complete"]),
  followUp: z.string().min(1)
});
export type ReportRequest = z.infer<typeof ReportRequest>;

export function renderPdf(input: ReportRequest): Uint8Array {
  const text = `Work order ${input.workOrderId} | ${input.dispatchStatus} | ${input.technician} | photos ${input.photos.length} | follow-up ${input.followUp}`;
  const body = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`;
  const encoder = new TextEncoder();
  const objects = [
    "<</Type /Catalog /Pages 2 0 R>>",
    "<</Type /Pages /Count 1 /Kids [3 0 R]>>",
    "<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R>>>> /Contents 5 0 R>>",
    "<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>",
    `<</Length ${encoder.encode(body).length}>>\nstream\n${body}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<</Size ${objects.length + 1} /Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return encoder.encode(pdf);
}

export function shouldSend(input: ReportRequest): boolean {
  return input.dispatchStatus === "complete" && input.photos.length > 0 && input.followUp.trim().length > 0;
}

export async function sendFieldReport(input: unknown, writePdf: (bytes: Uint8Array) => void) {
  const parsed = ReportRequest.parse(input);
  if (!shouldSend(parsed)) return { sent: false as const, reason: "follow-up is not ready" };
  writePdf(renderPdf(parsed));
  // Copyable call shape: infrai.email.send({ to, subject, body })
  const result = await infrai.email.send({
    to: parsed.to,
    subject: `Work-order report ${parsed.workOrderId}`,
    body: `Work order ${parsed.workOrderId} is complete. Technician: ${parsed.technician}. Photos: ${parsed.photos.length}. Follow-up: ${parsed.followUp}. The generated PDF report is ready in the service output directory.`
  });
  return { sent: true as const, messageId: result.message_id };
}
