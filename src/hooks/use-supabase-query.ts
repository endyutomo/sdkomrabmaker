'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/components/providers/supabase-provider';

export function useSupabaseQuery<T>(
    table: string,
    queryFn?: (query: any) => any,
    dependencies: any[] = []
) {
    const { supabase, user } = useSupabase();
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!user) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                let query = supabase.from(table).select('*').eq('user_id', user.id);

                if (queryFn) {
                    query = queryFn(query);
                }

                const { data, error } = await query;

                if (error) throw error;
                setData(data as T[]);
            } catch (err) {
                console.error(`Error fetching from ${table}:`, err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Setup real-time subscription
        const subscription = supabase
            .channel(`${table}_changes`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table, filter: `user_id=eq.${user.id}` },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, table, ...dependencies]);

    return { data, isLoading, error };
}
