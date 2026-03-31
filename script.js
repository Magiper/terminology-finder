let searchHistory = JSON.parse(localStorage.getItem("history")) || [];
let database = [];

fetch("terms.json")
.then(response => response.json())
.then(data => {
    database = data;
    showHistory();
});

let lawDatabase = [];

fetch("laws.json")
.then(response => response.json())
.then(data => {
lawDatabase = data;
});

document.getElementById("search").addEventListener("input", function(){
    let query = this.value.toLowerCase();
    
    if(query.length === 0){
        showHistory();
        document.getElementById("suggestions").innerHTML = "";
        return;
    };
    
    let results = database.filter(item => {
        let termMatch = item.term.toLowerCase().includes(query);

        let translationMatch = item.translations && item.translations.some(t =>
            t.toLowerCase().includes(query)
        );

        return termMatch || translationMatch;
    });

    if(results.length > 0){
        let term = results[0]?.term;
        
        if(term && !searchHistory.includes(term)){
            searchHistory.unshift(term);
        }
        searchHistory = searchHistory.slice(0,3);
        localStorage.setItem("history", JSON.stringify(searchHistory));
    };

    let html = "";

    results.forEach(r => {

        html += `<div class="result-card">`;
        html += `<div class="term">${r.term}</div>`;

        if(r.translations){
            r.translations.forEach(t=>{
                html += `<span class="translation">${t}</span>`;
            });
        }

        if(r.notes){
            html += `<div class="notes">${r.notes}</div>`;
        }

        html += "</div>";
    });
    document.getElementById("results").innerHTML = html;

    let suggestionHTML = "";
    results.slice(0,5).forEach(r=>{
        suggestionHTML += `<div class="suggestion-item" onclick="selectSuggestion(\`${r.term}\`)">${r.term}</div>`;
    });

    document.getElementById("suggestions").innerHTML = suggestionHTML;
});

document.getElementById("lawSearch").addEventListener("input", function(){
    let query = this.value.toLowerCase();

    if(query.length < 3){
        document.getElementById("lawResults").innerHTML = "";
        document.getElementById("lawSuggestions").innerHTML = "";
        return;
    }

    let results = lawDatabase.filter(item =>
        item.keywords.some(k => k.includes(query))
    );

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

    let suggestionHTML = "";

    results.slice(0,5).forEach(r=>{
        suggestionHTML += `<div class="suggestion-item" onclick="selectLaw(\`${r.keywords[0]}\`)">${r.law}</div>`
    });
    
    document.getElementById("lawSuggestions").innerHTML = suggestionHTML;
});

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
};

function clearInput(id){
    let input = document.getElementById(id);
    input.value = "";

    if(id === "search"){
        document.getElementById("results").innerHTML = "";
        document.getElementById("suggestions").innerHTML = "";
    } else {
        document.getElementById("lawResults").innerHTML = "";
        document.getElementById("lawSuggestions").innerHTML = "";
    }

    input.focus();
};

function selectSuggestion(term){
    let input = document.getElementById("search");
    input.value = term;
    document.getElementById("suggestions").innerHTML = "";

    renderResults(term);
};

function renderResults(query){
    let results = database.filter(item => {
        let termMatch = item.term.toLowerCase().includes(query.toLowerCase());

        let translationMatch = item.translations && item.translations.some(t =>
            t.toLowerCase().includes(query.toLowerCase())
        );

        return termMatch || translationMatch;
    });

    let html = "";

    results.forEach(r =>{
        html += `<div class="result-card">`;
        html += `<div class="term">${r.term}</div>`;

        if(r.translations){
            r.translations.forEach(t=>{
                html += `<span class="translation">${t}</span>`;
            });
        }

        if(r.notes){
            html += `<div class="notes">${r.notes}</div>`;
        }

        html += `</div>`;
    });

    document.getElementById("results").innerHTML = html;
}

function selectLaw(keyword){
    let input = document.getElementById("lawSearch");
    input.value = keyword;
    document.getElementById("lawSuggestions").innerHTML = "";

    input.dispatchEvent(new Event("input"));
};

let dotsContainer = document.getElementById("dots");

if(dotsContainer){
    for(let i=0; i<60; i++){
        let span = document.createElement("span");
        dotsContainer.appendChild(span);
    }
};
