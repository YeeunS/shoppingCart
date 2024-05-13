//camelcase, skewercase getCart
const API = (() => {
    const URL = "http://localhost:3000";
    const getCart = () => {
        return fetch(URL + "/cart").then((res) => res.json());
    };

    const getInventory = () => {
        return fetch(URL + "/inventory").then((res) => res.json());
    };

    const addToCart = (inventoryItem) => {
        //{id , content, amount}

        console.log("inventoryItem", inventoryItem);
        return fetch(URL + "/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(inventoryItem),
        }).then((res) => res.json());
    };

    const updateCart = (id, newAmount) => {
        return fetch(URL + "/cart" + "/" + id, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ amount: newAmount }),
        }).then((res) => res.json());
    };

    const deleteFromCart = (id) => {
        return fetch(URL + "/cart" + "/" + id, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const checkout = () => {
        // you don't need to add anything here
        return getCart().then((data) =>
            Promise.all(data.map((item) => deleteFromCart(item.id)))
        );
    };

    return {
        getCart,
        updateCart,
        getInventory,
        addToCart,
        deleteFromCart,
        checkout,
    };
})();
//inventory.length = 20;
//itemPerPage.length = 8;
//1: 0, 2: 8
// inventory.slice(startIndex, startIndex + 8)

const itemPerPage = 8;
const Model = (() => {
    // implement your logic for Model
    class State {
        #onChange;
        #inventory;
        #cart;
        #currentPage;
        #displayInventory;
        constructor() {
            this.#inventory = [];
            this.#cart = [];
        }
        get cart() {
            return this.#cart;
        }

        get inventory() {
            return this.#inventory;
        }

        set cart(newCart) {
            this.#cart = newCart;
            this.#onChange();
        }
        set inventory(newInventory) {
            this.#inventory = newInventory;
            this.#onChange();
        }

        subscribe(cb) {
            this.#onChange = cb;
        }
    }
    const {
        getCart,
        updateCart,
        getInventory,
        addToCart,
        deleteFromCart,
        checkout,
    } = API;
    return {
        State,
        getCart,
        updateCart,
        getInventory,
        addToCart,
        deleteFromCart,
        checkout,
    };
})();

//iife: closure, naming space

//diffing algorithm
//reconciliation

const View = (() => {
    // implement your logic for View
    const inventoryListEl = document.querySelector(".inventory-container ul");
    const cartListEl = document.querySelector(".cart-container ul");
    const checkoutBtnEl = document.querySelector(".checkout-btn");
    const renderInventory = (inventory) => {
        let contentHTML = "";
        inventory.forEach(({ id, content, amount }) => {
            contentHTML += `
        <li id="inventory-${id}">
          <span>${content}</span>
          <button class="decrement-button">-</button>
          <span>${amount}</span>
          <button class="increment-button">+</button>
          <button class="add-to-cart-button">add to cart</button>
        </li>
        `;
        });
        inventoryListEl.innerHTML = contentHTML;
    };

    const renderCart = (cart) => {
        let contentHTML = "";
        cart.forEach(({ id, content, amount }) => {
            contentHTML += `
      <li id="cart-${id}">
        <span>${content} x ${amount}</span>
        <button class="delete-button">delete</button>
      </li>
      `;
        });
        cartListEl.innerHTML = contentHTML;
    };
    return {
        renderInventory,
        renderCart,
        inventoryListEl,
        cartListEl,
        checkoutBtnEl,
    };
})();

const Controller = ((model, view) => {
    // implement your logic for Controller
    const state = new model.State();

    const init = async () => {
        const inventory = await model.getInventory();
        const inventoryWithAmount = inventory.map((item) => ({
            ...item,
            amount: 0,
        }));
        state.inventory = inventoryWithAmount;
        const cart = await model.getCart();
        console.log("cart", cart);
        state.cart = cart;
    };

    const handleUpdateAmount = () => {
        view.inventoryListEl.addEventListener("click", (event) => {
            const target = event.target; //event.target, event.currentTarget
            const id = target.parentElement.id.split("-")[1];

            const className = target.className;
            if (
                className === "decrement-button" ||
                className === "increment-button"
            ) {
                let oldInventory = [...state.inventory];
                const newInventory = oldInventory.map((item) => {
                    if (Number(id) === Number(item.id)) {
                        return {
                            ...item,
                            amount: Math.max(
                                0,
                                className === "decrement-button"
                                    ? item.amount - 1
                                    : item.amount + 1
                            ),
                        };
                    } else {
                        return item;
                    }
                });

                state.inventory = newInventory;
            }
        });
    };

    const handleAddToCart = () => {
        view.inventoryListEl.addEventListener("click", async (event) => {
            const target = event.target;
            const id = target.parentElement.id.split("-")[1];
            const className = target.className;

            const addItem = state.inventory.find(
                (item) => Number(item.id) === Number(id)
            );
            if (addItem.amount <= 0) return;
            if (className === "add-to-cart-button") {
                /* const isAdded = state.cart.some(
                    (item) => Number(item.id) === Number(id)
                ); */
                const targetIndex = state.cart.findIndex(
                    (item) => Number(item.id) === Number(id)
                );
                if (targetIndex !== -1) {
                    const targetIndex = state.cart.findIndex(
                        (item) => Number(item.id) === Number(id)
                    );
                    const newAmount =
                        state.cart[targetIndex].amount + addItem.amount;
                    try {
                        await model.updateCart(id, newAmount);
                        const newCart = [...state.cart];
                        newCart[targetIndex] = {
                            ...newCart[targetIndex],
                            amount: newAmount,
                        };
                        state.cart = newCart;
                    } catch (err) {
                        console.log("err", err);
                        alert("request failed!");
                    }

                    /* state.cart = state.cart.map((item) => {
                        if (Number(item.id) === Number(id)) {
                            return {
                                ...item,
                                amount: item.amount + addItem.amount,
                            };
                        } else {
                            return item;
                        }
                    }); */
                } else {
                    try {
                        console.log("addItem", addItem);
                        await model.addToCart(addItem);
                        state.cart = [addItem, ...state.cart];
                    } catch (err) {
                        console.log("err", err);
                        alert("request failed!");
                    }
                }
            }
        });
    };

    const handleDelete = () => {
        view.cartListEl.addEventListener("click", async (event) => {
            const target = event.target;
            const id = target.parentElement.id.split("-")[1];
            const className = target.className;
            if (className === "delete-button") {
                try {
                    await model.deleteFromCart(id);
                    state.cart = state.cart.filter(
                        (item) => Number(item.id) !== Number(id)
                    );
                } catch (err) {
                    console.log("err", err);
                    alert("request failed!");
                }
            }
        });
    };

    const handleCheckout = () => {
        view.checkoutBtnEl.addEventListener("click", async () => {
            try {
                await model.checkout();
                state.cart = [];
            } catch (err) {
                alert("request failed!");
                console.log("err", err);
            }
        });
    };
    const bootstrap = async () => {
        state.subscribe(() => {
            view.renderInventory(state.inventory);
            view.renderCart(state.cart);
        });
        handleUpdateAmount();
        handleAddToCart();

        handleDelete();
        handleCheckout();
        await init();
    };
    return {
        bootstrap,
    };
})(Model, View);

Controller.bootstrap();
