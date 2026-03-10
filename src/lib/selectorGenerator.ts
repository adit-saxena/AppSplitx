/**
 * Smart CSS Selector Generator
 * Generates stable, reliable CSS selectors that work with Tailwind and other frameworks
 */

export interface SelectorResult {
    primary: string;
    fallbacks: string[];
    stability: 'high' | 'medium' | 'low';
    matchCount?: number;
    warnings: string[];
}

/**
 * Check if a class name is a Tailwind utility class
 */
function isTailwindUtility(className: string): boolean {
    const tailwindPatterns = [
        // Layout & Spacing
        /^(container|box-|block|inline|flex|grid|table|hidden|float-|clear-|object-|overflow-|overscroll-|position|top-|right-|bottom-|left-|visible|invisible|z-)/,
        // Flexbox & Grid
        /^(flex-|grid-|gap-|justify-|items-|content-|self-|place-|auto-cols-|auto-rows-|col-|row-)/,
        // Sizing
        /^(w-|min-w-|max-w-|h-|min-h-|max-h-)/,
        // Spacing
        /^(p-|px-|py-|pt-|pr-|pb-|pl-|m-|mx-|my-|mt-|mr-|mb-|ml-|space-)/,
        // Typography
        /^(text-|font-|leading-|tracking-|align-|whitespace-|break-|truncate|overflow-ellipsis|line-clamp-)/,
        // Backgrounds
        /^(bg-|from-|via-|to-|gradient-)/,
        // Borders
        /^(border-|rounded-|ring-|divide-)/,
        // Effects
        /^(shadow-|opacity-|mix-|blur-|brightness-|contrast-|grayscale|hue-|invert|saturate-|sepia|backdrop-)/,
        // Transitions & Animation
        /^(transition-|duration-|ease-|delay-|animate-)/,
        // Transforms
        /^(scale-|rotate-|translate-|skew-|origin-)/,
        // States (pseudo-classes)
        /^(hover:|focus:|active:|disabled:|visited:|first:|last:|odd:|even:|group-hover:|peer-)/,
        // Responsive
        /^(sm:|md:|lg:|xl:|2xl:)/,
        // Dark mode
        /^(dark:)/,
    ];

    return tailwindPatterns.some(pattern => pattern.test(className));
}

/**
 * Extract non-utility (semantic) class names
 */
function extractSemanticClasses(classNames: string): string[] {
    return classNames
        .split(/\s+/)
        .filter(cls => cls.length > 0 && !isTailwindUtility(cls));
}

/**
 * Generate text-based selector (for elements with unique short text)
 */
function generateTextSelector(element: Element): string | null {
    const text = element.textContent?.trim() || '';

    // Only use text if it's short and unique
    if (text.length > 0 && text.length < 50 && !/[<>{}[\]]/g.test(text)) {
        const escapedText = text.replace(/"/g, '\\"');
        return `${element.tagName.toLowerCase()}:has-text("${escapedText}")`;
    }

    return null;
}

/**
 * Generate selector based on position in DOM
 */
function generatePositionalSelector(element: Element, maxDepth: number = 4): string {
    const path: string[] = [];
    let current: Element | null = element;
    let depth = 0;

    while (current && depth < maxDepth) {
        let selector = current.tagName.toLowerCase();

        // Try to use semantic classes first
        if (current.className && typeof current.className === 'string') {
            const semanticClasses = extractSemanticClasses(current.className);
            if (semanticClasses.length > 0) {
                selector += `.${semanticClasses[0]}`;
            }
        }

        // Add nth-child only if needed for uniqueness
        const parent = current.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children);
            const sameTagSiblings = siblings.filter(
                sibling => sibling.tagName === current!.tagName
            );

            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);

        // Stop at body or unique identifiable parent
        if (current.tagName === 'BODY' || current.id) {
            break;
        }

        current = current.parentElement;
        depth++;
    }

    return path.join(' > ');
}

/**
 * Generate all possible selectors for an element with priority ordering
 */
