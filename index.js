const API = (() => {
    const URL = "http://localhost:3000";
    const getCart = () => {
        // define your method to get cart data
        return fetch(`${URL}/cart`).then((res) => res.json());
    };

    const getInventory = () => {
        // define your method to get inventory data
        return fetch(`${URL}/inventory`).then((res) => res.json());
    };

    const addToCart = (inventoryItem) => {
        // define your method to add an item to cart
        return fetch(`${URL}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(inventoryItem),
        }).then((res) => res.json());
    };

    const updateCart = (id, info) => {
        // define your method to update an item in cart

        return fetch(`${URL}/cart/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(info),
        }).then((res) => res.json());
    };

    const deleteFromCart = (id) => {
        // define your method to delete an item in cart
        return fetch(`${URL}/cart/${id}`, {
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

const Model = (() => {
    // implement your logic for Model
    class State {
        #onChangeCart;
        #onChangeInventory;
        #inventory;
        #cart;
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
            this.#onChangeCart();
        }

        set inventory(newInventory) {
            this.#inventory = newInventory;
            this.#onChangeInventory();
        }

        subscribeCart(cb) {
            this.#onChangeCart = cb;
        }

        subscribeInventory(cb) {
            this.#onChangeInventory = cb;
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
    const checkoutBtn = document.querySelector(".checkout-btn");
    const inventoryListEl = document.querySelector(".inventory-list");
    const cartListEl = document.querySelector(".cart-list");
    const findInventoryItem = (id) => {
        inventory_items = inventoryListEl.querySelectorAll(".inventory_item");
        return inventory_items.find((item) => item.id === id);
    };

    const renderInventory = (inventory) => {
        let inventoryTemp = "";
        inventory.forEach((item) => {
            inventoryTemp += `
          <div class="inventory_item" id="${item.id}">
              <p class="inventory_name">${item.content}</p>
              <button class="decrease_amount_btn inventory_btns" id="${item.id}"> - </button>
              <p > ${item.amount} </p>
              <button class="increse_amount_btn inventory_btns" id="${item.id}"> + </button>
              <button class="add_to_cart_btn inventory_btns" id="${item.id}">Add to Cart</button>
              <span class="end_space"></span>
          </div>
          `;
        });
        inventoryListEl.innerHTML = inventoryTemp;
    };

    const renderCart = (cart) => {
        let cartTemp = "";
        cart.forEach((item) => {
            cartTemp += `
          <div class="cart_item" id="${item.id}">
              <p>${item.content} x ${item.amount}</p>
              <span class="bet_space"></span>
              <button class="delete_from_cart_btn inventory_btns" id="${item.id}">Delete</button>
          </div>
          `;
        });
        cartListEl.innerHTML = cartTemp;
    };

    return {
        findInventoryItem,
        renderInventory,
        renderCart,
        inventoryListEl,
        cartListEl,
        checkoutBtn,
    };
})();

const Controller = ((model, view) => {
    // implement your logic for Controller
    const state = new model.State();

    const init = () => {
        model.getInventory().then((data) => {
            const inv_data = data.map((item) => {
                return {
                    id: item.id,
                    content: item.content,
                    amount: 0,
                };
            });
            state.inventory = inv_data;
        });
        model.getCart().then((data) => {
            state.cart = data;
        });
    };
    const handleUpdateAmount = () => {
        view.inventoryListEl.addEventListener("click", (e) => {
            const element = e.target;
            let change = 0;
            if (element.classList.contains("increse_amount_btn")) {
                change = 1;
            } else if (element.classList.contains("decrease_amount_btn")) {
                change = -1;
            } else {
                return;
            }
            const id = parseInt(element.id);

            const target_item = state.inventory.find((item) => {
                return item.id === id;
            });
            if (target_item) {
                const newAmount = target_item.amount + change;
                if (newAmount < 0) {
                    return;
                }
                target_item.amount = newAmount;
            }
            state.inventory = state.inventory;
        });
    };

    const clearInventoryAmount = (id) => {
        const target_item = state.inventory.find((item) => {
            return item.id === id;
        });
        if (target_item) {
            target_item.amount = 0;
        }
        state.inventory = state.inventory;
    };

    const handleAddToCart = () => {
        view.inventoryListEl.addEventListener("click", (e) => {
            const element = e.target;
            if (element.classList.contains("add_to_cart_btn")) {
                const id = parseInt(element.id);
                const inv_item = state.inventory.find((item) => item.id === id);
                if (inv_item == undefined) {
                    alert("handleAddToCart Item not found");
                    return;
                }
                if (inv_item.amount == 0) {
                    return;
                }
                const cart_data = state.cart;
                const cart_item = cart_data.find((item) => item.id == id);
                if (cart_item) {
                    cart_item.amount += inv_item.amount;
                    model.updateCart(id, cart_item).then((data) => {
                        state.cart = state.cart;
                    });
                } else {
                    model.addToCart(inv_item).then((data) => {
                        state.cart = [...state.cart, data];
                    });
                }
                clearInventoryAmount(id);
            }
        });
    };

    const handleDeleteFromCart = () => {
        view.cartListEl.addEventListener("click", (e) => {
            const element = e.target;
            if (element.classList.contains("delete_from_cart_btn")) {
                const id = parseInt(element.id);
                const cart_item = state.cart.find((item) => item.id === id);
                if (cart_item) {
                    model.deleteFromCart(id).then((data) => {
                        state.cart = state.cart.filter(
                            (item) => item.id !== id
                        );
                    });
                } else {
                    alert("handleDeleteFromCart Item not found");
                    return;
                }
            }
        });
    };

    const handleCheckout = () => {
        view.checkoutBtn.addEventListener("click", () => {
            model.checkout();
            state.cart = [];
        });
    };

    const bootstrap = () => {
        init();
        state.subscribeCart(() => {
            // update cart view
            view.renderCart(state.cart);
        });
        state.subscribeInventory(() => {
            // update inventory view
            view.renderInventory(state.inventory);
        });
        handleUpdateAmount();
        handleAddToCart();
        handleDeleteFromCart();
        handleCheckout();
    };
    return {
        bootstrap,
    };
})(Model, View);

Controller.bootstrap();
