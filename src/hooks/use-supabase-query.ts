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
            setError(null);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                let query = supabase.from(table).select('*').eq('user_id', user.id);

                if (queryFn) {
                    query = queryFn(query);
                }

                // Add timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Query timeout - possible RLS issue')), 15000)
                );

                const { data: result, error: queryError } = await Promise.race([
                    query,
                    timeoutPromise
                ]) as any;

                if (queryError) {
                    console.error(`Supabase error for ${table}:`, queryError);
                    
                    // If it's a missing table or RLS error, don't block the UI
                    if (queryError.code === '42P01' || queryError.code === 'PGRST116' || 
                        queryError.message?.includes('relation') || 
                        queryError.message?.includes('policy')) {
                        console.warn(`${table} table not ready or RLS not configured`);
                        setData([]);
                        setError(null); // Don't show error to user for missing tables
                    } else {
                        setError(queryError);
                        setData([]);
                    }
                } else {
                    setData(result as T[]);
                    setError(null);
                }
            } catch (err: any) {
                console.error(`Error fetching from ${table}:`, err);
                
                // Check if it's a timeout
                if (err.message?.includes('timeout')) {
                    setError({ 
                        message: 'Query timeout - check RLS policies in Supabase',
                        code: 'TIMEOUT'
                    });
                } else {
                    setError(err);
                }
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Setup real-time subscription without problematic filters
        // Just listen to changes and refetch data - don't try to filter in subscription
        const subscription = supabase
            .channel(`${table}_changes_${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: table },
                () => {
                    // Refetch to apply RLS filters properly
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
