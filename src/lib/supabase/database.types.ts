export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          starts_on: string;
          ends_on: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          starts_on: string;
          ends_on?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          starts_on?: string;
          ends_on?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      planned_workouts: {
        Row: {
          id: string;
          user_id: string;
          training_plan_id: string;
          scheduled_for: string;
          week_number: number;
          day_number: number;
          title: string;
          notes: string | null;
          target_duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          training_plan_id: string;
          scheduled_for: string;
          week_number: number;
          day_number: number;
          title: string;
          notes?: string | null;
          target_duration_seconds?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          training_plan_id?: string;
          scheduled_for?: string;
          week_number?: number;
          day_number?: number;
          title?: string;
          notes?: string | null;
          target_duration_seconds?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      planned_exercises: {
        Row: {
          id: string;
          user_id: string;
          planned_workout_id: string;
          name: string;
          position: number;
          target_sets: number | null;
          target_reps: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          planned_workout_id: string;
          name: string;
          position: number;
          target_sets?: number | null;
          target_reps?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          planned_workout_id?: string;
          name?: string;
          position?: number;
          target_sets?: number | null;
          target_reps?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      training_goals: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          target_workouts: number | null;
          target_duration_seconds: number | null;
          target_volume_kg: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          week_start: string;
          target_workouts?: number | null;
          target_duration_seconds?: number | null;
          target_volume_kg?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          target_workouts?: number | null;
          target_duration_seconds?: number | null;
          target_volume_kg?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          goal_type: "exercise_target" | "weekly_workouts";
          title: string;
          exercise_name: string | null;
          target_weight_kg: number | null;
          target_reps: number | null;
          target_workouts: number | null;
          target_date: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          goal_type: "exercise_target" | "weekly_workouts";
          title: string;
          exercise_name?: string | null;
          target_weight_kg?: number | null;
          target_reps?: number | null;
          target_workouts?: number | null;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_type?: "exercise_target" | "weekly_workouts";
          title?: string;
          exercise_name?: string | null;
          target_weight_kg?: number | null;
          target_reps?: number | null;
          target_workouts?: number | null;
          target_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          planned_workout_id: string | null;
          title: string;
          notes: string | null;
          status: "in_progress" | "completed";
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          planned_workout_id?: string | null;
          title: string;
          notes?: string | null;
          status?: "in_progress" | "completed";
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          planned_workout_id?: string | null;
          title?: string;
          notes?: string | null;
          status?: "in_progress" | "completed";
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          name: string;
          position: number;
          target_sets: number | null;
          target_reps: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          workout_id: string;
          name: string;
          position: number;
          target_sets?: number | null;
          target_reps?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string;
          name?: string;
          position?: number;
          target_sets?: number | null;
          target_reps?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          exercise_id: string;
          set_number: number;
          reps: number;
          weight_kg: number;
          completed_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          set_number?: number;
          reps?: number;
          weight_kg?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
