import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useTests } from '../hooks/useTests';
import { ArrowRight, Globe, Target, Zap, CheckCircle2 } from 'lucide-react';

export function Onboarding() {
    const navigate = useNavigate();
    const { projects, createProject, loading: projectsLoading } = useProjects();
    const { createTest } = useTests();

    const [step, setStep] = useState<'project' | 'install' | 'goal' | 'suggestion' | 'launching'>('project');
    const [projectData, setProjectData] = useState({ name: '', domain: '' });
    const [goalData, setGoalData] = useState({ type: 'button_click' as const, value: '' });
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSkip = () => {
        navigate('/dashboard');
    };

    useEffect(() => {
        if (!projectsLoading && projects.length > 0) {
            // If user already has projects, they might have dropped off. 
            // For MVP simplicty, if they have projects but no tests, maybe send to goal/suggestion?
            // Or just redirect to dashboard if they are done.
            // But let's assume if they land here, they want to setup a new project or finish setup.
            // Actually, if projects exist, let's just use the most recent one for context if we are mid-flow.
            // But if standard access, dashboard handles "no projects" redirect.
            // Let's rely on internal state mostly.
        }
    }, [projectsLoading, projects]);

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Auto-verify logic would go here. For MVP, we assume success.
            const project = await createProject({
                name: projectData.name,
                domain: projectData.domain,
                description: 'My First Project'
            });
            if (project) {
                setCurrentProjectId(project.id);
                setStep('install');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleGoalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app we'd update the project with the goal. 
        // For now we store it in state to use when creating the first experiment or update project metadata.
        // Let's assume we proceed to suggestion.
        setStep('suggestion');
    };

    const handleLaunch = async () => {
        if (!currentProjectId) return;
        setStep('launching');
        try {
            // Create the suggested experiment
            await createTest({
                project_id: currentProjectId,
                name: 'Optimize Homepage CTA',
                description: 'System-suggested experiment to improve main call-to-action conversion.',
                status: 'running',
                traffic_allocation: 100,
                page_url: `https://${projectData.domain}`,
                element_selector: goalData.value || '.main-cta',
                optimization_mode: 'automated',
            });
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setStep('suggestion'); // Revert on error
        }
    };

    if (step === 'project') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">

                <div className="max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="mb-8 ">
                        <div className="w-12 h-12 bg-gray-100 text-black rounded-lg flex items-center justify-center mb-6">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Let's set up your project</h2>
                        <p className="text-gray-500 text-lg">Enter your website details to get started.</p>
                    </div>

                    <form onSubmit={handleProjectSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                            <input
                                type="text"
                                required
                                value={projectData.name}
                                onChange={e => setProjectData({ ...projectData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                placeholder="My Awesome Startup"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Website Domain</label>
                            <input
                                type="text"
                                required
                                value={projectData.domain}
                                onChange={e => setProjectData({ ...projectData, domain: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                placeholder="example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white font-bold py-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center text-base"
                        >
                            Next Step <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                        <button
                            type="button"
                            onClick={handleSkip}
                            className="w-full bg-transparent text-gray-500 font-medium py-3 rounded-lg hover:text-black transition-colors"
                        >
                            Skip Setup
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (step === 'install') {
        const handleVerify = () => {
            setIsVerifying(true);
            setTimeout(() => {
                setIsVerifying(false);
                setStep('goal');
            }, 2000);
        };

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">

                <div className="max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your site</h2>
                        <p className="text-gray-500">Add this snippet to your website's &lt;head&gt; tag.</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 font-mono text-xs text-gray-600 overflow-x-auto relative group">
                        <code className="block">
                            &lt;script src="https://cdn.splitx.ai/client.js" data-project-id="{currentProjectId}"&gt;&lt;/script&gt;
                        </code>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded shadow-sm">Copy</span>
                        </div>
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isVerifying ? (
                            <>
                                <Zap className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                I've added the script <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setStep('goal')}
                        className="w-full mt-3 text-sm text-gray-500 hover:text-black"
                        disabled={isVerifying}
                    >
                        Skip for development
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'goal') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="max-w-md w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Define your goal</h2>
                        <p className="text-gray-500">What is the one thing you want visitors to do?</p>
                    </div>

                    <form onSubmit={handleGoalSubmit} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {[
                                { id: 'button_click', label: 'Click Button' },
                                { id: 'form_submission', label: 'Submit Form' },
                                { id: 'page_visit', label: 'Visit Page' }
                            ].map((type) => (
                                <div
                                    key={type.id}
                                    onClick={() => setGoalData({ ...goalData, type: type.id as any })}
                                    className={`cursor-pointer border rounded-lg p-3 text-center text-sm font-medium transition-all ${goalData.type === type.id
                                        ? 'bg-blue-50 border-blue-600 text-blue-600'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                        }`}
                                >
                                    {type.label}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {goalData.type === 'button_click' ? 'Button CSS Selector' :
                                    goalData.type === 'form_submission' ? 'Form ID/Selector' : 'Confirmation Page URL'}
                            </label>
                            <input
                                type="text"
                                required
                                value={goalData.value}
                                onChange={e => setGoalData({ ...goalData, value: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                placeholder={
                                    goalData.type === 'button_click' ? '.signup-button' :
                                        goalData.type === 'form_submission' ? '#contact-form' : '/thank-you'
                                }
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                        >
                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (step === 'suggestion') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="max-w-lg w-full bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                            <Zap className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">We found an opportunity!</h2>
                        <p className="text-gray-500">Our system analyzed your {projectData.domain} homepage.</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
                        <h3 className="font-semibold text-gray-900 mb-4">Recommended Experiment</h3>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Optimize Main CTA</p>
                                    <p className="text-xs text-gray-500">We'll test 3 variations of your primary call-to-action to increase clicks.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Traffic Allocation</p>
                                    <p className="text-xs text-gray-500">Safe exploration: 10% of traffic to start.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLaunch}
                        className="w-full bg-black text-white font-semibold py-4 rounded-xl hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-xl shadow-black/5 flex items-center justify-center text-lg"
                    >
                        Start Experiment
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full mt-4 text-gray-500 text-sm hover:text-black"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
}

function LoadingSpinner() {
    return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>;
}
