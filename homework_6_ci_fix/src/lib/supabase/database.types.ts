/**
 * Типы public.tasks по миграции 20261015000100_create_tasks.sql.
 * Клиент получает полный Database через createClient<Database>.
 */
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          completed: boolean;
          priority: "low" | "medium" | "high";
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string;
          completed?: boolean;
          priority?: "low" | "medium" | "high";
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string;
          completed?: boolean;
          priority?: "low" | "medium" | "high";
          created_at?: string;
        };
        // Межсхемные JOIN с auth.users в клиенте не используются;
        // внешний ключ остаётся в SQL-миграции и проверяется базой.
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type TasksRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TasksInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TasksUpdate = Database["public"]["Tables"]["tasks"]["Update"];
