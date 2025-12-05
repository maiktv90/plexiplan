/**
 * Atlassian Document Format (ADF) Renderer
 *
 * Renders Jira's rich text format (ADF) as React components.
 * ADF is a JSON structure used by Jira for issue descriptions and comments.
 *
 * @see https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/
 */
import React from 'react';

interface ADFMark {
  type: 'strong' | 'em' | 'underline' | 'strike' | 'code' | 'link' | 'textColor';
  attrs?: {
    href?: string;
    color?: string;
  };
}

interface ADFNode {
  type: string;
  content?: ADFNode[];
  text?: string;
  marks?: ADFMark[];
  attrs?: Record<string, unknown>;
}

interface ADFDocument {
  type: 'doc';
  version: number;
  content: ADFNode[];
}

/**
 * Check if the input is an ADF document
 */
export function isADFDocument(value: unknown): value is ADFDocument {
  if (typeof value === 'object' && value !== null) {
    const doc = value as Record<string, unknown>;
    return doc.type === 'doc' && Array.isArray(doc.content);
  }
  return false;
}

/**
 * Check if a comma at position i is a field separator or part of text content.
 * A field separator comma is followed by: whitespace* + word + =
 * e.g., ", type=" is a separator, ", dass " is text content
 */
function isFieldSeparatorComma(input: string, commaPos: number): boolean {
  let j = commaPos + 1;

  // Skip whitespace after comma
  while (j < input.length && /\s/.test(input[j])) {
    j++;
  }

  // Check if followed by word + equals
  // Read potential field name
  let fieldName = '';
  while (j < input.length && /[a-zA-Z_]/.test(input[j])) {
    fieldName += input[j];
    j++;
  }

  // If we have a field name and it's followed by =, this is a separator
  if (fieldName.length > 0 && j < input.length && input[j] === '=') {
    return true;
  }

  // Also check for }, ] which indicate end of object/array
  // Skip whitespace
  let k = commaPos + 1;
  while (k < input.length && /\s/.test(input[k])) {
    k++;
  }
  if (k < input.length && (input[k] === '}' || input[k] === ']' || input[k] === '{' || input[k] === '[')) {
    return true;
  }

  return false;
}

/**
 * Tokenizer for Java toString format
 * Breaks input into tokens: LBRACE, RBRACE, LBRACKET, RBRACKET, EQUALS, COMMA, STRING, NUMBER
 *
 * Key insight: commas in text values (like "Will ich, dass") are NOT field separators.
 * A real field separator comma is followed by: fieldName=
 */
function tokenizeJavaToString(input: string): Array<{ type: string; value: string }> {
  const tokens: Array<{ type: string; value: string }> = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === '{') {
      tokens.push({ type: 'LBRACE', value: '{' });
      i++;
    } else if (char === '}') {
      tokens.push({ type: 'RBRACE', value: '}' });
      i++;
    } else if (char === '[') {
      tokens.push({ type: 'LBRACKET', value: '[' });
      i++;
    } else if (char === ']') {
      tokens.push({ type: 'RBRACKET', value: ']' });
      i++;
    } else if (char === '=') {
      tokens.push({ type: 'EQUALS', value: '=' });
      i++;
    } else if (char === ',') {
      // Check if this comma is a field separator or part of text
      if (isFieldSeparatorComma(input, i)) {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
      } else {
        // This comma is part of text content - read as part of value
        // We need to backtrack and include this in the previous string token
        // Or start a new string that includes the comma
        // Actually, we'll handle this in the value reading below
        // For now, skip and let it be part of the next value read
        i++;
        // Continue reading as text including this comma
        let value = ',';
        while (i < input.length) {
          const c = input[i];
          if (c === '{' || c === '}' || c === '[' || c === ']' || c === '=') {
            break;
          }
          if (c === ',' && isFieldSeparatorComma(input, i)) {
            break;
          }
          value += c;
          i++;
        }
        value = value.trim();
        if (value) {
          // Append to previous token if it was a STRING
          const lastToken = tokens[tokens.length - 1];
          if (lastToken && lastToken.type === 'STRING') {
            lastToken.value += ' ' + value.replace(/^,\s*/, '');
          } else {
            tokens.push({ type: 'STRING', value: value.replace(/^,\s*/, '') });
          }
        }
      }
    } else if (/\s/.test(char)) {
      // Skip whitespace between tokens
      i++;
    } else {
      // Read a value (could be key or string value)
      let value = '';
      // Read until we hit a structural delimiter or a field-separator comma
      while (i < input.length) {
        const c = input[i];
        if (c === '{' || c === '}' || c === '[' || c === ']' || c === '=') {
          break;
        }
        if (c === ',' && isFieldSeparatorComma(input, i)) {
          break;
        }
        value += c;
        i++;
      }
      value = value.trim();
      if (value) {
        // Check if it's a number
        if (/^-?\d+(\.\d+)?$/.test(value)) {
          tokens.push({ type: 'NUMBER', value });
        } else {
          tokens.push({ type: 'STRING', value });
        }
      }
    }
  }

  return tokens;
}

