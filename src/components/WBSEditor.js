import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Network,
  Plus,
  Bot,
  ChevronRight,
  ChevronDown,
  Clock,
  User,
  Trash2,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WBSEditor() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const [aiPrompt, setAiPrompt] = useState("");
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    wbs_code: "",
    parent_task_id: null,
    level: 1,
    start_date: "",
    end_date: "",
    duration_days: 1,
    status: "not_started",
    priority: "medium",
    assigned_to: ""
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks();
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const data = await Project.list("-updated_date");
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadTasks = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      const data = await Task.filter({ project_id: selectedProjectId }, "wbs_code");
      setTasks(data);
      // Automatically expand root tasks
      const rootTaskIds = data.filter(t => !t.parent_task_id).map(t => t.id);
      setExpandedTasks(new Set(rootTaskIds));
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
    setIsLoading(false);
  };

  const generateWBSWithAI = async () => {
    if (!aiPrompt.trim() || !selectedProjectId) return;

    setIsGenerating(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      const prompt = `Generate a detailed Work Breakdown Structure for the following construction/engineering project:

Project Name: ${project.name}
Project Description: ${project.description || 'No description provided'}
Project Type: ${project.project_type}
Additional Requirements: ${aiPrompt}

Create a hierarchical WBS with up to 3 levels:
- Level 1: Major phases (e.g., Design, Procurement, Construction, Commissioning)
- Level 2: Key deliverables or work packages (e.g., Foundation, Structural Steel)
- Level 3: Individual tasks or activities (e.g., Pour Concrete, Erect Beams)

For each item, provide:
- name: Clear, action-oriented task name.
- wbs_code: Hierarchical numbering (e.g., 1.1, 1.1.1).
- level: The hierarchy level (1, 2, or 3).
- duration_days: A realistic duration estimate in whole days.
- description: A brief description of the work involved.

Return as a JSON object with a single key "tasks" containing an array of these items.`;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  wbs_code: { type: "string" },
                  level: { type: "number" },
                  duration_days: { type: "number" },
                  description: { type: "string" },
                },
                required: ["name", "wbs_code", "level", "duration_days", "description"]
              }
            }
          }
        }
      });

      if (response.tasks) {
        const tasksToCreate = response.tasks.map(task => ({
            ...task,
            project_id: selectedProjectId,
            status: "not_started",
            priority: "medium",
          }));
        await Task.bulkCreate(tasksToCreate);
        setShowAIDialog(false);
        setAiPrompt("");
        loadTasks();
      }
    } catch (error) {
      console.error("Error generating WBS:", error);
    }
    setIsGenerating(false);
  };

  const handleSaveTask = async () => {
    try {
        const taskData = {
            ...newTask,
            project_id: selectedProjectId,
            duration_days: parseInt(newTask.duration_days) || 1,
            level: parseInt(newTask.level) || 1,
            parent_task_id: newTask.parent_task_id || null
        };

        if (editingTask) {
            await Task.update(editingTask.id, taskData);
        } else {
            await Task.create(taskData);
        }

        setShowTaskDialog(false);
        setEditingTask(null);
        resetNewTask();
        loadTasks();
    } catch (error) {
        console.error("Error saving task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task and all its sub-tasks?")) {
        try {
            // This is a simplified delete. A real implementation would recursively delete children.
            await Task.delete(taskId);
            loadTasks();
        } catch(error) {
            console.error("Error deleting task:", error);
        }
    }
  };

  const resetNewTask = () => {
    setNewTask({
      name: "",
      description: "",
      wbs_code: "",
      parent_task_id: null,
      level: 1,
      start_date: "",
      end_date: "",
      duration_days: 1,
      status: "not_started",
      priority: "medium",
      assigned_to: ""
    });
  };

  const toggleTaskExpansion = (taskId) => {
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">WBS Editor</h1>
        <Select onValueChange={setSelectedProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          {tasks.map(task => (
            <div key={task.id}>
              <h3>{task.name}</h3>
              <p>{task.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
