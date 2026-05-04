// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let recipes = JSON.parse(localStorage.getItem('receitava_recipes') || '[]');
let editingId = null;

// Receitas de exemplo para começar
if (recipes.length === 0) {
    recipes = [
        {
            id: Date.now() + 1,
            emoji: '🎂',
            titulo: 'Bolo de Chocolate da Rai',
            ingredientes: '2 xícaras de farinha\n3 ovos\n1 xícara de açúcar\n1/2 xícara de chocolate em pó\n1 xícara de leite\n1/2 xícara de óleo\n1 colher de fermento',
            preparo: 'Misture os ingredientes secos (farinha, açúcar, chocolate e fermento).\nAdicione os ovos, o leite e o óleo.\nBata bem até ficar homogêneo.\nLeve ao forno pré-aquecido a 180°C por 40 minutos.',
            tempo: '50 minutos',
            categoria: 'Bolo',
            data: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: Date.now() + 2,
            emoji: '🍗',
            titulo: 'Frango Assado Temperado',
            ingredientes: '1 frango inteiro\n4 dentes de alho\n2 limões\nSal e pimenta a gosto\nPáprica defumada\nAzeite',
            preparo: 'Tempere o frango com alho amassado, suco de limão, sal, pimenta e páprica.\nDeixe marinar por pelo menos 2 horas.\nRegue com azeite e leve ao forno a 200°C por 1 hora.\nVire na metade do tempo para dourar dos dois lados.',
            tempo: '1 hora e 20 min',
            categoria: 'Prato Principal',
            data: new Date().toLocaleDateString('pt-BR')
        }
    ];
    saveAll();
}

function saveAll() {
    localStorage.setItem('receitava_recipes', JSON.stringify(recipes));
}

// ══════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════
// ── PAGE & MENU ──
function showPage(name, btn, fromMobile) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');

    // Sync both navs
    document.querySelectorAll('nav button, .mobile-menu button').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Mirror active to the counterpart nav
    const pageMap = { home: 'home', receitas: 'receitas', nova: 'nova', busca: 'busca', ia: 'ia', detalhe: 'receitas' };
    const key = pageMap[name] || name;
    const navBtn = document.getElementById('nav-' + key);
    const mobBtn = document.getElementById('mob-' + key);
    if (navBtn) navBtn.classList.add('active');
    if (mobBtn) mobBtn.classList.add('active');

    if (fromMobile) closeMobileMenu();
    if (name === 'receitas') renderRecipes();
    if (name === 'nova' && !editingId) clearForm();
}

function toggleMenu() {
    const hb = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    hb.classList.toggle('open');
    menu.classList.toggle('open');
}

function closeMobileMenu() {
    document.getElementById('hamburger').classList.remove('open');
    document.getElementById('mobile-menu').classList.remove('open');
}

// Close menu clicking outside
document.addEventListener('click', function (e) {
    const hb = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (menu.classList.contains('open') && !menu.contains(e.target) && !hb.contains(e.target)) {
        closeMobileMenu();
    }
});

// ── BUSCA POR INGREDIENTE ──
let tags = [];

function addTag() {
    const input = document.getElementById('ing-input');
    const val = input.value.trim().toLowerCase().replace(/[,;]+/g, '');
    if (!val) return;
    // split by comma/space in case user typed multiple
    const parts = val.split(/[\s,;]+/).filter(Boolean);
    parts.forEach(p => { if (p && !tags.includes(p)) tags.push(p); });
    input.value = '';
    renderTags();
}

document.addEventListener('DOMContentLoaded', () => {
    const ingInput = document.getElementById('ing-input');
    if (ingInput) {
        ingInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
    }
});

function removeTag(t) {
    tags = tags.filter(x => x !== t);
    renderTags();
}

function clearTags() {
    tags = [];
    renderTags();
    document.getElementById('busca-resultado').innerHTML = '';
}

function renderTags() {
    const c = document.getElementById('tags-container');
    c.innerHTML = tags.map(t => `
    <span class="ing-tag">
    ${t}
    <button onclick="removeTag('${t}')" title="Remover">✕</button>
    </span>
  `).join('');
}

