const API = (() => {
    const URL = "http://localhost:3000";
    const fetchJson = (url, options) => fetch(url, options).then(res => res.json());

    return {
        getCart: () => fetchJson(`${URL}/cart`),
        getInventory: () => fetchJson(`${URL}/inventory`),
        addToCart: (item) => fetchJson(`${URL}/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        }),
        updateCart: (id, item) => fetchJson(`${URL}/cart/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: item.amount })
        }),
        deleteFromCart: (id) => fetchJson(`${URL}/cart/${id}`, {
            method: "DELETE"
        }),
        checkout: () => {
            return this.getCart().then(cart =>
                Promise.all(cart.map(item => this.deleteFromCart(item.id)))
            );
        }
    };
})();

const itemPerPage = 8;
const Model = (() => {
    class State {
        constructor() {
            this.inventory = [];
            this.cart = [];
            this.currentPage = 0;
            this.onChange = () => {};
        }

        subscribe(callback) {
            this.onChange = callback;
        }

        notify() {
            this.onChange();
        }

        setInventory(newInventory) {
            this.inventory = newInventory;
            this.notify();
        }

        setCart(newCart) {
            this.cart = newCart;
            this.notify();
        }

        setCurrentPage(page) {
            this.currentPage = page;
            this.notify();
        }
    }

    return new State();
})();

const View = (() => {
    const inventoryListEl = document.querySelector(".inventory-container ul");
    const cartListEl = document.querySelector(".cart-container ul");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");
    const pageInfo = document.querySelector(".page-info");

    const renderInventory = (inventory, page) => {
        const start = page * itemPerPage;
        const end = start + itemPerPage;
        const itemsToShow = inventory.slice(start, end);

        inventoryListEl.innerHTML = itemsToShow.map(item =>
            `<li id="inventory-${item.id}">
                <span>${item.content}</span>
                <button class="decrement-button">-</button>
                <span class="amount">${item.amount}</span>
                <button class="increment-button">+</button>
                <button class="add-to-cart-button">add to cart</button>
            </li>`
        ).join('');
    };

    const renderCart = (cart) => {
        cartListEl.innerHTML = cart.map(item =>
            `<li id="cart-${item.id}">
                <span>${item.content} x ${item.amount}</span>
                <button class="delete-button">delete</button>
            </li>`
        ).join('');
    };

    const updatePageInfo = (currentPage, totalPages) => {
        pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    };

    return {
        renderInventory,
        renderCart,
        updatePageInfo,
        prevBtn,
        nextBtn
    };
})();

const Controller = ((model, view) => {
    const init = async () => {
        const inventory = await API.getInventory();
        model.setInventory(inventory.map(item => ({ ...item, amount: 0 })));
        const cart = await API.getCart();
        model.setCart(cart);
        updatePageInfo();
    };

    const updatePageInfo = () => {
        const totalPages = Math.ceil(model.inventory.length / itemPerPage);
        view.updatePageInfo(model.currentPage, totalPages);
    };

    view.prevBtn.addEventListener('click', () => {
        if (model.currentPage > 0) {
            model.setCurrentPage(model.currentPage - 1);
        }
    });

    view.nextBtn.addEventListener('click', () => {
        const maxPage = Math.ceil(model.inventory.length / itemPerPage) - 1;
        if (model.currentPage < maxPage) {
            model.setCurrentPage(model.currentPage + 1);
        }
    });

    model.subscribe(() => {
        view.renderInventory(model.inventory, model.currentPage);
        view.renderCart(model.cart);
        updatePageInfo();
    });

    return { init };
})(Model, View);

document.addEventListener("DOMContentLoaded", Controller.init);
