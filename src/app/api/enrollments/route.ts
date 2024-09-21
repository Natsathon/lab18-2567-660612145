import { DB } from "@lib/DB";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";
import { Payload } from "@lib/DB";

export const POST = async (request: NextRequest) => {
  const rawAuthHeader = headers().get("authorization");

  if (!rawAuthHeader || !rawAuthHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        ok: false,
        message: "Authorization header is required",
      },
      { status: 401 }
    );
  }

  const token = rawAuthHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "This is my special secret";
  let studentId = null;
  let role = null;

  try {
    const payload = jwt.verify(token, secret) as Payload;
    studentId = payload.studentId;
    role = payload.role;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }

  // If the role is "ADMIN", restrict access to this route
  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        message: "Only students can access this API route",
      },
      { status: 403 }
    );
  }

  // Parse the request body
  const body = await request.json();
  const { courseNo } = body;

  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  // Check if courseNo exists
  const foundCourse = DB.courses.find((x) => x.courseNo === courseNo);
  if (!foundCourse) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo does not exist",
      },
      { status: 400 }
    );
  }

  // Check if the student is already enrolled in the course
  const foundEnroll = DB.enrollments.find(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (foundEnroll) {
    return NextResponse.json(
      {
        ok: false,
        message: "You are already enrolled in this course",
      },
      { status: 400 }
    );
  }

  //if code reach here. Everything is fine.
  //Do the DB saving
  DB.enrollments.push({
    studentId,
    courseNo,
  });

  return NextResponse.json({
    ok: true,
    message: "You has enrolled a course successfully",
  });
};

export const DELETE = async (request: NextRequest) => {
  const rawAuthHeader = headers().get("authorization");

  if (!rawAuthHeader || !rawAuthHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        ok: false,
        message: "Authorization header is required",
      },
      { status: 401 }
    );
  }

  const token = rawAuthHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "This is my special secret";
  let studentId = null;
  let role = null;
  try {
    const payload = jwt.verify(token, secret) as Payload;
    studentId = payload.studentId;
    role = payload.role;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Invalid token",
      },
      { status: 401 }
    );
  }


  if (role === "ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        message: "Only Student can access this API route",
      },
      { status: 403 }
    );
  }

  //get courseNo from body and validate it
  const body = await request.json();
  const { courseNo } = body;
  if (typeof courseNo !== "string" || courseNo.length !== 6) {
    return NextResponse.json(
      {
        ok: false,
        message: "courseNo must contain 6 characters",
      },
      { status: 400 }
    );
  }

  const foundIndex = DB.enrollments.findIndex(
    (x) => x.studentId === studentId && x.courseNo === courseNo
  );
  if (foundIndex === -1) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "You cannot drop from this course. You have not enrolled it yet!",
      },
      { status: 404 }
    );
  }

  DB.enrollments.splice(foundIndex, 1);

  return NextResponse.json({
    ok: true,
    message: "You has dropped from this course. See you next semester.",
  });
};
