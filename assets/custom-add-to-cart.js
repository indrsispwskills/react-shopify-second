(() => {
  const CUSTOM_BUTTON_SELECTOR = '.custom-add-to-cart';
  const CART_DRAWER_SECTION_URL = '/cart?section_id=cart-drawer';

  const parseHTML = (htmlString) => new DOMParser().parseFromString(htmlString, 'text/html');

  const getCartDrawer = () => document.querySelector('cart-drawer');

  const setButtonLoading = (button, loading) => {
    button.dataset.loading = loading ? 'true' : 'false';
    button.toggleAttribute('disabled', loading);
    button.setAttribute('aria-disabled', loading ? 'true' : 'false');
  };

  const addVariantToCart = async (variantId, quantity) => {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        id: Number(variantId),
        quantity,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.description || payload?.message || 'Unable to add item to cart.');
    }

    return payload;
  };

  const refreshCartDrawer = async () => {
    const cartDrawer = getCartDrawer();
    if (!cartDrawer) return null;

    const response = await fetch(CART_DRAWER_SECTION_URL, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh cart drawer: ${response.status}`);
    }

    const html = await response.text();
    const documentFromResponse = parseHTML(html);
    const incomingDrawer = documentFromResponse.querySelector('cart-drawer');

    if (!incomingDrawer) {
      throw new Error('No <cart-drawer> found in /cart?section_id=cart-drawer response.');
    }

    cartDrawer.className = incomingDrawer.className;

    const currentDrawerContent = cartDrawer.querySelector('#CartDrawer');
    const nextDrawerContent = incomingDrawer.querySelector('#CartDrawer');

    if (currentDrawerContent && nextDrawerContent) {
      currentDrawerContent.replaceWith(nextDrawerContent);
    } else {
      cartDrawer.innerHTML = incomingDrawer.innerHTML;
    }

    return cartDrawer;
  };

  const openCartDrawer = (cartDrawer) => {
    if (!cartDrawer) return;

    if (typeof cartDrawer.open === 'function') {
      cartDrawer.open();
      return;
    }

    cartDrawer.classList.add('active');
    const drawer = cartDrawer.querySelector('.cart-drawer');
    if (drawer) drawer.classList.add('active');
    document.body.classList.add('overflow-hidden');
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest(CUSTOM_BUTTON_SELECTOR);
    if (!button) return;

    event.preventDefault();

    if (button.dataset.loading === 'true') return;

    const variantId = button.dataset.variantId;
    const quantity = Number(button.dataset.quantity || 1);

    if (!variantId) {
      console.warn('[custom-add-to-cart] Missing data-variant-id on clicked button.');
      return;
    }

    setButtonLoading(button, true);

    try {
      const item = await addVariantToCart(variantId, quantity);
      const cartDrawer = await refreshCartDrawer();
      openCartDrawer(cartDrawer);

      document.dispatchEvent(
        new CustomEvent('cart:custom-add', {
          detail: {
            variantId: item.id,
            quantity: item.quantity,
          },
        })
      );
    } catch (error) {
      console.error('[custom-add-to-cart] Request failed:', error);
    } finally {
      setButtonLoading(button, false);
    }
  });
})();
