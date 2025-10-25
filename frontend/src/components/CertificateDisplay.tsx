import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Download, Share, Eye, AlertTriangle } from 'lucide-react';

interface TestResult {
  finalScore: number;
  behaviorScore: number;
  testScore: number;
  certificateStatus: string;
  violations: any[];
  detailedReport?: any;
}

interface CertificateDisplayProps {
  result: TestResult;
  userId: string;
  courseId: string;
  onRetakeTest: () => void;
}

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  result,
  userId,
  courseId,
  onRetakeTest
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isEligible = result.certificateStatus === 'issued';
  const scoreColor = isEligible ? 'text-green-400' : 'text-error';
  const borderColor = isEligible ? 'border-green-400' : 'border-red-400';

  const downloadCertificate = async () => {
    setIsDownloading(true);
    try {
      // Generate certificate PDF (this would be implemented with a PDF library)
      const certificateData = {
        userId,
        courseId,
        finalScore: result.finalScore,
        behaviorScore: result.behaviorScore,
        testScore: result.testScore,
        certificateStatus: result.certificateStatus,
        issuedDate: new Date().toISOString()
      };

      // Create a simple text-based certificate for demo
      const certificateText = `
LEARNQUEST CERTIFICATION

Certificate of Completion

This certifies that ${userId} has successfully completed the ${courseId} course
with the following results:

Final Score: ${result.finalScore}%
Behavior Score: ${result.behaviorScore}%
Test Score: ${result.testScore}%

Certificate Status: ${result.certificateStatus.toUpperCase()}
Issued Date: ${new Date().toLocaleDateString()}

${isEligible ? 'CONGRATULATIONS! You have earned this certificate.' : 'Certificate not issued due to insufficient score.'}
      `;

      const blob = new Blob([certificateText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${courseId}_${userId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareCertificate = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LearnQuest Certificate - ${courseId}`,
          text: `I completed the ${courseId} course with a score of ${result.finalScore}%!`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `I completed the ${courseId} course with a score of ${result.finalScore}%!`
      );
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-dark-text">Test Results</h1>
          <p className="text-dark-text-muted">Course: {courseId}</p>
          <p className="text-dark-text-muted">User: {userId}</p>
        </div>

        {/* Main Result Card */}
        <div className={`bg-dark-card border border-dark-border rounded-lg p-8 mb-8 border-2 ${borderColor}`}>
          <div className="text-center">
            <div className="mb-6">
              {isEligible ? (
                <CheckCircle className="h-24 w-24 text-success mx-auto mb-4" />
              ) : (
                <XCircle className="h-24 w-24 text-error mx-auto mb-4" />
              )}
            </div>

            <h2 className="text-3xl font-bold mb-4 text-dark-text">
              {isEligible ? 'Certificate Earned!' : 'Certificate Not Issued'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-surface border border-dark-border p-4 rounded">
                <div className="text-sm text-dark-text-muted mb-2">Final Score</div>
                <div className={`text-3xl font-bold ${scoreColor}`}>
                  {result.finalScore.toFixed(1)}%
                </div>
              </div>

              <div className="bg-dark-surface border border-dark-border p-4 rounded">
                <div className="text-sm text-dark-text-muted mb-2">Behavior Score</div>
                <div className="text-3xl font-bold text-blue-accent">
                  {result.behaviorScore.toFixed(1)}%
                </div>
              </div>

              <div className="bg-dark-surface border border-dark-border p-4 rounded">
                <div className="text-sm text-dark-text-muted mb-2">Test Score</div>
                <div className="text-3xl font-bold text-blue-light">
                  {result.testScore.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${
                isEligible 
                  ? 'bg-success text-white' 
                  : 'bg-error text-white'
              }`}>
                {result.certificateStatus.toUpperCase()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {isEligible && (
                <>
                  <button
                    onClick={downloadCertificate}
                    disabled={isDownloading}
                    className="bg-blue-primary hover:bg-blue-secondary disabled:bg-dark-surface px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 text-white disabled:text-dark-text-secondary"
                  >
                    <Download className="h-5 w-5" />
                    <span>{isDownloading ? 'Downloading...' : 'Download Certificate'}</span>
                  </button>

                  <button
                    onClick={shareCertificate}
                    className="bg-success hover:bg-success/80 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 text-white"
                  >
                    <Share className="h-5 w-5" />
                    <span>Share</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="bg-dark-surface hover:bg-dark-border px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 text-dark-text border border-dark-border"
              >
                <Eye className="h-5 w-5" />
                <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Report */}
        {showDetails && (
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-dark-text">Detailed Report</h3>
            
            {/* Violations Summary */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-dark-text">Violations Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-dark-surface border border-dark-border p-3 rounded text-center">
                  <div className="text-2xl font-bold text-error">
                    {result.violations.filter(v => v.type === 'face_absent').length}
                  </div>
                  <div className="text-sm text-dark-text-muted">Face Absent</div>
                </div>
                <div className="bg-dark-surface border border-dark-border p-3 rounded text-center">
                  <div className="text-2xl font-bold text-error">
                    {result.violations.filter(v => v.type === 'multiple_faces').length}
                  </div>
                  <div className="text-sm text-dark-text-muted">Multiple Faces</div>
                </div>
                <div className="bg-dark-surface border border-dark-border p-3 rounded text-center">
                  <div className="text-2xl font-bold text-warning">
                    {result.violations.filter(v => v.type === 'noise_detected').length}
                  </div>
                  <div className="text-sm text-dark-text-muted">Noise Detected</div>
                </div>
                <div className="bg-dark-surface border border-dark-border p-3 rounded text-center">
                  <div className="text-2xl font-bold text-warning">
                    {result.violations.filter(v => v.type === 'tab_switch').length}
                  </div>
                  <div className="text-sm text-dark-text-muted">Tab Switches</div>
                </div>
              </div>
            </div>

            {/* Violations Timeline */}
            {result.violations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-dark-text">Violations Timeline</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.violations.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between bg-dark-surface border border-dark-border p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="font-medium text-dark-text">{violation.type.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-sm text-dark-text-muted">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        violation.severity === 'critical' ? 'bg-red-600' :
                        violation.severity === 'high' ? 'bg-orange-600' :
                        violation.severity === 'medium' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {violation.severity.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            <div>
              <h4 className="text-lg font-semibold mb-3 text-dark-text">Score Breakdown</h4>
              <div className="bg-dark-surface border border-dark-border p-4 rounded">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-dark-text">Behavior Score (40%):</span>
                    <span className="text-blue-accent">{result.behaviorScore.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-text">Test Score (60%):</span>
                    <span className="text-blue-light">{result.testScore.toFixed(1)}%</span>
                  </div>
                  <div className="border-t border-dark-border pt-2 flex justify-between font-bold">
                    <span className="text-dark-text">Final Score:</span>
                    <span className={scoreColor}>{result.finalScore.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retake Test Button */}
        <div className="text-center">
          <button
            onClick={onRetakeTest}
            className="bg-blue-primary hover:bg-blue-secondary px-8 py-3 rounded-lg font-semibold"
          >
            Retake Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;
