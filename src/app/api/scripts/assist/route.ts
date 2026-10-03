import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { assistScriptEditing, ScriptAssistParams } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, selectedText, fullScript, instruction } = (await req.json()) as ScriptAssistParams;

    if (!action || !fullScript) {
      return NextResponse.json({ error: "Action and full script are required" }, { status: 400 });
    }

    const result = await assistScriptEditing({
      action,
      selectedText,
      fullScript,
      instruction,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Script Assist Error:", error);
    return NextResponse.json({ error: "Failed to assist with script editing" }, { status: 500 });
  }
}
