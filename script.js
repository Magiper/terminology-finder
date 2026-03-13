let database = [];

fetch("terms.json")
.then(response => response.json())
.then(data => {
    database = data;
});

document.getElementById("search").addEventListener("input", function(){

let query = this.value.toLowerCase();

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
