import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

import { Auth } from './features/auth/pages/auth/auth';
import { CustomerDashboard } from './features/customer/pages/dashboard/dashboard';
import { CreateTicket } from './features/customer/pages/create-ticket/create-ticket';
import { TicketDetails } from './features/customer/pages/ticket-details/ticket-details';
import { Workspace } from './features/agent/pages/workspace/workspace';
import { TicketWorkspace } from './features/agent/pages/ticket-workspace/ticket-workspace';
import { AdminWorkspace } from './features/admin/pages/admin-workspace/admin-workspace';
import { AgentManagement } from './features/admin/pages/agent-management/agent-management';
import { ReportsAnalytics } from './features/admin/pages/reports-analytics/reports-analytics';

export const routes: Routes = [
    // auth
    {
        path: 'auth',
        component: Auth,
    },
    // customer
    {
        path: 'customer/dashboard',
        component: CustomerDashboard,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['customer'] },
    },
    {
        path: 'customer/ticket/new',
        component: CreateTicket,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['customer'] },
    },
    {
        path: 'customer/tickets/:id',
        component: TicketDetails,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['customer'] },
    },
    // agent
    {
        path: 'agent/workspace',
        component: Workspace,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['agent'] },
    },
    {
        path: 'agent/tickets/:id',
        component: TicketWorkspace,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['agent'] },
    },
    // admin
    {
        path: 'admin/workspace',
        component: AdminWorkspace,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
    },
    {
        path: 'admin/reports',
        component: ReportsAnalytics,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
    },
    // default route
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full',
    },
    {
        path: 'admin/agents',
        component: AgentManagement,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
    },
    {
        path: '**',
        redirectTo: 'auth',
    },
];
