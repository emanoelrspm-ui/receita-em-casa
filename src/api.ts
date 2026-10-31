import type { RecipeResponse } from "./types";

export async function generateRecipes(
  ingredients: string[],
  meal: string,
  extras: string,
): Promise<RecipeResponse> {
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients, meal, extras }),
  });

  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((payload as { error?: string })?.error || "Não foi possível gerar as receitas.");
  }
  return payload as RecipeResponse;
}
