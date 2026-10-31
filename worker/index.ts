interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

type Recipe = {
  id: string; title: string; description: string; timeMinutes: number;
  difficulty: "Fácil" | "Médio" | "Difícil"; servings: number;
  ingredients: { name: string; quantity: string; available: boolean }[];
  steps: string[]; imagePrompt: string; tips?: string;
};

const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_INGREDIENTS = 35;

const recipeSchema = {
  type: "object",
  properties: {
    recipes: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          timeMinutes: { type: "integer" },
          difficulty: { type: "string", enum: ["Fácil", "Médio", "Difícil"] },
          servings: { type: "integer" },
          ingredients: {
            type: "array",
            items: { type: "object", properties: {
              name: { type: "string" }, quantity: { type: "string" },
              available: { type: "boolean" }
            }, required: ["name", "quantity", "available"] }
          },
          steps: { type: "array", items: { type: "string" } },
          imagePrompt: { type: "string" },
          tips: { type: "string" }
        },
        required: ["title", "description", "timeMinutes", "difficulty", "servings", "ingredients", "steps", "imagePrompt"]
      }
    },
    note: { type: "string" }
  },
  required: ["recipes"]
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function normalizeRecipe(value: any, index: number): Recipe {
  const difficulty = ["Fácil", "Médio", "Difícil"].includes(value?.difficulty) ? value.difficulty : "Fácil";
  return {
    id: `recipe-${index + 1}-${crypto.randomUUID()}`,
    title: String(value?.title || `Receita ${index + 1}`).slice(0, 90),
    description: String(value?.description || "").slice(0, 260),
    timeMinutes: Math.max(5, Math.min(240, Number(value?.timeMinutes) || 30)),
    difficulty,
    servings: Math.max(1, Math.min(12, Number(value?.servings) || 2)),
    ingredients: Array.isArray(value?.ingredients) ? value.ingredients.slice(0, 25).map((item: any) => ({
      name: String(item?.name || "").slice(0, 70),
      quantity: String(item?.quantity || "a gosto").slice(0, 50),
      available: Boolean(item?.available)
    })) : [],
    steps: Array.isArray(value?.steps) ? value.steps.slice(0, 12).map((step: unknown) => String(step).slice(0, 500)) : [],
    imagePrompt: String(value?.imagePrompt || `Professional food photography of ${value?.title || "a homemade meal"}, appetizing, natural light, no text`).slice(0, 700),
    tips: value?.tips ? String(value.tips).slice(0, 300) : undefined
  };
}

async function handleRecipes(request: Request, env: Env) {
  let body: { ingredients?: unknown; meal?: unknown; extras?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Corpo da requisição inválido." }, 400); }

  if (!Array.isArray(body.ingredients)) return json({ error: "Informe uma lista de ingredientes." }, 400);
  const ingredients = [...new Set(body.ingredients.map((item) => String(item).trim().slice(0, 60)).filter(Boolean))].slice(0, MAX_INGREDIENTS);
  if (ingredients.length < 2) return json({ error: "Informe pelo menos dois ingredientes." }, 400);

  const meal = String(body.meal || "Qualquer refeição").slice(0, 40);
  const extras = String(body.extras || "Pode sugerir itens básicos").slice(0, 100);

  const prompt = `Você é um chef brasileiro cuidadoso e criativo. Crie EXATAMENTE três receitas diferentes em português do Brasil.
Ingredientes disponíveis: ${ingredients.join(", ")}.
Tipo de refeição: ${meal}. Regra para extras: ${extras}.
Priorize usar os ingredientes disponíveis. Marque available=true somente para ingredientes informados na lista; itens extras devem ser false. Não invente que um ingrediente está disponível. Se a regra exigir somente os itens informados, não inclua nenhum extra. Inclua quantidades realistas, passos claros e seguros, tempo em minutos, porções e dificuldade. Não prometa valores nutricionais. imagePrompt deve ser uma descrição em inglês de fotografia gastronômica realista do prato pronto, sem texto, letras, marcas ou pessoas. As três receitas devem ser realmente distintas.`;

  const result: any = await env.AI.run(TEXT_MODEL, {
    messages: [
      { role: "system", content: "Responda apenas com JSON válido seguindo o schema solicitado. Não inclua markdown." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_schema", json_schema: { name: "recipe_suggestions", schema: recipeSchema, strict: true } },
    max_tokens: 3500
  });

  let parsed: any;
  try {
    const raw = typeof result === "string" ? result : result?.response ?? result?.output ?? JSON.stringify(result);
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return json({ error: "A IA não retornou receitas em um formato válido. Tente novamente." }, 502);
  }

  if (!Array.isArray(parsed?.recipes) || parsed.recipes.length < 3) {
    return json({ error: "A IA não conseguiu criar três receitas. Tente novamente." }, 502);
  }

  const recipes = parsed.recipes.slice(0, 3).map(normalizeRecipe);
  // Cada imagem é gerada separadamente. Se a geração falhar, a receita continua disponível.
  const withImages = await Promise.all(recipes.map(async (recipe) => {
    try {
      const generated: any = await env.AI.run(IMAGE_MODEL, {
        prompt: `${recipe.imagePrompt}. Editorial food photography, appetizing freshly cooked dish, natural window light, premium restaurant plating, 4:3 composition. No text, no watermark.`,
        steps: 4
      });
      if (generated?.image) recipe.image = `data:image/jpeg;base64,${generated.image}`;
    } catch (error) {
      console.error("Falha ao gerar imagem:", error);
    }
    return recipe;
  }));

  return json({ recipes: withImages, note: parsed.note });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return json({ ok: true, app: "receita-em-casa" });
    if (url.pathname === "/api/recipes" && request.method === "POST") {
      try { return await handleRecipes(request, env); }
      catch (error) {
        console.error("Erro na geração:", error);
        return json({ error: "Não foi possível gerar as receitas agora. Verifique a configuração da IA e tente novamente." }, 500);
      }
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "Rota não encontrada." }, 404);
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;