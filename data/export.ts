import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Use service role to get all data (admin privilege)
        const { entities } = base44.asServiceRole;

        // Fetch ALL data from ALL entities
        const [
            projects,
            tasks,
            resources,
            baselines,
            calendars,
            taskRelationships,
            resourceAssignments,
            comments,
            scheduleSettings,
            floatPaths,
            scheduleLoops
        ] = await Promise.all([
            entities.Project.list(null, 1000).catch(() => []),
            entities.Task.list(null, 2000).catch(() => []),
            entities.Resource.list(null, 500).catch(() => []),
            entities.Baseline.list(null, 100).catch(() => []),
            entities.Calendar.list(null, 100).catch(() => []),
            entities.TaskRelationship.list(null, 1000).catch(() => []),
            entities.ResourceAssignment.list(null, 1000).catch(() => []),
            entities.Comment.list(null, 500).catch(() => []),
            entities.ScheduleSettings.list(null, 100).catch(() => []),
            entities.FloatPath.list(null, 500).catch(() => []),
            entities.ScheduleLoop.list(null, 500).catch(() => [])
        ]);

        // Create COMPLETE export data structure
        const exportData = {
            exported_at: new Date().toISOString(),
            exported_by: user.email,
            app_name: "Jizoni Project",
            app_version: "1.0",
            entities: {
                projects: projects || [],
                tasks: tasks || [],
                resources: resources || [],
                baselines: baselines || [],
                calendars: calendars || [],
                task_relationships: taskRelationships || [],
                resource_assignments: resourceAssignments || [],
                comments: comments || [],
                schedule_settings: scheduleSettings || [],
                float_paths: floatPaths || [],
                schedule_loops: scheduleLoops || []
            },
            summary: {
                total_projects: (projects || []).length,
                total_tasks: (tasks || []).length,
                total_resources: (resources || []).length,
                total_baselines: (baselines || []).length,
                total_calendars: (calendars || []).length,
                total_relationships: (taskRelationships || []).length,
                total_assignments: (resourceAssignments || []).length,
                total_comments: (comments || []).length,
                total_schedule_settings: (scheduleSettings || []).length,
                total_float_paths: (floatPaths || []).length,
                total_schedule_loops: (scheduleLoops || []).length
            }
        };

        // Convert to pretty-printed JSON
        const jsonData = JSON.stringify(exportData, null, 2);

        // Return as downloadable file
        return new Response(jsonData, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="jizoni-project-data-${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error) {
        console.error('Export Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});