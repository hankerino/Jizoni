# Jizoni


import React, { useState, useEffect } from "react";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FolderKanban,
  CheckSquare, 
  Users, 
  TrendingUp, 
  Plus,
  Search,
  HardHat
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import ProjectCard from "../components/dashboard/ProjectCard";
import ActivityFeed from "../components/dashboard/ActivityFeed";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, tasksData] = await Promise.all([
        Project.list("-updated_date", 10),
        Task.list("-updated_date", 50)
      ]);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setProjects([]);
      setTasks([]);
    }
    setIsLoading(false);
  };

  const getStats = () => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTeamMembers = projects.reduce((sum, p) => sum + (p.team_size || 0), 0);
    
    const onScheduleProjects = projects.filter(p => {
        if (!p.end_date || !p.start_date) return p.status === 'completed';
        if (p.status === 'completed') return true;
        const totalDuration = new Date(p.end_date) - new Date(p.start_date);
        const elapsedDuration = new Date() - new Date(p.start_date);
        const expectedCompletion = (elapsedDuration / totalDuration) * 100;
        return (p.completion_percentage || 0) >= expectedCompletion - 10;
    }).length;

    const onSchedulePercentage = projects.length > 0 
      ? Math.round((onScheduleProjects / projects.length) * 100) 
      : 0;

    return {
      activeProjects,
      totalTasks,
      completedTasks,
      totalTeamMembers,
      onSchedulePercentage
    };
  };

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl(`ProjectDetails?id=${projectId}`));
  };

  const stats = getStats();
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Overview of your engineering and construction projects.</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("Projects")}>
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Projects"
            value={stats.activeProjects}
            subtitle="Currently in progress"
            icon={FolderKanban}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            delay={0}
            onClick={() => navigate(createPageUrl('Projects?status=active'))}
          />
          <StatsCard
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completedTasks} completed`}
            icon={CheckSquare}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            delay={0.1}
            onClick={() => navigate(createPageUrl('WBSEditor'))}
          />
          <StatsCard
            title="Total Resources"
            value={stats.totalTeamMembers}
            subtitle="Across all projects"
            icon={Users}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            delay={0.2}
            onClick={() => navigate(createPageUrl('Resources'))}
          />
          <StatsCard
            title="On Schedule"
            value={`${stats.onSchedulePercentage}%`}
            subtitle="Projects on track"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            delay={0.3}
            onClick={() => navigate(createPageUrl('Scheduling'))}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Recent Projects</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/50 rounded-xl h-48 border border-slate-200"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredProjects.slice(0, 6).map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    delay={index * 0.1}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>
            )}

            {filteredProjects.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <HardHat className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No projects found</h3>
                <p className="text-slate-500 mb-4">Get started by creating your first project</p>
                <Link to={createPageUrl("Projects")}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <ActivityFeed tasks={tasks} projects={projects} />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Project } from "@/entities/Project";
import { Task } from "@/entities/Task";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Filter, Calendar, DollarSign, Bot, Edit, Trash2, Eye, TrendingUp, FolderKanban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    budget: "",
    status: "planning",
    priority: "medium",
    team_size: 1,
    project_manager: "",
    project_type: "construction",
    site_location: ""
  });

  useEffect(() => {
    loadProjects();
    loadCurrentUser();
    loadAllTasks();

    const params = new URLSearchParams(location.search);
    const statusFromUrl = params.get('status');
    if (statusFromUrl && statusFromUrl !== filterStatus) {
      setFilterStatus(statusFromUrl);
    } else if (!statusFromUrl && filterStatus !== 'all') {
      setFilterStatus('all');
    }
  }, [location.search]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await Project.list("-updated_date");
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
    setIsLoading(false);
  };

  const loadAllTasks = async () => {
    try {
      const data = await Task.list("-updated_date", 1000); 
      setTasks(data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setNewProject(prev => ({ ...prev, project_manager: user.full_name }));
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectData = {
        ...newProject,
        budget: newProject.budget ? parseFloat(newProject.budget) : 0,
        team_size: parseInt(newProject.team_size) || 1
      };
      
      if (editingProject) {
        await Project.update(editingProject.id, projectData);
      } else {
        await Project.create(projectData);
      }
      
      setShowCreateDialog(false);
      setEditingProject(null);
      resetForm();
      loadProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      alert('Failed to save project. Please try again.');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject({ ...project });
    setShowCreateDialog(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await Project.delete(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        console.error("Error deleting project:", error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setNewProject({
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      budget: "",
      status: "planning",
      priority: "medium",
      team_size: 1,
      project_manager: currentUser?.full_name || "",
      project_type: "construction",
      site_location: ""
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length
  };

  // AI Insights calculations
  const getAIInsights = () => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const projectTasks = tasks.filter(task => 
      activeProjects.some(project => project.id === task.project_id)
    );
    
    const overdueTasks = projectTasks.filter(task => 
      task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed'
    );

    const highPriorityTasks = projectTasks.filter(task => 
      task.priority === 'critical' || task.priority === 'high'
    );

    return {
      activeProjectsCount: activeProjects.length,
      overdueTasksCount: overdueTasks.length,
      highPriorityTasksCount: highPriorityTasks.length,
      avgCompletion: activeProjects.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / (activeProjects.length || 1)
    };
  };

  const aiInsights = getAIInsights();

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="animate-pulse h-12 w-1/3 bg-slate-200 rounded"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 border border-slate-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
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
 
