import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useTests } from '../hooks/useTests';
import { ArrowLeft, Rocket, Wand2, Globe, MousePointer, CheckCircle2, ChevronRight, LayoutTemplate, Type, Palette, Sparkles } from 'lucide-react';
import { VisualElementSelector } from '../components/VisualElementSelector';

// Steps definition
const STEPS = [
    { number: 1, title: 'Target', icon: Globe },
    { number: 2, title: 'Select', icon: MousePointer },
    { number: 3, title: 'Optimize', icon: Wand2 },
];

export function ExperimentCreation() {
    const navigate = useNavigate();
    const { projects } = useProjects();
    const { createTest } = useTests();

    // Form State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        projectId: '',
        pageUrl: '',
        elementSelector: '',
        fallbackSelectors: [] as string[],
        selectorStability: 'medium' as 'high' | 'medium' | 'low',
        optimizationMode: 'automated' as 'automated' | 'manual',
        focus: 'copy' // copy, color, layout, mixed
    });

    // Launch State
    const [launchStatus, setLaunchStatus] = useState<'idle' | 'generating' | 'success'>('idle');
    const [launchMessage, setLaunchMessage] = useState('');

    // Pre-select project
    useEffect(() => {
        if (projects.length > 0 && !formData.projectId) {
            setFormData(prev => ({ ...prev, projectId: projects[0].id }));
        }
    }, [projects]);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleLaunch = async () => {
        setLaunchStatus('generating');

        try {
            // Sequence of fake loading states
            setLaunchMessage('Analyzing page structure...');
            await new Promise(r => setTimeout(r, 1500));

            setLaunchMessage('Generating AI variants...');
            await new Promise(r => setTimeout(r, 2000));

            setLaunchMessage('Configuring split tests...');
            await new Promise(r => setTimeout(r, 1000));

            // Actual Creation
            const newTest = await createTest({
                project_id: formData.projectId,
                name: `Optimization for ${formData.elementSelector}`,
                description: `Automated ${formData.focus} optimization`,
                status: 'running',
                traffic_allocation: 100,
                page_url: formData.pageUrl,
                element_selector: formData.elementSelector,
                fallback_selectors: formData.fallbackSelectors,
                selector_stability: formData.selectorStability,
                optimization_mode: formData.optimizationMode
            });

            setLaunchStatus('success');

            // Redirect after success animation
            setTimeout(() => {
                if (newTest && newTest.id) {
                    navigate(`/experiments/${newTest.id}`);
                } else {
                    navigate('/dashboard');
                }
            }, 2000);

        } catch (err) {
            console.error(err);
            setLaunchStatus('idle'); // potentially show error state
            alert('Failed to launch. Please try again.');
        }
    };

    if (launchStatus !== 'idle') {
        return <LaunchScreen status={launchStatus} message={launchMessage} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center">
                    <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-4">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">New Experiment</h1>
                </div>

                {/* Progress Stepper */}
                <div className="hidden md:flex items-center space-x-4">
                    {STEPS.map((s, idx) => (
                        <div key={s.number} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors ${step >= s.number ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-400'
                                }`}>
                                {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${step >= s.number ? 'text-gray-900' : 'text-gray-400'}`}>{s.title}</span>
                            {idx < STEPS.length - 1 && <div className="w-12 h-px bg-gray-200 mx-4" />}
                        </div>
                    ))}
                </div>

                <div className="w-24"></div> {/* Spacer balance */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex justify-center p-8">
                <div className="w-full max-w-2xl">
                    {step === 1 && (
                        <StepTarget
                            projects={projects}
                            formData={formData}
                            setFormData={setFormData}
                            onNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <StepSelector
                            formData={formData}
                            setFormData={setFormData}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {step === 3 && (
                        <StepOptimize
                            formData={formData}
                            setFormData={setFormData}
                            onLaunch={handleLaunch}
                            onBack={handleBack}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Steps Components ---

function StepTarget({ projects, formData, setFormData, onNext }: any) {
    const isReady = formData.projectId && formData.pageUrl;

    return (
        <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Where do you want to test?</h2>
            <p className="text-gray-500 mb-8">Select a project and the specific page URL you want to optimize.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Project</label>
                    <select
                        value={formData.projectId}
                        onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-shadow"
                    >
                        {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Page URL</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Globe className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="url"
                            value={formData.pageUrl}
                            onChange={e => setFormData({ ...formData, pageUrl: e.target.value })}
                            placeholder="https://yourwebsite.com/pricing"
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-shadow"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-10 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!isReady}
                    className="flex items-center bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-lg shadow-black/10"
                >
                    Continue <ChevronRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
}

function StepSelector({ formData, setFormData, onNext, onBack }: any) {
    const isReady = formData.elementSelector.length > 0;

    const handleSelectorGenerated = (selector: string, fallbacks: string[], stability: string) => {
        setFormData({
            ...formData,
            elementSelector: selector,
            fallbackSelectors: fallbacks,
            selectorStability: stability as 'high' | 'medium' | 'low'
        });
    };

    return (
        <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What are we changing?</h2>
            <p className="text-gray-500 mb-8">
                Click on the element you want to test, or enter a CSS selector manually.
            </p>

            <VisualElementSelector
                pageUrl={formData.pageUrl}
                onSelectorGenerated={handleSelectorGenerated}
                initialSelector={formData.elementSelector}
            />

            <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
                <button
                    onClick={onBack}
                    className="text-gray-600 hover:text-black font-medium px-4 py-2 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!isReady}
                    className="flex items-center bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] shadow-lg shadow-black/10"
                >
                    Continue <ChevronRight className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
}

function StepOptimize({ formData, setFormData, onLaunch, onBack }: any) {
    return (
        <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How should we optimize?</h2>
            <p className="text-gray-500 mb-8">Choose your strategy and let our AI handle the rest.</p>

            <div className="space-y-6 mb-8">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">Focus Area</label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'copy', label: 'Copywriting', icon: Type, desc: 'Headlines & text' },
                            { id: 'color', label: 'Style & Color', icon: Palette, desc: 'Colors & visual emphasis' },
                            { id: 'layout', label: 'Layout', icon: LayoutTemplate, desc: 'Spacing & arrangement' },
                            { id: 'mixed', label: 'Mixed Strategy', icon: Sparkles, desc: 'Combination of all' },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setFormData({ ...formData, focus: opt.id })}
                                className={`text-left p-4 rounded-xl border-2 transition-all ${formData.focus === opt.id
                                    ? 'border-black bg-gray-50 shadow-sm'
                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                    }`}
                            >
                                <opt.icon className={`w-6 h-6 mb-3 ${formData.focus === opt.id ? 'text-black' : 'text-gray-400'}`} />
                                <div className="font-semibold text-gray-900">{opt.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start space-x-3">
                    <Wand2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900">AI Auto-Pilot is On</h4>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            SplitX will automatically generate high-converting variants based on your current site content and industry best practices.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="text-gray-600 hover:text-black font-medium px-4 py-2"
                >
                    Back
                </button>
                <button
                    onClick={onLaunch}
                    className="flex items-center bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-900 hover:scale-[1.02] transition-all shadow-xl shadow-black/20"
                >
                    <Rocket className="w-5 h-5 mr-2" />
                    Launch Experiment
                </button>
            </div>
        </div>
    );
}

function LaunchScreen({ status, message }: { status: string, message: string }) {
    if (status === 'success') {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Experiment Live!</h2>
                <p className="text-gray-500">Redirecting to details...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-black animate-pulse" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">{message}</h2>
            <p className="text-sm text-gray-500">Please wait while we set up your environment</p>
        </div>
    );
}
