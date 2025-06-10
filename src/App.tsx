import { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2, 
  Shield, 
  Zap, 
  FileCode, 
  Eye, 
  EyeOff,
  Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Badge } from './components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from './components/ui/alert';
import { cn } from './lib/utils';

// Supported file extensions and their language names
const SUPPORTED_EXTENSIONS: Record<string, string> = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.jsx': 'React JSX',
  '.tsx': 'React TSX',
  '.py': 'Python',
  '.java': 'Java',
  '.cpp': 'C++',
  '.c': 'C',
  '.go': 'Go',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.rs': 'Rust',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.cs': 'C#',
};

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Severity levels for issues
const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Issue categories
const CATEGORIES = {
  SYNTAX: 'Syntax',
  LOGIC: 'Logic',
  QUALITY: 'Quality',
  SECURITY: 'Security',
  PERFORMANCE: 'Performance',
};

// Interface for analysis results
interface AnalysisSummary {
  totalIssues: number;
  syntaxErrors: number;
  logicIssues: number;
  qualityIssues: number;
  securityIssues: number;
  performanceIssues: number;
  overallScore: number;
}

interface AnalysisIssue {
  id: number;
  lineNumber: string | number;
  severity: string;
  category: string;
  description: string;
  suggestion: string;
  codeExample?: string;
}

interface AnalysisResults {
  summary: AnalysisSummary;
  issues: AnalysisIssue[];
}

