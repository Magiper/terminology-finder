// =====================
// CONFIG
// ===================== 
const SUPABASE_URL = "https://ktaubwudmmbdbuwfdvem.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YXVid3VkbW1iZGJ1d2ZkdmVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzAyNDMsImV4cCI6MjA5MDY0NjI0M30.9NiNYBp7aVWrT_cZ7j3qwjN9DMUuku2gLYEXqlsjAtQ";

// =====================
// STATE
// =====================
let database = [];
let uuDatabase = [];
let caseDatabase = [];
let readingDatabase = [];

let currentPage = 1;
const itemsPerPage = 5;

let searchHistory = JSON.parse(localStorage.getItem("history")) || [];

function toArray(value){
    if(Array.isArray(value)) return value;
    if(value === undefined || value === null || value === "") return [];
    return [value];
}

function parseMaybeJSON(value){
    if(typeof value !== "string") return value;
    try{
        return JSON.parse(value);
    }
    catch{
        return value;
    }
}

function normalizeTermItem(item = {}){
    const parsedTranslations = parseMaybeJSON(item.translations);
    const termLabel = item.indonesian || item.Indonesian || item.term || "";

    let primary = null;
    let alternatives = [];

    if(Array.isArray(parsedTranslations)){
        primary = parsedTranslations[0]
            ? { term: String(parsedTranslations[0]), context: "general use" }
            : null;
        alternatives = parsedTranslations.slice(1).map(t => ({
            term: String(t),
            context: "alternative"
        }));
    } else if(parsedTranslations && typeof parsedTranslations === "object"){
        const parsedPrimary = parseMaybeJSON(parsedTranslations.primary);
        primary = parsedPrimary && typeof parsedPrimary === "object"
            ? {
                term: parsedPrimary.term || "",
                context: parsedPrimary.context || "general use"
            }
            : null;

        alternatives = toArray(parseMaybeJSON(parsedTranslations.alternatives))
            .map(a => {
                if(typeof a === "string"){
                    return { term: a, context: "alternative" };
                }
                if(a && typeof a === "object"){
                    return {
                        term: a.term || "",
                        context: a.context || "alternative"
                    };
                }
                return null;
            })
            .filter(Boolean);
    }

    const notes = toArray(parseMaybeJSON(item.notes)).map(String);
    const relatedTerms = toArray(parseMaybeJSON(item.related_terms)).map(String);

    return {
        ...item,
        indonesian: termLabel,
        translations: {
            primary,
            alternatives
        },
        notes,
        related_terms: relatedTerms
    };
}

function normalizeTermDatabase(rows){
    return toArray(rows).map(normalizeTermItem).filter(item => item.indonesian);
}

