import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category{
    id: number;
    name: string;
    description: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
    private readonly http = inject(HttpClient);

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${environment.apiUrl}/Categories`);
    }
}
