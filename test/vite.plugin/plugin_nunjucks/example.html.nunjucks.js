// vite\plugin_nunjucks\example.html.nunjucks.js
export default {
  title: 'Example Page',
  discount: 0.1,
  items: [
    { id: 1, name: 'Item 1', price: 10.99 },
    { id: 2, name: 'Item 2', price: 5.99 },
    { id: 3, name: 'Item 3', price: 8.99 },
  ],
  getMessage: function() {
    return `Welcome to ${this.title}!`;
  },
  formatPrice: function(price, discount) {
    const discountedPrice = price * (1 - discount);
    return `$${discountedPrice.toFixed(2)}`;
  },
};