/**
 * Convert tokens to JSON string
 */
function tokensToJSON(tokens: Array<{ type: string; value: string }>): string {
  let result = '';
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'LBRACE') {
      result += '{';
      i++;
    } else if (token.type === 'RBRACE') {
      // Remove trailing comma before closing brace if present
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += '}';
      i++;
    } else if (token.type === 'LBRACKET') {
      result += '[';
      i++;
    } else if (token.type === 'RBRACKET') {
      // Remove trailing comma before closing bracket if present
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += ']';
      i++;
    } else if (token.type === 'COMMA') {
      // Only add comma if the next token is not a closing bracket/brace
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type !== 'RBRACE' && nextToken.type !== 'RBRACKET') {
        result += ',';
      }
      i++;
    } else if (token.type === 'STRING' || token.type === 'NUMBER') {
      // Check if next token is EQUALS (this is a key)
      if (i + 1 < tokens.length && tokens[i + 1].type === 'EQUALS') {
        // This is a key
        const escaped = token.value
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"');
        result += `"${escaped}":`;
        i += 2; // Skip the key and equals
      } else {
        // This is a value
        if (token.type === 'NUMBER') {
          result += token.value;
        } else if (token.value === 'true' || token.value === 'false' || token.value === 'null') {
          result += token.value;
        } else {
          // Escape special characters in string values
          const escaped = token.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          result += `"${escaped}"`;
        }
        i++;
      }
    } else {
      i++;
    }
  }

  return result;
}

/**
 * Convert Java-style toString format to JSON
 * Handles format like: {type=doc, version=1, content=[...]}
 * Converts to: {"type":"doc", "version":1, "content":[...]}
 */
function javaToStringToJSON(input: string): string {
  const tokens = tokenizeJavaToString(input);
  return tokensToJSON(tokens);
}

/**
 * Try to parse a string as ADF document
 * Handles both JSON format and Java toString() format
 */
