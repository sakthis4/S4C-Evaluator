import React, { useState, useEffect, useRef } from 'react';

// Access global Prism object from CDN
declare const Prism: any;

interface CodeRunnerProps {
  code: string;
  onChange: (newCode: string) => void;
  language: 'javascript' | 'text';
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, onChange, language }) => {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightedCode, setHighlightedCode] = useState('');
  
  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Syntax Highlighting for Input
  useEffect(() => {
    if (language === 'javascript' && typeof Prism !== 'undefined') {
      // Highlight the code using Prism
      const html = Prism.highlight(code || '', Prism.languages.javascript, 'javascript');
      setHighlightedCode(html);
    } else {
      // Fallback if not JS or Prism missing
      setHighlightedCode(code.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  }, [code, language]);

  // Sync scroll between textarea and pre
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const runCode = () => {
    setOutput(null);
    setError(null);

    if (language !== 'javascript') return;

    const logs: string[] = [];
    const originalConsoleLog = console.log;

    // Intercept console.log
    console.log = (...args: any[]) => {
      logs.push(args.map(a => {
        if (typeof a === 'object') return JSON.stringify(a, null, 2);
        return String(a);
      }).join(' '));
    };

    try {
      // Execute unsafe code safely in a minimal scope
      // eslint-disable-next-line no-new-func
      const run = new Function(code);
      const result = run();
      
      if (result !== undefined) {
        if (typeof result === 'object') {
            logs.push(`> Return Value:\n${JSON.stringify(result, null, 2)}`);
        } else {
            logs.push(`> Return Value: ${String(result)}`);
        }
      }
      
      if (logs.length === 0) {
        logs.push("// Code executed successfully (No output).\n// Use console.log() to see results.");
      }
      
      setOutput(logs.join('\n'));
    } catch (e: any) {
      setError(e.toString());
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  };

  // Helper to highlight output logs (basic JSON highlighting)
  const getHighlightedOutput = (text: string) => {
    if (typeof Prism !== 'undefined') {
       // Simple heuristic: if it starts with { or [, treat as JSON for highlighting
       // otherwise treat as JS (comments etc)
       const grammar = (text.trim().startsWith('{') || text.trim().startsWith('[')) 
          ? Prism.languages.json 
          : Prism.languages.javascript;
          
       return Prism.highlight(text, grammar, 'javascript');
    }
    return text;
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-[#2d2d2d] text-white shadow-sm flex flex-col h-[500px]">
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-[#1f1f1f] px-4 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="ml-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                {language === 'javascript' ? 'main.js' : 'editor'}
            </span>
        </div>
        {language === 'javascript' && (
          <button
            onClick={runCode}
            type="button"
            className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            RUN
          </button>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Editor Area */}
        <div className={`flex-1 relative group ${output || error ? 'md:border-r border-gray-700' : ''} min-h-[250px]`}>
          
          {/* Syntax Highlight Layer (Background) */}
          <pre 
            ref={preRef}
            className="absolute inset-0 m-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words pointer-events-none overflow-hidden"
            style={{ fontFamily: '"Fira Code", "Consolas", monospace' }}
            aria-hidden="true"
          >
            <code 
              className="language-javascript"
              dangerouslySetInnerHTML={{ __html: highlightedCode + '<br/>' }} 
            />
          </pre>

          {/* Input Layer (Foreground) - Transparent Text, White Caret */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-6 bg-transparent text-transparent caret-white resize-none focus:outline-none overflow-auto"
            style={{ fontFamily: '"Fira Code", "Consolas", monospace' }}
            placeholder={language === 'javascript' ? "// Write your solution here..." : "Type your answer..."}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
          />
        </div>
        
        {/* Output Console */}
        {(output !== null || error !== null) && (
          <div className="w-full md:w-2/5 bg-[#1e1e1e] flex flex-col min-h-[150px] border-t md:border-t-0 border-gray-700">
            <div className="bg-[#252526] px-3 py-1 text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-700 flex justify-between items-center shrink-0">
                <span>Console Output</span>
                <button onClick={() => {setOutput(null); setError(null);}} className="hover:text-white">&times;</button>
            </div>
            
            <div className="flex-1 p-3 overflow-auto font-mono text-xs">
                {error ? (
                  <div className="text-red-400 whitespace-pre-wrap font-bold">
                    <span className="block mb-1 text-red-500">⚠ Runtime Error:</span>
                    {error}
                  </div>
                ) : (
                  <pre 
                    className="whitespace-pre-wrap text-gray-300"
                    dangerouslySetInnerHTML={{ 
                        __html: output ? getHighlightedOutput(output) : '' 
                    }} 
                  />
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;