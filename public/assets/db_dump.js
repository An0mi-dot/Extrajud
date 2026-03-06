import { supabase } from './supabaseClient.js';

/**
 * DB Manager - Utilitário para consulta rápida de dados
 */

export const DBManager = {
    /**
     * Retorna todos os usuários cadastrados na tabela user_roles
     */
    async getAllUsersWithRoles() {
        const { data, error } = await supabase
            .from('user_roles')
            .select('*')
            .order('email');
        
        if (error) {
            console.error('[DB] Erro ao buscar usuários:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Retorna todos os registros de uma tabela específica
     * ATENÇÃO: Respeita as políticas RLS do Supabase.
     */
    async getFullTable(tableName) {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
            
        if (error) {
            console.error(`[DB] Erro na tabela ${tableName}:`, error);
            return null;
        }
        console.table(data);
        return data;
    },

    /**
     * Retorna lista de emails únicos encontrados em user_roles
     */
    async getEmailList() {
        const users = await this.getAllUsersWithRoles();
        return users.map(u => u.email);
    }
};

// Disponibiliza no escopo global para debug no console
window.DBManager = DBManager;