export function parseADF(input: string | object | undefined): ADFDocument | null {
  if (!input) return null;

  // If it's already an object, check if it's ADF
  if (typeof input === 'object') {
    if (isADFDocument(input)) {
      return input;
    }
    return null;
  }

  // Check if it looks like Java toString format FIRST (starts with {type=)
  // This is more common from Jira backend and avoids JSON.parse error
  if (input.includes('type=') && input.includes('content=')) {
    try {
      const jsonString = javaToStringToJSON(input);
      // Debug in development
      if (import.meta.env.DEV) {
        console.debug('ADF conversion - Full JSON:', jsonString);
        // Show context around position 409
        console.debug('ADF conversion - Around pos 400-420:', jsonString.substring(390, 430));
      }
      const parsed = JSON.parse(jsonString);
      if (isADFDocument(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Conversion failed, try JSON parse as fallback
      if (import.meta.env.DEV) {
        console.debug('ADF Java toString conversion failed:', e);
      }
    }
  }

  // Try to parse as JSON string
  try {
    const parsed = JSON.parse(input);
    if (isADFDocument(parsed)) {
      return parsed;
    }
  } catch {
    // Not valid JSON either
  }

  return null;
}

/**
 * Apply marks (formatting) to text
 */
function applyMarks(text: string, marks?: ADFMark[]): React.ReactNode {
  if (!marks || marks.length === 0) {
    return text;
  }

  let result: React.ReactNode = text;

  for (const mark of marks) {
    switch (mark.type) {
      case 'strong':
        result = <strong key={mark.type}>{result}</strong>;
        break;
      case 'em':
        result = <em key={mark.type}>{result}</em>;
        break;
      case 'underline':
        result = <u key={mark.type}>{result}</u>;
        break;
      case 'strike':
        result = <s key={mark.type}>{result}</s>;
        break;
      case 'code':
        result = (
          <code
            key={mark.type}
            className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono"
          >
            {result}
          </code>
        );
        break;
      case 'link':
        result = (
          <a
            key={mark.type}
            href={mark.attrs?.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {result}
          </a>
        );
        break;
      case 'textColor':
        result = (
          <span key={mark.type} style={{ color: mark.attrs?.color }}>
            {result}
          </span>
        );
        break;
    }
  }

  return result;
}

/**
 * Render inline content (text nodes) with proper spacing
 * Adds spaces between consecutive text nodes
 */
function renderInlineContent(content: ADFNode[] | undefined): React.ReactNode {
  if (!content) return null;

  return content.map((child, i) => {
    const rendered = renderNode(child, i);

    // Add space before this text node if:
    // - It's not the first node
    // - Previous node was a text node (not hardBreak, etc.)
    // - This is also a text node
    if (i > 0 && child.type === 'text' && content[i - 1]?.type === 'text') {
      return <React.Fragment key={i}> {rendered}</React.Fragment>;
    }

    return rendered;
  });
}

/**
 * Render a single ADF node
 */
function renderNode(node: ADFNode, index: number): React.ReactNode {
  switch (node.type) {
    case 'text':
      return <React.Fragment key={index}>{applyMarks(node.text || '', node.marks)}</React.Fragment>;

    case 'paragraph':
      return (
        <p key={index} className="mb-2 last:mb-0">
          {renderInlineContent(node.content)}
        </p>
      );

    case 'heading': {
      const level = (node.attrs?.level as number) || 1;
      const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      const sizeClasses: Record<number, string> = {
        1: 'text-xl font-bold',
        2: 'text-lg font-bold',
        3: 'text-base font-semibold',
        4: 'text-sm font-semibold',
        5: 'text-sm font-medium',
        6: 'text-xs font-medium',
      };
      return (
        <HeadingTag key={index} className={`${sizeClasses[level] || sizeClasses[3]} mb-2`}>
          {renderInlineContent(node.content)}
        </HeadingTag>
      );
    }

    case 'hardBreak':
      return <br key={index} />;

    case 'bulletList':
      return (
        <ul key={index} className="list-disc list-inside mb-2 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={index} className="list-decimal list-inside mb-2 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case 'listItem':
      return (
        <li key={index}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );

    case 'codeBlock':
      return (
        <pre
          key={index}
          className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto mb-2 text-sm font-mono"
        >
          <code>
            {node.content?.map((child, i) => renderNode(child, i))}
          </code>
        </pre>
      );

    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 mb-2"
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    case 'rule':
      return <hr key={index} className="my-4 border-gray-200 dark:border-gray-700" />;

    case 'mention':
      return (
        <span
          key={index}
          className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
        >
          @{(node.attrs?.text as string) || 'user'}
        </span>
      );

    case 'emoji':
      return (
        <span key={index} role="img" aria-label={node.attrs?.shortName as string}>
          {node.attrs?.text as string}
        </span>
      );

    case 'inlineCard':
    case 'blockCard':
      return (
        <a
          key={index}
          href={node.attrs?.url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {(node.attrs?.url as string) || 'Link'}
        </a>
      );

    case 'table':
      return (
        <div key={index} className="overflow-x-auto mb-2">
          <table className="min-w-full border border-gray-200 dark:border-gray-700">
            <tbody>
              {node.content?.map((child, i) => renderNode(child, i))}
            </tbody>
          </table>
        </div>
      );

    case 'tableRow':
      return (
        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
          {node.content?.map((child, i) => renderNode(child, i))}
        </tr>
      );

    case 'tableHeader':
      return (
        <th
          key={index}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-left font-semibold border-r border-gray-200 dark:border-gray-700 last:border-r-0"
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </th>
      );

    case 'tableCell':
      return (
        <td
          key={index}
          className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </td>
      );

    case 'panel': {
      const panelType = (node.attrs?.panelType as string) || 'info';
      const panelStyles: Record<string, string> = {
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        note: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      };
      return (
        <div
          key={index}
          className={`p-3 border rounded-md mb-2 ${panelStyles[panelType] || panelStyles.info}`}
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </div>
      );
    }

    default:
      // For unknown node types, try to render content if available
      if (node.content) {
        return (
          <React.Fragment key={index}>
            {node.content.map((child, i) => renderNode(child, i))}
          </React.Fragment>
        );
      }
      return null;
  }
}

/**
 * Render an ADF document to React components
 */
export function renderADF(doc: ADFDocument): React.ReactNode {
  return (
    <div className="adf-content">
      {doc.content.map((node, index) => renderNode(node, index))}
    </div>
  );
}

/**
 * Component to render ADF or plain text description
 */
interface DescriptionRendererProps {
  description: string | object | undefined;
  className?: string;
}

export const DescriptionRenderer: React.FC<DescriptionRendererProps> = ({
  description,
  className = '',
}) => {
  if (!description) return null;

  // Check if it's ADF format
  const adfDoc = parseADF(description);

  if (adfDoc) {
    return <div className={className}>{renderADF(adfDoc)}</div>;
  }

  // Plain text fallback
  if (typeof description === 'string') {
    return (
      <p className={`whitespace-pre-wrap ${className}`}>
        {description}
      </p>
    );
  }

  // Unknown object format - stringify it
  return (
    <p className={`whitespace-pre-wrap text-gray-500 ${className}`}>
      {JSON.stringify(description, null, 2)}
    </p>
  );
};
