import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, comparePassword, hashPassword, COOKIE_NAME } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { isGeminiConfigured } from "@/lib/gemini";
import { DataService } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        creatorType: user.creatorType || "YouTuber",
        specializations: user.specializations || [],
        bio: user.bio || "",
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      system: {
        mongoConfigured: isMongoConfigured(),
        geminiConfigured: isGeminiConfigured(),
      },
    });
  } catch (error) {
    console.error("Auth Me GET Error:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, creatorType, specializations, bio, currentPassword, newPassword } = body;

    const updateFields: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json({ error: "Name must not be empty" }, { status: 400 });
      }
      updateFields.name = name.trim();
    }

    if (creatorType !== undefined) {
      updateFields.creatorType = creatorType;
    }

    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return NextResponse.json({ error: "Specializations must be an array" }, { status: 400 });
      }
      updateFields.specializations = specializations.map((s: string) => String(s).trim()).filter(Boolean);
    }

    if (bio !== undefined) {
      if (typeof bio === "string" && bio.length > 280) {
        return NextResponse.json({ error: "Bio cannot exceed 280 characters" }, { status: 400 });
      }
      updateFields.bio = bio;
    }

    // Password change request
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Check current password
      const isMatch = await comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      updateFields.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await DataService.updateUser(user._id, updateFields);
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        creatorType: updatedUser.creatorType,
        specializations: updatedUser.specializations,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Auth Me PUT Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { confirm, password } = body;

    if (confirm !== "DELETE") {
      return NextResponse.json(
        { error: "You must type DELETE in all caps to confirm deletion." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete your account." },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    // Cascading delete
    await DataService.deleteUserAndData(user._id);

    const response = NextResponse.json({
      success: true,
      message: "Account and all associated creator data have been permanently deleted.",
    });

    // Clear auth cookie
    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error) {
    console.error("Auth Me DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
