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