export function generateSelectors(element: Element): SelectorResult {
    const selectors: { selector: string; priority: number; type: string }[] = [];
    const warnings: string[] = [];

    // Priority 1: data-testid or data-test
    if (element.getAttribute('data-testid')) {
        selectors.push({
            selector: `[data-testid="${element.getAttribute('data-testid')}"]`,
            priority: 100,
            type: 'data-attribute'
        });
    }

    if (element.getAttribute('data-test')) {
        selectors.push({
            selector: `[data-test="${element.getAttribute('data-test')}"]`,
            priority: 99,
            type: 'data-attribute'
        });
    }

    // Priority 2: Unique ID
    if (element.id) {
        selectors.push({
            selector: `#${element.id}`,
            priority: 90,
            type: 'id'
        });
    }

    // Priority 3: Name attribute (for form elements)
    if (element.getAttribute('name')) {
        const tag = element.tagName.toLowerCase();
        selectors.push({
            selector: `${tag}[name="${element.getAttribute('name')}"]`,
            priority: 85,
            type: 'name-attribute'
        });
    }

    // Priority 4: ARIA label
    if (element.getAttribute('aria-label')) {
        selectors.push({
            selector: `[aria-label="${element.getAttribute('aria-label')}"]`,
            priority: 80,
            type: 'aria-label'
        });
    }

    // Priority 5: Semantic classes (non-Tailwind)
    if (element.className && typeof element.className === 'string') {
        const semanticClasses = extractSemanticClasses(element.className);

        if (semanticClasses.length > 0) {
            selectors.push({
                selector: `.${semanticClasses[0]}`,
                priority: 70,
                type: 'semantic-class'
            });

            // Also try tag + class for more specificity
            selectors.push({
                selector: `${element.tagName.toLowerCase()}.${semanticClasses[0]}`,
                priority: 65,
                type: 'tag-class'
            });
        } else {
            warnings.push('Element only has Tailwind utility classes. Consider adding a semantic class or data-testid.');
        }
    }

    // Priority 6: Text content (for buttons, links, etc.)
    const textSelector = generateTextSelector(element);
    if (textSelector) {
        selectors.push({
            selector: textSelector,
            priority: 60,
            type: 'text-content'
        });
        warnings.push('Using text content for selection. This may break if the text changes.');
    }

    // Priority 7: Positional selector
    const positionalSelector = generatePositionalSelector(element);
    selectors.push({
        selector: positionalSelector,
        priority: 50,
        type: 'positional'
    });
    warnings.push('Positional selector used as fallback. This may break if the page structure changes.');

    // Sort by priority
    selectors.sort((a, b) => b.priority - a.priority);

    // Determine stability
    let stability: 'high' | 'medium' | 'low' = 'low';
    if (selectors[0].priority >= 90) {
        stability = 'high';
    } else if (selectors[0].priority >= 70) {
        stability = 'medium';
    }

    return {
        primary: selectors[0].selector,
        fallbacks: selectors.slice(1, 4).map(s => s.selector),
        stability,
        warnings: warnings.slice(0, 2) // Limit warnings
    };
}

/**
 * Validate a selector and return insights
 */
export function validateSelector(selector: string, context: Document = document): {
    isValid: boolean;
    matchCount: number;
    stability: 'high' | 'medium' | 'low';
    warnings: string[];
    suggestions: string[];
} {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let stability: 'high' | 'medium' | 'low' = 'medium';

    try {
        const matches = context.querySelectorAll(selector);
        const matchCount = matches.length;

        // Check for Tailwind utility classes
        if (/^\.(bg-|text-|p-|m-|w-|h-|flex-|grid-)/.test(selector)) {
            warnings.push('⚠️ This selector uses Tailwind utility classes');
            suggestions.push('Consider adding a data-testid attribute or using a semantic class');
            stability = 'low';
        }

        // Check for overly complex selectors
        const selectorParts = selector.split(/[\s>+~]/);
        if (selectorParts.length > 4) {
            warnings.push('⚠️ This selector is very specific and may be fragile');
            suggestions.push('Try to simplify by using a unique ID or data attribute');
            stability = 'low';
        }

        // Check for multiple matches
        if (matchCount > 1) {
            warnings.push(`⚠️ This selector matches ${matchCount} elements`);
            suggestions.push('Add more specificity or use a unique identifier');
        } else if (matchCount === 0) {
            warnings.push('❌ No elements found with this selector');
            suggestions.push('Check the selector syntax or verify the page content');
        } else {
            // Good selector
            if (selector.startsWith('[data-testid') || selector.startsWith('#')) {
                stability = 'high';
            }
        }

        return {
            isValid: matchCount > 0,
            matchCount,
            stability,
            warnings,
            suggestions
        };
    } catch (error) {
        return {
            isValid: false,
            matchCount: 0,
            stability: 'low',
            warnings: ['❌ Invalid CSS selector syntax'],
            suggestions: ['Check for special characters or syntax errors']
        };
    }
}