// =====================
// LOAD DATA
// =====================
async function fetchTable(table){
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "GET",
        headers: {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if(!res.ok){
        console.error(`Failed loading ${table}`);
        return;
    }

    return await res.json();
}

async function initialize(){
    database = normalizeTermDatabase(await fetchTable("term_db"));
    uuDatabase = await fetchTable( "uu_internasional" );
    caseDatabase = await fetchTable( "case_db" );
    readingDatabase = await fetchTable( "reading_db" );
    showHistory();
}

initialize();

// ====================
// HELPERS
// ====================
function qs(id){
    return document.getElementById(id);
}

function clearResults(id){
    qs(id).innerHTML = "";
}

function clearAllResults(){
    clearResults("results");
    clearResults("lawResults");
    clearResults("caseResults");
    clearResults("readingResults");
}

function escapeHTML(str=""){
    return str
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
}

function highlight(text="", query=""){
    if(!query) return text;
    const regex = new RegExp(
        `(${query})`,
        "gi"
    );

    return text.replace(
        regex,
        `<span class="highlight">$1</span>`
    );
}

// ====================
// SEARCH FILTERS
// ====================
function filterTerms(query){
    query = query.toLowerCase();
    
    return database.filter(item => {

        const indo = item.indonesian?.toLowerCase().includes(query);
        const primary = item.translations?.primary?.term?.toLowerCase().includes(query);
        const alternatives = item.translations?.alternatives || [];

        const alt = alternatives.some(a =>
            a.term?.toLowerCase().includes(query)
        );

        return indo || primary || alt;
    });
}

function filterUU(query){
    query = query.toLowerCase();

    return uuDatabase.filter(item => item.kata_kunci?.toLowerCase().includes(query));
}

function filterCases(query){
    query = query.toLowerCase();

    return caseDatabase.filter(item => {
        const titleMatch = item.judul?.toLowerCase().includes(query);

        const kategoriMatch = Array.isArray(item.kategori) && item.kategori.some(k =>
            k.toLowerCase().includes(query)
        );

        return titleMatch || kategoriMatch;
    });
}

// ==================
// HISTORY
// ==================
function updateHistory(term){
    if(!term) return;

    searchHistory = searchHistory.filter(t => t !== term);
    searchHistory.unshift(term);
    searchHistory = searchHistory.slice(0,5);
    localStorage.setItem("history", JSON.stringify(searchHistory));
}

function showHistory(){
    if(typeof currentFeature !== "undefined" && currentFeature !== "term") return;

    let html = "";
    
    searchHistory.forEach(term => {
        html += `<div class="history-item" onclick="searchRelated(${JSON.stringify(term)})">🕘 ${term}</div>`;
    });

    qs("results").innerHTML = html;
}

// ===================
// TERMINOLOGY RESULTS
// ===================
function renderResults(results, query=""){

    if(results.length === 0){
        qs("results").innerHTML = `
        <div class="empty-state">

            Tidak ada terminologi ditemukan.

        </div>
        `;
    
        return;
    }

    let html = "";

    results.forEach(r =>{
        const primary = r.translations?.primary;
        const alternatives = r.translations?.alternatives || [];

        html += `
        <div class="result-panel">
            <div class="result-title">
                ${highlight(r.indonesian, query)}
            </div>

            <div class="result-grid">
                <div class="result-section">
                    <div class="section-heading">
                        Primary
                    </div>
        `;

        // PRIMARY
        if(primary){
            html += `
            <div class="term-item">

                <div>
                    <span class="dot green"></span>
                    ${highlight(
                        primary.term,
                        query
                    )}
                    <small>
                        (${primary.context})
                    </small>
                </div>

                <button class="speak-btn" onclick="speak('${primary.term}')">🔊</button>

            </div>
            `;
        }

        html += `
                </div>

                <div class="result-section">

                    <div class="section-heading">
                        Alternatives
                    </div>
        `;

        alternatives.forEach(a => {

            html += `
            <div class="term-item">

                <div>
                    <span class="dot yellow"></span>
                    ${highlight(
                        a.term,
                        query
                    )}
                    <small>
                        (${a.context})
                    </small>
                </div>

                <button class="speak-btn" onclick="speak('${a.term}')">🔊</button>

            </div>
            `;
        });

        html += `
                </div>

            </div>
        `;

        // NOTES
        if(r.notes?.length){
            html += `
            <div class="notes-box">
                <div class="section-heading">
                    Notes
                </div>
            `;

            r.notes.forEach(note => {
                html += `
                <div class="note-item">
                    • ${note}
                </div>
                `;
            });

            html += `</div>`;
        }

        // RELATED TERMS
        if(r.related_terms?.length){
            html += `
            <div class="related-box">
                <div class="section-heading">
                    Related Terms
                </div>

                <div class="related-list">
            `;

            r.related_terms.forEach(term => {
                html += `
                <div class="related-chip" onclick="searchRelated('${term}')">
                    ${term}
                </div>
                `;
            });

            html += `
                </div>

            </div>
            `;
        }

        html += `
        </div>
        `;
    });

    qs("results").innerHTML = html;
}

function renderUU(results){
    let html = "";

    results.forEach(r => {

        r.uu_internasional.forEach(u => {

            html += `

            <div class="result-panel">

                <div class="result-title">${u.nama_konvensi}</div>
                
                <div class="reading-layout">

                    <!-- LEFT -->
                    <div class="reading-side">

                        <div class="reading-side-title">
                            📜 Articles
                        </div>
            `;

            u.articles.forEach(article => {

                html += `

                <div class="article-card">

                    <div class="article-heading">
                        ${article.article}
                    </div>

                    <div class="article-content">
                        ${article.isi}
                    </div>

                </div>
                `;
            });

            html += `
                    </div>

                    <!-- RIGHT -->
                    <div class="reading-side">
                        <div class="reading-side-title">🌎 Translation</div>
                    </div>

            `;

            u.articles.forEach(article => {

                html += `
                
                    <div class="translation-box">
                        ${article.terjemahan}
                    </div>
                `;
            });

            html += `
                        <div class="relevansi-box">
                            <strong>Relevansi:</strong>
                            
                            <br><br>
                            
                            ${u.relevansi}
                        </div>
                    </div>
                </div>
            </div>
            `;
        });
    });

    qs("lawResults").innerHTML = html;
}

function renderCases(results){
    let html = "";

    results.forEach(c => {
        html += `
        <div class="result-panel">

            <div class="result-title">${c.judul}</div>

            <div class="reading-layout">

                <!-- LEFT -->
                <div class="reading-side">

                    <div class="reading-side-title">📂 Kategori</div>

                    <div class="reading-content">
                        ${
                            Array.isArray(c.kategori) ? c.kategori.join("<br>") : c.kategori
                        }
                    </div>

                    <br><br>

                    <div class="reading-side-title">
                        📜 Kesimpulan
                    </div>

                    <div class="reading-content">
                        ${c.kesimpulan}
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="reading-side">
                    <div class="reading-side-title">
                        ⚖️ Hasil
                    </div>

                    <div class="reading-content">
                        ${c.hasil}
                    </div>

                    <br><br>

                    <div class="reading-side-title">
                        🏛️ Alasan Legal
                    </div>

                    <div class="reading-content">
                        ${c.alasan_legal}
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    qs("caseResults").innerHTML = html;
}

function renderReading(){
    let html = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const paginated = readingDatabase.slice(start, end);

    paginated.forEach(r => {
        html += `
        <div class="result-panel">

            <div class="result-title">${r.judul}</div>

            <div class="reading-layout">

                <!-- LEFT -->
                <div class="reading-side">

                    <div class="reading-side-title">📂 English Source</div>

                    <div class="reading-category">
                        <strong>Kategori:</strong>
                        <br><br>
                        ${r.kategori}
                    </div>

                    <a href="${r.link}" target="_blank" class="reading-link">📂 Open English File</a>

                </div>

                <!-- RIGHT -->
                <div class="reading-side">
                    <div class="reading-side-title">Ringkasan Indonesia</div>
                    <div class="reading-content">${r.kesimpulan}</div>
                </div>

            </div>

        </div>
        `;
    });

    html += renderPagination();

    qs("readingResults").innerHTML = html;
}

function renderPagination(){
    const totalPages = Math.ceil(readingDatabase.length / itemsPerPage);

    return `
    <div class="pagination">
    
        ${currentPage > 1 ? `<button onclick="prevPage()">⬅ Prev</button>` : ""}
        <span>Page ${currentPage} / ${totalPages}</span>
        ${currentPage < totalPages ? `<button onclick="nextPage()">Next ➡</button>` : ""}

    </div>
    `;
}

// ====================
// CONTROLS
// ====================
function nextPage(){
    const totalPages = Math.ceil(readingDatabase.length / itemsPerPage);

    if(currentPage < totalPages){
        currentPage++;
    }
    renderReading();
}

function prevPage(){
    if(currentPage > 1){
        currentPage--;
    }
    renderReading();
}

// =================
// SEARCH RELATED
// =================
function searchRelated(term){
    const input = qs("search");

    input.value = term;

    const query = term.toLowerCase();
    const results = filterTerms(query);

    renderResults(results, query);
}

// =================
// VOICE
// =================
function speak(text){
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = /[a-z]/i.test(text) ? "en-US" : "id-ID";
    speechSynthesis.speak(utterance);
}

// ====================
// SUGGESTIONS
// ====================
function renderSuggestions(results, containerId, handler, type="term"){
    let html = "";

    results.slice(0,5).forEach(r=>{
        let value = "";
        let title = "";
        let subtitle = "";

        if(type === "term"){
            value = r.indonesian || "";
            title = r.indonesian || "";
            subtitle = r.translations?.primary?.term || "";
        }

        else if(type === "law"){
            value = r.kata_kunci || "";
            title = r.kata_kunci || "";
            subtitle = "UU Internasional";
        }
        else if(type === "case"){
            value = r.judul || "";
            title = r.judul || "";
            subtitle = Array.isArray(r.kategori) ? r.kategori.join(", ") : r.kategori || "";
        }

        html += `
        <div class="suggestion-item"
            onclick="${handler}('${escapeHTML(value)}')">
            <div class="suggestion-title">${title}</div>
            <div class="suggestion-subtitle">${subtitle}</div>
        </div>`;
    });

    qs(containerId).innerHTML = html;
}

function clearSuggestions(id){
    qs(id).innerHTML = "";
}

// ==================
// SELECT SUGGESTION
// ==================
function selectSuggestion(term){
    const input = qs("search");
    input.value = term;

    clearSuggestions("globalSuggestions");

    const query = term.toLowerCase();
    const results = filterTerms(query);

    renderResults(results, query);
}

function selectLaw(keyword){
    const input = qs("search");
    input.value = keyword;

    clearSuggestions("globalSuggestions");

    const results = filterUU(keyword);
    renderUU(results);
}

function selectCase(title){
    const input = qs("search");
    input.value = title;

    clearSuggestions("globalSuggestions");

    const results = filterCases(title);
    renderCases(results);
}

// =================
// CLEAR INPUT
// =================
function clearInput(id){
    let input = qs(id);
    input.value = "";

    clearSuggestions("globalSuggestions");

    clearAllResults();

    if(currentFeature === "term"){
        showHistory();
    }

    input.focus();
}
