# 🧪 Testing the Visual Element Selector

## Quick Start - Test Locally

### Step 1: Access the Demo Page

Your dev server is running, so the demo page is available at:

```
http://localhost:5173/demo-page.html
```

### Step 2: Test the Visual Selector

1. **Go to your app** at `http://localhost:5173`
2. **Create a new experiment**
3. **Step 1**: Select a project and enter the page URL:
   ```
   http://localhost:5173/demo-page.html
   ```
4. **Step 2**: The iframe will load ✅ (no CORS since it's same-origin!)
5. **Hover over elements** - see the blue outline
6. **Click any element** - see the green confirmation
7. **Review generated selectors** - notice how it prioritizes `data-testid`

---

## 🎯 Good Elements to Test

The demo page has several elements with different selector strategies:

### High Stability (has data-testid)
- **Primary CTA Button**: `[data-testid="hero-cta-primary"]` 🟢
- **Secondary CTA**: `[data-testid="hero-cta-secondary"]` 🟢  
- **Signup Submit**: `[data-testid="signup-submit"]` 🟢
- **Pricing CTA**: `[data-testid="pricing-pro-cta"]` 🟢
- **Nav Login**: `[data-testid="nav-login"]` 🟢

### Medium Stability (has ID or name)
- **Hero Heading**: `#hero-heading` 🟡
- **Signup Form**: `#signup-form` 🟡
- **Email Input**: `input[name="email"]` 🟡

### Low Stability (Tailwind only)
- **Feature Cards**: Only has Tailwind classes 🔴
- **Footer Links**: Only has Tailwind classes 🔴

---

## 📊 What to Observe

### ✅ When Selecting "Start Free Trial" Button

You should see:

```
Primary Selector: [data-testid="hero-cta-primary"]
Stability: HIGH
Fallbacks:
  1. button:has-text("Start Free Trial")
  2. body > main > div > div:nth-of-type(1) > button:nth-of-type(1)
```

### ✅ When Selecting a Feature Card

You should see:

```
Primary Selector: div.bg-white.p-8.rounded-2xl
Fallback: body > main > div.grid > div:nth-of-type(1)
Stability: MEDIUM
Warning: ⚠️ Element only has Tailwind utility classes
Suggestion: 💡 Consider adding a data-testid attribute
```

---

## 🌐 Testing with Real Websites

### Sites That Allow Iframes (Will Work ✅)

Try these URLs - they allow iframe embedding:

```
https://example.com
https://httpbin.org/html
https://www.w3schools.com
http://info.cern.ch (the first website ever!)
```

### Sites That Block Iframes (Will Show CORS Error ❌)

These are expected to fail:

```
https://google.com
https://github.com
https://youtube.com
https://facebook.com
```

**This is normal!** Our app handles it gracefully with:
- Clear error message
- Manual selector input option
- Helpful guidance

---

## 🔧 Manual Selector Testing

When CORS blocks the preview, you can still test manually:

1. **Open the blocked website** in a new tab
2. **Right-click** the element you want to test
3. **Click "Inspect"** to open DevTools
4. **Right-click** the highlighted HTML in DevTools
5. **Copy** → **Copy selector**
6. **Paste** into the manual input field in SplitX

Example selectors to try manually:
```css
[data-testid="checkout-button"]
#submit-btn
.cta-button
button[aria-label="Sign up"]
```

---

## 🎨 Testing Tailwind Detection

The selector generator will automatically:

### ✅ Ignore These Patterns
```css
.bg-blue-500        ← Background utilities
.text-white         ← Text utilities  
.px-4.py-2         ← Spacing utilities
.rounded-xl        ← Border utilities
.hover:bg-blue-700 ← State variants
.md:flex           ← Responsive variants
```

### ✅ Use These Instead
```css
[data-testid="..."] ← Data attributes (best!)
#unique-id          ← IDs
[aria-label="..."]  ← ARIA labels
.semantic-class     ← Non-utility classes
```

---

## 💡 Pro Tips

### Get the Best Selectors

1. **Before testing**, add `data-testid` to elements you'll test:
   ```html
   <button data-testid="my-cta" class="bg-blue-500 ...">
     Click Me
   </button>
   ```

2. **Use semantic IDs** for unique elements:
   ```html
   <form id="signup-form">...</form>
   ```

3. **Add ARIA labels** for accessibility AND testing:
   ```html
   <button aria-label="Close modal" class="...">×</button>
   ```

### Test the Fallback System

1. Select an element with `data-testid`
2. Note the fallback selectors generated
3. In a real test, if you rename the `data-testid`, the fallback will work!

---

## 🐛 Troubleshooting

### "Preview Blocked by CORS"
✅ **This is expected for most production sites**
- Use the demo page: `http://localhost:5173/demo-page.html`
- Or use any iframe-friendly site
- Or use manual selector input

### "No elements found"
- Check that the selector syntax is valid
- Try a simpler selector
- Make sure the element exists on the page

### "Multiple elements found"
- This is just a warning
- The test will apply to ALL matching elements
- Or add more specificity to target just one

### Element won't highlight
- Make sure the iframe loaded successfully
- Check browser console for errors
- Try refreshing the page

---

## 🚀 Next Steps

Once you've tested with the demo page:

1. ✅ **Try manual input** with a real site that blocks CORS
2. ✅ **Create a test** and save it to see the selectors in the database
3. ✅ **Review fallback selectors** in the test details
4. ✅ **Test stability ratings** by selecting different elements

---

## 📸 Expected Behavior

### When It Works (Same-Origin or Allowed)
1. Page loads in iframe
2. Hover shows blue outline
3. Click shows green outline
4. Selectors generate automatically
5. Validation shows "✓ Perfect! One element found"

### When CORS Blocks (Most Production Sites)
1. Page fails to load
2. Clear error message displayed
3. Options presented:
   - Manual selector input
   - Try proxy (beta)
4. Manual input works perfectly with validation

---

## ✅ Success Criteria

You'll know it's working when:

- ✅ Demo page loads in iframe
- ✅ Elements highlight on hover
- ✅ Clicking selects the element
- ✅ `data-testid` selectors are prioritized (HIGH stability)
- ✅ Tailwind classes are ignored in favor of semantic selectors
- ✅ Fallback selectors are generated
- ✅ CORS errors are handled gracefully
- ✅ Manual input works as a fallback

---

## 🎯 Demo Checklist

Test these scenarios:

- [ ] Load demo page: `http://localhost:5173/demo-page.html`
- [ ] Select hero CTA button (has `data-testid`) → Should be HIGH stability
- [ ] Select feature card (Tailwind only) → Should be MEDIUM/LOW with warning
- [ ] Select email input (has `name` attribute) → Should use `input[name="email"]`
- [ ] Try a CORS-blocked site → Should show error message gracefully
- [ ] Use manual input → Should validate in real-time
- [ ] Create a test → Should save all selectors to database

---

Happy testing! 🚀
