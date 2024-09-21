import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json({
    ok: true,
    fullName: "Natsathon Phanamphan",
    studentId: "660612145",
  });
};
