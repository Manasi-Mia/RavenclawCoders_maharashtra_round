import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { hashPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, creatorType } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields (name, email, password)" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = await DataService.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await DataService.createUser({
      name,
      email,
      passwordHash,
      creatorType: creatorType || "YouTuber",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = await signToken({
      userId: user._id as string,
      email: user.email,
      name: user.name,
      creatorType: user.creatorType,
    });

    const response = NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        creatorType: user.creatorType,
        avatar: user.avatar,
      },
      message: "Registration successful",
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
