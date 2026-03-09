(() => {
  const CUSTOM_BUTTON_SELECTOR = '.custom-add-to-cart';
  const CART_DRAWER_SECTION_URL = '/cart?section_id=cart-drawer';
  const CUSTOM_DRAWER_SELECTOR = '#CustomCartDrawer';
  const CUSTOM_DRAWER_CONTENT_SELECTOR = '#CustomCartDrawerContent';

  const parseHTML = (htmlString) => new DOMParser().parseFromString(htmlString, 'text/html');

  const ensureCustomDrawerShell = () => {
    let drawer = document.querySelector(CUSTOM_DRAWER_SELECTOR);
    if (drawer) return drawer;

    drawer = document.createElement('div');
    drawer.id = 'CustomCartDrawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML = `
      <button class="custom-cart-drawer__overlay" type="button" aria-label="Close cart drawer"></button>
      <div class="custom-cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Cart drawer" tabindex="-1">
        <div id="CustomCartDrawerContent"></div>
      </div>
    `;

    document.body.appendChild(drawer);
    return drawer;
  };

  const setButtonLoading = (button, loading) => {
    button.dataset.loading = loading ? 'true' : 'false';
    button.toggleAttribute('disabled', loading);
    button.setAttribute('aria-disabled', loading ? 'true' : 'false');
  };

  const sanitizeDrawerMarkup = (drawerRoot) => {
    drawerRoot.querySelectorAll('[onclick]').forEach((element) => element.removeAttribute('onclick'));
  };

  const fetchDrawerMarkup = async () => {
    const response = await fetch(CART_DRAWER_SECTION_URL, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh cart drawer: ${response.status}`);
    }

    const html = await response.text();
    const documentFromResponse = parseHTML(html);
    const incomingCartDrawer = documentFromResponse.querySelector('#CartDrawer');

    if (!incomingCartDrawer) {
      throw new Error('No #CartDrawer found in /cart?section_id=cart-drawer response.');
    }

    sanitizeDrawerMarkup(incomingCartDrawer);
    return incomingCartDrawer;
  };

  const refreshCustomDrawer = (incomingCartDrawer) => {
    const customDrawer = ensureCustomDrawerShell();
    const customDrawerContent = customDrawer.querySelector(CUSTOM_DRAWER_CONTENT_SELECTOR);
    if (!customDrawerContent || !incomingCartDrawer) return null;

    customDrawerContent.innerHTML = incomingCartDrawer.outerHTML;
    return customDrawer;
  };

  const addVariantToCart = async (variantId, quantity) => {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ id: Number(variantId), quantity }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.description || payload?.message || 'Unable to add item to cart.');
    return payload;
  };

  const closeCustomDrawer = () => {
    const drawer = document.querySelector(CUSTOM_DRAWER_SELECTOR);
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  };

  const openCustomDrawer = (drawer) => {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    drawer.querySelector('.custom-cart-drawer__panel')?.focus();
  };

  const bindCustomDrawerEvents = () => {
    if (document.body.dataset.customDrawerBound === 'true') return;
    document.body.dataset.customDrawerBound = 'true';

    document.addEventListener('click', (event) => {
      const closeTrigger = event.target.closest(
        `${CUSTOM_DRAWER_SELECTOR} .custom-cart-drawer__overlay, ${CUSTOM_DRAWER_SELECTOR} .drawer__close`
      );
      if (!closeTrigger) return;
      event.preventDefault();
      closeCustomDrawer();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCustomDrawer();
    });
  };

  const updateDefaultDawnDrawer = (incomingCartDrawer) => {
    const dawnDrawer = document.querySelector('cart-drawer');
    if (!dawnDrawer || !incomingCartDrawer) return;

    const currentCartDrawer = dawnDrawer.querySelector('#CartDrawer');
    if (currentCartDrawer) currentCartDrawer.replaceWith(incomingCartDrawer.cloneNode(true));
    else dawnDrawer.innerHTML = incomingCartDrawer.outerHTML;
  };

  bindCustomDrawerEvents();
  ensureCustomDrawerShell();

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
      const incomingCartDrawer = await fetchDrawerMarkup();
      updateDefaultDawnDrawer(incomingCartDrawer);
      const customDrawer = refreshCustomDrawer(incomingCartDrawer.cloneNode(true));
      openCustomDrawer(customDrawer);

      document.dispatchEvent(new CustomEvent('cart:custom-add', {
        detail: { variantId: item.id, quantity: item.quantity },
      }));
    } catch (error) {
      console.error('[custom-add-to-cart] Request failed:', error);
    } finally {
      setButtonLoading(button, false);
    }
  });
})();
