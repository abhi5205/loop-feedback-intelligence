import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "LOOP Customer Intelligence API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: {
      multiTenancy: true,
      rbac: true,
      claudeClassification: true,
      ragAskLoop: true,
      vocReports: true,
    },
  });
}
