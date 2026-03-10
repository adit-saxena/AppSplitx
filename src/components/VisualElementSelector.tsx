import { useState, useEffect, useRef } from 'react';
import { MousePointer, Loader2, CheckCircle2, AlertCircle, XCircle, Target, RefreshCw } from 'lucide-react';
import { generateSelectors, validateSelector, getInjectionScript, type SelectorResult } from '../lib/selectorGenerator';

interface VisualElementSelectorProps {
    pageUrl: string;
    onSelectorGenerated: (selector: string, fallbacks: string[], stability: string) => void;
    initialSelector?: string;
}

type LoadStatus = 'loading' | 'ready' | 'cors-error' | 'timeout' | 'error';
type SelectionMode = 'idle' | 'selecting' | 'selected';

export function VisualElementSelector({ pageUrl, onSelectorGenerated, initialSelector }: VisualElementSelectorProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('idle');
    const [selectorResult, setSelectorResult] = useState<SelectorResult | null>(null);
    const [manualSelector, setManualSelector] = useState(initialSelector || '');
    const [validationResult, setValidationResult] = useState<any>(null);
    const [useProxy, setUseProxy] = useState(false);

    useEffect(() => {
        // Reset on URL change
        setLoadStatus('loading');
        setSelectionMode('idle');
        setSelectorResult(null);

        // Timeout for iframe loading
        const timeout = setTimeout(() => {
            if (loadStatus === 'loading') {
                setLoadStatus('timeout');
            }
        }, 10000);

        // Listen for messages from iframe
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'SPLITX_SELECTOR_READY') {
                setLoadStatus('ready');
                setSelectionMode('selecting');
            }

            if (event.data.type === 'SPLITX_ELEMENT_SELECTED') {
                handleElementSelected(event.data.element);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('message', handleMessage);
        };
    }, [pageUrl]);

    const handleIframeLoad = () => {
        try {
            const iframe = iframeRef.current;
            if (!iframe || !iframe.contentWindow) return;

            // Try to access iframe document to check for CORS
            try {
                const iframeDoc = iframe.contentDocument;
                if (!iframeDoc) {
                    throw new Error('Cannot access iframe document');
                }

                // Inject selector script
                const script = iframeDoc.createElement('script');
                script.textContent = getInjectionScript();
                iframeDoc.body.appendChild(script);

            } catch (corsError) {
                // CORS error - offer proxy solution
                setLoadStatus('cors-error');
                console.error('CORS prevented iframe access:', corsError);
            }
        } catch (error) {
            setLoadStatus('error');
            console.error('Error loading iframe:', error);
        }
    };

    const handleIframeError = () => {
        setLoadStatus('error');
    };

    const handleElementSelected = (elementData: any) => {
        setSelectionMode('selected');

        // Reconstruct a pseudo-element for selector generation
        const pseudoElement = {
            tagName: elementData.tagName,
            id: elementData.id,
            className: elementData.className,
            textContent: elementData.textContent,
            getAttribute: (name: string) => {
                const attr = elementData.attributes.find((a: any) => a.name === name);
                return attr ? attr.value : null;
            },
            parentElement: null,
        } as unknown as Element;

        const result = generateSelectors(pseudoElement);
        setSelectorResult(result);
        setManualSelector(result.primary);

        // Notify parent component
        onSelectorGenerated(result.primary, result.fallbacks, result.stability);
    };

    const handleManualSelectorChange = (value: string) => {
        setManualSelector(value);

        // Validate in real-time if iframe is accessible
        try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentDocument) {
                const validation = validateSelector(value, iframe.contentDocument);
                setValidationResult(validation);

                if (validation.isValid && validation.matchCount === 1) {
                    onSelectorGenerated(value, [], validation.stability);
                }
            } else {
                // Basic validation without context
                const validation = validateSelector(value);
                setValidationResult(validation);
            }
        } catch (error) {
            console.error('Validation error:', error);
        }
    };

    const handleTryAgain = () => {
        setSelectionMode('idle');
        setSelectorResult(null);

        // Re-inject script
        try {
            const iframe = iframeRef.current;
            if (iframe && iframe.contentDocument) {
                const script = iframe.contentDocument.createElement('script');
                script.textContent = getInjectionScript();
                iframe.contentDocument.body.appendChild(script);
            }
        } catch (error) {
            console.error('Error re-injecting script:', error);
        }
    };

    const getProxyUrl = (url: string) => {
        // Using a simple CORS proxy - in production, you'd want your own proxy
        return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    };

    return (
        <div className="space-y-4">
            {/* Browser Preview */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Browser Chrome */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                    <div className="flex space-x-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>

                    <div className="flex-1 mx-4">
                        <div className="flex items-center px-3 py-1.5 bg-white rounded-md border border-gray-200 text-xs text-gray-500 max-w-md mx-auto">
                            <span className="truncate">{pageUrl || 'Loading...'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {loadStatus === 'ready' && selectionMode === 'selecting' && (
                            <div className="flex items-center text-xs font-medium text-blue-600 animate-pulse">
                                <Target className="w-4 h-4 mr-1" />
                                Click to select
                            </div>
                        )}
                        {selectionMode === 'selected' && (
                            <button
                                onClick={handleTryAgain}
                                className="flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Select Again
                            </button>
                        )}
                    </div>
                </div>

                {/* Iframe Container */}
                <div className="relative bg-gray-100 h-[400px]">
                    {loadStatus === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                            <p className="text-sm text-gray-600">Loading preview...</p>
                        </div>
                    )}

                    {loadStatus === 'cors-error' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10 p-8">
                            <div className="max-w-md text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-amber-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Preview Blocked by CORS</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    The website's security settings prevent us from loading it in a preview. You can either:
                                </p>
                                <div className="bg-white rounded-lg border border-gray-200 p-4 text-left space-y-3 mb-4">
                                    <div className="flex items-start space-x-2">
                                        <span className="text-lg">1️⃣</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Manual Input</p>
                                            <p className="text-xs text-gray-500">Enter CSS selector below using browser DevTools</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="text-lg">2️⃣</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Try Proxy (Beta)</p>
                                            <button
                                                onClick={() => setUseProxy(true)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                                            >
                                                Load via proxy →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(loadStatus === 'timeout' || loadStatus === 'error') && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 z-10 p-8">
                            <div className="max-w-md text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    {loadStatus === 'timeout' ? 'Loading Timeout' : 'Failed to Load'}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    We couldn't load the page preview. Please enter the CSS selector manually below.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Iframe */}
                    <iframe
                        ref={iframeRef}
                        src={useProxy ? getProxyUrl(pageUrl) : pageUrl}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts"
                        title="Page Preview"
                    />
                </div>
            </div>

            {/* Selector Result Display */}
            {selectorResult && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-green-900 mb-1">Element Selected!</h4>
                            <div className="bg-white rounded-lg p-3 mb-2 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Primary Selector</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectorResult.stability === 'high' ? 'bg-green-100 text-green-700' :
                                        selectorResult.stability === 'medium' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {selectorResult.stability} stability
                                    </span>
                                </div>
                                <code className="text-sm font-mono text-gray-900 block break-all">
                                    {selectorResult.primary}
                                </code>
                            </div>

                            {selectorResult.fallbacks.length > 0 && (
                                <details className="text-xs text-green-800">
                                    <summary className="cursor-pointer font-medium mb-2">
                                        {selectorResult.fallbacks.length} fallback selector{selectorResult.fallbacks.length > 1 ? 's' : ''} generated
                                    </summary>
                                    <div className="space-y-1 ml-4">
                                        {selectorResult.fallbacks.map((fallback, idx) => (
                                            <code key={idx} className="block font-mono text-xs text-gray-700">
                                                {fallback}
                                            </code>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {selectorResult.warnings.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {selectorResult.warnings.map((warning, idx) => (
                                        <p key={idx} className="text-xs text-amber-700 flex items-start space-x-1">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                            <span>{warning}</span>
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Selector Input */}
            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    CSS Selector
                    {loadStatus === 'ready' && !selectorResult && (
                        <span className="ml-2 text-xs font-normal text-blue-600">
                            (or click an element above)
                        </span>
                    )}
                </label>

                <div className="flex items-stretch">
                    <div className="bg-gray-100 px-4 py-3 border border-r-0 border-gray-200 rounded-l-xl flex items-center">
                        <span className="text-gray-500 font-mono text-sm">Selector:</span>
                    </div>
                    <input
                        type="text"
                        value={manualSelector}
                        onChange={(e) => handleManualSelectorChange(e.target.value)}
                        placeholder=".cta-button, #submit-btn, [data-testid='checkout']"
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none font-mono text-sm"
                    />
                </div>

                {/* Validation Feedback */}
                {validationResult && manualSelector && (
                    <div className={`mt-2 p-3 rounded-lg border ${validationResult.isValid && validationResult.matchCount === 1
                        ? 'bg-green-50 border-green-200'
                        : validationResult.isValid && validationResult.matchCount > 1
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-start space-x-2">
                            {validationResult.isValid && validationResult.matchCount === 1 ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                            ) : validationResult.isValid ? (
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium mb-1">
                                    {validationResult.isValid && validationResult.matchCount === 1
                                        ? '✓ Perfect! One element found'
                                        : validationResult.isValid && validationResult.matchCount > 1
                                            ? `${validationResult.matchCount} elements found`
                                            : validationResult.isValid && validationResult.matchCount === 0
                                                ? 'No elements found'
                                                : 'Invalid selector'}
                                </p>
                                {validationResult.warnings.map((warning: string, idx: number) => (
                                    <p key={idx} className="text-xs opacity-80">{warning}</p>
                                ))}
                                {validationResult.suggestions.map((suggestion: string, idx: number) => (
                                    <p key={idx} className="text-xs mt-1">💡 {suggestion}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Helper Text */}
                <div className="mt-2 flex items-start space-x-2">
                    <MousePointer className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">
                            <strong>Tip:</strong> Right-click any element on your website → Inspect → Copy selector.
                            For best results, use <code className="bg-gray-100 px-1 rounded">data-testid</code> attributes or unique IDs.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
