import { mkdir, writeFile } from "node:fs/promises";
import { sendFieldReport } from "../src/report.ts";

const to = process.env.FIELD_SERVICE_EMAIL;
if (!to) throw new Error("FIELD_SERVICE_EMAIL is required");

const input = {
  to,
  workOrderId: process.env.WORK_ORDER_ID ?? "WO-1042",
  technician: "Jordan Lee",
  photos: ["panel-before.jpg", "panel-after.jpg"],
  dispatchStatus: "complete",
  followUp: "Schedule a 30-day inspection"
};
const result = await sendFieldReport(input, async (bytes) => {
  await mkdir("output", { recursive: true });
  await writeFile(`output/${input.workOrderId}.pdf`, bytes);
});
console.log(result);