/**
 * Injectable script for iframe to enable element selection
 * This returns a string that can be injected into the iframe
 */
export function getInjectionScript(): string {
    return `
    (function() {
      // Prevent multiple injections
      if (window.__SPLITX_SELECTOR_ACTIVE__) return;
      window.__SPLITX_SELECTOR_ACTIVE__ = true;
      
      let hoveredElement = null;
      let selectedElement = null;
      const overlay = document.createElement('div');
      overlay.id = 'splitx-selector-overlay';
      overlay.style.cssText = 'position: absolute; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1); pointer-events: none; z-index: 999999; transition: all 0.1s ease;';
      document.body.appendChild(overlay);
      
      const tooltip = document.createElement('div');
      tooltip.id = 'splitx-selector-tooltip';
      tooltip.style.cssText = 'position: absolute; background: #1f2937; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-family: monospace; z-index: 1000000; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
      document.body.appendChild(tooltip);
      
      function getElementInfo(element) {
        let tag = element.tagName.toLowerCase();
        let info = tag;
        
        if (element.id) info += '#' + element.id;
        if (element.className) {
          const classes = element.className.toString().split(' ').filter(c => c.length > 0).slice(0, 2);
          if (classes.length > 0) info += '.' + classes.join('.');
        }
        
        return info;
      }
      
      function updateOverlay(element) {
        if (!element) {
          overlay.style.display = 'none';
          tooltip.style.display = 'none';
          return;
        }
        
        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = (window.scrollY + rect.top) + 'px';
        overlay.style.left = (window.scrollX + rect.left) + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        
        tooltip.style.display = 'block';
        tooltip.textContent = getElementInfo(element);
        tooltip.style.top = (window.scrollY + rect.top - 30) + 'px';
        tooltip.style.left = (window.scrollX + rect.left) + 'px';
      }
      
      function handleMouseMove(e) {
        if (e.target === overlay || e.target === tooltip) return;
        hoveredElement = e.target;
        updateOverlay(hoveredElement);
      }
      
      function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.target === overlay || e.target === tooltip) return;
        
        selectedElement = e.target;
        overlay.style.borderColor = '#10b981';
        overlay.style.background = 'rgba(16, 185, 129, 0.1)';
        
        // Send message to parent
        window.parent.postMessage({
          type: 'SPLITX_ELEMENT_SELECTED',
          element: {
            tagName: selectedElement.tagName,
            id: selectedElement.id,
            className: selectedElement.className,
            textContent: selectedElement.textContent?.substring(0, 100),
            attributes: Array.from(selectedElement.attributes).map(attr => ({
              name: attr.name,
              value: attr.value
            })),
            outerHTML: selectedElement.outerHTML.substring(0, 500)
          }
        }, '*');
        
        // Cleanup
        setTimeout(() => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('click', handleClick);
          document.body.style.cursor = '';
          overlay.remove();
          tooltip.remove();
          window.__SPLITX_SELECTOR_ACTIVE__ = false;
        }, 500);
      }
      
      document.body.style.cursor = 'crosshair';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      
      // Notify parent that script is ready
      window.parent.postMessage({ type: 'SPLITX_SELECTOR_READY' }, '*');
    })();
  `;
}
