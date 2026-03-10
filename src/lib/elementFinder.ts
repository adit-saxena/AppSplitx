/**
 * Runtime Element Finder for SplitX Tests
 * 
 * This utility should be included in your injection script that runs on the user's website.
 * It handles selector fallback logic to ensure tests continue working even if selectors change.
 */

interface TestConfig {
    element_selector: string;
    fallback_selectors?: string[];
    selector_stability?: 'high' | 'medium' | 'low';
}

/**
 * Find an element using primary selector and fallbacks
 * 
 * @param config - Test configuration with selectors
 * @returns The found element or null
 */
export function findTestElement(config: TestConfig): Element | null {
    // Try primary selector
    try {
        const element = document.querySelector(config.element_selector);
        if (element) {
            console.log('[SplitX] Element found with primary selector:', config.element_selector);
            return element;
        }
    } catch (error) {
        console.warn('[SplitX] Primary selector failed:', config.element_selector, error);
    }

    // Try fallback selectors
    if (config.fallback_selectors && config.fallback_selectors.length > 0) {
        for (let i = 0; i < config.fallback_selectors.length; i++) {
            const fallbackSelector = config.fallback_selectors[i];

            try {
                const element = document.querySelector(fallbackSelector);
                if (element) {
                    console.warn(
                        `[SplitX] Primary selector failed, using fallback #${i + 1}:`,
                        fallbackSelector
                    );

                    // Log to analytics that fallback was used
                    logSelectorFallback(config.element_selector, fallbackSelector, i + 1);

                    return element;
                }
            } catch (error) {
                console.warn('[SplitX] Fallback selector failed:', fallbackSelector, error);
            }
        }
    }

    // All selectors failed
    console.error('[SplitX] All selectors failed for test. Config:', config);
    logSelectorFailure(config);

    return null;
}

/**
 * Find multiple elements (for tests targeting repeated elements)
 */
export function findTestElements(config: TestConfig): Element[] {
    const selectors = [
        config.element_selector,
        ...(config.fallback_selectors || [])
    ];

    for (const selector of selectors) {
        try {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length > 0) {
                return elements;
            }
        } catch (error) {
            console.warn('[SplitX] Selector failed:', selector, error);
        }
    }

    return [];
}

/**
 * Wait for element to appear (for dynamic content)
 * 
 * @param config - Test configuration
 * @param timeout - Max wait time in ms (default: 10000)
 * @returns Promise that resolves to element or null
 */