function searchByIngredients() {
    const el = document.getElementById('busca-resultado');

    if (tags.length === 0) {
        el.innerHTML = '<p style="color:var(--text-light);font-style:italic;">Adicione pelo menos um ingrediente para buscar!</p>';
        return;
    }

    // Score each recipe by how many tags match
    const results = recipes.map(r => {
        const ing = r.ingredientes.toLowerCase();
        const matched = tags.filter(t => ing.includes(t));
        const missing = tags.filter(t => !ing.includes(t));
        return { r, matched, missing, score: matched.length };
    }).filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length);

    if (results.length === 0) {
        el.innerHTML = `
    <div style="text-align:center;padding:2.5rem;color:var(--text-light);">
        <div style="font-size:3rem;margin-bottom:0.8rem;">🫙</div>
        <p style="font-size:1.05rem;">Nenhuma das suas receitas tem esses ingredientes.<br>Que tal cadastrar uma nova?</p>
        <button class="btn btn-primary" style="margin-top:1rem;" onclick="showPage('nova', document.getElementById('nav-nova'))">✏️ Criar receita</button>
    </div>`;
        return;
    }

    el.innerHTML = `
    <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--brown);margin-bottom:1rem;">
      ${results.length} receita${results.length > 1 ? 's' : ''} encontrada${results.length > 1 ? 's' : ''} ✨
    </div>
    ${results.map(({ r, matched, missing }) => {
        const isFull = missing.length === 0;
        const pct = Math.round((matched.length / tags.length) * 100);
        return `
        <div class="match-card" onclick="showDetail(${r.id})">
          <div style="font-size:2rem;flex-shrink:0">${r.emoji || '🍽️'}</div>
          <div style="flex:1">
            <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--brown);font-weight:700;margin-bottom:0.3rem;">${r.titulo}</div>
            <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
              <span class="match-score ${isFull ? 'full' : ''}">${isFull ? '✅ Completo' : pct + '% dos ingredientes'}</span>
              ${r.categoria ? '<span class="card-tag">' + r.categoria + '</span>' : ''}
            </div>
            ${missing.length > 0 ? `<div class="match-missing">Faltando: ${missing.join(', ')}</div>` : '<div class="match-missing" style="color:var(--green);">Você tem tudo! 🎉</div>'}
          </div>
        </div>`;
    }).join('')}`;
}

// ══════════════════════════════════════
//  RECIPES
// ══════════════════════════════════════
const emojis = ['🍰', '🍲', '🥘', '🍗', '🎂', '🥗', '🍜', '🍪', '🥧', '🍮', '🫕', '🍳'];

