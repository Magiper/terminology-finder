// =====================
// CONFIG
// ===================== 
const SUPABASE_URL = "https://ktaubwudmmbdbuwfdvem.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YXVid3VkbW1iZGJ1d2ZkdmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzAyNDMsImV4cCI6MjA5MDY0NjI0M30.9NiNYBp7aVWrT_cZ7j3qwjN9DMUuku2gLYEXqlsjAtQ";

// =====================
// STATE
// =====================
let database = [];
let lawDatabase = [];
let uuDatabase = [];
let caseDatabase = [];
let searchHistory = JSON.parse(localStorage.getItem("history")) || [];

// =====================
// LOAD DATA
// =====================
async function loadTerms(){
    let res = await fetch(`${SUPABASE_URL}/rest/v1/term-db`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if(!res.ok){
        console.error("Error loading terms");
        return;
    }

    database = await res.json();
    showHistory();
}

async function loadLaws(){
    let res = await fetch(`${SUPABASE_URL}/rest/v1/law-db`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if(!res.ok){
        console.error("Error loading laws:", await res.text());
        return;
    }

    lawDatabase = await res.json();
}

async function loadUU(){
    let res = await fetch(`${SUPABASE_URL}/rest/v1/uu_internasional`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if(!res.ok){
        console.error("Error loading UU");
        return;
    }

    uuDatabase = await res.json();
}

async function loadCases(){
    let res = await fetch(`${SUPABASE_URL}/rest/v1/case_db`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if(!res.ok){
        console.error("Error loading cases");
        return;
    }

    uuDatabase = await res.json();
}

loadTerms();
loadLaws();
loadUU();
loadCases();

// ====================
// SEARCH (TERMS)
// ====================
document.getElementById("search").addEventListener("input", function(){
    let query = this.value.trim().toLowerCase();
    document.getElementById("suggestions").style.display = "block";
    
    if(query === ""){
        showHistory();
        clearSuggestions("suggestions");
        return;
    }
    
    let results = filterTerms(query);

    updateHistory(results);
    renderSuggestions(results, "suggestions", "selectSuggestion");
});

document.getElementById("search").addEventListener("keydown", function(e){
    if(e.key === "Enter"){
        let query = this.value.trim().toLowerCase();

        let results = filterTerms(query);

        clearSuggestions("suggestions");
        renderResults(results, query);
    }
});

// ====================
// SEARCH (LAWS)
// ====================
document.getElementById("lawSearch").addEventListener("input", function(){
    document.getElementById("lawSuggestions").style.display = "block";
    let query = this.value.trim().toLowerCase();

    if(query.length < 3){
        clearResults("lawResults");
        clearSuggestions("lawSuggestions")
        return;
    }

    let results = filterUU(query);

    renderUU(results);
    renderSuggestions(results, "lawSuggestions", "selectLaw", "law");
});

// ====================
// SEARCH (CASES)
// ====================
document.getElementById("caseSearch").addEventListener("input", function(){
    let query = this.value.trim().toLowerCase();

    if(query === ""){
        document.getElementById("historyResults").innerHTML = "";
        return;
    }

    let results = filterCases(query);

    renderCases(results);
});

// ====================
// FILTER LOGIC
// ====================
function filterTerms(query){
    query = query.toLowerCase();
    
    return database.filter(item => {
        
        let idMatch = item.term_id?.toLowerCase().includes(query);

        let indoMatch = item.indonesian.toLowerCase().includes(query);

        let primaryMatch = item.translations?.primary?.term
            ?.toLowerCase().includes(query);

        let altMatch = item.translations?.alternatives?.some(a =>
            a.term.toLowerCase().includes(query)
        );

        return idMatch || indoMatch || primaryMatch || altMatch;
    });
}

function filterLaws(query){
    return lawDatabase.filter(item =>
        item.keywords &&
        item.keywords.some(k =>
            k.toLowerCase().includes(query)
        )
    );
}

function filterUU(query){
    return uuDatabase.filter(item =>
        item.kata_kunci.toLowerCase().includes(query)
    );
}

function filterCases(query){
    return caseDatabase.filter(item =>
        item.judul.toLowerCase().includes(query) ||
        item.kategori.toLowerCase().includes(query)
    );
}

// ===================
// HIGHLIGHT
// ===================
function highlight(text, query){
    if(!query) return text;

    let regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, `<span class="highlight">$1</span>`);
}

// ===================
// RENDER RESULTS
// ===================
function renderResults(results, query=""){
    let html = "";

    results.forEach(r =>{
        html += `<div class="result-card">`;

        // TITLE
        html += `<div class="term">${highlight(r.indonesian, query)}</div>`;

        let t = r.translations;

        // PRIMARY
        if(t?.primary){
            html += `
            <div class="section primary">
                <div class="section-title">Primary</div>
                <div class="item">
                    🟢 ${highlight(t.primary.term, query)}
                    <small>(${t.primary.context})</small>
                    <button onclick="speak('${t.primary.term}')" class="speak-btn">🔊</button>
                </div>
            </div>`;
        }

        // ALTERNATIVES
        if(t?.alternatives?.length){
            html += `<div class="section alt"><div class="section-title">Alternatives</div>`;
            t.alternatives.forEach(a=>{
                html += `
                <div class="item">
                    🟡 ${highlight(a.term, query)}
                    <small>(${a.context})</small>
                    <button onclick="speak('${a.term}')" class="speak-btn">🔊</button>
                </div>`;
            });
            html += `</div>`
        }

        // FORBIDDEN
        if(t?.forbidden?.length){
            html += `<div class="section bad"><div class="section-title">Hindari</div>`;
            t.forbidden.forEach(f=>{
                html += `
                <div class="item bad">
                    🔴 ${highlight(f.term, query)}
                    <small>(${f.context})</small>
                </div>`;
            });
            html += `</div>`
        }

        // NOTES
        if(r.notes?.length){
            html += `<div class="notes-block"><b>Notes</b>`;
            r.notes.forEach(n=>{
                html += `<div>• ${n}</div>`;
            });
            html += `</div>`;
        }

        // RELATED TERMS
        if(r.related_terms?.length){
            html += `<div class="related">🔗 `;

            r.related_terms.forEach(term=>{
                html += `
                    <span class="related-item"
                        onclick="searchRelated('${term}')">
                        ${term}
                    </span>
                `;
            });

            html += `</div>`;
        }
    });

    document.getElementById("results").innerHTML = html;
}

function renderLawResults(results){
    let html = "";

    results.forEach(r => {
        html += `<div class="result-card">`;
        html += `<div class="term">${r.law}</div>`;
        html += `<strong>${r.article}</strong>`;
        html += `<p><b>English:</b><br>${r.english}</p>`;
        html += `<p><b>Indonesian:</b><br>${r.indonesian}</p>`;
        html += `</div>`;
    });

    document.getElementById("lawResults").innerHTML = html;
}

function renderUU(results){
    let html = "";

    results.forEach(r => {
        r.uu_internasional.forEach(u => {
            html += `<div class="result-card">`;
            html += `<div class="term">${r.kata_kunci}</div>`;
            html += `<b>${u.nama_konvensi}</b>`;
            
            u.articles.forEach(a=>{
                html += `
                <div class="item">
                    <b>${a.article}</b><br>
                    ${a.isi}<br>
                    <small>${a.terjemahan}</small>
                </div>`;
            });

            html += `
            <div class="notes-block">
                <b>Kesimpulan:</b><br>
                ${u.kesimpulan}<br>
                <small>${u.terjemahan_kesimpulan}</small>
            </div>`;

            html += `
            <div class="notes-block">
                <b>Relevansi:</b><br>
                ${u.relevansi}
            </div>`;

            html += `</div>`;
        });
    });

    document.getElementById("lawResults").innerHTML = html;
}

function renderCases(results){
    let html = "";

    results.forEach(c => {
        html += `<div class="result-card">`;
        html += `<div class="term">${c.judul}</div>`;
        html += `<small>${c.kategori}</small>`;
        html += `<div class="notes-block"><b>UU Digunakan:</b><br>`;

        c.uu_yang_digunakan.forEach(u=>{
            html += `• ${u}<br>`;
        });
        html += `</div>`;

        html += `<div class="notes-block"><b>Kesimpulan:</b><br>${c.kesimpulan}</div>`;
        html += `<div class="notes-block"><b>Hasil:</b><br>${c.hasil}</div>`;
        html += `<div class="notes-block"><b>Alasan Legal:</b><br>${c.alasan_legal}</div>`;

        html += `</div>`;
    });

    document.getElementById("historyResults").innerHTML = html;
}

// ====================
// SUGGESTIONS
// ====================
function renderSuggestions(results, containerId, handler, type="term"){
    let html = "";

    results.slice(0,5).forEach(r=>{
        let value = type === "law" ? r.keywords[0] : r.term_id;

        html += `
        <div class="suggestion-item"
            data-value="${value}"
            onclick="${handler}(this.dataset.value)">
            <b>${r.term_id}</b><br>
            <small>${r.indonesian}</small>
        </div>`;
    });

    document.getElementById(containerId).innerHTML = html;
}

function clearSuggestions(id){
    document.getElementById(id).innerHTML = "";
}

// ==================
// SELECT (CLICK)
// ==================
function selectSuggestion(term){
    let input = document.getElementById("search");
    let query = term.toLowerCase();
    
    input.value = term;

    clearSuggestions("suggestions");
    document.getElementById("suggestions").style.display = "none";

    let results = filterTerms(term);

    updateHistory(results);
    renderResults(results, query);
}

function selectLaw(keyword){
    let input = document.getElementById("lawSearch");
    input.value = keyword;

    clearSuggestions("lawSuggestions");

    document.getElementById("lawSuggestions").style.display = "none";

    let results = filterLaws(keyword)

    renderLawResults(results);
}

// ==================
// HISTORY
// ==================
function updateHistory(results){
    if(results.length === 0) return;

    let term = results[0]?.indonesian;

    if(term && !searchHistory.includes(term)){
        searchHistory.unshift(term);
    }

    searchHistory = searchHistory.slice(0,3);
    localStorage.setItem("history", JSON.stringify(searchHistory));
}

function showHistory(){
    let html = "";
    
    searchHistory.forEach(term => {
        let item = database.find(d => d.term === term);
        
        if(item){
            html += `<div class="result-card">`;
            html += `<div class="term">${item.term}</div>`;

            if(item.translations){
                item.translations.forEach(t=>{
                    html += `<span class="translation">${t}</span>`;
                });
            }
            html += `</div>`;
        }
    });
    document.getElementById("results").innerHTML = html;
}

// =================
// CLEAR INPUT
// =================
function clearInput(id){
    let input = document.getElementById(id);
    input.value = "";

    if(id === "search"){
        showHistory();
        clearSuggestions("suggestions");
    }else{
        clearResults("lawResults");
        clearSuggestions("lawSuggestions");
    }

    input.focus();
}

function clearResults(id){
    document.getElementById(id).innerHTML = "";
}

// =================
// VOICE
// =================
function speak(text){
    let utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = /[a-z]/i.test(text) ? "en-US" : "id-ID";
    
    speechSynthesis.speak(utterance);
}

// =================
// TAB
// =================
function switchTab(event, tab){
    // remove active menu
    document.querySelectorAll(".menu-item").forEach(el=>{
        el.classList.remove("active");
    });

    // activate clicked
    event.target.classList.add("active");

    // hide all tabs
    document.querySelectorAll(".tab").forEach(el=>{
        el.classList.remove("active");
    });

    // show selected tab
    if(tab === "term"){
        document.getElementById("termTab").classList.add("active");
    }

    if(tab === "law"){
        document.getElementById("lawTab").classList.add("active");
    }

    if(tab === "history"){
        document.getElementById("historyTab").classList.add("active");
        showHistory();
    }

    if(tab === "reading"){
        document.getElementById("readingTab").classList.add("active");
    }
}

function searchRelated(term){
    let input = document.getElementById("search");

    input.value = term;

    let query = term.toLowerCase();
    let results = filterTerms(query);

    clearSuggestions("suggestions");
    renderResults(results, query);
}
