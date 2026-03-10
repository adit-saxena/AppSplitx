import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, Play, Pause, Trophy, Users, MousePointer, Activity,
    Target, Lightbulb, GitBranch, BarChart3, CheckCircle, AlertTriangle, XCircle, Timer
} from 'lucide-react';

interface Variant {
    id: string;
    name: string;
    is_control: boolean;
    traffic_percentage: number;
    conversion_count?: number;
    visitor_count?: number;
}

interface TestDetail {
    id: string;
    name: string;
    status: 'draft' | 'running' | 'paused' | 'completed';
    page_url?: string;
    element_selector?: string;
    optimization_mode?: string;
    created_at: string;
    project: {
        domain: string;
        goal_type?: string;
    };
}

export function ExperimentDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [test, setTest] = useState<TestDetail | null>(null);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);

    // Derived State
    const [stage, setStage] = useState<'collection' | 'exploration' | 'confidence' | 'decision'>('collection');
    const [confidence, setConfidence] = useState(0);

    useEffect(() => {
        if (id) {
            fetchTestDetails();
        }
    }, [id]);

    const fetchTestDetails = async () => {
        try {
            const { data: testData, error: testError } = await supabase
                .from('tests')
                .select(`*, project:projects(domain, goal_type)`)
                .eq('id', id)
                .single();

            if (testError) throw testError;
            setTest(testData);

            const { data: variantData, error: varError } = await supabase
                .from('variants')
                .select('*')
                .eq('test_id', id);

            if (varError) throw varError;

            // Mock stats for demo purposes
            const variantsWithStats = variantData.map(v => ({
                ...v,
                visitor_count: Math.floor(Math.random() * 2000) + 50,
                conversion_count: Math.floor(Math.random() * 150)
            }));

            setVariants(variantsWithStats);
            calculateMetrics(variantsWithStats);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (vars: Variant[]) => {
        // Calculate max confidence
        const control = vars.find(v => v.is_control);
        if (!control || !control.visitor_count) return;

        const controlRate = control.conversion_count! / control.visitor_count;
        let maxConf = 0;
        let totalVisitors = 0;

        vars.forEach(v => {
            totalVisitors += v.visitor_count || 0;
            if (v.is_control || !v.visitor_count) return;

            const variantRate = v.conversion_count! / v.visitor_count;
            const se1 = Math.sqrt((controlRate * (1 - controlRate)) / control.visitor_count!);
            const se2 = Math.sqrt((variantRate * (1 - variantRate)) / v.visitor_count);
            const zScore = Math.abs((variantRate - controlRate) / Math.sqrt(se1 * se1 + se2 * se2));

            // Rough confidence mapping
            let conf = 0;
            if (zScore > 2.57) conf = 99;
            else if (zScore > 1.96) conf = 95;
            else if (zScore > 1.64) conf = 90;
            else conf = Math.floor(zScore * 40);

            if (conf > maxConf) maxConf = conf;
        });

        setConfidence(maxConf);

        // Determine Stage
        if (totalVisitors < 100) setStage('collection');
        else if (totalVisitors < 500 && maxConf < 80) setStage('exploration');
        else if (maxConf >= 80 && maxConf < 95) setStage('confidence');
        else if (maxConf >= 95) setStage('decision');
        else setStage('exploration');
    };

    const toggleStatus = async () => {
        if (!test) return;
        const newStatus = test.status === 'running' ? 'paused' : 'running';

        const { error } = await supabase
            .from('tests')
            .update({ status: newStatus })
            .eq('id', test.id);

        if (!error) {
            setTest({ ...test, status: newStatus });
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;
    if (!test) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Experiment not found</div>;

    const totalVisitors = variants.reduce((acc, v) => acc + (v.visitor_count || 0), 0);
    const totalConversions = variants.reduce((acc, v) => acc + (v.conversion_count || 0), 0);
    const avgConversionRate = totalVisitors ? (totalConversions / totalVisitors) * 100 : 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <button onClick={() => navigate('/dashboard')} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">{test.name}</h1>
                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${test.status === 'running'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {test.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                                    <span className="flex items-center"><Target className="w-3 h-3 mr-1" /> {test.page_url?.replace(/^https?:\/\//, '')}</span>
                                    <span className="flex items-center"><MousePointer className="w-3 h-3 mr-1" /> {test.element_selector}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={toggleStatus}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${test.status === 'running'
                                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    : 'bg-black text-white border-transparent hover:bg-gray-800'
                                    }`}
                            >
                                {test.status === 'running' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                {test.status === 'running' ? 'Pause' : 'Resume'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* 1. Overview Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Goal</div>
                        <div className="font-semibold text-gray-900 capitalize">{test.project.goal_type?.replace('_', ' ') || 'Conversion'}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Mode</div>
                        <div className="font-semibold text-gray-900 capitalize">{test.optimization_mode || 'Automated'}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Strategy</div>
                        <div className="font-semibold text-gray-900">Multi-Arm Bandit</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Total Traffic</div>
                        <div className="font-semibold text-gray-900">{totalVisitors.toLocaleString()} Visitors</div>
                    </div>
                </div>

                {/* 2. Hypothesis */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-blue-900 mb-1">System Hypothesis</h3>
                        <p className="text-blue-800 text-sm leading-relaxed">
                            Based on your goal, our AI predicts that simplifying the copy and increasing contrast on <span className="font-mono bg-blue-100/50 px-1 rounded">{test.element_selector}</span> will improve conversion rates by reducing cognitive load.
                        </p>
                    </div>
                </div>

                {/* 3. Progress Indicator */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-900">Experiment Progress</h3>
                        <span className="text-sm text-gray-500 font-medium">Confidence: <span className="text-black">{confidence}%</span></span>
                    </div>

                    <div className="relative">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                            <div style={{ width: stage === 'collection' ? '25%' : stage === 'exploration' ? '50%' : stage === 'confidence' ? '75%' : '100%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span className={stage === 'collection' ? 'text-black font-bold' : ''}>Data Collection</span>
                            <span className={stage === 'exploration' ? 'text-black font-bold' : ''}>Exploration</span>
                            <span className={stage === 'confidence' ? 'text-black font-bold' : ''}>Confidence Building</span>
                            <span className={stage === 'decision' ? 'text-black font-bold' : ''}>Decision Ready</span>
                        </div>
                    </div>
                </div>

                {/* 4. Decision Panel (If Ready) */}
                {stage === 'decision' && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="bg-emerald-100 p-3 rounded-full">
                                    <Trophy className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-900">Winner Emerging!</h3>
                                    <p className="text-emerald-700">A variant is outperforming others with {confidence}% confidence.</p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button className="bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
                                    Keep Testing
                                </button>
                                <button className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold text-sm shadow-md transition-colors">
                                    Promote Winner
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Main Stats Grid (simplified) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Conversions" value={totalConversions.toLocaleString()} icon={CheckCircle} color="emerald" />
                    <StatCard label="Avg Conversion Rate" value={`${avgConversionRate.toFixed(2)}%`} icon={BarChart3} color="blue" />
                    <StatCard label="Improvement" value="+12.5%" icon={Activity} color="purple" />
                </div>

                {/* 6. Variants Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Variants Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Variant</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Visitors</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversions</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Delta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((variant) => {
                                    const rate = variant.visitor_count ? (variant.conversion_count! / variant.visitor_count) * 100 : 0;
                                    const control = variants.find(v => v.is_control);
                                    const controlRate = control && control.visitor_count ? (control.conversion_count! / control.visitor_count) * 100 : 0;
                                    const improvement = controlRate ? ((rate - controlRate) / controlRate) * 100 : 0;

                                    const isWinner = improvement > 0 && confidence > 80;
                                    const isLoser = improvement < -5;

                                    return (
                                        <tr key={variant.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-2 h-8 rounded-full mr-3 ${variant.is_control ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 flex items-center">
                                                            {variant.name}
                                                            {variant.is_control && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded border border-gray-200 uppercase tracking-wide">Control</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{variant.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isWinner ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        Leading
                                                    </span>
                                                ) : isLoser ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                        Underperforming
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                        Neutral
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                                {variant.visitor_count?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                                                {variant.conversion_count?.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                                {rate.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`font-medium ${improvement > 0 ? 'text-emerald-600' : improvement < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colorClasses: any = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center">
            <div className={`p-4 rounded-xl mr-5 ${colorClasses[color] || colorClasses.blue}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
