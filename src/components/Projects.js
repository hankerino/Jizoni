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
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600 mt-1">Manage all your projects.</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </motion.div>
        <div>
          {filteredProjects.map(project => (
            <div key={project.id}>
              <h2>{project.name}</h2>
              <p>{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
