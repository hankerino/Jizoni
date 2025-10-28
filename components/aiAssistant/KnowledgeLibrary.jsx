import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ExternalLink, Trash2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KnowledgeLibrary({ projectId, onRefresh }) {
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [projectId, onRefresh]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const allDocs = await base44.entities.KnowledgeBase.list("-created_date", 100);
      const filtered = allDocs.filter(doc => 
        !projectId || doc.project_id === projectId || doc.project_id === null
      );
      setDocuments(filtered);
    } catch (error) {
      console.error("Error loading documents:", error);
      setDocuments([]);
    }
    setIsLoading(false);
  };

  const toggleActive = async (docId, currentStatus) => {
    try {
      await base44.entities.KnowledgeBase.update(docId, { is_active: !currentStatus });
      loadDocuments();
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const deleteDocument = async (docId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await base44.entities.KnowledgeBase.delete(docId);
        loadDocuments();
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const categoryColors = {
    standards: "bg-blue-100 text-blue-700",
    templates: "bg-green-100 text-green-700",
    regulations: "bg-red-100 text-red-700",
    lessons_learned: "bg-purple-100 text-purple-700",
    procedures: "bg-orange-100 text-orange-700",
    specifications: "bg-cyan-100 text-cyan-700",
    other: "bg-slate-100 text-slate-700"
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeDocsCount = documents.filter(doc => doc.is_active).length;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Knowledge Library
            <Badge className="bg-green-100 text-green-700">
              {activeDocsCount} Active
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents found</p>
            <p className="text-sm text-slate-400">Upload documentation to train Jz-Agent</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 border rounded-lg ${
                    doc.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
                        <Badge className={categoryColors[doc.category]}>
                          {doc.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{doc.description}</p>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {doc.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => toggleActive(doc.id, doc.is_active)}
                        title={doc.is_active ? "Disable" : "Enable"}
                      >
                        {doc.is_active ? 
                          <Eye className="w-3 h-3 text-green-600" /> : 
                          <EyeOff className="w-3 h-3 text-slate-400" />
                        }
                      </Button>
                      <a
                        href__={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7"
                          title="View Document"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-red-600 hover:bg-red-100"
                        onClick={() => deleteDocument(doc.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
