import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function DocumentUpload({ projectId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other",
    tags: "",
    project_id: projectId || null
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    if (!formData.title.trim()) {
      alert("Please enter a title");
      return;
    }

    setUploading(true);
    setSuccess(false);

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: selectedFile
      });

      const fileUrl = uploadResult.file_url;

      let contentSummary = "";
      try {
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: fileUrl,
          json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              key_points: { type: "array", items: { type: "string" } }
            }
          }
        });

        if (extractResult.status === "success" && extractResult.output) {
          contentSummary = extractResult.output.summary || "";
          if (extractResult.output.key_points) {
            contentSummary += "\n\nKey Points:\n" + extractResult.output.key_points.join("\n");
          }
        }
      } catch (error) {
        console.log("Could not extract content, using basic info");
        contentSummary = `Uploaded document: ${selectedFile.name}`;
      }

      const tags = formData.tags.split(",").map(tag => tag.trim()).filter(Boolean);
      
      await base44.entities.KnowledgeBase.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        file_url: fileUrl,
        content_summary: contentSummary,
        tags: tags,
        project_id: formData.project_id,
        is_active: true
      });

      setSuccess(true);
      setFormData({
        title: "",
        description: "",
        category: "other",
        tags: "",
        project_id: projectId || null
      });
      setSelectedFile(null);

      if (onUploadComplete) {
        onUploadComplete();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    }

    setUploading(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Upload Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {selectedFile && (
            <p className="text-xs text-slate-500">Selected: {selectedFile.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., OSHA Safety Standards 2024"
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the document..."
            rows={2}
            disabled={uploading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={uploading}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standards">Standards</SelectItem>
                <SelectItem value="templates">Templates</SelectItem>
                <SelectItem value="regulations">Regulations</SelectItem>
                <SelectItem value="lessons_learned">Lessons Learned</SelectItem>
                <SelectItem value="procedures">Procedures</SelectItem>
                <SelectItem value="specifications">Specifications</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="safety, offshore, subsea"
              disabled={uploading}
            />
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading & Processing...
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Uploaded Successfully!
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </>
          )}
        </Button>

        {success && (
          <p className="text-sm text-green-600 text-center">
            Document uploaded and will be used as context for Jz-Agent
          </p>
        )}
      </CardContent>
    </Card>
  );
}
