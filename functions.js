let db;
const request = indexedDB.open('exampleProductDB', 1);

request.onerror = function(event) {
    console.error('Database error:', event.target.error);
};

request.onsuccess = function(event) {
    db = event.target.result;
    loadProductTable();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
    }
};

function loadProductTable() {
    if (!db) return;

    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const query = store.getAll();

    query.onsuccess = function(event) {
        const products = event.target.result;
        const search = document.getElementById('search').value.trim().toLowerCase();
        document.getElementById('totalProducts').textContent = products.length;

        const tableBody = document.querySelector('#productsTable tbody');
        tableBody.replaceChildren();

        products.forEach(product => {
            if (!product.name.toLowerCase().includes(search)) return;

            const row = document.createElement('tr');
            const idCell = document.createElement('td');
            const nameCell = document.createElement('td');
            const priceCell = document.createElement('td');
            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');

            idCell.textContent = product.id;
            nameCell.textContent = product.name;
            priceCell.textContent = '$' + Number(product.price).toFixed(2);
            deleteButton.className = 'delete-btn';
            deleteButton.dataset.id = product.id;
            deleteButton.type = 'button';
            deleteButton.setAttribute('aria-label', 'Eliminar ' + product.name);
            deleteButton.title = 'Eliminar producto';
            deleteButton.addEventListener('click', deleteProduct);

            actionCell.appendChild(deleteButton);
            row.append(idCell, nameCell, priceCell, actionCell);
            tableBody.appendChild(row);
        });
    };
}

function launchConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const shell = document.querySelector('.app-shell').getBoundingClientRect();
    const layer = document.getElementById('confetti-layer');
    const tones = ['#a56b4f', '#b88463', '#d5ac85', '#8c5a3d', '#e0c5a1', '#c18c72'];
    const count = 46;

    for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const piece = document.createElement('span');
        const originX = side < 0 ? shell.left + 8 : shell.right - 8;
        const originY = shell.top + shell.height * (.27 + Math.random() * .49);
        const travelX = side * (60 + Math.random() * 135);
        const travelY = -110 + Math.random() * 260;

        piece.className = 'confetti-piece';
        piece.style.setProperty('--x', originX + 'px');
        piece.style.setProperty('--y', originY + 'px');
        piece.style.setProperty('--dx', travelX + 'px');
        piece.style.setProperty('--dy', travelY + 'px');
        piece.style.setProperty('--size', (5 + Math.random() * 8) + 'px');
        piece.style.setProperty('--rotation', (Math.random() * 360) + 'deg');
        piece.style.setProperty('--tone', tones[Math.floor(Math.random() * tones.length)]);
        piece.style.animationDelay = Math.round(Math.random() * 140) + 'ms';
        piece.addEventListener('animationend', () => piece.remove(), { once: true });
        layer.appendChild(piece);
    }
}

function addProduct() {
    if (!db) return;

    const name = document.getElementById('name').value.trim();
    const price = Number(document.getElementById('price').value);

    if (!name || !Number.isFinite(price) || price <= 0) {
        alert('Ingresa un nombre y un precio válidos.');
        return;
    }

    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const query = store.getAll();

    query.onsuccess = function(event) {
        const products = event.target.result;
        const nextId = products.reduce((max, product) => Math.max(max, product.id), 0) + 1;
        store.add({ id: nextId, name, price });
    };

    transaction.oncomplete = function() {
        document.getElementById('name').value = '';
        document.getElementById('price').value = '';
        loadProductTable();
        launchConfetti();
    };

    transaction.onerror = function(event) {
        console.error('No se pudo agregar el producto:', event.target.error);
    };
}

function deleteProduct(event) {
    if (!db) return;

    const productId = Number(event.currentTarget.dataset.id);
    const transaction = db.transaction(['products'], 'readwrite');
    transaction.objectStore('products').delete(productId);
    transaction.oncomplete = loadProductTable;
    transaction.onerror = function(error) {
        console.error('No se pudo eliminar el producto:', error);
    };
}

document.getElementById('addProduct').addEventListener('click', addProduct);
document.getElementById('search').addEventListener('input', loadProductTable);
