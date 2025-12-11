const Directory = [
    "./lichess-openings/a.tsv",
    "./lichess-openings/b.tsv",
    "./lichess-openings/c.tsv",
    "./lichess-openings/d.tsv",
    "./lichess-openings/e.tsv",
];

const parseTsv = tsv => tsv.trim().split("\n").map(line => line.trim().split("\t"));

let scriptsDownloaded = 0;
const parseDirectory = path =>
    fetch(path)
        .then(req => req.text())
        .then(text => {
            scriptsDownloaded++;
            let status = document.querySelector(".status");
            if(status) {
                status.textContent = `${scriptsDownloaded}/${Directory.length} downloaded…`;
            }
            return text;
        });

Promise.all([
    Promise.all(Directory.map(parseDirectory)),
    new Promise(resolve => window.addEventListener("load", resolve))
]).then(([tsvs]) => {
    let bigTsv = tsvs.flatMap(tsv => parseTsv(tsv).slice(1));
    
    let status = document.querySelector(".status");
    let openings = document.querySelector(".openings");
    let viewButton = document.querySelector(".view-button");
    let lichessLink = document.querySelector(".lichess-link");
    let filterText = document.querySelector(".filter");
    let toastContainer = document.querySelector(".toast-container");
    
    const showToast = content => {
        let toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = content;
        toastContainer.appendChild(toast);
        toast.classList.add("show");
        setTimeout(function() {
            toast.classList.remove("show");
            setTimeout(function() {
                toastContainer.removeChild(toast);
            }, 500);
        }, 3000);
    };
    
    bigTsv.forEach(cols => {
        let tr = document.createElement("tr");
        let ecoTd = document.createElement("td");
        let nameTd = document.createElement("td");
        let pgnTd = document.createElement("td");
        
        let [ eco, name, pgn ] = cols;
        
        ecoTd.textContent = eco;
        let [ whole, family, variation, subvariations ] = name.match(/^(.+?)(?:: (.+?)((?:, .+?)+)?)?$/);
        // console.log(family, variation, subvariations);
        
        let familyName = document.createElement("span");
        familyName.textContent = family;
        familyName.classList.add("family");
        nameTd.appendChild(familyName);
        if(variation) {
            familyName.textContent += ": ";
            let variationEl = document.createElement("span");
            variationEl.classList.add("variation");
            variationEl.textContent = variation;
            nameTd.appendChild(variationEl);
        }
        if(subvariations) {
            let subvariationsEl = document.createElement("span");
            subvariationsEl.classList.add("subvariations");
            subvariationsEl.textContent = subvariations;
            nameTd.appendChild(subvariationsEl);
        }
        
        pgnCode = document.createElement("code");
        pgnCode.textContent = pgn;
        pgnTd.appendChild(pgnCode);
        
        tr.appendChild(ecoTd);
        tr.appendChild(nameTd);
        tr.appendChild(pgnTd);
        openings.appendChild(tr);
    });
    
    openings.addEventListener("click", ev => {
        let parentTr = ev.target.closest("tr");
        if(!parentTr) {
            console.info("Rejecting click handler for:", ev.target);
            return;
        }
        openings.querySelectorAll("tr").forEach(tr =>
            tr !== parentTr && tr.classList.remove("focused"));
        let isFocused = parentTr.classList.toggle("focused");
        viewButton.classList.toggle("disabled", !isFocused);
    });
    
    viewButton.addEventListener("click", () => {
        if(viewButton.classList.contains("disabled")) {
            showToast("Please select a row to view the board");
            return;
        }
        let pgn = document.querySelector(".focused code");
        if(!pgn) {
            console.warn("No pgn found when clicking view button");
            return;
        }
        pgn = pgn.textContent;
        let encoded = pgn.replace(/\d+\./g, "").trim().replace(/\s+/g, "_");
        let url = `https://lichess.org/analysis/pgn/${encoded}`;
        lichessLink.href = url;
        lichessLink.click();
    });
    
    const normalize = text => text
        .toLowerCase()
        .normalize("NFD") // splits accents apart from the base letters
        .replace(/[^-'a-z]+/g, ""); // ignore whitespace and accents
    
    const normalizedCache = [];
    const syncFilter = () => {
        let filter = normalize(filterText.value);
        let idx = 0;
        for(let tr of openings.children) {
            normalizedCache[idx] ??= normalize(tr.textContent);
            let isHidden = !normalizedCache[idx].includes(filter);
            tr.classList.toggle("hidden", isHidden);
            if(isHidden && tr.classList.contains("focused")) {
                tr.classList.remove("focused");
                viewButton.classList.add("disabled");
            }
            idx++;
        }
    };
    filterText.addEventListener("input", syncFilter);
    syncFilter();
    
    status.textContent = "Page loaded.";
    setTimeout(() => status.textContent = "", 1000);
    console.log(bigTsv);
});