export function waitForTestElement(
    config: TestConfig,
    timeout: number = 10000
): Promise<Element | null> {
    return new Promise((resolve) => {
        // Try immediately first
        const element = findTestElement(config);
        if (element) {
            resolve(element);
            return;
        }

        // Set up observer
        const observer = new MutationObserver(() => {
            const element = findTestElement(config);
            if (element) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout
        const timeoutId = setTimeout(() => {
            observer.disconnect();
            console.error('[SplitX] Element not found within timeout:', config);
            resolve(null);
        }, timeout);
    });
}

/**
 * Validate that a selector will work before using it
 */
export function validateSelector(selector: string): {
    valid: boolean;
    matchCount: number;
    error?: string;
} {
    try {
        const elements = document.querySelectorAll(selector);
        return {
            valid: true,
            matchCount: elements.length
        };
    } catch (error) {
        return {
            valid: false,
            matchCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Log selector fallback usage to analytics
 */
function logSelectorFallback(
    primarySelector: string,
    usedFallback: string,
    fallbackIndex: number
) {
    // Send to your analytics
    if (typeof window !== 'undefined' && (window as any).splitxAnalytics) {
        (window as any).splitxAnalytics.track('selector_fallback_used', {
            primary_selector: primarySelector,
            used_fallback: usedFallback,
            fallback_index: fallbackIndex,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Log selector failure to analytics
 */
function logSelectorFailure(config: TestConfig) {
    // Send to your analytics
    if (typeof window !== 'undefined' && (window as any).splitxAnalytics) {
        (window as any).splitxAnalytics.track('selector_failure', {
            primary_selector: config.element_selector,
            fallback_selectors: config.fallback_selectors,
            selector_stability: config.selector_stability,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
}

// ===========================================
// USAGE EXAMPLES
// ===========================================

/**
 * Example 1: Basic usage in A/B test script
 */
export function exampleBasicUsage() {
    const testConfig: TestConfig = {
        element_selector: '[data-testid="checkout-cta"]',
        fallback_selectors: [
            '#checkout-button',
            '.checkout-button',
            'button:has-text("Checkout")'
        ],
        selector_stability: 'high'
    };

    const button = findTestElement(testConfig);

    if (button) {
        // Apply variant
        button.textContent = 'Buy Now - 20% Off!';
        button.style.backgroundColor = '#FF6B6B';
    } else {
        console.error('Could not find checkout button');
    }
}

/**
 * Example 2: Waiting for dynamic content
 */
export async function exampleWaitForElement() {
    const testConfig: TestConfig = {
        element_selector: '[data-testid="product-grid"]',
        fallback_selectors: ['.product-grid', '#products'],
        selector_stability: 'high'
    };

    const grid = await waitForTestElement(testConfig, 5000);

    if (grid) {
        // Modify grid layout
        grid.classList.add('splitx-variant-layout');
    }
}

/**
 * Example 3: Testing multiple elements
 */
export function exampleMultipleElements() {
    const testConfig: TestConfig = {
        element_selector: '[data-testid="product-card"]',
        fallback_selectors: ['.product-card'],
        selector_stability: 'medium'
    };

    const cards = findTestElements(testConfig);

    cards.forEach((card, index) => {
        // Apply staggered animation
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

/**
 * Example 4: Validation before using
 */
export function exampleValidation() {
    const selector = '[data-testid="hero-cta"]';
    const validation = validateSelector(selector);

    if (!validation.valid) {
        console.error('Invalid selector:', validation.error);
    } else if (validation.matchCount === 0) {
        console.warn('No elements found with selector:', selector);
    } else if (validation.matchCount > 1) {
        console.warn(`Selector matches ${validation.matchCount} elements`);
    } else {
        console.log('✓ Selector is valid and unique');
    }
}

// ===========================================
// INJECTION SCRIPT TEMPLATE
// ===========================================

/**
 * This is the template for the actual injection script
 * that would run on the user's website
 */
export const INJECTION_SCRIPT_TEMPLATE = `
(function() {
  'use strict';
  
  // Test configuration (replaced by server)
  const TEST_CONFIG = __TEST_CONFIG__;
  
  // Find element using fallback logic
  function findElement(config) {
    // Try primary
    let el = document.querySelector(config.element_selector);
    if (el) return el;
    
    // Try fallbacks
    for (const fallback of (config.fallback_selectors || [])) {
      el = document.querySelector(fallback);
      if (el) return el;
    }
    
    return null;
  }
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTest);
  } else {
    runTest();
  }
  
  function runTest() {
    const element = findElement(TEST_CONFIG);
    
    if (!element) {
      console.error('[SplitX] Element not found');
      return;
    }
    
    // Apply variant (example)
    if (TEST_CONFIG.variant === 'A') {
      element.textContent = TEST_CONFIG.variant_a_text;
      element.style.backgroundColor = TEST_CONFIG.variant_a_color;
    } else {
      element.textContent = TEST_CONFIG.variant_b_text;
      element.style.backgroundColor = TEST_CONFIG.variant_b_color;
    }
    
    // Track conversion
    element.addEventListener('click', () => {
      fetch('https://api.splitx.com/track/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: TEST_CONFIG.test_id,
          variant: TEST_CONFIG.variant
        })
      });
    });
  }
})();
`;

export default {
    findTestElement,
    findTestElements,
    waitForTestElement,
    validateSelector,
    INJECTION_SCRIPT_TEMPLATE
};
