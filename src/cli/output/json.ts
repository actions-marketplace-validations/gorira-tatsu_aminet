import type { Report } from "../../core/report/types.js";

export function renderJson(report: Report): void {
  console.log(JSON.stringify(report, null, 2));
}
