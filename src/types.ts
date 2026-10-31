export type Ingredient = { id: string; name: string };

export type Recipe = {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  difficulty: "Fácil" | "Médio" | "Difícil";
  servings: number;
  ingredients: { name: string; quantity: string; available: boolean }[];
  steps: string[];
  image?: string;
  imagePrompt?: string;
  tips?: string;
};

export type RecipeResponse = {
  recipes: Recipe[];
  note?: string;
};