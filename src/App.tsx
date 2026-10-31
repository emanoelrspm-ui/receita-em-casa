import { useMemo, useState } from "react";
import { ChefHat, Plus, X, Sparkles, Clock3, Users, ArrowRight, ArrowLeft, Leaf, Flame, Utensils, Heart } from "lucide-react";
import { generateRecipes } from "./api";
import type { Ingredient, Recipe } from "./types";

const starter = ["Ovos", "Tomate", "Cebola", "Arroz", "Alho"];
const demoRecipes: Recipe[] = [
  { id: "demo-1", title: "Arroz cremoso de frigideira", description: "Uma refeição prática, colorida e cheia de sabor para aproveitar o arroz e os vegetais.", timeMinutes: 25, difficulty: "Fácil", servings: 2, ingredients: [{name:"Arroz cozido",quantity:"2 xícaras",available:true},{name:"Tomate",quantity:"1 unidade",available:true},{name:"Cebola",quantity:"½ unidade",available:true},{name:"Alho",quantity:"2 dentes",available:true},{name:"Azeite",quantity:"1 colher",available:false}], steps:["Pique a cebola, o tomate e o alho.","Refogue a cebola e o alho em um fio de azeite.","Junte o tomate e cozinhe até começar a desmanchar.","Acrescente o arroz, misture bem e ajuste o sal.","Finalize com ervas frescas, se tiver, e sirva."], imagePrompt:"Brazilian creamy tomato rice in a rustic ceramic bowl, appetizing natural food photography" },
  { id: "demo-2", title: "Omelete da horta", description: "Ovos macios com tomate e cebola: simples, nutritivo e pronto rapidinho.", timeMinutes: 15, difficulty: "Fácil", servings: 1, ingredients: [{name:"Ovos",quantity:"3 unidades",available:true},{name:"Tomate",quantity:"½ unidade",available:true},{name:"Cebola",quantity:"¼ unidade",available:true},{name:"Sal",quantity:"a gosto",available:false}], steps:["Bata os ovos com uma pitada de sal.","Pique o tomate e a cebola em cubinhos.","Misture os vegetais aos ovos.","Despeje em uma frigideira antiaderente aquecida.","Cozinhe em fogo baixo, vire com cuidado e sirva."], imagePrompt:"Fluffy omelette with fresh diced tomato and herbs on a white plate, editorial food photography" },
  { id: "demo-3", title: "Arroz de alho dourado", description: "Um acompanhamento aromático que também funciona como prato rápido.", timeMinutes: 20, difficulty: "Fácil", servings: 2, ingredients: [{name:"Arroz cozido",quantity:"2 xícaras",available:true},{name:"Alho",quantity:"3 dentes",available:true},{name:"Cebola",quantity:"½ unidade",available:true},{name:"Óleo",quantity:"1 colher",available:false}], steps:["Fatie o alho e pique a cebola.","Aqueça o óleo e doure o alho sem deixar queimar.","Adicione a cebola e refogue até ficar transparente.","Acrescente o arroz e mexa até aquecer por igual.","Prove, ajuste o tempero e sirva."], imagePrompt:"Golden garlic fried rice in a shallow handmade bowl, close-up realistic food photography" }
];