function App() {
  // State for API key
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  // State for file upload
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLanguage, setFileLanguage] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string>('');
  
  // State for analysis
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [analysisError, setAnalysisError] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Load API key from local storage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('deepseekApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to local storage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('deepseekApiKey', apiKey);
    }
  }, [apiKey]);

  // Handle file selection
  const handleFileChange = (selectedFile: File) => {
    setFileError('');
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds the maximum limit of 5MB`);
      return;
    }
    
    // Check file extension
    const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;
    if (!Object.keys(SUPPORTED_EXTENSIONS).includes(fileExtension)) {
      setFileError(`Unsupported file type. Supported types: ${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`);
      return;
    }
    
    // Set file and language
    setFile(selectedFile);
    setFileLanguage(SUPPORTED_EXTENSIONS[fileExtension as keyof typeof SUPPORTED_EXTENSIONS] || 'Unknown');
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      setFileError('Error reading file');
    };
    reader.readAsText(selectedFile);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Clear file and results
  const handleClearFile = () => {
    setFile(null);
    setFileContent('');
    setFileLanguage('');
    setAnalysisResults(null);
    setAnalysisError('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear API key
  const handleClearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('deepseekApiKey');
  };

  // Analyze code using Deepseek API
  const analyzeCode = async () => {
    if (!apiKey) {
      setAnalysisError('Please enter your Deepseek API key');
      return;
    }
    
    if (!fileContent) {
      setAnalysisError('Please upload a file to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisResults(null);
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-coder',
          messages: [
            {
              role: 'system',
              content: `You are an expert code reviewer. Analyze the following ${fileLanguage} code for:
              1. Syntax errors
              2. Logic issues
              3. Code quality improvements
              4. Security vulnerabilities
              5. Performance optimizations
              
              Provide a detailed analysis with specific line numbers, severity levels (low, medium, high, critical),
              clear explanations of each issue, and suggested fixes with code examples.
              Format your response as JSON with the following structure:
              {
                "summary": {
                  "totalIssues": number,
                  "syntaxErrors": number,
                  "logicIssues": number,
                  "qualityIssues": number,
                  "securityIssues": number,
                  "performanceIssues": number,
                  "overallScore": number (0-100)
                },
                "issues": [
                  {
                    "id": number,
                    "lineNumber": number or range like "10-15",
                    "severity": "low" | "medium" | "high" | "critical",
                    "category": "Syntax" | "Logic" | "Quality" | "Security" | "Performance",
                    "description": "Clear description of the issue",
                    "suggestion": "How to fix it",
                    "codeExample": "Code example of the fix (if applicable)"
                  }
                ]
              }`
            },
            {
              role: 'user',
              content: fileContent
            }
          ],
          temperature: 0.1,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Parse the JSON response from the assistant's message
      try {
        const resultText = data.choices[0].message.content;
        const jsonMatch = resultText.match(/```json\n([\s\S]*?)\n```/) || resultText.match(/{[\s\S]*}/);
        const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : resultText;
        const parsedResults = JSON.parse(jsonContent);
        setAnalysisResults(parsedResults);
      } catch (parseError) {
        console.error('Error parsing results:', parseError);
        setAnalysisError('Error parsing analysis results. Please try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(`Error analyzing code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get severity badge variant
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case SEVERITY.LOW:
        return <Badge variant="secondary">{severity}</Badge>;
      case SEVERITY.MEDIUM:
        return <Badge className="bg-yellow-500 text-white">{severity}</Badge>;
      case SEVERITY.HIGH:
        return <Badge className="bg-orange-500 text-white">{severity}</Badge>;
      case SEVERITY.CRITICAL:
        return <Badge variant="destructive">{severity}</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case CATEGORIES.SYNTAX:
        return <Code2 className="h-4 w-4" />;
      case CATEGORIES.LOGIC:
        return <AlertCircle className="h-4 w-4" />;
      case CATEGORIES.QUALITY:
        return <CheckCircle2 className="h-4 w-4" />;
      case CATEGORIES.SECURITY:
        return <Shield className="h-4 w-4" />;
      case CATEGORIES.PERFORMANCE:
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Download analysis results as JSON
  const downloadResults = () => {
    if (!analysisResults) return;
    
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `code-review-${file?.name || 'results'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Code2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Code Review Tool</h1>
        </div>
        <p className="text-muted-foreground">
          Upload your code and get AI-powered analysis and improvement suggestions
        </p>
      </header>

      <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-12">
        {/* API Key Section */}
        <Card className="md:col-span-12">
          <CardHeader className="pb-3">
            <CardTitle>Deepseek API Key</CardTitle>
            <CardDescription>
              Enter your Deepseek API key to analyze code. Your key is stored locally and never sent to our servers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={handleClearApiKey}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle>Upload Code</CardTitle>
            <CardDescription>
              Drag and drop your code file or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={dropAreaRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 transition-colors",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {file ? file.name : 'Drop your code file here or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported formats: {Object.keys(SUPPORTED_EXTENSIONS).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max size: 5MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleInputChange}
                  accept={Object.keys(SUPPORTED_EXTENSIONS).join(',')}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleButtonClick}
                >
                  Select File
                </Button>
              </div>
            </div>

            {fileError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            {file && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fileLanguage} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearFile}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={analyzeCode} 
              disabled={!fileContent || !apiKey || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>Analyze Code</>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Code Display Section */}
        <Card className="md:col-span-6">
          <CardHeader>
            <CardTitle>Code Preview</CardTitle>
            <CardDescription>
              {fileLanguage ? `${fileLanguage} code` : 'Upload a file to see preview'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                value={fileContent}
                readOnly
                className="font-mono text-sm h-[400px] overflow-auto whitespace-pre"
                placeholder="Code will appear here after uploading a file"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results Section */}
        {analysisError && (
          <Card className="md:col-span-12 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Analysis Error</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{analysisError}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {analysisResults && (
          <>
            {/* Summary Card */}
            <Card className="md:col-span-12">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analysis Summary</span>
                  <Button variant="outline" size="sm" onClick={downloadResults}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Results
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Total Issues</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.totalIssues}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Syntax</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.syntaxErrors}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Logic</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.logicIssues}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Quality</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.qualityIssues}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Security</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.securityIssues}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-sm font-medium mb-1">Performance</p>
                    <p className="text-2xl font-bold">{analysisResults.summary.performanceIssues}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Overall Code Quality</p>
                    <p className="font-bold">{analysisResults.summary.overallScore}/100</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${analysisResults.summary.overallScore}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issues List */}
            <div className="md:col-span-12 space-y-4">
              <h2 className="text-xl font-bold">Detailed Issues</h2>
              
              {analysisResults.issues.map((issue) => (
                <Card key={issue.id} className="border-l-4" style={{
                  borderLeftColor: 
                    issue.severity === SEVERITY.CRITICAL ? 'rgb(239, 68, 68)' :
                    issue.severity === SEVERITY.HIGH ? 'rgb(249, 115, 22)' :
                    issue.severity === SEVERITY.MEDIUM ? 'rgb(234, 179, 8)' :
                    'rgb(100, 116, 139)'
                }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(issue.category)}
                        <CardTitle className="text-base">
                          Issue #{issue.id}: {issue.category} Issue
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Line {issue.lineNumber}</Badge>
                        {getSeverityBadge(issue.severity)}
                      </div>
                    </div>
                    <CardDescription>
                      {issue.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Suggestion:</h4>
                        <p className="text-sm">{issue.suggestion}</p>
                      </div>
                      
                      {issue.codeExample && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Code Example:</h4>
                          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                            {issue.codeExample}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          AI Code Review Tool powered by Deepseek AI
        </p>
        <p className="mt-1">
          Upload your code for instant analysis and improvement suggestions
        </p>
      </footer>
    </div>
  );
}

export default App;
