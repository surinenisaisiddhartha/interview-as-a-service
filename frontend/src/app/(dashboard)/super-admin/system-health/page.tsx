'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metriccard';
import { Activity, Server, Database, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

const services = [
    { name: 'API Gateway', status: 'operational', latency: '12ms', uptime: '99.99%' },
    { name: 'AI Inference Engine', status: 'operational', latency: '184ms', uptime: '99.95%' },
    { name: 'Database Cluster', status: 'operational', latency: '4ms', uptime: '100%' },
    { name: 'Media Processing', status: 'degraded', latency: '820ms', uptime: '98.2%' },
    { name: 'Notification Service', status: 'operational', latency: '23ms', uptime: '99.97%' },
];

export default function SystemHealthPage() {
    const operational = services.filter(s => s.status === 'operational').length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
                <p className="text-gray-500">Real-time infrastructure and service monitoring.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Overall Status" value={operational === services.length ? 'All Good' : 'Degraded'} icon={Activity} color={operational === services.length ? 'green' : 'orange'} />
                <MetricCard label="Services Up" value={`${operational}/${services.length}`} icon={Server} color="blue" />
                <MetricCard label="Avg Latency" value="208ms" icon={Cpu} color="indigo" />
                <MetricCard label="Incidents (30d)" value="2" icon={AlertTriangle} color="orange" />
            </div>

            <Card>
                <CardHeader title="Service Status" subtitle="Live status for all platform services" />
                <div className="divide-y divide-gray-100">
                    {services.map((service) => (
                        <div key={service.name} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${service.status === 'operational' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <div className="flex items-center space-x-8 text-sm">
                                <span className="text-gray-400">Latency: <span className="font-bold text-gray-700">{service.latency}</span></span>
                                <span className="text-gray-400">Uptime: <span className="font-bold text-gray-700">{service.uptime}</span></span>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${service.status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {service.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
