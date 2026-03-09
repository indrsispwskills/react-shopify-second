(() => {
  const CUSTOM_BUTTON_SELECTOR = '.custom-add-to-cart';

  const parseHTML = (htmlString) => {
    const parser = new DOMParser();
    return parser.parseFromString(htmlString, 'text/html');
  };

  const refreshCartDrawer = async () => {
    const drawer = document.querySelector('cart-drawer');
    if (!drawer) return null;

    const response = await fetch('/cart?section_id=cart-drawer', {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cart drawer section: ${response.status}`);
    }

    const html = await response.text();
    const parsed = parseHTML(html);
    const updatedDrawer = parsed.querySelector('cart-drawer');

    if (!updatedDrawer) {
      throw new Error('Updated <cart-drawer> markup was not found in section response.');
    }

    drawer.innerHTML = updatedDrawer.innerHTML;
    drawer.className = updatedDrawer.className;

    return drawer;
  };

  const openCartDrawer = (drawer) => {
    if (!drawer) return;

    if (typeof drawer.open === 'function') {
      drawer.open();
      return;
    }

    drawer.classList.add('active');
    drawer.setAttribute('open', '');
    document.body.classList.add('overflow-hidden');
  };

  const addVariantToCart = async (variantId, quantity = 1) => {
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.description || data?.message || 'Unable to add item to cart.');
    }

    return data;
  };

  document.addEventListener('click', async (event) => {
    const button = event.target.closest(CUSTOM_BUTTON_SELECTOR);
    if (!button) return;

    event.preventDefault();

    const variantId = button.dataset.variantId;
    const quantity = Number(button.dataset.quantity || 1);

    if (!variantId) {
      console.warn('Custom add-to-cart button is missing data-variant-id.');
      return;
    }

    if (button.dataset.loading === 'true') return;

    button.dataset.loading = 'true';
    button.setAttribute('aria-disabled', 'true');

    try {
      await addVariantToCart(variantId, quantity);
      const drawer = await refreshCartDrawer();
      openCartDrawer(drawer);
      document.dispatchEvent(new CustomEvent('cart:refresh'));
    } catch (error) {
      console.error('Custom add-to-cart failed:', error);
    } finally {
      button.dataset.loading = 'false';
      button.removeAttribute('aria-disabled');
    }
  });
})();
