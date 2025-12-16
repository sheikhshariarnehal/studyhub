"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, BookOpen, Users, CheckCircle, XCircle, BarChart3 } from "lucide-react"

export default function TestStudyToolsPage() {
  const [selectedType, setSelectedType] = useState("previous_questions")
  const [semesterConfig, setSemesterConfig] = useState({
    has_midterm: true,
    has_final: true
  })

  // Helper function to determine which fields should be shown based on study tool type
  const getStudyToolFieldConfig = (type: string) => {
    switch (type) {
      case "previous_questions":
        return {
          showTitle: true,
          showContentUrl: true,
          showDescription: false,
          showExamType: true,
          titlePlaceholder: "e.g., Previous Questions 2024",
          descriptionPlaceholder: ""
        }
      case "exam_note":
        return {
          showTitle: true,
          showContentUrl: true,
          showDescription: false,
          showExamType: true,
          titlePlaceholder: "e.g., Exam Notes - Chapter 1-5",
          descriptionPlaceholder: ""
        }
      case "syllabus":
        return {
          showTitle: true,
          showContentUrl: false,
          showDescription: true,
          showExamType: false,
          titlePlaceholder: "e.g., Course Syllabus",
          descriptionPlaceholder: "Describe the syllabus content, topics covered, etc."
        }
      case "mark_distribution":
        return {
          showTitle: true,
          showContentUrl: true,
          showDescription: false,
          showExamType: true,
          titlePlaceholder: "e.g., Mark Distribution Scheme",
          descriptionPlaceholder: ""
        }
      default:
        return {
          showTitle: true,
          showContentUrl: true,
          showDescription: true,
          showExamType: true,
          titlePlaceholder: "e.g., Study Material",
          descriptionPlaceholder: "Describe this study tool..."
        }
    }
  }

  // Get default exam type based on semester configuration
  const getDefaultExamType = () => {
    if (semesterConfig.has_midterm && semesterConfig.has_final) {
      return "both"
    } else if (semesterConfig.has_final) {
      return "final"
    } else if (semesterConfig.has_midterm) {
      return "midterm"
    } else {
      return "both" // fallback
    }
  }

  const getStudyToolIcon = (type: string) => {
    switch (type) {
      case "previous_questions":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "exam_note":
        return <BookOpen className="h-5 w-5 text-green-500" />
      case "syllabus":
        return <FileText className="h-5 w-5 text-purple-500" />
      case "mark_distribution":
        return <BarChart3 className="h-5 w-5 text-orange-500" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const fieldConfig = getStudyToolFieldConfig(selectedType)
  const defaultExamType = getDefaultExamType()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Study Tools Test Page</h1>
        <p className="text-muted-foreground">
          Test the dynamic study tools functionality with type-specific fields and automatic exam type selection
        </p>
      </div>

      {/* Semester Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Semester Configuration</CardTitle>
          <CardDescription>Configure semester exam settings to test automatic exam type selection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_midterm"
                checked={semesterConfig.has_midterm}
                onChange={(e) => setSemesterConfig(prev => ({ ...prev, has_midterm: e.target.checked }))}
              />
              <Label htmlFor="has_midterm">Has Midterm</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_final"
                checked={semesterConfig.has_final}
                onChange={(e) => setSemesterConfig(prev => ({ ...prev, has_final: e.target.checked }))}
              />
              <Label htmlFor="has_final">Has Final</Label>
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Auto-selected Exam Type:</strong> <Badge variant="outline">{defaultExamType}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Study Tool Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Study Tool Type Selection</CardTitle>
          <CardDescription>Select different types to see how fields change dynamically</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "previous_questions", label: "Previous Questions" },
              { value: "exam_note", label: "Exam Notes" },
              { value: "syllabus", label: "Syllabus" },
              { value: "mark_distribution", label: "Mark Distribution" }
            ].map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? "default" : "outline"}
                onClick={() => setSelectedType(type.value)}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                {getStudyToolIcon(type.value)}
                <span className="text-sm">{type.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStudyToolIcon(selectedType)}
            Dynamic Form Fields - {selectedType.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
          <CardDescription>Fields shown/hidden based on selected type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fieldConfig.showTitle && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Title * <CheckCircle className="h-4 w-4 text-green-500" />
                </Label>
                <Input placeholder={fieldConfig.titlePlaceholder} />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_questions">Previous Questions</SelectItem>
                  <SelectItem value="exam_note">Exam Notes</SelectItem>
                  <SelectItem value="syllabus">Syllabus</SelectItem>
                  <SelectItem value="mark_distribution">Mark Distribution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fieldConfig.showContentUrl && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Content URL <CheckCircle className="h-4 w-4 text-green-500" />
                </Label>
                <Input placeholder="https://..." />
              </div>
            )}

            {!fieldConfig.showContentUrl && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  Content URL <XCircle className="h-4 w-4 text-red-500" />
                </Label>
                <Input placeholder="https://..." disabled className="opacity-50" />
              </div>
            )}

            {fieldConfig.showExamType && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Exam Type <CheckCircle className="h-4 w-4 text-green-500" />
                  <Badge variant="secondary" className="text-xs">Auto: {defaultExamType}</Badge>
                </Label>
                <Select defaultValue={defaultExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm Only</SelectItem>
                    <SelectItem value="final">Final Only</SelectItem>
                    <SelectItem value="both">Both Exams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {!fieldConfig.showExamType && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  Exam Type <XCircle className="h-4 w-4 text-red-500" />
                </Label>
                <Select disabled>
                  <SelectTrigger className="opacity-50">
                    <SelectValue placeholder="Not applicable" />
                  </SelectTrigger>
                </Select>
              </div>
            )}
          </div>

          {fieldConfig.showDescription && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Description <CheckCircle className="h-4 w-4 text-green-500" />
              </Label>
              <Textarea placeholder={fieldConfig.descriptionPlaceholder} rows={3} />
            </div>
          )}

          {!fieldConfig.showDescription && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                Description <XCircle className="h-4 w-4 text-red-500" />
              </Label>
              <Textarea placeholder="Not shown for this type" disabled className="opacity-50" rows={3} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Syllabus Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Syllabus Content Preview
          </CardTitle>
          <CardDescription>Example of how syllabus content will be displayed in the content viewer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full mb-2">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Course Syllabus</h3>
              <p className="text-purple-600 dark:text-purple-300 font-medium">Sample Course</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-sm">
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1"># Course Overview</h4>
                  <p className="text-gray-700 dark:text-gray-300">This course covers fundamental concepts...</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">## Learning Objectives</h4>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Understand core principles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span className="text-gray-700 dark:text-gray-300">Apply theoretical knowledge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Summary */}
      <Card>
        <CardHeader>
          <CardTitle>✨ Enhanced Features Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">🎯 Automatic Exam Type Selection</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Both midterm & final → "both"</li>
                <li>• Only final → "final"</li>
                <li>• Only midterm → "midterm"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔧 Type-Specific Fields</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Previous Questions: Title + URL + Exam Type</li>
                <li>• Exam Notes: Title + URL + Exam Type</li>
                <li>• Syllabus: Title + Description → Stylish Text Display</li>
                <li>• Mark Distribution: Title + URL + Exam Type</li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold mb-2">🔧 Database Constraint Fixes</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Fixed `study_tools_type_check` constraint violation</li>
                <li>• Fixed `valid_content_url` constraint violation</li>
                <li>• Proper null handling for optional fields</li>
                <li>• Empty strings converted to null where appropriate</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🎨 Stylish Syllabus Display</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Beautiful gradient background design</li>
                <li>• Markdown-style formatting support</li>
                <li>• Headings, lists, and paragraphs</li>
                <li>• Professional typography and spacing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
