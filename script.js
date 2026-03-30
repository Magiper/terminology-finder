let searchHistory = JSON.parse(localStorage.getItem("history")) || [];
let database = [];

fetch("terms.json")
.then(response => response.json())
.then(data => {
    database = data;
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
        return;
    };
    
    let results = database.filter(item =>
        item.term.toLowerCase().includes(query)
    );

    if(results.length > 0){
        let term = results[0].term;
        
        if(!searchHistory.includes(term)){
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
});

document.getElementById("lawSearch").addEventListener("input", function(){
    let query = this.value.toLowerCase();

    if(query.length < 3){
        document.getElementById("lawResults").innerHTML = "";
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

let dotsContainer = document.getElementById("dots");

if(dotsContainer){
    for(let i=0; i<60; i++){
        let span = document.createElement("span");
        dotsContainer.appendChild(span);
    }
};

showHistory();
