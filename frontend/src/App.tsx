import React, { useState, useEffect } from 'react';
import { Camera, Mic, Shield, CheckCircle, AlertTriangle, User, BookOpen } from 'lucide-react';
import ProctoringComponent from "./components/ProctoringComponent";
import CertificateDisplay from "./components/CertificateDisplay";

interface TestResult {
  finalScore: number;
  behaviorScore: number;
  testScore: number;
  certificateStatus: string;
  violations: any[];
  detailedReport?: any;
}

const ExamProctoringApp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'setup' | 'proctoring' | 'results'>('setup');
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [mediaPermissions, setMediaPermissions] = useState({
    camera: false,
    microphone: false
  });
  const [setupComplete, setSetupComplete] = useState(false);

  // Check media permissions
  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setMediaPermissions({
        camera: true,
        microphone: true
      });
      
      // Stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Media permission error:', error);
      setMediaPermissions({
        camera: false,
        microphone: false
      });
      return false;
    }
  };

  // Initialize setup
  useEffect(() => {
    checkMediaPermissions();
  }, []);

  const handleStartTest = () => {
    if (userId && courseId && mediaPermissions.camera && mediaPermissions.microphone) {
      setSetupComplete(true);
      setCurrentStep('proctoring');
    }
  };

  const handleTestComplete = (finalScore: number, certificateStatus: string) => {
    const result: TestResult = {
      finalScore,
      behaviorScore: 85, // This would come from the proctoring component
      testScore: 90, // This would come from actual test results
      certificateStatus,
      violations: [], // This would come from the proctoring component
      detailedReport: null
    };
    
    setTestResult(result);
    setCurrentStep('results');
  };

  const handleRetakeTest = () => {
    setCurrentStep('setup');
    setTestResult(null);
    setSetupComplete(false);
  };

  const handleBackToSetup = () => {
    setCurrentStep('setup');
  };

  if (currentStep === 'proctoring') {
    return (
      <ProctoringComponent
        userId={userId}
        courseId={courseId}
        onTestComplete={handleTestComplete}
        testDuration={60}
      />
    );
  }

  if (currentStep === 'results' && testResult) {
    return (
      <CertificateDisplay
        result={testResult}
        userId={userId}
        courseId={courseId}
        onRetakeTest={handleRetakeTest}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-accent" />
            <h1 className="text-2xl font-bold text-dark-text">LearnQuest Exam Proctoring</h1>
          </div>
          <div className="text-sm text-dark-text-muted">
            Secure Online Testing Platform
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-dark-text">Exam Setup</h2>
          <p className="text-dark-text-muted text-lg">
            Please complete the setup process before starting your exam
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-8">
          {/* Step 1: User Information */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-6 w-6 text-blue-accent" />
              <h3 className="text-xl font-semibold text-dark-text">Step 1: User Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-text-muted mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:border-blue-accent text-dark-text placeholder-dark-text-secondary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-text-muted mb-2">
                  Course ID
                </label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="Enter course ID"
                  className="w-full px-4 py-2 bg-dark-surface border border-dark-border rounded-lg focus:outline-none focus:border-blue-accent text-dark-text placeholder-dark-text-secondary"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Media Permissions */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Camera className="h-6 w-6 text-blue-accent" />
              <h3 className="text-xl font-semibold text-dark-text">Step 2: Media Permissions</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-surface border border-dark-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Camera className="h-5 w-5 text-blue-accent" />
                  <span className="text-dark-text">Camera Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  {mediaPermissions.camera ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-error" />
                  )}
                  <span className={mediaPermissions.camera ? 'text-success' : 'text-error'}>
                    {mediaPermissions.camera ? 'Granted' : 'Required'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-dark-surface border border-dark-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mic className="h-5 w-5 text-blue-accent" />
                  <span className="text-dark-text">Microphone Access</span>
                </div>
                <div className="flex items-center space-x-2">
                  {mediaPermissions.microphone ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-error" />
                  )}
                  <span className={mediaPermissions.microphone ? 'text-success' : 'text-error'}>
                    {mediaPermissions.microphone ? 'Granted' : 'Required'}
                  </span>
                </div>
              </div>
            </div>
            
            {(!mediaPermissions.camera || !mediaPermissions.microphone) && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning rounded-lg">
                <div className="flex items-center space-x-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Media Access Required</span>
                </div>
                <p className="text-sm text-dark-text-muted mt-2">
                  Please allow camera and microphone access to continue with the exam.
                  Click "Check Permissions" to retry.
                </p>
                <button
                  onClick={checkMediaPermissions}
                  className="mt-3 bg-warning hover:bg-warning/80 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Check Permissions
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Exam Rules */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-6 w-6 text-blue-accent" />
              <h3 className="text-xl font-semibold text-dark-text">Step 3: Exam Rules</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-accent rounded-full mt-2"></div>
                <span className="text-dark-text">Ensure you are in a quiet, well-lit environment</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-accent rounded-full mt-2"></div>
                <span className="text-dark-text">Keep your face visible to the camera at all times</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-accent rounded-full mt-2"></div>
                <span className="text-dark-text">Do not switch tabs or minimize the browser window</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-accent rounded-full mt-2"></div>
                <span className="text-dark-text">Do not communicate with others during the exam</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-accent rounded-full mt-2"></div>
                <span className="text-dark-text">Any violations will result in score penalties</span>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={handleStartTest}
              disabled={!userId || !courseId || !mediaPermissions.camera || !mediaPermissions.microphone}
              className={`px-8 py-4 rounded-lg font-semibold text-lg ${
                userId && courseId && mediaPermissions.camera && mediaPermissions.microphone
                  ? 'bg-blue-primary hover:bg-blue-secondary text-white'
                  : 'bg-dark-surface text-dark-text-secondary cursor-not-allowed'
              }`}
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamProctoringApp;
