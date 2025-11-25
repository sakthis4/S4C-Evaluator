import React, { useState } from 'react';

interface CodeRunnerProps {
  code: string;
  onChange: (newCode: string) => void;
  language: 'javascript' | 'text';
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, onChange, language }) => {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCode = () => {
    setOutput(null);
    setError(null);

    if (language !== 'javascript') return;

    const logs: string[] = [];
    const originalConsoleLog = console.log;

    // Intercept console.log
    console.log = (...args: any[]) => {
      logs.push(args.map(a => {
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
      }).join(' '));
    };

    try {
      // Execute unsafe code safely in a minimal scope
      // eslint-disable-next-line no-new-func
      const run = new Function(code);
      const result = run();
      
      if (result !== undefined) {
        logs.push(`> Return Value: ${String(result)}`);
      }
      
      if (logs.length === 0) {
        logs.push("Code executed successfully (No output). Use console.log() to see results.");
      }
      
      setOutput(logs.join('\n'));
    } catch (e: any) {
      setError(e.toString());
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-gray-900 text-white">
      <div className="flex justify-between items-center bg-gray-800 px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-mono text-gray-300 uppercase">{language === 'javascript' ? 'JavaScript Runtime' : 'Code Editor'}</span>
        {language === 'javascript' && (
          <button
            onClick={runCode}
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Run Code
          </button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row">
        <div className={`flex-1 ${output || error ? 'md:border-r border-gray-700' : ''}`}>
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-48 md:h-64 p-3 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none resize-y"
            placeholder="// Write your code here..."
            spellCheck={false}
          />
        </div>
        
        {/* Output Console */}
        {(output !== null || error !== null) && (
          <div className="w-full md:w-1/3 bg-black p-3 font-mono text-xs overflow-y-auto max-h-64 border-t md:border-t-0 border-gray-700">
            <div className="text-gray-500 mb-2 uppercase tracking-wide text-[10px]">Console Output</div>
            {error ? (
              <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
            ) : (
              <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;