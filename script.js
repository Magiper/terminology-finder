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

html += `<div class="result">`;

html += `<div class="term">${r.term}</div>`;

html += "<ul>";

r.translations.forEach(t=>{
html += `<li>${t}</li>`;
});

html += "</ul>";

if(r.notes){
html += `<small>${r.notes}</small>`;
}

html += "</div>";

});

document.getElementById("results").innerHTML = html;

});