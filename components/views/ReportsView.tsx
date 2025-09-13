// This file was renamed to ReportsView.jsx to fix MIME type issues on static hosting.
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../contexts/AppContext.js';
import { formatNumber } from '../../utils/formatters.js';
import { toJalali, fromJalali } from '../../utils/dateUtils.js';
import { formatDuration } from '../../utils/timeUtils.js';
import KamaDatePicker from '../shared/KamaDatePicker.jsx';
import { analyzeReportData } from '../../services/geminiService.js';
import Modal from '../shared/Modal.jsx';
import { AiSparkleIcon } from '../shared/Icons.jsx';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, colorClass, icon }) => (
    <div className={`p-6 rounded-xl shadow-lg ${colorClass} text-white flex items-center gap-6`}>
        <div className="text-4xl opacity-80">{icon}</div>
        <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-4xl font-bold mt-1">{formatNumber(value)}</p>
        </div>
    </div>
);

const ReportsView = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("AppContext not found");
    const { orders, products, workflows } = context;

    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [aiAnalysis, setAiAnalysis] = useState({ loading: false, result: '', show: false });
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('all');
    const [showStepDurationTable, setShowStepDurationTable] = useState(false);

    const handleDateChange = (name, isoDate) => {
        setDateRange(prev => ({ ...prev, [name]: isoDate }));
    };

    const reportData = useMemo(() => {
        const filteredOrders = orders.filter(order => {
            if (selectedWorkflowId !== 'all' && order.workflowId !== selectedWorkflowId) {
                return false;
            }
            const orderDate = new Date(order.created_at);
            const start = dateRange.start ? new Date(dateRange.start) : null;
            const end = dateRange.end ? new Date(dateRange.end) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
        });

        let totalImports = 0;
        const importsOverTimeMap = new Map();
        const productSalesMap = new Map();
        const customerNames = new Set();
        const manufacturerImports = new Map();
        const stepDurationsMap = new Map();

        filteredOrders.forEach(order => {
            const workflow = workflows.find(wf => wf.id === order.workflowId);
            if (!workflow) return;

            // Customer Name Extraction
            workflow.steps.forEach(step => {
                const customerField = step.fields.find(f => f.name === 'customer_name');
                if (customerField) {
                    const customerNameVal = order.steps_data?.[step.id]?.data?.[customerField.name];
                    if (customerNameVal && typeof customerNameVal === 'string') customerNames.add(customerNameVal.trim());
                }
            });
            
            // Product, Sales, Weight, and Manufacturer Calculation
            let orderTotal = 0;
            // @FIX: Cast step to 'any' to allow access to 'data' property without a type error.
            Object.values(order.steps_data).forEach((step: any) => {
                for (const field of Object.values(step.data)) {
                    if (Array.isArray(field) && field[0]?.productId) {
                        (field).forEach(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (product) {
                                const price = Number(product.currencyPrice) || 0;
                                const itemTotal = price * item.quantity;
                                orderTotal += itemTotal;
                                const manufacturer = product.manufacturer || 'نامشخص';
                                manufacturerImports.set(manufacturer, (manufacturerImports.get(manufacturer) || 0) + itemTotal);
                                
                                const existing = productSalesMap.get(product.id) || { quantity: 0, name: product.name, totalWeight: 0 };
                                const netWeight = parseFloat(product.netWeight) || 0;
                                productSalesMap.set(product.id, {
                                    name: product.name,
                                    quantity: existing.quantity + item.quantity,
                                    totalWeight: existing.totalWeight + (netWeight * item.quantity)
                                });
                            }
                        });
                    }
                }
            });
            
            totalImports += orderTotal;
            const dateKey = toJalali(order.created_at);
            if (dateKey) importsOverTimeMap.set(dateKey, (importsOverTimeMap.get(dateKey) || 0) + orderTotal);

            // Step Duration Calculation
            for (let i = 0; i < workflow.steps.length - 1; i++) {
                const step1 = workflow.steps[i];
                const step2 = workflow.steps[i+1];
                const t1 = order.steps_data?.[step1.id]?.completed_at;
                const t2 = order.steps_data?.[step2.id]?.completed_at;
                if(t1 && t2) {
                    const duration = new Date(t2).getTime() - new Date(t1).getTime();
                    const key = `${step1.title} → ${step2.title}`;
                    const existing = stepDurationsMap.get(key) || [];
                    stepDurationsMap.set(key, [...existing, duration]);
                }
            }
        });

        const importsOverTime = Array.from(importsOverTimeMap.entries()).map(([date, amount]) => ({ date, "واردات": amount })).sort((a, b) => new Date(fromJalali(a.date)).getTime() - new Date(fromJalali(b.date)).getTime());
        const topProductsByWeight = Array.from(productSalesMap.values()).sort((a, b) => b.totalWeight - a.totalWeight).slice(0, 10);
        
        const sortedManufacturers = Array.from(manufacturerImports.entries())
            .map(([name, amount]) => ({ name, value: amount }))
            .sort((a, b) => b.value - a.value);
        
        const topManufacturers = sortedManufacturers.slice(0, 5);
        const otherValue = sortedManufacturers.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        const importsByManufacturer = [...topManufacturers];
        if (otherValue > 0) {
            importsByManufacturer.push({ name: 'سایر', value: otherValue });
        }

        const stepDurations = Array.from(stepDurationsMap.entries()).map(([name, durations]) => {
            const count = durations.length;
            const totalDuration = durations.reduce((a, b) => a + b, 0);
            const avgDuration = totalDuration / count;
            return {
                name,
                "ساعت": parseFloat((avgDuration / (1000 * 60 * 60)).toFixed(2)),
                avgMs: avgDuration,
                minMs: Math.min(...durations),
                maxMs: Math.max(...durations),
                count,
            };
        });

        return { totalOrders: filteredOrders.length, totalImports, uniqueCustomers: customerNames.size, importsOverTime, topProductsByWeight, importsByManufacturer, stepDurations };
    }, [orders, products, workflows, dateRange, selectedWorkflowId]);
    
    const handleAiAnalysis = async () => {
        setAiAnalysis({ loading: true, result: '', show: true });
        const analysisResult = await analyzeReportData(reportData);
        setAiAnalysis({ loading: false, result: analysisResult, show: true });
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent === 0) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };
    
    // @FIX: Added 'any' type to props to handle props passed by recharts library.
    const ChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200">
                    <p className="label font-semibold">{`${label}`}</p>
                    <p className="intro text-blue-600 font-medium">{`${payload[0].name} : ${formatNumber(payload[0].value)}`}</p>
                </div>
            );
        }
        return null;
    };

    const avgOverallDuration = reportData.stepDurations.reduce((acc, curr) => acc + curr.avgMs, 0) / (reportData.stepDurations.length || 1);
    const durationColors = (durationMs) => {
        if (durationMs > avgOverallDuration * 1.5) return '#FF8042'; // Bottleneck - Orange/Red
        if (durationMs > avgOverallDuration * 0.8) return '#FFBB28'; // Average - Yellow
        return '#0088FE'; // Fast - Blue
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <div></div>
                 <button onClick={handleAiAnalysis} disabled={aiAnalysis.loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                    <AiSparkleIcon className="h-5 w-5" />
                    {aiAnalysis.loading ? "در حال تحلیل..." : "تحلیل با هوش مصنوعی"}
                </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-md mb-8">
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">فرآیند:</label>
                    <select
                        value={selectedWorkflowId}
                        onChange={(e) => setSelectedWorkflowId(e.target.value)}
                        className="p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 min-w-[180px]"
                    >
                        <option value="all">همه فرآیندها</option>
                        {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">از:</label>
                    {/* @FIX: Added the required 'error' prop to KamaDatePicker. */}
                    <div className="w-40"><KamaDatePicker name="start_date_report" value={dateRange.start || ''} onChange={(e) => handleDateChange('start', e.target.value)} error={false} /></div>
                </div>
                <div className="flex items-center gap-2">
                     <label className="text-sm font-medium text-gray-600">تا:</label>
                    {/* @FIX: Added the required 'error' prop to KamaDatePicker. */}
                    <div className="w-40"><KamaDatePicker name="end_date_report" value={dateRange.end || ''} onChange={(e) => handleDateChange('end', e.target.value)} error={false} /></div>
                </div>
                <button onClick={() => setDateRange({start: null, end: null})} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">پاک کردن</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard title="مجموع واردات" value={reportData.totalImports} colorClass="bg-gradient-to-br from-blue-500 to-blue-600" icon={<span>$</span>} />
                <StatCard title="تعداد سفارشات" value={reportData.totalOrders} colorClass="bg-gradient-to-br from-green-500 to-green-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                <StatCard title="مشتریان یکتا" value={reportData.uniqueCustomers} colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
            </div>
            
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">روند واردات</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData.importsOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Line type="monotone" dataKey="واردات" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">واردات بر اساس تولیدکننده</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={reportData.importsByManufacturer} 
                                    cx="50%" 
                                    cy="50%" 
                                    labelLine={false} 
                                    label={renderCustomizedLabel}
                                    outerRadius={110} 
                                    fill="#8884d8" 
                                    dataKey="value" 
                                    nameKey="name"
                                >
                                    {reportData.importsByManufacturer.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => [formatNumber(value), 'واردات']} />
                                <Legend wrapperStyle={{fontSize: "12px"}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="bg-white p-6 rounded-xl shadow-lg">
                         <h3 className="text-xl font-semibold mb-4 text-gray-800">کالاهای پر حجم (بر اساس وزن خالص Kg)</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.topProductsByWeight} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={150} 
                                    tick={{ fontSize: 12 }} 
                                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 18)}...` : value}
                                />
                                <Tooltip formatter={(value) => [formatNumber(value), 'Kg']} cursor={{fill: 'rgba(239, 246, 255, 0.7)'}} />
                                <Bar dataKey="totalWeight" fill="#82ca9d" barSize={30} name="وزن کل" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h3 className="text-xl font-semibold text-gray-800">تحلیل زمانی فرآیند</h3>
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                            <button onClick={() => setShowStepDurationTable(false)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${!showStepDurationTable ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>نمودار</button>
                            <button onClick={() => setShowStepDurationTable(true)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${showStepDurationTable ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>جدول</button>
                        </div>
                    </div>

                    {reportData.stepDurations.length === 0 ? (
                        <p className="text-center py-10 text-gray-500">داده‌ای برای نمایش تحلیل زمانی وجود ندارد.</p>
                    ) : showStepDurationTable ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['مرحله گذار', 'میانگین زمان', 'حداقل زمان', 'حداکثر زمان', 'تعداد سفارشات'].map(h =>
                                            <th key={h} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.stepDurations.map(item => (
                                        <tr key={item.name}>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700 font-semibold">{formatDuration(item.avgMs)}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">{formatDuration(item.minMs)}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">{formatDuration(item.maxMs)}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={reportData.stepDurations} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(value) => `${value} ساعت`} />
                                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} interval={0} />
                                {/* @FIX: Convert value to number before calling toFixed to prevent type errors. */}
                                <Tooltip formatter={(value) => [Number(value).toFixed(2), 'ساعت']} cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }} />
                                <Bar dataKey="ساعت" name="میانگین زمان" barSize={30}>
                                    {reportData.stepDurations.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={durationColors(entry.avgMs)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            
            <Modal show={aiAnalysis.show} onClose={() => setAiAnalysis(p => ({...p, show: false}))} maxWidth="max-w-3xl">
                <div className="p-2">
                    <h2 className="text-2xl font-bold mb-4 text-indigo-700 flex items-center gap-2">
                        <AiSparkleIcon className="h-6 w-6" />
                        تحلیل هوشمند گزارش
                    </h2>
                    {aiAnalysis.loading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">در حال دریافت تحلیل از هوش مصنوعی...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis.result.replace(/\n/g, '<br />') }}>
                        </div>
                    )}
                    <button onClick={() => setAiAnalysis(p => ({...p, show: false}))} className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors">بستن</button>
                </div>
            </Modal>
        </div>
    );
};

export default ReportsView;