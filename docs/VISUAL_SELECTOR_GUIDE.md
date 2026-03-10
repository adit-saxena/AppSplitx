# Visual Element Selector - User Guide

## 🎯 How to Use the Visual Element Selector

SplitX's Visual Element Selector is designed to work seamlessly with **any website**, including those built with Tailwind CSS and other utility-first frameworks.

---

## Quick Start

1. **Enter your page URL** in Step 1
2. **Navigate to Step 2** - Your page will load in a preview
3. **Click any element** you want to test
4. **We automatically generate** a stable, reliable CSS selector
5. **Continue** to configure your experiment

---

## 🚀 How It Works

### Automatic Selector Generation

When you click an element, our smart algorithm analyzes it and generates selectors in this priority order:

1. **Data Attributes** (Highest Priority)
   - `[data-testid="checkout-button"]`
   - `[data-test="submit"]`
   - ✅ **Most stable** - won't break with design changes

2. **Unique IDs**
   - `#submit-btn`
   - ✅ **Very stable** - good for unique elements

3. **ARIA Labels**
   - `[aria-label="Submit form"]`
   - ✅ **Stable** - semantic and accessible

4. **Semantic Classes**
   - `.checkout-button` *(ignores Tailwind utilities)*
   - ⚠️ **Medium stability** - depends on naming

5. **Text Content**
   - `button:has-text("Buy Now")`
   - ⚠️ **Lower stability** - breaks if text changes

6. **Positional Selector**
   - `body > main > form > button:nth-of-type(1)`
   - ⚠️ **Lowest stability** - fallback only

---

## 💡 Working with Tailwind CSS

### The Challenge

Tailwind uses **utility classes** for styling:
```html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Buy Now
</button>
```

❌ **Bad selector**: `.bg-blue-500` (matches many elements, breaks if color changes)

### Our Solution

✅ **We automatically ignore Tailwind utility classes** and find better selectors!

### Best Practices for Tailwind Sites

#### 1. Add `data-testid` Attributes (Recommended)

```html
<!-- Before -->
<button class="bg-blue-500 text-white px-4 py-2 rounded">
  Buy Now
</button>

<!-- After ✅ -->
<button class="bg-blue-500 text-white px-4 py-2 rounded" data-testid="checkout-cta">
  Buy Now
</button>
```

**Selector Generated**: `[data-testid="checkout-cta"]`
- ✅ Won't break with design changes
- ✅ Future-proof
- ✅ Industry standard for testing

#### 2. Use IDs for Unique Elements

```html
<button id="submit-btn" class="bg-blue-500 text-white px-4 py-2">
  Submit
</button>
```

**Selector Generated**: `#submit-btn`

#### 3. Add ARIA Labels (Accessibility + Testing)

```html
<button aria-label="Submit checkout form" class="bg-blue-500 text-white px-4 py-2">
  →
</button>
```

**Selector Generated**: `[aria-label="Submit checkout form"]`

---

## 🛡️ Selector Stability Ratings

Each generated selector is rated for stability:

- 🟢 **High Stability**: Uses data attributes, IDs, or ARIA labels
  - Recommended for production tests
  - Won't break with design changes

- 🟡 **Medium Stability**: Uses semantic classes or text content
  - Generally reliable
  - May need updating if content changes

- 🔴 **Low Stability**: Uses positional selectors or Tailwind utilities
  - Fallback only
  - Consider adding data-testid to the element

---

## 🔧 Troubleshooting

### "Preview Blocked by CORS"

Some websites block iframe loading for security. Options:

1. **Manual Input**: Use browser DevTools to find the selector
2. **Proxy Loading**: Click "Load via proxy" (may be slower)

### How to Find a Selector Manually

1. **Right-click** the element on your website
2. Select **Inspect** or **Inspect Element**
3. In DevTools, **right-click** the highlighted HTML
4. Select **Copy** → **Copy selector**
5. **Paste** into the selector input

### "Multiple Elements Found"

If your selector matches multiple elements, consider:
- Adding a `data-testid` to make it unique
- Using a more specific selector
- The test will apply to **all matching elements**

---

## 📋 Examples

### E-commerce CTA Button

```html
<!-- HTML -->
<button 
  data-testid="product-buy-now"
  class="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
>
  Add to Cart
</button>
```

**Best Selector**: `[data-testid="product-buy-now"]` 🟢

---

### Newsletter Signup

```html
<!-- HTML -->
<form class="flex flex-col gap-4">
  <input 
    name="email"
    type="email" 
    placeholder="Enter your email"
    class="px-4 py-2 border rounded"
  />
  <button 
    type="submit"
    class="bg-black text-white px-6 py-2 rounded"
  >
    Subscribe
  </button>
</form>
```

**Best Selectors**:
- Input: `input[name="email"]` 🟢
- Button: `form > button[type="submit"]` 🟡

---

### Hero Heading

```html
<!-- HTML -->
<h1 class="text-5xl font-bold text-gray-900 leading-tight">
  Build Faster
</h1>
```

**Auto-Generated**: `h1:has-text("Build Faster")` 🟡

**Better with**:
```html
<h1 data-testid="hero-heading" class="text-5xl font-bold text-gray-900">
  Build Faster
</h1>
```

**Selector**: `[data-testid="hero-heading"]` 🟢

---

## 🎓 Tips for Success

1. **Always aim for 🟢 High Stability selectors** in production
2. **Use data-testid for important elements** you plan to test
3. **Test your selector** - we show you exactly what will be matched
4. **Check stability warnings** - we'll let you know if there's a better approach
5. **Fallback selectors are automatically generated** for redundancy

---

## 🔄 Fallback System

We automatically generate **multiple fallback selectors** for reliability:

```javascript
Primary:    [data-testid="checkout-cta"]  // Try first
Fallback 1: #checkout-btn                 // If primary fails
Fallback 2: button[aria-label="Checkout"] // If both fail
Fallback 3: .checkout-button              // Last resort
```

This ensures your tests continue working even if the page structure changes slightly.

---

## Need Help?

- The visual selector handles **99% of cases automatically**
- For complex scenarios, you can **manually edit** the generated selector
- We provide **real-time validation** as you type
- Look for **helpful warnings** if we detect potential issues

**Happy Testing!** 🚀
