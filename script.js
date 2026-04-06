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

loadTerms();
loadLaws();

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
        renderResults(results);
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

    let results = filterLaws(query);
    
    renderSuggestions(results, "lawSuggestions", "selectLaw", "law");
});

// ====================
// FILTER LOGIC
// ====================
function filterTerms(query){
    query = query.toLowerCase();
    
    return database.filter(item => {
        let termMatch = item.term.toLowerCase().includes(query);

        let translationMatch = item.translations &&
            item.translations.some(t =>
                t.toLowerCase().includes(query)
            );

        return termMatch || translationMatch;
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

// ===================
// RENDER RESULTS
// ===================
function renderResults(results){
    let html = "";

    results.forEach(r =>{
        html += `<div class="result-card">`;

        // TERM
        html += `<div class="term">${r.term_id || r.term}</div>`;
        html += `<div><b>Indonesian:</b> ${r.indonesian || "-"}</div>`;

        // PRIMARY
        if(r.translations?.primary){
            html += `<div class="section-title">Primary</div>`;
            html += `
                <span class="translation">
                    ${r.translations.primary.term}
                    <button onclick="speak('${r.translations.primary.term}')" class="speak-btn">🔊</button>
                </span>
                <div class="context">${r.translations.primary.context}</div>
            `;
        }

        // ALTERNATIVES
        if(r.translations?.alternatives?.length){
            html += `<div class="section-title">Alternatives</div>`;
            r.translations.alternatives.forEach(t=>{
                html += `
                    <span class="translation alt">
                        ${t.term}
                        <button onclick="speak('${t.term}')" class="speak-btn">🔊</button>
                    </span>
                    <div class="context">${t.context}</div>
                `;
            });
        }

        // FORBIDDEN
        if(r.translations?.forbidden?.length){
            html += `<div class="section-title avoid">Avoid</div>`;
            r.translations.forbidden.forEach(t=>{
                html += `
                    <span class="translation bad">${t.term}</span>
                    <div class="context">${t.context}</div>
                `;
            });
        }

        // NOTES
        if(r.notes?.length){
            html += `<div class="notes">`;
            r.notes.forEach(n=>{
                html += `• ${n}<br`;
            });
            html += `</div>`;
        }

        // RELATED TERMS
        if(r.related_terms?.length){
            html += `<div class="related">`;
            r.related_terms.forEach(rt=>{
                html += `<span class="tag">${rt}</span>`;
            });
            html += `</div>`;
        }
        
        html += `</div>`;
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

// ====================
// SUGGESTIONS
// ====================
function renderSuggestions(results, containerId, handler, type="term"){
    let html = "";

    results.slice(0,5).forEach(r=>{
        let value = type === "law" ? r.keywords[0] : r.term;

        html += `
        <div class="suggestion-item"
            data-value="${value}"
            onclick="${handler}(this.dataset.value)">
            ${type === "law" ? r.law : r.term}
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
    renderResults(results);
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

    let term = results[0]?.term;

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
}