export default function App() {
  const [items, setItems] = useState<Ingredient[]>(starter.map((name) => ({id: crypto.randomUUID(), name})));
  const [draft, setDraft] = useState("");
  const [meal, setMeal] = useState("Qualquer refeição");
  const [extra, setExtra] = useState("Pode sugerir itens básicos como sal, óleo e azeite");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  const ingredientNames = useMemo(() => items.map((item) => item.name), [items]);
  function addIngredient(value = draft) {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name || items.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    setItems((current) => [...current, {id: crypto.randomUUID(), name}]);
    setDraft("");
  }
  function removeIngredient(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }
  async function handleGenerate() {
    if (items.length < 2) { setError("Adicione pelo menos dois ingredientes."); return; }
    setLoading(true); setError(""); setRecipes([]); setSelected(null); setDemo(false);
    try {
      const result = await generateRecipes(ingredientNames, meal, extra);
      setRecipes(result.recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally { setLoading(false); }
  }
  function loadDemo() {
    setRecipes(demoRecipes); setSelected(null); setDemo(true); setError("");
    document.getElementById("suggestions")?.scrollIntoView({behavior:"smooth"});
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><ChefHat size={22}/></span><span>receita<span className="brand-light">em casa</span></span></a>
        <div className="topbar-right"><span className="status-dot"/> <span>Ideias fresquinhas para sua cozinha</span></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14}/> CRIATIVIDADE COM O QUE VOCÊ TEM</div>
            <h1>O que tem na sua cozinha <em>hoje?</em></h1>
            <p className="hero-description">Conte o que tem na geladeira e deixe a inspiração acontecer. A gente encontra receitas deliciosas para você.</p>
            <div className="hero-note"><Leaf size={16}/> Menos desperdício, mais sabor.</div>
          </div>
          <div className="hero-art"><img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1000&q=85" alt="Mesa com ingredientes frescos"/><div className="floating-note"><span>✳</span><div><strong>Seu próximo prato</strong><small>começa aqui</small></div></div></div>
        </section>

        <section className="workspace">
          <div className="section-heading"><div><span className="step-label">01 — SUA DESPENSA</span><h2>Ingredientes disponíveis</h2><p>Adicione tudo o que você gostaria de usar na receita.</p></div><span className="ingredient-count">{items.length} itens</span></div>
          <div className="ingredient-box">
            <div className="ingredient-list">
              {items.map((item) => <span className="ingredient-chip" key={item.id}>{item.name}<button aria-label={`Remover ${item.name}`} onClick={() => removeIngredient(item.id)}><X size={14}/></button></span>)}
              {items.length === 0 && <span className="empty-hint">Seus ingredientes aparecerão aqui...</span>}
            </div>
            <form className="add-form" onSubmit={(event) => {event.preventDefault(); addIngredient();}}>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ex.: cenoura, queijo, macarrão..." aria-label="Novo ingrediente"/>
              <button className="add-button" type="submit"><Plus size={17}/> Adicionar</button>
            </form>
            <div className="quick-add"><span>IDEIAS:</span>{["Queijo","Frango","Batata","Cenoura","Limão"].map((name) => <button key={name} onClick={() => addIngredient(name)} disabled={items.some((item) => item.name.toLowerCase() === name.toLowerCase())}>+ {name}</button>)}</div>
          </div>

          <div className="preferences">
            <div className="preference-field"><label htmlFor="meal">TIPO DE REFEIÇÃO</label><select id="meal" value={meal} onChange={(event) => setMeal(event.target.value)}><option>Qualquer refeição</option><option>Café da manhã</option><option>Almoço</option><option>Jantar</option><option>Lanche</option><option>Sobremesa</option></select></div>
            <div className="preference-field"><label htmlFor="extras">INGREDIENTES EXTRAS</label><select id="extras" value={extra} onChange={(event) => setExtra(event.target.value)}><option>Pode sugerir itens básicos como sal, óleo e azeite</option><option>Use somente o que informei</option><option>Pode sugerir até 3 ingredientes extras</option></select></div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="generate-row"><button className="generate-button" onClick={handleGenerate} disabled={loading || items.length < 2}><Sparkles size={18}/>{loading ? "Criando suas receitas..." : "Encontrar minhas receitas"}<ArrowRight size={17}/></button><button className="demo-button" onClick={loadDemo}>Experimentar com receitas de exemplo</button></div>
          <p className="privacy-note">✦ Suas escolhas ficam apenas nesta sessão. Nenhuma conta necessária.</p>
        </section>

        {(recipes.length > 0 || loading) && <section className="suggestions" id="suggestions">
          <div className="section-heading"><div><span className="step-label">02 — INSPIRAÇÃO À MESA</span><h2>Ideias que combinam com você</h2><p>{demo ? "Conheça a experiência com estas receitas de demonstração." : "Três possibilidades preparadas a partir dos seus ingredientes."}</p></div><span className="ai-pill"><Sparkles size={13}/> {demo ? "DEMONSTRAÇÃO" : "IA NA COZINHA"}</span></div>
          {loading ? <div className="loading-grid">{[1,2,3].map((n) => <div className="skeleton-card" key={n}><div/><span/><span/></div>)}</div> : <div className="recipe-grid">{recipes.map((recipe, index) => <article className="recipe-card" key={recipe.id}><div className="recipe-image"><img src={recipe.image || `https://images.unsplash.com/photo-${["1512621776951-a57141f2eefd","1525351484163-7529414344d8","1547592180-85f173990554"][index%3]}?auto=format&fit=crop&w=900&q=85`} alt={recipe.title}/><span className="recipe-number">0{index+1}</span><button className="heart-button" aria-label="Favoritar receita"><Heart size={17}/></button></div><div className="recipe-content"><div className="recipe-meta"><span><Clock3 size={14}/> {recipe.timeMinutes} min</span><span><Flame size={14}/> {recipe.difficulty}</span></div><h3>{recipe.title}</h3><p>{recipe.description}</p><div className="recipe-footer"><span>{recipe.ingredients.length} ingredientes</span><button onClick={() => {setSelected(recipe); document.getElementById("recipe-detail")?.scrollIntoView({behavior:"smooth"});}}>Ver receita <ArrowRight size={15}/></button></div></div></article>)}</div>}
        </section>}

        {selected && <section className="detail-section" id="recipe-detail"><button className="back-button" onClick={() => setSelected(null)}><ArrowLeft size={16}/> Voltar às opções</button><div className="detail-card"><div className="detail-photo"><img src={selected.image || `https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85`} alt={selected.title}/></div><div className="detail-body"><span className="step-label">SUA PRÓXIMA AVENTURA CULINÁRIA</span><h2>{selected.title}</h2><p>{selected.description}</p><div className="detail-stats"><span><Clock3/> {selected.timeMinutes} minutos</span><span><Users/> {selected.servings} porções</span><span><Flame/> {selected.difficulty}</span></div><div className="detail-columns"><div><h3><Utensils size={18}/> Ingredientes</h3><ul className="ingredient-detail">{selected.ingredients.map((item) => <li key={item.name}><span>{item.name}{!item.available && <small> · extra</small>}</span><strong>{item.quantity}</strong></li>)}</ul></div><div><h3><ChefHat size={18}/> Modo de preparo</h3><ol className="steps-list">{selected.steps.map((step,index) => <li key={index}><span>{index+1}</span>{step}</li>)}</ol></div></div>{selected.tips && <p className="tip-box">Dica do chef: {selected.tips}</p>}</div></div></section>}
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-mark"><ChefHat size={19}/></span><span>receita<span className="brand-light">em casa</span></span></a><span>Feito com carinho e uma pitada de inteligência artificial.</span><span>© 2026 Receita em Casa</span></footer>
    </div>
  );
}