function renderRecipes() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase();
    const grid = document.getElementById('recipe-grid');
    const filtered = recipes.filter(r =>
        r.titulo.toLowerCase().includes(q) ||
        (r.categoria || '').toLowerCase().includes(q) ||
        r.ingredientes.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="big-icon">🫙</div>
      <p>${q ? 'Nenhuma receita encontrada para "' + q + '"' : 'Você ainda não tem receitas salvas!'}</p>
      <button class="btn btn-primary" onclick="showPage('nova', document.querySelector('nav button:nth-child(3)'))">✏️ Criar minha primeira receita</button>
    </div>`;
        return;
    }

    grid.innerHTML = filtered.map(r => `
    <div class="recipe-card" onclick="showDetail(${r.id})">
      <div class="card-emoji">${r.emoji || '🍽️'}</div>
      <div class="card-title">${r.titulo}</div>
      <div class="card-meta">
        ${r.tempo ? '<span>⏱️ ' + r.tempo + '</span>' : ''}
        ${r.categoria ? '<span class="card-tag">' + r.categoria + '</span>' : ''}
      </div>
    </div>
  `).join('');
}

function showDetail(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;

    const ingredients = r.ingredientes.split('\n').filter(Boolean);

    document.getElementById('detalhe-content').innerHTML = `
    <div class="detail-header">
      <div>
        <div style="font-size:2.8rem; margin-bottom:0.3rem">${r.emoji || '🍽️'}</div>
        <div class="detail-title">${r.titulo}</div>
        <div style="color:var(--text-light); font-size:0.9rem; margin-top:0.3rem">
          ${r.tempo ? '⏱️ ' + r.tempo : ''}
          ${r.categoria ? ' · 🏷️ ' + r.categoria : ''}
          ${r.data ? ' · 📅 ' + r.data : ''}
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-outline btn-sm" onclick="editRecipe(${r.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecipe(${r.id})">🗑️ Apagar</button>
      </div>
    </div>

    <div class="section-label">🥕 Ingredientes</div>
    <ul class="ingredients-list">
      ${ingredients.map(i => '<li>' + i + '</li>').join('')}
    </ul>

    <div class="section-label">🍳 Modo de Preparo</div>
    <div class="preparo-text">${r.preparo}</div>

    
  `;

    showPage('detalhe');
}

function editRecipe(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    editingId = id;
    document.getElementById('form-title').textContent = '✏️ Editar Receita';
    document.getElementById('f-titulo').value = r.titulo;
    document.getElementById('f-ingredientes').value = r.ingredientes;
    document.getElementById('f-preparo').value = r.preparo;
    document.getElementById('f-tempo').value = r.tempo || '';
    document.getElementById('f-categoria').value = r.categoria || '';
    showPage('nova', document.querySelector('nav button:nth-child(3)'));
}

let pendingDeleteId = null;

function deleteRecipe(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    pendingDeleteId = id;
    document.getElementById('modal-recipe-name').textContent = r.titulo;
    document.getElementById('modal-confirm-btn').onclick = confirmDelete;
    document.getElementById('modal-apagar').classList.add('open');
}

function confirmDelete() {
    if (!pendingDeleteId) return;
    recipes = recipes.filter(r => r.id !== pendingDeleteId);
    saveAll();
    pendingDeleteId = null;
    closeModal();
    showToast('✅ Receita apagada!');
    showPage('receitas', document.querySelector('nav button:nth-child(2)'));
}

function closeModal() {
    document.getElementById('modal-apagar').classList.remove('open');
    pendingDeleteId = null;
}

// Fechar modal clicando fora
document.getElementById('modal-apagar').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

function saveRecipe() {
    const titulo = document.getElementById('f-titulo').value.trim();
    const ingredientes = document.getElementById('f-ingredientes').value.trim();
    const preparo = document.getElementById('f-preparo').value.trim();
    const tempo = document.getElementById('f-tempo').value.trim();
    const categoria = document.getElementById('f-categoria').value.trim();

    if (!titulo) { alert('Por favor, coloque um nome para a receita!'); return; }
    if (!ingredientes) { alert('Por favor, adicione pelo menos um ingrediente!'); return; }
    if (!preparo) { alert('Por favor, descreva o modo de preparo!'); return; }

    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    if (editingId) {
        const idx = recipes.findIndex(r => r.id === editingId);
        if (idx !== -1) {
            recipes[idx] = { ...recipes[idx], titulo, ingredientes, preparo, tempo, categoria };
        }
        editingId = null;
    } else {
        recipes.push({
            id: Date.now(),
            emoji,
            titulo,
            ingredientes,
            preparo,
            tempo,
            categoria,
            data: new Date().toLocaleDateString('pt-BR')
        });
    }

    saveAll();
    showToast('✅ Receita salva com carinho!');
    clearForm();
    showPage('receitas', document.querySelector('nav button:nth-child(2)'));
}

function clearForm() {
    editingId = null;
    document.getElementById('form-title').textContent = '✏️ Nova Receita';
    ['f-titulo', 'f-ingredientes', 'f-preparo', 'f-tempo', 'f-categoria'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// ══════════════════════════════════════
//  AI — Hugging Face (sem autenticação)
// ══════════════════════════════════════
const HF_MODEL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';

async function callHF(prompt, elId) {
    const el = document.getElementById(elId);
    el.innerHTML = `<div class="ai-loading"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span style="margin-left:8px">Pensando em ideias gostosas…</span></div>`;

    // Formato de instrução do Mistral
    const input = `<s>[INST] ${prompt} [/INST]`;

    try {
        const response = await fetch(HF_MODEL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputs: input,
                parameters: {
                    max_new_tokens: 400,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            // Modelo pode estar carregando (cold start no HF)
            if (response.status === 503) {
                el.textContent = '⏳ O modelo está inicializando (pode levar ~20s na primeira vez). Tente novamente em instantes!';
                return;
            }
            throw new Error('Erro ' + response.status);
        }

        const data = await response.json();

        // HF retorna array ou objeto dependendo do modelo
        let text = '';
        if (Array.isArray(data) && data[0]?.generated_text) {
            text = data[0].generated_text.trim();
        } else if (data?.generated_text) {
            text = data.generated_text.trim();
        } else {
            text = 'Não consegui gerar sugestões agora. Tente novamente!';
        }

        el.textContent = text || 'Não consegui gerar sugestões agora. Tente novamente!';

    } catch (e) {
        el.textContent = '😔 Não consegui conectar com a IA agora. Verifique sua conexão e tente de novo em alguns instantes!';
    }
}

async function getSuggestion(id) {
    const r = recipes.find(x => x.id === id);
    if (!r) return;

    const prompt = `Você é uma assistente culinária que fala português brasileiro. Dada a receita "${r.titulo}" com os ingredientes: ${r.ingredientes.split('\n').join(', ')}, sugira 2 variações criativas e saborosas dessa receita. Seja simpática e use linguagem simples.`;

    await callHF(prompt, 'ai-sugestao');
}

async function askAI() {
    const prompt = document.getElementById('ia-prompt').value.trim();
    if (!prompt) { alert('Escreva o que você quer perguntar antes!'); return; }

    const fullPrompt = `Você é uma assistente culinária que fala português brasileiro, especializada em receitas caseiras simples e gostosas. Responda de forma acolhedora e acessível. Pergunta: ${prompt}`;

    await callHF(fullPrompt, 'ia-response');
}

function setPrompt(text) {
    document.getElementById('ia-prompt').value = text;
    document.getElementById('ia-prompt').focus();
}

// ══════════════════════════════════════
//  UTILS
// ══════════════════════════════════════
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}