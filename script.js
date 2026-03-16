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

    let html = "";

    results.forEach(r => {

        html += `<div class="result-card">`;
        html += `<div class="term">${r.term}</div>`;

        r.translations.forEach(t=>{
            html += `<span class="translation">${t}</span>`;
        });

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
