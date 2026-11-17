"use server";
// Server actions for the owner dashboard. Every action checks the admin cookie
// first, because server actions can be called directly like an API.
import { revalidatePath } from "next/cache";
import { endAdminSession, isAdmin, passwordIsCorrect, startAdminSession } from "@/lib/admin-auth";
import { ingestDocument } from "@/lib/rag";
import { resetStoreData } from "@/lib/demo-reset";
import { db } from "@/lib/supabase";
import { CORE_POLICIES } from "@/lib/admin-data";

export type ActionState = { ok?: boolean; message?: string };

const MAX_DOC_BYTES = 200_000;

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (!passwordIsCorrect(password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down password guessing
    return { ok: false, message: "Wrong password." };
  }
  await startAdminSession();
  revalidatePath("/admin");
  return { ok: true };
}

export async function logout() {
  await endAdminSession();
  revalidatePath("/admin");
}

export async function uploadPolicy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { ok: false, message: "Please log in again." };

  const file = formData.get("file");
  const pasted = String(formData.get("text") ?? "").trim();
  let name = String(formData.get("name") ?? "").trim();
  let text = pasted;

  if (file instanceof File && file.size > 0) {
    if (!/\.(md|txt)$/i.test(file.name)) return { ok: false, message: "Please upload a .md or .txt file." };
    if (file.size > MAX_DOC_BYTES) return { ok: false, message: "File is too big (max 200 KB)." };
    text = (await file.text()).trim();
    name = name || file.name;
  }
  if (!text) return { ok: false, message: "Choose a file or paste some text." };
  if (text.length > MAX_DOC_BYTES) return { ok: false, message: "Text is too long (max 200 KB)." };

  // Turn the name into a safe file-like id, e.g. "Gift Cards" -> "gift-cards.md".
  const source =
    (name || "uploaded-policy")
      .toLowerCase()
      .replace(/\.(md|txt)$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) + ".md";
  // Documents without a "# Title" line get one from the name, so chunks have a title.
  if (!/^#\s/m.test(text)) text = `# ${name.replace(/\.(md|txt)$/i, "") || "Policy"}\n\n${text}`;

  try {
    const result = await ingestDocument(source, text);
    revalidatePath("/admin");
    return { ok: true, message: `Indexed "${result.title}" as ${result.source} (${result.chunks} chunks). The agent can use it now.` };
  } catch (error) {
    console.error("Upload failed:", error);
    return { ok: false, message: "Could not index the document (the AI service may be busy). Please try again." };
  }
}

export async function deletePolicy(formData: FormData) {
  if (!(await isAdmin())) return;
  const source = String(formData.get("source") ?? "");
  if (CORE_POLICIES.includes(source)) return; // the demo depends on these
  await db().from("documents").delete().eq("source", source);
  revalidatePath("/admin");
}

export async function resolveEscalation(formData: FormData) {
  if (!(await isAdmin())) return;
  await db().from("escalations").update({ status: "resolved" }).eq("id", Number(formData.get("id")));
  revalidatePath("/admin");
}

export async function resetDemo(): Promise<ActionState> {
  if (!(await isAdmin())) return { ok: false, message: "Please log in again." };
  try {
    const counts = await resetStoreData();
    revalidatePath("/admin");
    return { ok: true, message: `Demo data reset: ${counts.orders} orders back to their starting state.` };
  } catch (error) {
    console.error("Reset failed:", error);
    return { ok: false, message: "Reset failed. Please try again." };
  }
}
