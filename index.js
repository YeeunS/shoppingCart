
const API = (() => {
    const URL = "http://localhost:3000";
  
    const fetchData = async (path, options = {}) => {
      try {
        const response = await fetch(`${URL}${path}`, options);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
      } catch (error) {
        console.error(`Failed to fetch ${path}:`, error);
        return null; // Return null to signify an error condition to the caller
      }
    };
  
    const getCart = () => fetchData('/cart');
  
    const getInventory = () => fetchData('/inventory');
  
    const addToCart = (inventoryItem) => {
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inventoryItem)
      };
      return fetchData('/cart', options);
    };
  
    const updateCart = (id, newAmount) => {
      const cartItem = { id, quantity: newAmount };
      const options = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItem)
      };
      return fetchData(`/cart/${id}`, options);
    };
  
    const deleteFromCart = (id) => {
      const options = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      };
      return fetchData(`/cart/${id}`, options);
    };
  
    const checkout = async () => {
      const cart = await getCart();
      if (cart) {
        return Promise.all(cart.map(item => deleteFromCart(item.id)));
      }
      return [];
    };
  
    return { getCart, getInventory, addToCart, updateCart, deleteFromCart, checkout };
  })();
  
  const itemsPerPage = 8;
  const Model = (() => {
    // implement your logic for Model
    class State {
      #onChange;
      #inventory;
      #cart;
      #currentPage;
      constructor() {
        this.#inventory = [];
        this.#cart = [];
        this.#currentPage = 0;
      }
      get cart() {
        return this.#cart;
      }
  
      get inventory() {
        return this.#inventory;
      }
  
      get currentPage() {
        return this.#currentPage;
      }
  
      set cart(newCart) {
        this.#cart = newCart;
        this.#onChange();
      }
      set inventory(newInventory) {
        this.#inventory = newInventory;
        this.#onChange();
      }
  
      set currentPage(newPage) {
        this.#currentPage = newPage;
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
  
  const View = (() => {
    // implement your logic for View
  
    const inventoryContainerEl = document.querySelector(".inventory-container ul");
    const cartContainerEl = document.querySelector(".cart-container ul");
    const cartWrapper = document.querySelector(".cart-wrapper");
    const paginationContainer = document.querySelector(".pagination-container");
    const paginationPages = document.querySelector(".inventory__pagination-pages");
  
    const renderPagination = (inventory) => {
      const inventoryLength = inventory.length;
      const numberOfPages = Math.ceil(inventoryLength/itemsPerPage);
      let pages = "";
      for (let i = 0; i < numberOfPages; i++) {
        const page = `
          <button class="inventory__page">${i + 1}</button>
        `;
        pages += page;
      }
      paginationPages.innerHTML = pages;
    }
  
    const renderInventory = (items, pageNumber) => {
      let start = pageNumber * itemsPerPage;
      let end = start + itemsPerPage;
      let itemList = items.slice(start, end);
      let itemsTemp = "";
      itemList.forEach((item) => {
        const content = item.content;
        const quantity = 0;
        const liTemp = `
        <li id=${item.id}>
        <span class='inventory__content'>${content}</span>
        <button class='inventory__decrease-quantity'>-</button>
        <span class="inventory__item-quantity">${quantity}</span>
        <button class='inventory__increase-quantity'>+</button>
        <button class='inventory__add-to-cart'>add to cart</button>
        </li>
        `;
        itemsTemp += liTemp;
      });
      inventoryContainerEl.innerHTML = itemsTemp;
    }
  
    const renderCart = (cartItems) => {
      let cartItemsTemp = "";
      cartItems.forEach((cartItem) => {
        const content = cartItem.content;
        const quantity = cartItem.quantity;
        const liTemp = `
        <li id=${cartItem.id}>
        <span class='cart__content'>${content} x ${quantity}</span>
        <button class='cart__delete'>delete</button>
        </li>
        `;
        cartItemsTemp += liTemp;
      });
      cartContainerEl.innerHTML = cartItemsTemp;
    }
  
    return {
      renderInventory,
      renderCart,
      inventoryContainerEl,
      cartContainerEl,
      cartWrapper,
      paginationContainer,
      renderPagination
    };
  })();
  
  const Controller = ((model, view) => {
    // implement your logic for Controller
    const state = new model.State();
  
    const init = () => {
      model.getInventory().then((data) => {
        state.inventory = data;
        view.renderInventory(data, state.currentPage);
        view.renderPagination(data);
      });
      model.getCart().then((data) => {
        state.cart = data;
        view.renderCart(data);
      });
    };
  
    const handleUpdatePage = () => {
      view.paginationContainer.addEventListener("click", (event) => {
        const inventoryLength = state.inventory.length;
        const numberOfPages = Math.ceil(inventoryLength / itemsPerPage);
        const element = event.target;
        if (element.className === "inventory__prev-btn") {
          if (state.currentPage > 0) {
            state.currentPage -= 1;
            view.renderInventory(state.inventory, state.currentPage);
          }
          
        } else if (element.className === "inventory__next-btn") {
          if (state.currentPage < numberOfPages - 1) {
            state.currentPage += 1;
            view.renderInventory(state.inventory, state.currentPage);
          }  
        } else if (element.className === "inventory__page") {
          const pageNum = element.innerHTML;
          view.renderInventory(state.inventory, +pageNum - 1);
        }
      })
      
    }
  
    const handleUpdateAmount = () => {
      view.inventoryContainerEl.addEventListener("click", (event) => {
        const element = event.target;
        if (element.className === "inventory__increase-quantity") {
          const quantityEl = element.parentElement.querySelector(".inventory__item-quantity");
          const quantity = quantityEl.innerHTML;
          quantityEl.innerHTML = +quantity + 1;  
        } else if (element.className === "inventory__decrease-quantity") {
          const quantityEl = element.parentElement.querySelector(".inventory__item-quantity");
          const quantity = quantityEl.innerHTML;
          quantityEl.innerHTML = +quantity - 1;
        }
      })
    };
  
    const handleAddToCart = () => {
      view.inventoryContainerEl.addEventListener("click", (event) => {
        const element = event.target;
        if (element.className === "inventory__add-to-cart") {
          const cartEl = element.parentElement;
          const content = cartEl.querySelector('.inventory__content').innerHTML;
          const quantity = cartEl.querySelector('.inventory__item-quantity').innerHTML;
          if (quantity === 0) {
            return;
          }
          const id = cartEl.getAttribute("id");
          const cartItem = {
            content: content,
            quantity: +quantity,
            id: id
          }
          model.getCart().then((data) => {
            const foundItem = data.find((item) => item.id === id);
            if (!foundItem) {
              model.addToCart(cartItem).then((data) => {
                console.log(data);
                state.cart = [data, ...state.cart];
              })
            } else {
              model.updateCart(id, (+foundItem.quantity) + (+quantity)).then((data) => {
              console.log(data);
              // state.cart = state.cart.filter((item) => item.id !== foundItem.id);
              // state.cart = [...state.cart, data];
              const index = state.cart.findIndex(item => item.id === foundItem.id);
              if (index !== -1) {
                state.cart[index] = data;
              }
              state.cart = [...state.cart];
              })
            }
          });
        }
      })
      
  
    };
  
    const handleDelete = () => {
      view.cartContainerEl.addEventListener("click", (event) => {
        let element = event.target;
        let id = element.parentElement.getAttribute("id");
        if (element.className === "cart__delete") {
          model.deleteFromCart(id).then((data) => {
            state.cart = state.cart.filter((item) => item.id !== id);
          })
        }
      })
    };
  
    const handleCheckout = () => {
      view.cartWrapper.addEventListener("click", (event) => {
        let element = event.target;
        if (element.className === "checkout-btn") {
          // state.cart.map((item) => {
          //   model.deleteFromCart(item.id)
          // });
          model.checkout().then((data) => {
            state.cart = [];
          });
        }
      })
    };
    const bootstrap = () => {
      init();
      state.subscribe(() => {
        view.renderInventory(state.inventory);
      });
      state.subscribe(() => {
        view.renderCart(state.cart);
      });
      handleUpdateAmount();
      handleAddToCart();
      handleDelete();
      handleCheckout();
      handleUpdatePage();
    };
    return {
      bootstrap,
    };
  })(Model, View);
  
  Controller.bootstrap();
  