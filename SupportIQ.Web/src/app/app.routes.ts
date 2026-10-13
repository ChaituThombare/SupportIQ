import { Routes } from '@angular/router';

import { Auth } from './features/auth/pages/auth/auth';
import { CustomerDashboard } from './features/customer/pages/dashboard/dashboard';
import { CreateTicket } from './features/customer/pages/create-ticket/create-ticket';
import { TicketDetails } from './features/customer/pages/ticket-details/ticket-details';

export const routes: Routes = [
    {
        path: 'auth',
        component: Auth,
    },
    {
        path: 'customer/dashboard',
        component: CustomerDashboard,
    },
    {
        path: 'customer/ticket/new',
        component: CreateTicket,
    },
    {
        path: 'customer/tickets/:id',
        component: TicketDetails,
    },
    {
        path: '',
        redirectTo: 'auth',
        pathMatch: 'full',
    },
    {
        path: '**',
        redirectTo: 'auth',
    },
];
