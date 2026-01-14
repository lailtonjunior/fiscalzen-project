'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@fiscalzen/ui';
import { Copy, Check, Code } from 'lucide-react';

interface XmlViewerProps {
  xml?: string;
  title?: string;
}

function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';

  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) {
      indent += tab;
    }
  });

  return formatted.substring(1, formatted.length - 2);
}

function highlightXml(xml: string): string {
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /(&lt;\/?)([a-zA-Z0-9:_-]+)/g,
      '$1<span class="text-blue-600">$2</span>'
    )
    .replace(
      /([a-zA-Z0-9:_-]+)=(&quot;|")/g,
      '<span class="text-purple-600">$1</span>=<span class="text-green-600">"'
    )
    .replace(/(&quot;|")(?=\s|&gt;|\/&gt;)/g, '"</span>');
}

export function XmlViewer({ xml, title = 'XML' }: XmlViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!xml) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">XML nao disponivel</p>
        </CardContent>
      </Card>
    );
  }

  const formattedXml = formatXml(xml);
  const highlightedXml = highlightXml(formattedXml);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          {title}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto rounded-lg bg-gray-900 p-4">
          <pre
            className="text-sm text-gray-100"
            dangerouslySetInnerHTML={{ __html: highlightedXml }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
