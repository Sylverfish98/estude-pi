import "server-only";
import { revalidatePath } from "next/cache";

export function revalidateApp() {
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/timer");
  revalidatePath("/subjects/[id]", "page");
  revalidatePath("/templates/[templateId]", "page");
}
